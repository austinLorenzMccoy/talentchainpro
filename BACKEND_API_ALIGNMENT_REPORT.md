# Backend API Alignment Report

## ❌ CRITICAL MISMATCHES CONFIRMED

Based on detailed analysis of:

- Smart contract function signatures
- Backend API endpoints
- Frontend contract service calls
- Pydantic schema definitions

### 1. **Skill Token API Mismatches**

**ISSUE**: Frontend calls `/skills/mint` but backend only has `/skills/`

**Smart Contract Function**:

```solidity
function mintSkillToken(
    address recipient,
    string calldata category,
    string calldata subcategory,
    uint8 level,
    uint64 expiryDate,
    string calldata metadata,
    string calldata tokenURIData
) external returns (uint256 tokenId)
```

**Frontend Expects**: `POST /api/v1/skills/mint`
**Backend Has**: `POST /api/v1/skills/`

**Required Fix**: Add contract-specific endpoints

### 2. **Missing Endorsement Endpoints**

**Smart Contract Functions**:

```solidity
function endorseSkillToken(uint256 tokenId, string calldata endorsementData)
function endorseSkillTokenWithSignature(uint256 tokenId, string calldata endorsementData, uint256 deadline, bytes calldata signature)
```

**Frontend Expects**: `POST /api/v1/skills/endorse`
**Backend Has**: ❌ Missing completely

### 3. **Missing Renewal/Revocation Endpoints**

**Smart Contract Functions**:

```solidity
function renewSkillToken(uint256 tokenId, uint64 newExpiryDate)
function revokeSkillToken(uint256 tokenId, string calldata reason)
```

**Frontend Expects**:

- `PUT /api/v1/skills/renew`
- `PUT /api/v1/skills/revoke`

**Backend Has**: ❌ Missing completely

### 4. **Pool Management Mismatches**

**Smart Contract**: `TalentPool.createPool()` with specific parameters
**Frontend**: Calls `/pools/create`
**Backend**: Has different endpoint structure

### 5. **Governance API Gaps**

**Frontend**: Expects full governance API
**Backend**: Has governance.py but endpoint alignment unclear

## 🛠️ **IMMEDIATE ACTIONS REQUIRED**

1. **Add Missing Skill Endpoints**:

   - `POST /skills/mint`
   - `POST /skills/batch-mint`
   - `POST /skills/endorse`
   - `POST /skills/endorse-with-signature`
   - `PUT /skills/renew`
   - `PUT /skills/revoke`

2. **Verify Governance Endpoints**:

   - Check if governance API routes match frontend expectations
   - Ensure parameter alignment with Governance contract

3. **Validate Oracle Endpoints**:

   - Confirm reputation API endpoints align with frontend calls
   - Verify ReputationOracle contract integration

4. **Parameter Validation**:
   - Ensure all Pydantic schemas match contract function signatures exactly
   - Validate data type conversions (uint8, uint64, etc.)

## 🔍 **CONTRACT ALIGNMENT STATUS**

| Contract         | Function             | Backend Endpoint            | Status   | Priority |
| ---------------- | -------------------- | --------------------------- | -------- | -------- |
| SkillToken       | mintSkillToken       | ❌ Missing `/mint`          | Critical | High     |
| SkillToken       | batchMintSkillTokens | ❌ Wrong path `/batch-mint` | Critical | High     |
| SkillToken       | endorseSkillToken    | ❌ Missing `/endorse`       | Critical | High     |
| SkillToken       | renewSkillToken      | ❌ Missing `/renew`         | Critical | High     |
| SkillToken       | revokeSkillToken     | ❌ Missing `/revoke`        | Critical | High     |
| TalentPool       | createPool           | ⚠️ Needs verification       | Medium   | Medium   |
| Governance       | createProposal       | ⚠️ Needs verification       | Medium   | Medium   |
| ReputationOracle | registerOracle       | ⚠️ Needs verification       | Medium   | Medium   |

## 📋 **CONCLUSION**

**NO** - The backend APIs and routes are **NOT** properly and correctly connected based on what the smart contracts expect. Significant refactoring is required to achieve contract-perfect alignment.

**Key Issues**:

1. Missing contract-specific endpoints
2. Incorrect endpoint paths
3. Potential parameter mismatches
4. Incomplete API coverage for all contract functions

**Recommendation**: Implement contract-first API design to ensure 1:1 mapping between smart contract functions and backend endpoints.
