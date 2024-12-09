

# 🚀 Solana Whirlpools Swap Bot

## Quick Start

### Prerequisites
- Node.js
- npm
- Solana CLI
- Whispool-sdk
- Web3.js
- Anchor

### Installation
```bash
git clone https://github.com/kitbodee4/solana-whirlpools-swap-bot.git
cd solana-whirlpools-swap-bot
```
### Installs nvm (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
```
### Download and install Node.js (you may need to restart the terminal)
```bash
nvm install 23
```
### Verifies the right Node.js version is in the environment
```bash
node -v # should print `v23.3.0`
```
```bash
npm init -y
```
```bash
npm install typescript @orca-so/whirlpools @solana/web3.js@latest @solana/spl-token @orca-so/whirlpools-sdk  @orca-so/common-sdk   bs58 decimal.js @coral-xyz/anchor@0.29.0 dotenv --legacy-peer-deps
```
```bash
npx tsc --init
```
Run the following command to install the Solana CLI:
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.4/install)"
solana --version
solana-keygen new --outfile ~/config/solana/id.json
```
```bash
npm install -g ts-node
ts-node -v
```
### Configuration
Create `nano .env` file:
```env
ANCHOR_PROVIDER_URL=https://eclipse.helius-rpc.com
ANCHOR_WALLET=~/.config/solana/id.json
MIN_AMOUNT=0.0001
MAX_AMOUNT=0.0002
TIMES=20
```

### Run
```bash
ts-node main.ts
```

## 🌟 Key Features
- 🔁 Automated Solana Whirlpools swaps
- 🎲 Randomized swap amounts
- ⚙️ Configurable transactions
- 📊 Detailed transaction logging

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANCHOR_PROVIDER_URL` | Solana RPC endpoint | Required |
| `ANCHOR_WALLET` | Path to wallet JSON | Required |
| `MIN_AMOUNT` | Minimum swap amount | 0.0001 |
| `MAX_AMOUNT` | Maximum swap amount | 0.0002 |
| `TIMES` | Number of swap iterations | 20 |

## 🛡️ Security Best Practices
- Never share your wallet JSON file
- Use environment variables for sensitive data
- Verify transaction fees before execution

## 🩺 Troubleshooting
- Check RPC endpoint connectivity
- Verify wallet balance
- Ensure sufficient SOL for transaction fees
- Validate network configuration

## 📋 Requirements
- Solana CLI installed
- Valid Solana wallet
- Sufficient token balance

## 🚨 Disclaimer
**Warning**: Cryptocurrency trading involves significant financial risk. Use this bot responsibly and at your own risk.

## 📜 License
*MIT License*

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support
For issues or questions, please open a GitHub issue.
