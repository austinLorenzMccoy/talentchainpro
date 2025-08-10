# TalentChain Pro - Complete Smart Contract Function Mapping

## 🎯 Executive Summary

This document provides a comprehensive mapping of all smart contract functionalities across the 4 deployed contracts (SkillToken, TalentPool, Governance, ReputationOracle) and their required implementations in both backend and frontend systems for complete enterprise integration.

## 📋 Smart Contract Analysis

### 1. **SkillToken Contract** - Soulbound NFTs for Skill Verification

#### Core Functions to Implement:

**Creation & Minting:**

- `mintSkillToken(address to, string name, string category, uint8 level, uint256 expiry, string metadata, string uri)`
- `batchMintSkillTokens(address[] recipients, SkillTokenData[] skillData)`
- `safeMint(address to, uint256 tokenId)`

**Skill Management:**

- `updateSkillLevel(uint256 tokenId, uint8 newLevel, string newUri)`
- `addExperience(uint256 tokenId, uint256 experience)`
- `setTokenURI(uint256 tokenId, string uri)`
- `setSkillMetadata(uint256 tokenId, string metadata)`

**Oracle & Verification:**

- `proposeSkillLevelUpdate(uint256 tokenId, uint8 newLevel, string evidence, uint256 consensusDeadline)`
- `voteOnSkillUpdate(uint256 proposalId, bool approve, string reason)`
- `finalizeSkillUpdate(uint256 proposalId)`

**View Functions:**

- `getSkillInfo(uint256 tokenId)` → `(string category, uint8 level, string uri)`
- `getSkillMetadata(uint256 tokenId)` → `(string name, string category, uint8 level, uint256 experience, uint256 lastUpdated, bool isActive, string uri)`
- `getSkillsByCategory(string category)` → `uint256[]`
- `getSkillsByOwner(address owner)` → `uint256[]`
- `getUserSkills(address user)` → `SkillTokenInfo[]`
- `isSkillActive(uint256 tokenId)` → `bool`
- `getSkillExperience(uint256 tokenId)` → `uint256`

**Access Control:**

- Role: `MINTER_ROLE`, `ORACLE_ROLE`, `UPGRADER_ROLE`

---

### 2. **TalentPool Contract** - Job Pool Management & Matching

#### Core Functions to Implement:

**Pool Creation:**

- `createPool(string title, string description, uint256 categoryId, string[] requiredSkills, uint8[] minLevels, uint256 minSalary, uint256 maxSalary, uint256 deadline, string location, bool isRemote)`
- `createAdvancedPool(AdvancedPoolParams params)`

**Pool Management:**

- `updatePoolDetails(uint256 poolId, string description, uint256 deadline)`
- `pausePool(uint256 poolId)`
- `resumePool(uint256 poolId)`
- `closePool(uint256 poolId)`
- `extendDeadline(uint256 poolId, uint256 newDeadline)`

**Application Process:**

- `applyToPool(uint256 poolId, uint256[] skillTokenIds)`
- `withdrawApplication(uint256 poolId)`
- `updateApplication(uint256 poolId, uint256[] newSkillTokenIds)`

**Matching & Selection:**

- `makeMatch(uint256 poolId, address candidate)`
- `acceptMatch(uint256 poolId)`
- `rejectMatch(uint256 poolId)`
- `finalizeMatch(uint256 poolId)`

**Stake Management:**

- `stakeForPool(uint256 poolId)`
- `withdrawStake(uint256 poolId)`
- `claimStakeReward(uint256 poolId)`

**View Functions:**

- `getPool(uint256 poolId)` → `(address company, string description, uint256[] requiredSkills, uint256 stakeAmount, uint256 salary, PoolStatus status, address[] applicants, address selectedCandidate, uint256 createdAt, uint256 deadline)`
- `getPoolCount()` → `uint256`
- `getPoolsByStatus(PoolStatus status)` → `uint256[]`
- `getPoolApplicants(uint256 poolId)` → `address[]`
- `getUserApplications(address user)` → `uint256[]`
- `getMatchScore(uint256 poolId, address candidate)` → `uint256`
- `getPlatformFeeRate()` → `uint256`
- `isPoolActive(uint256 poolId)` → `bool`
- `getPoolCategories()` → `string[]`

**Fee Management:**

