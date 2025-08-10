// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/ITalentPool.sol";

/**
 * @title PoolLibrary
 * @dev Library containing utility functions for talent pool management
 * @author TalentChain Pro Team
 */
library PoolLibrary {
    // Constants
    uint256 public constant MIN_POOL_STAKE = 0.1 ether;
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    uint256 public constant MIN_APPLICATION_STAKE = 0.01 ether;
    uint256 public constant MATCH_SCORE_BASE = 1000;
    uint256 public constant SKILL_WEIGHT = 100;
    uint256 public constant LEVEL_WEIGHT = 50;

    // Pool duration constants
    uint256 public constant MIN_POOL_DURATION = 1 days;
    uint256 public constant MAX_POOL_DURATION = 180 days;
    uint256 public constant DEFAULT_POOL_DURATION = 30 days;

    // Errors
    error InsufficientStake(uint256 provided, uint256 required);
    error InvalidPoolDuration(uint64 duration);
    error InvalidSalaryRange(uint256 min, uint256 max);
    error InvalidPlatformFee(uint256 fee);
    error PoolNotActive();
    error DeadlineExceeded();
    error ApplicationNotFound();
    error InvalidJobType();
    error EmptyRequiredSkills();
    error SkillLevelMismatch();

    /**
     * @dev Validates pool creation parameters
     */
    function validatePoolCreation(
        uint256 stakeAmount,
        uint256 salaryMin,
        uint256 salaryMax,
        uint64 deadline,
        string[] memory requiredSkills,
        uint8[] memory minimumLevels
    ) internal view {
        if (stakeAmount < MIN_POOL_STAKE) {
            revert InsufficientStake(stakeAmount, MIN_POOL_STAKE);
        }

        if (salaryMin >= salaryMax) {
            revert InvalidSalaryRange(salaryMin, salaryMax);
        }

        uint256 duration = deadline - block.timestamp;
        if (duration < MIN_POOL_DURATION || duration > MAX_POOL_DURATION) {
            revert InvalidPoolDuration(uint64(duration));
        }

        if (requiredSkills.length == 0) {
            revert EmptyRequiredSkills();
        }

        if (requiredSkills.length != minimumLevels.length) {
            revert SkillLevelMismatch();
        }
    }

    /**
     * @dev Validates application parameters
     */
    function validateApplication(
        uint256 stakeAmount,
        uint256[] memory skillTokenIds,
        ITalentPool.PoolStatus poolStatus,
        uint64 deadline
    ) internal view {
        if (poolStatus != ITalentPool.PoolStatus.Active) {
            revert PoolNotActive();
        }

        if (block.timestamp >= deadline) {
            revert DeadlineExceeded();
        }

        if (stakeAmount < MIN_APPLICATION_STAKE) {
            revert InsufficientStake(stakeAmount, MIN_APPLICATION_STAKE);
        }

        if (skillTokenIds.length == 0) {
            revert EmptyRequiredSkills();
        }
    }

    /**
     * @dev Validates platform fee
     */
    function validatePlatformFee(uint256 fee) internal pure {
        if (fee > MAX_PLATFORM_FEE) {
            revert InvalidPlatformFee(fee);
        }
    }

    /**
     * @dev Calculates match score based on skills and levels
     */
    function calculateMatchScore(
        string[] memory requiredSkills,
        uint8[] memory minimumLevels,
        string[] memory candidateSkills,
        uint8[] memory candidateLevels
    ) internal pure returns (uint256 score) {
        require(
            requiredSkills.length == minimumLevels.length,
            "PoolLibrary: invalid required skills"
        );
        require(
            candidateSkills.length == candidateLevels.length,
            "PoolLibrary: invalid candidate skills"
        );

        uint256 totalPossibleScore = requiredSkills.length * 100; // 100 points per required skill
        uint256 earnedScore = 0;

        for (uint256 i = 0; i < requiredSkills.length; i++) {
            for (uint256 j = 0; j < candidateSkills.length; j++) {
                if (
                    keccak256(bytes(requiredSkills[i])) ==
                    keccak256(bytes(candidateSkills[j]))
                ) {
                    uint256 skillScore = 50; // Base 50 points for having the skill

                    // Bonus for exceeding minimum level
                    if (candidateLevels[j] >= minimumLevels[i]) {
                        skillScore += 30; // +30 for meeting requirement

                        // Additional bonus for exceeding requirements (up to 20 more points)
                        uint256 levelBonus = (candidateLevels[j] -
                            minimumLevels[i]) * 2;
                        if (levelBonus > 20) levelBonus = 20; // Cap at 20 bonus points
                        skillScore += levelBonus;
                    } else {
                        // Penalty for not meeting minimum level
                        uint256 penalty = (minimumLevels[i] -
                            candidateLevels[j]) * 10;
                        skillScore = skillScore > penalty
                            ? skillScore - penalty
                            : 0;
                    }

                    earnedScore += skillScore;
                    break;
                }
            }
        }

        // Calculate percentage score
        score = totalPossibleScore > 0
            ? (earnedScore * 100) / totalPossibleScore
            : 0;

        // Cap at 100
        if (score > 100) {
            score = 100;
        }
    }

    /**
     * @dev Calculates platform fee amount
     */
    function calculatePlatformFee(
        uint256 amount,
        uint256 feeRate
    ) internal pure returns (uint256) {
        return (amount * feeRate) / 10000;
    }

    /**
     * @dev Calculates withdrawal penalty based on timing
     */
    function calculateWithdrawalPenalty(
        uint64 appliedAt,
        uint64 deadline,
        uint256 stakeAmount
    ) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - appliedAt;
        uint256 totalDuration = deadline - appliedAt;

        if (timeElapsed >= totalDuration) {
            return stakeAmount; // 100% penalty if withdrawing after deadline
        }

        // Linear penalty: 0% at start, 50% at deadline
        uint256 penaltyRate = (timeElapsed * 5000) / totalDuration;
        return (stakeAmount * penaltyRate) / 10000;
    }

    /**
     * @dev Calculates pool completion bonus
     */
    function calculateCompletionBonus(
        uint256 totalStaked,
        uint256 applicationCount,
        uint64 createdAt
    ) internal view returns (uint256) {
        uint256 timeToFill = block.timestamp - createdAt;

        // Quick fill bonus (within 7 days)
        if (timeToFill <= 7 days) {
            return totalStaked / 20; // 5% bonus
        }

        // Standard completion bonus
        if (applicationCount >= 5) {
            return totalStaked / 50; // 2% bonus
        }

        return 0;
    }

    /**
     * @dev Determines if pool should auto-expire
     */
    function shouldAutoExpire(
        uint64 deadline,
        uint256 applicationCount
    ) internal view returns (bool) {
        return
            block.timestamp >= deadline ||
            (block.timestamp >= deadline - 1 days && applicationCount == 0);
    }

    /**
     * @dev Validates job type
     */
    function validateJobType(ITalentPool.JobType jobType) internal pure {
        if (uint8(jobType) > 3) {
            revert InvalidJobType();
        }
    }

    /**
     * @dev Calculates expected pool value
     */
    function calculatePoolValue(
        uint256 stakeAmount,
        uint256 salaryMin,
        uint256 salaryMax,
        ITalentPool.JobType jobType
    ) internal pure returns (uint256) {
        uint256 avgSalary = (salaryMin + salaryMax) / 2;

        // Weight based on job type
        uint256 multiplier = 12; // Default for full-time (annual)

        if (jobType == ITalentPool.JobType.PartTime) {
            multiplier = 6;
        } else if (jobType == ITalentPool.JobType.Contract) {
            multiplier = 3;
        } else if (jobType == ITalentPool.JobType.Freelance) {
            multiplier = 1;
        }

        return stakeAmount + (avgSalary * multiplier) / 12; // Monthly equivalent
    }

    /**
     * @dev Generates pool metrics
     */
    function generatePoolMetrics(
        uint256 totalStaked,
        uint256 /* applicationCount */,
        uint256[] memory matchScores,
        uint64 createdAt,
        bool isCompleted
    ) internal view returns (ITalentPool.PoolMetrics memory) {
        uint256 averageMatchScore = 0;
        if (matchScores.length > 0) {
            uint256 totalScore = 0;
            for (uint256 i = 0; i < matchScores.length; i++) {
                totalScore += matchScores[i];
            }
            averageMatchScore = totalScore / matchScores.length;
        }

        uint256 completionRate = isCompleted ? 100 : 0;
        uint256 averageTimeToFill = isCompleted
            ? block.timestamp - createdAt
            : 0;

        return
            ITalentPool.PoolMetrics({
                totalStaked: totalStaked,
                averageMatchScore: averageMatchScore,
                completionRate: completionRate,
                averageTimeToFill: averageTimeToFill
            });
    }

    /**
     * @dev Converts string array to bytes32 array for gas efficiency
     */
    function stringArrayToBytes32Array(
        string[] memory strings
    ) internal pure returns (bytes32[] memory) {
        bytes32[] memory result = new bytes32[](strings.length);
        for (uint256 i = 0; i < strings.length; i++) {
            result[i] = keccak256(bytes(strings[i]));
        }
        return result;
    }

    /**
     * @dev Normalizes location string
     */
    function normalizeLocation(
        string memory location
    ) internal pure returns (string memory) {
        bytes memory locationBytes = bytes(location);

        // Convert to lowercase
        for (uint i = 0; i < locationBytes.length; i++) {
            if (locationBytes[i] >= 0x41 && locationBytes[i] <= 0x5A) {
                locationBytes[i] = bytes1(uint8(locationBytes[i]) + 32);
            }
        }

        return string(locationBytes);
    }

    /**
     * @dev Calculates average from array of scores
     */
    function calculateAverage(
        uint256[] memory scores
    ) internal pure returns (uint256) {
        if (scores.length == 0) return 0;
        uint256 total = 0;
        for (uint256 i = 0; i < scores.length; i++) {
            total += scores[i];
        }
        return total / scores.length;
    }

    /**
     * @dev Calculates refund with penalty
     */
    function calculateRefundWithPenalty(
        uint256 stakeAmount,
        uint256 penaltyRate
    ) internal pure returns (uint256, uint256) {
        uint256 penalty = (stakeAmount * penaltyRate) / 10000; // penaltyRate in basis points
        uint256 refund = stakeAmount - penalty;
        return (refund, penalty);
    }

    /**
     * @dev Updates pool completion metrics
     */
    function updateCompletionMetrics(
        uint64 createdAt,
        uint64 completedAt,
        uint256 totalApplications
    ) internal pure returns (uint256 timeToFill, uint256 completionRate) {
        timeToFill = completedAt > createdAt ? completedAt - createdAt : 0;
        completionRate = totalApplications > 0 ? 10000 : 0; // 100% if completed
        return (timeToFill, completionRate);
    }

    /**
     * @dev Process refunds for applicants with penalties
     */
    function processRefunds(
        address[] memory applicants,
        uint256[] memory stakes,
        uint256 penaltyRate,
        address feeCollector
    ) internal {
        for (uint256 i = 0; i < applicants.length; i++) {
            if (stakes[i] > 0) {
                (uint256 refund, uint256 penalty) = calculateRefundWithPenalty(
                    stakes[i],
                    penaltyRate
                );

                if (penalty > 0) {
                    payable(feeCollector).transfer(penalty);
                }
                if (refund > 0) {
                    payable(applicants[i]).transfer(refund);
                }
            }
        }
    }

    /**
     * @dev Simplified string comparison
     */
    function stringsEqual(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
