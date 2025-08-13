/**
 * Hedera SDK client utilities for TalentChain Pro
 */

import {
  Client,
  AccountId,
  ContractId,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} from '@hashgraph/sdk';

import { HederaNetworkName, ContractCallResult, TransactionResult } from '../types/wallet';
import { getNetworkConfig, APP_CONFIG, CONTRACT_CONSTANTS } from '../config/networks';

/**
 * Create a Hedera client for the specified network
 */
export const createHederaClient = (network: HederaNetworkName = APP_CONFIG.network): Client => {
  switch (network) {
    case 'mainnet':
      return Client.forMainnet();
    case 'previewnet':
      return Client.forPreviewnet();
    case 'testnet':
    default:
      return Client.forTestnet();
  }
};

/**
 * Query contract function (read-only)
 */
export const queryContract = async (
  contractId: string,
  functionName: string,
  parameters?: ContractFunctionParameters,
  network: HederaNetworkName = APP_CONFIG.network
): Promise<ContractCallResult> => {
  console.log(`🔍 Querying contract ${contractId} function ${functionName} on ${network}`);
  const client = createHederaClient(network);

  try {
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(contractId))
      .setGas(100000)
      .setFunction(functionName, parameters);

    console.log('⏳ Executing contract query...');
    const result = await query.execute(client);
    console.log('✅ Contract query successful');

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`❌ Contract query failed for ${functionName} on contract ${contractId}:`, error);

    const errorMessage = parseHederaError(error);
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    client.close();
  }
};

/**
 * Execute contract function via wallet (requires wallet signature)
 */
export const executeContractWithWallet = async (
  contractId: string,
  functionName: string,
  parameters?: ContractFunctionParameters,
  gasLimit: number = CONTRACT_CONSTANTS.GAS_LIMIT,
  payableAmount?: string,
  walletInterface?: any // HashPack or other wallet interface
): Promise<TransactionResult> => {
  try {
    if (!walletInterface) {
      return {
        success: false,
        error: 'Wallet not connected. Please connect your wallet first.',
      };
    }

    console.log(`🔄 Executing contract function ${functionName} on ${contractId}`);

    // Create transaction
    const transaction = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(gasLimit)
      .setFunction(functionName, parameters)
      .setMaxTransactionFee(new Hbar(CONTRACT_CONSTANTS.MAX_TRANSACTION_FEE));

    // Add payable amount if specified
    if (payableAmount) {
      transaction.setPayableAmount(Hbar.fromString(payableAmount));
    }

    // Execute transaction via wallet
    console.log('⏳ Submitting transaction via wallet...');
    const result = await walletInterface.executeTransaction(transaction);
    
    console.log('✅ Transaction submitted successfully');
    return {
      success: true,
      transactionId: result.transactionId?.toString(),
      receipt: result.receipt,
    };

  } catch (error) {
    console.error(`❌ Contract execution failed for ${functionName}:`, error);
    return {
      success: false,
      error: parseHederaError(error),
    };
  }
};

/**
 * Get SkillToken contract information
 */
export const getSkillTokenInfo = async (
  tokenId: number,
  contractId: string = APP_CONFIG.contracts.SKILL_TOKEN,
  network: HederaNetworkName = APP_CONFIG.network
) => {
  const parameters = new ContractFunctionParameters().addUint256(tokenId);
  const result = await queryContract(contractId, 'getSkillInfo', parameters, network);

  if (result.success && result.data) {
    try {
      return {
        success: true,
        data: {
          category: result.data.getString(0),
          level: result.data.getUint256(1).toNumber(),
          uri: result.data.getString(2),
        },
      };
    } catch (error) {
      console.error('Failed to parse skill token info:', error);
      return { success: false, error: 'Failed to parse skill token information' };
    }
  }

  return result;
};

/**
 * Get JobPool information
 */
export const getJobPoolInfo = async (
  poolId: number,
  contractId: string = APP_CONFIG.contracts.TALENT_POOL,
  network: HederaNetworkName = APP_CONFIG.network
) => {
  const parameters = new ContractFunctionParameters().addUint256(poolId);
  const result = await queryContract(contractId, 'getPool', parameters, network);

  if (result.success && result.data) {
    try {
      return {
        success: true,
        data: {
          company: result.data.getAddress(0),
          description: result.data.getString(1),
          requiredSkills: result.data.getUint256Array(2).map((n: any) => n.toNumber()),
          stakeAmount: result.data.getUint256(3).toString(),
          salary: result.data.getUint256(4).toString(),
          status: result.data.getUint256(5).toNumber(),
          applicants: result.data.getAddressArray(6),
          selectedCandidate: result.data.getAddress(7),
          createdAt: result.data.getUint256(8).toNumber(),
          deadline: result.data.getUint256(9).toNumber(),
        },
      };
    } catch (error) {
      console.error('Failed to parse job pool info:', error);
      return { success: false, error: 'Failed to parse job pool information' };
    }
  }

  return result;
};

