/**
 * Custom hooks for dashboard data management with caching and error handling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DashboardStats, 
  SkillTokenInfo, 
  JobPoolInfo, 
  ApiResponse,
  TransactionResult
} from '@/lib/types/wallet';
import { dashboardApi } from '@/lib/api/dashboard-service';
import { useAuth } from './useAuth';
import { useDashboardRealtimeSync } from './useRealTimeUpdates';

interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  skillTokens: SkillTokenInfo[];
  jobPools: JobPoolInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseSkillTokensReturn {
  skillTokens: SkillTokenInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSkillToken: (data: any) => Promise<TransactionResult>;
  updateSkillLevel: (tokenId: number, data: any) => Promise<TransactionResult>;
}

interface UseJobPoolsReturn {
  jobPools: JobPoolInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createJobPool: (data: any) => Promise<TransactionResult>;
  applyToPool: (poolId: number, skillTokenIds: number[]) => Promise<TransactionResult>;
  leavePool: (poolId: number) => Promise<TransactionResult>;
}

/**
 * Main dashboard data hook - aggregates all dashboard information
 */
export function useDashboardData(): UseDashboardDataReturn {
  const { user, isConnected } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [skillTokens, setSkillTokens] = useState<SkillTokenInfo[]>([]);
  const [jobPools, setJobPools] = useState<JobPoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!isConnected || !user?.accountId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch dashboard stats
      const statsResponse = await dashboardApi.getDashboardStats(user.accountId);
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        throw new Error(statsResponse.error || 'Failed to fetch dashboard stats');
      }

      // Fetch skill tokens
      const skillsResponse = await dashboardApi.getUserSkillTokens(user.accountId);
      if (skillsResponse.success && skillsResponse.data) {
        setSkillTokens(skillsResponse.data);
      } else {
        console.warn('Failed to fetch skill tokens:', skillsResponse.error);
        setSkillTokens([]);
      }

      // Fetch job pools (both created by user and applied to)
      const poolsResponse = await dashboardApi.getJobPools({ page: 0, size: 20 });
      if (poolsResponse.success && poolsResponse.data) {
        setJobPools(poolsResponse.data.items);
      } else {
        console.warn('Failed to fetch job pools:', poolsResponse.error);
        setJobPools([]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, user?.accountId]);

  // Auto-fetch on wallet connection
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates integration
  useDashboardRealtimeSync(fetchDashboardData, [fetchDashboardData]);

  // Auto-refresh every 30 seconds when tab is visible (backup to real-time updates)
  useEffect(() => {
    if (!isConnected) return;

    let intervalId: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected) {
        intervalId = setInterval(fetchDashboardData, 60000); // Reduced to 60 seconds since we have real-time updates
      } else {
        clearInterval(intervalId);
      }
    };

    // Initial setup
    if (!document.hidden) {
      intervalId = setInterval(fetchDashboardData, 60000);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, fetchDashboardData]);

  return {
    stats,
    skillTokens,
    jobPools,
    isLoading,
    error,
    refetch: fetchDashboardData,
    lastUpdated,
  };
}

/**
 * Skill tokens specific hook with CRUD operations
 */
