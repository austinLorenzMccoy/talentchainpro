/**
 * Wallet and Hedera integration types for TalentChain Pro
 */

export type HederaNetwork = 'testnet' | 'mainnet' | 'previewnet';

export type WalletType = 'hashpack' | 'metamask' | 'blade' | 'walletconnect';

export interface WalletConnection {
  walletType: WalletType;
  isConnected: boolean;
  accountId: string;
  evmAddress?: string;
  balance: string;
  network: HederaNetwork;
  publicKey?: string;
  metadata?: {
    name?: string;
    icon?: string;
  };
}

export interface UseWalletReturn {
  wallet: WalletConnection | null;
  isConnecting: boolean;
  error: string | null;
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  isHashPackAvailable: boolean;
  isMetaMaskAvailable: boolean;
  isBladeAvailable: boolean;
  switchNetwork: (network: HederaNetwork) => Promise<void>;
}

export interface ContractCallResult {
  success: boolean;
  data?: any;
  error?: string;
  transactionId?: string;
}

export interface SkillTokenInfo {
  tokenId: number;
  category: string;
  level: number;
  uri: string;
  owner: string;
}

export interface JobPoolInfo {
  id: number;
  company: string;
  description: string;
  requiredSkills: number[];
  stakeAmount: string;
  salary: string;
  status: PoolStatus;
  applicants: string[];
  selectedCandidate: string;
  createdAt: number;
  deadline: number;
}

export enum PoolStatus {
  Active = 0,
  Paused = 1,
  Completed = 2,
  Cancelled = 3
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  receipt?: any;
  error?: string;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  mirrorNodeUrl: string;
}

export interface WalletError extends Error {
  code?: string;
  data?: any;
}

// Smart Contract Interaction Types
export interface ContractFunction {
  name: string;
  parameters?: any[];
  gasLimit?: number;
  payableAmount?: string;
}

export interface SmartContractCall {
  contractId: string;
  functionName: string;
  parameters?: any[];
  gasLimit?: number;
  maxTransactionFee?: string;
}

// Skill Token specific types
export interface CreateSkillTokenRequest {
  to: string;
  skillCategory: string;
  level: number;
  uri: string;
}

export interface UpdateSkillLevelRequest {
  tokenId: number;
  newLevel: number;
  newUri: string;
}

// Job Pool specific types
export interface CreateJobPoolRequest {
  description: string;
  requiredSkills: number[];
  salary: string;
  duration: number; // in seconds
  stakeAmount: string; // in HBAR
}

export interface ApplyToPoolRequest {
  poolId: number;
  skillTokenIds: number[];
}

export interface MakeMatchRequest {
  poolId: number;
  candidate: string;
}

// Dashboard Types
export interface DashboardStats {
  totalSkillTokens: number;
  totalJobPools: number;
  activeApplications: number;
  completedMatches: number;
  reputationScore: number;
}

export interface UserProfile {
  accountId: string;
  evmAddress?: string;
  name?: string;
  avatar?: string;
  skillTokens: SkillTokenInfo[];
  applications: number[];
  matches: number[];
  reputation: number;
  createdAt: number;
}

export interface CompanyProfile {
  accountId: string;
  evmAddress?: string;
  name: string;
  logo?: string;
  description?: string;
  jobPools: number[];
  totalMatches: number;
  reputation: number;
  createdAt: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Event types for real-time updates
export interface SkillTokenEvent {
  eventType: 'mint' | 'update' | 'transfer';
  tokenId: number;
  from?: string;
  to?: string;
  data: any;
  blockNumber: number;
  transactionId: string;
}

export interface JobPoolEvent {
  eventType: 'created' | 'applied' | 'matched' | 'completed' | 'cancelled';
  poolId: number;
  company?: string;
  candidate?: string;
  data: any;
  blockNumber: number;
  transactionId: string;
}