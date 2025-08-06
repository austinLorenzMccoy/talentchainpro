# TalentChain Pro - Smart Contracts

This directory contains the smart contracts for TalentChain Pro, a blockchain-based talent ecosystem built on Hedera Hashgraph.

## 🏗️ Architecture

### Core Contracts

- **SkillToken.sol / SkillTokenEnhanced.sol** - Soulbound ERC-721 tokens representing verifiable skills
- **TalentPool.sol / TalentPoolEnhanced.sol** - Staking pools for job matching with platform fee management

## 🚀 Quick Start

### Prerequisites

- Node.js v18.0.0 or higher
- npm or yarn package manager
- Hedera testnet account with HBAR balance
- Git for version control

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp ../.env.example ../.env
   # Edit .env with your Hedera account details
   ```

3. **Compile contracts**
   ```bash
   npm run compile
   ```

4. **Run project setup validation**
   ```bash
   npm run setup
   ```

## 📋 Available Scripts

### Development Commands

```bash
# Compile smart contracts
npm run compile

# Run tests
npm run test

# Clean build artifacts
npm run clean

# Check contract sizes
npm run size

# Generate gas usage report
npm run gas-report

# Run security linting
npm run lint
npm run lint:fix
```

### Deployment Commands

```bash
# Deploy to testnet (default)
npm run deploy

# Deploy to specific networks
npm run deploy:testnet
npm run deploy:mainnet
npm run deploy:previewnet

# Verify deployed contracts
npm run verify

# Validate project setup
npm run setup
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root with:

```env
# Hedera Network Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY

# Contract addresses (auto-populated after deployment)
CONTRACT_SKILLTOKEN=
CONTRACT_TALENTPOOL=

# Optional: API Keys for additional services
GROQ_API_KEY=your_groq_key
```

### Network Configuration

The project supports multiple Hedera networks:

- **Testnet** (default): For development and testing
- **Mainnet**: For production deployment
- **Previewnet**: For preview features

## 📦 Deployment Process

### Step 1: Prepare Environment

1. Get a Hedera account from [portal.hedera.com](https://portal.hedera.com/)
2. Fund your account with testnet HBAR
3. Update `.env` with your account details

### Step 2: Validate Setup

```bash
npm run setup
```

This will:
- Validate your Hedera connection
- Check project structure
- Verify contract compilation
- Create missing environment files

### Step 3: Deploy Contracts

```bash
npm run deploy
```

The deployment script will:
- Deploy SkillToken contract
- Deploy TalentPool contract
- Configure initial permissions
- Update environment files with contract addresses
- Save deployment info to `deployments/{network}.json`

### Step 4: Verify Deployment

```bash
npm run verify
```

This will:
- Test contract functionality
- Verify contract state
- Display HashScan explorer links
- Generate verification report

## 🏅 SkillToken Contract

### Features

- **Soulbound**: Non-transferable ERC-721 tokens
- **Oracle-Controlled**: Metadata updates via authorized oracles
- **HIP-412 Compliance**: Hedera metadata standards
- **Access Control**: Role-based permissions

### Key Functions

```solidity
// Mint new skill token
function mint(address to, string memory tokenURI) external

// Update skill metadata (oracle only)
function updateTokenURI(uint256 tokenId, string memory newURI) external

// Get token metadata
function tokenURI(uint256 tokenId) external view returns (string memory)
```

## 🏊 TalentPool Contract

### Features

- **Job Pool Creation**: Companies create HBAR-staked pools
- **Candidate Matching**: Skill-based pool joining
- **Fee Management**: Platform fee collection
- **Match Making**: Automated candidate-job matching

### Key Functions

```solidity
// Create new job pool
function createPool(
    string memory description,
    uint256[] memory requiredSkills,
    uint256 salary
) external payable

// Join pool as candidate
function joinPool(uint256 poolId, uint256[] memory skillTokens) external

// Make a match (admin only)
function makeMatch(uint256 poolId, address candidate) external
```

## 🔍 Testing

### Run Test Suite

```bash
npm run test
```

### Test Coverage

```bash
npm run coverage
```

### Gas Usage Analysis

```bash
npm run gas-report
```

## 📊 Deployment Tracking

Deployment information is automatically saved to:

- `deployments/{network}.json` - Detailed deployment data
- Environment files are updated with contract addresses
- Transaction IDs and explorer links are logged

### Sample Deployment Output

```json
{
  "network": "testnet",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "operator": "0.0.1234567",
  "contracts": {
    "skillToken": {
      "contractId": "0.0.2345678",
      "transactionId": "0.0.1234567@1705321800.123456789",
      "explorerUrl": "https://hashscan.io/testnet/contract/0.0.2345678"
    },
    "talentPool": {
      "contractId": "0.0.2345679",
      "transactionId": "0.0.1234567@1705321815.987654321",
      "explorerUrl": "https://hashscan.io/testnet/contract/0.0.2345679"
    }
  }
}
```

## 🛡️ Security

### Security Features

- **Access Control**: Role-based permissions using OpenZeppelin
- **Reentrancy Protection**: Guards on all external calls
- **Pause Mechanism**: Emergency stop functionality
- **Input Validation**: Comprehensive parameter checking

### Security Best Practices

- All contracts use OpenZeppelin security libraries
- Extensive test coverage for edge cases
- Gas optimization without compromising security
- Regular security audits recommended

## 🔧 Advanced Configuration

### Hardhat Configuration

The `hardhat.config.js` includes:
- Hedera network definitions
- Gas optimization settings
- Contract size monitoring
- Test configuration

### Custom Hedera Settings

```javascript
hedera: {
  network: "testnet",
  accountId: process.env.HEDERA_ACCOUNT_ID,
  privateKey: process.env.HEDERA_PRIVATE_KEY,
  maxTransactionFee: "20", // HBAR
  maxQueryPayment: "1",   // HBAR
}
```

## 🔗 Integration

### Backend Integration

Contract addresses are automatically updated in:
- Root `.env` file
- `backend/.env` file (if exists)
- `frontend/.env.local` file (if exists)

### Frontend Integration

Use the deployed contract addresses in your frontend:

```javascript
const SKILL_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_SKILLTOKEN;
const TALENT_POOL_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_TALENTPOOL;
```

## 📚 Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera SDK for JavaScript](https://github.com/hashgraph/hedera-sdk-js)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🐛 Troubleshooting

### Common Issues

#### "Insufficient Account Balance"
- **Solution**: Fund your Hedera account with more HBAR
- **Get testnet HBAR**: [portal.hedera.com](https://portal.hedera.com/)

#### "Contract artifact not found"
- **Solution**: Run `npm run compile` to compile contracts
- **Check**: Ensure contract files exist in the correct location

#### "Connection failed"
- **Solution**: Verify your `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY`
- **Check**: Ensure you're using the correct network (testnet/mainnet)

#### "Deployment failed"
- **Solution**: Check gas limits and transaction fees
- **Verify**: Account has sufficient HBAR balance
- **Try**: Increase gas limit in deployment script

### Debug Mode

Enable debug logging:
```bash
DEBUG=true npm run deploy
```

### Support

- Check existing [GitHub Issues](https://github.com/talentchainpro/talentchainpro/issues)
- Review [Hedera Discord](https://discord.gg/hedera)
- Read project documentation in `../docs/`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Happy Building! 🚀**

*Building the future of work, one smart contract at a time.*