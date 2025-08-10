/**
 * HashPack wallet integration for TalentChain Pro
 */

import { WalletConnection, TransactionResult } from '../types/wallet';
import { APP_CONFIG, WALLET_CONFIG } from '../config/networks';

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
    // For WalletConnect-based HashPack, we just need to check if we're in a browser environment
    return typeof window !== 'undefined';
  }

  /**
   * Initialize HashConnect if needed
   */
  private async initializeHashConnect() {
    if (this.hashconnect) return this.hashconnect;

    try {
      // Import DAppConnector from official Hedera WalletConnect
      const { 
        DAppConnector,
        HederaSessionEvent,
        HederaJsonRpcMethod,
        HederaChainId
      } = await import('@hashgraph/hedera-wallet-connect');
      
      // Import LedgerId from Hedera SDK
      const { LedgerId } = await import('@hashgraph/sdk');
      
      // Create DAppConnector instance with required parameters
      this.hashconnect = new DAppConnector(
        {
          name: "TalentChain Pro",
          description: "Blockchain-based talent ecosystem on Hedera",
          url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          icons: [this.appMetadata.icon],
        },
        APP_CONFIG.network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET,
        process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [HederaChainId.Testnet]
      );

      // Initialize the connector
      await this.hashconnect.init({ logger: 'error' });

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

      // Open WalletConnect modal to connect
      await hashconnect.openModal();

      // Wait for connection and get signers
      const signers = hashconnect.signers;
      if (!signers || signers.length === 0) {
        throw new Error('No accounts found in HashPack wallet');
      }

      const accountId = signers[0].getAccountId()?.toString();
      if (!accountId) {
        throw new Error('Failed to get account ID from HashPack wallet');
      }
      
      // Get account balance
      const balance = await this.getAccountBalance(accountId);

      const connection: WalletConnection = {
        walletType: 'hashpack',
        isConnected: true,
        accountId: accountId,
        balance: balance,
        network: APP_CONFIG.network,
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
        // Get the current session topic if available
        const sessions = this.hashconnect.walletConnectClient?.session.getAll() || [];
        if (sessions.length > 0) {
          await this.hashconnect.disconnect(sessions[0].topic);
        }
      }
      
      this.connection = null;
      this.hashconnect = null;
      this.clearSavedConnection();
      
      console.log('✅ HashPack disconnected successfully');
    } catch (error) {
      console.error('❌ HashPack disconnect failed:', error);
      // Clear local state even if disconnect fails
      this.connection = null;
      this.hashconnect = null;
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
      
      // Get the signer
      const signer = this.hashconnect.signers[0];
      if (!signer) {
        throw new Error('No signer available');
      }

      // Execute transaction through DAppConnector
      const response = await signer.call(transaction);

      if (response) {
        return {
          success: true,
          transactionId: response.toString(),
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed',
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