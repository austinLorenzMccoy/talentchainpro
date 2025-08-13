import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { DAppConnector } from '@hashgraph/hedera-wallet-connect';
import { Client, AccountId, AccountBalanceQuery, Hbar, LedgerId } from '@hashgraph/sdk';
import { EventEmitter } from 'events';
import { MetaMaskInpageProvider } from '@metamask/providers';

// Types
export enum WalletType {
    HASHPACK = 'hashpack',
    METAMASK = 'metamask',
    WALLETCONNECT = 'walletconnect'
}

export interface WalletConnection {
    type: WalletType;
    accountId: string;
    address: string;
    signer?: ethers.Signer;
    provider?: ethers.Provider;
    balance?: string;
    network?: string;
    chainId?: number;
}

export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    currency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrl: string;
}

// Network configurations
export const HEDERA_NETWORKS: Record<string, NetworkConfig> = {
    testnet: {
        chainId: 296,
        name: 'Hedera Testnet',
        rpcUrl: 'https://testnet.hashio.io/api',
        currency: {
            name: 'HBAR',
            symbol: 'HBAR',
            decimals: 18
        },
        blockExplorerUrl: 'https://hashscan.io/testnet'
    },
    mainnet: {
        chainId: 295,
        name: 'Hedera Mainnet',
        rpcUrl: 'https://mainnet.hashio.io/api',
        currency: {
            name: 'HBAR',
            symbol: 'HBAR',
            decimals: 18
        },
        blockExplorerUrl: 'https://hashscan.io/mainnet'
    }
};

