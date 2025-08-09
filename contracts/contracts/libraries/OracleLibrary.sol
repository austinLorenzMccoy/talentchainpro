// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OracleLibrary
 * @dev Library containing utility functions for oracle and reputation management
 * @author TalentChain Pro Team
 */
library OracleLibrary {
    // Constants
    uint256 public constant MIN_ORACLE_STAKE = 10 ether;
    uint256 public constant MAX_ORACLE_STAKE = 1000 ether;
    uint256 public constant MIN_CHALLENGE_STAKE = 1 ether;
    uint256 public constant MAX_REPUTATION_SCORE = 10000; // 100.00%
    uint256 public constant REPUTATION_DECAY_RATE = 50; // 0.5% per day
    uint256 public constant ORACLE_COOLDOWN_PERIOD = 1 hours;
    uint256 public constant CHALLENGE_PERIOD = 7 days;
    uint256 public constant RESOLUTION_PERIOD = 3 days;
    uint256 public constant MAX_SPECIALIZATIONS = 10;
    uint256 public constant MIN_EVALUATION_WORDS = 50;
    uint256 public constant SLASH_RATE = 1000; // 10%
    uint256 public constant REWARD_MULTIPLIER = 150; // 1.5x
    
    // Score weights
    uint256 public constant QUALITY_WEIGHT = 40;
    uint256 public constant CONSISTENCY_WEIGHT = 30;
    uint256 public constant TIMELINESS_WEIGHT = 20;
    uint256 public constant ACCURACY_WEIGHT = 10;

    // Errors
    error InsufficientOracleStake(uint256 provided, uint256 required);
    error InsufficientChallengeStake(uint256 provided, uint256 required);
    error InvalidReputationScore(uint256 score);
    error OracleNotActive();
    error OracleCooldownActive();
    error TooManySpecializations(uint256 count);
    error EmptySpecialization();
    error EvaluationTooShort();
    error ChallengeWindowExpired();
    error InvalidChallengeReason();
    error OracleNotFound();
    error EvaluationNotFound();
    error ChallengeNotFound();
    error InvalidSkillTokens();
    error ArrayLengthMismatch();

    /**
     * @dev Validates oracle registration parameters
     */
    function validateOracleRegistration(
        string memory name,
        string[] memory specializations,
        uint256 stakeAmount
    ) internal pure {
        if (stakeAmount < MIN_ORACLE_STAKE) {
            revert InsufficientOracleStake(stakeAmount, MIN_ORACLE_STAKE);
        }
        
        if (bytes(name).length == 0) {
            revert("OracleLibrary: empty name");
        }
        
        if (specializations.length == 0) {
            revert("OracleLibrary: no specializations");
        }
        
        if (specializations.length > MAX_SPECIALIZATIONS) {
            revert TooManySpecializations(specializations.length);
        }
        
        for (uint256 i = 0; i < specializations.length; i++) {
            if (bytes(specializations[i]).length == 0) {
                revert EmptySpecialization();
            }
        }
    }

    /**
     * @dev Validates work evaluation parameters
     */
    function validateWorkEvaluation(
        address user,
        uint256[] memory skillTokenIds,
        string memory workDescription,
        string memory feedback,
        uint256 overallScore,
        uint256[] memory skillScores
    ) internal pure {
        if (user == address(0)) {
            revert("OracleLibrary: invalid user");
        }
        
        if (skillTokenIds.length == 0) {
            revert InvalidSkillTokens();
        }
        
        if (skillTokenIds.length != skillScores.length) {
            revert ArrayLengthMismatch();
        }
        
        if (overallScore > MAX_REPUTATION_SCORE) {
            revert InvalidReputationScore(overallScore);
        }
        
        for (uint256 i = 0; i < skillScores.length; i++) {
            if (skillScores[i] > MAX_REPUTATION_SCORE) {
                revert InvalidReputationScore(skillScores[i]);
            }
        }
        
        if (countWords(workDescription) < MIN_EVALUATION_WORDS) {
            revert EvaluationTooShort();
        }
        
        if (countWords(feedback) < MIN_EVALUATION_WORDS) {
            revert EvaluationTooShort();
        }
    }

    /**
     * @dev Validates challenge creation
     */
    function validateChallenge(
        uint256 evaluationTimestamp,
        string memory reason,
        uint256 stakeAmount
    ) internal view {
        if (block.timestamp > evaluationTimestamp + CHALLENGE_PERIOD) {
            revert ChallengeWindowExpired();
        }
        
        if (bytes(reason).length == 0) {
            revert InvalidChallengeReason();
        }
        
        if (stakeAmount < MIN_CHALLENGE_STAKE) {
            revert InsufficientChallengeStake(stakeAmount, MIN_CHALLENGE_STAKE);
        }
    }

    /**
     * @dev Calculates oracle performance score
     */
    function calculateOraclePerformanceScore(
        uint256 evaluationsCompleted,
        uint256 successfulChallenges,
        uint256 failedChallenges,
        uint256 averageResponseTime,
        uint256 registrationTime
    ) internal view returns (uint256) {
        if (evaluationsCompleted == 0) return 0;
        
        // Quality score based on challenge success rate
        uint256 totalChallenges = successfulChallenges + failedChallenges;
        uint256 qualityScore = totalChallenges == 0 ? 
            MAX_REPUTATION_SCORE : 
            (successfulChallenges * MAX_REPUTATION_SCORE) / totalChallenges;
        
        // Consistency score based on evaluation count over time
        uint256 timeActive = block.timestamp - registrationTime;
        uint256 evaluationsPerDay = timeActive == 0 ? 0 : 
            (evaluationsCompleted * 1 days) / timeActive;
        uint256 consistencyScore = evaluationsPerDay > 10 ? 
            MAX_REPUTATION_SCORE : 
            (evaluationsPerDay * MAX_REPUTATION_SCORE) / 10;
        
        // Timeliness score based on average response time
        uint256 timelinessScore = averageResponseTime > 24 hours ? 0 :
            MAX_REPUTATION_SCORE - (averageResponseTime * MAX_REPUTATION_SCORE) / (24 hours);
        
        // Accuracy score (simplified - would integrate with actual accuracy metrics)
        uint256 accuracyScore = failedChallenges == 0 ? 
            MAX_REPUTATION_SCORE : 
            MAX_REPUTATION_SCORE - (failedChallenges * 1000);
        
        // Weighted average
        return (qualityScore * QUALITY_WEIGHT + 
                consistencyScore * CONSISTENCY_WEIGHT + 
                timelinessScore * TIMELINESS_WEIGHT + 
                accuracyScore * ACCURACY_WEIGHT) / 100;
    }

    /**
     * @dev Calculates reputation score with time decay
     */
    function calculateReputationWithDecay(
        uint256 baseScore,
        uint256 lastUpdateTime,
        uint256 totalEvaluations
    ) internal view returns (uint256) {
        if (totalEvaluations == 0 || lastUpdateTime == 0) {
            return 0;
        }
        
        uint256 daysSinceUpdate = (block.timestamp - lastUpdateTime) / 1 days;
        if (daysSinceUpdate == 0) {
            return baseScore;
        }
        
        // Apply decay (0.5% per day, capped at 50% total decay)
        uint256 decayAmount = (daysSinceUpdate * REPUTATION_DECAY_RATE * baseScore) / 10000;
        uint256 maxDecay = baseScore / 2; // Max 50% decay
        
        if (decayAmount > maxDecay) {
            decayAmount = maxDecay;
        }
        
        return baseScore > decayAmount ? baseScore - decayAmount : 0;
    }

    /**
     * @dev Calculates weighted skill score based on multiple evaluations
     */
    function calculateWeightedSkillScore(
        uint256[] memory previousScores,
        uint256[] memory timestamps,
        uint256 newScore,
        uint256 currentTime
    ) internal pure returns (uint256) {
        if (previousScores.length == 0) {
            return newScore;
        }
        
        if (previousScores.length != timestamps.length) {
            revert ArrayLengthMismatch();
        }
        
        uint256 totalWeight = 0;
        uint256 weightedSum = 0;
        
        // Weight recent evaluations more heavily
        for (uint256 i = 0; i < previousScores.length; i++) {
            uint256 age = currentTime - timestamps[i];
            uint256 weight = age > 180 days ? 1 : (180 days - age) / 1 days + 1;
            
            totalWeight += weight;
            weightedSum += previousScores[i] * weight;
        }
        
        // Add new score with highest weight
        uint256 newWeight = 30; // 30 days worth of weight
        totalWeight += newWeight;
        weightedSum += newScore * newWeight;
        
        return weightedSum / totalWeight;
    }

    /**
     * @dev Calculates oracle reward based on evaluation quality
     */
    function calculateOracleReward(
        uint256 baseReward,
        uint256 evaluationScore,
        uint256 challengeResult,
        uint256 timeToComplete
    ) internal pure returns (uint256) {
        uint256 qualityMultiplier = (evaluationScore * 100) / MAX_REPUTATION_SCORE;
        if (qualityMultiplier < 50) qualityMultiplier = 50; // Minimum 50%
        
        uint256 reward = (baseReward * qualityMultiplier) / 100;
        
        // Bonus for successful challenge defense
        if (challengeResult == 1) { // Won challenge
            reward = (reward * REWARD_MULTIPLIER) / 100;
        }
        
        // Bonus for quick completion (within 24 hours)
        if (timeToComplete <= 24 hours) {
            reward = (reward * 110) / 100; // 10% bonus
        }
        
        return reward;
    }

    /**
     * @dev Calculates slash amount for oracle misconduct
     */
    function calculateSlashAmount(
        uint256 oracleStake,
        uint256 misconductSeverity,
        uint256 previousSlashes
    ) internal pure returns (uint256) {
        uint256 baseSlash = (oracleStake * SLASH_RATE) / 10000;
        
        // Increase slash for repeat offenders
        uint256 repeatMultiplier = previousSlashes > 3 ? 4 : previousSlashes + 1;
        
        // Severity multiplier (1-5 scale)
        uint256 severityMultiplier = misconductSeverity > 5 ? 5 : misconductSeverity;
        if (severityMultiplier == 0) severityMultiplier = 1;
        
        uint256 totalSlash = baseSlash * repeatMultiplier * severityMultiplier;
        
        // Cap at 50% of stake
        uint256 maxSlash = oracleStake / 2;
        return totalSlash > maxSlash ? maxSlash : totalSlash;
    }

    /**
     * @dev Validates oracle cooldown period
     */
    function validateOracleCooldown(
        uint256 lastActivityTime,
        uint256 cooldownPeriod
    ) internal view {
        if (block.timestamp < lastActivityTime + cooldownPeriod) {
            revert OracleCooldownActive();
        }
    }

    /**
     * @dev Calculates consensus score from multiple oracle evaluations
     */
    function calculateConsensusScore(
        uint256[] memory oracleScores,
        uint256[] memory oracleWeights
    ) internal pure returns (uint256) {
        if (oracleScores.length != oracleWeights.length) {
            revert ArrayLengthMismatch();
        }
        
        if (oracleScores.length == 0) {
            return 0;
        }
        
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < oracleScores.length; i++) {
            weightedSum += oracleScores[i] * oracleWeights[i];
            totalWeight += oracleWeights[i];
        }
        
        return totalWeight == 0 ? 0 : weightedSum / totalWeight;
    }

    /**
     * @dev Determines if evaluation needs additional oracle review
     */
    function needsAdditionalReview(
        uint256[] memory oracleScores,
        uint256 scoreVariance,
        uint256 maxVarianceThreshold
    ) internal pure returns (bool) {
        if (oracleScores.length < 2) {
            return true; // Always need more reviews with fewer than 2 oracles
        }
        
        return scoreVariance > maxVarianceThreshold;
    }

    /**
     * @dev Calculates score variance for consensus validation
     */
    function calculateScoreVariance(
        uint256[] memory scores
    ) internal pure returns (uint256) {
        if (scores.length <= 1) {
            return 0;
        }
        
        uint256 sum = 0;
        for (uint256 i = 0; i < scores.length; i++) {
            sum += scores[i];
        }
        uint256 mean = sum / scores.length;
        
        uint256 varianceSum = 0;
        for (uint256 i = 0; i < scores.length; i++) {
            uint256 diff = scores[i] > mean ? scores[i] - mean : mean - scores[i];
            varianceSum += diff * diff;
        }
        
        return varianceSum / scores.length;
    }

    /**
     * @dev Formats IPFS hash for storage optimization
     */
    function validateIPFSHash(string memory ipfsHash) internal pure returns (bool) {
        bytes memory hashBytes = bytes(ipfsHash);
        
        // Basic IPFS hash validation (simplified)
        if (hashBytes.length != 46) {
            return false;
        }
        
        // Check if starts with 'Qm'
        if (hashBytes[0] != 0x51 || hashBytes[1] != 0x6d) { // 'Q' = 0x51, 'm' = 0x6d
            return false;
        }
        
        return true;
    }

    /**
     * @dev Counts words in a string (simplified)
     */
    function countWords(string memory text) internal pure returns (uint256) {
        bytes memory textBytes = bytes(text);
        if (textBytes.length == 0) {
            return 0;
        }
        
        uint256 wordCount = 1;
        for (uint256 i = 0; i < textBytes.length; i++) {
            if (textBytes[i] == 0x20) { // Space character
                wordCount++;
            }
        }
        
        return wordCount;
    }

    /**
     * @dev Generates evaluation ID hash
     */
    function generateEvaluationHash(
        address oracle,
        address user,
        uint256 timestamp,
        uint256 nonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(oracle, user, timestamp, nonce));
    }

    /**
     * @dev Validates specialization overlap for oracle selection
     */
    function hasSpecializationOverlap(
        string[] memory oracleSpecs,
        string[] memory requiredSpecs
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < requiredSpecs.length; i++) {
            for (uint256 j = 0; j < oracleSpecs.length; j++) {
                if (keccak256(bytes(requiredSpecs[i])) == keccak256(bytes(oracleSpecs[j]))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @dev Calculates oracle selection probability based on performance
     */
    function calculateSelectionProbability(
        uint256 performanceScore,
        uint256 stakeAmount,
        uint256 lastActivityTime,
        uint256 totalEvaluations
    ) internal view returns (uint256) {
        // Base probability from performance (0-70%)
        uint256 performanceFactor = (performanceScore * 70) / MAX_REPUTATION_SCORE;
        
        // Stake factor (0-20%)
        uint256 stakeFactor = stakeAmount > MAX_ORACLE_STAKE ? 20 : 
            (stakeAmount * 20) / MAX_ORACLE_STAKE;
        
        // Activity factor (0-10%)
        uint256 timeSinceActivity = block.timestamp - lastActivityTime;
        uint256 activityFactor = timeSinceActivity > 7 days ? 0 : 
            10 - (timeSinceActivity * 10) / (7 days);
        
        return performanceFactor + stakeFactor + activityFactor;
    }
}