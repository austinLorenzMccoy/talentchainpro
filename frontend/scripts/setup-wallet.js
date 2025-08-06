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

console.log('🔗 TalentChain Pro Wallet Setup\n');

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function setupWalletConnect() {
    console.log('📋 WalletConnect Project ID Setup');
    console.log('1. Go to https://cloud.walletconnect.com/');
    console.log('2. Sign up or log in to your account');
    console.log('3. Create a new project with these details:');
    console.log('   - Name: TalentChain Pro');
    console.log('   - Description: Blockchain-based talent ecosystem on Hedera');
    console.log('   - URL: Your app URL (e.g., https://yourdomain.com)');
    console.log('4. Copy the Project ID\n');

    const projectId = await askQuestion('Enter your WalletConnect Project ID: ');

    if (!projectId || projectId === 'your_project_id_here') {
        console.log('❌ Please provide a valid Project ID');
        return false;
    }

    return projectId;
}

async function setupEnvironment() {
    console.log('🔧 Environment Configuration\n');

    const projectId = await setupWalletConnect();
    if (!projectId) return;

    const network = await askQuestion('Enter Hedera network (testnet/mainnet): ') || 'testnet';
    const appUrl = await askQuestion('Enter your app URL (default: http://localhost:3000): ') || 'http://localhost:3000';
    const apiUrl = await askQuestion('Enter API URL (default: http://localhost:8000/api/v1): ') || 'http://localhost:8000/api/v1';

    const envContent = `# WalletConnect Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${projectId}

# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK=${network}

# App Configuration
NEXT_PUBLIC_APP_URL=${appUrl}

# API Configuration
NEXT_PUBLIC_API_URL=${apiUrl}

# Contract Addresses (optional - will be set after deployment)
NEXT_PUBLIC_CONTRACT_SKILLTOKEN=
NEXT_PUBLIC_CONTRACT_TALENTPOOL=
`;

    const envPath = path.join(__dirname, '..', '.env.local');

    try {
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Environment file created: ${envPath}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to create environment file:', error.message);
        return false;
    }
}

async function checkDependencies() {
    console.log('📦 Checking Dependencies\n');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');

    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const requiredDeps = [
            '@hashgraph/hedera-wallet-connect',
            '@hashgraph/sdk',
            '@walletconnect/modal',
            '@walletconnect/sign-client'
        ];

        const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

        if (missingDeps.length > 0) {
            console.log('❌ Missing dependencies:');
            missingDeps.forEach(dep => console.log(`   - ${dep}`));
            console.log('\nRun: npm install');
            return false;
        } else {
            console.log('✅ All required dependencies are installed');
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to check dependencies:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting TalentChain Pro Wallet Setup\n');

    // Check dependencies
    const depsOk = await checkDependencies();
    if (!depsOk) {
        rl.close();
        return;
    }

    // Setup environment
    const envOk = await setupEnvironment();
    if (!envOk) {
        rl.close();
        return;
    }

    console.log('\n🎉 Setup Complete!');
    console.log('\nNext steps:');
    console.log('1. Install HashPack: https://hashpack.com/');
    console.log('2. Install MetaMask: https://metamask.io/');
    console.log('3. Add Hedera network to MetaMask (see docs/wallet-setup-guide.md)');
    console.log('4. Restart your development server: npm run dev');
    console.log('5. Test wallet connections in your app');

    rl.close();
}

main().catch(console.error); 