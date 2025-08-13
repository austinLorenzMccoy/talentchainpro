#!/usr/bin/env node

/**
 * Wallet Setup Script for TalentChain Pro
 * This script helps configure wallet connections
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupWallet() {
    console.log('🚀 TalentChain Pro Wallet Setup\n');
    console.log('This script will help you configure your wallet connection.\n');

    // Get WalletConnect Project ID
    console.log('📋 Step 1: WalletConnect Project ID');
    console.log('Visit: https://cloud.walletconnect.com/');
    console.log('1. Sign up/Login with your account');
    console.log('2. Create a new project');
    console.log('3. Copy your Project ID (32 character hex string)\n');

    const walletConnectProjectId = await question('Enter your WalletConnect Project ID: ');

    if (!walletConnectProjectId || walletConnectProjectId.length !== 32) {
        console.log('❌ Invalid Project ID. It should be 32 characters long.');
        rl.close();
        return;
    }

    // Get Hedera Network
    console.log('\n🌐 Step 2: Hedera Network');
    console.log('Choose your network:');
    console.log('1. testnet (recommended for development)');
    console.log('2. mainnet (for production)\n');

    const networkChoice = await question('Enter your choice (1 or 2): ');
    const hederaNetwork = networkChoice === '2' ? 'mainnet' : 'testnet';

    // Get MetaMask Chain ID
    const metamaskChainId = hederaNetwork === 'mainnet' ? '295' : '296';

    // Get App Configuration
    console.log('\n⚙️  Step 3: App Configuration');
    const appUrl = await question('Enter your app URL (default: http://localhost:3000): ') || 'http://localhost:3000';
    const apiUrl = await question('Enter your API URL (default: http://localhost:8000): ') || 'http://localhost:8000';

    // Create .env.local content
    const envContent = `# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${walletConnectProjectId}

# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK=${hederaNetwork}

# MetaMask Configuration
NEXT_PUBLIC_METAMASK_CHAIN_ID=${metamaskChainId}

# HashPack App Configuration
NEXT_PUBLIC_HASHPACK_APP_NAME=TalentChain Pro
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Blockchain-based talent ecosystem on Hedera
NEXT_PUBLIC_HASHPACK_APP_URL=${appUrl}

# App Configuration
NEXT_PUBLIC_APP_URL=${appUrl}
NEXT_PUBLIC_API_URL=${apiUrl}

# Optional: Contract Addresses (if deployed)
NEXT_PUBLIC_SKILL_TOKEN_CONTRACT_ADDRESS=
NEXT_PUBLIC_TALENT_POOL_CONTRACT_ADDRESS=
`;

    // Write to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Wallet configuration completed!');
    console.log(`📁 Created: ${envPath}`);
    console.log('\n🔧 Next steps:');
    console.log('1. Install the required dependencies: npm install');
    console.log('2. Start your development server: npm run dev');
    console.log('3. Test wallet connections on your app');

    if (hederaNetwork === 'testnet') {
        console.log('\n💡 Development Tips:');
        console.log('- Get testnet HBAR from: https://portal.hedera.com/');
        console.log('- Install HashPack extension: https://hashpack.app/');
        console.log('- Install MetaMask extension: https://metamask.io/');
    }

    rl.close();
}

setupWallet().catch(console.error); 