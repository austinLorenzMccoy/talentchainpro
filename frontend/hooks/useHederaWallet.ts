/**
 * React hook for Hedera wallet management
 * Following the pattern from Hedera-Counter-Dapp
 */

import { useState, useEffect, useCallback } from 'react';
import { WalletConnection, UseWalletReturn, WalletType } from '../lib/types/wallet';
import {
  hederaWallet,
  connectHederaWallet,
  disconnectHederaWallet,
  getHederaConnection
} from '../lib/wallet/hedera-wallet';

export const useHederaWallet = (): UseWalletReturn => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved wallet connection on mount
  useEffect(() => {
    console.log('🔍 useHederaWallet: Loading saved connections...');

    const savedConnection = getHederaConnection();
    if (savedConnection?.isConnected) {
      console.log('🔍 useHederaWallet: Setting saved wallet');
      setWallet(savedConnection);
      return;
    }

    console.log('🔍 useHederaWallet: No saved connections found');
  }, []);

  // Check wallet availability
  const isHashPackAvailable = useCallback(() => {
    return hederaWallet.isAvailable();
  }, []);

  const isMetaMaskAvailable = useCallback(() => {
    return typeof window !== 'undefined' && !!window.ethereum && !!window.ethereum.isMetaMask;
  }, []);

  const isBladeAvailable = useCallback(() => {
    return false; // Not implemented yet
  }, []);

  // Connect to wallet
  const connect = useCallback(async (walletType: WalletType = 'hashpack') => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log(`🔄 useHederaWallet: Connecting to ${walletType}...`);

      let connection;
      if (walletType === 'metamask') {
        // Import MetaMask wallet functions
        const { connectMetaMask } = await import('../lib/wallet/metamask');
        connection = await connectMetaMask();
      } else {
        // Default to HashPack
        connection = await connectHederaWallet();
      }

      setWallet(connection);

      console.log(`✅ useHederaWallet: ${walletType} connected successfully`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      console.error(`❌ useHederaWallet: Connection failed:`, err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔄 useHederaWallet: Disconnecting...');

      if (wallet?.walletType === 'metamask') {
        const { disconnectMetaMask } = await import('../lib/wallet/metamask');
        await disconnectMetaMask();
      } else {
        await disconnectHederaWallet();
      }

      setWallet(null);

      console.log('✅ useHederaWallet: Disconnected successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      console.error('❌ useHederaWallet: Disconnect failed:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [wallet?.walletType]);

  // Execute transaction
  const executeTransaction = useCallback(async (transaction: any) => {
    if (!wallet?.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('🔄 useHederaWallet: Executing transaction:', transaction);

      let result;
      if (wallet.walletType === 'metamask') {
        // Import MetaMask wallet functions for transaction execution
        const { metaMaskWallet } = await import('../lib/wallet/metamask');
        result = await metaMaskWallet.executeTransaction(transaction);
      } else {
        // Use HashPack for transaction execution
        result = await hederaWallet.executeTransaction(
          transaction.functionName,
          transaction.parameters
        );
      }

      return {
        success: true,
        transactionId: result,
        receipt: { status: 'SUCCESS' },
      };

    } catch (error) {
      console.error('❌ useHederaWallet: Transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }, [wallet]);

  // Add switchNetwork function to satisfy UseWalletReturn type
  const switchNetwork = useCallback(async (network: string) => {
    try {
      if (wallet?.walletType === 'metamask') {
        const { switchMetaMaskNetwork } = await import('../lib/wallet/metamask');
        await switchMetaMaskNetwork(network as any);
      } else {
        // HashPack network switching is handled automatically
        console.log('Network switching for HashPack is automatic');
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }, [wallet?.walletType]);

  return {
    wallet,
    isConnected: !!wallet?.isConnected,
    isConnecting,
    error,
    switchNetwork,
    connect,
    disconnect,
    isHashPackAvailable: isHashPackAvailable(),
    isMetaMaskAvailable: isMetaMaskAvailable(),
    isBladeAvailable: isBladeAvailable(),
  };
};