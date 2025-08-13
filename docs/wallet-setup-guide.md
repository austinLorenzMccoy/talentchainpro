# 🚀 TalentChain Pro Wallet Setup Guide

## 📋 **Overview**
This guide will help you set up wallet connections for TalentChain Pro, enabling users to connect their Hedera wallets and interact with the platform.

## 🔧 **Prerequisites**

### 1. **WalletConnect Project ID**
You need a WalletConnect Project ID to enable wallet connections:

1. **Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)**
2. **Sign up/Login** with your account
3. **Create a new project**:
   - Project Name: `TalentChain Pro`
   - Description: `Blockchain-based talent ecosystem on Hedera`
   - URL: Your domain (or `http://localhost:3000` for development)
4. **Copy your Project ID** (32 character hex string)

### 2. **Environment Configuration**
Create a `.env.local` file in your `frontend` directory:

```bash
# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here

# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet
# Options: testnet, mainnet

# MetaMask Configuration
NEXT_PUBLIC_METAMASK_CHAIN_ID=296
# 296 for Hedera Testnet, 295 for Hedera Mainnet

# HashPack App Configuration
NEXT_PUBLIC_HASHPACK_APP_NAME=TalentChain Pro
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Blockchain-based talent ecosystem on Hedera
NEXT_PUBLIC_HASHPACK_APP_URL=https://talentchainpro.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. **Automated Setup**
Use our setup script for easy configuration:

```bash
cd frontend
npm run setup-wallet
```

## 🦊 **MetaMask Setup**

### **Installation**
1. **Install MetaMask Extension**:
   - Visit [MetaMask.io](https://metamask.io/)
   - Install the browser extension
   - Create or import your wallet

### **Add Hedera Network**
1. **Open MetaMask**
2. **Go to Settings → Networks → Add Network**
3. **Configure Hedera Testnet**:
   - **Network Name**: `Hedera Testnet`
   - **RPC URL**: `https://testnet.hashio.io/api`
   - **Chain ID**: `296`
   - **Currency Symbol**: `HBAR`
   - **Block Explorer**: `https://hashscan.io/testnet`

4. **Configure Hedera Mainnet** (for production):
   - **Network Name**: `Hedera Mainnet`
   - **RPC URL**: `https://mainnet.hashio.io/api`
   - **Chain ID**: `295`
   - **Currency Symbol**: `HBAR`
   - **Block Explorer**: `https://hashscan.io/mainnet`

### **Test MetaMask**
1. Start your development server: `npm run dev`
2. Visit your app and click "Connect Wallet"
3. Select MetaMask from the options
4. Approve the connection in MetaMask

## 🔗 **HashPack Setup**

