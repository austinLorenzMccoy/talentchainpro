# 🎯 Frontend-Contract Alignment Guide

## ✅ **RECOMMENDED APPROACH**

Yes, you're absolutely right! **The smart contracts should be the source of truth**. Here's the systematic approach:

### **1. Smart Contract Interface (Source of Truth)**

```solidity
// TalentPool.createPool
function createPool(
    string calldata title,           // ✅ Direct mapping
    string calldata description,     // ✅ Direct mapping
    JobType jobType,                // ❌ Need enum: 0,1,2,3
    string[] calldata requiredSkills, // ❌ Need skill categories
    uint8[] calldata minimumLevels,   // ❌ MISSING from frontend!
    uint256 salaryMin,              // ❌ Need number conversion
    uint256 salaryMax,              // ❌ Need number conversion
    uint64 deadline,                // ❌ Need timestamp conversion
    string calldata location,       // ✅ Direct mapping
    bool isRemote                   // ✅ Direct mapping
) external payable                  // ❌ Need stake amount!
```

### **2. Required Frontend Changes**

#### **A. Update Skill Creation Component**

```typescript
// ✅ CORRECT: Match SkillToken.mintSkillToken exactly
const skillData = {
  recipient_address: user.accountId, // ✅ ADD: User wallet address
  category: selectedCategory, // ✅ Match contract param
  level: selectedLevel, // ✅ 1-10 integer
  uri: `ipfs://${metadataHash}`, // ✅ IPFS URI
};
```

#### **B. Update Job Pool Creation Component**

```typescript
// ✅ CORRECT: Match TalentPool.createPool exactly
const poolData = {
  title: formData.title, // ✅ string
  description: formData.description, // ✅ string
  jobType: jobTypeToEnum(formData.jobType), // ✅ 0,1,2,3
  requiredSkills: formData.skillCategories, // ✅ string[]
  minimumLevels: formData.minimumLevels, // ✅ uint8[] - ADD THIS!
  salaryMin: parseToTinybar(formData.salaryMin), // ✅ uint256
  salaryMax: parseToTinybar(formData.salaryMax), // ✅ uint256
  deadline: toUnixTimestamp(formData.deadline), // ✅ uint64
  location: formData.location, // ✅ string
  isRemote: formData.isRemote, // ✅ bool
  stakeAmount: parseToTinybar(formData.stake), // ✅ msg.value
};
```

#### **C. Update Job Application Component**

```typescript
// ✅ CORRECT: Match TalentPool.submitApplication exactly
const applicationData = {
  poolId: parseInt(jobId), // ✅ uint256
  skillTokenIds: selectedSkillIds, // ✅ uint256[]
  coverLetter: formData.coverLetter, // ✅ string
  portfolio: formData.portfolioUrl, // ✅ string
  stakeAmount: parseToTinybar(formData.stake), // ✅ msg.value
};
```

### **3. Critical Missing Features to Add**

#### **Frontend Missing:**

1. **Minimum Levels Array** - Frontend completely missing this for job creation
2. **Stake Amount Input** - For both job creation and applications (payable functions)
3. **Proper Type Conversions** - string→number, timestamp conversion, enum mapping
4. **User Wallet Address** - For skill creation recipient_address

#### **Data Type Converters Needed:**

```typescript
// Add these utility functions
const jobTypeToEnum = (type: string): number => {
  const map = { "full-time": 0, "part-time": 1, contract: 2, freelance: 3 };
  return map[type] ?? 0;
};

const parseToTinybar = (hbar: string): number => {
  return Math.floor(parseFloat(hbar) * 100_000_000); // 1 HBAR = 100M tinybar
};

const toUnixTimestamp = (dateString: string): number => {
  return Math.floor(new Date(dateString).getTime() / 1000);
};
```

### **4. Backend Schema Updates**

#### **Update to Match Smart Contracts:**

```python
class JobPoolCreateRequest(BaseModel):
    title: str
    description: str
    job_type: int  # 0,1,2,3 enum
    required_skills: List[str]  # skill categories
    minimum_levels: List[int]   # ADD THIS! 1-10 for each skill
    salary_min: int  # in tinybar
    salary_max: int  # in tinybar
    deadline: int  # unix timestamp
    location: str
    is_remote: bool
    stake_amount: int  # for msg.value
```

### **5. Implementation Priority**

1. **✅ FIRST: Fix Backend Schemas** (already started above)
2. **✅ SECOND: Update Frontend Forms** to collect all required data
3. **✅ THIRD: Add Type Converters** for proper data transformation
4. **✅ FOURTH: Add Validation** to ensure data integrity

### **6. Key Validation Rules**

```typescript
// Ensure arrays match
if (requiredSkills.length !== minimumLevels.length) {
  throw new Error("Each skill must have a corresponding minimum level");
}

// Ensure levels are valid
minimumLevels.forEach((level) => {
  if (level < 1 || level > 10) {
    throw new Error("Skill levels must be between 1 and 10");
  }
});

// Ensure stake amount is positive
if (stakeAmount <= 0) {
  throw new Error("Stake amount must be greater than 0");
}
```

## 🎯 **SUMMARY**

**YES - Smart contracts are the source of truth!**

The current frontend is **structurally incompatible** with the smart contracts. The main issues:

1. **Missing critical fields** (minimumLevels, stakeAmount, recipient_address)
2. **Wrong data types** (strings vs numbers, missing enum conversions)
3. **Array length mismatches** (requiredSkills ≠ minimumLevels length)

**Fix order:** Smart Contract (✅) → Backend Schemas (🔧) → Frontend Components (🔧)

This alignment is **critical** for the dApp to function - without it, smart contract calls will fail with type/parameter errors.
