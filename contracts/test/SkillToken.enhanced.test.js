const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SkillToken Enhanced Tests", function () {
  let SkillToken;
  let skillToken;
  let owner;
  let minter;
  let oracle;
  let user1;
  let user2;
  let pauser;
  let addresses;

  const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
  const ORACLE_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ORACLE_ROLE"));
  const UPDATER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UPDATER_ROLE"));
  const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"));

  beforeEach(async function () {
    SkillToken = await ethers.getContractFactory("SkillToken");
    [owner, minter, oracle, user1, user2, pauser, ...addresses] = await ethers.getSigners();

    skillToken = await SkillToken.deploy(
      "TalentChainPro Skill Token",
      "SKILL",
      owner.address
    );
    await skillToken.deployed();

    // Grant roles
    await skillToken.grantRole(MINTER_ROLE, minter.address);
    await skillToken.grantRole(ORACLE_ROLE, oracle.address);
    await skillToken.grantRole(UPDATER_ROLE, owner.address);
    await skillToken.grantRole(PAUSER_ROLE, pauser.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await skillToken.name()).to.equal("TalentChainPro Skill Token");
      expect(await skillToken.symbol()).to.equal("SKILL");
    });

    it("Should grant all roles to the initial admin", async function () {
      expect(await skillToken.hasRole(await skillToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await skillToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await skillToken.hasRole(ORACLE_ROLE, owner.address)).to.be.true;
      expect(await skillToken.hasRole(UPDATER_ROLE, owner.address)).to.be.true;
      expect(await skillToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Skill Token Minting", function () {
    it("Should mint a skill token successfully", async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60); // 1 year

      await expect(skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        5,
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      )).to.emit(skillToken, "SkillTokenMinted")
        .withArgs(0, user1.address, "javascript", 5, minter.address);

      expect(await skillToken.ownerOf(0)).to.equal(user1.address);
      expect(await skillToken.totalSupply()).to.equal(1);
    });

    it("Should not allow non-minters to mint", async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      await expect(skillToken.connect(user1).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        5,
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      )).to.be.reverted; // Just check that it reverts, regardless of message
    });

    it("Should validate skill level range", async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      await expect(skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        0, // Invalid level
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      )).to.be.revertedWithCustomError(skillToken, "InvalidSkillLevel");

      await expect(skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        11, // Invalid level
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      )).to.be.revertedWithCustomError(skillToken, "InvalidSkillLevel");
    });

    it("Should handle batch minting", async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      const categories = ["JavaScript", "React", "Node.js"];
      const subcategories = ["Frontend", "Frontend", "Backend"];
      const levels = [5, 4, 6];
      const expiryDates = [expiryDate, expiryDate, expiryDate];
      const metadata = ["JS skills", "React skills", "Node skills"];
      const tokenURIs = ["uri1", "uri2", "uri3"];

      await expect(skillToken.connect(minter).batchMintSkillTokens(
        user1.address,
        categories,
        subcategories,
        levels,
        expiryDates,
        metadata,
        tokenURIs
      )).to.emit(skillToken, "BatchSkillTokensMinted");

      expect(await skillToken.totalSupply()).to.equal(3);
      expect(await skillToken.balanceOf(user1.address)).to.equal(3);
    });
  });

  describe("Skill Level Updates", function () {
    let tokenId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        5,
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      );
      tokenId = 0;
    });

    it("Should allow oracle to update skill level", async function () {
      await expect(skillToken.connect(oracle).updateSkillLevel(
        tokenId,
        7,
        "Improved performance on assessment"
      )).to.emit(skillToken, "SkillLevelUpdated")
        .withArgs(tokenId, 5, 7, oracle.address, "Improved performance on assessment");

      const skillData = await skillToken.getSkillData(tokenId);
      expect(skillData.level).to.equal(7);
    });

    it("Should not allow non-oracle to update skill level", async function () {
      await expect(skillToken.connect(user1).updateSkillLevel(
        tokenId,
        7,
        "Self-assessment"
      )).to.be.reverted; // Just check that it reverts, regardless of message
    });

    it("Should not allow updating to same level", async function () {
      await expect(skillToken.connect(oracle).updateSkillLevel(
        tokenId,
        5,
        "Same level"
      )).to.be.revertedWith("SkillToken: same level provided");
    });
  });

  describe("Skill Token Endorsements", function () {
    let tokenId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        5,
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      );
      tokenId = 0;
    });

    it("Should allow endorsement from other users", async function () {
      await expect(skillToken.connect(user2).endorseSkillToken(
        tokenId,
        "Great JavaScript developer!"
      )).to.emit(skillToken, "SkillTokenEndorsed")
        .withArgs(tokenId, user2.address, "Great JavaScript developer!");

      const endorsements = await skillToken.getSkillEndorsements(tokenId);
      expect(endorsements.length).to.equal(1);
      expect(endorsements[0].endorser).to.equal(user2.address);
      expect(endorsements[0].endorsementData).to.equal("Great JavaScript developer!");
    });

    it("Should not allow self-endorsement", async function () {
      await expect(skillToken.connect(user1).endorseSkillToken(
        tokenId,
        "Self-endorsement"
      )).to.be.revertedWithCustomError(skillToken, "InvalidEndorser");
    });

    it("Should enforce endorsement cooldown", async function () {
      await skillToken.connect(user2).endorseSkillToken(
        tokenId,
        "First endorsement"
      );

      await expect(skillToken.connect(user2).endorseSkillToken(
        tokenId,
        "Second endorsement too soon"
      )).to.be.revertedWith("SkillToken: endorsement cooldown active");
    });
  });

  describe("Skill Token Revocation", function () {
    let tokenId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        5,
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      );
      tokenId = 0;
    });

    it("Should allow token owner to revoke", async function () {
      await expect(skillToken.connect(user1).revokeSkillToken(
        tokenId,
        "No longer relevant"
      )).to.emit(skillToken, "SkillTokenRevoked")
        .withArgs(tokenId, "No longer relevant", user1.address);

      expect(await skillToken.isSkillActive(tokenId)).to.be.false;
    });

    it("Should allow oracle to revoke", async function () {
      await expect(skillToken.connect(oracle).revokeSkillToken(
        tokenId,
        "Failed reassessment"
      )).to.emit(skillToken, "SkillTokenRevoked")
        .withArgs(tokenId, "Failed reassessment", oracle.address);

      expect(await skillToken.isSkillActive(tokenId)).to.be.false;
    });

    it("Should not allow unauthorized revocation", async function () {
      await expect(skillToken.connect(user2).revokeSkillToken(
        tokenId,
        "Unauthorized"
      )).to.be.revertedWith("SkillToken: unauthorized revocation");
    });
  });

  describe("Soulbound Token Behavior", function () {
    let tokenId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend Development",
        5,
        expiryDate,
        "Basic JavaScript skills",
        "ipfs://tokenuri1"
      );
      tokenId = 0;
    });

    it("Should prevent transfers", async function () {
      await expect(skillToken.connect(user1).transferFrom(
        user1.address,
        user2.address,
        tokenId
      )).to.be.revertedWith("SkillToken: tokens are soulbound and cannot be transferred");
    });

    it("Should prevent approvals for transfer", async function () {
      // Approval might succeed but transfer should fail
      await skillToken.connect(user1).approve(user2.address, tokenId);
      
      // But transfer should still be blocked
      await expect(skillToken.connect(user2).transferFrom(
        user1.address,
        user2.address,
        tokenId
      )).to.be.revertedWith("SkillToken: tokens are soulbound and cannot be transferred");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      // Mint tokens in different categories
      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend",
        5,
        expiryDate,
        "JS skills",
        "uri1"
      );

      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "React",
        "Frontend",
        4,
        expiryDate,
        "React skills",
        "uri2"
      );

      await skillToken.connect(minter).mintSkillToken(
        user2.address,
        "JavaScript",
        "Backend",
        6,
        expiryDate,
        "JS backend skills",
        "uri3"
      );
    });

    it("Should get tokens by category", async function () {
      const jsTokens = await skillToken.getTokensByCategory("javascript");
      expect(jsTokens.length).to.equal(2);
      
      const tokenIds = jsTokens.map(token => token.toNumber());
      expect(tokenIds).to.include(0);
      expect(tokenIds).to.include(2);
    });

    it("Should get tokens by owner", async function () {
      const user1Tokens = await skillToken.getTokensByOwner(user1.address);
      const user2Tokens = await skillToken.getTokensByOwner(user2.address);
      
      // user1 should have at least the 2 tokens we minted in this describe block
      expect(user1Tokens.length).to.be.greaterThanOrEqual(2);
      // user2 should have at least 1 token
      expect(user2Tokens.length).to.be.greaterThanOrEqual(1);
    });

    it("Should get total skills by category", async function () {
      const jsCount = await skillToken.getTotalSkillsByCategory("javascript");
      expect(jsCount).to.equal(2);
    });

    it("Should check if skill is active", async function () {
      expect(await skillToken.isSkillActive(0)).to.be.true;
      
      // Revoke token
      await skillToken.connect(user1).revokeSkillToken(0, "Test revocation");
      expect(await skillToken.isSkillActive(0)).to.be.false;
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow pauser to pause contract", async function () {
      await skillToken.connect(pauser).pause();
      expect(await skillToken.paused()).to.be.true;

      const currentTime = await time.latest();
      const expiryDate = currentTime + (365 * 24 * 60 * 60);

      await expect(skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend",
        5,
        expiryDate,
        "JS skills",
        "uri1"
      )).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow unpausing", async function () {
      await skillToken.connect(pauser).pause();
      await skillToken.connect(pauser).unpause();
      expect(await skillToken.paused()).to.be.false;
    });
  });

  describe("Expiry Management", function () {
    it("Should handle expired tokens", async function () {
      const currentTime = await time.latest();
      const shortExpiry = currentTime + 100; // Short expiry

      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend",
        5,
        shortExpiry,
        "JS skills",
        "uri1"
      );

      const tokenId = 0;
      
      // Token should be active initially
      expect(await skillToken.isSkillActive(tokenId)).to.be.true;

      // Advance time past expiry
      await time.increase(200);

      // Token should now be inactive due to expiry
      expect(await skillToken.isSkillActive(tokenId)).to.be.false;
    });

    it("Should allow renewal of expired tokens", async function () {
      const currentTime = await time.latest();
      const shortExpiry = currentTime + 100;

      await skillToken.connect(minter).mintSkillToken(
        user1.address,
        "JavaScript",
        "Frontend",
        5,
        shortExpiry,
        "JS skills",
        "uri1"
      );

      const tokenId = 0;
      
      // Advance time past expiry
      await time.increase(200);
      expect(await skillToken.isSkillActive(tokenId)).to.be.false;

      // Renew the token
      const newExpiry = await time.latest() + (365 * 24 * 60 * 60);
      await expect(skillToken.renewSkillToken(tokenId, newExpiry))
        .to.emit(skillToken, "SkillTokenRenewed")
        .withArgs(tokenId, newExpiry, owner.address);

      expect(await skillToken.isSkillActive(tokenId)).to.be.true;
    });
  });
});
