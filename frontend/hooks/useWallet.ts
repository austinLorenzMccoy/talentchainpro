/**
 * Main wallet hook for TalentChain Pro
 * Supports HashPack, MetaMask, and other Hedera-compatible wallets
 */

import { useState, useEffect, useCallback } from 'react';
import { WalletConnection, UseWalletReturn, WalletType, HederaNetwork } from '../lib/types/wallet';
import { 
  hashPackWallet,
  connectHashPack,
  disconnectHashPack,
  getHashPackConnection 
} from '../lib/wallet/hashpack';
import { 
  metaMaskWallet,
  connectMetaMask,
  disconnectMetaMask,
  getMetaMaskConnection
} from '../lib/wallet/metamask';
import { APP_CONFIG } from '../lib/config/networks';

export const useWallet = (): UseWalletReturn => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved wallet connection on mount
  useEffect(() => {
    console.log('🔍 useWallet: Loading saved connections...');

    // Check for saved HashPack connection
    const savedHashPack = getHashPackConnection();
    if (savedHashPack?.isConnected) {
      console.log('🔍 useWallet: Setting HashPack wallet');
      setWallet(savedHashPack);
      return;
    }

    // Check for saved MetaMask connection
    const savedMetaMask = getMetaMaskConnection();
    if (savedMetaMask?.isConnected) {
      console.log('🔍 useWallet: Setting MetaMask wallet');
      setWallet(savedMetaMask);
      return;
    }

    console.log('🔍 useWallet: No saved connections found');
  }, []);

  // Check wallet availability
  const isHashPackAvailable = useCallback(() => {
    return hashPackWallet.isAvailable();
  }, []);

  const isMetaMaskAvailable = useCallback(() => {
    return metaMaskWallet.isAvailable();
  }, []);

  const isBladeAvailable = useCallback(() => {
    // Blade wallet availability check would go here
    return false;
  }, []);

  // Connect to wallet
  const connect = useCallback(async (walletType: WalletType = 'hashpack') => {
    setIsConnecting(true);
    setError(null);

    try {
      let connection: WalletConnection;

      switch (walletType) {
        case 'metamask':
          if (!isMetaMaskAvailable()) {
            throw new Error('MetaMask is not installed. Please install the MetaMask browser extension.');
          }
          connection = await connectMetaMask();
          break;

        case 'hashpack':
        default:
          if (!isHashPackAvailable()) {
            throw new Error('HashPack wallet is not installed. Please install the HashPack browser extension.');
          }
          connection = await connectHashPack();
          break;
      }

      console.log('🔍 useWallet: Connection established:', connection);
      setWallet(connection);
      
      // Emit custom event for other components
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: connection }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to connect to ${walletType} wallet`;
      setError(errorMessage);
      console.error(`${walletType} connection failed:`, error);
    } finally {
      setIsConnecting(false);
    }
  }, [isHashPackAvailable, isMetaMaskAvailable]);

  // Disconnect from current wallet
  const disconnect = useCallback(async () => {
    try {
      if (wallet?.walletType === 'metamask') {
        await disconnectMetaMask();
      } else if (wallet?.walletType === 'hashpack') {
        await disconnectHashPack();
      }
      
      setWallet(null);
      setError(null);

      // Emit custom event for other components
      window.dispatchEvent(new CustomEvent('wallet-disconnected'));

      console.log('✅ Wallet disconnected successfully');
    } catch (error) {
      console.error('❌ Wallet disconnect failed:', error);
      // Even if disconnect fails, clear the local state
      setWallet(null);
    }
  }, [wallet?.walletType]);

  // Switch network
  const switchNetwork = useCallback(async (network: HederaNetwork) => {
    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      if (wallet.walletType === 'metamask') {
        await metaMaskWallet.switchNetwork(network);
        
        // Update wallet connection
        const updatedConnection = { ...wallet, network };
        setWallet(updatedConnection);
      } else {
        throw new Error('Network switching not supported for this wallet type');
      }
    } catch (error) {
      console.error('Network switch failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to switch network');
    }
  }, [wallet]);

  return {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
    isConnected: !!wallet?.isConnected,
    isHashPackAvailable: isHashPackAvailable(),
    isMetaMaskAvailable: isMetaMaskAvailable(),
    isBladeAvailable: isBladeAvailable(),
  };
};