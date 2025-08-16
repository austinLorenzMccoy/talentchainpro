# 🚀 TalentChain Pro - Complete Setup Guide

This guide will walk you through setting up the complete TalentChain Pro system, including:
- Smart contract deployment
- Backend API setup
- Frontend configuration
- Full integration testing

## 📋 Prerequisites

### Required Software
- **Node.js** v20+ (for frontend and smart contracts)
- **Python** 3.10+ (for backend)
- **Git** (for version control)
- **Docker** (optional, for containerized deployment)

### Required Accounts
- **Hedera Testnet Account** with HBAR for gas fees
- **WalletConnect Project ID** (free from [cloud.walletconnect.com](https://cloud.walletconnect.com))
- **GROQ API Key** (optional, for AI features)

## 🏗️ System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Smart        │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   Contracts    │
│                 │    │                 │    │   (Hedera)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Wallet        │    │   Database      │    │   AI/MCP        │
│   Integration   │    │   (PostgreSQL/  │    │   Services      │
│   (HashPack,    │    │    SQLite)      │    │                 │
│    MetaMask)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Step-by-Step Setup

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone <repository-url>
cd talentchainpro

# Install dependencies for all components
npm install                    # Frontend dependencies
cd backend && pip install -r requirements.txt  # Backend dependencies
cd ../contracts && npm install # Smart contract dependencies
cd ..
```

### Step 2: Smart Contract Deployment

#### 2.1 Configure Hedera Network

```bash
cd contracts

# Create environment file
cp .env.example .env

# Edit .env with your Hedera credentials
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

#### 2.2 Deploy Smart Contracts

```bash
# Deploy to Hedera Testnet
npx hardhat run scripts/deploy.js --network testnet

# This will deploy:
# - SkillToken.sol
# - TalentPool.sol  
# - Governance.sol
# - ReputationOracle.sol
```

#### 2.3 Update Contract Addresses

After deployment, update the contract addresses in:
- `backend/contracts.json`
- `backend/.env`
- `frontend/.env.local`

### Step 3: Backend Setup

#### 3.1 Configure Environment

```bash
cd backend

# Create environment file
cp env.example .env

# Edit .env with your configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
CONTRACT_SKILL_TOKEN=0.0.XXXXXXX
CONTRACT_TALENT_POOL=0.0.XXXXXXX
CONTRACT_GOVERNANCE=0.0.XXXXXXX
CONTRACT_REPUTATION_ORACLE=0.0.XXXXXXX
GROQ_API_KEY=your_groq_api_key_here
```

#### 3.2 Database Setup

```bash
# Option 1: PostgreSQL (recommended for production)
# Install PostgreSQL and create database
createdb talentchainpro

# Option 2: SQLite (for development)
# No setup required - will auto-create database file
```

#### 3.3 Start Backend Server

```bash
# Start the FastAPI server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the provided script
python start_server.py
```

### Step 4: Frontend Setup

#### 4.1 Configure Environment

```bash
cd frontend

# Create environment file
cp env.example .env.local

# Edit .env.local with your configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SKILL_TOKEN_CONTRACT_ADDRESS=0.0.XXXXXXX
NEXT_PUBLIC_TALENT_POOL_CONTRACT_ADDRESS=0.0.XXXXXXX
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ADDRESS=0.0.XXXXXXX
NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT_ADDRESS=0.0.XXXXXXX
```

#### 4.2 Start Frontend Development Server

```bash
cd frontend
npm run dev

# Frontend will be available at http://localhost:3000
```

### Step 5: Integration Testing

#### 5.1 Run Backend Integration Tests

```bash
cd backend

# Run comprehensive integration tests
python test_integration.py

# This will test:
# - Configuration loading
# - Database connectivity
# - Hedera connection
# - Contract deployments
# - API endpoints
# - Frontend compatibility
```

#### 5.2 Manual Testing

1. **Frontend**: Navigate to http://localhost:3000
2. **Wallet Connection**: Test HashPack and MetaMask connections
3. **Dashboard**: Verify dashboard loads with wallet connection
4. **API Endpoints**: Check http://localhost:8000/docs for API documentation

## 🔍 Verification Checklist

### ✅ Smart Contracts
- [ ] All 4 contracts deployed to Hedera testnet
- [ ] Contract addresses updated in configuration files
- [ ] Contract ABIs loaded successfully

### ✅ Backend API
- [ ] FastAPI server running on port 8000
- [ ] All API endpoints responding (check /health)
- [ ] Database connection established
- [ ] Hedera client initialized
- [ ] Contract integration working

### ✅ Frontend
- [ ] Next.js server running on port 3000
- [ ] Wallet connections working (HashPack, MetaMask)
- [ ] Dashboard loading with wallet connection
- [ ] API calls to backend successful
- [ ] Contract interactions functional

### ✅ Integration
- [ ] Frontend can create skill tokens
- [ ] Frontend can view skill tokens
- [ ] Frontend can create job pools
- [ ] Frontend can apply to job pools
- [ ] All modals and dialogs working

## 🚨 Troubleshooting

### Common Issues

#### 1. Hedera Connection Failed
```bash
# Check your credentials
echo $HEDERA_ACCOUNT_ID
echo $HEDERA_PRIVATE_KEY

# Verify network configuration
# Testnet: https://testnet.hashio.io
# Mainnet: https://mainnet.hashio.io
```

#### 2. Contract Deployment Failed
```bash
# Check Hedera account balance
# Ensure sufficient HBAR for gas fees
# Verify network configuration in hardhat.config.js
```

#### 3. Backend API Not Responding
```bash
# Check if server is running
curl http://localhost:8000/health

# Check logs for errors
tail -f backend/logs/app.log

# Verify environment variables
python -c "from app.config import get_settings; print(get_settings())"
```

#### 4. Frontend Wallet Connection Issues
```bash
# Check WalletConnect Project ID
# Verify MetaMask is installed and unlocked
# Check browser console for errors
# Ensure correct network (Hedera testnet: chain ID 296)
```

#### 5. Database Connection Issues
```bash
# Check database service status
sudo systemctl status postgresql

# Verify connection string
# Test connection manually
psql -h localhost -U username -d talentchainpro
```

### Debug Commands

```bash
# Check backend status
cd backend
python -c "from app.utils.hedera import check_hedera_connection; import asyncio; print(asyncio.run(check_hedera_connection()))"

# Check contract status
python -c "from app.config import get_contract_config; print(get_contract_config())"

# Test frontend API
curl -X GET "http://localhost:8000/api/v1/skills" -H "accept: application/json"
```

## 📚 Additional Resources

### Documentation
- [Hedera Documentation](https://docs.hedera.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [WalletConnect Documentation](https://docs.walletconnect.com/)

### Support
- [Hedera Discord](https://discord.gg/hedera)
- [GitHub Issues](https://github.com/your-repo/issues)
- [Community Forum](https://forum.hedera.com/)

## 🎯 Next Steps

After successful setup:

1. **Test All Features**: Create skill tokens, job pools, and test matching
2. **Deploy to Mainnet**: When ready, deploy contracts to Hedera mainnet
3. **Scale Infrastructure**: Add load balancers, monitoring, and CI/CD
4. **User Onboarding**: Implement user registration and profile management
5. **Advanced Features**: Add AI reputation scoring and advanced matching

## 🔐 Security Considerations

- **Never commit private keys** to version control
- **Use environment variables** for sensitive configuration
- **Implement rate limiting** on API endpoints
- **Add authentication** for admin functions
- **Regular security audits** of smart contracts
- **Monitor for suspicious activity**

---

**🎉 Congratulations!** You've successfully set up TalentChain Pro, a complete decentralized talent ecosystem on Hedera.

For questions or support, please refer to the troubleshooting section or create an issue in the repository.
