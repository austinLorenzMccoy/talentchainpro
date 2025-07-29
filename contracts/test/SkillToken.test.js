const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillToken Contract", function () {
  let SkillToken;
  let skillToken;
  let owner;
  let oracle;
  let user;
  let addresses;

  beforeEach(async function () {
    // Get contract factory and signers
    SkillToken = await ethers.getContractFactory("SkillToken");
    [owner, oracle, user, ...addresses] = await ethers.getSigners();

    // Deploy contract
    skillToken = await SkillToken.deploy();
    await skillToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await skillToken.owner()).to.equal(owner.address);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await skillToken.name()).to.equal("TalentChainPro Skill Token");
      expect(await skillToken.symbol()).to.equal("SKILL");
    });
  });

  describe("Reputation Oracle Management", function () {
    it("Should allow owner to add a reputation oracle", async function () {
      await expect(skillToken.addReputationOracle(oracle.address))
        .to.emit(skillToken, "ReputationOracleAdded")
        .withArgs(oracle.address);
      
      expect(await skillToken.isReputationOracle(oracle.address)).to.equal(true);
    });

    it("Should not allow non-owner to add a reputation oracle", async function () {
      await expect(
        skillToken.connect(user).addReputationOracle(oracle.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to remove a reputation oracle", async function () {
      await skillToken.addReputationOracle(oracle.address);
      
      await expect(skillToken.removeReputationOracle(oracle.address))
        .to.emit(skillToken, "ReputationOracleRemoved")
        .withArgs(oracle.address);
      
      expect(await skillToken.isReputationOracle(oracle.address)).to.equal(false);
    });

    it("Should not allow removing a non-existent oracle", async function () {
      await expect(
        skillToken.removeReputationOracle(oracle.address)
      ).to.be.revertedWith("SkillToken: oracle does not exist");
    });
  });

  describe("Skill Token Minting", function () {
    it("Should allow owner to mint a skill token", async function () {
      const skillCategory = "JavaScript";
      const level = 5;
      const uri = "ipfs://QmSkillTokenMetadata";
      
      await expect(skillToken.mintSkillToken(user.address, skillCategory, level, uri))
        .to.emit(skillToken, "SkillTokenMinted")
        .withArgs(user.address, 0, skillCategory, level);
      
      expect(await skillToken.ownerOf(0)).to.equal(user.address);
      expect(await skillToken.tokenURI(0)).to.equal(uri);
      expect(await skillToken.getSkillLevel(0)).to.equal(level);
      expect(await skillToken.getSkillCategory(0)).to.equal(skillCategory);
    });

    it("Should not allow non-owner to mint a skill token", async function () {
      await expect(
        skillToken.connect(user).mintSkillToken(user.address, "JavaScript", 5, "uri")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should validate skill level range", async function () {
      await expect(
        skillToken.mintSkillToken(user.address, "JavaScript", 0, "uri")
      ).to.be.revertedWith("SkillToken: level must be between 1 and 10");
      
      await expect(
        skillToken.mintSkillToken(user.address, "JavaScript", 11, "uri")
      ).to.be.revertedWith("SkillToken: level must be between 1 and 10");
    });
  });

  describe("Skill Level Updates", function () {
    beforeEach(async function () {
      // Add oracle and mint a token for testing
      await skillToken.addReputationOracle(oracle.address);
      await skillToken.mintSkillToken(user.address, "JavaScript", 5, "uri");
    });

    it("Should allow oracle to update skill level", async function () {
      await expect(skillToken.connect(oracle).updateSkillLevel(0, 7))
        .to.emit(skillToken, "SkillLevelUpdated")
        .withArgs(0, 5, 7);
      
      expect(await skillToken.getSkillLevel(0)).to.equal(7);
    });

    it("Should not allow non-oracle to update skill level", async function () {
      await expect(
        skillToken.connect(user).updateSkillLevel(0, 7)
      ).to.be.revertedWith("SkillToken: caller is not a reputation oracle");
    });

    it("Should validate skill level range when updating", async function () {
      await expect(
        skillToken.connect(oracle).updateSkillLevel(0, 0)
      ).to.be.revertedWith("SkillToken: level must be between 1 and 10");
      
      await expect(
        skillToken.connect(oracle).updateSkillLevel(0, 11)
      ).to.be.revertedWith("SkillToken: level must be between 1 and 10");
    });
  });

  describe("Token Transfer Restrictions", function () {
    beforeEach(async function () {
      // Mint a token for testing
      await skillToken.mintSkillToken(user.address, "JavaScript", 5, "uri");
    });

    it("Should prevent token transfers (soulbound behavior)", async function () {
      await expect(
        skillToken.connect(user).transferFrom(user.address, addresses[0].address, 0)
      ).to.be.revertedWith("SkillToken: tokens are soulbound and cannot be transferred");
    });
  });
});
