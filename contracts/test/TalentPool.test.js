const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TalentPool Contract", function () {
  let SkillToken;
  let TalentPool;
  let skillToken;
  let talentPool;
  let owner;
  let company;
  let candidate;
  let feeCollector;
  let addresses;

  beforeEach(async function () {
    // Get contract factories and signers
    SkillToken = await ethers.getContractFactory("SkillToken");
    TalentPool = await ethers.getContractFactory("TalentPool");
    [owner, company, candidate, feeCollector, ...addresses] = await ethers.getSigners();

    // Deploy SkillToken contract
    skillToken = await SkillToken.deploy();
    await skillToken.deployed();

    // Deploy TalentPool contract
    talentPool = await TalentPool.deploy(skillToken.address, feeCollector.address);
    await talentPool.deployed();

    // Mint skill tokens for the candidate
    await skillToken.mintSkillToken(candidate.address, "JavaScript", 5, "uri1");
    await skillToken.mintSkillToken(candidate.address, "React", 4, "uri2");
    await skillToken.mintSkillToken(candidate.address, "Node.js", 3, "uri3");

    // Approve TalentPool contract to use the skill tokens
    await skillToken.connect(candidate).setApprovalForAll(talentPool.address, true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await talentPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct fee collector", async function () {
      expect(await talentPool.getFeeCollector()).to.equal(feeCollector.address);
    });

    it("Should have the default platform fee rate", async function () {
      expect(await talentPool.getPlatformFeeRate()).to.equal(250); // 2.5%
    });
  });

  describe("Pool Creation", function () {
    it("Should allow a company to create a job pool", async function () {
      const jobTitle = "Senior Developer";
      const jobDescription = "We need a senior developer";
      const requiredSkills = ["JavaScript", "React"];
      const stakeAmount = ethers.utils.parseEther("1.0");

      await expect(
        talentPool.connect(company).createPool(
          jobTitle,
          jobDescription,
          requiredSkills,
          { value: stakeAmount }
        )
      ).to.emit(talentPool, "PoolCreated")
        .withArgs(0, company.address, jobTitle, stakeAmount);

      const pool = await talentPool.getPool(0);
      expect(pool.company).to.equal(company.address);
      expect(pool.jobTitle).to.equal(jobTitle);
      expect(pool.jobDescription).to.equal(jobDescription);
      expect(pool.stake).to.equal(stakeAmount);
      expect(pool.active).to.equal(true);
    });

    it("Should require a stake to create a pool", async function () {
      await expect(
        talentPool.connect(company).createPool(
          "Senior Developer",
          "We need a senior developer",
          ["JavaScript", "React"],
          { value: 0 }
        )
      ).to.be.revertedWith("TalentPool: stake must be greater than zero");
    });

    it("Should require job title", async function () {
      await expect(
        talentPool.connect(company).createPool(
          "",
          "We need a senior developer",
          ["JavaScript", "React"],
          { value: ethers.utils.parseEther("1.0") }
        )
      ).to.be.revertedWith("TalentPool: job title cannot be empty");
    });

    it("Should require at least one required skill", async function () {
      await expect(
        talentPool.connect(company).createPool(
          "Senior Developer",
          "We need a senior developer",
          [],
          { value: ethers.utils.parseEther("1.0") }
        )
      ).to.be.revertedWith("TalentPool: required skills cannot be empty");
    });
  });

  describe("Pool Management", function () {
    let poolId;
    let stakeAmount;

    beforeEach(async function () {
      // Create a job pool for testing
      stakeAmount = ethers.utils.parseEther("1.0");
      await talentPool.connect(company).createPool(
        "Senior Developer",
        "We need a senior developer",
        ["JavaScript", "React"],
        { value: stakeAmount }
      );
      poolId = 0;
    });

    it("Should allow the company to close their pool", async function () {
      await expect(
        talentPool.connect(company).closePool(poolId)
      ).to.emit(talentPool, "PoolClosed")
        .withArgs(poolId);

      const pool = await talentPool.getPool(poolId);
      expect(pool.active).to.equal(false);
    });

    it("Should not allow non-company to close the pool", async function () {
      await expect(
        talentPool.connect(candidate).closePool(poolId)
      ).to.be.revertedWith("TalentPool: only the company can close the pool");
    });

    it("Should allow a candidate to join a pool", async function () {
      const candidateStake = ethers.utils.parseEther("0.5");
      const skillTokenIds = [0, 1]; // JavaScript and React tokens

      await expect(
        talentPool.connect(candidate).joinPool(
          poolId,
          skillTokenIds,
          { value: candidateStake }
        )
      ).to.emit(talentPool, "CandidateJoined")
        .withArgs(poolId, candidate.address, candidateStake);

      const poolCandidates = await talentPool.getPoolCandidates(poolId);
      expect(poolCandidates.length).to.equal(1);
      expect(poolCandidates[0].wallet).to.equal(candidate.address);
      expect(poolCandidates[0].stake).to.equal(candidateStake);
      expect(poolCandidates[0].skillTokenIds.length).to.equal(2);
      expect(poolCandidates[0].skillTokenIds[0]).to.equal(0);
      expect(poolCandidates[0].skillTokenIds[1]).to.equal(1);
    });

    it("Should not allow joining an inactive pool", async function () {
      await talentPool.connect(company).closePool(poolId);

      await expect(
        talentPool.connect(candidate).joinPool(
          poolId,
          [0, 1],
          { value: ethers.utils.parseEther("0.5") }
        )
      ).to.be.revertedWith("TalentPool: pool is not active");
    });

    it("Should require at least one skill token to join", async function () {
      await expect(
        talentPool.connect(candidate).joinPool(
          poolId,
          [],
          { value: ethers.utils.parseEther("0.5") }
        )
      ).to.be.revertedWith("TalentPool: must stake at least one skill token");
    });
  });

  describe("Match Making", function () {
    let poolId;

    beforeEach(async function () {
      // Create a job pool and have candidate join
      await talentPool.connect(company).createPool(
        "Senior Developer",
        "We need a senior developer",
        ["JavaScript", "React"],
        { value: ethers.utils.parseEther("1.0") }
      );
      poolId = 0;

      await talentPool.connect(candidate).joinPool(
        poolId,
        [0, 1], // JavaScript and React tokens
        { value: ethers.utils.parseEther("0.5") }
      );
    });

    it("Should allow company to select a candidate", async function () {
      await expect(
        talentPool.connect(company).selectCandidate(poolId, candidate.address)
      ).to.emit(talentPool, "MatchMade")
        .withArgs(poolId, company.address, candidate.address);
    });

    it("Should not allow non-company to select a candidate", async function () {
      await expect(
        talentPool.connect(addresses[0]).selectCandidate(poolId, candidate.address)
      ).to.be.revertedWith("TalentPool: only the company can select candidates");
    });

    it("Should not allow selecting a candidate from an inactive pool", async function () {
      await talentPool.connect(company).closePool(poolId);

      await expect(
        talentPool.connect(company).selectCandidate(poolId, candidate.address)
      ).to.be.revertedWith("TalentPool: pool is not active");
    });

    it("Should not allow selecting a candidate who hasn't joined", async function () {
      await expect(
        talentPool.connect(company).selectCandidate(poolId, addresses[0].address)
      ).to.be.revertedWith("TalentPool: candidate has not joined this pool");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to change the platform fee rate", async function () {
      const newFeeRate = 300; // 3%
      
      await expect(talentPool.setPlatformFeeRate(newFeeRate))
        .to.emit(talentPool, "PlatformFeeChanged")
        .withArgs(250, newFeeRate);
      
      expect(await talentPool.getPlatformFeeRate()).to.equal(newFeeRate);
    });

    it("Should not allow non-owner to change the platform fee rate", async function () {
      await expect(
        talentPool.connect(company).setPlatformFeeRate(300)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should validate platform fee rate range", async function () {
      await expect(
        talentPool.setPlatformFeeRate(1001)
      ).to.be.revertedWith("TalentPool: fee rate cannot exceed 10%");
    });

    it("Should allow owner to change the fee collector", async function () {
      const newCollector = addresses[0].address;
      
      await expect(talentPool.setFeeCollector(newCollector))
        .to.emit(talentPool, "FeeCollectorChanged")
        .withArgs(feeCollector.address, newCollector);
      
      expect(await talentPool.getFeeCollector()).to.equal(newCollector);
    });

    it("Should not allow non-owner to change the fee collector", async function () {
      await expect(
        talentPool.connect(company).setFeeCollector(addresses[0].address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
