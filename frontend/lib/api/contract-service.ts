/**
 * Complete contract service aligned with all smart contract functions
 * Perfect 1:1 mapping with backend schemas and contract ABIs
 */

import {
  ContractSkillTokenCreateRequest,
  BatchSkillTokenRequest,
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
  CastVoteRequest,
  DelegateVotingPowerRequest,
  RegisterOracleRequest,
  SubmitWorkEvaluationRequest,
  UpdateReputationScoreRequest,
  ChallengeEvaluationRequest,
  ResolveChallengeRequest,
  ContractCallResponse,
  ApiResponse,
  PaginatedApiResponse,
  GovernanceProposal
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
   * SkillToken.mint() - matches contract exactly
   */
  async mintSkillToken(request: ContractSkillTokenCreateRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; token_id: number }>('/skills/mint', {
      method: 'POST',
      body: JSON.stringify({
        recipient: request.recipientAddress,
        skill_name: request.category,
        level: request.level,
        metadata: request.metadata,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'mint',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.batchMint() - matches contract exactly
   */
  async batchMintSkillTokens(request: BatchSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string; token_ids: number[] }>('/skills/batch-mint', {
      method: 'POST',
      body: JSON.stringify({
        recipients: request.recipients,
        skill_names: request.skillNames,
        levels: request.levels,
        metadata_array: request.metadataArray,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'batchMint',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.endorse() - matches contract exactly
   */
  async endorseSkillToken(request: EndorseSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/endorse', {
      method: 'POST',
      body: JSON.stringify({
        token_id: request.tokenId,
        endorsement: request.endorsementData,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'endorse',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.endorseWithSignature() - matches contract exactly
   */
  async endorseSkillTokenWithSignature(request: EndorseSkillTokenWithSignatureRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/endorse-with-signature', {
      method: 'POST',
      body: JSON.stringify({
        token_id: request.tokenId,
        endorsement: request.endorsementData,
        deadline: request.deadline,
        signature: request.signature,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'endorseWithSignature',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.renew() - matches contract exactly
   */
  async renewSkillToken(request: RenewSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/renew', {
      method: 'POST',
      body: JSON.stringify({
        token_id: request.tokenId,
        new_expiry_date: request.newExpiryDate,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'renew',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * SkillToken.revoke() - matches contract exactly
   */
  async revokeSkillToken(request: RevokeSkillTokenRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/skills/revoke', {
      method: 'POST',
      body: JSON.stringify({
        token_id: request.tokenId,
        reason: request.reason,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_SKILL_TOKEN_CONTRACT,
      functionName: 'revoke',
      error: response.error,
      data: response.data,
    };
  }

  // ============ TALENT POOL CONTRACT FUNCTIONS ============

  /**
   * TalentPool.createPool() - matches contract exactly
   */
  async createPool(request: ContractJobPoolCreateRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ pool_id: number }>('/pools/create', {
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
      transactionId: (response.data as Record<string, unknown>)?.transaction_id as string,
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
    const response = await this.request<{ transaction_id: string }>(`/pools/${request.poolId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        applicant: request.applicantAddress,
        expected_salary: request.expectedSalary,
        availability_date: request.availabilityDate,
        cover_letter: request.coverLetter,
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
    const response = await this.request<{ transaction_id: string }>(`/pools/${request.poolId}/select-candidate`, {
      method: 'POST',
      body: JSON.stringify({
        selected_candidate: request.candidateAddress,
        selection_reason: request.selectionReason,
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
    const response = await this.request<{ transaction_id: string }>(`/pools/${request.poolId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        completion_notes: request.completionNotes,
        final_rating: request.finalRating,
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
    const response = await this.request<{ transaction_id: string }>(`/pools/${request.poolId}/close`, {
      method: 'POST',
      body: JSON.stringify({
        closure_reason: request.closureReason,
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
    const response = await this.request<{ transaction_id: string }>(`/pools/${request.poolId}/applications/${request.applicantAddress}`, {
      method: 'DELETE',
      body: JSON.stringify({
        withdrawal_reason: request.withdrawalReason,
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
    const response = await this.request<{ proposal_id: number }>('/governance/create-proposal', {
      method: 'POST',
      body: JSON.stringify({
        proposer: request.proposerAddress,
        description: request.description,
        targets: request.targets,
        values: request.values,
        calldatas: request.calldatas,
        proposal_type: request.proposalType,
      }),
    });

    return {
      success: response.success,
      transactionId: (response.data as Record<string, unknown>)?.transaction_id as string,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'createProposal',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.castVote() - matches contract exactly
   */
  async castVote(request: CastVoteRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/cast-vote', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: request.proposalId,
        voter: request.voterAddress,
        support: request.support,
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
   * Governance.castVoteWithSignature() - matches contract exactly
   */
  async castVoteWithSignature(request: CastVoteRequest & { signature: string }): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/cast-vote-with-signature', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: request.proposalId,
        voter: request.voterAddress,
        support: request.support,
        reason: request.reason,
        signature: request.signature,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'castVoteWithSignature',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.queueProposal() - matches contract exactly
   */
  async queueProposal(proposalId: number, executionTime: number): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/queue-proposal', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: proposalId,
        execution_time: executionTime,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'queueProposal',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.executeProposal() - matches contract exactly
   */
  async executeProposal(proposalId: number, targets: string[], values: number[], calldatas: string[]): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/execute-proposal', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: proposalId,
        targets: targets,
        values: values,
        calldatas: calldatas,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'executeProposal',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * Governance.cancelProposal() - matches contract exactly
   */
  async cancelProposal(proposalId: number, cancellationReason: string): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/cancel-proposal', {
      method: 'POST',
      body: JSON.stringify({
        proposal_id: proposalId,
        cancellation_reason: cancellationReason,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'cancelProposal',
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
        delegator: request.delegatorAddress,
        delegatee: request.delegateeAddress,
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
   * Governance.undelegate() - matches contract exactly
   */
  async undelegateVotingPower(delegatorAddress: string): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/governance/undelegate', {
      method: 'POST',
      body: JSON.stringify({
        delegator: delegatorAddress,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
      functionName: 'undelegate',
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
        oracle_address: request.oracleAddress,
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
   * ReputationOracle.submitEvaluation() - matches contract exactly
   */
  async submitWorkEvaluation(request: SubmitWorkEvaluationRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ evaluation_id: number }>('/reputation/submit-evaluation', {
      method: 'POST',
      body: JSON.stringify({
        oracle_address: request.oracleAddress,
        user_address: request.userAddress,
        work_id: request.workId,
        score: request.score,
        ipfs_hash: request.ipfsHash,
        evaluation_type: request.evaluationType,
      }),
    });

    return {
      success: response.success,
      transactionId: (response.data as Record<string, unknown>)?.transaction_id as string,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'submitEvaluation',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * ReputationOracle.updateReputationScore() - matches contract exactly
   */
  async updateReputationScore(request: UpdateReputationScoreRequest): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/reputation/update-reputation-score', {
      method: 'POST',
      body: JSON.stringify({
        user_address: request.userAddress,
        new_score: request.newScore,
        skill_categories: request.skillCategories,
        evaluation_id: request.evaluationId,
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
    const response = await this.request<{ challenge_id: number }>('/reputation/challenge-evaluation', {
      method: 'POST',
      body: JSON.stringify({
        evaluation_id: request.evaluationId,
        challenger: request.challengerAddress,
        challenge_reason: request.reason,
        stake_amount: request.stakeAmount,
      }),
    });

    return {
      success: response.success,
      transactionId: (response.data as Record<string, unknown>)?.transaction_id as string,
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
      method: 'POST',
      body: JSON.stringify({
        challenge_id: request.challengeId,
        resolution: request.resolution,
        resolution_reason: request.resolutionReason,
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

  /**
   * ReputationOracle.isActiveOracle() - matches contract exactly
   */
  async isActiveOracle(oracleAddress: string): Promise<ApiResponse<{ is_active: boolean }>> {
    return this.request(`/reputation/is-active-oracle/${oracleAddress}`);
  }

  /**
   * ReputationOracle.updateOracleStatus() - matches contract exactly
   */
  async updateOracleStatus(oracleAddress: string, isActive: boolean, reason: string = ""): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/reputation/update-oracle-status', {
      method: 'POST',
      body: JSON.stringify({
        oracle_address: oracleAddress,
        is_active: isActive,
        reason: reason,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'updateOracleStatus',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * ReputationOracle.slashOracle() - matches contract exactly
   */
  async slashOracle(oracleAddress: string, slashAmount: number, slashReason: string): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/reputation/slash-oracle', {
      method: 'POST',
      body: JSON.stringify({
        oracle_address: oracleAddress,
        slash_amount: slashAmount,
        slash_reason: slashReason,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'slashOracle',
      error: response.error,
      data: response.data,
    };
  }

  /**
   * ReputationOracle.withdrawOracleStake() - matches contract exactly
   */
  async withdrawOracleStake(oracleAddress: string, withdrawalAmount: number): Promise<ContractCallResponse> {
    const response = await this.request<{ transaction_id: string }>('/reputation/withdraw-oracle-stake', {
      method: 'POST',
      body: JSON.stringify({
        oracle_address: oracleAddress,
        withdrawal_amount: withdrawalAmount,
      }),
    });

    return {
      success: response.success,
      transactionId: response.data?.transaction_id,
      contractAddress: process.env.NEXT_PUBLIC_REPUTATION_ORACLE_CONTRACT,
      functionName: 'withdrawOracleStake',
      error: response.error,
      data: response.data,
    };
  }

  // ============ VIEW FUNCTIONS ============

  async getProposals(page: number = 0, size: number = 20): Promise<PaginatedApiResponse<GovernanceProposal>> {
    return this.request(`/governance/proposals?page=${page}&size=${size}`);
  }

  async getProposal(proposalId: number): Promise<ApiResponse<GovernanceProposal>> {
    return this.request(`/governance/proposals/${proposalId}`);
  }

  async getVotingPower(address: string): Promise<ApiResponse<{ voting_power: number }>> {
    return this.request(`/governance/voting-power/${address}`);
  }

  async getOracleInfo(address: string): Promise<ApiResponse<object>> {
    return this.request(`/reputation/oracles/${address}`);
  }

  async getActiveOracles(): Promise<ApiResponse<object[]>> {
    return this.request('/reputation/oracles/active');
  }

  async getWorkEvaluations(userId: string, page: number = 0, size: number = 20): Promise<PaginatedApiResponse<object>> {
    return this.request(`/reputation/evaluations/${userId}?page=${page}&size=${size}`);
  }

  async getChallenges(page: number = 0, size: number = 20): Promise<PaginatedApiResponse<object>> {
    return this.request(`/reputation/challenges?page=${page}&size=${size}`);
  }
}

// Export singleton instance
export const contractService = new ContractService();

// Export for convenience
export default contractService;
