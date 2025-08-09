// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IGovernance
 * @dev Interface for the Governance contract - Decentralized governance for TalentChain Pro
 * @author TalentChain Pro Team
 */
interface IGovernance {
    // Enums
    enum ProposalStatus { Pending, Active, Succeeded, Defeated, Queued, Executed, Cancelled }
    enum VoteType { Against, For, Abstain }

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType vote,
        uint256 weight,
        string reason
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool success
    );
    
    event ProposalCancelled(
        uint256 indexed proposalId
    );

    // Structs
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        string ipfsHash;
    }

    struct VoteReceipt {
        bool hasVoted;
        VoteType vote;
        uint256 weight;
        string reason;
    }

    // Core functions
    function createProposal(
        string calldata title,
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata ipfsHash
    ) external returns (uint256 proposalId);

    function castVote(
        uint256 proposalId,
        VoteType vote,
        string calldata reason
    ) external;

    function castVoteWithSignature(
        uint256 proposalId,
        VoteType vote,
        string calldata reason,
        bytes calldata signature
    ) external;

    function executeProposal(uint256 proposalId) external;

    function cancelProposal(uint256 proposalId) external;

    // View functions
    function getProposal(uint256 proposalId) 
        external 
        view 
        returns (Proposal memory);

    function getVoteReceipt(uint256 proposalId, address voter) 
        external 
        view 
        returns (VoteReceipt memory);

    function getProposalStatus(uint256 proposalId) 
        external 
        view 
        returns (ProposalStatus);

    function getVotingPower(address account) 
        external 
        view 
        returns (uint256);

    function getQuorum() external view returns (uint256);

    function getVotingDelay() external view returns (uint256);

    function getVotingPeriod() external view returns (uint256);

    function getProposalThreshold() external view returns (uint256);

    function getAllProposals() 
        external 
        view 
        returns (uint256[] memory);

    function getActiveProposals() 
        external 
        view 
        returns (uint256[] memory);

    function getProposalsByProposer(address proposer) 
        external 
        view 
        returns (uint256[] memory);

    function canExecute(uint256 proposalId) 
        external 
        view 
        returns (bool);

    function hasVoted(uint256 proposalId, address voter) 
        external 
        view 
        returns (bool);
}