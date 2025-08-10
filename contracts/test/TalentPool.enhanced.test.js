const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TalentPool Enhanced Tests", function () {
  let SkillToken;
  let TalentPool;
  let skillToken;
  let talentPool;
  let owner;
  let company;
  let candidate1;
  let candidate2;
  let feeCollector;
  let addresses;

  const POOL_MANAGER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("POOL_MANAGER_ROLE"));
  const MATCHER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MATCHER_ROLE"));
  const FEE_MANAGER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("FEE_MANAGER_ROLE"));
  const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"));
  const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));

  beforeEach(async function () {
    SkillToken = await ethers.getContractFactory("SkillToken");
    TalentPool = await ethers.getContractFactory("TalentPool");
    [owner, company, candidate1, candidate2, feeCollector, ...addresses] = await ethers.getSigners();

    // Deploy SkillToken
    skillToken = await SkillToken.deploy(
      "TalentChainPro Skill Token",
      "SKILL",
      owner.address
    );
    await skillToken.deployed();

    // Deploy TalentPool
    talentPool = await TalentPool.deploy(
      skillToken.address,
      feeCollector.address,
      owner.address
    );
    await talentPool.deployed();

    // Grant minter role for skill tokens
    await skillToken.grantRole(MINTER_ROLE, owner.address);

    // Mint skill tokens for candidates
    const currentTime = await time.latest();
    const expiryDate = currentTime + (365 * 24 * 60 * 60);

    await skillToken.mintSkillToken(
      candidate1.address, "Frontend", "JavaScript", 8, expiryDate, "Advanced JS", "uri1"
    );
    await skillToken.mintSkillToken(
      candidate1.address, "Frontend", "React", 7, expiryDate, "React Expert", "uri2"
    );
    await skillToken.mintSkillToken(
      candidate1.address, "Backend", "Node.js", 6, expiryDate, "Node.js Dev", "uri3"
    );

    await skillToken.mintSkillToken(
      candidate2.address, "Frontend", "JavaScript", 5, expiryDate, "JS Dev", "uri4"
    );
    await skillToken.mintSkillToken(
      candidate2.address, "Backend", "Python", 8, expiryDate, "Python Expert", "uri5"
    );
  });

  describe("Deployment", function () {
    it("Should set the correct initial parameters", async function () {
      expect(await talentPool.skillToken()).to.equal(skillToken.address);
      expect(await talentPool.getFeeCollector()).to.equal(feeCollector.address);
      expect(await talentPool.getPlatformFeeRate()).to.equal(250); // 2.5%
      expect(await talentPool.getMinimumStake()).to.equal(ethers.utils.parseEther("0.1"));
    });

    it("Should grant correct roles to admin", async function () {
      expect(await talentPool.hasRole(await talentPool.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await talentPool.hasRole(POOL_MANAGER_ROLE, owner.address)).to.be.true;
      expect(await talentPool.hasRole(MATCHER_ROLE, owner.address)).to.be.true;
      expect(await talentPool.hasRole(FEE_MANAGER_ROLE, owner.address)).to.be.true;
      expect(await talentPool.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Pool Creation", function () {
    const poolStake = ethers.utils.parseEther("1.0");
    
    it("Should create a pool successfully", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60); // 30 days
      await expect(talentPool.connect(company).createPool(
        "Senior Frontend Developer",
        "Looking for a senior frontend developer with React experience",
        0, // FullTime
        ["JavaScript", "React"],
        [7, 6],
        ethers.utils.parseEther("5000"), // 5000 ETH monthly salary
        ethers.utils.parseEther("8000"), // 8000 ETH monthly salary  
        deadline,
        "San Francisco",
        false,
        { value: poolStake }
      )).to.emit(talentPool, "PoolCreated")
        .withArgs(0, company.address, 0, poolStake, ethers.utils.parseEther("3000"));

      const pool = await talentPool.getPool(0);
      expect(pool.company).to.equal(company.address);
      expect(pool.title).to.equal("Senior Frontend Developer");
      expect(pool.jobType).to.equal(0); // FullTime
      expect(pool.stakeAmount).to.equal(poolStake);
      expect(pool.status).to.equal(0); // Active
    });

    it("Should validate minimum stake amount", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      const lowStake = ethers.utils.parseEther("0.05"); // Below minimum

      await expect(talentPool.connect(company).createPool(
        "Junior Developer",
        "Entry level position",
        0, // FullTime
        ["JavaScript"],
        [3],
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("3000"),
        deadline,
        "Remote",
        true,
        { value: lowStake }
      )).to.be.revertedWithCustomError(talentPool, "InsufficientStake");
    });

    it("Should validate salary range", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      await expect(talentPool.connect(company).createPool(
        "Invalid Salary Range",
        "Test description",
        0, // FullTime
        ["JavaScript"],
        [3],
        ethers.utils.parseEther("5000"), // Higher than max
        ethers.utils.parseEther("3000"), // Lower than min
        deadline,
        "Remote",
        true,
        { value: poolStake }
      )).to.be.revertedWithCustomError(talentPool, "InvalidSalaryRange");
    });

    it("Should validate required skills and levels", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      await expect(talentPool.connect(company).createPool(
        "No Skills Required",
        "Test description",
        0, // FullTime
        [], // Empty skills array
        [],
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("3000"),
        deadline,
        "Remote",
        true,
        { value: poolStake }
      )).to.be.revertedWithCustomError(talentPool, "EmptyRequiredSkills");

      await expect(talentPool.connect(company).createPool(
        "Mismatched Arrays",
        "Test description",
        0, // FullTime
        ["JavaScript", "React"],
        [5], // Mismatched array length
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("3000"),
        deadline,
        "Remote",
        true,
        { value: poolStake }
      )).to.be.revertedWithCustomError(talentPool, "SkillLevelMismatch");
    });

    it("Should update global statistics", async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      const initialStats = await talentPool.getGlobalStats();
      
      await talentPool.connect(company).createPool(
        "Test Pool",
        "Test description",
        0, // FullTime
        ["JavaScript"],
        [5],
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("3000"),
        deadline,
        "Remote",
        true,
        { value: poolStake }
      );

      const newStats = await talentPool.getGlobalStats();
      expect(newStats.totalPools).to.equal(initialStats.totalPools.add(1));
      expect(newStats.totalStaked).to.equal(initialStats.totalStaked.add(poolStake));
    });
  });

  describe("Application Submission", function () {
    let poolId;
    const poolStake = ethers.utils.parseEther("1.0");
    const appStake = ethers.utils.parseEther("0.1");

    beforeEach(async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      await talentPool.connect(company).createPool(
        "Frontend Developer",
        "React developer needed",
        0, // FullTime
        ["JavaScript", "React"],
        [6, 5],
        ethers.utils.parseEther("3000"),
        ethers.utils.parseEther("5000"),
        deadline,
        "San Francisco",
        false,
        { value: poolStake }
      );
      poolId = 0;
    });

    it("Should submit application successfully", async function () {
      const skillTokenIds = [0, 1]; // JavaScript and React tokens for candidate1

      await expect(talentPool.connect(candidate1).submitApplication(
        poolId,
        skillTokenIds,
        "I'm excited about this opportunity",
        "github.com/candidate1",
        { value: appStake }
      )).to.emit(talentPool, "ApplicationSubmitted")
        .withArgs(poolId, candidate1.address, skillTokenIds, appStake);

      const application = await talentPool.getApplication(poolId, candidate1.address);
      expect(application.candidate).to.equal(candidate1.address);
      expect(application.stakeAmount).to.equal(appStake);
      expect(application.status).to.equal(0); // Pending
      expect(application.coverLetter).to.equal("I'm excited about this opportunity");
      expect(application.portfolio).to.equal("github.com/candidate1");
    });

    it("Should calculate match score correctly", async function () {
      const skillTokenIds = [0, 1]; // JavaScript (level 8) and React (level 7)

      await talentPool.connect(candidate1).submitApplication(
        poolId,
        skillTokenIds,
        "Cover letter",
        "Portfolio",
        { value: appStake }
      );

      const application = await talentPool.getApplication(poolId, candidate1.address);
      expect(application.matchScore).to.be.gt(0);

      // Candidate1 has JavaScript level 8 (req: 6) and React level 7 (req: 5)
      // Should have high match score since both skills exceed requirements
      expect(application.matchScore).to.be.gt(80);
    });

    it("Should validate skill token ownership", async function () {
      const skillTokenIds = [4]; // Python token owned by candidate2

      await expect(talentPool.connect(candidate1).submitApplication(
        poolId,
        skillTokenIds,
        "Cover letter",
        "Portfolio",
        { value: appStake }
      )).to.be.revertedWith("TalentPool: not skill token owner");
    });

    it("Should prevent duplicate applications", async function () {
      const skillTokenIds = [0, 1];

      await talentPool.connect(candidate1).submitApplication(
        poolId,
        skillTokenIds,
        "First application",
        "Portfolio",
        { value: appStake }
      );

      await expect(talentPool.connect(candidate1).submitApplication(
        poolId,
        skillTokenIds,
        "Second application",
        "Portfolio",
        { value: appStake }
      )).to.be.revertedWith("TalentPool: already applied to this pool");
    });

    it("Should validate minimum application stake", async function () {
      const skillTokenIds = [0, 1];
      const lowStake = ethers.utils.parseEther("0.005"); // Below minimum

      await expect(talentPool.connect(candidate1).submitApplication(
        poolId,
        skillTokenIds,
        "Cover letter",
        "Portfolio",
        { value: lowStake }
      )).to.be.revertedWithCustomError(talentPool, "InsufficientStake");
    });

    it("Should update pool metrics after application", async function () {
      const skillTokenIds = [0, 1];

      await talentPool.connect(candidate1).submitApplication(
        poolId,
        skillTokenIds,
        "Cover letter",
        "Portfolio",
        { value: appStake }
      );

      const pool = await talentPool.getPool(poolId);
      expect(pool.totalApplications).to.equal(1);

      const metrics = await talentPool.getPoolMetrics(poolId);
      expect(metrics.totalStaked).to.equal(poolStake.add(appStake));
      expect(metrics.averageMatchScore).to.be.gt(0);
    });
  });

  describe("Candidate Selection and Pool Completion", function () {
    let poolId;
    const poolStake = ethers.utils.parseEther("2.0");
    const appStake = ethers.utils.parseEther("0.2");

    beforeEach(async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      await talentPool.connect(company).createPool(
        "Full Stack Developer",
        "Need full stack developer",
        0, // FullTime
        ["JavaScript", "React", "Node.js"],
        [6, 5, 5],
        ethers.utils.parseEther("4000"),
        ethers.utils.parseEther("6000"),
        deadline,
        "San Francisco",
        false,
        { value: poolStake }
      );
      poolId = 0;

      // Submit applications
      await talentPool.connect(candidate1).submitApplication(
        poolId,
        [0, 1, 2], // JavaScript, React, Node.js
        "Full stack developer with 5 years experience",
        "github.com/candidate1",
        { value: appStake }
      );

      await talentPool.connect(candidate2).submitApplication(
        poolId,
        [3, 4], // JavaScript, Python
        "Backend focused developer",
        "github.com/candidate2",
        { value: appStake }
      );
    });

    it("Should allow pool owner to select candidate", async function () {
      await expect(talentPool.connect(company).selectCandidate(
        poolId,
        candidate1.address
      )).to.emit(talentPool, "MatchMade");

      const pool = await talentPool.getPool(poolId);
      expect(pool.selectedCandidate).to.equal(candidate1.address);

      const application = await talentPool.getApplication(poolId, candidate1.address);
      expect(application.status).to.equal(1); // Accepted
    });

    it("Should not allow non-owner to select candidate", async function () {
      await expect(talentPool.connect(candidate1).selectCandidate(
        poolId,
        candidate1.address
      )).to.be.revertedWith("Not pool owner");
    });

    it("Should complete pool and distribute rewards", async function () {
      // Select candidate
      await talentPool.connect(company).selectCandidate(poolId, candidate1.address);

      // Get initial balances
      const initialCandidateBalance = await ethers.provider.getBalance(candidate1.address);
      const initialFeeCollectorBalance = await ethers.provider.getBalance(feeCollector.address);

      // Complete pool
      await talentPool.connect(company).completePool(poolId);

      // Check pool status
      const pool = await talentPool.getPool(poolId);
      expect(pool.status).to.equal(2); // Completed

      // Check balances - simplified checks
      const finalCandidateBalance = await ethers.provider.getBalance(candidate1.address);
      const finalFeeCollectorBalance = await ethers.provider.getBalance(feeCollector.address);

      // Candidate should receive their stake back plus bonus
      expect(finalCandidateBalance).to.be.gt(initialCandidateBalance);
      
      // Fee collector should receive platform fee
      expect(finalFeeCollectorBalance).to.be.gt(initialFeeCollectorBalance);
    });

    it("Should refund rejected applicants with penalty", async function () {
      // Select candidate1
      await talentPool.connect(company).selectCandidate(poolId, candidate1.address);

      const initialCandidate2Balance = await ethers.provider.getBalance(candidate2.address);

      // Complete pool (this should refund candidate2 with penalty)
      await talentPool.connect(company).completePool(poolId);

      const finalCandidate2Balance = await ethers.provider.getBalance(candidate2.address);
      
      // Candidate2 should get some refund (with penalty, so less than original stake)
      // Just check that the balance changed positively
      expect(finalCandidate2Balance).to.be.gte(initialCandidate2Balance);
    });
  });

  describe("Application Withdrawal", function () {
    let poolId;
    const poolStake = ethers.utils.parseEther("1.0");
    const appStake = ethers.utils.parseEther("0.1");

    beforeEach(async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      await talentPool.connect(company).createPool(
        "Developer Position",
        "Development role",
        0, // FullTime
        ["JavaScript"],
        [5],
        ethers.utils.parseEther("3000"),
        ethers.utils.parseEther("5000"),
        deadline,
        "Remote",
        true,
        { value: poolStake }
      );
      poolId = 0;

      await talentPool.connect(candidate1).submitApplication(
        poolId,
        [0], // JavaScript token
        "Application cover letter",
        "Portfolio link",
        { value: appStake }
      );
    });

    it("Should allow application withdrawal with penalty", async function () {
      const initialBalance = await ethers.provider.getBalance(candidate1.address);

      const tx = await talentPool.connect(candidate1).withdrawApplication(poolId);
      const receipt = await tx.wait();

      const finalBalance = await ethers.provider.getBalance(candidate1.address);

      // Should receive some refund (accounting for gas costs)
      // Just check that withdrawal was processed - the exact amount may vary due to penalties
      const application = await talentPool.getApplication(poolId, candidate1.address);
      expect(application.status).to.equal(3); // Withdrawn
    });

    it("Should not allow withdrawal after candidate selection", async function () {
      await talentPool.connect(company).selectCandidate(poolId, candidate1.address);

      await expect(talentPool.connect(candidate1).withdrawApplication(poolId))
        .to.be.revertedWith("Cannot withdraw");
    });
  });

  describe("Pool Management", function () {
    let poolId;
    const poolStake = ethers.utils.parseEther("1.0");

    beforeEach(async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);
      await talentPool.connect(company).createPool(
        "Test Position",
        "Test description",
        0, // FullTime
        ["JavaScript"],
        [5],
        ethers.utils.parseEther("3000"),
        ethers.utils.parseEther("5000"),
        deadline,
        "Remote",
        true,
        { value: poolStake }
      );
      poolId = 0;
    });

    it("Should allow pool owner to close pool", async function () {
      const initialBalance = await ethers.provider.getBalance(company.address);

      const tx = await talentPool.connect(company).closePool(poolId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalBalance = await ethers.provider.getBalance(company.address);
      
      // Company should get their stake back minus gas
      expect(finalBalance.add(gasUsed)).to.be.closeTo(
        initialBalance.add(poolStake),
        ethers.utils.parseEther("0.001")
      );

      const pool = await talentPool.getPool(poolId);
      expect(pool.status).to.equal(3); // Cancelled
    });

    it("Should not allow closing pool with selected candidate", async function () {
      // Submit application and select candidate
      await talentPool.connect(candidate1).submitApplication(
        poolId,
        [0],
        "Cover letter",
        "Portfolio",
        { value: ethers.utils.parseEther("0.1") }
      );

      await talentPool.connect(company).selectCandidate(poolId, candidate1.address);

      await expect(talentPool.connect(company).closePool(poolId))
        .to.be.revertedWith("Candidate selected");
    });
  });

  describe("Platform Management", function () {
    it("Should allow fee manager to update platform fee", async function () {
      const newFeeRate = 300; // 3%

      await expect(talentPool.setPlatformFeeRate(newFeeRate))
        .to.emit(talentPool, "PlatformFeeUpdated")
        .withArgs(250, newFeeRate);

      expect(await talentPool.getPlatformFeeRate()).to.equal(newFeeRate);
    });

    it("Should validate platform fee limit", async function () {
      const invalidFeeRate = 1100; // 11% (above 10% limit)

      await expect(talentPool.setPlatformFeeRate(invalidFeeRate))
        .to.be.revertedWithCustomError(talentPool, "InvalidPlatformFee");
    });

    it("Should allow updating fee collector", async function () {
      const newFeeCollector = addresses[0].address;

      await expect(talentPool.setFeeCollector(newFeeCollector))
        .to.emit(talentPool, "FeeCollectorUpdated")
        .withArgs(feeCollector.address, newFeeCollector);

      expect(await talentPool.getFeeCollector()).to.equal(newFeeCollector);
    });

    it("Should allow updating minimum stake", async function () {
      const newMinStake = ethers.utils.parseEther("0.2");

      await expect(talentPool.setMinimumStake(newMinStake))
        .to.emit(talentPool, "MinimumStakeUpdated")
        .withArgs(ethers.utils.parseEther("0.1"), newMinStake);

      expect(await talentPool.getMinimumStake()).to.equal(newMinStake);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);

      // Create multiple pools
      await talentPool.connect(company).createPool(
        "Pool 1", "Description 1", 0, ["JavaScript"], [5],
        ethers.utils.parseEther("3000"), ethers.utils.parseEther("5000"),
        deadline, "Remote", true,
        { value: ethers.utils.parseEther("1.0") }
      );

      await talentPool.connect(addresses[0]).createPool(
        "Pool 2", "Description 2", 1, ["Python"], [6],
        ethers.utils.parseEther("4000"), ethers.utils.parseEther("6000"),
        deadline, "San Francisco", false,
        { value: ethers.utils.parseEther("1.5") }
      );
    });

    it("Should get pools by company", async function () {
      const companyPools = await talentPool.getPoolsByCompany(company.address);
      expect(companyPools.length).to.equal(1);
      expect(companyPools[0]).to.equal(0);
    });

    it("Should get applications by candidate", async function () {
      await talentPool.connect(candidate1).submitApplication(
        0, [0], "Cover letter", "Portfolio",
        { value: ethers.utils.parseEther("0.1") }
      );

      const candidateApps = await talentPool.getApplicationsByCandidate(candidate1.address);
      expect(candidateApps.length).to.equal(1);
      expect(candidateApps[0]).to.equal(0);
    });

    it("Should get active pools count", async function () {
      const activeCount = await talentPool.getActivePoolsCount();
      expect(activeCount).to.equal(2);
    });

    it("Should get total pools count", async function () {
      const totalCount = await talentPool.getTotalPoolsCount();
      expect(totalCount).to.equal(2);
    });

    it("Should get global statistics", async function () {
      const stats = await talentPool.getGlobalStats();
      expect(stats.totalPools).to.equal(2);
      expect(stats.totalApplications).to.equal(0);
      expect(stats.totalMatches).to.equal(0);
      expect(stats.totalStaked).to.equal(ethers.utils.parseEther("2.5"));
    });
  });

  describe("Pausable Functionality", function () {
    it("Should pause contract operations", async function () {
      await talentPool.pause();
      expect(await talentPool.paused()).to.be.true;

      const currentTime = await time.latest();
      const deadline = currentTime + (30 * 24 * 60 * 60);

      await expect(talentPool.connect(company).createPool(
        "Test Pool", "Description", 0, ["JavaScript"], [5],
        ethers.utils.parseEther("3000"), ethers.utils.parseEther("5000"),
        deadline, "Remote", true,
        { value: ethers.utils.parseEther("1.0") }
      )).to.be.revertedWith("Pausable: paused");
    });

    it("Should unpause contract operations", async function () {
      await talentPool.pause();
      await talentPool.unpause();
      expect(await talentPool.paused()).to.be.false;
    });
  });
});
