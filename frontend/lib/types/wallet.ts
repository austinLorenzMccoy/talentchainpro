/**
 * Wallet and Hedera integration types for TalentChain Pro
 */

// Wallet Types
export enum WalletType {
  HASHPACK = 'hashpack',
  METAMASK = 'metamask',
  WALLETCONNECT = 'walletconnect'
}

// Wallet Connection Interface
export interface WalletConnection {
  type: WalletType;
  accountId: string;
  address: string;
  signer?: any;
  provider?: any;
  balance?: string;
  network?: string;
  chainId?: number;
}

// Hedera Network Names (union type for keys)
export type HederaNetworkName = 'testnet' | 'mainnet' | 'previewnet';

// Hedera Network Configuration
export interface HederaNetwork {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Network Config (for compatibility with existing code)
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  mirrorNodeUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
}

// Network Configurations
export const HEDERA_NETWORKS: Record<string, HederaNetwork> = {
  testnet: {
    name: 'Hedera Testnet',
    chainId: 296,
    rpcUrl: 'https://testnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/testnet',
    currency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18
    }
  },
  mainnet: {
    name: 'Hedera Mainnet',
    chainId: 295,
    rpcUrl: 'https://mainnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/mainnet',
    currency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18
    }
  }
};

// Transaction Result
export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  receipt?: any;
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Skill Token Types
export interface SkillToken {
  id: string;
  owner: string;
  skill: string;
  level: number;
  metadata: {
    name: string;
    description: string;
    image?: string;
    attributes?: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

// Skill Token Info (for dashboard components)
export interface SkillTokenInfo {
  tokenId: number;
  category: string;
  level: number;
  uri: string;
  owner: string;
}

// Talent Pool Types
export interface TalentPool {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  duration: number;
  status: 'open' | 'closed' | 'in-progress';
  createdAt: string;
  updatedAt: string;
}

// Job Pool Info (for dashboard components)
export interface JobPoolInfo {
  id: number;
  title: string;
  company: string;
  description: string;
  requiredSkills: number[];
  salary: string;
  duration: number;
  stakeAmount: string;
  status: PoolStatus;
  applicants: string[];
  createdAt: number;
}

// Pool Status Enum
export enum PoolStatus {
  Active = 'active',
  Completed = 'completed',
  Paused = 'paused',
  Cancelled = 'cancelled'
}

// Dashboard Stats
export interface DashboardStats {
  totalSkillTokens: number;
  totalJobPools: number;
  activeApplications: number;
  completedMatches: number;
  reputationScore: number;
}

// User Profile Types
export interface UserProfile {
  id: string;
  walletAddress: string;
  name?: string;
  email?: string;
  skills: string[];
  experience: number;
  reputation: number;
  completedProjects: number;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Data Types
export interface DashboardData {
  user: UserProfile;
  skillTokens: SkillToken[];
  activeApplications: any[];
  completedMatches: any[];
  reputationScore: number;
  totalEarnings: number;
}

// Contract Interaction Types
export interface ContractCall {
  functionName: string;
  parameters: any[];
  value?: string;
  gasLimit?: number;
}

export interface ContractCallResult {
  success: boolean;
  transactionId?: string;
  gasUsed?: number;
  error?: string;
  data?: any;
}

// Wallet Event Types
export interface WalletEvent {
  type: 'connected' | 'disconnected' | 'accountChanged' | 'networkChanged';
  data?: any;
  timestamp: number;
}