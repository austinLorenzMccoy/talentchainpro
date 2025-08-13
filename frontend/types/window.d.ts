import { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
    // HashPack works through WalletConnect, not as a direct extension
    // See: https://docs.hashpack.app/dapp-developers/walletconnect
  }
}

export { };


