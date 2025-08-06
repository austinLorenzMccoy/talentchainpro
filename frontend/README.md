# TalentChain Pro Frontend

A modern, responsive web application for the TalentChain Pro ecosystem - a blockchain-based talent platform with AI-powered reputation oracles and decentralized job matching.

## 🚀 Features

### ✨ Core Features
- **Dual Wallet Support**: Connect with HashPack (recommended) or MetaMask
- **Dark Mode**: Elegant dark/light theme with smooth transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-time Updates**: Live wallet status and transaction feedback
- **Professional UI**: Modern design with Hedera branding

### 🎯 Wallet Integration
- **HashPack Wallet**: Official Hedera wallet with WalletConnect
- **MetaMask Support**: Ethereum wallet with Hedera network support
- **Automatic Detection**: Smart wallet availability checking
- **Network Switching**: Seamless network management
- **Transaction Execution**: Contract interactions for both wallet types

### 🎨 Design System
- **Component Library**: Built with Radix UI and Tailwind CSS
- **Animations**: Smooth Framer Motion transitions
- **Accessibility**: WCAG compliant design
- **Custom Theming**: Hedera-inspired color palette

## 🛠️ Tech Stack

| **Category** | **Technology** | **Purpose** |
|--------------|----------------|-------------|
| **Framework** | Next.js 14 | React framework with App Router |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Components** | Radix UI | Accessible component primitives |
| **Animations** | Framer Motion | Smooth UI animations |
| **Blockchain** | Hedera SDK | Hedera network integration |
| **Wallets** | WalletConnect | Multi-wallet support |
| **State** | React Hooks | Local state management |

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- HashPack or MetaMask wallet extension

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd talentchainpro/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp env.example .env.local
   
   # Or run the automated setup
   npm run setup-wallet
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# WalletConnect Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Contract Addresses (optional)
NEXT_PUBLIC_CONTRACT_SKILLTOKEN=
NEXT_PUBLIC_CONTRACT_TALENTPOOL=
```

### Getting WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in to your account
3. Create a new project:
   - **Name**: TalentChain Pro
   - **Description**: Blockchain-based talent ecosystem on Hedera
   - **URL**: Your app URL (e.g., `https://yourdomain.com`)
4. Copy the Project ID and add it to your `.env.local`

## 🎒 Wallet Setup

### HashPack Wallet
1. Visit [HashPack](https://hashpack.com/)
2. Install the browser extension
3. Create a new account or import existing
4. Switch to Testnet for development

### MetaMask Wallet
1. Install [MetaMask](https://metamask.io/)
2. Add Hedera network to MetaMask:

**For Testnet:**
- Network Name: `Hedera Testnet`
- RPC URL: `https://testnet.hashio.io/api`
- Chain ID: `296`
- Currency Symbol: `HBAR`
- Block Explorer: `https://hashscan.io/testnet`

**For Mainnet:**
- Network Name: `Hedera Mainnet`
- RPC URL: `https://mainnet.hashio.io/api`
- Chain ID: `295`
- Currency Symbol: `HBAR`
- Block Explorer: `https://hashscan.io/mainnet`

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── wallet/           # Wallet integration
│   ├── layout/           # Layout components
│   └── landing/          # Landing page components
├── hooks/                # Custom React hooks
│   └── useHederaWallet.ts # Wallet management hook
├── lib/                  # Utility libraries
│   ├── config/           # Configuration files
│   ├── types/            # TypeScript types
│   ├── utils.ts          # Utility functions
│   └── wallet/           # Wallet implementations
├── scripts/              # Build and setup scripts
└── docs/                 # Documentation
```

## 🎨 Component Library

### Core Components
- **WalletButton**: Multi-wallet connection with elegant UI
- **ThemeProvider**: Dark/light mode management
- **Layout Components**: Header, footer, navigation
- **UI Components**: Buttons, cards, modals, forms

### Wallet Components
- **useHederaWallet**: Main wallet management hook
- **HederaWalletManager**: HashPack integration
- **MetaMaskWallet**: MetaMask integration
- **WalletConnect**: Multi-wallet support

## 🔄 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Setup
npm run setup-wallet     # Automated wallet setup
```

### Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Open browser and connect wallet**
   - Click "Connect Wallet" button
   - Choose HashPack or MetaMask
   - Approve connection in wallet

3. **Test wallet functionality**
   - Check wallet detection
   - Test network switching
   - Verify transaction execution

4. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Wallet detection (HashPack, MetaMask)
- [ ] Connection/disconnection flow
- [ ] Network switching
- [ ] Dark/light mode toggle
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Error handling and user feedback
- [ ] Transaction execution
- [ ] Cross-browser compatibility

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway

### Environment Variables for Production

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## 🔧 Troubleshooting

### Common Issues

#### Wallet Connection Fails
```bash
# Check console for errors
# Verify environment variables
# Ensure wallet extension is installed
```

#### MetaMask Not Detected
```bash
# Refresh page
# Check if MetaMask is enabled
# Verify network configuration
```

#### Build Errors
```bash
# Clear cache
rm -rf .next
npm run build
```

#### TypeScript Errors
```bash
# Check type definitions
npm run lint
# Fix any type issues
```

### Debug Steps

1. **Check browser console** for error messages
2. **Verify environment variables** are loaded
3. **Test wallet availability**:
   ```javascript
   console.log('MetaMask:', typeof window !== 'undefined' && !!window.ethereum && !!window.ethereum.isMetaMask);
   console.log('HashPack:', typeof window !== 'undefined');
   ```
4. **Check network connection** in wallet
5. **Verify project ID** in WalletConnect Cloud

## 📚 Documentation

- [Wallet Setup Guide](../docs/wallet-setup-guide.md)
- [API Documentation](../backend/README.md)
- [Smart Contracts](../contracts/README.md)
- [Project Overview](../README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use consistent code formatting
- Write meaningful commit messages
- Test wallet functionality thoroughly
- Ensure responsive design

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- [Hedera Hashgraph](https://hedera.com/) for blockchain infrastructure
- [HashPack](https://hashpack.com/) for Hedera wallet
- [WalletConnect](https://walletconnect.com/) for multi-wallet support
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Radix UI](https://www.radix-ui.com/) for accessible components

---

**Built with ❤️ for the Hedera ecosystem**
