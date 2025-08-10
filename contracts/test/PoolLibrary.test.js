const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PoolLibrary Tests", function () {
  let PoolLibraryTest;
  let poolLibraryTest;
  let owner;
  let addresses;

  beforeEach(async function () {
    // Deploy a test contract that uses PoolLibrary
    const PoolLibraryTestFactory = await ethers.getContractFactory("PoolLibraryTest");
    [owner, ...addresses] = await ethers.getSigners();
    
    poolLibraryTest = await PoolLibraryTestFactory.deploy();
    await poolLibraryTest.deployed();
  });

  describe("Pool Creation Validation", function () {
    it("Should validate minimum stake amount", async function () {
      const lowStake = ethers.utils.parseEther("0.05");
      const salaryMin = ethers.utils.parseEther("3000");
      const salaryMax = ethers.utils.parseEther("5000");
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);
      const requiredSkills = ["JavaScript", "React"];
      const minimumLevels = [5, 4];

      await expect(poolLibraryTest.testValidatePoolCreation(
        lowStake, salaryMin, salaryMax, deadline, requiredSkills, minimumLevels
      )).to.be.revertedWithCustomError(poolLibraryTest, "InsufficientStake");
    });

    it("Should validate salary range", async function () {
      const stake = ethers.utils.parseEther("1.0");
      const salaryMin = ethers.utils.parseEther("5000");
      const salaryMax = ethers.utils.parseEther("3000"); // Invalid: min > max
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);
      const requiredSkills = ["JavaScript"];
      const minimumLevels = [5];

      await expect(poolLibraryTest.testValidatePoolCreation(
        stake, salaryMin, salaryMax, deadline, requiredSkills, minimumLevels
      )).to.be.revertedWithCustomError(poolLibraryTest, "InvalidSalaryRange");
    });

    it("Should validate pool duration", async function () {
      const stake = ethers.utils.parseEther("1.0");
      const salaryMin = ethers.utils.parseEther("3000");
      const salaryMax = ethers.utils.parseEther("5000");
      const shortDeadline = (await time.latest()) + (12 * 60 * 60); // 12 hours (too short)
      const requiredSkills = ["JavaScript"];
      const minimumLevels = [5];

      await expect(poolLibraryTest.testValidatePoolCreation(
        stake, salaryMin, salaryMax, shortDeadline, requiredSkills, minimumLevels
      )).to.be.revertedWithCustomError(poolLibraryTest, "InvalidPoolDuration");
    });

    it("Should validate required skills", async function () {
      const stake = ethers.utils.parseEther("1.0");
      const salaryMin = ethers.utils.parseEther("3000");
      const salaryMax = ethers.utils.parseEther("5000");
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);
      const requiredSkills = []; // Empty array
      const minimumLevels = [];

      await expect(poolLibraryTest.testValidatePoolCreation(
        stake, salaryMin, salaryMax, deadline, requiredSkills, minimumLevels
      )).to.be.revertedWithCustomError(poolLibraryTest, "EmptyRequiredSkills");
    });

    it("Should validate skill-level array alignment", async function () {
      const stake = ethers.utils.parseEther("1.0");
      const salaryMin = ethers.utils.parseEther("3000");
      const salaryMax = ethers.utils.parseEther("5000");
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);
      const requiredSkills = ["JavaScript", "React"];
      const minimumLevels = [5]; // Mismatched length

      await expect(poolLibraryTest.testValidatePoolCreation(
        stake, salaryMin, salaryMax, deadline, requiredSkills, minimumLevels
      )).to.be.revertedWithCustomError(poolLibraryTest, "SkillLevelMismatch");
    });

    it("Should pass valid pool creation parameters", async function () {
      const stake = ethers.utils.parseEther("1.0");
      const salaryMin = ethers.utils.parseEther("3000");
      const salaryMax = ethers.utils.parseEther("5000");
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);
      const requiredSkills = ["JavaScript", "React"];
      const minimumLevels = [5, 4];

      await expect(poolLibraryTest.testValidatePoolCreation(
        stake, salaryMin, salaryMax, deadline, requiredSkills, minimumLevels
      )).to.not.be.reverted;
    });
  });

  describe("Application Validation", function () {
    it("Should validate application stake", async function () {
      const lowStake = ethers.utils.parseEther("0.005");
      const skillTokenIds = [1, 2, 3];
      const poolStatus = 0; // Active
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);

      await expect(poolLibraryTest.testValidateApplication(
        lowStake, skillTokenIds, poolStatus, deadline
      )).to.be.revertedWithCustomError(poolLibraryTest, "InsufficientStake");
    });

    it("Should validate pool status", async function () {
      const stake = ethers.utils.parseEther("0.1");
      const skillTokenIds = [1, 2, 3];
      const poolStatus = 2; // Completed (not active)
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);

      await expect(poolLibraryTest.testValidateApplication(
        stake, skillTokenIds, poolStatus, deadline
      )).to.be.revertedWithCustomError(poolLibraryTest, "PoolNotActive");
    });

    it("Should validate deadline", async function () {
      const stake = ethers.utils.parseEther("0.1");
      const skillTokenIds = [1, 2, 3];
      const poolStatus = 0; // Active
      const pastDeadline = (await time.latest()) - (24 * 60 * 60); // Yesterday

      await expect(poolLibraryTest.testValidateApplication(
        stake, skillTokenIds, poolStatus, pastDeadline
      )).to.be.revertedWithCustomError(poolLibraryTest, "DeadlineExceeded");
    });

    it("Should validate skill tokens", async function () {
      const stake = ethers.utils.parseEther("0.1");
      const skillTokenIds = []; // Empty array
      const poolStatus = 0; // Active
      const deadline = (await time.latest()) + (30 * 24 * 60 * 60);

      await expect(poolLibraryTest.testValidateApplication(
        stake, skillTokenIds, poolStatus, deadline
      )).to.be.revertedWithCustomError(poolLibraryTest, "EmptyRequiredSkills");
    });
  });

  describe("Match Score Calculation", function () {
    it("Should calculate perfect match score", async function () {
      const requiredSkills = ["JavaScript", "React"];
      const minimumLevels = [5, 4];
      const candidateSkills = ["JavaScript", "React"];
      const candidateLevels = [8, 7]; // Exceeds requirements

      const score = await poolLibraryTest.testCalculateMatchScore(
        requiredSkills, minimumLevels, candidateSkills, candidateLevels
      );

      expect(score).to.be.gte(80); // Should be high score for exceeding requirements
    });

    it("Should calculate partial match score", async function () {
      const requiredSkills = ["JavaScript", "React", "Node.js"];
      const minimumLevels = [5, 4, 6];
      const candidateSkills = ["JavaScript", "Python"]; // Missing React and Node.js
      const candidateLevels = [7, 8];

      const score = await poolLibraryTest.testCalculateMatchScore(
        requiredSkills, minimumLevels, candidateSkills, candidateLevels
      );

      expect(score).to.be.lt(50); // Should be lower for partial match
    });

    it("Should calculate zero score for no matching skills", async function () {
      const requiredSkills = ["JavaScript", "React"];
      const minimumLevels = [5, 4];
      const candidateSkills = ["Python", "Django"];
      const candidateLevels = [8, 7];

      const score = await poolLibraryTest.testCalculateMatchScore(
        requiredSkills, minimumLevels, candidateSkills, candidateLevels
      );

      expect(score).to.equal(0);
    });

    it("Should penalize insufficient skill levels", async function () {
      const requiredSkills = ["JavaScript"];
      const minimumLevels = [7];
      const candidateSkills = ["JavaScript"];
      const candidateLevels = [4]; // Below requirement

      const score = await poolLibraryTest.testCalculateMatchScore(
        requiredSkills, minimumLevels, candidateSkills, candidateLevels
      );

      expect(score).to.be.lt(100); // Should be penalized
    });
  });

  describe("Fee Calculations", function () {
    it("Should calculate platform fee correctly", async function () {
      const amount = ethers.utils.parseEther("10.0");
      const feeRate = 250; // 2.5%

      const fee = await poolLibraryTest.testCalculatePlatformFee(amount, feeRate);
      const expectedFee = amount.mul(250).div(10000);

      expect(fee).to.equal(expectedFee);
    });

    it("Should validate platform fee rate", async function () {
      const invalidFeeRate = 1100; // 11% (above max of 10%)

      await expect(poolLibraryTest.testValidatePlatformFee(invalidFeeRate))
        .to.be.revertedWithCustomError(poolLibraryTest, "InvalidPlatformFee");
    });

    it("Should accept valid platform fee rate", async function () {
      const validFeeRate = 500; // 5%

      await expect(poolLibraryTest.testValidatePlatformFee(validFeeRate))
        .to.not.be.reverted;
    });
  });

  describe("Withdrawal Penalty Calculation", function () {
    it("Should calculate early withdrawal penalty", async function () {
      const appliedTime = await time.latest();
      const deadline = appliedTime + (30 * 24 * 60 * 60); // 30 days
      const stakeAmount = ethers.utils.parseEther("1.0");

      // Advance time to mid-point (should be ~25% penalty)
      await time.increase(15 * 24 * 60 * 60); // 15 days

      const penalty = await poolLibraryTest.testCalculateWithdrawalPenalty(
        appliedTime, deadline, stakeAmount
      );

      expect(penalty).to.be.gt(0);
      expect(penalty).to.be.lt(stakeAmount.div(2)); // Less than 50%
    });

    it("Should calculate full penalty for late withdrawal", async function () {
      const appliedTime = await time.latest();
      const deadline = appliedTime + (30 * 24 * 60 * 60);
      const stakeAmount = ethers.utils.parseEther("1.0");

      // Advance time past deadline
      await time.increase(35 * 24 * 60 * 60);

      const penalty = await poolLibraryTest.testCalculateWithdrawalPenalty(
        appliedTime, deadline, stakeAmount
      );

      expect(penalty).to.equal(stakeAmount); // 100% penalty
    });
  });

  describe("String Utilities", function () {
    it("Should normalize location string", async function () {
      const location = "San Francisco";
      const normalized = await poolLibraryTest.testNormalizeLocation(location);
      
      expect(normalized).to.equal("san francisco");
    });

    it("Should compare strings correctly", async function () {
      const str1 = "JavaScript";
      const str2 = "JavaScript";
      const str3 = "Python";

      expect(await poolLibraryTest.testStringsEqual(str1, str2)).to.be.true;
      expect(await poolLibraryTest.testStringsEqual(str1, str3)).to.be.false;
    });
  });

  describe("Pool Value Calculation", function () {
    it("Should calculate pool value for different job types", async function () {
      const stakeAmount = ethers.utils.parseEther("1.0");
      const salaryMin = ethers.utils.parseEther("5000");
      const salaryMax = ethers.utils.parseEther("7000");

      // Full-time (job type 0)
      const fullTimeValue = await poolLibraryTest.testCalculatePoolValue(
        stakeAmount, salaryMin, salaryMax, 0
      );

      // Part-time (job type 1)
      const partTimeValue = await poolLibraryTest.testCalculatePoolValue(
        stakeAmount, salaryMin, salaryMax, 1
      );

      // Contract (job type 2)
      const contractValue = await poolLibraryTest.testCalculatePoolValue(
        stakeAmount, salaryMin, salaryMax, 2
      );

      // Freelance (job type 3)
      const freelanceValue = await poolLibraryTest.testCalculatePoolValue(
        stakeAmount, salaryMin, salaryMax, 3
      );

      expect(fullTimeValue).to.be.gt(partTimeValue);
      expect(partTimeValue).to.be.gt(contractValue);
      expect(contractValue).to.be.gt(freelanceValue);
    });
  });

  describe("Pool Metrics Generation", function () {
    it("Should generate correct pool metrics", async function () {
      const totalStaked = ethers.utils.parseEther("5.0");
      const applicationCount = 3;
      const matchScores = [80, 90, 70];
      const currentTime = await time.latest();
      const createdAt = currentTime - 1000; // Pool was created 1000 seconds ago
      const isCompleted = true;

      const metrics = await poolLibraryTest.testGeneratePoolMetrics(
        totalStaked, applicationCount, matchScores, createdAt, isCompleted
      );

      expect(metrics.totalStaked).to.equal(totalStaked);
      expect(metrics.averageMatchScore).to.equal(80); // (80+90+70)/3
      expect(metrics.completionRate).to.equal(100);
      expect(metrics.averageTimeToFill).to.be.gt(0); // Should be ~1000 seconds
    });
  });

  describe("Array Utilities", function () {
    it("Should calculate average correctly", async function () {
      const scores = [80, 90, 70, 85];
      const average = await poolLibraryTest.testCalculateAverage(scores);
      
      expect(average).to.equal(81); // (80+90+70+85)/4 = 81.25, rounded down
    });

    it("Should handle empty array", async function () {
      const scores = [];
      const average = await poolLibraryTest.testCalculateAverage(scores);
      
      expect(average).to.equal(0);
    });
  });
});