- `setPlatformFeeRate(uint256 newRate)`
- `setFeeCollector(address newCollector)`
- `withdrawFees()`

**Access Control:**

- Roles: `POOL_MANAGER_ROLE`, `FEE_MANAGER_ROLE`, `PAUSER_ROLE`

---

### 3. **Governance Contract** - DAO Governance & Protocol Management

#### Core Functions to Implement:

**Proposal Management:**

- `createProposal(string title, string description, address[] targets, uint256[] values, bytes[] calldatas, string ipfsHash)` → `uint256 proposalId`
- `createEmergencyProposal(string title, string description, address[] targets, uint256[] values, bytes[] calldatas, string ipfsHash, string emergencyReason)`
- `cancelProposal(uint256 proposalId)`
- `queueProposal(uint256 proposalId)`

**Voting System:**

- `castVote(uint256 proposalId, VoteType vote, string reason)`
- `castVoteWithSignature(uint256 proposalId, VoteType vote, string reason, bytes signature)`
- `delegate(address delegatee)`
- `undelegate()`

**Proposal Execution:**

- `executeProposal(uint256 proposalId)`
- `batchExecuteProposals(uint256[] proposalIds)`

**Status Management:**

- `updateProposalStatuses(uint256[] proposalIds)`

**View Functions:**

- `getProposal(uint256 proposalId)` → `Proposal memory`
- `getProposalStatus(uint256 proposalId)` → `ProposalStatus`
- `getVoteReceipt(uint256 proposalId, address voter)` → `VoteReceipt memory`
- `getVotingPower(address account)` → `uint256`
- `getDelegates(address account)` → `address`
- `getDelegatedVotingPower(address account)` → `uint256`
- `getQuorum()` → `uint256`
- `getVotingDelay()` → `uint256`
- `getVotingPeriod()` → `uint256`
- `getProposalThreshold()` → `uint256`
- `getAllProposals()` → `uint256[]`
- `getActiveProposals()` → `uint256[]`
- `getProposalsByProposer(address proposer)` → `uint256[]`
- `canExecute(uint256 proposalId)` → `bool`
- `hasVoted(uint256 proposalId, address voter)` → `bool`

**Settings Management:**

- `updateGovernanceSettings(GovernanceSettings newSettings)`

**Access Control:**

- Roles: `PROPOSAL_CREATOR_ROLE`, `EXECUTOR_ROLE`, `EMERGENCY_ROLE`, `PAUSER_ROLE`

---

### 4. **ReputationOracle Contract** - AI-Powered Reputation Scoring

#### Core Functions to Implement:

**Oracle Management:**

- `registerOracle(string name, string[] specializations)`
- `updateOracleStatus(address oracle, bool isActive, string reason)`
- `updateOracleSpecializations(address oracle, string[] newSpecializations)`

**Work Evaluation:**

- `submitWorkEvaluation(address user, uint256[] skillTokenIds, string workDescription, string artifacts, uint256 overallScore, uint256[] skillScores, string feedback, string ipfsHash)`
- `batchSubmitEvaluations(WorkEvaluationData[] evaluations)`

**Reputation Management:**

- `updateReputationScore(address user, uint256 newScore, string category)`
- `challengeEvaluation(uint256 evaluationId, string reason, string evidence)`
- `resolveChallenge(uint256 challengeId, bool upholdOriginal, string resolution)`

**Consensus System:**

- `submitForConsensus(WorkEvaluationData evaluation, uint256[] skillTokenIds)`
- `voteOnEvaluation(uint256 evaluationId, bool approve, uint256 score, string feedback)`
- `finalizeConsensus(uint256 evaluationId)`

**View Functions:**

- `getReputationScore(address user)` → `(uint256 overallScore, uint256 totalEvaluations, uint64 lastUpdated, bool isActive)`
- `getUserEvaluations(address user)` → `uint256[]`
- `getEvaluation(uint256 evaluationId)` → `WorkEvaluation memory`
- `getOracleInfo(address oracle)` → `(string name, string[] specializations, bool isActive, uint256 totalEvaluations, uint256 successfulEvaluations)`
- `getActiveOracles()` → `address[]`
- `isAuthorizedOracle(address oracle)` → `bool`
- `getMinimumOracleStake()` → `uint256`
- `getTotalEvaluations()` → `uint256`
- `getChallengeInfo(uint256 challengeId)` → `Challenge memory`
- `getUserReputationByCategory(address user, string category)` → `uint256`

