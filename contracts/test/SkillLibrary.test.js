const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SkillLibrary Tests", function () {
  let SkillLibraryTest;
  let skillLibraryTest;
  let owner;
  let addresses;

  beforeEach(async function () {
    const SkillLibraryTestFactory = await ethers.getContractFactory("SkillLibraryTest");
    [owner, ...addresses] = await ethers.getSigners();
    
    skillLibraryTest = await SkillLibraryTestFactory.deploy();
    await skillLibraryTest.deployed();
  });

  describe("Skill Level Validation", function () {
    it("Should validate correct skill levels", async function () {
      for (let level = 1; level <= 10; level++) {
        await expect(skillLibraryTest.testValidateSkillLevel(level))
          .to.not.be.reverted;
      }
    });

    it("Should reject invalid skill levels", async function () {
      await expect(skillLibraryTest.testValidateSkillLevel(0))
        .to.be.revertedWithCustomError(skillLibraryTest, "InvalidSkillLevel");

      await expect(skillLibraryTest.testValidateSkillLevel(11))
        .to.be.revertedWithCustomError(skillLibraryTest, "InvalidSkillLevel");
    });
  });

  describe("Expiry Date Validation", function () {
    it("Should validate future expiry dates", async function () {
      const futureDate = (await time.latest()) + (365 * 24 * 60 * 60); // 1 year
      
      await expect(skillLibraryTest.testValidateExpiryDate(futureDate))
        .to.not.be.reverted;
    });

    it("Should reject past expiry dates", async function () {
      const pastDate = (await time.latest()) - (24 * 60 * 60); // Yesterday
      
      await expect(skillLibraryTest.testValidateExpiryDate(pastDate))
        .to.be.revertedWithCustomError(skillLibraryTest, "InvalidExpiryDate");
    });

    it("Should reject current time as expiry", async function () {
      const currentTime = await time.latest();
      
      await expect(skillLibraryTest.testValidateExpiryDate(currentTime))
        .to.be.revertedWithCustomError(skillLibraryTest, "InvalidExpiryDate");
    });
  });

  describe("Skill Expiry Checking", function () {
    it("Should correctly identify expired skills", async function () {
      const pastDate = (await time.latest()) - (24 * 60 * 60);
      
      const isExpired = await skillLibraryTest.testIsSkillExpired(pastDate);
      expect(isExpired).to.be.true;
    });

    it("Should correctly identify non-expired skills", async function () {
      const futureDate = (await time.latest()) + (365 * 24 * 60 * 60);
      
      const isExpired = await skillLibraryTest.testIsSkillExpired(futureDate);
      expect(isExpired).to.be.false;
    });
  });

  describe("Skill Category Validation", function () {
    it("Should accept non-empty categories", async function () {
      await expect(skillLibraryTest.testValidateSkillCategory("JavaScript"))
        .to.not.be.reverted;
      
      await expect(skillLibraryTest.testValidateSkillCategory("React Development"))
        .to.not.be.reverted;
    });

    it("Should reject empty categories", async function () {
      await expect(skillLibraryTest.testValidateSkillCategory(""))
        .to.be.revertedWithCustomError(skillLibraryTest, "EmptySkillCategory");
    });
  });

  describe("Skill Score Calculation", function () {
    it("Should calculate basic skill score", async function () {
      const level = 5;
      const endorsementCount = 0;
      
      const score = await skillLibraryTest.testCalculateSkillScore(level, endorsementCount);
      expect(score).to.equal(500); // 5 * 100
    });

    it("Should add endorsement bonus", async function () {
      const level = 5;
      const endorsementCount = 3;
      
      const score = await skillLibraryTest.testCalculateSkillScore(level, endorsementCount);
      expect(score).to.equal(530); // 500 + (3 * 10)
    });

    it("Should cap endorsement bonus", async function () {
      const level = 5;
      const endorsementCount = 50; // Many endorsements
      
      const score = await skillLibraryTest.testCalculateSkillScore(level, endorsementCount);
      expect(score).to.equal(750); // 500 + 250 (capped at 50% of base)
    });

    it("Should handle level 1 with endorsements", async function () {
      const level = 1;
      const endorsementCount = 10;
      
      const score = await skillLibraryTest.testCalculateSkillScore(level, endorsementCount);
      expect(score).to.equal(150); // 100 + 50 (capped at 50 for level 1)
    });

    it("Should handle maximum level", async function () {
      const level = 10;
      const endorsementCount = 0;
      
      const score = await skillLibraryTest.testCalculateSkillScore(level, endorsementCount);
      expect(score).to.equal(1000); // 10 * 100
    });
  });

  describe("Default Expiry Date Generation", function () {
    it("Should generate future expiry date", async function () {
      const currentTime = await time.latest();
      const defaultExpiry = await skillLibraryTest.testGetDefaultExpiryDate();
      
      expect(defaultExpiry).to.be.gt(currentTime);
      
      // Should be approximately 2 years (730 days)
      const expectedExpiry = currentTime + (365 * 24 * 60 * 60 * 2);
      expect(defaultExpiry).to.be.closeTo(expectedExpiry, 60); // Within 1 minute
    });
  });

  describe("Endorser Validation", function () {
    it("Should allow different users to endorse", async function () {
      const owner = addresses[0].address;
      const endorser = addresses[1].address;
      
      await expect(skillLibraryTest.testValidateEndorser(owner, endorser))
        .to.not.be.reverted;
    });

    it("Should prevent self-endorsement", async function () {
      const user = addresses[0].address;
      
      await expect(skillLibraryTest.testValidateEndorser(user, user))
        .to.be.revertedWithCustomError(skillLibraryTest, "InvalidEndorser");
    });
  });

  describe("Endorsement Cooldown", function () {
    it("Should allow endorsement after cooldown", async function () {
      const oldTime = (await time.latest()) - (31 * 24 * 60 * 60); // 31 days ago
      
      const canEndorse = await skillLibraryTest.testCanEndorse(oldTime);
      expect(canEndorse).to.be.true;
    });

    it("Should prevent endorsement during cooldown", async function () {
      const recentTime = (await time.latest()) - (10 * 24 * 60 * 60); // 10 days ago
      
      const canEndorse = await skillLibraryTest.testCanEndorse(recentTime);
      expect(canEndorse).to.be.false;
    });

    it("Should handle edge case at cooldown boundary", async function () {
      const boundaryTime = (await time.latest()) - (30 * 24 * 60 * 60); // Exactly 30 days
      
      const canEndorse = await skillLibraryTest.testCanEndorse(boundaryTime);
      expect(canEndorse).to.be.true;
    });
  });

  describe("Required Endorsements Calculation", function () {
    it("Should calculate correct endorsements for level progression", async function () {
      const required = await skillLibraryTest.testGetRequiredEndorsements(3, 5);
      expect(required).to.equal(4); // (5-3) * 2
    });

    it("Should return zero for same level", async function () {
      const required = await skillLibraryTest.testGetRequiredEndorsements(5, 5);
      expect(required).to.equal(0);
    });

    it("Should return zero for downward progression", async function () {
      const required = await skillLibraryTest.testGetRequiredEndorsements(7, 5);
      expect(required).to.equal(0);
    });

    it("Should handle maximum progression", async function () {
      const required = await skillLibraryTest.testGetRequiredEndorsements(1, 10);
      expect(required).to.equal(18); // (10-1) * 2
    });
  });

  describe("Level to String Conversion", function () {
    it("Should convert levels to correct strings", async function () {
      expect(await skillLibraryTest.testLevelToString(1)).to.equal("Beginner");
      expect(await skillLibraryTest.testLevelToString(2)).to.equal("Beginner");
      expect(await skillLibraryTest.testLevelToString(3)).to.equal("Novice");
      expect(await skillLibraryTest.testLevelToString(4)).to.equal("Novice");
      expect(await skillLibraryTest.testLevelToString(5)).to.equal("Intermediate");
      expect(await skillLibraryTest.testLevelToString(6)).to.equal("Intermediate");
      expect(await skillLibraryTest.testLevelToString(7)).to.equal("Advanced");
      expect(await skillLibraryTest.testLevelToString(8)).to.equal("Advanced");
      expect(await skillLibraryTest.testLevelToString(9)).to.equal("Expert");
      expect(await skillLibraryTest.testLevelToString(10)).to.equal("Expert");
    });
  });

  describe("Category Normalization", function () {
    it("Should normalize categories to lowercase", async function () {
      expect(await skillLibraryTest.testNormalizeCategory("JavaScript"))
        .to.equal("javascript");
      
      expect(await skillLibraryTest.testNormalizeCategory("REACT"))
        .to.equal("react");
      
      expect(await skillLibraryTest.testNormalizeCategory("Node.js"))
        .to.equal("node.js");
      
      expect(await skillLibraryTest.testNormalizeCategory("MiXeD CaSe"))
        .to.equal("mixed case");
    });

    it("Should handle already lowercase categories", async function () {
      expect(await skillLibraryTest.testNormalizeCategory("python"))
        .to.equal("python");
    });

    it("Should handle empty strings", async function () {
      expect(await skillLibraryTest.testNormalizeCategory(""))
        .to.equal("");
    });

    it("Should handle special characters", async function () {
      expect(await skillLibraryTest.testNormalizeCategory("C++"))
        .to.equal("c++");
      
      expect(await skillLibraryTest.testNormalizeCategory("C#"))
        .to.equal("c#");
    });
  });
});