// Test contract that exposes PoolLibrary functions
const PoolLibraryTestCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/libraries/PoolLibrary.sol";
import "../contracts/interfaces/ITalentPool.sol";

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
            stakeAmount, salaryMin, salaryMax, deadline, requiredSkills, minimumLevels
        );
    }

    function testValidateApplication(
        uint256 stakeAmount,
        uint256[] memory skillTokenIds,
        ITalentPool.PoolStatus poolStatus,
        uint64 deadline
    ) external view {
        PoolLibrary.validateApplication(stakeAmount, skillTokenIds, poolStatus, deadline);
    }

    function testCalculateMatchScore(
        string[] memory requiredSkills,
        uint8[] memory minimumLevels,
        string[] memory candidateSkills,
        uint8[] memory candidateLevels
    ) external pure returns (uint256) {
        return PoolLibrary.calculateMatchScore(
            requiredSkills, minimumLevels, candidateSkills, candidateLevels
        );
    }

    function testCalculatePlatformFee(uint256 amount, uint256 feeRate) 
        external pure returns (uint256) {
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
        return PoolLibrary.calculateWithdrawalPenalty(appliedAt, deadline, stakeAmount);
    }

    function testNormalizeLocation(string memory location) 
        external pure returns (string memory) {
        return PoolLibrary.normalizeLocation(location);
    }

    function testStringsEqual(string memory a, string memory b) 
        external pure returns (bool) {
        return PoolLibrary.stringsEqual(a, b);
    }

    function testCalculatePoolValue(
        uint256 stakeAmount,
        uint256 salaryMin,
        uint256 salaryMax,
        ITalentPool.JobType jobType
    ) external pure returns (uint256) {
        return PoolLibrary.calculatePoolValue(stakeAmount, salaryMin, salaryMax, jobType);
    }

    function testGeneratePoolMetrics(
        uint256 totalStaked,
        uint256 applicationCount,
        uint256[] memory matchScores,
        uint64 createdAt,
        bool isCompleted
    ) external view returns (ITalentPool.PoolMetrics memory) {
        return PoolLibrary.generatePoolMetrics(
            totalStaked, applicationCount, matchScores, createdAt, isCompleted
        );
    }

    function testCalculateAverage(uint256[] memory scores) 
        external pure returns (uint256) {
        return PoolLibrary.calculateAverage(scores);
    }
}
`;