### **Installation**
1. **Visit [HashPack.app](https://hashpack.app)**
2. **Install the browser extension**
3. **Create or import your Hedera wallet**

### **How It Works**
HashPack works through WalletConnect integration:
- No additional configuration needed
- Automatically detected when available
- Full Hedera ecosystem support

### **Test HashPack**
1. Ensure HashPack extension is installed
2. Click "Connect Wallet" in your app
3. Select HashPack from the options
4. Approve the connection in HashPack

## 🔌 **WalletConnect Setup**

### **Overview**
WalletConnect provides universal wallet connectivity:
- Works with any WalletConnect-compatible wallet
- Mobile wallet support via QR codes
- No extension required

### **Configuration**
The setup is automatic once you have your Project ID:
- QR code generation for mobile wallets
- Universal wallet compatibility
- Fallback option for all users

## 🧪 **Testing Your Setup**

### **1. Development Testing**
```bash
# Start the development server
npm run dev

# Visit your app
http://localhost:3000
```

### **2. Check Console Logs**
Open browser dev tools to see:
- Available wallet detection
- Connection attempts
- Error messages
- Debug information

### **3. Test Each Wallet Type**
1. **HashPack**: Should connect via WalletConnect
2. **MetaMask**: Should connect with Hedera network
3. **WalletConnect**: Should work as universal fallback

## 🎯 **Production Deployment**

### **1. Update Environment Variables**
```bash
# Production environment
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NEXT_PUBLIC_METAMASK_CHAIN_ID=295
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### **2. Deploy Smart Contracts**
- Deploy to Hedera mainnet
- Update contract addresses in environment
- Test all contract functions

### **3. Security Considerations**
- Use HTTPS in production
- Validate all wallet connections
- Implement proper error handling
- Monitor connection logs

## 🔍 **Troubleshooting**

### **Common Issues**

#### **MetaMask Connection Fails**
- **Problem**: Network not found
- **Solution**: Add Hedera network to MetaMask
- **Problem**: Wrong chain ID
- **Solution**: Check `NEXT_PUBLIC_METAMASK_CHAIN_ID` value

#### **HashPack Not Detected**
- **Problem**: Extension not installed
- **Solution**: Install HashPack browser extension
- **Problem**: WalletConnect Project ID missing
- **Solution**: Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

#### **WalletConnect Errors**
- **Problem**: Invalid Project ID
- **Solution**: Get valid Project ID from WalletConnect Cloud
- **Problem**: Project ID format error
- **Solution**: Ensure 32 character hex string

### **Debug Steps**
1. **Check Environment Variables**:
   ```bash
   # Verify .env.local exists and has correct values
   cat frontend/.env.local
   ```

2. **Check Browser Console**:
   - Look for wallet detection logs
   - Check for connection errors
   - Verify environment variable loading

3. **Test Wallet Availability**:
   ```javascript
   // In browser console
   console.log('MetaMask:', !!window.ethereum?.isMetaMask);
   console.log('HashPack:', true); // Always available via WalletConnect
   ```

## 📱 **Mobile Support**

### **WalletConnect Mobile**
- Works with mobile wallets
- QR code connection
- Universal compatibility

### **Mobile Testing**
- Test on mobile devices
- Verify QR code generation
- Check mobile wallet connections

## 🚀 **Advanced Features**

### **1. Custom Wallet Integration**
Add support for additional wallets:
```typescript
// In wallet-connector.ts
export enum WalletType {
  HASHPACK = 'hashpack',
  METAMASK = 'metamask',
  WALLETCONNECT = 'walletconnect',
  CUSTOM_WALLET = 'custom' // Add your custom wallet
}
```

### **2. Network Switching**
Implement network switching:
```typescript
// Switch between testnet and mainnet
await walletConnector.switchNetwork('mainnet');
```

### **3. Transaction Signing**
Sign and send transactions:
```typescript
// Sign a message
const signature = await walletConnector.signMessage('Hello TalentChain Pro');

// Send a transaction
const txHash = await walletConnector.sendTransaction(transactionData);
```

## 📚 **Additional Resources**

### **Documentation**
- [Hedera Documentation](https://docs.hedera.com/)
- [HashPack Developer Guide](https://docs.hashpack.app/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [MetaMask Documentation](https://docs.metamask.io/)

### **Community**
- [Hedera Discord](https://discord.gg/hedera)
- [HashPack Community](https://discord.gg/hashpack)
- [WalletConnect Community](https://discord.gg/walletconnect)

## ✅ **Verification Checklist**

- [ ] WalletConnect Project ID configured
- [ ] Environment variables set correctly
- [ ] MetaMask Hedera network added
- [ ] HashPack extension installed
- [ ] All wallet types connecting successfully
- [ ] Error handling working properly
- [ ] Mobile wallet support tested
- [ ] Production environment configured

## 🎉 **Success!**

Once all items are checked, your TalentChain Pro app will have:
- ✅ Full wallet connectivity
- ✅ Multi-wallet support
- ✅ Professional user experience
- ✅ Production-ready implementation

Your users can now connect their Hedera wallets and fully interact with the TalentChain Pro platform! 🚀 