**Access Control:**

- Roles: `ORACLE_ADMIN_ROLE`, `CHALLENGE_RESOLVER_ROLE`

---

## 🔧 Backend Implementation Requirements

### 1. **Service Layer Architecture**

```python
# backend/app/services/
contract_integration.py     # Main contract interaction service
skill_token_service.py      # SkillToken contract operations
talent_pool_service.py      # TalentPool contract operations
governance_service.py       # Governance contract operations
reputation_oracle_service.py # ReputationOracle contract operations
hedera_manager.py          # Enhanced Hedera SDK wrapper
```

### 2. **API Endpoint Structure**

```python
# Skills API - Complete Implementation
POST   /api/v1/skills/                          # Create skill token
POST   /api/v1/skills/batch                     # Batch create skill tokens
GET    /api/v1/skills/                          # List skills with filters
GET    /api/v1/skills/{token_id}                # Get skill details
PUT    /api/v1/skills/{token_id}                # Update skill level
POST   /api/v1/skills/{token_id}/experience     # Add experience
GET    /api/v1/skills/user/{user_id}            # Get user's skills
GET    /api/v1/skills/category/{category}       # Get skills by category
POST   /api/v1/skills/propose-update            # Propose skill level update
POST   /api/v1/skills/vote-update               # Vote on skill update
POST   /api/v1/skills/finalize-update           # Finalize skill update

# Pools API - Complete Implementation
POST   /api/v1/pools/                           # Create job pool
POST   /api/v1/pools/advanced                   # Create advanced pool
GET    /api/v1/pools/                           # List pools with filters
GET    /api/v1/pools/{pool_id}                  # Get pool details
PUT    /api/v1/pools/{pool_id}                  # Update pool details
POST   /api/v1/pools/{pool_id}/apply            # Apply to pool
POST   /api/v1/pools/{pool_id}/withdraw         # Withdraw application
POST   /api/v1/pools/{pool_id}/match            # Make match
POST   /api/v1/pools/{pool_id}/accept           # Accept match
POST   /api/v1/pools/{pool_id}/reject           # Reject match
POST   /api/v1/pools/{pool_id}/finalize         # Finalize match
POST   /api/v1/pools/{pool_id}/pause            # Pause pool
POST   /api/v1/pools/{pool_id}/resume           # Resume pool
GET    /api/v1/pools/{pool_id}/applicants       # Get pool applicants
GET    /api/v1/pools/user/{user_id}/applications # Get user applications
GET    /api/v1/pools/categories                 # Get pool categories
POST   /api/v1/pools/{pool_id}/stake            # Stake for pool
POST   /api/v1/pools/{pool_id}/withdraw-stake   # Withdraw stake

# Governance API - Complete Implementation
POST   /api/v1/governance/proposals             # Create proposal
POST   /api/v1/governance/proposals/emergency   # Create emergency proposal
GET    /api/v1/governance/proposals             # List proposals
GET    /api/v1/governance/proposals/{proposal_id} # Get proposal details
POST   /api/v1/governance/proposals/{proposal_id}/vote # Vote on proposal
POST   /api/v1/governance/proposals/{proposal_id}/queue # Queue proposal
POST   /api/v1/governance/proposals/{proposal_id}/execute # Execute proposal
POST   /api/v1/governance/proposals/{proposal_id}/cancel # Cancel proposal
POST   /api/v1/governance/delegate              # Delegate voting power
POST   /api/v1/governance/undelegate            # Undelegate voting power
GET    /api/v1/governance/voting-power/{user_id} # Get voting power
GET    /api/v1/governance/proposals/active      # Get active proposals
GET    /api/v1/governance/proposals/user/{user_id} # Get user's proposals
GET    /api/v1/governance/settings              # Get governance settings

# Reputation API - Complete Implementation
POST   /api/v1/reputation/oracles/register      # Register oracle
PUT    /api/v1/reputation/oracles/{oracle_id}/status # Update oracle status
POST   /api/v1/reputation/evaluations           # Submit evaluation
POST   /api/v1/reputation/evaluations/batch     # Batch submit evaluations
GET    /api/v1/reputation/evaluations/{eval_id} # Get evaluation details
POST   /api/v1/reputation/evaluations/{eval_id}/challenge # Challenge evaluation
POST   /api/v1/reputation/challenges/{challenge_id}/resolve # Resolve challenge
GET    /api/v1/reputation/users/{user_id}       # Get user reputation
GET    /api/v1/reputation/users/{user_id}/evaluations # Get user evaluations
GET    /api/v1/reputation/oracles               # Get active oracles
GET    /api/v1/reputation/oracles/{oracle_id}   # Get oracle info
POST   /api/v1/reputation/consensus             # Submit for consensus
POST   /api/v1/reputation/consensus/{eval_id}/vote # Vote on consensus

# MCP/AI API - Enhanced Implementation
POST   /api/v1/mcp/evaluate-work                # AI work evaluation
POST   /api/v1/mcp/match-candidates             # AI candidate matching
POST   /api/v1/mcp/skill-recommendations        # AI skill recommendations
POST   /api/v1/mcp/reputation-analysis          # AI reputation analysis
POST   /api/v1/mcp/market-insights              # AI market insights
POST   /api/v1/mcp/natural-query                # Natural language queries
```