export class WalletConnector {
    private connection: WalletConnection | null = null;
    private listeners: { [event: string]: Function[] } = {};
    private hederaClient: Client | null = null;
    private walletConnectProvider: any = null;
    private hashPackConnector: DAppConnector | null = null;
    private hederaWalletConnectProvider: DAppConnector | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeHederaClient();
            this.loadSavedConnection();
        }
    }

    // Event handling
    on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event: string, callback: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    private emit(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    private initializeHederaClient() {
        const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
        this.hederaClient = new Client({
            network: network as any
        });
    }

    // Helper method to get ethereum provider with proper typing
    private get ethereum(): MetaMaskInpageProvider | undefined {
        if (typeof window !== 'undefined' && window.ethereum) {
            return window.ethereum as unknown as MetaMaskInpageProvider;
        }
        return undefined;
    }

    // HashPack Integration
    async connectHashPack(): Promise<WalletConnection> {
        try {
            console.log('🔗 Connecting to HashPack wallet via WalletConnect...');

            // HashPack works through WalletConnect according to their documentation
            // https://docs.hashpack.app/dapp-developers/walletconnect
            console.log('Using HashPack WalletConnect integration...');
            return await this.connectHashPackWalletConnect();
        } catch (error) {
            console.error('HashPack connection error:', error);
            throw error;
        }
    }

    // HashPack WalletConnect Integration
    private async connectHashPackWalletConnect(): Promise<WalletConnection> {
        try {
            // Initialize HashPack connector
            if (!this.hashPackConnector) {
                const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;

                this.hashPackConnector = new DAppConnector({
                    name: process.env.NEXT_PUBLIC_HASHPACK_APP_NAME || 'TalentChain Pro',
                    description: process.env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION || 'Blockchain-based talent ecosystem on Hedera',
                    url: process.env.NEXT_PUBLIC_HASHPACK_APP_URL || 'https://talentchainpro.com',
                    icons: ['https://talentchainpro.com/icon.png']
                }, network, process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!);
            }

            // Initialize the connector
            await this.hashPackConnector.init();

            // Connect to HashPack using extension
            const session = await this.hashPackConnector.connectExtension('hashpack');

            // Get the first available signer
            const signers = this.hashPackConnector.signers;
            if (signers.length === 0) {
                throw new Error('No signers available after connection');
            }

            const signer = signers[0];
            const accountId = signer.getAccountId().toString();

            // Set the provider for use in signing and transactions
            this.hederaWalletConnectProvider = this.hashPackConnector;

            // Get account balance
            let balance = '0';
            try {
                if (this.hederaClient) {
                    const query = new AccountBalanceQuery()
                        .setAccountId(AccountId.fromString(accountId));
                    const accountBalance = await query.execute(this.hederaClient);
                    balance = accountBalance.hbars.toString();
                }
            } catch (error) {
                console.warn('Could not fetch balance:', error);
            }

            const connection: WalletConnection = {
                type: WalletType.HASHPACK,
                accountId,
                address: accountId, // HashPack uses account IDs
                balance,
                network: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
                chainId: HEDERA_NETWORKS[process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet']?.chainId
            };

            this.connection = connection;
            this.saveConnection();
            this.emit('connected', connection);

            return connection;
        } catch (error) {
            console.error('HashPack WalletConnect connection error:', error);
            throw error;
        }
    }

    // MetaMask Integration
    async connectMetaMask(): Promise<WalletConnection> {
        try {
            const ethereum = this.ethereum;
            if (!ethereum?.isMetaMask) {
                throw new Error('MetaMask is not installed. Please install MetaMask extension.');
            }

            console.log('🔗 Connecting to MetaMask...');

            // Request accounts
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
            const account = accounts[0];

            if (!account) {
                throw new Error('No accounts found');
            }

            // Check if we're on the correct network
            const chainId = await ethereum.request({ method: 'eth_chainId' }) as string;
            const expectedChainId = process.env.NEXT_PUBLIC_METAMASK_CHAIN_ID || '296';

            if (chainId !== `0x${parseInt(expectedChainId).toString(16)}`) {
                // Request network switch
                try {
                    await ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${parseInt(expectedChainId).toString(16)}` }]
                    });
                } catch (switchError: any) {
                    // If the network doesn't exist, add it
                    if (switchError.code === 4902) {
                        const networkConfig = HEDERA_NETWORKS[process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'];
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: `0x${networkConfig.chainId.toString(16)}`,
                                chainName: networkConfig.name,
                                nativeCurrency: networkConfig.currency,
                                rpcUrls: [networkConfig.rpcUrl],
                                blockExplorerUrls: [networkConfig.blockExplorerUrl]
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            // Create provider and signer
            const provider = new ethers.BrowserProvider(ethereum);
            const signer = await provider.getSigner();

            // Get balance
            const balance = await provider.getBalance(account);
            const balanceInEther = ethers.formatEther(balance);

            const connection: WalletConnection = {
                type: WalletType.METAMASK,
                accountId: account,
                address: account,
                signer,
                provider,
                balance: balanceInEther,
                network: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
                chainId: parseInt(expectedChainId)
            };

            this.connection = connection;
            this.saveConnection();
            this.emit('connected', connection);

            // Set up event listeners
            this.setupMetaMaskListeners();

            return connection;
        } catch (error) {
            console.error('MetaMask connection error:', error);
            throw error;
        }
    }

    // WalletConnect Integration
    async connectWalletConnect(): Promise<WalletConnection> {
        try {
            console.log('🔗 Connecting via WalletConnect...');

            // Debug: Check environment variables
            const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
            console.log('WalletConnect Project ID:', projectId);
            console.log('Project ID length:', projectId?.length);
            console.log('Project ID valid format:', /^[a-f0-9]{32}$/.test(projectId || ''));

            if (!projectId) {
                throw new Error('WalletConnect Project ID is missing. Please check your environment variables.');
            }

            if (!this.walletConnectProvider) {
                console.log('Creating WalletConnect provider...');
                // Initialize WalletConnect v2 provider
                this.walletConnectProvider = await EthereumProvider.init({
                    projectId: projectId,
                    chains: [parseInt(process.env.NEXT_PUBLIC_METAMASK_CHAIN_ID || '296')],
                    showQrModal: true,
                    metadata: {
                        name: 'TalentChain Pro',
                        description: 'Blockchain-based talent ecosystem on Hedera',
                        url: 'https://talentchainpro.com',
                        icons: ['https://talentchainpro.com/icon.png']
                    }
                });
                console.log('WalletConnect provider created successfully');
            }

            console.log('Attempting to connect...');
            // Connect
            await this.walletConnectProvider.connect();
            console.log('WalletConnect connection successful');

            // Get accounts
            const accounts = await this.walletConnectProvider.request({ method: 'eth_accounts' }) as string[];
            const account = accounts[0];

            if (!account) {
                throw new Error('No accounts found');
            }

            // Create provider and signer
            const provider = new ethers.BrowserProvider(this.walletConnectProvider);
            const signer = await provider.getSigner();

            // Get balance
            const balance = await provider.getBalance(account);
            const balanceInEther = ethers.formatEther(balance);

            const connection: WalletConnection = {
                type: WalletType.WALLETCONNECT,
                accountId: account,
                address: account,
                signer,
                provider,
                balance: balanceInEther,
                network: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
                chainId: parseInt(process.env.NEXT_PUBLIC_METAMASK_CHAIN_ID || '296')
            };

            this.connection = connection;
            this.saveConnection();
            this.emit('connected', connection);

            // Set up event listeners
            this.setupWalletConnectListeners();

            return connection;
        } catch (error) {
            console.error('WalletConnect connection error:', error);
            throw error;
        }
    }

    private setupMetaMaskListeners() {
        const ethereum = this.ethereum;
        if (ethereum) {
            ethereum.on('accountsChanged', (accounts: unknown) => {
                const accountArray = accounts as string[];
                this.emit('accountsChanged', accountArray);
                if (accountArray.length === 0) {
                    this.disconnect();
                } else {
                    // Update connection with new account
                    this.updateConnection(accountArray[0]);
                }
            });

            ethereum.on('chainChanged', (chainId: unknown) => {
                const chainIdStr = chainId as string;
                this.emit('chainChanged', chainIdStr);
                // Check if we need to reconnect
                const expectedChainId = process.env.NEXT_PUBLIC_METAMASK_CHAIN_ID || '296';
                if (parseInt(chainIdStr, 16).toString() !== expectedChainId) {
                    this.emit('networkMismatch', { current: chainIdStr, expected: expectedChainId });
                }
            });
        }
    }

    private setupWalletConnectListeners() {
        if (this.walletConnectProvider) {
            this.walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
                this.emit('accountsChanged', accounts);
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.updateConnection(accounts[0]);
                }
            });

            this.walletConnectProvider.on('chainChanged', (chainId: string) => {
                this.emit('chainChanged', chainId);
            });

            this.walletConnectProvider.on('disconnect', () => {
                this.disconnect();
            });
        }
    }

    private async updateConnection(newAccount: string) {
        if (!this.connection) return;

        try {
            if (this.connection.type === WalletType.METAMASK && this.connection.provider) {
                const signer = await (this.connection.provider as any).getSigner();
                const balance = await this.connection.provider.getBalance(newAccount);
                const balanceInEther = ethers.formatEther(balance);

                const updatedConnection: WalletConnection = {
                    ...this.connection,
                    accountId: newAccount,
                    address: newAccount,
                    signer,
                    balance: balanceInEther
                };

                this.connection = updatedConnection;
                this.saveConnection();
                this.emit('accountChanged', updatedConnection);
            }
        } catch (error) {
            console.error('Error updating connection:', error);
        }
    }

    // Main connect method
    async connect(walletType: WalletType): Promise<WalletConnection> {
        try {
            let connection: WalletConnection;

            switch (walletType) {
                case WalletType.HASHPACK:
                    connection = await this.connectHashPack();
                    break;
                case WalletType.METAMASK:
                    connection = await this.connectMetaMask();
                    break;
                case WalletType.WALLETCONNECT:
                    connection = await this.connectWalletConnect();
                    break;
                default:
                    throw new Error(`Unsupported wallet type: ${walletType}`);
            }

            return connection;
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            const connection = this.connection;

            // Disconnect from specific wallet
            if (this.connection.type === WalletType.HASHPACK) {
                // HashPack disconnection is handled by WalletConnect
                console.log('Disconnecting HashPack via WalletConnect...');
            } else if (this.connection.type === WalletType.WALLETCONNECT && this.walletConnectProvider) {
                await this.walletConnectProvider.disconnect();
            }

            this.connection = null;
            this.clearSavedConnection();
            this.emit('disconnected', connection);
        }
    }

    getConnection(): WalletConnection | null {
        return this.connection;
    }

    isConnected(): boolean {
        return this.connection !== null;
    }

    async getBalance(): Promise<string> {
        if (!this.connection) {
            throw new Error('No wallet connected');
        }

        try {
            if (this.connection.type === WalletType.HASHPACK) {
                if (this.hederaClient) {
                    const query = new AccountBalanceQuery()
                        .setAccountId(AccountId.fromString(this.connection.accountId));
                    const accountBalance = await query.execute(this.hederaClient);
                    return accountBalance.hbars.toString();
                }
            } else if (this.connection.provider) {
                const balance = await this.connection.provider.getBalance(this.connection.address);
                return ethers.formatEther(balance);
            }

            return this.connection.balance || '0';
        } catch (error) {
            console.error('Error fetching balance:', error);
            return '0';
        }
    }

    async signMessage(message: string): Promise<string> {
        if (!this.connection) {
            throw new Error('No wallet connected');
        }

        try {
            if (this.connection.type === WalletType.HASHPACK) {
                // HashPack signing through WalletConnect
                if (this.hederaWalletConnectProvider) {
                    try {
                        // Use the correct DAppConnector API for signing
                        const signer = this.hederaWalletConnectProvider.getSigner(AccountId.fromString(this.connection.accountId));
                        const signature = await signer.sign([new TextEncoder().encode(message)]);
                        return Buffer.from(signature[0].signature).toString('hex');
                    } catch (error) {
                        console.error('HashPack WalletConnect signing failed:', error);
                        throw new Error('Failed to sign message with HashPack');
                    }
                } else {
                    throw new Error('HashPack WalletConnect provider not available');
                }
            } else if (this.connection.signer) {
                // For MetaMask and other EVM wallets
                const signature = await this.connection.signer.signMessage(message);
                return signature;
            } else {
                throw new Error('No signer available for message signing');
            }
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }

    async sendTransaction(transaction: any): Promise<string> {
        if (!this.connection) {
            throw new Error('No wallet connected');
        }

        try {
            if (this.connection.type === WalletType.HASHPACK) {
                // HashPack transaction signing through WalletConnect
                if (this.hederaWalletConnectProvider) {
                    try {
                        // Use the correct DAppConnector API for transaction signing
                        const signer = this.hederaWalletConnectProvider.getSigner(AccountId.fromString(this.connection.accountId));
                        const signedTransaction = await signer.signTransaction(transaction);
                        if (this.hederaClient) {
                            const result = await signedTransaction.execute(this.hederaClient);
                            return result.transactionId.toString();
                        } else {
                            throw new Error('Hedera client not available');
                        }
                    } catch (error) {
                        console.error('HashPack WalletConnect transaction failed:', error);
                        throw new Error('Failed to send transaction with HashPack');
                    }
                } else {
                    throw new Error('HashPack WalletConnect provider not available');
                }
            } else if (this.connection.signer) {
                // For MetaMask and other EVM wallets
                const tx = await this.connection.signer.sendTransaction(transaction);
                const receipt = await tx.wait();
                if (receipt) {
                    return receipt.hash;
                } else {
                    throw new Error('Transaction receipt is null');
                }
            } else {
                throw new Error('No signer available for transaction signing');
            }
        } catch (error) {
            console.error('Error sending transaction:', error);
            throw error;
        }
    }

    getNetworkInfo(): NetworkConfig | null {
        const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
        return HEDERA_NETWORKS[network] || null;
    }

    // Utility methods
    static isHashPackInstalled(): boolean {
        if (typeof window === 'undefined') return false;

        // HashPack works through WalletConnect, not as a direct extension
        // According to HashPack docs: https://docs.hashpack.app/dapp-developers/walletconnect
        // "HashPack is fully compatible with WalletConnect - either using the native WalletConnect/ReOwn sdk's, or the Hedera WalletConnect wrapper"

        // HashPack is always available through WalletConnect integration
        console.log('HashPack available through WalletConnect integration');
        return true;
    }

    static isMetaMaskInstalled(): boolean {
        if (typeof window === 'undefined') return false;
        return !!window.ethereum?.isMetaMask;
    }

    static getAvailableWallets(): WalletType[] {
        const wallets: WalletType[] = [];

        console.log('Checking HashPack installation...');
        const hashpackInstalled = WalletConnector.isHashPackInstalled();
        console.log('HashPack installed:', hashpackInstalled);

        console.log('Checking MetaMask installation...');
        const metamaskInstalled = WalletConnector.isMetaMaskInstalled();
        console.log('MetaMask installed:', metamaskInstalled);

        // Check HashPack extension
        if (hashpackInstalled) {
            wallets.push(WalletType.HASHPACK);
        }

        // Check MetaMask
        if (metamaskInstalled) {
            wallets.push(WalletType.METAMASK);
        }

        // WalletConnect is always available as a fallback
        wallets.push(WalletType.WALLETCONNECT);

        console.log('Available wallets:', wallets);
        return wallets;
    }

    static formatAddress(address: string): string {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Persistence
    private saveConnection() {
        if (this.connection && typeof window !== 'undefined') {
            localStorage.setItem('talentchain_wallet_connection', JSON.stringify(this.connection));
        }
    }

    private loadSavedConnection() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('talentchain_wallet_connection');
            if (saved) {
                try {
                    this.connection = JSON.parse(saved);
                } catch (error) {
                    console.error('Error loading saved connection:', error);
                    this.clearSavedConnection();
                }
            }
        }
    }

    private clearSavedConnection() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('talentchain_wallet_connection');
        }
    }
}

// Export singleton instance
export const walletConnector = new WalletConnector();
