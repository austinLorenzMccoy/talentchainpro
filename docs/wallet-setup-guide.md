# Wallet Setup Guide for TalentChain Pro

This guide will help you set up wallet connections for TalentChain Pro, including getting a WalletConnect project ID and configuring MetaMask for Hedera.

## 🔗 WalletConnect Project ID Setup

### Step 1: Get WalletConnect Project ID

1. **Visit WalletConnect Cloud**
   - Go to [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
   - Sign up or log in to your account

2. **Create a New Project**
   - Click "Create New Project"
   - Enter project details:
     - **Name**: TalentChain Pro
     - **Description**: Blockchain-based talent ecosystem on Hedera
     - **URL**: Your app URL (e.g., `https://yourdomain.com`)

3. **Copy Project ID**
   - After creating the project, you'll get a Project ID
   - Copy this ID (it looks like: `1234567890abcdef1234567890abcdef`)

### Step 2: Configure Environment Variables

1. **Create/Update `.env.local` file**
   ```bash
   # In your frontend directory
   touch .env.local
   ```

2. **Add the Project ID**
   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_HEDERA_NETWORK=testnet
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Restart your development server**
   ```bash
   npm run dev
   ```

## 🦊 MetaMask Setup for Hedera

### Step 1: Install MetaMask
1. Go to [https://metamask.io/](https://metamask.io/)
2. Download and install the browser extension
3. Create a new wallet or import existing one

### Step 2: Add Hedera Network to MetaMask

#### For Testnet:
```javascript
// Network Name: Hedera Testnet
// RPC URL: https://testnet.hashio.io/api
// Chain ID: 296
// Currency Symbol: HBAR
// Block Explorer URL: https://hashscan.io/testnet
```

#### For Mainnet:
```javascript
// Network Name: Hedera Mainnet
// RPC URL: https://mainnet.hashio.io/api
// Chain ID: 295
// Currency Symbol: HBAR
// Block Explorer URL: https://hashscan.io/mainnet
```

### Step 3: Add Network Manually
1. Open MetaMask
2. Click the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network" → "Add Network Manually"
4. Enter the network details above
5. Click "Save"

## 🎒 HashPack Setup

### Step 1: Install HashPack
1. Go to [https://hashpack.com/](https://hashpack.com/)
2. Click "Get HashPack"
3. Install the browser extension

### Step 2: Create Account
1. Open HashPack extension
2. Click "Create Account"
3. Follow the setup process
4. Save your recovery phrase securely

### Step 3: Switch to Testnet (if needed)
1. Open HashPack
2. Click the network dropdown
3. Select "Testnet" for development

## 🔧 Troubleshooting

### Common Issues:

#### 1. WalletConnect Connection Fails
- **Problem**: "Failed to connect to HashPack via WalletConnect"
- **Solution**: 
  - Ensure your project ID is correct
  - Check that your app URL matches the one in WalletConnect Cloud
  - Make sure you're using HTTPS in production

#### 2. MetaMask Not Detected
- **Problem**: MetaMask shows as "Not installed"
- **Solution**:
  - Ensure MetaMask extension is installed
  - Refresh the page
  - Check if MetaMask is enabled for your site

#### 3. Network Mismatch
- **Problem**: "Network mismatch detected"
- **Solution**:
  - Switch to the correct network in your wallet
  - For testnet: Use Hedera Testnet
  - For mainnet: Use Hedera Mainnet

#### 4. Transaction Failures
- **Problem**: Transactions fail with insufficient balance
- **Solution**:
  - Get test HBAR from [Hedera Portal](https://portal.hedera.com/)
  - For testnet: Use the testnet faucet
  - Ensure you have enough HBAR for gas fees

### Debug Steps:

1. **Check Console Logs**
   ```javascript
   // Open browser dev tools (F12)
   // Look for wallet connection logs
   console.log('Wallet connection status:', wallet);
   ```

2. **Verify Environment Variables**
   ```bash
   # Check if environment variables are loaded
   echo $NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
   ```

3. **Test Wallet Availability**
   ```javascript
   // In browser console
   console.log('MetaMask available:', typeof window !== 'undefined' && !!window.ethereum && !!window.ethereum.isMetaMask);
   console.log('HashPack available:', typeof window !== 'undefined');
   ```

## 🚀 Production Deployment

### Environment Variables for Production:
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Security Considerations:
1. **Never expose private keys** in environment variables
2. **Use HTTPS** in production for wallet connections
3. **Validate transactions** on the client side
4. **Implement proper error handling** for wallet operations

## 📱 Mobile Wallet Support

### WalletConnect for Mobile:
- HashPack mobile app supports WalletConnect
- Users can scan QR codes to connect
- No additional setup required

### MetaMask Mobile:
- MetaMask mobile app supports Hedera networks
- Same network configuration as desktop
- Ensure mobile app is updated

## 🔄 Testing Wallet Connections

### Test Script:
```javascript
// Add this to your component for testing
const testWalletConnection = async () => {
  try {
    console.log('Testing wallet connections...');
    
    // Test HashPack
    const hashpackAvailable = typeof window !== 'undefined';
    console.log('HashPack available:', hashpackAvailable);
    
    // Test MetaMask
    const metamaskAvailable = typeof window !== 'undefined' && !!window.ethereum && !!window.ethereum.isMetaMask;
    console.log('MetaMask available:', metamaskAvailable);
    
    // Test connection
    if (hashpackAvailable) {
      const connection = await connect('hashpack');
      console.log('HashPack connection:', connection);
    }
    
  } catch (error) {
    console.error('Wallet test failed:', error);
  }
};
```

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Ensure your wallet is properly configured
4. Contact the development team with specific error messages

---

**Note**: This guide assumes you're using the latest versions of the wallet extensions and libraries. Always check for updates and compatibility. 