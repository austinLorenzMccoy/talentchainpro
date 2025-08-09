// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ITalentPool
 * @dev Interface for the TalentPool contract - Job matching and staking pools
 * @author TalentChain Pro Team
 */
interface ITalentPool {
    // Enums
    enum PoolStatus { Active, Paused, Completed, Cancelled, Expired }
    enum ApplicationStatus { Pending, Accepted, Rejected, Withdrawn }
    enum JobType { FullTime, PartTime, Contract, Freelance }

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        address indexed company,
        JobType jobType,
        uint256 stakeAmount,
        uint256 salaryRange
    );
    
    event ApplicationSubmitted(
        uint256 indexed poolId,
        address indexed candidate,
        uint256[] skillTokenIds,
        uint256 stakeAmount
    );
    
    event MatchMade(
        uint256 indexed poolId,
        address indexed company,
        address indexed candidate,
        uint256 matchScore
    );
    
    event PoolCompleted(
        uint256 indexed poolId,
        address indexed selectedCandidate,
        uint256 totalPayout
    );
    
    event StakeWithdrawn(
        uint256 indexed poolId,
        address indexed participant,
        uint256 amount,
        uint256 penalty
    );

    // Structs
    struct JobPool {
        uint256 id;
        address company;
        string title;
        string description;
        JobType jobType;
        string[] requiredSkills;
        uint8[] minimumLevels;
        uint256 salaryMin;
        uint256 salaryMax;
        uint256 stakeAmount;
        uint64 deadline;
        uint64 createdAt;
        PoolStatus status;
        address selectedCandidate;
        uint256 totalApplications;
        string location;
        bool isRemote;
    }

    struct Application {
        address candidate;
        uint256[] skillTokenIds;
        uint256 stakeAmount;
        uint64 appliedAt;
        ApplicationStatus status;
        uint256 matchScore;
        string coverLetter;
        string portfolio;
    }

    struct PoolMetrics {
        uint256 totalStaked;
        uint256 averageMatchScore;
        uint256 completionRate;
        uint256 averageTimeToFill;
    }

    // Core functions
    function createPool(
        string calldata title,
        string calldata description,
        JobType jobType,
        string[] calldata requiredSkills,
        uint8[] calldata minimumLevels,
        uint256 salaryMin,
        uint256 salaryMax,
        uint64 deadline,
        string calldata location,
        bool isRemote
    ) external payable returns (uint256 poolId);

    function submitApplication(
        uint256 poolId,
        uint256[] calldata skillTokenIds,
        string calldata coverLetter,
        string calldata portfolio
    ) external payable;

    function selectCandidate(
        uint256 poolId,
        address candidate
    ) external;

    function completePool(uint256 poolId) external;

    function withdrawApplication(uint256 poolId) external;

    function closePool(uint256 poolId) external;

    // View functions
    function getPool(uint256 poolId) external view returns (JobPool memory);
    
    function getApplication(uint256 poolId, address candidate) 
        external 
        view 
        returns (Application memory);
    
    function getPoolApplications(uint256 poolId) 
        external 
        view 
        returns (Application[] memory);
    
    function getPoolsByCompany(address company) 
        external 
        view 
        returns (uint256[] memory);
    
    function getApplicationsByCandidate(address candidate) 
        external 
        view 
        returns (uint256[] memory);
    
    function getPoolMetrics(uint256 poolId) 
        external 
        view 
        returns (PoolMetrics memory);
    
    function calculateMatchScore(uint256 poolId, address candidate) 
        external 
        view 
        returns (uint256);
    
    function getActivePoolsCount() external view returns (uint256);
    
    function getTotalPoolsCount() external view returns (uint256);
}