/**
 * Get total number of pools
 */
export const getPoolCount = async (
  contractId: string = APP_CONFIG.contracts.TALENT_POOL,
  network: HederaNetworkName = APP_CONFIG.network
): Promise<number | null> => {
  const result = await queryContract(contractId, 'getPoolCount', undefined, network);
  
  if (result.success && result.data) {
    try {
      return result.data.getUint256(0).toNumber();
    } catch (error) {
      console.error('Failed to parse pool count:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Get user applications
 */
export const getUserApplications = async (
  userAddress: string,
  contractId: string = APP_CONFIG.contracts.TALENT_POOL,
  network: HederaNetworkName = APP_CONFIG.network
) => {
  const parameters = new ContractFunctionParameters().addAddress(userAddress);
  const result = await queryContract(contractId, 'getUserApplications', parameters, network);

  if (result.success && result.data) {
    try {
      return {
        success: true,
        data: result.data.getUint256Array(0).map((n: any) => n.toNumber()),
      };
    } catch (error) {
      console.error('Failed to parse user applications:', error);
      return { success: false, error: 'Failed to parse user applications' };
    }
  }

  return result;
};

/**
 * Error handling utilities
 */
export const parseHederaError = (error: any): string => {
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Common Hedera error patterns
    if (message.includes('insufficient_account_balance')) {
      return 'Insufficient HBAR balance for transaction';
    }
    if (message.includes('contract_revert_executed')) {
      return 'Contract execution reverted. Please check the transaction parameters.';
    }
    if (message.includes('invalid_contract_id')) {
      return 'Invalid contract ID. Please check if the contract is deployed correctly.';
    }
    if (message.includes('timeout')) {
      return 'Transaction timeout. Please try again.';
    }
    if (message.includes('max_gas_limit_exceeded')) {
      return 'Gas limit exceeded. Please try with a higher gas limit.';
    }
    if (message.includes('consensus_timeout')) {
      return 'Network consensus timeout. Please try again.';
    }
    
    return error.message;
  }
  
  return 'Unknown error occurred';
};

/**
 * Retry mechanism for network calls
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i < maxRetries - 1) {
        console.log(`Retry attempt ${i + 1}/${maxRetries} after error:`, error);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
};

/**
 * Validate contract ID format
 */
export const validateContractId = (contractId: string): boolean => {
  try {
    ContractId.fromString(contractId);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate account ID format
 */
export const validateAccountId = (accountId: string): boolean => {
  try {
    AccountId.fromString(accountId);
    return true;
  } catch {
    return false;
  }
};

/**
 * Convert HBAR to tinybars
 */
export const hbarToTinybars = (hbar: number): number => {
  return Math.floor(hbar * 100_000_000);
};

/**
 * Convert tinybars to HBAR
 */
export const tinybarsToHbar = (tinybars: number): number => {
  return tinybars / 100_000_000;
};

/**
 * Format HBAR amount for display
 */
export const formatHbarAmount = (amount: number, decimals: number = 2): string => {
  return `${amount.toFixed(decimals)} ℏ`;
};

/**
 * Create contract function parameters for different operations
 */
export const createSkillTokenParams = {
  mint: (to: string, category: string, level: number, uri: string) => {
    return new ContractFunctionParameters()
      .addAddress(to)
      .addString(category)
      .addUint8(level)
      .addString(uri);
  },
  
  updateLevel: (tokenId: number, newLevel: number, newUri: string) => {
    return new ContractFunctionParameters()
      .addUint256(tokenId)
      .addUint8(newLevel)
      .addString(newUri);
  },
};

export const createTalentPoolParams = {
  createPool: (description: string, requiredSkills: number[], salary: string, duration: number) => {
    return new ContractFunctionParameters()
      .addString(description)
      .addUint256Array(requiredSkills)
      .addUint256(parseInt(salary))
      .addUint256(duration);
  },
  
  applyToPool: (poolId: number, skillTokenIds: number[]) => {
    return new ContractFunctionParameters()
      .addUint256(poolId)
      .addUint256Array(skillTokenIds);
  },
  
  makeMatch: (poolId: number, candidate: string) => {
    return new ContractFunctionParameters()
      .addUint256(poolId)
      .addAddress(candidate);
  },
};