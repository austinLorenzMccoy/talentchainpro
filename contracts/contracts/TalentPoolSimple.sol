// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface ISkillToken {
    function getSkillInfo(uint256 tokenId) external view returns (
        string memory category,
        uint8 level,
        string memory uri
    );
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title TalentPoolSimple
 * @dev Simplified staking pools for job matching in TalentChain Pro MVP
 * Features:
 * - Job pool creation with HBAR staking
 * - Candidate applications with skill tokens
 * - Basic matching system
 * - Platform fees
 */
contract TalentPoolSimple is ReentrancyGuard, AccessControl, Pausable {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant POOL_CREATOR_ROLE = keccak256("POOL_CREATOR_ROLE");
    bytes32 public constant MATCHER_ROLE = keccak256("MATCHER_ROLE");
    
    // Pool states
    enum PoolStatus { Active, Paused, Completed, Cancelled }
    
    // Pool data structure
    struct JobPool {
        uint256 id;
        address company;
        string description;
        uint256[] requiredSkills; // Skill token IDs required
        uint256 stakeAmount;
        uint256 salary;
        PoolStatus status;
        address[] applicants;
        address selectedCandidate;
        uint256 createdAt;
        uint256 deadline;
    }
    
    // State variables
    ISkillToken public skillToken;
    address public feeCollector;
    uint256 public platformFee = 250; // 2.5%
    
    Counters.Counter private _poolIdCounter;
    mapping(uint256 => JobPool) private _pools;
    mapping(address => uint256[]) private _userApplications;
    
    // Events
    event PoolCreated(uint256 indexed poolId, address indexed company, uint256 stakeAmount);
    event CandidateApplied(uint256 indexed poolId, address indexed candidate);
    event MatchMade(uint256 indexed poolId, address indexed candidate, address indexed company);
    event PoolCompleted(uint256 indexed poolId);
    
    constructor(
        address _skillToken,
        address _feeCollector,
        address initialAdmin
    ) {
        require(_skillToken != address(0), "TalentPool: skill token is zero address");
        require(_feeCollector != address(0), "TalentPool: fee collector is zero address");
        
        skillToken = ISkillToken(_skillToken);
        feeCollector = _feeCollector;
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(POOL_CREATOR_ROLE, initialAdmin);
        _grantRole(MATCHER_ROLE, initialAdmin);
    }
    
    /**
     * @dev Create a new job pool
     */
    function createPool(
        string memory description,
        uint256[] memory requiredSkills,
        uint256 salary,
        uint256 duration // in seconds
    ) external payable onlyRole(POOL_CREATOR_ROLE) returns (uint256) {
        require(msg.value > 0, "TalentPool: stake amount must be greater than 0");
        require(bytes(description).length > 0, "TalentPool: description cannot be empty");
        require(requiredSkills.length > 0, "TalentPool: must specify required skills");
        
        uint256 poolId = _poolIdCounter.current();
        _poolIdCounter.increment();
        
        JobPool storage pool = _pools[poolId];
        pool.id = poolId;
        pool.company = msg.sender;
        pool.description = description;
        pool.requiredSkills = requiredSkills;
        pool.stakeAmount = msg.value;
        pool.salary = salary;
        pool.status = PoolStatus.Active;
        pool.createdAt = block.timestamp;
        pool.deadline = block.timestamp + duration;
        
        emit PoolCreated(poolId, msg.sender, msg.value);
        
        return poolId;
    }
    
    /**
     * @dev Apply to a job pool
     */
    function applyToPool(uint256 poolId, uint256[] memory skillTokenIds) external nonReentrant {
        JobPool storage pool = _pools[poolId];
        require(pool.status == PoolStatus.Active, "TalentPool: pool is not active");
        require(block.timestamp < pool.deadline, "TalentPool: application deadline passed");
        require(skillTokenIds.length > 0, "TalentPool: must provide skill tokens");
        
        // Verify user owns the skill tokens
        for (uint256 i = 0; i < skillTokenIds.length; i++) {
            require(skillToken.ownerOf(skillTokenIds[i]) == msg.sender, "TalentPool: you don't own this skill token");
        }
        
        // Check if already applied
        for (uint256 i = 0; i < pool.applicants.length; i++) {
            require(pool.applicants[i] != msg.sender, "TalentPool: already applied");
        }
        
        pool.applicants.push(msg.sender);
        _userApplications[msg.sender].push(poolId);
        
        emit CandidateApplied(poolId, msg.sender);
    }
    
    /**
     * @dev Make a match (admin only)
     */
    function makeMatch(uint256 poolId, address candidate) external onlyRole(MATCHER_ROLE) nonReentrant {
        JobPool storage pool = _pools[poolId];
        require(pool.status == PoolStatus.Active, "TalentPool: pool is not active");
        require(pool.selectedCandidate == address(0), "TalentPool: match already made");
        
        // Verify candidate applied
        bool candidateFound = false;
        for (uint256 i = 0; i < pool.applicants.length; i++) {
            if (pool.applicants[i] == candidate) {
                candidateFound = true;
                break;
            }
        }
        require(candidateFound, "TalentPool: candidate did not apply");
        
        pool.selectedCandidate = candidate;
        pool.status = PoolStatus.Completed;
        
        // Calculate fees
        uint256 fee = (pool.stakeAmount * platformFee) / 10000;
        uint256 payout = pool.stakeAmount - fee;
        
        // Transfer funds
        if (fee > 0) {
            payable(feeCollector).transfer(fee);
        }
        payable(candidate).transfer(payout);
        
        emit MatchMade(poolId, candidate, pool.company);
        emit PoolCompleted(poolId);
    }
    
    /**
     * @dev Get pool information
     */
    function getPool(uint256 poolId) external view returns (
        address company,
        string memory description,
        uint256[] memory requiredSkills,
        uint256 stakeAmount,
        uint256 salary,
        PoolStatus status,
        address[] memory applicants,
        address selectedCandidate,
        uint256 createdAt,
        uint256 deadline
    ) {
        JobPool storage pool = _pools[poolId];
        return (
            pool.company,
            pool.description,
            pool.requiredSkills,
            pool.stakeAmount,
            pool.salary,
            pool.status,
            pool.applicants,
            pool.selectedCandidate,
            pool.createdAt,
            pool.deadline
        );
    }
    
    /**
     * @dev Get user applications
     */
    function getUserApplications(address user) external view returns (uint256[] memory) {
        return _userApplications[user];
    }
    
    /**
     * @dev Get total number of pools
     */
    function getPoolCount() external view returns (uint256) {
        return _poolIdCounter.current();
    }
    
    /**
     * @dev Cancel pool (admin only)
     */
    function cancelPool(uint256 poolId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        JobPool storage pool = _pools[poolId];
        require(pool.status == PoolStatus.Active, "TalentPool: pool is not active");
        
        pool.status = PoolStatus.Cancelled;
        
        // Refund stake to company
        payable(pool.company).transfer(pool.stakeAmount);
    }
    
    /**
     * @dev Update platform fee (admin only)
     */
    function setPlatformFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= 1000, "TalentPool: fee cannot exceed 10%"); // Max 10%
        platformFee = newFee;
    }
    
    /**
     * @dev Update fee collector (admin only)
     */
    function setFeeCollector(address newFeeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeCollector != address(0), "TalentPool: fee collector is zero address");
        feeCollector = newFeeCollector;
    }
    
    /**
     * @dev Pause contract (admin only)
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}