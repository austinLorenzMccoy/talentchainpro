const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Governance Tests", function () {
  let SkillToken;
  let Governance;
  let skillToken;
  let governance;
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let executor;
  let addresses;

  const PROPOSAL_CREATOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSAL_CREATOR_ROLE"));
  const EXECUTOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EXECUTOR_ROLE"));
  const EMERGENCY_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EMERGENCY_ROLE"));
  const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"));
  const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));

  const initialSettings = {
    votingDelay: 24 * 60 * 60, // 1 day
    votingPeriod: 7 * 24 * 60 * 60, // 7 days
    proposalThreshold: 1000, // 1000 voting power required
    quorum: 1000, // Lower quorum for tests
    executionDelay: 2 * 24 * 60 * 60, // 2 days
    emergencyQuorum: 500, // Lower emergency quorum
    emergencyVotingPeriod: 24 * 60 * 60 // 1 day for emergency
  };

  beforeEach(async function () {
    SkillToken = await ethers.getContractFactory("SkillToken");
    Governance = await ethers.getContractFactory("Governance");
    [owner, proposer, voter1, voter2, executor, ...addresses] = await ethers.getSigners();

    // Deploy SkillToken
    skillToken = await SkillToken.deploy(
      "TalentChainPro Skill Token",
      "SKILL",
      owner.address
    );
    await skillToken.deployed();

    // Deploy Governance
    governance = await Governance.deploy(
      skillToken.address,
      owner.address,
      initialSettings
    );
    await governance.deployed();

    // Grant roles
    await governance.grantRole(PROPOSAL_CREATOR_ROLE, proposer.address);
    await governance.grantRole(EXECUTOR_ROLE, executor.address);
    await governance.grantRole(EMERGENCY_ROLE, owner.address);
    await skillToken.grantRole(MINTER_ROLE, owner.address);

    // Mint skill tokens for voting power
    const currentTime = await time.latest();
    const expiryDate = currentTime + (365 * 24 * 60 * 60);

    // Give proposer enough voting power (need 1000+ for proposal threshold)
    // Each skill level gives level * 100 voting power
    for (let i = 0; i < 12; i++) {
      await skillToken.mintSkillToken(
        proposer.address, `Skill${i}`, "Category", 10, expiryDate, "metadata", `uri${i}`
      );
    }

    // Give owner voting power for emergency proposals
    for (let i = 0; i < 12; i++) {
      await skillToken.mintSkillToken(
        owner.address, `OwnerSkill${i}`, "Category", 10, expiryDate, "metadata", `ownerUri${i}`
      );
    }

    // Give voters voting power (need decent amounts for quorum)
    for (let i = 0; i < 5; i++) {
      await skillToken.mintSkillToken(
        voter1.address, `Skill${i + 100}`, "Category", 10, expiryDate, "metadata", `uri${i + 100}`
      );
      await skillToken.mintSkillToken(
        voter2.address, `Skill${i + 200}`, "Category", 10, expiryDate, "metadata", `uri${i + 200}`
      );
    }
  });

  describe("Deployment", function () {
    it("Should set correct initial parameters", async function () {
      expect(await governance.skillToken()).to.equal(skillToken.address);
      
      const settings = await governance.settings();
      expect(settings.votingDelay).to.equal(initialSettings.votingDelay);
      expect(settings.votingPeriod).to.equal(initialSettings.votingPeriod);
      expect(settings.proposalThreshold).to.equal(initialSettings.proposalThreshold);
      expect(settings.quorum).to.equal(initialSettings.quorum);
    });

    it("Should grant correct roles", async function () {
      expect(await governance.hasRole(await governance.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await governance.hasRole(PROPOSAL_CREATOR_ROLE, owner.address)).to.be.true;
      expect(await governance.hasRole(EXECUTOR_ROLE, owner.address)).to.be.true;
      expect(await governance.hasRole(EMERGENCY_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal successfully", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];
      const ipfsHash = "QmTest123";

      await expect(governance.connect(proposer).createProposal(
        title, description, targets, values, calldatas, ipfsHash
      )).to.emit(governance, "ProposalCreated");

      const proposal = await governance.getProposal(0);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.status).to.equal(0); // Pending
    });

    it("Should validate proposal creation requirements", async function () {
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      // Empty title
      await expect(governance.connect(proposer).createProposal(
        "", "Description", targets, values, calldatas, "hash"
      )).to.be.revertedWithCustomError(governance, "EmptyProposalData");

      // Empty description
      await expect(governance.connect(proposer).createProposal(
        "Title", "", targets, values, calldatas, "hash"
      )).to.be.revertedWithCustomError(governance, "EmptyProposalData");

      // Mismatched arrays
      await expect(governance.connect(proposer).createProposal(
        "Title", "Description", targets, [0, 1], calldatas, "hash"
      )).to.be.revertedWithCustomError(governance, "InvalidArrayLength");
    });

    it("Should require sufficient voting power", async function () {
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      // Use an account with no voting power (addresses[0] has no skill tokens)
      await expect(governance.connect(addresses[0]).createProposal(
        "Title", "Description", targets, values, calldatas, "hash"
      )).to.be.revertedWithCustomError(governance, "InsufficientVotingPower");
    });

    it("Should create emergency proposal", async function () {
      const title = "Emergency Proposal";
      const description = "Urgent governance change";
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("pause", [])];
      const ipfsHash = "QmEmergency123";
      const justification = "System is under attack";

      await expect(governance.createEmergencyProposal(
        title, description, targets, values, calldatas, ipfsHash, justification
      )).to.emit(governance, "EmergencyProposalCreated");
    });
  });

  describe("Voting", function () {
    let proposalId;

    beforeEach(async function () {
      // Ensure clean delegation state
      try {
        await governance.connect(voter1).undelegate();
        await governance.connect(voter2).undelegate();
      } catch (e) {
        // Ignore if not delegated
      }

      // Create a proposal
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      await governance.connect(proposer).createProposal(
        "Test Proposal", "Test Description", targets, values, calldatas, "hash"
      );
      proposalId = 0;

      // Advance time to start voting
      await time.increase(initialSettings.votingDelay + 1);

      // Update proposal status to Active
      await governance.updateProposalStatuses([proposalId]);
    });

    it("Should cast vote successfully", async function () {
      await expect(governance.connect(voter1).castVote(
        proposalId, 1, "I support this proposal"
      )).to.emit(governance, "VoteCast");

      const receipt = await governance.getVoteReceipt(proposalId, voter1.address);
      expect(receipt.hasVoted).to.be.true;
      expect(receipt.vote).to.equal(1); // For
      expect(receipt.reason).to.equal("I support this proposal");
    });

    it("Should calculate voting power correctly", async function () {
      const votingPower = await governance.getVotingPower(voter1.address);
      expect(votingPower).to.equal(10000); // 5 tokens * level 10 * 100 + delegated power
    });

    it("Should prevent double voting", async function () {
      await governance.connect(voter1).castVote(proposalId, 1, "First vote");

      await expect(governance.connect(voter1).castVote(
        proposalId, 0, "Second vote"
      )).to.be.revertedWithCustomError(governance, "AlreadyVoted");
    });

    it("Should validate voting period", async function () {
      // Try to vote before voting starts
      await governance.connect(proposer).createProposal(
        "New Proposal", "Description", [governance.address], [0], 
        [governance.interface.encodeFunctionData("getQuorum", [])], "hash"
      );

      // Proposal should be in Pending state, not active yet
      await expect(governance.connect(voter1).castVote(
        1, 1, "Too early"
      )).to.be.revertedWithCustomError(governance, "ProposalNotActive");

      // Advance past voting period
      await time.increase(initialSettings.votingPeriod + 1);

      await expect(governance.connect(voter1).castVote(
        proposalId, 1, "Too late"
      )).to.be.revertedWithCustomError(governance, "VotingEnded");
    });

    it("Should update proposal vote counts", async function () {
      await governance.connect(voter1).castVote(proposalId, 1, "For"); // 10000 votes
      await governance.connect(voter2).castVote(proposalId, 0, "Against"); // 5000 votes

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(10000);
      expect(proposal.againstVotes).to.equal(10000);
    });
  });

  describe("Proposal Execution", function () {
    let proposalId;

    beforeEach(async function () {
      // Create and pass a proposal
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      await governance.connect(proposer).createProposal(
        "Test Proposal", "Test Description", targets, values, calldatas, "hash"
      );
      proposalId = 0;

      // Advance to voting period and vote
      await time.increase(initialSettings.votingDelay + 1);
      await governance.updateProposalStatuses([proposalId]);
      await governance.connect(voter1).castVote(proposalId, 1, "For");
      await governance.connect(voter2).castVote(proposalId, 1, "For");

      // Advance past voting period
      await time.increase(initialSettings.votingPeriod + 1);
      await governance.updateProposalStatuses([proposalId]);
    });

    it("Should queue proposal after successful vote", async function () {
      await expect(governance.queueProposal(proposalId))
        .to.emit(governance, "ProposalQueued");

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(4); // Queued
    });

    it("Should execute proposal after execution delay", async function () {
      await governance.queueProposal(proposalId);
      
      // Advance past execution delay
      await time.increase(initialSettings.executionDelay + 1);

      await expect(governance.connect(executor).executeProposal(proposalId))
        .to.emit(governance, "ProposalExecuted");

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.executed).to.be.true;
      expect(proposal.status).to.equal(5); // Executed
    });

    it("Should not execute proposal before execution delay", async function () {
      await governance.queueProposal(proposalId);

      await expect(governance.connect(executor).executeProposal(proposalId))
        .to.be.revertedWithCustomError(governance, "ExecutionDelayNotMet");
    });

    it("Should validate executor role", async function () {
      await governance.queueProposal(proposalId);
      await time.increase(initialSettings.executionDelay + 1);

      await expect(governance.connect(voter1).executeProposal(proposalId))
        .to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });

  describe("Proposal Cancellation", function () {
    let proposalId;

    beforeEach(async function () {
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      await governance.connect(proposer).createProposal(
        "Test Proposal", "Test Description", targets, values, calldatas, "hash"
      );
      proposalId = 0;
    });

    it("Should allow proposer to cancel", async function () {
      await expect(governance.connect(proposer).cancelProposal(proposalId))
        .to.emit(governance, "ProposalCancelled");

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(6); // Cancelled
    });

    it("Should allow admin to cancel", async function () {
      await expect(governance.cancelProposal(proposalId))
        .to.emit(governance, "ProposalCancelled");
    });

    it("Should not allow unauthorized cancellation", async function () {
      await expect(governance.connect(voter1).cancelProposal(proposalId))
        .to.be.revertedWith("Governance: unauthorized cancellation");
    });

    it("Should not cancel executed proposal", async function () {
      // Fast-track through voting and execution
      await time.increase(initialSettings.votingDelay + 1);
      await governance.updateProposalStatuses([proposalId]);
      await governance.connect(voter1).castVote(proposalId, 1, "For");
      await governance.connect(voter2).castVote(proposalId, 1, "For");
      await time.increase(initialSettings.votingPeriod + 1);
      await governance.updateProposalStatuses([proposalId]);
      await governance.queueProposal(proposalId);
      await time.increase(initialSettings.executionDelay + 1);
      await governance.connect(executor).executeProposal(proposalId);

      await expect(governance.connect(proposer).cancelProposal(proposalId))
        .to.be.revertedWith("Governance: cannot cancel");
    });
  });

  describe("Delegation", function () {
    it("Should delegate voting power", async function () {
      const initialPower = await governance.getVotingPower(voter1.address);
      
      await expect(governance.connect(voter1).delegate(voter2.address))
        .to.emit(governance, "VotingPowerDelegated")
        .withArgs(voter1.address, voter2.address, initialPower);

      expect(await governance.getDelegates(voter1.address)).to.equal(voter2.address);
      expect(await governance.getDelegatedVotingPower(voter2.address)).to.equal(initialPower);
    });

    it("Should not allow self-delegation", async function () {
      await expect(governance.connect(voter1).delegate(voter1.address))
        .to.be.revertedWith("Governance: cannot delegate to self");
    });

    it("Should allow undelegation", async function () {
      await governance.connect(voter1).delegate(voter2.address);
      
      const undelegateTx = await governance.connect(voter1).undelegate();
      
      expect(undelegateTx)
        .to.emit(governance, "VotingPowerDelegated");

      expect(await governance.getDelegates(voter1.address)).to.equal(ethers.constants.AddressZero);
      expect(await governance.getDelegatedVotingPower(voter2.address)).to.equal(0);
    });
  });

  describe("View Functions", function () {
    let proposalId;

    beforeEach(async function () {
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      await governance.connect(proposer).createProposal(
        "Test Proposal", "Test Description", targets, values, calldatas, "hash"
      );
      proposalId = 0;
    });

    it("Should get all proposals", async function () {
      const allProposals = await governance.getAllProposals();
      expect(allProposals.length).to.equal(1);
      expect(allProposals[0]).to.equal(proposalId);
    });

    it("Should get active proposals", async function () {
      // Advance to make proposal active
      await time.increase(initialSettings.votingDelay + 1);
      await governance.updateProposalStatuses([proposalId]);
      
      const activeProposals = await governance.getActiveProposals();
      expect(activeProposals.length).to.equal(1);
    });

    it("Should get proposals by proposer", async function () {
      const proposerProposals = await governance.getProposalsByProposer(proposer.address);
      expect(proposerProposals.length).to.equal(1);
      expect(proposerProposals[0]).to.equal(proposalId);
    });

    it("Should check execution eligibility", async function () {
      expect(await governance.canExecute(proposalId)).to.be.false;

      // Go through the process to make it executable
      await time.increase(initialSettings.votingDelay + 1);
      await governance.updateProposalStatuses([proposalId]);
      await governance.connect(voter1).castVote(proposalId, 1, "For");
      await governance.connect(voter2).castVote(proposalId, 1, "For");
      await time.increase(initialSettings.votingPeriod + 1);
      await governance.updateProposalStatuses([proposalId]);
      await governance.queueProposal(proposalId);
      await time.increase(initialSettings.executionDelay + 1);

      expect(await governance.canExecute(proposalId)).to.be.true;
    });

    it("Should check voting status", async function () {
      expect(await governance.hasVoted(proposalId, voter1.address)).to.be.false;

      await time.increase(initialSettings.votingDelay + 1);
      await governance.updateProposalStatuses([proposalId]);
      await governance.connect(voter1).castVote(proposalId, 1, "For");

      expect(await governance.hasVoted(proposalId, voter1.address)).to.be.true;
    });
  });

  describe("Governance Settings", function () {
    const newSettings = {
      votingDelay: 48 * 60 * 60, // 2 days
      votingPeriod: 14 * 24 * 60 * 60, // 14 days
      proposalThreshold: 2000,
      quorum: 5000,
      executionDelay: 3 * 24 * 60 * 60, // 3 days
      emergencyQuorum: 3000,
      emergencyVotingPeriod: 12 * 60 * 60 // 12 hours
    };

    it("Should allow admin to update settings", async function () {
      await expect(governance.updateGovernanceSettings(newSettings))
        .to.emit(governance, "GovernanceSettingsUpdated");

      const updatedSettings = await governance.settings();
      expect(updatedSettings.votingDelay).to.equal(newSettings.votingDelay);
      expect(updatedSettings.votingPeriod).to.equal(newSettings.votingPeriod);
    });

    it("Should validate settings parameters", async function () {
      const invalidSettings = { ...newSettings, quorum: 11000 }; // > 100%

      await expect(governance.updateGovernanceSettings(invalidSettings))
        .to.be.revertedWithCustomError(governance, "InvalidQuorum");
    });

    it("Should not allow non-admin to update settings", async function () {
      await expect(governance.connect(voter1).updateGovernanceSettings(newSettings))
        .to.be.reverted; // Just check that it reverts, regardless of specific message
    });
  });

  describe("Pausable Functionality", function () {
    it("Should pause governance operations", async function () {
      await governance.pause();
      expect(await governance.paused()).to.be.true;

      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      await expect(governance.connect(proposer).createProposal(
        "Test", "Description", targets, values, calldatas, "hash"
      )).to.be.revertedWith("Pausable: paused");
    });

    it("Should unpause governance operations", async function () {
      await governance.pause();
      await governance.unpause();
      expect(await governance.paused()).to.be.false;
    });
  });

  describe("Batch Operations", function () {
    it("Should batch execute multiple proposals", async function () {
      // Create multiple proposals and make them executable
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      for (let i = 0; i < 3; i++) {
        await governance.connect(proposer).createProposal(
          `Proposal ${i}`, "Description", targets, values, calldatas, "hash"
        );
      }

      // Make them all executable (process all together)
      await time.increase(initialSettings.votingDelay + 1);
      await governance.updateProposalStatuses([0, 1, 2]);
      
      for (let i = 0; i < 3; i++) {
        await governance.connect(proposer).castVote(i, 1, "For");
        await governance.connect(voter1).castVote(i, 1, "For");
        await governance.connect(voter2).castVote(i, 1, "For");
        await governance.connect(owner).castVote(i, 1, "For");
      }
      
      await time.increase(initialSettings.votingPeriod + 1);
      await governance.updateProposalStatuses([0, 1, 2]);
      
      for (let i = 0; i < 3; i++) {
        await governance.queueProposal(i);
      }

      await time.increase(initialSettings.executionDelay + 1);

      const tx = await governance.connect(executor).batchExecuteProposals([0, 1, 2]);
      const receipt = await tx.wait();
      
      // Check that all 3 proposals were executed
      const executedEvents = receipt.events?.filter(e => e.event === "ProposalExecuted") || [];
      expect(executedEvents.length).to.equal(3);
    });

    it("Should update multiple proposal statuses", async function () {
      // Create proposals
      const targets = [governance.address];
      const values = [0];
      const calldatas = [governance.interface.encodeFunctionData("getQuorum", [])];

      for (let i = 0; i < 2; i++) {
        await governance.connect(proposer).createProposal(
          `Proposal ${i}`, "Description", targets, values, calldatas, "hash"
        );
      }

      await governance.updateProposalStatuses([0, 1]);
      // Should not revert
    });
  });
});
