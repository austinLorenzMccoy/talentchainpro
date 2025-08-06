/**
 * Hedera Wallet Integration using Official Hedera WalletConnect
 * Following the pattern from Hedera-Counter-Dapp
 */

import {
  Client,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractFunctionParameters,
  AccountId,
  AccountBalanceQuery,
  Hbar,
  TransactionId,
  LedgerId
} from '@hashgraph/sdk';

import {
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
  transactionToBase64String,
  base64StringToTransaction
} from '@hashgraph/hedera-wallet-connect';

import {
  WalletConnection,
  HederaNetwork
} from '../types/wallet';

import { APP_CONFIG } from '../config/networks';

/**
 * Hedera Wallet Manager using Official Hedera WalletConnect
 */
export class HederaWalletManager {
  private connection: WalletConnection | null = null;
  private client: Client | null = null;
  private dAppConnector: DAppConnector | null = null;
  private walletConnectProvider: any | null = null;

  constructor() {
    this.setupClient();
    this.loadSavedConnection();

    // Initialize WalletConnect only on client side
    if (typeof window !== 'undefined') {
      this.initializeWalletConnect();
    }
  }

  /**
   * Initialize WalletConnect (client-side only)
   */
  private async initializeWalletConnect(): Promise<void> {
    try {
      console.log('🔄 Initializing WalletConnect...');

      // Initialize DApp Connector
      this.dAppConnector = new DAppConnector(
        {
          name: "TalentChain Pro",
          description: "Blockchain-based talent ecosystem on Hedera",
          url: window.location.origin,
          icons: [window.location.origin + "/favicon.ico"],
        },
        APP_CONFIG.network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET,
        process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id', // Get from environment
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [HederaChainId.Testnet] // or HederaChainId.Mainnet for mainnet
      );

      // Initialize Hedera Wallet Connect Provider
      await this.dAppConnector.init({ logger: 'error' });
      this.walletConnectProvider = this.dAppConnector.signers[0];

      console.log('✅ WalletConnect initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WalletConnect:', error);
    }
  }

  /**
   * Ensure WalletConnect is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.dAppConnector && typeof window !== 'undefined') {
      await this.initializeWalletConnect();
    }
  }

  /**
   * Check if HashPack is available (via WalletConnect)
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Connect to HashPack wallet via WalletConnect
   */
  async connectWallet(): Promise<WalletConnection> {
    try {
      console.log('🔗 Connecting to HashPack wallet via WalletConnect...');

      // Ensure WalletConnect is initialized
      await this.ensureInitialized();

      if (!this.dAppConnector) {
        throw new Error('WalletConnect initialization failed. Please try again.');
      }

      // Open WalletConnect modal to connect
      await this.dAppConnector.openModal();

      // Wait for connection
      const accountIds = this.dAppConnector.signers.map(signer => signer.getAccountId()?.toString()).filter(Boolean);

      if (!accountIds || accountIds.length === 0) {
        throw new Error('No accounts found after WalletConnect connection');
      }

      const accountId = accountIds[0];

      // Get account balance using Hedera SDK
      let balance = '0';
      try {
        if (this.client && accountId) {
          const query = new AccountBalanceQuery()
            .setAccountId(AccountId.fromString(accountId));
          const accountBalance = await query.execute(this.client);
          balance = accountBalance.hbars.toString();
        }
      } catch (error) {
        console.warn('Could not fetch account balance:', error);
        balance = '0';
      }

      const connection: WalletConnection = {
        walletType: 'hashpack',
        isConnected: true,
        accountId,
        balance,
        network: APP_CONFIG.network,
        metadata: {
          name: 'HashPack',
          icon: '/icons/hashpack.svg',
        },
      };

      this.connection = connection;
      this.walletConnectProvider = this.dAppConnector.signers[0];
      this.saveConnection();

      console.log('✅ HashPack wallet connected successfully via WalletConnect:', connection);
      return connection;

    } catch (error) {
      console.error('❌ HashPack WalletConnect connection failed:', error);
      throw new Error(`Failed to connect to HashPack via WalletConnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from HashPack wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      if (this.dAppConnector) {
        // Get the current session topic if available
        const sessions = this.dAppConnector.walletConnectClient?.session.getAll() || [];
        if (sessions.length > 0) {
          await this.dAppConnector.disconnect(sessions[0].topic);
        }
      }

      this.connection = null;
      this.walletConnectProvider = null;
      this.clearSavedConnection();

      console.log('✅ HashPack wallet disconnected via WalletConnect');
    } catch (error) {
      console.error('❌ HashPack WalletConnect disconnect error:', error);
    }
  }

  /**
   * Get current connection
   */
  getConnection(): WalletConnection | null {
    return this.connection;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connection?.isConnected || false;
  }

  /**
   * Execute contract transaction via WalletConnect
   */
  async executeTransaction(functionName: string, parameters?: ContractFunctionParameters): Promise<string> {
    if (!this.connection || !this.walletConnectProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log(`🔄 Executing contract function: ${functionName}`);

      // Mock contract ID for now - will be replaced with real contract
      const contractId = '0.0.123456'; // TODO: Replace with actual deployed contract ID

      // Create the transaction
      let transaction = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(300000)
        .setFunction(functionName, parameters)
        .setTransactionId(TransactionId.generate(AccountId.fromString(this.connection.accountId)));

      // Freeze the transaction for signing
      const frozenTransaction = await transaction.freezeWith(this.client!);

      // Convert to base64 for WalletConnect
      const transactionBase64 = transactionToBase64String(frozenTransaction);

      // Send transaction via WalletConnect
      const result = await this.walletConnectProvider.request({
        method: HederaJsonRpcMethod.ExecuteTransaction,
        params: {
          transactionList: transactionBase64
        }
      });

      if (!result || !result.response) {
        throw new Error('No response received from wallet');
      }

      const transactionId = result.response.transactionId || `${this.connection.accountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`;

      console.log('✅ Contract transaction successful:', transactionId);
      return transactionId;

    } catch (error) {
      console.error('❌ Contract transaction failed:', error);
      throw new Error(`Contract transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup Hedera client
   */
  private setupClient(): void {
    if (APP_CONFIG.network === 'mainnet') {
      this.client = Client.forMainnet();
    } else {
      this.client = Client.forTestnet();
    }
  }

  /**
   * Save connection to localStorage
   */
  private saveConnection(): void {
    if (this.connection && typeof window !== 'undefined') {
      localStorage.setItem('talentchain_wallet_connection', JSON.stringify(this.connection));
    }
  }

  /**
   * Load saved connection from localStorage
   */
  private loadSavedConnection(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('talentchain_wallet_connection');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          this.connection = {
            walletType: data.walletType,
            isConnected: data.isConnected,
            accountId: data.accountId,
            balance: data.balance,
            network: data.network,
            metadata: data.metadata,
          };
        } catch (error) {
          console.error('Failed to load saved connection:', error);
          this.clearSavedConnection();
        }
      }
    }
  }

  /**
   * Clear saved connection
   */
  private clearSavedConnection(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentchain_wallet_connection');
    }
  }
}

// Export singleton instance
export const hederaWallet = new HederaWalletManager();

// Export utility functions
export const connectHederaWallet = () => hederaWallet.connectWallet();
export const disconnectHederaWallet = () => hederaWallet.disconnectWallet();
export const getHederaConnection = () => hederaWallet.getConnection();
export const isHederaConnected = () => hederaWallet.isConnected();