### 3. **Database Schema Enhancements**

```sql
-- Enhanced caching and analytics tables
CREATE TABLE skill_tokens_cache (
    token_id INTEGER PRIMARY KEY,
    owner_id VARCHAR(20) NOT NULL,
    contract_address VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    experience INTEGER DEFAULT 0,
    metadata JSONB NOT NULL,
    uri TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_pools_cache (
    pool_id INTEGER PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL,
    contract_address VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    required_skills JSONB NOT NULL,
    min_salary DECIMAL(15,2),
    max_salary DECIMAL(15,2),
    stake_amount DECIMAL(15,8) NOT NULL,
    status INTEGER NOT NULL,
    location VARCHAR(100),
    is_remote BOOLEAN DEFAULT FALSE,
    deadline TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE governance_proposals_cache (
    proposal_id INTEGER PRIMARY KEY,
    proposer_id VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    targets JSONB NOT NULL,
    values JSONB NOT NULL,
    calldatas JSONB NOT NULL,
    status INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    for_votes DECIMAL(18,0) DEFAULT 0,
    against_votes DECIMAL(18,0) DEFAULT 0,
    abstain_votes DECIMAL(18,0) DEFAULT 0,
    executed BOOLEAN DEFAULT FALSE,
    ipfs_hash TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reputation_evaluations_cache (
    evaluation_id INTEGER PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    oracle_id VARCHAR(20) NOT NULL,
    skill_token_ids JSONB NOT NULL,
    overall_score INTEGER NOT NULL,
    skill_scores JSONB NOT NULL,
    feedback TEXT,
    work_description TEXT NOT NULL,
    artifacts JSONB,
    ipfs_hash TEXT,
    status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reputation_scores_cache (
    user_id VARCHAR(20) PRIMARY KEY,
    overall_score INTEGER NOT NULL,
    category_scores JSONB NOT NULL,
    total_evaluations INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_skill_tokens_owner ON skill_tokens_cache(owner_id);
CREATE INDEX idx_skill_tokens_category ON skill_tokens_cache(category);
CREATE INDEX idx_job_pools_company ON job_pools_cache(company_id);
CREATE INDEX idx_job_pools_status ON job_pools_cache(status);
CREATE INDEX idx_job_pools_deadline ON job_pools_cache(deadline);
CREATE INDEX idx_governance_proposals_status ON governance_proposals_cache(status);
CREATE INDEX idx_reputation_evaluations_user ON reputation_evaluations_cache(user_id);
CREATE INDEX idx_reputation_evaluations_oracle ON reputation_evaluations_cache(oracle_id);
```

---

## 🎨 Frontend Implementation Requirements

### 1. **Component Architecture**