export function useSkillTokens(): UseSkillTokensReturn {
  const { user, isConnected } = useAuth();
  const [skillTokens, setSkillTokens] = useState<SkillTokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkillTokens = useCallback(async () => {
    if (!isConnected || !user?.accountId) {
      setSkillTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getUserSkillTokens(user.accountId);
      if (response.success && response.data) {
        setSkillTokens(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch skill tokens');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch skill tokens';
      setError(errorMessage);
      console.error('Skill tokens fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, user?.accountId]);

  const createSkillToken = useCallback(async (data: {
    skill_category: string;
    level: number;
    uri: string;
    evidence: string;
    description: string;
  }): Promise<TransactionResult> => {
    if (!user?.accountId) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const response = await dashboardApi.createSkillToken({
        to: user.accountId,
        ...data,
      });

      if (response.success && response.data) {
        // Optimistically update the local state
        const newToken: SkillTokenInfo = {
          tokenId: response.data.token_id,
          category: data.skill_category,
          level: data.level,
          uri: data.uri,
          owner: user.accountId,
        };
        setSkillTokens(prev => [...prev, newToken]);

        return {
          success: true,
          transactionId: response.data.transaction_id,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to create skill token',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create skill token',
      };
    }
  }, [user?.accountId]);

  const updateSkillLevel = useCallback(async (
    tokenId: number, 
    data: { new_level: number; new_uri: string; reasoning: string }
  ): Promise<TransactionResult> => {
    try {
      const response = await dashboardApi.updateSkillLevel(tokenId, data);

      if (response.success && response.data) {
        // Optimistically update the local state
        setSkillTokens(prev => 
          prev.map(token => 
            token.tokenId === tokenId 
              ? { ...token, level: data.new_level, uri: data.new_uri }
              : token
          )
        );

        return {
          success: true,
          transactionId: response.data.transaction_id,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to update skill level',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update skill level',
      };
    }
  }, []);

  useEffect(() => {
    fetchSkillTokens();
  }, [fetchSkillTokens]);

  // Real-time updates for skill tokens
  useDashboardRealtimeSync(fetchSkillTokens, [fetchSkillTokens]);

  return {
    skillTokens,
    isLoading,
    error,
    refetch: fetchSkillTokens,
    createSkillToken,
    updateSkillLevel,
  };
}

/**
 * Job pools specific hook with application operations
 */
export function useJobPools(): UseJobPoolsReturn {
  const { user, isConnected } = useAuth();
  const [jobPools, setJobPools] = useState<JobPoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobPools = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await dashboardApi.getJobPools({ page: 0, size: 50 });
      if (response.success && response.data) {
        setJobPools(response.data.items);
      } else {
        throw new Error(response.error || 'Failed to fetch job pools');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job pools';
      setError(errorMessage);
      console.error('Job pools fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createJobPool = useCallback(async (data: {
    description: string;
    required_skills: number[];
    salary: string;
    duration: number;
    stake_amount: string;
  }): Promise<TransactionResult> => {
    try {
      const response = await dashboardApi.createJobPool(data);

      if (response.success && response.data) {
        // Refresh the pools list
        fetchJobPools();

        return {
          success: true,
          transactionId: response.data.transaction_id,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to create job pool',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create job pool',
      };
    }
  }, [fetchJobPools]);

  const applyToPool = useCallback(async (
    poolId: number, 
    skillTokenIds: number[]
  ): Promise<TransactionResult> => {
    try {
      const response = await dashboardApi.applyToJobPool(poolId, { skill_token_ids: skillTokenIds });

      if (response.success && response.data) {
        // Update the pool in local state to show the application
        setJobPools(prev =>
          prev.map(pool =>
            pool.id === poolId
              ? { ...pool, applicants: [...pool.applicants, user?.accountId || ''] }
              : pool
          )
        );

        return {
          success: true,
          transactionId: response.data.transaction_id,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to apply to job pool',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to apply to job pool',
      };
    }
  }, [user?.accountId]);

  const leavePool = useCallback(async (poolId: number): Promise<TransactionResult> => {
    try {
      const response = await dashboardApi.leaveJobPool(poolId);

      if (response.success && response.data) {
        // Update the pool in local state to remove the application
        setJobPools(prev =>
          prev.map(pool =>
            pool.id === poolId
                              ? {
                    ...pool,
                    applicants: pool.applicants.filter(addr => addr !== user?.accountId),
                  }
              : pool
          )
        );

        return {
          success: true,
          transactionId: response.data.transaction_id,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to leave job pool',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to leave job pool',
      };
    }
  }, [user?.accountId]);

  useEffect(() => {
    fetchJobPools();
  }, [fetchJobPools]);

  // Real-time updates for job pools
  useDashboardRealtimeSync(fetchJobPools, [fetchJobPools]);

  return {
    jobPools,
    isLoading,
    error,
    refetch: fetchJobPools,
    createJobPool,
    applyToPool,
    leavePool,
  };
}

/**
 * Reputation data hook
 */
export function useReputation(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.accountId;
  
  const [reputation, setReputation] = useState<{
    overall_score: number;
    skill_scores: Record<string, number>;
    total_evaluations: number;
    last_updated: string;
  } | null>(null);
  
  const [history, setHistory] = useState<Array<{
    evaluation_id: string;
    timestamp: string;
    skill_category: string;
    score: number;
    feedback: string;
  }>>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    if (!targetUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [reputationResponse, historyResponse] = await Promise.all([
        dashboardApi.getUserReputation(targetUserId),
        dashboardApi.getReputationHistory(targetUserId, 0, 20),
      ]);

      if (reputationResponse.success && reputationResponse.data) {
        setReputation(reputationResponse.data);
      }

      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data.items);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reputation data';
      setError(errorMessage);
      console.error('Reputation fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  return {
    reputation,
    history,
    isLoading,
    error,
    refetch: fetchReputation,
  };
}