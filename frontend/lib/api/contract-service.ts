/**
 * Complete contract service aligned with all smart contract functions
 * Perfect 1:1 mapping with backend schemas and contract ABIs
 */

import {
  ContractSkillTokenCreateRequest,
  BatchSkillTokenRequest,
  UpdateSkillLevelRequest,
  RevokeSkillTokenRequest,
  EndorseSkillTokenRequest,
  EndorseSkillTokenWithSignatureRequest,
  RenewSkillTokenRequest,
  ContractJobPoolCreateRequest,
  ContractPoolApplicationRequest,
  SelectCandidateRequest,
  CompletePoolRequest,
  ClosePoolRequest,
  WithdrawApplicationRequest,
  CreateProposalRequest,
  CreateEmergencyProposalRequest,
  CastVoteRequest,
  DelegateVotingPowerRequest,
  GovernanceSettings,
  RegisterOracleRequest,
  SubmitWorkEvaluationRequest,
  UpdateReputationScoreRequest,
  ChallengeEvaluationRequest,
  ResolveChallengeRequest,
  ContractCallResponse,
  ApiResponse,
  PaginatedApiResponse
} from '../types/contracts';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

class ContractService {
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

  // ============ SKILL TOKEN CONTRACT FUNCTIONS ============

  /**
   * SkillToken.mintSkillToken() - matches contract exactly
   */
  async mintSkillToken(request: ContractSkillTokenCreateRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; token_id: number }>('/skills/mint', {
      method: 'POST',
      body: JSON.stringify({
        recipient_address: request.recipientAddress,
        category: request.category,
        subcategory: request.subcategory,
        level: request.level,
        expiry_date: request.expiryDate,
        metadata: request.metadata,
        uri: request.tokenURIData,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'mintSkillToken',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.batchMintSkillTokens() - matches contract exactly
   */
  async batchMintSkillTokens(request: BatchSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; token_ids: number[] }>('/skills/batch-mint', {
      method: 'POST',
      body: JSON.stringify({
        recipient_address: request.recipientAddress,
        categories: request.categories,
        subcategories: request.subcategories,
        levels: request.levels,
        expiry_dates: request.expiryDates,
        metadata_array: request.metadataArray,
        token_uris: request.tokenUris,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'batchMintSkillTokens',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.updateSkillLevel() - matches contract exactly
   */
  async updateSkillLevel(request: UpdateSkillLevelRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/update-level', {
      method: 'PUT',
      body: JSON.stringify({
        token_id: request.tokenId,
        new_level: request.newLevel,
        evidence: request.evidence,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'updateSkillLevel',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.revokeSkillToken() - matches contract exactly
   */
  async revokeSkillToken(request: RevokeSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/revoke', {
      method: 'PUT',
      body: JSON.stringify({
        token_id: request.tokenId,
        reason: request.reason,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'revokeSkillToken',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.endorseSkillToken() - matches contract exactly
   */
  async endorseSkillToken(request: EndorseSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/endorse', {
      method: 'POST',
      body: JSON.stringify({
        token_id: request.tokenId,
        endorsement_data: request.endorsementData,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'endorseSkillToken',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.endorseSkillTokenWithSignature() - matches contract exactly
   */
  async endorseSkillTokenWithSignature(request: EndorseSkillTokenWithSignatureRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/endorse-with-signature', {
      method: 'POST',
      body: JSON.stringify({
        token_id: request.tokenId,
        endorsement_data: request.endorsementData,
        deadline: request.deadline,
        signature: request.signature,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'endorseSkillTokenWithSignature',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.renewSkillToken() - matches contract exactly
   */
  async renewSkillToken(request: RenewSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/renew', {
      method: 'PUT',
      body: JSON.stringify({
        token_id: request.tokenId,
        new_expiry_date: request.newExpiryDate,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'renewSkillToken',
      error: response.error,
      data: response.data,
    };
  }

  // ============ TALENT POOL CONTRACT FUNCTIONS ============

  /**
   * TalentPool.createPool() - matches contract exactly
   */
  async createPool(request: ContractJobPoolCreateRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; pool_id: number }>('/pools/create', {
      method: 'POST',
      body: JSON.stringify({
        title: request.title,
        description: request.description,
        job_type: request.jobType,
        required_skills: request.requiredSkills,
        minimum_levels: request.minimumLevels,
        salary_min: request.salaryMin,
        salary_max: request.salaryMax,
        deadline: request.deadline,
        location: request.location,
        is_remote: request.isRemote,
        stake_amount: request.stakeAmount,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_TALENT_POOL_CONTRACT,
      functionName: 'createPool',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * TalentPool.submitApplication() - matches contract exactly
   */
  async submitApplication(request: ContractPoolApplicationRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/pools/apply', {
      method: 'POST',
      body: JSON.stringify({
        pool_id: request.poolId,
        skill_token_ids: request.skillTokenIds,
        cover_letter: request.coverLetter,
        portfolio: request.portfolio,
        stake_amount: request.stakeAmount,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_TALENT_POOL_CONTRACT,
      functionName: 'submitApplication',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * TalentPool.selectCandidate() - matches contract exactly
   */
  async selectCandidate(request: SelectCandidateRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/pools/select-candidate', {
      method: 'PUT',
      body: JSON.stringify({
        pool_id: request.poolId,
        candidate_address: request.candidateAddress,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_TALENT_POOL_CONTRACT,
      functionName: 'selectCandidate',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * TalentPool.completePool() - matches contract exactly
   */
  async completePool(request: CompletePoolRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/pools/complete', {
      method: 'PUT',
      body: JSON.stringify({
        pool_id: request.poolId,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_TALENT_POOL_CONTRACT,
      functionName: 'completePool',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * TalentPool.closePool() - matches contract exactly
   */
  async closePool(request: ClosePoolRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/pools/close', {
      method: 'PUT',
      body: JSON.stringify({
        pool_id: request.poolId,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_TALENT_POOL_CONTRACT,
      functionName: 'closePool',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * TalentPool.withdrawApplication() - matches contract exactly
   */
  async withdrawApplication(request: WithdrawApplicationRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/pools/withdraw', {
      method: 'PUT',
      body: JSON.stringify({
        pool_id: request.poolId,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_TALENT_POOL_CONTRACT,
      functionName: 'withdrawApplication',
      error: response.error,
      data: response.data,
    };
  }

  // ============ GOVERNANCE CONTRACT FUNCTIONS ============

  /**
   * Governance.createProposal() - matches contract exactly
   */
  async createProposal(request: CreateProposalRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; proposal_id: number }>('/governance/proposals', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'createProposal',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.createEmergencyProposal() - matches contract exactly
   */
  async createEmergencyProposal(request: CreateEmergencyProposalRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; proposal_id: number }>('/governance/emergency-proposals', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'createEmergencyProposal',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.castVote() - matches contract exactly
   */
  async castVote(request: CastVoteRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/vote', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: request.proposalId,
        vote: request.vote,
        reason: request.reason,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'castVote',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.delegate() - matches contract exactly
   */
  async delegateVotingPower(request: DelegateVotingPowerRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/delegate', {
      method: 'POST',
      body: JSON.stringify({
        delegatee_address: request.delegatee,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'delegate',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.updateGovernanceSettings() - matches contract exactly
   */
  async updateGovernanceSettings(request: GovernanceSettings): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/settings', {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'updateGovernanceSettings',
      error: response.error,
      data: response.data,
    };
  }

  // ============ REPUTATION ORACLE CONTRACT FUNCTIONS ============

  /**
   * ReputationOracle.registerOracle() - matches contract exactly
   */
  async registerOracle(request: RegisterOracleRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/reputation/register-oracle', {
      method: 'POST',
      body: JSON.stringify({
        name: request.name,
        specializations: request.specializations,
        stake_amount: request.stakeAmount,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'registerOracle',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * ReputationOracle.submitWorkEvaluation() - matches contract exactly
   */
  async submitWorkEvaluation(request: SubmitWorkEvaluationRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; evaluation_id: number }>('/reputation/submit-evaluation', {
      method: 'POST',
      body: JSON.stringify({
        user_address: request.userAddress,
        skill_token_ids: request.skillTokenIds,
        work_description: request.workDescription,
        work_content: request.workContent,
        overall_score: request.overallScore,
        skill_scores: request.skillScores,
        feedback: request.feedback,
        ipfs_hash: request.ipfsHash,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'submitWorkEvaluation',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * ReputationOracle.updateReputationScore() - matches contract exactly
   */
  async updateReputationScore(request: UpdateReputationScoreRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/reputation/update-score', {
      method: 'PUT',
      body: JSON.stringify({
        user_address: request.userAddress,
        category: request.category,
        new_score: request.newScore,
        evidence: request.evidence,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'updateReputationScore',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * ReputationOracle.challengeEvaluation() - matches contract exactly
   */
  async challengeEvaluation(request: ChallengeEvaluationRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; challenge_id: number }>('/reputation/challenge', {
      method: 'POST',
      body: JSON.stringify({
        evaluation_id: request.evaluationId,
        reason: request.reason,
        stake_amount: request.stakeAmount,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'challengeEvaluation',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * ReputationOracle.resolveChallenge() - matches contract exactly
   */
  async resolveChallenge(request: ResolveChallengeRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/reputation/resolve-challenge', {
      method: 'PUT',
      body: JSON.stringify({
        challenge_id: request.challengeId,
        uphold_original: request.upholdOriginal,
        resolution: request.resolution,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'resolveChallenge',
      error: response.error,
      data: response.data,
    };
  }

  // ============ VIEW FUNCTIONS ============

  async getProposals(page: number = 0, size: number = 20): Promise<PaginatedApiResponse<any>> {
    return this.request(`/governance/proposals?page=${page}&size=${size}`);
  }

  async getProposal(proposalId: number): Promise<ApiResponse<any>> {
    return this.request(`/governance/proposals/${proposalId}`);
  }

  async getVotingPower(address: string): Promise<ApiResponse<{ voting_power: number }>> {
    return this.request(`/governance/voting-power/${address}`);
  }

  async getOracleInfo(address: string): Promise<ApiResponse<any>> {
    return this.request(`/reputation/oracles/${address}`);
  }

  async getActiveOracles(): Promise<ApiResponse<any[]>> {
    return this.request('/reputation/oracles/active');
  }

  async getWorkEvaluations(userId: string, page: number = 0, size: number = 20): Promise<PaginatedApiResponse<any>> {
    return this.request(`/reputation/evaluations/${userId}?page=${page}&size=${size}`);
  }

  async getChallenges(page: number = 0, size: number = 20): Promise<PaginatedApiResponse<any>> {
    return this.request(`/reputation/challenges?page=${page}&size=${size}`);
  }
}

// Export singleton instance
export const contractService = new ContractService();

// Export for convenience
export default contractService;
