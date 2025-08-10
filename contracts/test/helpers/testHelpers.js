const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Test configuration and utilities for TalentChain Pro
 */

// Common test addresses and roles
const TEST_ROLES = {
  MINTER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
  ORACLE_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ORACLE_ROLE")),
  UPDATER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UPDATER_ROLE")),
  PAUSER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE")),
  POOL_MANAGER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("POOL_MANAGER_ROLE")),
  MATCHER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MATCHER_ROLE")),
  FEE_MANAGER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("FEE_MANAGER_ROLE")),
  PROPOSAL_CREATOR_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSAL_CREATOR_ROLE")),
  EXECUTOR_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")),
  EMERGENCY_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EMERGENCY_ROLE")),
  ORACLE_ADMIN_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ORACLE_ADMIN_ROLE")),
  CHALLENGE_RESOLVER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CHALLENGE_RESOLVER_ROLE"))
};

// Common test constants
const TEST_CONSTANTS = {
  MIN_POOL_STAKE: ethers.utils.parseEther("0.1"),
  MIN_APPLICATION_STAKE: ethers.utils.parseEther("0.01"),
  MIN_ORACLE_STAKE: ethers.utils.parseEther("10"),
  MIN_CHALLENGE_STAKE: ethers.utils.parseEther("1"),
  PLATFORM_FEE_RATE: 250, // 2.5%
  ONE_DAY: 24 * 60 * 60,
  ONE_WEEK: 7 * 24 * 60 * 60,
  ONE_MONTH: 30 * 24 * 60 * 60,
  ONE_YEAR: 365 * 24 * 60 * 60
};

