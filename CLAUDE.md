# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TalentChain Pro is a blockchain-based talent ecosystem built on Hedera Hashgraph that combines:
- **Skill Soulbound Tokens (SBTs)**: Non-transferable ERC-721 tokens representing verifiable skills
- **AI Reputation Oracles**: On-chain AI agents that analyze work deliverables via HCS-10 protocol
- **Autonomous Job Matching Pools**: HTS-based liquidity pools for talent discovery
- **Portable Work History**: Cross-platform work history stored as HCS streams

## Architecture

The system consists of three main components:

### Backend (Python/FastAPI)
- **Entry Point**: `backend/app/main.py` - FastAPI application with CORS, middleware, and router setup
- **API Routes**: Located in `backend/app/api/` (skills.py, pools.py, mcp.py)
- **Business Logic**: Located in `backend/app/services/` (skill.py, pool.py, reputation.py, mcp.py)
- **Data Models**: `backend/app/models/schemas.py` - Pydantic models for request/response validation
- **Hedera Integration**: `backend/app/utils/hedera.py` - Hedera SDK client and transaction utilities
- **AI Integration**: `backend/app/utils/mcp_server.py` - MCP (Model Context Protocol) server client

### Smart Contracts (Solidity)
- **SkillToken.sol**: Soulbound ERC-721 implementation with oracle-controlled metadata updates
- **TalentPool.sol**: Staking pools for job matching with platform fee management

### Frontend (Next.js)
- **Framework**: Next.js 15.4.5 with React 19.1.0 and TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS
- **Build Tool**: Turbopack for development

## Development Commands

### Backend Development
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Run all tests
pytest

# Run specific test files
pytest tests/test_skills.py
pytest tests/test_pools.py
pytest tests/test_mcp.py

# Code formatting and linting
black . --line-length 100
isort . --profile black --line-length 100
flake8
mypy .
```

### Smart Contract Development
```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to testnet (requires .env configuration)
npx hardhat run scripts/deploy.ts --network testnet
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Configuration

### Backend Environment Variables
Create `.env` file in `backend/` directory:
```
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
MCP_SERVER_URL=ws://localhost:3001/ws
CONTRACT_SKILL_TOKEN=0.0.CONTRACT_ID
CONTRACT_TALENT_POOL=0.0.CONTRACT_ID
```

### Contract Environment Variables
Create `.env` file in `contracts/` directory for deployment configuration.

## Key Development Patterns

### API Structure
- All endpoints follow RESTful conventions under `/api/v1/`
- Request/response models defined in `schemas.py` with Pydantic validation
- Business logic separated into service layer modules
- Async/await pattern used throughout for Hedera SDK integration

### Hedera Integration
- Client initialization handled in application startup (`main.py:lifespan`)
- All Hedera operations (token creation, HCS messaging) centralized in `utils/hedera.py`
- Transaction IDs returned for all blockchain operations

### AI/MCP Integration
- Natural language processing via GROQ API for talent matching
- MCP server provides standardized interface for AI agent interactions
- Work evaluation uses structured prompts for consistent skill assessment

### Error Handling
- FastAPI exception handlers for validation errors
- Hedera SDK errors wrapped with descriptive messages
- Async context managers for resource cleanup

## Testing Strategy

- **Unit Tests**: Individual service functions with mocked dependencies
- **Integration Tests**: Full API endpoints with test Hedera network
- **Async Testing**: All tests use `pytest-asyncio` for async/await support
- **Test Data**: Fixtures in `tests/conftest.py` for reusable test accounts and tokens

## Code Style Configuration

- **Black**: Line length 100, Python 3.10+ target
- **isort**: Black-compatible profile
- **MyPy**: Strict type checking enabled
- **flake8**: Standard linting rules

## Smart Contract Patterns

### Soulbound Tokens
- Non-transferable via `_beforeTokenTransfer` override
- Metadata updates controlled by authorized oracles only
- HIP-412 compliance for Hedera compatibility

### Staking Pools
- Reentrancy protection on all external calls
- Skill token ID validation before pool joining
- Automated fee distribution on successful matches