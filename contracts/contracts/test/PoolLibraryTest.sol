// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../libraries/PoolLibrary.sol";
import "../interfaces/ITalentPool.sol";

/**
 * @title PoolLibraryTest
 * @dev Test contract that exposes PoolLibrary functions for testing
 */
contract PoolLibraryTest {
    function testValidatePoolCreation(
        uint256 stakeAmount,
        uint256 salaryMin,
        uint256 salaryMax,
        uint64 deadline,
        string[] memory requiredSkills,
        uint8[] memory minimumLevels
    ) external view {
        PoolLibrary.validatePoolCreation(
            stakeAmount,
            salaryMin,
            salaryMax,
            deadline,
            requiredSkills,
            minimumLevels
        );
    }

    function testValidateApplication(
        uint256 stakeAmount,
        uint256[] memory skillTokenIds,
        ITalentPool.PoolStatus poolStatus,
        uint64 deadline
    ) external view {
        PoolLibrary.validateApplication(
            stakeAmount,
            skillTokenIds,
            poolStatus,
            deadline
        );
    }

    function testCalculateMatchScore(
        string[] memory requiredSkills,
        uint8[] memory minimumLevels,
        string[] memory candidateSkills,
        uint8[] memory candidateLevels
    ) external pure returns (uint256) {
        return
            PoolLibrary.calculateMatchScore(
                requiredSkills,
                minimumLevels,
                candidateSkills,
                candidateLevels
            );
    }

    function testCalculatePlatformFee(
        uint256 amount,
        uint256 feeRate
    ) external pure returns (uint256) {
        return PoolLibrary.calculatePlatformFee(amount, feeRate);
    }

    function testValidatePlatformFee(uint256 fee) external pure {
        PoolLibrary.validatePlatformFee(fee);
    }

    function testCalculateWithdrawalPenalty(
        uint64 appliedAt,
        uint64 deadline,
        uint256 stakeAmount
    ) external view returns (uint256) {
        return
            PoolLibrary.calculateWithdrawalPenalty(
                appliedAt,
                deadline,
                stakeAmount
            );
    }

    function testNormalizeLocation(
        string memory location
    ) external pure returns (string memory) {
        return PoolLibrary.normalizeLocation(location);
    }

    function testStringsEqual(
        string memory a,
        string memory b
    ) external pure returns (bool) {
        return PoolLibrary.stringsEqual(a, b);
    }

    function testCalculatePoolValue(
        uint256 stakeAmount,
        uint256 salaryMin,
        uint256 salaryMax,
        ITalentPool.JobType jobType
    ) external pure returns (uint256) {
        return
            PoolLibrary.calculatePoolValue(
                stakeAmount,
                salaryMin,
                salaryMax,
                jobType
            );
    }

    function testGeneratePoolMetrics(
        uint256 totalStaked,
        uint256 applicationCount,
        uint256[] memory matchScores,
        uint64 createdAt,
        bool isCompleted
    ) external view returns (ITalentPool.PoolMetrics memory) {
        return
            PoolLibrary.generatePoolMetrics(
                totalStaked,
                applicationCount,
                matchScores,
                createdAt,
                isCompleted
            );
    }

    function testCalculateAverage(
        uint256[] memory scores
    ) external pure returns (uint256) {
        return PoolLibrary.calculateAverage(scores);
    }

    function testCalculateCompletionBonus(
        uint256 totalStaked,
        uint256 applicationCount,
        uint64 createdAt
    ) external view returns (uint256) {
        return
            PoolLibrary.calculateCompletionBonus(
                totalStaked,
                applicationCount,
                createdAt
            );
    }

    function testShouldAutoExpire(
        uint64 deadline,
        uint256 applicationCount
    ) external view returns (bool) {
        return PoolLibrary.shouldAutoExpire(deadline, applicationCount);
    }

    function testValidateJobType(ITalentPool.JobType jobType) external pure {
        PoolLibrary.validateJobType(jobType);
    }
}