// Utility functions for tests
const TEST_UTILS = {
  /**
   * Deploy all core contracts for testing
   */
  async deployFullStack() {
    const [owner, ...signers] = await ethers.getSigners();

    // Deploy SkillToken
    const SkillToken = await ethers.getContractFactory("SkillToken");
    const skillToken = await SkillToken.deploy(
      "TalentChainPro Skill Token",
      "SKILL",
      owner.address
    );
    await skillToken.deployed();

    // Deploy TalentPool
    const TalentPool = await ethers.getContractFactory("TalentPool");
    const talentPool = await TalentPool.deploy(
      skillToken.address,
      signers[0].address, // Fee collector
      owner.address
    );
    await talentPool.deployed();

    // Deploy Governance
    const Governance = await ethers.getContractFactory("Governance");
    const governanceSettings = {
      votingDelay: TEST_CONSTANTS.ONE_DAY,
      votingPeriod: TEST_CONSTANTS.ONE_WEEK,
      proposalThreshold: 1000,
      quorum: 1000, // 10% - adjusted for test compatibility
      executionDelay: 2 * TEST_CONSTANTS.ONE_DAY,
      emergencyQuorum: 500, // 5% - adjusted for emergency quorum
      emergencyVotingPeriod: TEST_CONSTANTS.ONE_DAY
    };
    const governance = await Governance.deploy(
      skillToken.address,
      owner.address,
      governanceSettings
    );
    await governance.deployed();

    // Deploy ReputationOracle
    const ReputationOracle = await ethers.getContractFactory("ReputationOracle");
    const reputationOracle = await ReputationOracle.deploy(
      skillToken.address,
      owner.address
    );
    await reputationOracle.deployed();

    return {
      skillToken,
      talentPool,
      governance,
      reputationOracle,
      owner,
      signers
    };
  },

  /**
   * Setup roles for all contracts
   */
  async setupRoles(contracts, accounts) {
    const { skillToken, talentPool, governance, reputationOracle } = contracts;
    const { owner, minter, oracle, manager, executor } = accounts;

    // SkillToken roles
    await skillToken.grantRole(TEST_ROLES.MINTER_ROLE, minter.address);
    await skillToken.grantRole(TEST_ROLES.ORACLE_ROLE, oracle.address);

    // TalentPool roles
    await talentPool.grantRole(TEST_ROLES.POOL_MANAGER_ROLE, manager.address);
    await talentPool.grantRole(TEST_ROLES.FEE_MANAGER_ROLE, governance.address); // Allow governance to manage fees
    await talentPool.grantRole(TEST_ROLES.PAUSER_ROLE, governance.address); // Allow governance to pause system

    // Governance roles
    await governance.grantRole(TEST_ROLES.PROPOSAL_CREATOR_ROLE, manager.address);
    await governance.grantRole(TEST_ROLES.EXECUTOR_ROLE, executor.address);

    // ReputationOracle roles
    await reputationOracle.grantRole(TEST_ROLES.ORACLE_ADMIN_ROLE, oracle.address);
  },

  /**
   * Mint test skill tokens
   */
  async mintTestSkillTokens(skillToken, recipient, count = 3) {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryDate = currentTime + TEST_CONSTANTS.ONE_YEAR;
    const tokenIds = [];

    const skills = [
      { category: "JavaScript", subcategory: "Frontend", level: 8 },
      { category: "React", subcategory: "Frontend", level: 7 },
      { category: "Node.js", subcategory: "Backend", level: 6 },
      { category: "Python", subcategory: "Backend", level: 9 },
      { category: "Solidity", subcategory: "Blockchain", level: 5 }
    ];

    for (let i = 0; i < Math.min(count, skills.length); i++) {
      const skill = skills[i];
      await skillToken.mintSkillToken(
        recipient,
        skill.category,
        skill.subcategory,
        skill.level,
        expiryDate,
        `${skill.category} expertise`,
        `ipfs://token${i}`
      );
      tokenIds.push(i);
    }

    return tokenIds;
  },

  /**
   * Create test job pool
   */
  async createTestPool(talentPool, company, options = {}) {
    const defaults = {
      title: "Software Developer",
      description: "Full-stack development position",
      jobType: 0, // FullTime
      requiredSkills: ["JavaScript", "React"],
      minimumLevels: [6, 5],
      salaryMin: ethers.utils.parseEther("3000"),
      salaryMax: ethers.utils.parseEther("5000"),
      location: "San Francisco",
      isRemote: false,
      stake: ethers.utils.parseEther("1.0"),
      duration: TEST_CONSTANTS.ONE_MONTH
    };

    const config = { ...defaults, ...options };
    const currentTime = await ethers.provider.getBlock("latest");
    const deadline = currentTime.timestamp + config.duration;

    const tx = await talentPool.connect(company).createPool(
      config.title,
      config.description,
      config.jobType,
      config.requiredSkills,
      config.minimumLevels,
      config.salaryMin,
      config.salaryMax,
      deadline,
      config.location,
      config.isRemote,
      { value: config.stake }
    );

    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "PoolCreated");
    return event.args.poolId;
  },

  /**
   * Submit test application
   */
  async submitTestApplication(talentPool, candidate, poolId, skillTokenIds, options = {}) {
    const defaults = {
      coverLetter: "I am excited about this opportunity",
      portfolio: "github.com/candidate",
      stake: ethers.utils.parseEther("0.1")
    };

    const config = { ...defaults, ...options };

    return await talentPool.connect(candidate).submitApplication(
      poolId,
      skillTokenIds,
      config.coverLetter,
      config.portfolio,
      { value: config.stake }
    );
  },

  /**
   * Advance time helper
   */
  async advanceTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  },

  /**
   * Snapshot and restore blockchain state
   */
  async takeSnapshot() {
    return await ethers.provider.send("evm_snapshot");
  },

  async restoreSnapshot(snapshotId) {
    await ethers.provider.send("evm_revert", [snapshotId]);
  },

  /**
   * Check contract sizes
   */
  async checkContractSizes() {
    const contracts = [
      "SkillToken",
      "TalentPool", 
      "Governance",
      "ReputationOracle"
    ];

    const sizes = {};
    for (const contractName of contracts) {
      const Contract = await ethers.getContractFactory(contractName);
      const bytecode = Contract.bytecode;
      const size = (bytecode.length - 2) / 2; // Remove 0x prefix and convert to bytes
      sizes[contractName] = {
        bytes: size,
        kilobytes: (size / 1024).toFixed(2)
      };
    }

    return sizes;
  },

  /**
   * Generate random test data
   */
  generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  },

  generateRandomBytes32() {
    return ethers.utils.hexlify(ethers.utils.randomBytes(32));
  },

  generateRandomSkillCategory() {
    const categories = [
      "JavaScript", "Python", "Rust", "Go", "Java",
      "React", "Vue", "Angular", "Node.js", "Django",
      "Solidity", "Web3", "DeFi", "NFT", "Blockchain"
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }
};

// Test assertion helpers
const TEST_ASSERTIONS = {
  /**
   * Assert that a transaction emits specific events
   */
  async expectEvent(tx, eventName, args = {}) {
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === eventName);
    expect(event).to.not.be.undefined;
    
    if (Object.keys(args).length > 0) {
      for (const [key, value] of Object.entries(args)) {
        expect(event.args[key]).to.equal(value);
      }
    }
  },

  /**
   * Assert approximate equality for BigNumbers
   */
  expectApproximately(actual, expected, tolerance = ethers.utils.parseEther("0.001")) {
    expect(actual).to.be.closeTo(expected, tolerance);
  },

  /**
   * Assert role assignment
   */
  async expectRole(contract, role, account, hasRole = true) {
    expect(await contract.hasRole(role, account)).to.equal(hasRole);
  },

  /**
   * Assert contract pause state
   */
  async expectPaused(contract, isPaused = true) {
    expect(await contract.paused()).to.equal(isPaused);
  }
};

module.exports = {
  TEST_ROLES,
  TEST_CONSTANTS,
  TEST_UTILS,
  TEST_ASSERTIONS
};
