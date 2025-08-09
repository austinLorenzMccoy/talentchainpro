// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import "../interfaces/ITalentPool.sol";
import "../interfaces/ISkillToken.sol";
import "../libraries/PoolLibrary.sol";

/**
 * @title TalentPool
 * @dev Enterprise-grade job matching and staking pool contract
 * @author TalentChain Pro Team
 * 
 * Features:
 * - Advanced job pool creation with comprehensive metadata
 * - Skill-based application matching with scoring algorithm
 * - Staking mechanisms for companies and candidates
 * - Automated match scoring based on skill requirements
 * - Platform fee management with configurable rates
 * - Emergency pause functionality
 * - Comprehensive pool metrics and analytics
 * - Support for different job types and remote work
 * - Withdrawal penalties to prevent gaming
 * - Batch operations for efficiency
 */
contract TalentPool is 
    AccessControl, 
    Pausable, 
    ReentrancyGuard, 
    EIP712,
    ITalentPool 
{
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using PoolLibrary for uint256;
    using PoolLibrary for string;

    // Role definitions
    bytes32 public constant POOL_MANAGER_ROLE = keccak256("POOL_MANAGER_ROLE");
    bytes32 public constant MATCHER_ROLE = keccak256("MATCHER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // EIP-712 type hashes
    bytes32 private constant _APPLICATION_TYPEHASH = 
        keccak256("Application(uint256 poolId,uint256[] skillTokenIds,string coverLetter,uint256 nonce,uint256 deadline)");

    // State variables
    Counters.Counter private _poolIdCounter;
    ISkillToken public immutable skillToken;
    
    // Pool ID => Pool data
    mapping(uint256 => JobPool) private _pools;
    
    // Pool ID => Candidate address => Application
    mapping(uint256 => mapping(address => Application)) private _applications;
    
    // Pool ID => Array of applicant addresses
    mapping(uint256 => address[]) private _poolApplicants;
    
    // Company => Array of pool IDs
    mapping(address => uint256[]) private _poolsByCompany;
    
    // Candidate => Array of pool IDs applied to
    mapping(address => uint256[]) private _applicationsByCandidate;
    
    // Pool metrics
    mapping(uint256 => PoolMetrics) private _poolMetrics;
    mapping(uint256 => uint256[]) private _poolMatchScores;
    
    // Platform settings
    uint256 private _platformFeeRate = 250; // 2.5%
    address private _feeCollector;
    uint256 private _minimumStake = 0.1 ether;
    
    // Nonces for meta-transactions
    mapping(address => uint256) private _nonces;
    
    // Statistics
    uint256 private _totalPoolsCreated;
    uint256 private _totalApplicationsSubmitted;
    uint256 private _totalMatches;
    uint256 private _totalStakedAmount;

    // Events (additional to interface)
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event MinimumStakeUpdated(uint256 oldStake, uint256 newStake);
    event PoolExpired(uint256 indexed poolId);
    event ApplicationWithdrawn(uint256 indexed poolId, address indexed candidate);
    event BatchPoolsCreated(address indexed company, uint256[] poolIds);

    // Modifiers
    modifier poolExists(uint256 poolId) {
        require(poolId < _poolIdCounter.current(), "TalentPool: pool does not exist");
        _;
    }

    modifier onlyPoolCompany(uint256 poolId) {
        require(_pools[poolId].company == _msgSender(), "TalentPool: not pool company");
        _;
    }

    modifier validJobType(JobType jobType) {
        PoolLibrary.validateJobType(jobType);
        _;
    }

    constructor(
        address _skillTokenAddress,
        address _initialFeeCollector,
        address _initialAdmin
    ) EIP712("TalentPool", "1") {
        require(_skillTokenAddress != address(0), "TalentPool: invalid skill token address");
        require(_initialFeeCollector != address(0), "TalentPool: invalid fee collector");
        require(_initialAdmin != address(0), "TalentPool: invalid admin");

        skillToken = ISkillToken(_skillTokenAddress);
        _feeCollector = _initialFeeCollector;

        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(POOL_MANAGER_ROLE, _initialAdmin);
        _grantRole(MATCHER_ROLE, _initialAdmin);
        _grantRole(FEE_MANAGER_ROLE, _initialAdmin);
        _grantRole(PAUSER_ROLE, _initialAdmin);
    }

    /**
     * @dev Create a new job pool
     */
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
    ) 
        external 
        payable 
        override 
        whenNotPaused
        validJobType(jobType)
        nonReentrant
        returns (uint256 poolId)
    {
        require(bytes(title).length > 0, "TalentPool: title cannot be empty");
        require(bytes(description).length > 0, "TalentPool: description cannot be empty");
        
        // Validate parameters using library
        PoolLibrary.validatePoolCreation(
            msg.value,
            salaryMin,
            salaryMax,
            deadline,
            requiredSkills,
            minimumLevels
        );

        poolId = _poolIdCounter.current();
        _poolIdCounter.increment();

        // Create pool
        _pools[poolId] = JobPool({
            id: poolId,
            company: _msgSender(),
            title: title,
            description: description,
            jobType: jobType,
            requiredSkills: requiredSkills,
            minimumLevels: minimumLevels,
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            stakeAmount: msg.value,
            deadline: deadline,
            createdAt: uint64(block.timestamp),
            status: PoolStatus.Active,
            selectedCandidate: address(0),
            totalApplications: 0,
            location: location.normalizeLocation(),
            isRemote: isRemote
        });

        // Update indexes
        _poolsByCompany[_msgSender()].push(poolId);
        
        // Initialize metrics
        _poolMetrics[poolId] = PoolMetrics({
            totalStaked: msg.value,
            averageMatchScore: 0,
            completionRate: 0,
            averageTimeToFill: 0
        });

        // Update global statistics
        _totalPoolsCreated++;
        _totalStakedAmount += msg.value;

        emit PoolCreated(poolId, _msgSender(), jobType, msg.value, salaryMax - salaryMin);
    }

    /**
     * @dev Create multiple pools in a single transaction
     */
    function batchCreatePools(
        string[] calldata titles,
        string[] calldata descriptions,
        JobType[] calldata jobTypes,
        string[][] calldata requiredSkills,
        uint8[][] calldata minimumLevels,
        uint256[] calldata salaryMins,
        uint256[] calldata salaryMaxs,
        uint64[] calldata deadlines,
        string[] calldata locations,
        bool[] calldata isRemoteArray,
        uint256[] calldata stakeAmounts
    ) 
        external 
        payable 
        whenNotPaused
        nonReentrant
        returns (uint256[] memory poolIds)
    {
        require(titles.length > 0, "TalentPool: empty batch");
        require(
            titles.length == descriptions.length &&
            titles.length == jobTypes.length &&
            titles.length == requiredSkills.length &&
            titles.length == minimumLevels.length &&
            titles.length == salaryMins.length &&
            titles.length == salaryMaxs.length &&
            titles.length == deadlines.length &&
            titles.length == locations.length &&
            titles.length == isRemoteArray.length &&
            titles.length == stakeAmounts.length,
            "TalentPool: array length mismatch"
        );

        uint256 totalStake = 0;
        for (uint256 i = 0; i < stakeAmounts.length; i++) {
            totalStake += stakeAmounts[i];
        }
        require(msg.value == totalStake, "TalentPool: incorrect total stake");

        poolIds = new uint256[](titles.length);
        uint256 stakeOffset = 0;

        for (uint256 i = 0; i < titles.length; i++) {
            // Temporarily store the current stake amount for this pool
            uint256 currentStake = stakeAmounts[i];
            
            // Create individual pool (this would need adjustment to handle individual stakes)
            poolIds[i] = _createSinglePool(
                titles[i],
                descriptions[i],
                jobTypes[i],
                requiredSkills[i],
                minimumLevels[i],
                salaryMins[i],
                salaryMaxs[i],
                deadlines[i],
                locations[i],
                isRemoteArray[i],
                currentStake
            );
            
            stakeOffset += currentStake;
        }

        emit BatchPoolsCreated(_msgSender(), poolIds);
    }

    /**
     * @dev Submit application to a pool
     */
    function submitApplication(
        uint256 poolId,
        uint256[] calldata skillTokenIds,
        string calldata coverLetter,
        string calldata portfolio
    ) 
        external 
        payable 
        override 
        whenNotPaused
        poolExists(poolId)
        nonReentrant
    {
        JobPool storage pool = _pools[poolId];
        
        // Validate application using library
        PoolLibrary.validateApplication(
            msg.value,
            skillTokenIds,
            pool.status,
            pool.deadline
        );

        require(
            _applications[poolId][_msgSender()].candidate == address(0),
            "TalentPool: already applied to this pool"
        );

        // Verify skill token ownership
        for (uint256 i = 0; i < skillTokenIds.length; i++) {
            require(
                skillToken.ownerOf(skillTokenIds[i]) == _msgSender(),
                "TalentPool: not skill token owner"
            );
            require(
                skillToken.isSkillActive(skillTokenIds[i]),
                "TalentPool: inactive skill token"
            );
        }

        // Calculate match score
        uint256 matchScore = _calculateApplicationMatchScore(poolId, skillTokenIds);

        // Create application
        _applications[poolId][_msgSender()] = Application({
            candidate: _msgSender(),
            skillTokenIds: skillTokenIds,
            stakeAmount: msg.value,
            appliedAt: uint64(block.timestamp),
            status: ApplicationStatus.Pending,
            matchScore: matchScore,
            coverLetter: coverLetter,
            portfolio: portfolio
        });

        // Update indexes
        _poolApplicants[poolId].push(_msgSender());
        _applicationsByCandidate[_msgSender()].push(poolId);
        _poolMatchScores[poolId].push(matchScore);

        // Update pool and metrics
        pool.totalApplications++;
        _poolMetrics[poolId].totalStaked += msg.value;
        _updateAverageMatchScore(poolId);

        // Update global statistics
        _totalApplicationsSubmitted++;
        _totalStakedAmount += msg.value;

        emit ApplicationSubmitted(poolId, _msgSender(), skillTokenIds, msg.value);
    }

    /**
     * @dev Submit application with signature (gasless)
     */
    function submitApplicationWithSignature(
        uint256 poolId,
        uint256[] calldata skillTokenIds,
        string calldata coverLetter,
        string calldata portfolio,
        uint256 stakeAmount,
        uint256 deadline,
        bytes calldata signature
    ) 
        external 
        payable
        whenNotPaused
        poolExists(poolId)
        nonReentrant
    {
        require(block.timestamp <= deadline, "TalentPool: signature expired");

        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            _APPLICATION_TYPEHASH,
            poolId,
            keccak256(abi.encodePacked(skillTokenIds)),
            keccak256(bytes(coverLetter)),
            _useNonce(_msgSender()),
            deadline
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == _msgSender(), "TalentPool: invalid signature");

        // For gasless transactions, the relayer (msg.sender) provides the stake
        // This allows for sponsored transactions where companies pay for candidate applications
        require(msg.value == stakeAmount, "TalentPool: incorrect stake amount provided by relayer");
        
        // Create the application
        Application memory newApplication = Application({
            candidate: signer,
            skillTokenIds: skillTokenIds,
            stakeAmount: stakeAmount,
            appliedAt: uint64(block.timestamp),
            status: ApplicationStatus.Pending,
            matchScore: 0,
            coverLetter: coverLetter,
            portfolio: portfolio
        });

        // Store application (one application per candidate per pool)
        _applications[poolId][signer] = newApplication;
        _poolApplicants[poolId].push(signer);
        _applicationsByCandidate[signer].push(poolId);

        // Calculate match score
        uint256 matchScore = _calculateApplicationMatchScore(poolId, skillTokenIds);
        _applications[poolId][signer].matchScore = matchScore;
        
        // Update pool metrics
        JobPool storage pool = _pools[poolId];
        pool.totalApplications++;
        
        // Update global statistics
        _totalApplicationsSubmitted++;

        emit ApplicationSubmitted(poolId, signer, skillTokenIds, stakeAmount);
    }

    /**
     * @dev Select candidate for a pool
     */
    function selectCandidate(
        uint256 poolId,
        address candidate
    ) 
        external 
        override 
        onlyPoolCompany(poolId)
        poolExists(poolId)
        nonReentrant
    {
        JobPool storage pool = _pools[poolId];
        require(pool.status == PoolStatus.Active, "TalentPool: pool not active");
        require(pool.selectedCandidate == address(0), "TalentPool: candidate already selected");
        
        Application storage app = _applications[poolId][candidate];
        require(app.candidate != address(0), "TalentPool: candidate not found");
        require(app.status == ApplicationStatus.Pending, "TalentPool: invalid application status");

        pool.selectedCandidate = candidate;
        app.status = ApplicationStatus.Accepted;

        // Calculate match score for the selected candidate
        uint256 matchScore = app.matchScore;

        emit MatchMade(poolId, _msgSender(), candidate, matchScore);
    }

    /**
     * @dev Complete pool and distribute rewards
     */
    function completePool(uint256 poolId) 
        external 
        override 
        onlyPoolCompany(poolId)
        poolExists(poolId)
        nonReentrant
    {
        JobPool storage pool = _pools[poolId];
        require(pool.status == PoolStatus.Active, "TalentPool: pool not active");
        require(pool.selectedCandidate != address(0), "TalentPool: no candidate selected");

        pool.status = PoolStatus.Completed;
        
        address selectedCandidate = pool.selectedCandidate;
        Application storage selectedApp = _applications[poolId][selectedCandidate];
        
        // Calculate rewards and fees
        uint256 companyStake = pool.stakeAmount;
        uint256 candidateStake = selectedApp.stakeAmount;
        uint256 totalStake = companyStake + candidateStake;
        
        uint256 platformFee = PoolLibrary.calculatePlatformFee(totalStake, _platformFeeRate);
        uint256 completionBonus = PoolLibrary.calculateCompletionBonus(
            totalStake,
            pool.totalApplications,
            pool.createdAt
        );
        
        uint256 candidateReward = candidateStake + completionBonus;
        uint256 companyRefund = companyStake - platformFee;

        // Distribute rewards
        if (platformFee > 0) {
            payable(_feeCollector).transfer(platformFee);
        }
        
        if (candidateReward > 0) {
            payable(selectedCandidate).transfer(candidateReward);
        }
        
        if (companyRefund > 0) {
            payable(pool.company).transfer(companyRefund);
        }

        // Refund other applicants (minus penalties)
        _refundRejectedApplicants(poolId);

        // Update metrics
        _poolMetrics[poolId].completionRate = 100;
        _poolMetrics[poolId].averageTimeToFill = block.timestamp - pool.createdAt;

        // Update global statistics
        _totalMatches++;

        emit PoolCompleted(poolId, selectedCandidate, candidateReward + companyRefund);
    }

    /**
     * @dev Withdraw application from pool
     */
    function withdrawApplication(uint256 poolId) 
        external 
        override 
        poolExists(poolId)
        nonReentrant
    {
        Application storage app = _applications[poolId][_msgSender()];
        require(app.candidate == _msgSender(), "TalentPool: no application found");
        require(app.status == ApplicationStatus.Pending, "TalentPool: cannot withdraw");

        JobPool storage pool = _pools[poolId];
        require(pool.status == PoolStatus.Active, "TalentPool: pool not active");

        app.status = ApplicationStatus.Withdrawn;

        // Calculate penalty
        uint256 penalty = PoolLibrary.calculateWithdrawalPenalty(
            app.appliedAt,
            pool.deadline,
            app.stakeAmount
        );

        uint256 refundAmount = app.stakeAmount - penalty;

        // Transfer penalty to platform
        if (penalty > 0) {
            payable(_feeCollector).transfer(penalty);
        }

        // Refund remaining amount
        if (refundAmount > 0) {
            payable(_msgSender()).transfer(refundAmount);
        }

        emit ApplicationWithdrawn(poolId, _msgSender());
    }

    /**
     * @dev Close pool (company only)
     */
    function closePool(uint256 poolId) 
        external 
        override 
        onlyPoolCompany(poolId)
        poolExists(poolId)
        nonReentrant
    {
        JobPool storage pool = _pools[poolId];
        require(pool.status == PoolStatus.Active, "TalentPool: pool not active");
        require(pool.selectedCandidate == address(0), "TalentPool: candidate selected");

        pool.status = PoolStatus.Cancelled;

        // Refund company stake
        payable(pool.company).transfer(pool.stakeAmount);

        // Refund all applicants
        _refundAllApplicants(poolId);
    }

    // View functions
    function getPool(uint256 poolId) 
        external 
        view 
        override 
        poolExists(poolId)
        returns (JobPool memory) 
    {
        return _pools[poolId];
    }

    function getApplication(uint256 poolId, address candidate) 
        external 
        view 
        override 
        poolExists(poolId)
        returns (Application memory) 
    {
        return _applications[poolId][candidate];
    }

    function getPoolApplications(uint256 poolId) 
        external 
        view 
        override 
        poolExists(poolId)
        returns (Application[] memory applications) 
    {
        address[] memory applicants = _poolApplicants[poolId];
        applications = new Application[](applicants.length);
        
        for (uint256 i = 0; i < applicants.length; i++) {
            applications[i] = _applications[poolId][applicants[i]];
        }
    }

    function getPoolsByCompany(address company) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _poolsByCompany[company];
    }

    function getApplicationsByCandidate(address candidate) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _applicationsByCandidate[candidate];
    }

    function getPoolMetrics(uint256 poolId) 
        external 
        view 
        override 
        poolExists(poolId)
        returns (PoolMetrics memory) 
    {
        return _poolMetrics[poolId];
    }

    function calculateMatchScore(uint256 poolId, address candidate) 
        external 
        view 
        override 
        poolExists(poolId)
        returns (uint256) 
    {
        Application memory app = _applications[poolId][candidate];
        require(app.candidate != address(0), "TalentPool: candidate not found");
        
        return app.matchScore;
    }

    function getActivePoolsCount() external view override returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _poolIdCounter.current(); i++) {
            if (_pools[i].status == PoolStatus.Active) {
                count++;
            }
        }
        return count;
    }

    function getTotalPoolsCount() external view override returns (uint256) {
        return _poolIdCounter.current();
    }

    // Platform management functions
    function setPlatformFeeRate(uint256 newFeeRate) 
        external 
        onlyRole(FEE_MANAGER_ROLE) 
    {
        PoolLibrary.validatePlatformFee(newFeeRate);
        
        uint256 oldFeeRate = _platformFeeRate;
        _platformFeeRate = newFeeRate;
        
        emit PlatformFeeUpdated(oldFeeRate, newFeeRate);
    }

    function setFeeCollector(address newFeeCollector) 
        external 
        onlyRole(FEE_MANAGER_ROLE) 
    {
        require(newFeeCollector != address(0), "TalentPool: invalid fee collector");
        
        address oldFeeCollector = _feeCollector;
        _feeCollector = newFeeCollector;
        
        emit FeeCollectorUpdated(oldFeeCollector, newFeeCollector);
    }

    function setMinimumStake(uint256 newMinimumStake) 
        external 
        onlyRole(POOL_MANAGER_ROLE) 
    {
        uint256 oldMinimumStake = _minimumStake;
        _minimumStake = newMinimumStake;
        
        emit MinimumStakeUpdated(oldMinimumStake, newMinimumStake);
    }

    // Getter functions for platform settings
    function getPlatformFeeRate() external view returns (uint256) {
        return _platformFeeRate;
    }

    function getFeeCollector() external view returns (address) {
        return _feeCollector;
    }

    function getMinimumStake() external view returns (uint256) {
        return _minimumStake;
    }

    // Statistics functions
    function getGlobalStats() 
        external 
        view 
        returns (
            uint256 totalPools,
            uint256 totalApplications,
            uint256 totalMatches,
            uint256 totalStaked
        ) 
    {
        return (
            _totalPoolsCreated,
            _totalApplicationsSubmitted,
            _totalMatches,
            _totalStakedAmount
        );
    }

    function nonces(address owner) external view returns (uint256) {
        return _nonces[owner];
    }

    // Internal functions
    function _createSinglePool(
        string calldata title,
        string calldata description,
        JobType jobType,
        string[] calldata requiredSkills,
        uint8[] calldata minimumLevels,
        uint256 salaryMin,
        uint256 salaryMax,
        uint64 deadline,
        string calldata location,
        bool isRemote,
        uint256 stakeAmount
    ) internal returns (uint256) {
        // Use library for validation
        PoolLibrary.validatePoolCreation(
            stakeAmount,
            salaryMin,
            salaryMax,
            deadline,
            requiredSkills,
            minimumLevels
        );

        uint256 poolId = _poolIdCounter.current();
        _poolIdCounter.increment();

        // Store pool data
        _pools[poolId] = JobPool({
            id: poolId,
            company: _msgSender(),
            title: title,
            description: description,
            jobType: jobType,
            requiredSkills: requiredSkills,
            minimumLevels: minimumLevels,
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            stakeAmount: stakeAmount,
            deadline: deadline,
            createdAt: uint64(block.timestamp),
            status: PoolStatus.Active,
            selectedCandidate: address(0),
            totalApplications: 0,
            location: location,
            isRemote: isRemote
        });

        // Store in indexes  
        _poolsByCompany[_msgSender()].push(poolId);

        // Initialize pool metrics
        _poolMetrics[poolId] = PoolMetrics({
            totalStaked: stakeAmount,
            averageMatchScore: 0,
            completionRate: 0,
            averageTimeToFill: 0
        });

        // Update global statistics
        _totalPoolsCreated++;
        _totalStakedAmount += stakeAmount;

        emit PoolCreated(poolId, _msgSender(), jobType, stakeAmount, salaryMax - salaryMin);
        
        return poolId;
    }

    function _calculateApplicationMatchScore(
        uint256 poolId,
        uint256[] calldata skillTokenIds
    ) internal view returns (uint256) {
        JobPool memory pool = _pools[poolId];
        
        // Get candidate skills from skill tokens
        string[] memory candidateSkills = new string[](skillTokenIds.length);
        uint8[] memory candidateLevels = new uint8[](skillTokenIds.length);
        
        for (uint256 i = 0; i < skillTokenIds.length; i++) {
            ISkillToken.SkillData memory skillData = skillToken.getSkillData(skillTokenIds[i]);
            candidateSkills[i] = skillData.category;
            candidateLevels[i] = skillData.level;
        }
        
        return PoolLibrary.calculateMatchScore(
            pool.requiredSkills,
            pool.minimumLevels,
            candidateSkills,
            candidateLevels
        );
    }

    function _updateAverageMatchScore(uint256 poolId) internal {
        uint256[] memory scores = _poolMatchScores[poolId];
        if (scores.length > 0) {
            uint256 total = 0;
            for (uint256 i = 0; i < scores.length; i++) {
                total += scores[i];
            }
            _poolMetrics[poolId].averageMatchScore = total / scores.length;
        }
    }

    function _refundRejectedApplicants(uint256 poolId) internal {
        address[] memory applicants = _poolApplicants[poolId];
        
        for (uint256 i = 0; i < applicants.length; i++) {
            Application storage app = _applications[poolId][applicants[i]];
            
            if (app.status == ApplicationStatus.Pending) {
                app.status = ApplicationStatus.Rejected;
                
                // Small penalty for unsuccessful applications
                uint256 penalty = app.stakeAmount / 20; // 5% penalty
                uint256 refund = app.stakeAmount - penalty;
                
                if (penalty > 0) {
                    payable(_feeCollector).transfer(penalty);
                }
                
                if (refund > 0) {
                    payable(applicants[i]).transfer(refund);
                }
            }
        }
    }

    function _refundAllApplicants(uint256 poolId) internal {
        address[] memory applicants = _poolApplicants[poolId];
        
        for (uint256 i = 0; i < applicants.length; i++) {
            Application storage app = _applications[poolId][applicants[i]];
            
            if (app.status == ApplicationStatus.Pending) {
                app.status = ApplicationStatus.Rejected;
                payable(applicants[i]).transfer(app.stakeAmount);
            }
        }
    }

    function _useNonce(address owner) internal returns (uint256 current) {
        current = _nonces[owner];
        _nonces[owner]++;
    }

    // Emergency functions
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Auto-expiry function (can be called by anyone)
    function expireOldPools(uint256[] calldata poolIds) external {
        for (uint256 i = 0; i < poolIds.length; i++) {
            uint256 poolId = poolIds[i];
            
            if (poolId < _poolIdCounter.current()) {
                JobPool storage pool = _pools[poolId];
                
                if (pool.status == PoolStatus.Active && 
                    PoolLibrary.shouldAutoExpire(pool.deadline, pool.totalApplications)) {
                    
                    pool.status = PoolStatus.Expired;
                    
                    // Refund company stake
                    payable(pool.company).transfer(pool.stakeAmount);
                    
                    // Refund all applicants
                    _refundAllApplicants(poolId);
                    
                    emit PoolExpired(poolId);
                }
            }
        }
    }
}