```typescript
// Enhanced component structure
frontend/
├── components/
│   ├── skills/
│   │   ├── SkillTokenCreator.tsx         # Create new skill tokens
│   │   ├── SkillTokenList.tsx            # Display user's skills
│   │   ├── SkillTokenCard.tsx            # Individual skill display
│   │   ├── SkillLevelUpdater.tsx         # Update skill levels
│   │   ├── SkillExperienceTracker.tsx    # Track skill experience
│   │   ├── SkillCategoryBrowser.tsx      # Browse skills by category
│   │   └── SkillProposalManager.tsx      # Manage skill update proposals
│   ├── pools/
│   │   ├── JobPoolCreator.tsx            # Create job pools
│   │   ├── JobPoolBrowser.tsx            # Browse available pools
│   │   ├── JobPoolCard.tsx               # Individual pool display
│   │   ├── PoolApplicationManager.tsx    # Manage applications
│   │   ├── PoolMatchingInterface.tsx     # Matching interface for companies
│   │   ├── PoolStakeManager.tsx          # Manage pool stakes
│   │   └── PoolAnalytics.tsx             # Pool performance analytics
│   ├── governance/
│   │   ├── ProposalCreator.tsx           # Create proposals
│   │   ├── ProposalBrowser.tsx           # Browse proposals
│   │   ├── ProposalVoting.tsx            # Vote on proposals
│   │   ├── ProposalExecutor.tsx          # Execute proposals
│   │   ├── VotingPowerManager.tsx        # Manage voting power & delegation
│   │   ├── GovernanceAnalytics.tsx       # Governance metrics
│   │   └── EmergencyProposals.tsx        # Emergency proposal interface
│   ├── reputation/
│   │   ├── ReputationDashboard.tsx       # Main reputation interface
│   │   ├── WorkEvaluationSubmitter.tsx   # Submit work for evaluation
│   │   ├── OracleRegistration.tsx        # Register as oracle
│   │   ├── EvaluationChallenger.tsx      # Challenge evaluations
│   │   ├── ConsensusVoting.tsx           # Vote on consensus
│   │   ├── ReputationScoreDisplay.tsx    # Display reputation scores
│   │   └── EvaluationHistory.tsx         # View evaluation history
│   ├── wallet/
│   │   ├── WalletConnector.tsx           # Multi-wallet connection
│   │   ├── TransactionManager.tsx        # Transaction status & queue
│   │   ├── NetworkSwitcher.tsx           # Switch between networks
│   │   └── WalletBalance.tsx             # Display balances
│   └── dashboard/
│       ├── DashboardOverview.tsx         # Main dashboard
│       ├── UserProfile.tsx               # User profile management
│       ├── NotificationCenter.tsx        # Real-time notifications
│       ├── ActivityFeed.tsx              # Recent activity
│       └── AnalyticsSummary.tsx          # Key metrics summary
```

### 2. **API Integration Hooks**

```typescript
// Custom hooks for each contract
export const useSkillToken = () => {
  const createSkillToken = useMutation({
    mutationFn: (data: CreateSkillTokenRequest) =>
      apiClient.createSkillToken(data),
  });

  const updateSkillLevel = useMutation({
    mutationFn: ({
      tokenId,
      data,
    }: {
      tokenId: number;
      data: UpdateSkillLevelRequest;
    }) => apiClient.updateSkillLevel(tokenId, data),
  });

  const getUserSkills = useQuery({
    queryKey: ["skills", "user"],
    queryFn: () => apiClient.getUserSkillTokens(),
  });

  return { createSkillToken, updateSkillLevel, getUserSkills };
};

export const useTalentPool = () => {
  const createPool = useMutation({
    mutationFn: (data: CreateJobPoolRequest) => apiClient.createJobPool(data),
  });

  const applyToPool = useMutation({
    mutationFn: ({
      poolId,
      data,
    }: {
      poolId: number;
      data: PoolApplicationRequest;
    }) => apiClient.applyToJobPool(poolId, data),
  });

  const getJobPools = useQuery({
    queryKey: ["pools"],
    queryFn: () => apiClient.getJobPools(),
  });

  return { createPool, applyToPool, getJobPools };
};

export const useGovernance = () => {
  const createProposal = useMutation({
    mutationFn: (data: CreateProposalRequest) => apiClient.createProposal(data),
  });

  const castVote = useMutation({
    mutationFn: ({
      proposalId,
      vote,
    }: {
      proposalId: number;
      vote: VoteRequest;
    }) => apiClient.castVote(proposalId, vote),
  });

  const getProposals = useQuery({
    queryKey: ["governance", "proposals"],
    queryFn: () => apiClient.getProposals(),
  });

  return { createProposal, castVote, getProposals };
};

export const useReputationOracle = () => {
  const submitEvaluation = useMutation({
    mutationFn: (data: WorkEvaluationRequest) =>
      apiClient.submitWorkEvaluation(data),
  });

  const getUserReputation = useQuery({
    queryKey: ["reputation", "user"],
    queryFn: () => apiClient.getUserReputation(),
  });

  const challengeEvaluation = useMutation({
    mutationFn: ({
      evalId,
      data,
    }: {
      evalId: number;
      data: ChallengeRequest;
    }) => apiClient.challengeEvaluation(evalId, data),
  });

  return { submitEvaluation, getUserReputation, challengeEvaluation };
};
```

