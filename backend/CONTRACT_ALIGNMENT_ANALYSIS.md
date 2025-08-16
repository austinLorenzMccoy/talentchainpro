# Contract Alignment Analysis Report

## Overview
This report analyzes the alignment between the frontend contract types (`frontend/lib/types/contracts.ts`) and the backend implementation to identify any mismatches or inconsistencies.

## Critical Issues Found

### 1. Governance Contract Mismatches

#### Frontend Type vs Contract Function Signature
**Frontend Type:**
```typescript
interface CreateProposalRequest {
  proposerAddress: string;
  description: string;
  targets: string[];
  values: number[];
  calldatas: string[];
  proposalType: number; // 0=STANDARD, 1=EMERGENCY
}
```

**Contract Function (createProposal):**
```solidity
function createProposal(
  string title,
  string description,
  address[] targets,
  uint256[] values,
  bytes[] calldatas,
  string ipfsHash
) returns (uint256 proposalId)
```

**MISMATCHES:**
- ❌ **Missing `title` parameter** in frontend type
- ❌ **Missing `ipfsHash` parameter** in frontend type
- ❌ **Extra `proposalType` parameter** in frontend type (not in contract)
- ❌ **Missing `proposerAddress` validation** (should be msg.sender in contract)

#### Frontend Type vs Contract Function Signature
**Frontend Type:**
```typescript
interface CastVoteRequest {
  proposalId: number;
  voterAddress: string;
  support: number; // 0=against, 1=for, 2=abstain
  reason: string;
}
```

**Contract Function (castVote):**
```solidity
function castVote(
  uint256 proposalId,
  uint8 vote, // 0=against, 1=for, 2=abstain
  string reason
)
```

**MISMATCHES:**
- ❌ **Extra `voterAddress` parameter** in frontend type (should be msg.sender in contract)
- ❌ **Parameter name mismatch**: `support` vs `vote`

### 2. SkillToken Contract Mismatches

#### Frontend Type vs Contract Function Signature
**Frontend Type:**
```typescript
interface ContractSkillTokenCreateRequest {
  recipientAddress: string;
  category: string;
  subcategory: string;
  level: number; // 1-10
  expiryDate: number; // Unix timestamp, 0 for default
  metadata: string;
  tokenURIData: string;
}
```

**Contract Function (mintSkillToken):**
```solidity
function mintSkillToken(
  address recipient,
  string category,
  string subcategory,
  uint8 level,
  uint64 expiryDate,
  string metadata,
  string tokenURIData
) returns (uint256 tokenId)
```

**ALIGNMENT:** ✅ **PERFECT MATCH** - All parameters align correctly

### 3. ReputationOracle Contract Mismatches

#### Frontend Type vs Contract Function Signature
**Frontend Type:**
```typescript
interface RegisterOracleRequest {
  oracleAddress: string;
  name: string;
  specializations: string[];
  stakeAmount: number;
}
```

**Contract Function (registerOracle):**
```solidity
function registerOracle(
  string name,
  string[] specializations
) payable
```

**MISMATCHES:**
- ❌ **Missing `oracleAddress` parameter** in contract (should be msg.sender)
- ❌ **Missing `stakeAmount` parameter** in contract (should be msg.value)
- ❌ **Parameter order mismatch**

#### Frontend Type vs Contract Function Signature
**Frontend Type:**
```typescript
interface SubmitWorkEvaluationRequest {
  oracleAddress: string;
  userAddress: string;
  workId: number;
  score: number;
  ipfsHash: string;
  evaluationType: number;
}
```

**Contract Function (submitWorkEvaluation):**
```solidity
function submitWorkEvaluation(
  address user,
  uint256[] skillTokenIds,
  string workDescription,
  string workContent,
  uint256 overallScore,
  uint256[] skillScores,
  string feedback,
  string ipfsHash
) returns (uint256 evaluationId)
```

**MISMATCHES:**
- ❌ **Missing `oracleAddress` parameter** in contract (should be msg.sender)
- ❌ **Missing `workId` parameter** in contract
- ❌ **Missing `evaluationType` parameter** in contract
- ❌ **Extra parameters** in contract that frontend doesn't have
- ❌ **Parameter type mismatch**: `score` vs `overallScore` + `skillScores[]`

### 4. TalentPool Contract Mismatches

#### Frontend Type vs Contract Function Signature
**Frontend Type:**
```typescript
interface ContractJobPoolCreateRequest {
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
```

**Contract Function (createPool):**
```solidity
function createPool(
  string title,
  string description,
  uint8 jobType,
  string[] requiredSkills,
  uint8[] minimumLevels,
  uint256 salaryMin,
  uint256 salaryMax,
  uint64 deadline,
  string location,
  bool isRemote
) payable returns (uint256 poolId)
```

