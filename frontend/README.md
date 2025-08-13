# 🚀 TalentChain Pro Frontend

Advanced Web3 talent ecosystem frontend built on Hedera Hashgraph with comprehensive wallet integration, AI-powered matching, and enterprise-grade UX.

## ✨ **Features**

### 🔗 **Multi-Wallet Support**
- **HashPack**: Official Hedera wallet with full ecosystem integration
- **MetaMask**: EVM-compatible wallet with Hedera network support
- **WalletConnect**: Universal wallet connectivity for mobile and desktop
- **Automatic Detection**: Smart wallet availability checking
- **Seamless Switching**: Easy wallet switching and account management

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on all devices
- **Dark Mode**: Full dark mode support with system preference detection
- **Smooth Animations**: Framer Motion powered interactions
- **Accessibility**: Screen reader and keyboard navigation support
- **Brand Consistency**: Maintains TalentChain Pro visual identity

### ⚡ **Performance & Security**
- **TypeScript**: Full type safety and IntelliSense support
- **Next.js 14**: Latest React framework with App Router
- **Optimized Builds**: Efficient bundling and code splitting
- **Security First**: Secure wallet connections and data handling
- **Error Handling**: Comprehensive error management and user feedback

## 🛠 **Tech Stack**

### **Core Framework**
- **Next.js 14**: React framework with App Router
- **React 18**: Latest React with concurrent features
- **TypeScript**: Full type safety and development experience

### **Styling & UI**
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icon library

### **Wallet Integration**
- **@hashgraph/hedera-wallet-connect**: Official Hedera wallet integration
- **@hashgraph/sdk**: Hedera blockchain SDK
- **@walletconnect/ethereum-provider**: WalletConnect v2 support
- **ethers.js**: Ethereum compatibility layer
- **@metamask/providers**: MetaMask integration

### **Development Tools**
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Tailwind CSS IntelliSense**: Enhanced development experience

## 🚀 **Quick Start**

### **1. Prerequisites**
- Node.js 18+ and npm
- Git
- WalletConnect Project ID (get from [WalletConnect Cloud](https://cloud.walletconnect.com/))

### **2. Clone & Install**
```bash
# Clone the repository
git clone <repository-url>
cd talentchainpro/frontend

# Install dependencies
npm install
```

### **3. Environment Setup**
```bash
# Run the automated setup script
npm run setup-wallet

# Or manually create .env.local
cp env.example .env.local
# Edit .env.local with your values
```

### **4. Start Development**
```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## ⚙️ **Configuration**

### **Environment Variables**

Create a `.env.local` file in the `frontend` directory:

```bash
# WalletConnect Configuration
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
NEXT_PUBLIC_HASHPACK_APP_URL=https://talentchainpro.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **WalletConnect Project ID**

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up/Login with your account
3. Create a new project
4. Copy your Project ID (32 character hex string)

## 🔗 **Wallet Setup**

### **HashPack Wallet**
1. Visit [HashPack.app](https://hashpack.app)
2. Install the browser extension
3. Create or import your Hedera wallet
4. No additional configuration needed

### **MetaMask Wallet**
1. Install [MetaMask](https://metamask.io/) extension
2. Add Hedera network:
   - **Testnet**: Chain ID 296, RPC: `https://testnet.hashio.io/api`
   - **Mainnet**: Chain ID 295, RPC: `https://mainnet.hashio.io/api`

### **Testing Wallet Connections**
Visit `/wallet-test` to test all wallet connections:
- Wallet detection
- Connection testing
- Real-time logs
- Connection status

## 📁 **Project Structure**

```
frontend/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes
│   ├── wallet-test/       # Wallet testing page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/             # React components
│   ├── ui/                # Base UI components
│   ├── wallet/            # Wallet-related components
│   ├── layout/            # Layout components
│   └── landing/           # Landing page components
├── hooks/                  # Custom React hooks
│   └── useAuth.tsx        # Authentication hook
├── lib/                    # Utility libraries
│   ├── wallet/            # Wallet integration
│   │   └── wallet-connector.ts  # Main wallet connector
│   ├── config/            # Configuration files
│   └── types/             # TypeScript type definitions
├── scripts/                # Build and setup scripts
│   └── setup-wallet.js    # Wallet configuration script
└── docs/                   # Documentation
    └── wallet-setup-guide.md  # Wallet setup guide
```

## 🧪 **Testing**

### **Wallet Connection Testing**
```bash
# Start development server
npm run dev

# Visit wallet test page
http://localhost:3000/wallet-test
```

### **Available Tests**
- ✅ Wallet detection and availability
- ✅ Connection establishment
- ✅ Error handling and recovery
- ✅ Real-time connection status
- ✅ Wallet switching and disconnection

## 🚀 **Development Workflow**

### **1. Development Mode**
```bash
npm run dev
# Hot reloading, TypeScript checking, error overlay
```

### **2. Building for Production**
```bash
npm run build
npm start
# Optimized production build
```

### **3. Code Quality**
```bash
npm run lint
# ESLint checking and auto-fixing
```

### **4. Wallet Setup**
```bash
npm run setup-wallet
# Interactive wallet configuration
```

## 🔧 **Customization**

### **Adding New Wallets**
1. Extend `WalletType` enum in `lib/wallet/wallet-connector.ts`
2. Implement connection logic in `WalletConnector` class
3. Add UI components in `components/wallet/`
4. Update types and interfaces

### **Styling Customization**
- **Tailwind Config**: `tailwind.config.ts`
- **CSS Variables**: `app/globals.css`
- **Component Themes**: `components/ui/`

### **Configuration Updates**
- **Networks**: `lib/config/networks.ts`
- **Wallet Options**: `components/wallet/wallet-button.tsx`
- **Environment**: `.env.local`

## 🚀 **Deployment**

### **Vercel (Recommended)**
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Other Platforms**
1. Build the project: `npm run build`
2. Set production environment variables
3. Deploy the `out` directory or use `npm start`

### **Environment Variables for Production**
```bash
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NEXT_PUBLIC_METAMASK_CHAIN_ID=295
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **WalletConnect Connection Fails**
- Verify Project ID is correct and 32 characters
- Check environment variables are loaded
- Ensure HTTPS in production

#### **MetaMask Not Detected**
- Install MetaMask browser extension
- Refresh the page
- Check browser console for errors

#### **HashPack Connection Issues**
- Install HashPack extension
- Verify WalletConnect Project ID
- Check network configuration

### **Debug Steps**
1. **Check Console Logs**: Open browser dev tools
2. **Verify Environment**: Check `.env.local` file
3. **Test Wallet Detection**: Use `/wallet-test` page
4. **Check Dependencies**: Ensure all packages are installed

## 📚 **Documentation**

### **Guides**
- [Wallet Setup Guide](docs/wallet-setup-guide.md) - Complete wallet configuration
- [Component Library](components/ui/) - Available UI components
- [API Integration](lib/) - Backend integration examples

### **External Resources**
- [Hedera Documentation](https://docs.hedera.com/)
- [HashPack Developer Guide](https://docs.hashpack.app/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### **Code Standards**
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include TypeScript types
- Test wallet connections

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Hedera Hashgraph** for the blockchain infrastructure
- **HashPack** for the official Hedera wallet
- **WalletConnect** for universal wallet connectivity
- **Next.js Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework

---

**Ready to build the future of talent management on Hedera?** 🚀

Connect your wallet and start exploring the TalentChain Pro ecosystem!