// Test contract that exposes SkillLibrary functions
const SkillLibraryTestCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/libraries/SkillLibrary.sol";

contract SkillLibraryTest {
    function testValidateSkillLevel(uint8 level) external pure {
        SkillLibrary.validateSkillLevel(level);
    }

    function testValidateExpiryDate(uint64 expiryDate) external view {
        SkillLibrary.validateExpiryDate(expiryDate);
    }

    function testIsSkillExpired(uint64 expiryDate) external view returns (bool) {
        return SkillLibrary.isSkillExpired(expiryDate);
    }

    function testValidateSkillCategory(string memory category) external pure {
        SkillLibrary.validateSkillCategory(category);
    }

    function testCalculateSkillScore(uint8 level, uint256 endorsementCount) 
        external pure returns (uint256) {
        return SkillLibrary.calculateSkillScore(level, endorsementCount);
    }

    function testGetDefaultExpiryDate() external view returns (uint64) {
        return SkillLibrary.getDefaultExpiryDate();
    }

    function testValidateEndorser(address owner, address endorser) external pure {
        SkillLibrary.validateEndorser(owner, endorser);
    }

    function testCanEndorse(uint64 lastEndorsementTime) external view returns (bool) {
        return SkillLibrary.canEndorse(lastEndorsementTime);
    }

    function testGetRequiredEndorsements(uint8 currentLevel, uint8 targetLevel) 
        external pure returns (uint256) {
        return SkillLibrary.getRequiredEndorsements(currentLevel, targetLevel);
    }

    function testLevelToString(uint8 level) external pure returns (string memory) {
        return SkillLibrary.levelToString(level);
    }

    function testNormalizeCategory(string memory category) 
        external pure returns (string memory) {
        return SkillLibrary.normalizeCategory(category);
    }
}
`;