**ALIGNMENT:** ✅ **PERFECT MATCH** - All parameters align correctly

## Backend Implementation Issues

### 1. Governance Service
- ❌ **Function signature mismatch**: Backend `create_proposal` has different parameters than contract
- ❌ **Missing contract validation**: Backend doesn't validate against actual contract ABI
- ❌ **Parameter transformation**: Backend transforms data before sending to contract

### 2. Skill Service
- ✅ **Good alignment**: Backend correctly maps to contract function
- ✅ **Parameter validation**: Backend validates all required parameters

### 3. Reputation Service
- ❌ **Function signature mismatch**: Backend has different parameters than contract
- ❌ **Missing contract integration**: Backend doesn't call actual contract functions

### 4. Pool Service
- ✅ **Good alignment**: Backend correctly maps to contract function
- ✅ **Parameter validation**: Backend validates all required parameters

## Recommendations

### 1. Immediate Fixes Required

#### Governance Contract
```typescript
// Fix frontend type to match contract
interface CreateProposalRequest {
  title: string;           // ✅ Add missing title
  description: string;
  targets: string[];
  values: number[];
  calldatas: string[];
  ipfsHash: string;        // ✅ Add missing ipfsHash
  // ❌ Remove proposalType (not in contract)
  // ❌ Remove proposerAddress (should be msg.sender)
}

// Fix frontend type to match contract
interface CastVoteRequest {
  proposalId: number;
  vote: number;            // ✅ Rename support to vote
  reason: string;
  // ❌ Remove voterAddress (should be msg.sender)
}
```

#### ReputationOracle Contract
```typescript
// Fix frontend type to match contract
interface RegisterOracleRequest {
  name: string;
  specializations: string[];
  // ❌ Remove oracleAddress (should be msg.sender)
  // ❌ Remove stakeAmount (should be msg.value)
}

// Fix frontend type to match contract
interface SubmitWorkEvaluationRequest {
  user: string;            // ✅ Rename userAddress to user
  skillTokenIds: number[]; // ✅ Add missing skillTokenIds
  workDescription: string; // ✅ Add missing workDescription
  workContent: string;     // ✅ Add missing workContent
  overallScore: number;    // ✅ Rename score to overallScore
  skillScores: number[];   // ✅ Add missing skillScores
  feedback: string;        // ✅ Add missing feedback
  ipfsHash: string;
  // ❌ Remove oracleAddress (should be msg.sender)
  // ❌ Remove workId (not in contract)
  // ❌ Remove evaluationType (not in contract)
}
```

### 2. Backend Service Updates

#### Governance Service
```python
# Update function signature to match contract
async def create_proposal(
    self,
    title: str,           # ✅ Add missing title
    description: str,
    targets: List[str],
    values: List[int],
    calldatas: List[str],
    ipfs_hash: str,       # ✅ Add missing ipfs_hash
    # ❌ Remove proposal_type (not in contract)
    # ❌ Remove proposer_address (should be msg.sender)
) -> Dict[str, Any]:
```

#### Reputation Service
```python
# Update function signature to match contract
async def register_oracle(
    self,
    name: str,
    specializations: List[str],
    # ❌ Remove oracle_address (should be msg.sender)
    # ❌ Remove stake_amount (should be msg.value)
) -> Dict[str, Any]:
```

### 3. Contract Integration
- ✅ **Implement actual contract calls** in all services
- ✅ **Validate function signatures** against ABI files
- ✅ **Add error handling** for contract failures
- ✅ **Add transaction monitoring** for contract operations

### 4. Testing
- ✅ **Add integration tests** for contract calls
- ✅ **Validate parameter mapping** between frontend and backend
- ✅ **Test error scenarios** and edge cases
- ✅ **Verify transaction success** on blockchain

## Conclusion

The current implementation has **significant mismatches** between frontend types, backend services, and smart contract functions. The **SkillToken** and **TalentPool** contracts are well-aligned, but **Governance** and **ReputationOracle** have major discrepancies that need immediate attention.

**Priority 1 (Critical):** Fix Governance contract alignment
**Priority 2 (High):** Fix ReputationOracle contract alignment  
**Priority 3 (Medium):** Implement actual contract calls in backend
**Priority 4 (Low):** Add comprehensive testing and validation

These mismatches could lead to:
- ❌ **Contract calls failing** due to wrong parameters
- ❌ **Data corruption** from parameter mismatches
- ❌ **User experience issues** from failed transactions
- ❌ **Security vulnerabilities** from incorrect parameter handling
