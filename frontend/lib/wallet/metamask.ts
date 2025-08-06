/**
 * MetaMask wallet integration for TalentChain Pro
 */

import { WalletConnection, HederaNetwork, TransactionResult } from '../types/wallet';
import { APP_CONFIG, WALLET_CONFIG, getNetworkConfig } from '../config/networks';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface MetaMaskWallet {
  isAvailable(): boolean;
  getConnection(): WalletConnection | null;
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  switchNetwork(network: HederaNetwork): Promise<void>;
  executeTransaction(transaction: any): Promise<TransactionResult>;
}

class MetaMaskWalletImpl implements MetaMaskWallet {
  private ethereum: any = null;
  private connection: WalletConnection | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.ethereum = window.ethereum;
      this.setupEventListeners();
    }
  }

  /**
   * Check if MetaMask is available
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum && !!window.ethereum.isMetaMask;
  }

  /**
   * Get current connection
   */
  getConnection(): WalletConnection | null {
    // Try to get saved connection from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('talentchain_metamask_connection');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isConnected) {
            this.connection = parsed;
            return parsed;
          }
        } catch (error) {
          console.error('Failed to parse saved MetaMask connection:', error);
          localStorage.removeItem('talentchain_metamask_connection');
        }
      }
    }
    
    return this.connection;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connect(): Promise<WalletConnection> {
    try {
      if (!this.isAvailable()) {
        throw new Error('MetaMask is not installed. Please install the MetaMask browser extension.');
      }

      console.log('🔄 Connecting to MetaMask...');

      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in MetaMask wallet');
      }

      const evmAddress = accounts[0];
      
      // Switch to Hedera network if needed
      await this.ensureCorrectNetwork();

      // Get account balance
      const balance = await this.getAccountBalance(evmAddress);

      // Convert EVM address to Hedera account ID (simplified)
      const accountId = this.evmToAccountId(evmAddress);

      const connection: WalletConnection = {
        walletType: 'metamask',
        isConnected: true,
        accountId: accountId,
        evmAddress: evmAddress,
        balance: balance,
        network: APP_CONFIG.network,
        metadata: {
          name: 'MetaMask',
          icon: '/icons/metamask.svg',
        },
      };

      this.connection = connection;
      this.saveConnection(connection);

      console.log('✅ MetaMask connected successfully:', connection);
      return connection;

    } catch (error) {
      console.error('❌ MetaMask connection failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to MetaMask');
    }
  }

  /**
   * Disconnect from MetaMask
   */
  async disconnect(): Promise<void> {
    try {
      // MetaMask doesn't have a disconnect method, just clear local state
      this.connection = null;
      this.clearSavedConnection();
      
      console.log('✅ MetaMask disconnected successfully');
    } catch (error) {
      console.error('❌ MetaMask disconnect failed:', error);
      // Clear local state even if disconnect fails
      this.connection = null;
      this.clearSavedConnection();
    }
  }

  /**
   * Switch to specified network
   */
  async switchNetwork(network: HederaNetwork): Promise<void> {
    try {
      const networkConfig = getNetworkConfig(network);
      const chainId = `0x${networkConfig.chainId.toString(16)}`;

      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      // Update connection network
      if (this.connection) {
        this.connection.network = network;
        this.saveConnection(this.connection);
      }

    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        await this.addNetwork(network);
        await this.switchNetwork(network);
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute transaction via MetaMask
   */
  async executeTransaction(transaction: any): Promise<TransactionResult> {
    try {
      if (!this.connection || !this.ethereum) {
        throw new Error('Wallet not connected');
      }

      console.log('🔄 Executing transaction via MetaMask...');
      
      // Convert Hedera transaction to Ethereum transaction format
      const ethTransaction = this.convertToEthTransaction(transaction);

      // Send transaction
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [ethTransaction],
      });

      // Wait for confirmation
      const receipt = await this.waitForTransactionReceipt(txHash);

      return {
        success: true,
        transactionId: txHash,
        receipt: receipt,
      };

    } catch (error) {
      console.error('❌ Transaction execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  /**
   * Ensure we're on the correct network
   */
  private async ensureCorrectNetwork(): Promise<void> {
    const networkConfig = getNetworkConfig(APP_CONFIG.network);
    const expectedChainId = `0x${networkConfig.chainId.toString(16)}`;
    
    const currentChainId = await this.ethereum.request({
      method: 'eth_chainId',
    });

    if (currentChainId !== expectedChainId) {
      await this.switchNetwork(APP_CONFIG.network);
    }
  }

  /**
   * Add network to MetaMask
   */
  private async addNetwork(network: HederaNetwork): Promise<void> {
    const networkConfig = getNetworkConfig(network);
    
    await this.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${networkConfig.chainId.toString(16)}`,
        chainName: networkConfig.name,
        rpcUrls: [networkConfig.rpcUrl],
        blockExplorerUrls: [networkConfig.explorerUrl],
        nativeCurrency: {
          name: 'HBAR',
          symbol: 'HBAR',
          decimals: 18,
        },
      }],
    });
  }

  /**
   * Get account balance
   */
  private async getAccountBalance(address: string): Promise<string> {
    try {
      const balance = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      // Convert from wei to HBAR (simplified)
      const hbarBalance = parseInt(balance, 16) / Math.pow(10, 18);
      return hbarBalance.toFixed(2);
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return '0';
    }
  }

  /**
   * Convert EVM address to Hedera account ID (simplified)
   */
  private evmToAccountId(evmAddress: string): string {
    // This is a simplified conversion
    // In practice, you'd need proper EVM <-> Hedera account mapping
    return `0.0.${parseInt(evmAddress.slice(-8), 16)}`;
  }

  /**
   * Convert Hedera transaction to Ethereum format
   */
  private convertToEthTransaction(hederaTransaction: any): any {
    // This is a simplified conversion
    // In practice, you'd need proper Hedera <-> Ethereum transaction conversion
    return {
      to: hederaTransaction.contractId,
      data: hederaTransaction.functionData,
      value: hederaTransaction.payableAmount || '0x0',
      gas: '0x' + hederaTransaction.gasLimit.toString(16),
    };
  }

  /**
   * Wait for transaction receipt
   */
  private async waitForTransactionReceipt(txHash: string): Promise<any> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const receipt = await this.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });

        if (receipt) {
          return receipt;
        }
      } catch (error) {
        console.log(`Waiting for receipt attempt ${attempts + 1}`);
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Transaction receipt timeout');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (this.ethereum) {
      this.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('MetaMask accounts changed:', accounts);
        if (accounts.length === 0) {
          this.disconnect();
        }
      });

      this.ethereum.on('chainChanged', (chainId: string) => {
        console.log('MetaMask network changed:', chainId);
        // Update connection if needed
        if (this.connection) {
          const networkConfig = getNetworkConfig(APP_CONFIG.network);
          const expectedChainId = `0x${networkConfig.chainId.toString(16)}`;
          
          if (chainId !== expectedChainId) {
            console.warn('Network mismatch detected');
          }
        }
      });
    }
  }

  /**
   * Save connection to localStorage
   */
  private saveConnection(connection: WalletConnection) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('talentchain_metamask_connection', JSON.stringify(connection));
    }
  }

  /**
   * Clear saved connection
   */
  private clearSavedConnection() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentchain_metamask_connection');
    }
  }
}

// Export singleton instance
export const metaMaskWallet = new MetaMaskWalletImpl();

// Helper functions
export const connectMetaMask = () => metaMaskWallet.connect();
export const disconnectMetaMask = () => metaMaskWallet.disconnect();
export const getMetaMaskConnection = () => metaMaskWallet.getConnection();
export const isMetaMaskAvailable = () => metaMaskWallet.isAvailable();
export const switchMetaMaskNetwork = (network: HederaNetwork) => metaMaskWallet.switchNetwork(network);