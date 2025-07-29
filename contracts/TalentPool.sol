// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SkillToken.sol";

/**
 * @title TalentPool
 * @dev Implementation of talent pools where companies can stake HBAR/tokens
 * to create job pools and candidates can stake skill tokens to join pools.
 * Optimized for Hedera's low-latency environment.
 */
contract TalentPool is Ownable, ReentrancyGuard {
    // Struct to represent a job pool
    struct JobPool {
        address company;
        string jobTitle;
        string jobDescription;
        string[] requiredSkills;
        uint256 stake;
        bool active;
        uint256 createdAt;
    }
    
    // Struct to represent a candidate in a pool
    struct Candidate {
        address wallet;
        uint256[] skillTokenIds;
        uint256 stake;
        uint256 joinedAt;
    }
    
    // SkillToken contract reference
    SkillToken private _skillToken;
    
    // Counter for job pool IDs
    uint256 private _poolIdCounter;
    
    // Mapping from pool ID to JobPool
    mapping(uint256 => JobPool) private _jobPools;
    
    // Mapping from pool ID to array of candidates
    mapping(uint256 => Candidate[]) private _poolCandidates;
    
    // Mapping from address to pool IDs they've joined
    mapping(address => uint256[]) private _candidatePoolIds;
    
    // Mapping from address to pool IDs they've created
    mapping(address => uint256[]) private _companyPoolIds;
    
    // Platform fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 private _platformFeeRate = 250;
    
    // Address where platform fees are sent
    address private _feeCollector;
    
    // Events
    event PoolCreated(uint256 indexed poolId, address indexed company, string jobTitle, uint256 stake);
    event PoolClosed(uint256 indexed poolId);
    event CandidateJoined(uint256 indexed poolId, address indexed candidate, uint256 stake);
    event CandidateLeft(uint256 indexed poolId, address indexed candidate);
    event MatchMade(uint256 indexed poolId, address indexed company, address indexed candidate);
    event PlatformFeeChanged(uint256 oldFee, uint256 newFee);
    event FeeCollectorChanged(address oldCollector, address newCollector);
    
    /**
     * @dev Constructor initializes the contract with the SkillToken contract address
     * @param skillTokenAddress Address of the SkillToken contract
     * @param feeCollector Address where platform fees will be sent
     */
    constructor(address skillTokenAddress, address feeCollector) {
        require(skillTokenAddress != address(0), "TalentPool: skill token is the zero address");
        require(feeCollector != address(0), "TalentPool: fee collector is the zero address");
        
        _skillToken = SkillToken(skillTokenAddress);
        _feeCollector = feeCollector;
    }
    
    /**
     * @dev Create a new job pool
     * @param jobTitle Title of the job
     * @param jobDescription Description of the job
     * @param requiredSkills Array of required skill categories
     * @return uint256 ID of the created pool
     */
    function createPool(
        string memory jobTitle,
        string memory jobDescription,
        string[] memory requiredSkills
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "TalentPool: stake must be greater than zero");
        require(bytes(jobTitle).length > 0, "TalentPool: job title cannot be empty");
        require(requiredSkills.length > 0, "TalentPool: required skills cannot be empty");
        
        uint256 poolId = _poolIdCounter++;
        
        _jobPools[poolId] = JobPool({
            company: msg.sender,
            jobTitle: jobTitle,
            jobDescription: jobDescription,
            requiredSkills: requiredSkills,
            stake: msg.value,
            active: true,
            createdAt: block.timestamp
        });
        
        _companyPoolIds[msg.sender].push(poolId);
        
        emit PoolCreated(poolId, msg.sender, jobTitle, msg.value);
        
        return poolId;
    }
    
    /**
     * @dev Close a job pool and withdraw stake
     * @param poolId ID of the pool to close
     */
    function closePool(uint256 poolId) external nonReentrant {
        JobPool storage pool = _jobPools[poolId];
        require(pool.company == msg.sender, "TalentPool: not the pool creator");
        require(pool.active, "TalentPool: pool already closed");
        
        pool.active = false;
        
        // Return stake to company
        (bool success, ) = payable(msg.sender).call{value: pool.stake}("");
        require(success, "TalentPool: transfer failed");
        
        emit PoolClosed(poolId);
    }
    
    /**
     * @dev Join a job pool as a candidate
     * @param poolId ID of the pool to join
     * @param skillTokenIds Array of skill token IDs to stake
     */
    function joinPool(uint256 poolId, uint256[] memory skillTokenIds) external payable nonReentrant {
        JobPool storage pool = _jobPools[poolId];
        require(pool.active, "TalentPool: pool is not active");
        require(skillTokenIds.length > 0, "TalentPool: must stake at least one skill token");
        
        // Verify ownership of skill tokens
        for (uint256 i = 0; i < skillTokenIds.length; i++) {
            require(_skillToken.ownerOf(skillTokenIds[i]) == msg.sender, "TalentPool: not the owner of skill token");
        }
        
        // Add candidate to pool
        _poolCandidates[poolId].push(Candidate({
            wallet: msg.sender,
            skillTokenIds: skillTokenIds,
            stake: msg.value,
            joinedAt: block.timestamp
        }));
        
        _candidatePoolIds[msg.sender].push(poolId);
        
        emit CandidateJoined(poolId, msg.sender, msg.value);
    }
    
    /**
     * @dev Leave a job pool as a candidate
     * @param poolId ID of the pool to leave
     */
    function leavePool(uint256 poolId) external nonReentrant {
        JobPool storage pool = _jobPools[poolId];
        require(pool.active, "TalentPool: pool is not active");
        
        Candidate[] storage candidates = _poolCandidates[poolId];
        uint256 candidateIndex = type(uint256).max;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].wallet == msg.sender) {
                candidateIndex = i;
                break;
            }
        }
        
        require(candidateIndex != type(uint256).max, "TalentPool: not in this pool");
        
        // Return stake to candidate
        uint256 stake = candidates[candidateIndex].stake;
        if (stake > 0) {
            (bool success, ) = payable(msg.sender).call{value: stake}("");
            require(success, "TalentPool: transfer failed");
        }
        
        // Remove candidate from pool (replace with last element and pop)
        if (candidateIndex < candidates.length - 1) {
            candidates[candidateIndex] = candidates[candidates.length - 1];
        }
        candidates.pop();
        
        emit CandidateLeft(poolId, msg.sender);
    }
    
    /**
     * @dev Make a match between a company and a candidate
     * @param poolId ID of the pool
     * @param candidateAddress Address of the candidate
     */
    function makeMatch(uint256 poolId, address candidateAddress) external nonReentrant {
        JobPool storage pool = _jobPools[poolId];
        require(pool.company == msg.sender, "TalentPool: not the pool creator");
        require(pool.active, "TalentPool: pool is not active");
        
        Candidate[] storage candidates = _poolCandidates[poolId];
        uint256 candidateIndex = type(uint256).max;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].wallet == candidateAddress) {
                candidateIndex = i;
                break;
            }
        }
        
        require(candidateIndex != type(uint256).max, "TalentPool: candidate not in this pool");
        
        // Calculate platform fee
        uint256 platformFee = (pool.stake * _platformFeeRate) / 10000;
        uint256 remainingStake = pool.stake - platformFee;
        
        // Transfer platform fee
        if (platformFee > 0) {
            (bool feeSuccess, ) = payable(_feeCollector).call{value: platformFee}("");
            require(feeSuccess, "TalentPool: fee transfer failed");
        }
        
        // Transfer remaining stake to candidate
        (bool success, ) = payable(candidateAddress).call{value: remainingStake}("");
        require(success, "TalentPool: transfer failed");
        
        // Close the pool
        pool.active = false;
        
        emit MatchMade(poolId, msg.sender, candidateAddress);
    }
    
    /**
     * @dev Get job pool details
     * @param poolId ID of the pool
     * @return JobPool details of the job pool
     */
    function getPoolDetails(uint256 poolId) external view returns (JobPool memory) {
        return _jobPools[poolId];
    }
    
    /**
     * @dev Get candidates in a pool
     * @param poolId ID of the pool
     * @return Candidate[] Array of candidates in the pool
     */
    function getPoolCandidates(uint256 poolId) external view returns (Candidate[] memory) {
        return _poolCandidates[poolId];
    }
    
    /**
     * @dev Get pools created by a company
     * @param company Address of the company
     * @return uint256[] Array of pool IDs created by the company
     */
    function getCompanyPools(address company) external view returns (uint256[] memory) {
        return _companyPoolIds[company];
    }
    
    /**
     * @dev Get pools joined by a candidate
     * @param candidate Address of the candidate
     * @return uint256[] Array of pool IDs joined by the candidate
     */
    function getCandidatePools(address candidate) external view returns (uint256[] memory) {
        return _candidatePoolIds[candidate];
    }
    
    /**
     * @dev Set the platform fee rate
     * @param newFeeRate New fee rate in basis points (e.g., 250 = 2.5%)
     */
    function setPlatformFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 1000, "TalentPool: fee rate cannot exceed 10%");
        
        uint256 oldFeeRate = _platformFeeRate;
        _platformFeeRate = newFeeRate;
        
        emit PlatformFeeChanged(oldFeeRate, newFeeRate);
    }
    
    /**
     * @dev Set the fee collector address
     * @param newFeeCollector New fee collector address
     */
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "TalentPool: fee collector is the zero address");
        
        address oldFeeCollector = _feeCollector;
        _feeCollector = newFeeCollector;
        
        emit FeeCollectorChanged(oldFeeCollector, newFeeCollector);
    }
    
    /**
     * @dev Get the current platform fee rate
     * @return uint256 Current platform fee rate in basis points
     */
    function getPlatformFeeRate() external view returns (uint256) {
        return _platformFeeRate;
    }
    
    /**
     * @dev Get the current fee collector address
     * @return address Current fee collector address
     */
    function getFeeCollector() external view returns (address) {
        return _feeCollector;
    }
}
