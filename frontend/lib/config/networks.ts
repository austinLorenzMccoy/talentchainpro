/**
 * Network configuration for Hedera networks
 */

import { HederaNetworkName, NetworkConfig } from '../types/wallet';

export const NETWORK_CONFIGS: Record<HederaNetworkName, NetworkConfig> = {
  testnet: {
    name: 'Hedera Testnet',
    chainId: 296,
    rpcUrl: 'https://testnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/testnet',
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    currency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrl: 'https://hashscan.io/testnet',
  },
  mainnet: {
    name: 'Hedera Mainnet',
    chainId: 295,
    rpcUrl: 'https://mainnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/mainnet',
    mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
    currency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrl: 'https://hashscan.io/mainnet',
  },
  previewnet: {
    name: 'Hedera Previewnet',
    chainId: 297,
    rpcUrl: 'https://previewnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/previewnet',
    mirrorNodeUrl: 'https://previewnet.mirrornode.hedera.com',
    currency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrl: 'https://hashscan.io/previewnet',
  },
};

export const DEFAULT_NETWORK: HederaNetworkName = 
  (process.env.NEXT_PUBLIC_HEDERA_NETWORK as HederaNetworkName) || 'testnet';

export const CONTRACT_ADDRESSES = {
  SKILL_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_SKILLTOKEN || '',
  TALENT_POOL: process.env.NEXT_PUBLIC_CONTRACT_TALENTPOOL || '',
};

export const APP_CONFIG = {
  name: 'TalentChain Pro',
  description: 'Blockchain-verified skills, AI reputation oracles, and decentralized job matching',
  version: '1.0.0',
  network: DEFAULT_NETWORK,
  contracts: CONTRACT_ADDRESSES,
};

export const CONTRACT_CONSTANTS = {
  GAS_LIMIT: 300000,
  MAX_TRANSACTION_FEE: 5, // HBAR
  QUERY_PAYMENT: 0.1, // HBAR
  MAX_SKILL_LEVEL: 10,
  MIN_SKILL_LEVEL: 1,
  PLATFORM_FEE_RATE: 250, // 2.5%
};

export const WALLET_CONFIG = {
  HASHPACK: {
    appMetadata: {
      name: APP_CONFIG.name,
      description: APP_CONFIG.description,
      icon: '/icons/logo.svg',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
  METAMASK: {
    networkParams: {
      chainId: `0x${NETWORK_CONFIGS[DEFAULT_NETWORK].chainId.toString(16)}`,
      chainName: NETWORK_CONFIGS[DEFAULT_NETWORK].name,
      rpcUrls: [NETWORK_CONFIGS[DEFAULT_NETWORK].rpcUrl],
      blockExplorerUrls: [NETWORK_CONFIGS[DEFAULT_NETWORK].explorerUrl],
      nativeCurrency: {
        name: 'HBAR',
        symbol: 'HBAR',
        decimals: 18,
      },
    },
  },
  WALLETCONNECT: {
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
    metadata: {
      name: APP_CONFIG.name,
      description: APP_CONFIG.description,
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      icons: ['/icons/logo.svg'],
    },
  },
};

export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  SKILLS: '/skills',
  POOLS: '/pools',
  MCP: '/mcp',
  AUTH: '/auth',
  PROFILE: '/profile',
};

// Utility functions
export const getNetworkConfig = (network: HederaNetworkName): NetworkConfig => {
  return NETWORK_CONFIGS[network];
};

export const isValidNetwork = (network: string): network is HederaNetworkName => {
  return Object.keys(NETWORK_CONFIGS).includes(network as HederaNetworkName);
};

export const formatAccountId = (accountId: string): string => {
  // Convert EVM address to Hedera account ID if needed
  if (accountId.startsWith('0x')) {
    // This would need proper conversion logic
    return accountId;
  }
  return accountId;
};

export const getContractExplorerUrl = (contractId: string, network: HederaNetworkName = DEFAULT_NETWORK): string => {
  const config = getNetworkConfig(network);
  return `${config.explorerUrl}/contract/${contractId}`;
};

export const getTransactionExplorerUrl = (transactionId: string, network: HederaNetworkName = DEFAULT_NETWORK): string => {
  const config = getNetworkConfig(network);
  return `${config.explorerUrl}/transaction/${transactionId}`;
};

export const getAccountExplorerUrl = (accountId: string, network: HederaNetworkName = DEFAULT_NETWORK): string => {
  const config = getNetworkConfig(network);
  return `${config.explorerUrl}/account/${accountId}`;
};