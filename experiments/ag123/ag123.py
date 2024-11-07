import asyncio
from ape import chain, accounts
from ape.api import BlockAPI
from ape.types import ContractLog
from ape_tokens import tokens  # Ignore import warnings
from taskiq import Context, TaskiqDepends, TaskiqState

from silverback import SilverbackBot, CircuitBreaker

# Initialize the bot
bot = SilverbackBot(name="AG123")

# Define important tokens and financial contracts
USDC = tokens["USDC"]
DAI = tokens["DAI"]
ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"  # Common ETH address format in DeFi


# Define bot startup tasks
@bot.on_startup()
def startup_tasks(startup_state):
    bot.state.balance_alert_count = 0
    bot.state.price_alert_count = 0
    return {"last_block": startup_state.last_block_seen}


# Define a simple monitoring job that triggers on every new block
@bot.on_(chain.blocks)
def monitor_block(block: BlockAPI, context: Context):
    # Check the bot's main wallet balance and alert if low
    main_wallet = accounts["bot_wallet"]
    eth_balance = main_wallet.balance
    if eth_balance < 0.1 * 1e18:  # Alert if below 0.1 ETH
        bot.state.balance_alert_count += 1
        if bot.state.balance_alert_count >= 3:
            raise CircuitBreaker("Main wallet ETH balance critically low!")

    # Optional: Track USDC/DAI prices (stub example)
    # Example call to fetch external prices would go here
    return {"block_number": block.number, "eth_balance": eth_balance}


# Define an alert on large token transfers for specified tokens
@bot.on_(USDC.Transfer, start_block=10000000, new_block_timeout=30)
def alert_large_usdc_transfer(log: ContractLog):
    if log.amount > 1000 * 1e6:  # Trigger alert for transfers > 1000 USDC
        bot.state.price_alert_count += 1
        print(f"🚨 Large USDC Transfer Detected! Amount: {log.amount / 1e6} USDC")
    return {"amount": log.amount}


# Define an alert when there's a large DAI transfer
@bot.on_(DAI.Transfer, start_block=10000000, new_block_timeout=30)
def alert_large_dai_transfer(log: ContractLog):
    if log.amount > 1000 * 1e18:  # Trigger alert for transfers > 1000 DAI
        print(f"🚨 Large DAI Transfer Detected! Amount: {log.amount / 1e18} DAI")
    return {"amount": log.amount}


# Monitor specific contract approvals (could be useful for DeFi interactions)
@bot.on_(DAI.Approval)
async def monitor_dai_approvals(log: ContractLog):
    # Notify if a user grants a high allowance to a contract
    if log.value > 5000 * 1e18:  # If allowance is above 5000 DAI
        print(f"🚨 Large DAI Approval Detected: {log.value / 1e18} DAI")
    await asyncio.sleep(1)  # Simulate a delay if necessary
    return {"approval_amount": log.value}


# Define shutdown tasks to clean up resources
@bot.on_shutdown()
def cleanup():
    print("🔻 Bot AG123 is shutting down. Summary of alerts:")
    print(f"Balance Alerts: {bot.state.balance_alert_count}")
    print(f"Price Alerts: {bot.state.price_alert_count}")
    return {"shutdown_status": "completed"}