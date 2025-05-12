# MEE Demo

This project demonstrates the Biconomy Modular Execution Environment (MEE) by executing a supertransaction that interacts with the AAVE protocol on the **Base** network.

DEMO: https://www.loom.com/share/d457ea4bc784433d9d83311b299eb241

## Overview

The demo executes the following transactions in a single supertransaction:

1. Transfers USDC from an EOA to a Nexus Smart Account
2. Supplies USDC to the AAVE pool
3. Transfers received aUSDC back to the EOA

## Setup

1. Clone the repository:

```bash
git clone https://github.com/alexcambose/MEE.git
cd MEE
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

For example:

```env
EOA_PRIVATE_KEY=0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
RPC_URL=http://localhost:8545
MEE_CLIENT_URL=http://localhost:3000/v3
MEE_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
FORK_URL=https://base-mainnet.infura.io/v3/3d34edbc36a84d62b747b3a972977ada
```

## Running the Script

1. Start the local blockchain and MEE node:

```bash
npm run up
```

This script will:

- Start Anvil with a fork of Base mainnet
- Launch the MEE node using Docker Compose
- Display the Anvil logs

> Note if you have permission issues, please run `chmod +x start.sh`.

2. Run the script:

```bash
npm start
```

## Project Structure

```
.
├── src/
│   ├── client.ts      # Viem client configuration
│   ├── constants.ts   # Environment variables and contract addresses
│   ├── main.ts        # Main demo script
│   ├── types.ts       # TypeScript type definitions
│   └── utils.ts       # Utility functions
├── .env.example
├── docker-compose.yml
├── package.json
└── start.sh          # Startup script
```

## How It Works

1. **Local Blockchain Setup**

   - Uses Anvil to fork **Base** mainnet
   - Provides access to all deployed contracts including AAVE Pool

2. **MEE Node Setup**

   - Runs a local MEE node using Docker
   - Handles transaction execution and cross-chain operations

3. **Test Account Setup**

   - Creates a test EOA with USDC
   - Uses Anvil's impersonation feature/rpc calls to fund the account from an address with funds

4. **Supertransaction Execution**
   - Initializes the Biconomy SDK
   - Creates a sequence of transactions:
     1. USDC transfer to Nexus
     2. USDC supply to AAVE
     3. aUSDC transfer back to EOA
   - Executes all operations in a single supertransaction
