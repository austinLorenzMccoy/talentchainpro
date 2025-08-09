// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IReputationOracle
 * @dev Interface for the ReputationOracle contract - AI-powered reputation scoring
 * @author TalentChain Pro Team
 */
interface IReputationOracle {
    // Events
    event ReputationScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore,
        string category,
        address indexed oracle
    );
    
    event WorkEvaluationCompleted(
        uint256 indexed evaluationId,
        address indexed user,
        uint256[] skillTokenIds,
        uint256 overallScore,
        string ipfsHash
    );
    
    event OracleRegistered(
        address indexed oracle,
        string name,
        string[] specializations
    );
    
    event OracleStatusChanged(
        address indexed oracle,
        bool isActive,
        string reason
    );

    // Structs (mappings removed for interface compatibility)
    struct ReputationScore {
        uint256 overallScore;
        uint256 totalEvaluations;
        uint64 lastUpdated;
        bool isActive;
    }

    struct WorkEvaluation {
        uint256 id;
        address user;
        uint256[] skillTokenIds;
        string workDescription;
        string workContent;
        uint256 overallScore;
        string feedback;
        address evaluatedBy;
        uint64 timestamp;
        string ipfsHash;
    }

    struct OracleInfo {
        address oracle;
        string name;
        string[] specializations;
        uint256 evaluationsCompleted;
        uint256 averageScore;
        uint64 registeredAt;
        bool isActive;
        uint256 stake;
    }

    // Core functions
    function registerOracle(
        string calldata name,
        string[] calldata specializations
    ) external payable;

    function submitWorkEvaluation(
        address user,
        uint256[] calldata skillTokenIds,
        string calldata workDescription,
        string calldata workContent,
        uint256 overallScore,
        uint256[] calldata skillScores,
        string calldata feedback,
        string calldata ipfsHash
    ) external returns (uint256 evaluationId);

    function updateReputationScore(
        address user,
        string calldata category,
        uint256 newScore,
        string calldata evidence
    ) external;

    function challengeEvaluation(
        uint256 evaluationId,
        string calldata reason
    ) external payable;

    function resolveChallenge(
        uint256 challengeId,
        bool upholdOriginal,
        string calldata resolution
    ) external;

    // View functions
    function getReputationScore(address user) 
        external 
        view 
        returns (
            uint256 overallScore,
            uint256 totalEvaluations,
            uint64 lastUpdated,
            bool isActive
        );

    function getCategoryScore(address user, string calldata category) 
        external 
        view 
        returns (uint256);

    function getWorkEvaluation(uint256 evaluationId) 
        external 
        view 
        returns (
            address user,
            uint256[] memory skillTokenIds,
            uint256 overallScore,
            string memory feedback,
            address evaluatedBy,
            uint64 timestamp,
            string memory ipfsHash
        );

    function getOracleInfo(address oracle) 
        external 
        view 
        returns (OracleInfo memory);

    function getActiveOracles() 
        external 
        view 
        returns (address[] memory);

    function getUserEvaluations(address user) 
        external 
        view 
        returns (uint256[] memory);

    function isAuthorizedOracle(address oracle) 
        external 
        view 
        returns (bool);

    function getMinimumOracleStake() 
        external 
        view 
        returns (uint256);

    function getTotalEvaluations() 
        external 
        view 
        returns (uint256);
}