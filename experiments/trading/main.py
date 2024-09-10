import click
import os
import pandas as pd
from typing import Annotated, Any, Dict, List, Tuple
from flask import Flask, request, jsonify
from flask_httpauth import HTTPBasicAuth
from werkzeug.security import generate_password_hash, check_password_hash
import asyncio

from ape import chain, Contract
from ape.api import BlockAPI
from ape.exceptions import ContractLogicError
from ape.types import ContractLog
from taskiq import Context, TaskiqDepends, TaskiqState

from silverback import SilverbackApp, SilverbackStartupState

# Environment variables
START_BLOCK = os.environ.get("START_BLOCK", None)
if START_BLOCK is not None:
    START_BLOCK = int(START_BLOCK)

GAS_LIQUIDATE = 150_000
MAX_FRACTION_GAS_LIMIT_DENOMINATOR = os.environ.get("MAX_FRACTION_GAS_LIMIT_DENOMINATOR", 6)
RECIPIENT_ADDRESS = os.environ.get("RECIPIENT_ADDRESS", None)
CONTRACT_ADDRESS_MARGV1_NFT_MANAGER = os.environ["CONTRACT_ADDRESS_MARGV1_NFT_MANAGER"]
CONTRACT_ADDRESS_MARGV1_POOL_EXAMPLE = os.environ["CONTRACT_ADDRESS_MARGV1_POOL_EXAMPLE"]
MARGIN_WALLET_ADDRESS = os.environ["MARGIN_WALLET_ADDRESS"]

app = SilverbackApp()
manager = Contract(CONTRACT_ADDRESS_MARGV1_NFT_MANAGER)
pool_example = Contract(CONTRACT_ADDRESS_MARGV1_POOL_EXAMPLE)
multicall3 = Contract("0xcA11bde05977b3631167028862bE2a173976CA11")

# Flask app for UI interactions
flask_app = Flask(__name__)
auth = HTTPBasicAuth()

# Users for basic auth
users = {
    "admin": generate_password_hash("password")
}

@auth.verify_password
def verify_password(username, password):
    if username in users and check_password_hash(users.get(username), password):
        return username

def _get_health_factor(position: Any) -> float:
    return (
        position.margin / position.safeMarginMinimum
        if position.safeMarginMinimum > 0
        else 0
    )

def _entries_to_data(entries: List[Tuple]) -> List[Dict]:
    data = []
    for token_id, position in entries:
        d = position.__dict__
        d.update({"tokenId": token_id, "healthFactor": _get_health_factor(position)})
        data.append(d)
    return data

def _has_position_in_db(token_id: int, context: Annotated[Context, TaskiqDepends()]) -> bool:
    return token_id in context.state.db.index

def _create_positions_in_db(entries: List[Tuple], context: Annotated[Context, TaskiqDepends()]):
    token_ids = [token_id for token_id, _ in entries]
    for token_id in token_ids:
        if token_id in context.state.db.index:
            raise Exception(f"tokenId {token_id} already exists in DB")

    data = _entries_to_data(entries)
    df = pd.DataFrame(data)
    df = df.set_index("tokenId")

    context.state.db = pd.concat([context.state.db, df])
    context.state.db.sort_values(by=["healthFactor"], inplace=True)
    click.echo(f"Created DB entries for tokenIds {token_ids}: {context.state.db}")

def _update_positions_in_db(entries: List[Tuple], context: Annotated[Context, TaskiqDepends()]):
    token_ids = [token_id for token_id, _ in entries]
    context.state.db.loc[token_ids]  # reverts with key error if not all exist

    data = _entries_to_data(entries)
    df = pd.DataFrame(data)
    df = df.set_index("tokenId")

    context.state.db.update(df)
    context.state.db.sort_values(by=["healthFactor"], inplace=True)
    click.echo(f"Updated DB entries for tokenIds {token_ids}: {context.state.db}")

def _delete_positions_from_db(entries: List[Tuple], context: Annotated[Context, TaskiqDepends()]):
    token_ids = [token_id for token_id, _ in entries]
    token_ids_to_keep = [
        token_id for token_id in context.state.db.index if token_id not in token_ids
    ]
    context.state.db = context.state.db.loc[token_ids_to_keep]
    click.echo(f"Deleted DB entries for tokenIds {token_ids}: {context.state.db}")

def _get_token_ids_in_db(context: Annotated[Context, TaskiqDepends()]) -> List[int]:
    return context.state.db.index.to_list()

def _get_liquidatable_position_records_from_db(min_rewards: int, max_records: int, context: Annotated[Context, TaskiqDepends()]) -> Dict:
    db_filtered = context.state.db[
        (~context.state.db["safe"]) & (context.state.db["rewards"] >= min_rewards)
    ].head(max_records)
    click.echo(
        f"Liquidatable positions > min rewards of {min_rewards} with max records of {max_records}: {db_filtered}"
    )
    return db_filtered.to_dict(orient="index")

@app.on_startup()
def app_startup(startup_state: SilverbackStartupState):
    if click.confirm("Enable autosign?"):
        app.signer.set_autosign(enabled=True)
    return {"message": "Starting...", "block_number": startup_state.last_block_seen}

@app.on_worker_startup()
def worker_startup(state: TaskiqState):
    state.block_count = 0
    state.db = pd.DataFrame()
    state.recipient = RECIPIENT_ADDRESS if RECIPIENT_ADDRESS is not None else app.signer.address
    state.signer_balance = app.signer.balance
    return {"message": "Worker started."}