### 3. **Real-time Event Handling**

```typescript
// Event listener system for contract events
export const useContractEvents = () => {
  const { wallet } = useWalletManager();

  useEffect(() => {
    if (!wallet?.isConnected) return;

    const eventHandlers = {
      // SkillToken events
      SkillTokenMinted: (event: SkillTokenMintedEvent) => {
        toast.success(`New skill token minted: ${event.skillName}`);
        queryClient.invalidateQueries(["skills"]);
      },

      SkillLevelUpdated: (event: SkillLevelUpdatedEvent) => {
        toast.info(
          `Skill level updated: ${event.skillName} → Level ${event.newLevel}`
        );
        queryClient.invalidateQueries(["skills"]);
      },

      // TalentPool events
      PoolCreated: (event: PoolCreatedEvent) => {
        toast.success(`New job pool created: ${event.title}`);
        queryClient.invalidateQueries(["pools"]);
      },

      PoolApplicationSubmitted: (event: PoolApplicationEvent) => {
        toast.info(`Application submitted to: ${event.poolTitle}`);
        queryClient.invalidateQueries(["pools", "applications"]);
      },

      MatchMade: (event: MatchMadeEvent) => {
        toast.success(`Match found! ${event.poolTitle}`);
        queryClient.invalidateQueries(["pools", "matches"]);
      },

      // Governance events
      ProposalCreated: (event: ProposalCreatedEvent) => {
        toast.info(`New proposal: ${event.title}`);
        queryClient.invalidateQueries(["governance", "proposals"]);
      },

      VoteCast: (event: VoteCastEvent) => {
        toast.success(`Vote cast on: ${event.proposalTitle}`);
        queryClient.invalidateQueries(["governance"]);
      },

      // Reputation events
      WorkEvaluationCompleted: (event: EvaluationCompletedEvent) => {
        toast.success(
          `Work evaluation completed! Score: ${event.overallScore}`
        );
        queryClient.invalidateQueries(["reputation"]);
      },

      ReputationScoreUpdated: (event: ReputationUpdatedEvent) => {
        toast.info(`Reputation updated: ${event.newScore}`);
        queryClient.invalidateQueries(["reputation", "user"]);
      },
    };

    // Subscribe to contract events
    const subscriptions = Object.entries(eventHandlers).map(
      ([eventName, handler]) =>
        contractEventService.subscribe(eventName, handler)
    );

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wallet?.isConnected]);
};
```

---

## 🔄 Integration Workflow Examples

### 1. **Complete Skill Token Workflow**

