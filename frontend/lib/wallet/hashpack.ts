/**
 * HashPack wallet integration for TalentChain Pro
 */

import { WalletConnection, TransactionResult } from '../types/wallet';
import { APP_CONFIG, WALLET_CONFIG } from '../config/networks';

declare global {
  interface Window {
    hashconnect?: any;
  }
}

interface HashPackWallet {
  isAvailable(): boolean;
  getConnection(): WalletConnection | null;
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  executeTransaction(transaction: any): Promise<TransactionResult>;
}

class HashPackWalletImpl implements HashPackWallet {
  private hashconnect: any = null;
  private connection: WalletConnection | null = null;
  private appMetadata = WALLET_CONFIG.HASHPACK.appMetadata;

  /**
   * Check if HashPack is available
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.hashconnect;
  }

  /**
   * Initialize HashConnect if needed
   */
  private async initializeHashConnect() {
    if (this.hashconnect) return this.hashconnect;

    try {
      // Import HashConnect v3 and LedgerId from Hedera SDK
      const { HashConnect } = await import('hashconnect');
      const { LedgerId } = await import('@hashgraph/sdk');
      
      // Create HashConnect instance with required parameters
      this.hashconnect = new HashConnect(
        LedgerId.TESTNET, // Use testnet for development
        'talentchain-pro', // Project ID
        {
          ...this.appMetadata,
          icons: [this.appMetadata.icon], // Convert single icon to icons array
        },
        true // Debug mode
      );

      return this.hashconnect;
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      throw new Error('Failed to initialize HashPack connection');
    }
  }

  /**
   * Get current connection
   */
  getConnection(): WalletConnection | null {
    // Try to get saved connection from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('talentchain_hashpack_connection');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isConnected) {
            this.connection = parsed;
            return parsed;
          }
        } catch (error) {
          console.error('Failed to parse saved HashPack connection:', error);
          localStorage.removeItem('talentchain_hashpack_connection');
        }
      }
    }
    
    return this.connection;
  }

  /**
   * Connect to HashPack wallet
   */
  async connect(): Promise<WalletConnection> {
    try {
      console.log('🔄 Connecting to HashPack...');
      
      const hashconnect = await this.initializeHashConnect();

      // Connect to extension
      const walletData = await hashconnect.connectToLocalWallet();
      console.log('Connected to HashPack:', walletData);

      if (!walletData || !walletData.accountIds || walletData.accountIds.length === 0) {
        throw new Error('No accounts found in HashPack wallet');
      }

      const accountId = walletData.accountIds[0];
      
      // Get account balance
      const balance = await this.getAccountBalance(accountId);

      const connection: WalletConnection = {
        walletType: 'hashpack',
        isConnected: true,
        accountId: accountId,
        evmAddress: walletData.evmAddress,
        balance: balance,
        network: APP_CONFIG.network,
        publicKey: walletData.publicKey,
        metadata: {
          name: 'HashPack',
          icon: '/icons/hashpack.svg',
        },
      };

      this.connection = connection;
      this.saveConnection(connection);

      console.log('✅ HashPack connected successfully:', connection);
      return connection;

    } catch (error) {
      console.error('❌ HashPack connection failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to HashPack');
    }
  }

  /**
   * Disconnect from HashPack
   */
  async disconnect(): Promise<void> {
    try {
      if (this.hashconnect) {
        await this.hashconnect.disconnect();
      }
      
      this.connection = null;
      this.clearSavedConnection();
      
      console.log('✅ HashPack disconnected successfully');
    } catch (error) {
      console.error('❌ HashPack disconnect failed:', error);
      // Clear local state even if disconnect fails
      this.connection = null;
      this.clearSavedConnection();
    }
  }

  /**
   * Execute transaction via HashPack
   */
  async executeTransaction(transaction: any): Promise<TransactionResult> {
    try {
      if (!this.connection || !this.hashconnect) {
        throw new Error('Wallet not connected');
      }

      console.log('🔄 Executing transaction via HashPack...');
      
      // Execute transaction through HashConnect
      const response = await this.hashconnect.sendTransaction(
        this.connection.accountId,
        transaction
      );

      if (response.success) {
        return {
          success: true,
          transactionId: response.response.transactionId,
          receipt: response.response.receipt,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Transaction failed',
        };
      }

    } catch (error) {
      console.error('❌ Transaction execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  /**
   * Get account balance
   */
  private async getAccountBalance(_accountId: string): Promise<string> {
    try {
      if (!this.hashconnect) {
        return '0';
      }

      // This would typically use Hedera SDK or Mirror Node API
      // For now, return a placeholder
      return '1000.00';
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return '0';
    }
  }

  /**
   * Save connection to localStorage
   */
  private saveConnection(connection: WalletConnection) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('talentchain_hashpack_connection', JSON.stringify(connection));
    }
  }

  /**
   * Clear saved connection
   */
  private clearSavedConnection() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentchain_hashpack_connection');
    }
  }
}

// Export singleton instance
export const hashPackWallet = new HashPackWalletImpl();

// Helper functions
export const connectHashPack = () => hashPackWallet.connect();
export const disconnectHashPack = () => hashPackWallet.disconnect();
export const getHashPackConnection = () => hashPackWallet.getConnection();
export const isHashPackAvailable = () => hashPackWallet.isAvailable();