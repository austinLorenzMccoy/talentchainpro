/**
 * Extended types to match all smart contract functions and backend schemas exactly
 */

// ============ GOVERNANCE TYPES ============

// Governance types aligned with backend schemas
export interface GovernanceProposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  targets: string[];
  values: number[];
  calldatas: string[];
  status: string; // 'ACTIVE' | 'SUCCEEDED' | 'DEFEATED' | 'EXECUTED' | 'EXPIRED'
  proposalType: 'STANDARD' | 'EMERGENCY';
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  startBlock: number;
  endBlock: number;
  deadline: string;
  createdAt: string;
  executedAt?: string;
}

// Emergency proposals extend governance proposals
export interface EmergencyProposal extends GovernanceProposal {
  proposalType: 'EMERGENCY';
  urgencyLevel: 'HIGH' | 'CRITICAL';
  requiredQuorum: number;
}

// Vote record for user voting history
export interface VoteRecord {
  proposalId: number;
  voter: string;
  vote: 'FOR' | 'AGAINST' | 'ABSTAIN';
  votingPower: number;
  reason?: string;
  timestamp: string;
}

// Governance metrics for dashboard
export interface GovernanceMetrics {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  totalVotingPower: number;
  averageParticipation: number;
}

export enum ProposalStatus {
  Pending = 0,
  Active = 1,
  Succeeded = 2,
  Defeated = 3,
  Queued = 4,
  Executed = 5,
  Cancelled = 6
}

export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2
}

export interface VoteReceipt {
  hasVoted: boolean;
  vote: VoteType;
  weight: number;
  reason: string;
}

export interface GovernanceSettings {
  votingDelay: number;
  votingPeriod: number;
  proposalThreshold: number;
  quorum: number;
  executionDelay: number;
  emergencyQuorum: number;
  emergencyVotingPeriod: number;
}

// FIXED: Align with contract function signature
export interface CreateProposalRequest {
  title: string;           // ✅ Added missing title parameter
  description: string;
  targets: string[];
  values: number[];
  calldatas: string[];
  ipfsHash: string;        // ✅ Added missing ipfsHash parameter
  // ❌ Removed proposalType (not in contract)
  // ❌ Removed proposerAddress (should be msg.sender in contract)
}

export interface CreateEmergencyProposalRequest {
  title: string;
  description: string;
  targets: string[];
  values: number[];
  calldatas: string[];
  ipfsHash: string;
  justification: string;   // ✅ Added missing justification parameter
}

// FIXED: Align with contract function signature
export interface CastVoteRequest {
  proposalId: number;
  vote: number;            // ✅ Renamed support to vote to match contract
  reason: string;
  // ❌ Removed voterAddress (should be msg.sender in contract)
}

export interface DelegateVotingPowerRequest {
  delegateeAddress: string;
}

// ============ REPUTATION ORACLE TYPES ============

export interface OracleInfo {
  oracle: string;
  name: string;
  specializations: string[];
  evaluationsCompleted: number;
  averageScore: number;
  registeredAt: number;
  isActive: boolean;
  stake: number;
}

export interface WorkEvaluation {
  id: number;
  user: string;
  skillTokenIds: number[];
  workDescription: string;
  workContent: string;
  overallScore: number;
  feedback: string;
  evaluatedBy: string;
  timestamp: number;
  ipfsHash: string;
}

export interface ReputationScore {
  overallScore: number;
  totalEvaluations: number;
  lastUpdated: number;
  isActive: boolean;
}

export interface CategoryScore {
  category: string;
  score: number;
}

export interface Challenge {
  id: number;
  evaluationId: number;
  challenger: string;
  reason: string;
  stake: number;
  createdAt: number;
  resolutionDeadline: number;
  isResolved: boolean;
  upholdOriginal: boolean;
  resolution: string;
  resolver: string;
}

// FIXED: Align with contract function signature
export interface RegisterOracleRequest {
  name: string;                    // ✅ Keep only contract parameters
  specializations: string[];       // ✅ Keep only contract parameters
  // ❌ Removed oracleAddress (should be msg.sender in contract)
  // ❌ Removed stakeAmount (should be msg.value in contract)
}

// FIXED: Align with contract function signature
export interface SubmitWorkEvaluationRequest {
  user: string;                    // ✅ Renamed userAddress to user
  skillTokenIds: number[];         // ✅ Added missing skillTokenIds
  workDescription: string;         // ✅ Added missing workDescription
  workContent: string;             // ✅ Added missing workContent
  overallScore: number;            // ✅ Renamed score to overallScore
  skillScores: number[];           // ✅ Added missing skillScores
  feedback: string;                // ✅ Added missing feedback
  ipfsHash: string;
  // ❌ Removed oracleAddress (should be msg.sender in contract)
  // ❌ Removed workId (not in contract)
  // ❌ Removed evaluationType (not in contract)
}

export interface UpdateReputationScoreRequest {
  userAddress: string;
  newScore: number;
  skillCategories: number[];
  evaluationId: number;
}

export interface ChallengeEvaluationRequest {
  evaluationId: number;
  challengerAddress: string;
  reason: string;
  stakeAmount: number;
}

