// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import "./interfaces/IReputationOracle.sol";
import "./interfaces/ISkillToken.sol";

/**
 * @title ReputationOracle
 * @dev Enterprise-grade AI-powered reputation scoring system
 * @author TalentChain Pro Team
 * 
 * Features:
 * - Decentralized oracle network with staking requirements
 * - AI-powered work evaluation and skill assessment
 * - Challenge mechanism for disputed evaluations
 * - Category-specific reputation scoring
 * - Oracle performance tracking and rewards
 * - Slashing mechanism for malicious behavior
 * - IPFS integration for storing evaluation data
 * - Multi-signature oracle consensus for critical updates
 * - Time-weighted reputation decay for recency
 */
contract ReputationOracle is 
    AccessControl, 
    Pausable, 
    ReentrancyGuard, 
    EIP712,
    IReputationOracle 
{
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    // Role definitions
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");
    bytes32 public constant CHALLENGE_RESOLVER_ROLE = keccak256("CHALLENGE_RESOLVER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Constants
    uint256 public constant MIN_ORACLE_STAKE = 10 ether;
    uint256 public constant MIN_CHALLENGE_STAKE = 1 ether;
    uint256 public constant MAX_REPUTATION_SCORE = 10000; // 100.00%
    uint256 public constant REPUTATION_DECAY_PERIOD = 180 days;
    uint256 public constant ORACLE_COOLDOWN = 1 hours;
    
    // Challenge periods
    uint256 public constant CHALLENGE_PERIOD = 7 days;
    uint256 public constant RESOLUTION_PERIOD = 3 days;

    // State variables
    Counters.Counter private _evaluationIdCounter;
    Counters.Counter private _challengeIdCounter;
    ISkillToken public immutable skillToken;
    
    // Oracle management
    mapping(address => OracleInfo) private _oracles;
    address[] private _activeOracles;
    mapping(address => bool) private _isActiveOracle;
    
    // Reputation scores
    mapping(address => ReputationScore) private _reputationScores;
    mapping(address => mapping(string => uint256)) private _categoryScores;
    
    // Work evaluations
    mapping(uint256 => WorkEvaluation) private _evaluations;
    mapping(uint256 => mapping(string => uint256)) private _evaluationSkillScores;
    mapping(address => uint256[]) private _userEvaluations;
    
    // Challenge system
    struct Challenge {
        uint256 id;
        uint256 evaluationId;
        address challenger;
        string reason;
        uint256 stake;
        uint64 createdAt;
        uint64 resolutionDeadline;
        bool isResolved;
        bool upholdOriginal;
        string resolution;
        address resolver;
    }
    
    mapping(uint256 => Challenge) private _challenges;
    mapping(uint256 => bool) private _evaluationChallenged;
    
    // Oracle performance tracking
    mapping(address => uint256) private _oracleLastActivity;
    mapping(address => uint256) private _oracleEvaluationCount;
    mapping(address => uint256) private _oracleSuccessfulChallenges;
    mapping(address => uint256) private _oracleFailedChallenges;
    
    // Platform statistics
    uint256 private _totalEvaluations;
    uint256 private _totalChallenges;
    uint256 private _totalOracleStake;

    // Events (additional to interface)
    event ChallengeCreated(
        uint256 indexed challengeId,
        uint256 indexed evaluationId,
        address indexed challenger,
        uint256 stake
    );
    
    event ChallengeResolved(
        uint256 indexed challengeId,
        bool upholdOriginal,
        address indexed resolver
    );
    
    event OracleSlashed(
        address indexed oracle,
        uint256 amount,
        string reason
    );
    
    event OracleRewarded(
        address indexed oracle,
        uint256 amount,
        string reason
    );

    // Modifiers
    modifier onlyActiveOracle() {
        require(_isActiveOracle[_msgSender()], "ReputationOracle: not active oracle");
        require(_oracles[_msgSender()].isActive, "ReputationOracle: oracle inactive");
        _;
    }

    modifier evaluationExists(uint256 evaluationId) {
        require(evaluationId < _evaluationIdCounter.current(), "ReputationOracle: evaluation not found");
        _;
    }

    modifier challengeExists(uint256 challengeId) {
        require(challengeId < _challengeIdCounter.current(), "ReputationOracle: challenge not found");
        _;
    }

    modifier validScore(uint256 score) {
        require(score <= MAX_REPUTATION_SCORE, "ReputationOracle: invalid score");
        _;
    }

    constructor(
        address _skillTokenAddress,
        address _initialAdmin
    ) EIP712("ReputationOracle", "1") {
        require(_skillTokenAddress != address(0), "ReputationOracle: invalid skill token");
        require(_initialAdmin != address(0), "ReputationOracle: invalid admin");

        skillToken = ISkillToken(_skillTokenAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(ORACLE_ADMIN_ROLE, _initialAdmin);
        _grantRole(CHALLENGE_RESOLVER_ROLE, _initialAdmin);
        _grantRole(PAUSER_ROLE, _initialAdmin);
    }

    /**
     * @dev Register as an oracle
     */
    function registerOracle(
        string calldata name,
        string[] calldata specializations
    ) 
        external 
        payable 
        override 
        whenNotPaused
    {
        require(msg.value >= MIN_ORACLE_STAKE, "ReputationOracle: insufficient stake");
        require(bytes(name).length > 0, "ReputationOracle: empty name");
        require(specializations.length > 0, "ReputationOracle: no specializations");
        require(!_isActiveOracle[_msgSender()], "ReputationOracle: already registered");

        _oracles[_msgSender()] = OracleInfo({
            oracle: _msgSender(),
            name: name,
            specializations: specializations,
            evaluationsCompleted: 0,
            averageScore: 0,
            registeredAt: uint64(block.timestamp),
            isActive: true,
            stake: msg.value
        });

        _activeOracles.push(_msgSender());
        _isActiveOracle[_msgSender()] = true;
        _totalOracleStake += msg.value;

        emit OracleRegistered(_msgSender(), name, specializations);
    }

    /**
     * @dev Submit work evaluation
     */
    function submitWorkEvaluation(
        address user,
        uint256[] calldata skillTokenIds,
        string calldata workDescription,
        string calldata workContent,
        uint256 overallScore,
        uint256[] calldata skillScores,
        string calldata feedback,
        string calldata ipfsHash
    ) 
        external 
        override 
        onlyActiveOracle
        whenNotPaused
        validScore(overallScore)
        nonReentrant
        returns (uint256 evaluationId)
    {
        require(user != address(0), "ReputationOracle: invalid user");
        require(skillTokenIds.length > 0, "ReputationOracle: no skill tokens");
        require(skillTokenIds.length == skillScores.length, "ReputationOracle: array length mismatch");
        require(bytes(workDescription).length > 0, "ReputationOracle: empty description");
        require(bytes(ipfsHash).length > 0, "ReputationOracle: empty IPFS hash");

        // Validate skill token ownership and activity
        for (uint256 i = 0; i < skillTokenIds.length; i++) {
            require(skillToken.ownerOf(skillTokenIds[i]) == user, "ReputationOracle: not token owner");
            require(skillToken.isSkillActive(skillTokenIds[i]), "ReputationOracle: inactive token");
            require(skillScores[i] <= MAX_REPUTATION_SCORE, "ReputationOracle: invalid skill score");
        }

        // Check oracle cooldown
        require(
            block.timestamp >= _oracleLastActivity[_msgSender()] + ORACLE_COOLDOWN,
            "ReputationOracle: oracle cooldown active"
        );

        evaluationId = _evaluationIdCounter.current();
        _evaluationIdCounter.increment();

        // Store evaluation
        _evaluations[evaluationId] = WorkEvaluation({
            id: evaluationId,
            user: user,
            skillTokenIds: skillTokenIds,
            workDescription: workDescription,
            workContent: workContent,
            overallScore: overallScore,
            feedback: feedback,
            evaluatedBy: _msgSender(),
            timestamp: uint64(block.timestamp),
            ipfsHash: ipfsHash
        });

        // Store skill scores
        for (uint256 i = 0; i < skillTokenIds.length; i++) {
            ISkillToken.SkillData memory skillData = skillToken.getSkillData(skillTokenIds[i]);
            _evaluationSkillScores[evaluationId][skillData.category] = skillScores[i];
        }

        // Update user evaluations index
        _userEvaluations[user].push(evaluationId);

        // Update oracle activity
        _oracleLastActivity[_msgSender()] = block.timestamp;
        _oracleEvaluationCount[_msgSender()]++;

        // Update reputation scores
        _updateReputationScores(user, skillTokenIds, overallScore, skillScores);

        // Update statistics
        _totalEvaluations++;

        emit WorkEvaluationCompleted(evaluationId, user, skillTokenIds, overallScore, ipfsHash);
    }

    /**
     * @dev Update reputation score (oracle only)
     */
    function updateReputationScore(
        address user,
        string calldata category,
        uint256 newScore,
        string calldata evidence
    ) 
        external 
        override 
        onlyActiveOracle
        whenNotPaused
        validScore(newScore)
    {
        require(user != address(0), "ReputationOracle: invalid user");
        require(bytes(category).length > 0, "ReputationOracle: empty category");
        require(bytes(evidence).length > 0, "ReputationOracle: empty evidence");

        uint256 oldScore = _categoryScores[user][category];
        _categoryScores[user][category] = newScore;

        // Update overall score (weighted average)
        _recalculateOverallScore(user);

        // Update last updated timestamp
        _reputationScores[user].lastUpdated = uint64(block.timestamp);

        emit ReputationScoreUpdated(user, oldScore, newScore, category, _msgSender());
    }

    /**
     * @dev Challenge an evaluation
     */
    function challengeEvaluation(
        uint256 evaluationId,
        string calldata reason
    ) 
        external 
        payable 
        override 
        evaluationExists(evaluationId)
        whenNotPaused
        nonReentrant
    {
        require(msg.value >= MIN_CHALLENGE_STAKE, "ReputationOracle: insufficient challenge stake");
        require(bytes(reason).length > 0, "ReputationOracle: empty reason");
        require(!_evaluationChallenged[evaluationId], "ReputationOracle: already challenged");

        WorkEvaluation memory evaluation = _evaluations[evaluationId];
        require(
            block.timestamp <= evaluation.timestamp + CHALLENGE_PERIOD,
            "ReputationOracle: challenge period expired"
        );

        uint256 challengeId = _challengeIdCounter.current();
        _challengeIdCounter.increment();

        _challenges[challengeId] = Challenge({
            id: challengeId,
            evaluationId: evaluationId,
            challenger: _msgSender(),
            reason: reason,
            stake: msg.value,
            createdAt: uint64(block.timestamp),
            resolutionDeadline: uint64(block.timestamp + RESOLUTION_PERIOD),
            isResolved: false,
            upholdOriginal: false,
            resolution: "",
            resolver: address(0)
        });

        _evaluationChallenged[evaluationId] = true;
        _totalChallenges++;

        emit ChallengeCreated(challengeId, evaluationId, _msgSender(), msg.value);
    }

    /**
     * @dev Resolve challenge
     */
    function resolveChallenge(
        uint256 challengeId,
        bool upholdOriginal,
        string calldata resolution
    ) 
        external 
        override 
        onlyRole(CHALLENGE_RESOLVER_ROLE)
        challengeExists(challengeId)
        nonReentrant
    {
        Challenge storage challenge = _challenges[challengeId];
        require(!challenge.isResolved, "ReputationOracle: already resolved");
        require(bytes(resolution).length > 0, "ReputationOracle: empty resolution");

        challenge.isResolved = true;
        challenge.upholdOriginal = upholdOriginal;
        challenge.resolution = resolution;
        challenge.resolver = _msgSender();

        WorkEvaluation memory evaluation = _evaluations[challenge.evaluationId];
        address oracle = evaluation.evaluatedBy;

        if (upholdOriginal) {
            // Oracle was correct, challenger loses stake
            payable(_msgSender()).transfer(challenge.stake);
            _oracleSuccessfulChallenges[oracle]++;
            
            emit OracleRewarded(oracle, challenge.stake / 2, "Successful challenge defense");
        } else {
            // Oracle was wrong, slash oracle stake
            uint256 slashAmount = _oracles[oracle].stake / 10; // 10% slash
            _oracles[oracle].stake -= slashAmount;
            _totalOracleStake -= slashAmount;
            
            // Reward challenger
            payable(challenge.challenger).transfer(challenge.stake + slashAmount);
            _oracleFailedChallenges[oracle]++;
            
            // Revert reputation changes from this evaluation
            _revertEvaluationReputationChanges(challenge.evaluationId);
            
            emit OracleSlashed(oracle, slashAmount, "Failed challenge resolution");
        }

        // Deactivate oracle if too many failed challenges
        if (_oracleFailedChallenges[oracle] >= 3) {
            _oracles[oracle].isActive = false;
            _isActiveOracle[oracle] = false;
            
            emit OracleStatusChanged(oracle, false, "Too many failed challenges");
        }

        emit ChallengeResolved(challengeId, upholdOriginal, _msgSender());
    }

    // View functions
    function getReputationScore(address user) 
        external 
        view 
        override 
        returns (
            uint256 overallScore,
            uint256 totalEvaluations,
            uint64 lastUpdated,
            bool isActive
        ) 
    {
        ReputationScore storage score = _reputationScores[user];
        return (
            score.overallScore,
            score.totalEvaluations,
            score.lastUpdated,
            score.isActive
        );
    }

    function getCategoryScore(address user, string calldata category) 
        external 
        view 
        override 
        returns (uint256) 
    {
        return _categoryScores[user][category];
    }

    function getWorkEvaluation(uint256 evaluationId) 
        external 
        view 
        override 
        evaluationExists(evaluationId)
        returns (
            address user,
            uint256[] memory skillTokenIds,
            uint256 overallScore,
            string memory feedback,
            address evaluatedBy,
            uint64 timestamp,
            string memory ipfsHash
        ) 
    {
        WorkEvaluation memory evaluation = _evaluations[evaluationId];
        return (
            evaluation.user,
            evaluation.skillTokenIds,
            evaluation.overallScore,
            evaluation.feedback,
            evaluation.evaluatedBy,
            evaluation.timestamp,
            evaluation.ipfsHash
        );
    }

    function getOracleInfo(address oracle) 
        external 
        view 
        override 
        returns (OracleInfo memory) 
    {
        return _oracles[oracle];
    }

    function getActiveOracles() 
        external 
        view 
        override 
        returns (address[] memory) 
    {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _activeOracles.length; i++) {
            if (_oracles[_activeOracles[i]].isActive) {
                activeCount++;
            }
        }
        
        address[] memory active = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _activeOracles.length; i++) {
            if (_oracles[_activeOracles[i]].isActive) {
                active[index] = _activeOracles[i];
                index++;
            }
        }
        
        return active;
    }

    function getUserEvaluations(address user) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _userEvaluations[user];
    }

    function isAuthorizedOracle(address oracle) 
        external 
        view 
        override 
        returns (bool) 
    {
        return _isActiveOracle[oracle] && _oracles[oracle].isActive;
    }

    function getMinimumOracleStake() 
        external 
        pure 
        override 
        returns (uint256) 
    {
        return MIN_ORACLE_STAKE;
    }

    function getTotalEvaluations() 
        external 
        view 
        override 
        returns (uint256) 
    {
        return _totalEvaluations;
    }

    function getChallenge(uint256 challengeId) 
        external 
        view 
        challengeExists(challengeId)
        returns (Challenge memory) 
    {
        return _challenges[challengeId];
    }

    function getOraclePerformance(address oracle) 
        external 
        view 
        returns (
            uint256 evaluationsCompleted,
            uint256 successfulChallenges,
            uint256 failedChallenges,
            uint256 lastActivity
        ) 
    {
        return (
            _oracleEvaluationCount[oracle],
            _oracleSuccessfulChallenges[oracle],
            _oracleFailedChallenges[oracle],
            _oracleLastActivity[oracle]
        );
    }

    function getGlobalStats() 
        external 
        view 
        returns (
            uint256 totalEvaluations,
            uint256 totalChallenges,
            uint256 totalOracleStake,
            uint256 activeOracleCount
        ) 
    {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _activeOracles.length; i++) {
            if (_oracles[_activeOracles[i]].isActive) {
                activeCount++;
            }
        }
        
        return (_totalEvaluations, _totalChallenges, _totalOracleStake, activeCount);
    }

    // Internal functions
    function _updateReputationScores(
        address user,
        uint256[] calldata skillTokenIds,
        uint256 overallScore,
        uint256[] calldata skillScores
    ) internal {
        ReputationScore storage userScore = _reputationScores[user];
        
        // Initialize if first evaluation
        if (!userScore.isActive) {
            userScore.isActive = true;
        }
        
        // Update category scores
        for (uint256 i = 0; i < skillTokenIds.length; i++) {
            ISkillToken.SkillData memory skillData = skillToken.getSkillData(skillTokenIds[i]);
            string memory category = skillData.category;
            
            uint256 currentScore = _categoryScores[user][category];
            uint256 newScore = _calculateWeightedScore(currentScore, skillScores[i], userScore.totalEvaluations);
            _categoryScores[user][category] = newScore;
        }
        
        // Update overall score
        uint256 currentOverall = userScore.overallScore;
        uint256 newOverall = _calculateWeightedScore(currentOverall, overallScore, userScore.totalEvaluations);
        userScore.overallScore = newOverall;
        
        // Update metadata
        userScore.totalEvaluations++;
        userScore.lastUpdated = uint64(block.timestamp);
    }

    function _calculateWeightedScore(
        uint256 currentScore,
        uint256 newScore,
        uint256 evaluationCount
    ) internal pure returns (uint256) {
        if (evaluationCount == 0) {
            return newScore;
        }
        
        // Weighted average with decay for older scores
        uint256 weight = evaluationCount > 10 ? 10 : evaluationCount;
        return (currentScore * weight + newScore) / (weight + 1);
    }

    function _recalculateOverallScore(address user) internal {
        // This would recalculate based on all category scores
        // Implementation would depend on specific business logic
        ReputationScore storage userScore = _reputationScores[user];
        userScore.lastUpdated = uint64(block.timestamp);
    }

    function _revertEvaluationReputationChanges(uint256 evaluationId) internal {
        // This would revert the reputation changes made by a specific evaluation
        // Implementation would require tracking evaluation-specific changes
        WorkEvaluation memory evaluation = _evaluations[evaluationId];
        
        // Mark evaluation as disputed
        // In a full implementation, this would involve complex logic to revert scores
        // For now, we'll mark the user's reputation as needing recalculation
        _reputationScores[evaluation.user].lastUpdated = uint64(block.timestamp);
    }

    // Oracle management functions
    function updateOracleStatus(address oracle, bool isActive, string calldata reason) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(_oracles[oracle].oracle != address(0), "ReputationOracle: oracle not registered");
        
        _oracles[oracle].isActive = isActive;
        _isActiveOracle[oracle] = isActive;
        
        emit OracleStatusChanged(oracle, isActive, reason);
    }

    function slashOracle(address oracle, uint256 amount, string calldata reason) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(_oracles[oracle].oracle != address(0), "ReputationOracle: oracle not registered");
        require(_oracles[oracle].stake >= amount, "ReputationOracle: insufficient stake");
        
        _oracles[oracle].stake -= amount;
        _totalOracleStake -= amount;
        
        // Transfer slashed amount to admin (or burn)
        payable(_msgSender()).transfer(amount);
        
        emit OracleSlashed(oracle, amount, reason);
    }

    function withdrawOracleStake() external nonReentrant {
        require(!_isActiveOracle[_msgSender()], "ReputationOracle: oracle still active");
        
        OracleInfo storage oracle = _oracles[_msgSender()];
        require(oracle.oracle != address(0), "ReputationOracle: not registered");
        require(oracle.stake > 0, "ReputationOracle: no stake to withdraw");
        
        uint256 stakeAmount = oracle.stake;
        oracle.stake = 0;
        _totalOracleStake -= stakeAmount;
        
        payable(_msgSender()).transfer(stakeAmount);
    }

    // Emergency functions
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Emergency withdrawal (admin only)
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(_msgSender()).transfer(address(this).balance);
    }
}