```typescript
// Full skill token lifecycle
const SkillTokenWorkflow = () => {
  const { createSkillToken, updateSkillLevel } = useSkillToken();
  const { submitEvaluation } = useReputationOracle();
  const { wallet, executeTransaction } = useWalletManager();

  // 1. Create skill token
  const handleCreateSkill = async (skillData: SkillTokenData) => {
    try {
      // Backend API call
      const response = await createSkillToken.mutateAsync(skillData);

      // Direct contract interaction for immediate confirmation
      if (wallet?.isConnected) {
        const txResult = await executeTransaction(
          CONTRACT_ADDRESSES.SKILL_TOKEN,
          "mintSkillToken",
          {
            to: skillData.owner,
            name: skillData.name,
            category: skillData.category,
            level: skillData.level,
            expiry: skillData.expiry,
            metadata: skillData.metadata,
            uri: skillData.uri,
          }
        );

        if (txResult.success) {
          toast.success(`Skill token created! TX: ${txResult.transactionId}`);
        }
      }
    } catch (error) {
      toast.error(`Failed to create skill token: ${error.message}`);
    }
  };

  // 2. Submit work for evaluation
  const handleSubmitWork = async (workData: WorkEvaluationData) => {
    try {
      const evaluation = await submitEvaluation.mutateAsync(workData);

      // This triggers AI evaluation and potential skill level update
      if (evaluation.success) {
        toast.success("Work submitted for evaluation!");
      }
    } catch (error) {
      toast.error(`Failed to submit work: ${error.message}`);
    }
  };

  // 3. Update skill level based on evaluation
  const handleSkillUpdate = async (tokenId: number, newLevel: number) => {
    try {
      const updateResult = await updateSkillLevel.mutateAsync({
        tokenId,
        data: { newLevel, evidence: "Performance evaluation completed" },
      });

      if (updateResult.success) {
        toast.success(`Skill level updated to ${newLevel}!`);
      }
    } catch (error) {
      toast.error(`Failed to update skill: ${error.message}`);
    }
  };

  return (
    <div className="skill-workflow">
      <SkillTokenCreator onSubmit={handleCreateSkill} />
      <WorkEvaluationSubmitter onSubmit={handleSubmitWork} />
      <SkillLevelUpdater onUpdate={handleSkillUpdate} />
    </div>
  );
};
```

### 2. **Complete Job Pool Workflow**

```typescript
// Full job pool lifecycle
const JobPoolWorkflow = () => {
  const { createPool, applyToPool, makeMatch } = useTalentPool();
  const { getUserSkills } = useSkillToken();
  const { wallet } = useWalletManager();

  // 1. Company creates job pool
  const handleCreatePool = async (poolData: JobPoolData) => {
    try {
      const pool = await createPool.mutateAsync(poolData);

      if (pool.success) {
        toast.success(`Job pool created! ID: ${pool.data.poolId}`);
      }
    } catch (error) {
      toast.error(`Failed to create pool: ${error.message}`);
    }
  };

  // 2. Candidate applies to pool
  const handleApplyToPool = async (poolId: number) => {
    try {
      const userSkills = await getUserSkills.refetch();
      const relevantSkills = filterRelevantSkills(userSkills.data, poolId);

      const application = await applyToPool.mutateAsync({
        poolId,
        data: {
          skillTokenIds: relevantSkills.map((s) => s.tokenId),
          coverLetter: "Interested in this position...",
        },
      });

      if (application.success) {
        toast.success("Application submitted successfully!");
      }
    } catch (error) {
      toast.error(`Failed to apply: ${error.message}`);
    }
  };

  // 3. Company makes match
  const handleMakeMatch = async (poolId: number, candidateId: string) => {
    try {
      const match = await makeMatch.mutateAsync({
        poolId,
        data: { candidateId },
      });

      if (match.success) {
        toast.success("Match made successfully!");
      }
    } catch (error) {
      toast.error(`Failed to make match: ${error.message}`);
    }
  };

  return (
    <div className="pool-workflow">
      <JobPoolCreator onSubmit={handleCreatePool} />
      <JobPoolBrowser onApply={handleApplyToPool} />
      <PoolMatchingInterface onMatch={handleMakeMatch} />
    </div>
  );
};
```

---

## 🎯 Implementation Priority Matrix

### **Phase 1 (Weeks 1-4): Core Functionality**

1. **SkillToken**: Creation, minting, basic view functions
2. **TalentPool**: Pool creation, application, basic matching
3. **Basic API**: Core CRUD operations for skills and pools
4. **Frontend**: Wallet connection, basic skill/pool management

### **Phase 2 (Weeks 5-8): Advanced Features**

1. **ReputationOracle**: Work evaluation, oracle registration
2. **Governance**: Basic proposal creation and voting
3. **AI Integration**: Enhanced MCP server integration
4. **Frontend**: Real-time updates, transaction management

### **Phase 3 (Weeks 9-12): Enterprise Features**

1. **Complete Governance**: Full DAO functionality, delegation
2. **Advanced Reputation**: Consensus, challenges, multi-oracle
3. **Analytics**: Comprehensive dashboard and reporting
4. **Production**: Deployment, monitoring, security hardening

This comprehensive mapping ensures that every smart contract function is properly implemented across both backend and frontend systems, creating a complete, enterprise-ready talent ecosystem on Hedera blockchain.
