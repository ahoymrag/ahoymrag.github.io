# Silverback SDK for ApeWorX

## Quick Start

### Ape SDK for the Silverback platform

A Platform for Web3 Bots that allows you to quickly and easily provision, monitor, and manage decentralized applications.

## Table of Contents

1. [Dependencies](#dependencies)
2. [Installation](#installation)
3. [Quick Usage](#quick-usage)
4. [Docker Usage](#docker-usage)
5. [Development](#development)
6. [Why Silverback?](#why-silverback)
7. [Features](#features)
8. [Roadmap](#roadmap)
9. [Support and Community](#support-and-community)

## Dependencies

- Python3 version 3.8 or greater
- python3-dev

## Installation

### via pip

Install the latest release via pip:

\```bash
pip install silverback
\```

### via setuptools

Clone the repository and use setuptools for the most up-to-date version:

\```bash
git clone https://github.com/SilverBackLtd/sdk.git silverback
cd silverback
python3 setup.py install
\```

## Quick Usage

Checkout the example to see how to use the library. Run your bot against a live network using:

\```bash
$ silverback run "example:app" --network :mainnet:alchemy
\```

## Docker Usage

\```bash
$ docker run --volume $PWD:/home/harambe/project --volume ~/.tokenlists:/home/harambe/.tokenlists apeworx/silverback:latest run "example:app" --network :mainnet:alchemy
\```

## Development

This project is in development and should be considered a beta. Things might not be in their final state and breaking changes may occur. Comments, questions, criticisms, and pull requests are welcomed.

## Why Silverback?

Silverback is designed to support high-value, full-stack decentralized applications. It provides a reliable and robust infrastructure that allows developers to focus on building products, automating tasks, and deploying bots that users want to see, without having to worry about the nitty-gritty details of infrastructure management.

## Features

### Reliable and Robust Infrastructure

Write a Silverback bot as simple as this:

\```python
from ape_tokens import tokens
from silverback import SilverBackApp

app = SilverBackApp()
USDC = tokens["USDC"]

@app.on_(USDC.Transfer)
def exec_event1(log):
    # Do something with `log.amount`
    ...
\```

### Safe and Secure Private Keys

Protect yourself with our extensible plugin architecture that provides a secure way to manage private keys:

\```python
from ape import chain, project
from silverback import SilverBackApp

app = SilverBackApp()

@app.on_(chain.blocks)
def exec_event1(block):
    # Your code here
    ...
\```

### Event- and Policy-Driven Risk Management

Silverback's risk management engine is designed to follow the guardrails you give it.

## Roadmap

We are still in the beginning stages, but our community can look forward to a feature-rich platform in the coming months. For a sneak peek, check out our SDK on GitHub.

## Support and Community

For the latest updates, follow us on [apeworx.io](https://apeworx.io), [Discord](https://discord.com/), [Twitter](https://twitter.com/ApeWorX), and [Bluesky](https://blueskyweb.org/).