export interface ResolveChallengeRequest {
  challengeId: number;
  resolution: boolean;
  resolutionReason: string;
}

export interface UpdateReputationScoreRequest {
  userAddress: string;
  category: string;
  newScore: number;
  evidence: string;
}

export interface ChallengeEvaluationRequest {
  evaluationId: number;
  challengerAddress: string;
  reason: string;
  stakeAmount: number;
}

// ============ ENHANCED SKILL TOKEN TYPES ============

export interface BatchSkillTokenRequest {
  recipients: string[];
  skillNames: string[];
  levels: number[];
  metadataArray: string[];
}

export interface UpdateSkillLevelRequest {
  tokenId: number;
  newLevel: number;
  evidence: string;
}

export interface RevokeSkillTokenRequest {
  tokenId: number;
  reason: string;
}

export interface EndorseSkillTokenRequest {
  tokenId: number;
  endorsementData: string;
}

export interface EndorseSkillTokenWithSignatureRequest {
  tokenId: number;
  endorsementData: string;
  deadline: number;
  signature: string;
}

export interface RenewSkillTokenRequest {
  tokenId: number;
  newExpiryDate: number;
}

// ============ ENHANCED TALENT POOL TYPES ============

export interface SelectCandidateRequest {
  poolId: number;
  candidateAddress: string;
  selectionReason: string;
}

export interface CompletePoolRequest {
  poolId: number;
  completionNotes: string;
  finalRating: number;
}

export interface ClosePoolRequest {
  poolId: number;
  closureReason: string;
}

export interface WithdrawApplicationRequest {
  poolId: number;
  applicantAddress: string;
  withdrawalReason: string;
}

// ============ CONTRACT-PERFECT JOB POOL CREATE REQUEST ============

export interface ContractJobPoolCreateRequest {
  title: string;
  description: string;
  jobType: JobType; // 0=FullTime, 1=PartTime, 2=Contract, 3=Freelance
  requiredSkills: string[];
  minimumLevels: number[];
  salaryMin: number; // in tinybar
  salaryMax: number; // in tinybar
  deadline: number; // Unix timestamp
  location: string;
  isRemote: boolean;
  stakeAmount: number; // in tinybar
}

export enum JobType {
  FullTime = 0,
  PartTime = 1,
  Contract = 2,
  Freelance = 3
}

// ============ CONTRACT-PERFECT SKILL TOKEN CREATE REQUEST ============

export interface ContractSkillTokenCreateRequest {
  recipientAddress: string;
  category: string;
  subcategory: string;
  level: number; // 1-10
  expiryDate: number; // Unix timestamp, 0 for default
  metadata: string;
  tokenURIData: string;
}

// ============ CONTRACT-PERFECT APPLICATION REQUEST ============

export interface ContractPoolApplicationRequest {
  poolId: number;
  applicantAddress: string;
  expectedSalary: number;
  availabilityDate: number;
  coverLetter: string;
  stakeAmount: number; // in tinybar
}

// ============ ENHANCED DASHBOARD TYPES ============

export interface DashboardStats {
  totalSkills: number;
  totalPools: number;
  totalStaked: number;
  totalEvaluations: number;
  totalUsers: number;
}

export interface ExtendedDashboardStats extends DashboardStats {
  governanceProposals: number;
  votingPower: number;
  reputationEvaluations: number;
  oracleRegistrations: number;
  activeChallenges: number;
}

export interface GovernanceDashboardData {
  proposals: GovernanceProposal[];
  myProposals: GovernanceProposal[];
  myVotes: Array<{
    proposalId: number;
    vote: VoteType;
    weight: number;
    timestamp: number;
  }>;
  votingPower: number;
  delegatedTo: string | null;
  delegationsReceived: Array<{
    delegator: string;
    amount: number;
  }>;
}

export interface ReputationDashboardData {
  isOracle: boolean;
  oracleInfo?: OracleInfo;
  myEvaluations: WorkEvaluation[];
  evaluationsReceived: WorkEvaluation[];
  activeChallenges: Challenge[];
  reputationHistory: Array<{
    timestamp: number;
    category: string;
    oldScore: number;
    newScore: number;
    evaluatedBy: string;
  }>;
}

// ============ API RESPONSE TYPES ============

export interface ContractCallResponse {
  success: boolean;
  transactionId?: string;
  contractAddress?: string;
  functionName?: string;
  gasUsed?: number;
  error?: string;
  data?: unknown;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    total: number;
    page: number;
    size: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  error?: string;
}

// ============ FORM VALIDATION TYPES ============

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// ============ COMPONENT PROP TYPES ============

export interface DashboardWidgetProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<object>;
  className?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<object>;
  }>;
}

export interface ContractInteractionProps {
  onSuccess?: (result: ContractCallResponse) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

// ============ WALLET INTEGRATION TYPES ============

export interface ContractFunction {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    value: unknown;
  }>;
  value?: number; // for payable functions
  gasLimit?: number;
}

export interface SmartContractCall {
  contractAddress: string;
  function: ContractFunction;
  signer: object;
}

// Export all existing types from the original file
export * from './wallet';
