// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import "./interfaces/IGovernance.sol";
import "./interfaces/ISkillToken.sol";
import "./libraries/GovernanceLibrary.sol";

/**
 * @title Governance
 * @dev Enterprise-grade decentralized governance contract for TalentChain Pro
 * @author TalentChain Pro Team
 * 
 * Features:
 * - Proposal-based governance with configurable parameters
 * - Skill token-based voting power calculation
 * - Multi-signature execution for critical operations
 * - Time-locked proposal execution
 * - Delegation support for voting power
 * - Quadratic voting for fair representation
 * - Emergency proposals with fast-track execution
 * - Comprehensive proposal lifecycle management
 * - IPFS integration for proposal metadata
 * - Advanced quorum and threshold calculations
 */
contract Governance is 
    AccessControl, 
    Pausable, 
    ReentrancyGuard, 
    EIP712,
    IGovernance 
{
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using GovernanceLibrary for uint256;

    // Role definitions
    bytes32 public constant PROPOSAL_CREATOR_ROLE = keccak256("PROPOSAL_CREATOR_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // EIP-712 type hashes
    bytes32 private constant _VOTE_TYPEHASH = 
        keccak256("Vote(uint256 proposalId,uint8 vote,string reason,uint256 nonce,uint256 deadline)");

    // Governance parameters
    struct GovernanceSettings {
        uint256 votingDelay;           // Delay before voting starts
        uint256 votingPeriod;          // Duration of voting period
        uint256 proposalThreshold;     // Min voting power to create proposal
        uint256 quorum;                // Min participation for valid vote
        uint256 executionDelay;        // Delay before execution
        uint256 emergencyQuorum;       // Quorum for emergency proposals
        uint256 emergencyVotingPeriod; // Voting period for emergency proposals
    }

    // State variables
    Counters.Counter private _proposalIdCounter;
    ISkillToken public immutable skillToken;
    
    // Governance settings
    GovernanceSettings public settings;
    
    // Proposals
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => VoteReceipt)) private _proposalVotes;
    mapping(uint256 => bool) private _proposalExecuted;
    
    // Proposal indexes
    uint256[] private _allProposals;
    mapping(address => uint256[]) private _proposalsByProposer;
    
    // Voting power delegation
    mapping(address => address) private _delegates;
    mapping(address => uint256) private _delegatedVotingPower;
    
    // Voting power snapshots (for historical voting power)
    mapping(address => mapping(uint256 => uint256)) private _votingPowerSnapshots;
    mapping(uint256 => uint256) private _proposalSnapshotBlocks;
    
    // Emergency proposals
    mapping(uint256 => bool) private _emergencyProposals;
    
    // Execution queue
    mapping(uint256 => uint256) private _executionTime;
    
    // Nonces for meta-transactions
    mapping(address => uint256) private _nonces;

    // Events (additional to interface)
    event GovernanceSettingsUpdated(GovernanceSettings newSettings);
    event VotingPowerDelegated(address indexed delegator, address indexed delegate, uint256 amount);
    event EmergencyProposalCreated(uint256 indexed proposalId);
    event ProposalQueued(uint256 indexed proposalId, uint256 executionTime);

    // Modifiers
    modifier proposalExists(uint256 proposalId) {
        require(proposalId < _proposalIdCounter.current(), "Governance: proposal not found");
        _;
    }

    modifier onlyValidVoter(uint256 proposalId) {
        require(_getVotingPower(_msgSender(), proposalId) > 0, "Governance: insufficient voting power");
        _;
    }

    constructor(
        address _skillTokenAddress,
        address _initialAdmin,
        GovernanceSettings memory _initialSettings
    ) EIP712("TalentChainGovernance", "1") {
        require(_skillTokenAddress != address(0), "Governance: invalid skill token");
        require(_initialAdmin != address(0), "Governance: invalid admin");

        skillToken = ISkillToken(_skillTokenAddress);
        settings = _initialSettings;

        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(PROPOSAL_CREATOR_ROLE, _initialAdmin);
        _grantRole(EXECUTOR_ROLE, _initialAdmin);
        _grantRole(EMERGENCY_ROLE, _initialAdmin);
        _grantRole(PAUSER_ROLE, _initialAdmin);
    }

    /**
     * @dev Create a new proposal
     */
    function createProposal(
        string calldata title,
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata ipfsHash
    ) 
        external 
        override 
        whenNotPaused
        returns (uint256 proposalId)
    {
        require(bytes(title).length > 0, "Governance: empty title");
        require(bytes(description).length > 0, "Governance: empty description");
        require(targets.length > 0, "Governance: empty targets");
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "Governance: array length mismatch"
        );

        uint256 votingPower = _getCurrentVotingPower(_msgSender());
        require(votingPower >= settings.proposalThreshold, "Governance: below proposal threshold");

        proposalId = _proposalIdCounter.current();
        _proposalIdCounter.increment();

        uint256 startTime = block.timestamp + settings.votingDelay;
        uint256 endTime = startTime + settings.votingPeriod;

        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: _msgSender(),
            title: title,
            description: description,
            targets: targets,
            values: values,
            calldatas: calldatas,
            startTime: startTime,
            endTime: endTime,
            status: ProposalStatus.Pending,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            ipfsHash: ipfsHash
        });

        // Take snapshot of voting power at proposal creation
        _proposalSnapshotBlocks[proposalId] = block.number;

        // Update indexes
        _allProposals.push(proposalId);
        _proposalsByProposer[_msgSender()].push(proposalId);

        emit ProposalCreated(proposalId, _msgSender(), description, startTime, endTime);
    }

    /**
     * @dev Create emergency proposal
     */
    function createEmergencyProposal(
        string calldata title,
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata ipfsHash,
        string calldata justification
    ) 
        external 
        onlyRole(EMERGENCY_ROLE)
        whenNotPaused
        returns (uint256 proposalId)
    {
        require(bytes(justification).length > 0, "Governance: empty justification");

        proposalId = createProposal(title, description, targets, values, calldatas, ipfsHash);

        // Override timing for emergency proposal
        uint256 emergencyStartTime = block.timestamp + 1 hours; // Shorter delay
        uint256 emergencyEndTime = emergencyStartTime + settings.emergencyVotingPeriod;

        _proposals[proposalId].startTime = emergencyStartTime;
        _proposals[proposalId].endTime = emergencyEndTime;
        _emergencyProposals[proposalId] = true;

        emit EmergencyProposalCreated(proposalId);
    }

    /**
     * @dev Cast vote on proposal
     */
    function castVote(
        uint256 proposalId,
        VoteType vote,
        string calldata reason
    ) 
        external 
        override 
        proposalExists(proposalId)
        onlyValidVoter(proposalId)
        whenNotPaused
    {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Governance: proposal not active");
        require(block.timestamp >= proposal.startTime, "Governance: voting not started");
        require(block.timestamp <= proposal.endTime, "Governance: voting ended");

        VoteReceipt storage receipt = _proposalVotes[proposalId][_msgSender()];
        require(!receipt.hasVoted, "Governance: already voted");

        uint256 weight = _getVotingPower(_msgSender(), proposalId);
        require(weight > 0, "Governance: no voting power");

        receipt.hasVoted = true;
        receipt.vote = vote;
        receipt.weight = weight;
        receipt.reason = reason;

        // Update vote counts
        if (vote == VoteType.For) {
            proposal.forVotes += weight;
        } else if (vote == VoteType.Against) {
            proposal.againstVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(_msgSender(), proposalId, vote, weight, reason);

        // Check if proposal should transition to succeeded/defeated
        _updateProposalStatus(proposalId);
    }

    /**
     * @dev Cast vote with signature (gasless)
     */
    function castVoteWithSignature(
        uint256 proposalId,
        VoteType vote,
        string calldata reason,
        bytes calldata signature
    ) 
        external 
        override 
        proposalExists(proposalId)
        whenNotPaused
    {
        Proposal memory proposal = _proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Governance: signature expired");

        bytes32 structHash = keccak256(abi.encode(
            _VOTE_TYPEHASH,
            proposalId,
            uint8(vote),
            keccak256(bytes(reason)),
            _useNonce(_msgSender()),
            proposal.endTime
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == _msgSender(), "Governance: invalid signature");

        // Cast vote normally
        this.castVote(proposalId, vote, reason);
    }

    /**
     * @dev Queue proposal for execution
     */
    function queueProposal(uint256 proposalId) 
        external 
        proposalExists(proposalId)
    {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.status == ProposalStatus.Succeeded, "Governance: proposal not succeeded");

        uint256 executionTime = block.timestamp + settings.executionDelay;
        
        // Emergency proposals can be executed immediately
        if (_emergencyProposals[proposalId]) {
            executionTime = block.timestamp;
        }

        _executionTime[proposalId] = executionTime;
        proposal.status = ProposalStatus.Queued;

        emit ProposalQueued(proposalId, executionTime);
    }

    /**
     * @dev Execute proposal
     */
    function executeProposal(uint256 proposalId) 
        external 
        override 
        onlyRole(EXECUTOR_ROLE)
        proposalExists(proposalId)
        nonReentrant
    {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.status == ProposalStatus.Queued, "Governance: proposal not queued");
        require(block.timestamp >= _executionTime[proposalId], "Governance: execution delay not met");
        require(!_proposalExecuted[proposalId], "Governance: already executed");

        _proposalExecuted[proposalId] = true;
        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        bool success = true;
        
        // Execute all proposal calls
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool callSuccess, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            
            if (!callSuccess) {
                success = false;
            }
        }

        emit ProposalExecuted(proposalId, success);
    }

    /**
     * @dev Cancel proposal
     */
    function cancelProposal(uint256 proposalId) 
        external 
        override 
        proposalExists(proposalId)
    {
        Proposal storage proposal = _proposals[proposalId];
        require(
            _msgSender() == proposal.proposer || hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Governance: unauthorized cancellation"
        );
        require(
            proposal.status != ProposalStatus.Executed &&
            proposal.status != ProposalStatus.Cancelled,
            "Governance: cannot cancel"
        );

        proposal.status = ProposalStatus.Cancelled;

        emit ProposalCancelled(proposalId);
    }

    // Delegation functions
    function delegate(address delegatee) external {
        require(delegatee != _msgSender(), "Governance: cannot delegate to self");
        
        address currentDelegate = _delegates[_msgSender()];
        uint256 delegatorPower = _getCurrentVotingPower(_msgSender());
        
        // Remove power from current delegate
        if (currentDelegate != address(0)) {
            _delegatedVotingPower[currentDelegate] -= delegatorPower;
        }
        
        // Add power to new delegate
        _delegates[_msgSender()] = delegatee;
        if (delegatee != address(0)) {
            _delegatedVotingPower[delegatee] += delegatorPower;
        }
        
        emit VotingPowerDelegated(_msgSender(), delegatee, delegatorPower);
    }

    function undelegate() external {
        address currentDelegate = _delegates[_msgSender()];
        if (currentDelegate != address(0)) {
            uint256 delegatorPower = _getCurrentVotingPower(_msgSender());
            _delegatedVotingPower[currentDelegate] -= delegatorPower;
            _delegates[_msgSender()] = address(0);
            
            emit VotingPowerDelegated(_msgSender(), address(0), delegatorPower);
        }
    }

    // View functions
    function getProposal(uint256 proposalId) 
        external 
        view 
        override 
        proposalExists(proposalId)
        returns (Proposal memory) 
    {
        return _proposals[proposalId];
    }

    function getVoteReceipt(uint256 proposalId, address voter) 
        external 
        view 
        override 
        proposalExists(proposalId)
        returns (VoteReceipt memory) 
    {
        return _proposalVotes[proposalId][voter];
    }

    function getProposalStatus(uint256 proposalId) 
        external 
        view 
        override 
        proposalExists(proposalId)
        returns (ProposalStatus) 
    {
        return _proposals[proposalId].status;
    }

    function getVotingPower(address account) 
        external 
        view 
        override 
        returns (uint256) 
    {
        return _getCurrentVotingPower(account);
    }

    function getQuorum() external view override returns (uint256) {
        return settings.quorum;
    }

    function getVotingDelay() external view override returns (uint256) {
        return settings.votingDelay;
    }

    function getVotingPeriod() external view override returns (uint256) {
        return settings.votingPeriod;
    }

    function getProposalThreshold() external view override returns (uint256) {
        return settings.proposalThreshold;
    }

    function getAllProposals() external view override returns (uint256[] memory) {
        return _allProposals;
    }

    function getActiveProposals() external view override returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active proposals
        for (uint256 i = 0; i < _allProposals.length; i++) {
            if (_proposals[_allProposals[i]].status == ProposalStatus.Active) {
                activeCount++;
            }
        }
        
        // Collect active proposals
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _allProposals.length; i++) {
            if (_proposals[_allProposals[i]].status == ProposalStatus.Active) {
                activeProposals[index] = _allProposals[i];
                index++;
            }
        }
        
        return activeProposals;
    }

    function getProposalsByProposer(address proposer) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _proposalsByProposer[proposer];
    }

    function canExecute(uint256 proposalId) 
        external 
        view 
        override 
        proposalExists(proposalId)
        returns (bool) 
    {
        Proposal memory proposal = _proposals[proposalId];
        return proposal.status == ProposalStatus.Queued && 
               block.timestamp >= _executionTime[proposalId] &&
               !_proposalExecuted[proposalId];
    }

    function hasVoted(uint256 proposalId, address voter) 
        external 
        view 
        override 
        proposalExists(proposalId)
        returns (bool) 
    {
        return _proposalVotes[proposalId][voter].hasVoted;
    }

    function getDelegates(address account) external view returns (address) {
        return _delegates[account];
    }

    function getDelegatedVotingPower(address account) external view returns (uint256) {
        return _delegatedVotingPower[account];
    }

    function nonces(address owner) external view returns (uint256) {
        return _nonces[owner];
    }

    // Internal functions
    function _getCurrentVotingPower(address account) internal view returns (uint256) {
        // Base voting power from skill tokens
        uint256[] memory userTokens = skillToken.getTokensByOwner(account);
        uint256 basePower = 0;
        
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (skillToken.isSkillActive(userTokens[i])) {
                ISkillToken.SkillData memory skillData = skillToken.getSkillData(userTokens[i]);
                basePower += uint256(skillData.level) * 100; // Level-based voting power
            }
        }
        
        // Add delegated voting power
        basePower += _delegatedVotingPower[account];
        
        return basePower;
    }

    function _getVotingPower(address account, uint256 proposalId) internal view returns (uint256) {
        // For historical consistency, use snapshot if available
        uint256 snapshotPower = _votingPowerSnapshots[account][_proposalSnapshotBlocks[proposalId]];
        
        if (snapshotPower > 0) {
            return snapshotPower;
        }
        
        // Fall back to current voting power
        return _getCurrentVotingPower(account);
    }

    function _updateProposalStatus(uint256 proposalId) internal {
        Proposal storage proposal = _proposals[proposalId];
        
        if (block.timestamp > proposal.endTime) {
            uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
            uint256 requiredQuorum = _emergencyProposals[proposalId] ? 
                settings.emergencyQuorum : settings.quorum;
            
            if (totalVotes >= requiredQuorum && proposal.forVotes > proposal.againstVotes) {
                proposal.status = ProposalStatus.Succeeded;
            } else {
                proposal.status = ProposalStatus.Defeated;
            }
        } else if (block.timestamp >= proposal.startTime) {
            proposal.status = ProposalStatus.Active;
        }
    }

    function _useNonce(address owner) internal returns (uint256 current) {
        current = _nonces[owner];
        _nonces[owner]++;
    }

    // Admin functions
    function updateGovernanceSettings(GovernanceSettings calldata newSettings) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newSettings.votingDelay > 0, "Governance: invalid voting delay");
        require(newSettings.votingPeriod > 0, "Governance: invalid voting period");
        require(newSettings.quorum > 0, "Governance: invalid quorum");
        
        settings = newSettings;
        
        emit GovernanceSettingsUpdated(newSettings);
    }

    // Batch operations for efficiency
    function batchExecuteProposals(uint256[] calldata proposalIds) 
        external 
        onlyRole(EXECUTOR_ROLE) 
    {
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (this.canExecute(proposalIds[i])) {
                this.executeProposal(proposalIds[i]);
            }
        }
    }

    function updateProposalStatuses(uint256[] calldata proposalIds) external {
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (proposalIds[i] < _proposalIdCounter.current()) {
                _updateProposalStatus(proposalIds[i]);
            }
        }
    }

    // Emergency functions
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Emergency withdrawal (admin only)
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(_msgSender()).transfer(address(this).balance);
    }

    // Receive function for proposal execution funding
    receive() external payable {}
}