async def liquidate_positions(block: BlockAPI, context: Annotated[Context, TaskiqDepends()]) -> List[int]:
    min_rewards = app.provider.base_fee * GAS_LIQUIDATE
    max_gas_limit = app.provider.max_gas // MAX_FRACTION_GAS_LIMIT_DENOMINATOR
    max_records = max_gas_limit // GAS_LIQUIDATE
    click.echo(f"Min rewards at block {block.number}: {min_rewards}")
    click.echo(f"Max records at block {block.number}: {max_records}")

    records = _get_liquidatable_position_records_from_db(
        min_rewards, max_records, context
    )
    token_ids = list(records.keys())
    click.echo(f"Liquidating positions with tokenIds: {token_ids}")
    if len(token_ids) == 0:
        return token_ids

    calldata = [
        (
            record["pool"],
            False,
            pool_example.liquidate.as_transaction(
                context.state.recipient, manager.address, int(record["positionId"])
            ).data,
        )
        for _, record in records.items()
    ]

    try:
        await multicall3.aggregate3.estimate_gas_cost(calldata, sender=app.signer)
        await multicall3.aggregate3(calldata, sender=app.signer)
    except ContractLogicError as err:
        click.secho(
            f"Contract logic error when estimating gas: {err}", blink=True, bold=True
        )
        token_ids = []

    return token_ids

@app.on_(chain.blocks, start_block=START_BLOCK)
async def exec_block(block: BlockAPI, context: Annotated[Context, TaskiqDepends()]):
    token_ids = _get_token_ids_in_db(context)

    if len(token_ids) == 0:
        click.echo(f"No positions in db at block {block.number} ...")
        context.state.signer_balance = app.signer.balance
        context.state.block_count += 1
        return len(block.transactions)

    click.echo(
        f"Fetching position updates at block {block.number} for tokenIds: {token_ids}"
    )

    positions = [await manager.positions(token_id) for token_id in token_ids]

    click.echo(f"Updating positions at block {block.number} for tokenIds ...")
    entries = list(zip(token_ids, positions))
    click.echo(f"Entries tokenIds fetched: {token_ids}")

    entries_liquidated = list(filter(lambda e: e[1].liquidated, entries))
    click.echo(
        f"Liquidated entries tokenIds to delete from DB: {[token_id for token_id, _ in entries_liquidated]}"
    )
    _delete_positions_from_db(entries_liquidated, context)

    entries_updated = list(filter(lambda e: (not e[1].liquidated), entries))
    click.echo(
        f"Synced entries tokenIds to update in DB: {[token_id for token_id, _ in entries_updated]}"
    )
    _update_positions_in_db(entries_updated, context)

    token_ids_liquidated = await liquidate_positions(block, context)

    entries_liquidated_by_bot = list(
        filter(lambda e: (e[0] in token_ids_liquidated), entries_updated)
    )
    click.echo(
        f"Liquidated by bot entries tokenIds to delete from DB: {[token_id for token_id, _ in entries_liquidated_by_bot]}"
    )
    _delete_positions_from_db(entries_liquidated_by_bot, context)

    context.state.signer_balance = app.signer.balance
    context.state.block_count += 1
    return len(block.transactions)

@app.on_(manager.Mint, start_block=START_BLOCK)
async def exec_manager_mint(log: ContractLog, context: Annotated[Context, TaskiqDepends()]):
    click.echo(
        f"Manager minted position with tokenId {log.tokenId} at block {log.block_number}."
    )
    position = None
    try:
        position = await manager.positions(log.tokenId)
        click.echo(f"Position currently has attributes: {position}")
        health_factor = _get_health_factor(position)
        click.echo(f"Position current health factor: {health_factor}")

        if not position.liquidated:
            click.echo(f"Adding position with tokenId {log.tokenId} to database ...")
            entries = [(log.tokenId, position)]
            if not _has_position_in_db(log.tokenId, context):
                _create_positions_in_db(entries, context)
            else:
                _update_positions_in_db(entries, context)
    except ContractLogicError as err:
        click.secho(
            f"Contract logic error when getting position: {err}", blink=True, bold=True
        )
    return {"token_id": log.tokenId, "position": position}

@app.on_worker_shutdown()
def worker_shutdown(state):
    return {
        "message": f"Worker stopped after handling {state.block_count} blocks.",
        "block_count": state.block_count,
    }

@app.on_shutdown()
def app_shutdown(state):
    return {"message": "Stopping..."}

@flask_app.route('/buy', methods=['POST'])
@auth.login_required
def buy():
    try:
        amount = request.json.get('amount')
        if not amount:
            return jsonify({"status": "error", "message": "Amount is required"}), 400
        # Implement buy logic here
        return jsonify({"status": "success", "message": f"Bought assets worth {amount}."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@flask_app.route('/sell', methods=['POST'])
@auth.login_required
def sell():
    try:
        amount = request.json.get('amount')
        if not amount:
            return jsonify({"status": "error", "message": "Amount is required"}), 400
        # Implement sell logic here
        return jsonify({"status": "success", "message": f"Sold assets worth {amount}."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@flask_app.route('/transfer_margins', methods=['POST'])
@auth.login_required
def transfer_margins():
    try:
        # Implement margin transfer logic here
        return jsonify({"status": "success", "message": "Transferred margins to another wallet."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', port=5000)
