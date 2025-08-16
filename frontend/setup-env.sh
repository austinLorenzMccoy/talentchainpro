#!/bin/bash

echo "🔧 Setting up environment variables for TalentChain Pro Frontend"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local file
echo "📝 Creating .env.local file..."

cat > .env.local << 'EOF'
# WalletConnect Configuration
# Get your Project ID from: https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet
# Options: testnet, mainnet

# MetaMask Configuration
NEXT_PUBLIC_METAMASK_CHAIN_ID=296
# 296 for Hedera Testnet, 295 for Hedera Mainnet

# HashPack App Configuration
NEXT_PUBLIC_HASHPACK_APP_NAME=TalentChain Pro
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Blockchain-based talent ecosystem on Hedera
NEXT_PUBLIC_HASHPACK_APP_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Smart Contract Addresses (Hedera Format: 0.0.XXXXXXX)
NEXT_PUBLIC_SKILL_TOKEN_CONTRACT_ADDRESS=0.0.6545000
NEXT_PUBLIC_TALENT_POOL_CONTRACT_ADDRESS=0.0.6545001
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ADDRESS=0.0.6545002
NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT_ADDRESS=0.0.6545003

# Backend API Configuration
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_VERSION=v1

# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK_NAME=testnet
NEXT_PUBLIC_HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
NEXT_PUBLIC_HEDERA_EXPLORER_URL=https://testnet.dragonglass.me
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Get your WalletConnect Project ID from: https://cloud.walletconnect.com/"
echo "2. Update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local"
echo "3. Restart your development server"
echo "4. Test MetaMask connection at: http://localhost:3000/wallet-test"
echo ""
echo "🔍 To test the connection:"
echo "   - Make sure MetaMask is installed and unlocked"
echo "   - Visit http://localhost:3000/wallet-test"
echo "   - Click 'Test MetaMask' button"
echo "   - Check browser console for detailed logs"
echo ""
echo "⚠️  Important: You MUST get a WalletConnect Project ID for MetaMask to work properly!"
