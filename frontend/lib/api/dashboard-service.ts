/**
 * Dashboard API service for TalentChain Pro
 * Integrates with FastAPI backend following the established patterns
 */

import {
  DashboardStats,
  SkillTokenInfo,
  JobPoolInfo,
  PoolStatus,
  ApiResponse
} from '../types/wallet';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

class DashboardApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/${API_VERSION}`;
  }

  /**
   * Generic API request handler with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || `HTTP ${response.status}: ${response.statusText}`,
          message: data.message,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Skills API Integration
   */
  async getUserSkillTokens(accountId: string): Promise<ApiResponse<SkillTokenInfo[]>> {
    return this.request<SkillTokenInfo[]>(`/skills?owner_id=${accountId}`);
  }

  async getSkillToken(tokenId: number): Promise<ApiResponse<SkillTokenInfo>> {
    return this.request<SkillTokenInfo>(`/skills/${tokenId}`);
  }

  async createSkillToken(request: {
    to: string;
    skill_category: string;
    level: number;
    uri: string;
    evidence: string;
    description: string;
  }): Promise<ApiResponse<{ transaction_id: string; token_id: number }>> {
    return this.request(`/skills`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateSkillLevel(tokenId: number, request: {
    new_level: number;
    new_uri: string;
    reasoning: string;
  }): Promise<ApiResponse<{ transaction_id: string }>> {
    return this.request(`/skills/${tokenId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async submitWorkEvaluation(request: {
    user_id: string;
    skill_token_id: number;
    work_description: string;
    artifacts: string[];
    self_assessment: Record<string, number>;
  }): Promise<ApiResponse<{
    overall_score: number;
    skill_scores: Record<string, number>;
    feedback: string;
    level_recommendation: number;
  }>> {
    return this.request(`/skills/evaluate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUserReputation(userId: string): Promise<ApiResponse<{
    user_id: string;
    overall_score: number;
    skill_scores: Record<string, number>;
    total_evaluations: number;
    last_updated: string;
  }>> {
    return this.request(`/skills/reputation/${userId}`);
  }

  async getReputationHistory(
    userId: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<{
    items: Array<{
      evaluation_id: string;
      timestamp: string;
      skill_category: string;
      score: number;
      feedback: string;
    }>;
    total: number;
    page: number;
    size: number;
  }>> {
    return this.request(`/skills/reputation/${userId}/history?page=${page}&size=${size}`);
  }

  /**
   * Job Pools API Integration
   */
  async getJobPools(filters?: {
    company_id?: string;
    status?: string;
    skill?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<{
    items: JobPoolInfo[];
    total: number;
    page: number;
    size: number;
  }>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/pools${queryString}`);
  }

  async getJobPool(poolId: number): Promise<ApiResponse<JobPoolInfo>> {
    return this.request<JobPoolInfo>(`/pools/${poolId}`);
  }

  async createJobPool(request: {
    title: string;
    company: string;
    description: string;
    required_skills: number[];
    salary: string;
    duration: number;
    stake_amount: string;
    job_type?: string;
    experience_level?: string;
    location?: string;
    remote?: boolean;
    hybrid?: boolean;
    max_applicants?: number;
    pool_type?: string;
    urgency?: string;
    budget?: string;
    application_deadline?: string;
  }): Promise<ApiResponse<{ transaction_id: string; pool_id: number }>> {
    return this.request(`/pools`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async applyToJobPool(poolId: number, request: {
    skill_token_ids: number[];
  }): Promise<ApiResponse<{ transaction_id: string }>> {
    return this.request(`/pools/${poolId}/join`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async leaveJobPool(poolId: number): Promise<ApiResponse<{ transaction_id: string }>> {
    return this.request(`/pools/${poolId}/leave`, {
      method: 'POST',
    });
  }

  async makeJobMatch(poolId: number, request: {
    candidate: string;
  }): Promise<ApiResponse<{ transaction_id: string }>> {
    return this.request(`/pools/${poolId}/match`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPoolCandidates(poolId: number): Promise<ApiResponse<Array<{
    candidate: string;
    skill_tokens: number[];
    applied_at: string;
    reputation_score: number;
  }>>> {
    return this.request(`/pools/${poolId}/candidates`);
  }

  /**
   * MCP (AI) API Integration
   */
  async searchTalents(request: {
    query: string;
    min_level?: number;
    skill_categories?: string[];
  }): Promise<ApiResponse<{
    candidates: Array<{
      user_id: string;
      skill_tokens: number[];
      reputation_score: number;
      match_score: number;
    }>;
    total_matches: number;
  }>> {
    return this.request(`/mcp/search`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async evaluateMatch(request: {
    job_requirements: string;
    candidate_skills: Array<{
      category: string;
      level: number;
      experience: string;
    }>;
  }): Promise<ApiResponse<{
    match_score: number;
    strengths: string[];
    gaps: string[];
    recommendation: string;
  }>> {
    return this.request(`/mcp/evaluate-match`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async queryMCP(request: {
    query: string;
    context?: Record<string, any>;
  }): Promise<ApiResponse<{
    response: string;
    confidence: number;
    sources: string[];
  }>> {
    return this.request(`/mcp/query`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Dashboard aggregated data
   */
  async getDashboardStats(accountId: string): Promise<ApiResponse<DashboardStats>> {
    try {
      // Fetch data in parallel for better performance
      const [skillsResponse, poolsResponse, reputationResponse] = await Promise.all([
        this.getUserSkillTokens(accountId),
        this.getJobPools({ company_id: accountId }), // User's created pools
        this.getUserReputation(accountId),
      ]);

      if (!skillsResponse.success) {
        throw new Error(skillsResponse.error || 'Failed to fetch skills');
      }

      const skills = skillsResponse.data || [];
      const pools = poolsResponse.success ? (poolsResponse.data?.items || []) : [];
      const reputation = reputationResponse.success ? reputationResponse.data : null;

      // Calculate active applications (pools user has applied to)
      const activeApplicationsResponse = await this.getJobPools({
        page: 0,
        size: 100 // Get more to filter properly
      });

      let activeApplications = 0;
      if (activeApplicationsResponse.success && activeApplicationsResponse.data) {
        // This would need backend support to filter by applicant
        // For now, we'll use a placeholder
        activeApplications = 3; // Mock value
      }

      const stats: DashboardStats = {
        totalSkillTokens: skills.length,
        totalJobPools: pools.length,
        activeApplications,
        completedMatches: pools.filter(p => p.status === PoolStatus.Completed).length, // Completed status
        reputationScore: reputation?.overall_score || 0,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
      };
    }
  }
}

// Export singleton instance
export const dashboardApi = new DashboardApiService();

// Export individual methods for convenience
export const {
  getUserSkillTokens,
  getSkillToken,
  createSkillToken,
  updateSkillLevel,
  submitWorkEvaluation,
  getUserReputation,
  getReputationHistory,
  getJobPools,
  getJobPool,
  createJobPool,
  applyToJobPool,
  leaveJobPool,
  makeJobMatch,
  getPoolCandidates,
  searchTalents,
  evaluateMatch,
  queryMCP,
  getDashboardStats,
} = dashboardApi;