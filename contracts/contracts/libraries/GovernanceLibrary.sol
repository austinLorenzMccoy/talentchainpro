// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IGovernance.sol";

/**
 * @title GovernanceLibrary
 * @dev Library containing utility functions for governance operations
 * @author TalentChain Pro Team
 */
library GovernanceLibrary {
    // Constants
    uint256 public constant MIN_VOTING_DELAY = 1 hours;
    uint256 public constant MAX_VOTING_DELAY = 7 days;
    uint256 public constant MIN_VOTING_PERIOD = 1 days;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public constant MIN_EXECUTION_DELAY = 1 hours;
    uint256 public constant MAX_EXECUTION_DELAY = 14 days;
    uint256 public constant MIN_QUORUM = 100; // 1%
    uint256 public constant MAX_QUORUM = 5000; // 50%
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1;
    uint256 public constant EMERGENCY_VOTING_PERIOD = 24 hours;
    uint256 public constant EMERGENCY_QUORUM = 2000; // 20%

    // Errors
    error InvalidVotingDelay(uint256 delay);
    error InvalidVotingPeriod(uint256 period);
    error InvalidExecutionDelay(uint256 delay);
    error InvalidQuorum(uint256 quorum);
    error InvalidProposalThreshold(uint256 threshold);
    error ProposalNotActive();
    error VotingNotStarted();
    error VotingEnded();
    error AlreadyVoted();
    error InsufficientVotingPower();
    error ProposalNotSucceeded();
    error ExecutionDelayNotMet();
    error EmptyProposalData();
    error InvalidArrayLength();

    /**
     * @dev Validates governance settings
     */
    function validateGovernanceSettings(
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorum,
        uint256 executionDelay
    ) internal pure {
        if (votingDelay < MIN_VOTING_DELAY || votingDelay > MAX_VOTING_DELAY) {
            revert InvalidVotingDelay(votingDelay);
        }

        if (
            votingPeriod < MIN_VOTING_PERIOD || votingPeriod > MAX_VOTING_PERIOD
        ) {
            revert InvalidVotingPeriod(votingPeriod);
        }

        if (
            executionDelay < MIN_EXECUTION_DELAY ||
            executionDelay > MAX_EXECUTION_DELAY
        ) {
            revert InvalidExecutionDelay(executionDelay);
        }

        if (quorum < MIN_QUORUM || quorum > MAX_QUORUM) {
            revert InvalidQuorum(quorum);
        }

        if (proposalThreshold < MIN_PROPOSAL_THRESHOLD) {
            revert InvalidProposalThreshold(proposalThreshold);
        }
    }

    /**
     * @dev Validates proposal creation parameters
     */
    function validateProposalCreation(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        uint256 proposerVotingPower,
        uint256 proposalThreshold
    ) internal pure {
        if (bytes(title).length == 0 || bytes(description).length == 0) {
            revert EmptyProposalData();
        }

        if (targets.length == 0) {
            revert EmptyProposalData();
        }

        if (
            targets.length != values.length ||
            targets.length != calldatas.length
        ) {
            revert InvalidArrayLength();
        }

        if (proposerVotingPower < proposalThreshold) {
            revert InsufficientVotingPower();
        }
    }

    /**
     * @dev Validates voting conditions
     */
    function validateVoting(
        IGovernance.ProposalStatus status,
        uint256 startTime,
        uint256 endTime,
        bool hasVoted,
        uint256 votingPower
    ) internal view {
        if (status != IGovernance.ProposalStatus.Active) {
            revert ProposalNotActive();
        }

        if (block.timestamp < startTime) {
            revert VotingNotStarted();
        }

        if (block.timestamp > endTime) {
            revert VotingEnded();
        }

        if (hasVoted) {
            revert AlreadyVoted();
        }

        if (votingPower == 0) {
            revert InsufficientVotingPower();
        }
    }

    /**
     * @dev Calculates proposal outcome
     */
    function calculateProposalOutcome(
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 quorum,
        uint256 totalSupply,
        bool isEmergency,
        uint256 emergencyQuorum
    ) internal pure returns (IGovernance.ProposalStatus) {
        uint256 totalVotes = forVotes + againstVotes + abstainVotes;
        uint256 requiredQuorum = isEmergency ? emergencyQuorum : quorum;

        // Check if quorum is met
        if (totalVotes * 10000 < totalSupply * requiredQuorum) {
            return IGovernance.ProposalStatus.Defeated;
        }

        // Check if majority supports
        if (forVotes > againstVotes) {
            return IGovernance.ProposalStatus.Succeeded;
        } else {
            return IGovernance.ProposalStatus.Defeated;
        }
    }

    /**
     * @dev Calculates quadratic voting power
     */
    function calculateQuadraticVotingPower(
        uint256 linearPower
    ) internal pure returns (uint256) {
        if (linearPower == 0) return 0;
        return sqrt(linearPower * 1000); // Scale to prevent too much reduction
    }

    /**
     * @dev Calculates skill-based voting power
     */
    function calculateSkillBasedVotingPower(
        uint256[] memory skillLevels,
        string[] memory categories,
        mapping(string => uint256) storage categoryWeights
    ) internal view returns (uint256) {
        uint256 totalPower = 0;

        for (uint256 i = 0; i < skillLevels.length; i++) {
            uint256 categoryWeight = categoryWeights[categories[i]];
            if (categoryWeight == 0) categoryWeight = 100; // Default weight

            uint256 levelPower = skillLevels[i] * skillLevels[i]; // Quadratic scaling
            totalPower += (levelPower * categoryWeight) / 100;
        }

        return totalPower;
    }

    /**
     * @dev Calculates delegation weight based on delegator's voting power
     */
    function calculateDelegationWeight(
        uint256 delegatorPower,
        uint256 delegateePower,
        uint256 maxDelegationRatio
    ) internal pure returns (uint256) {
        // Prevent concentration of power
        uint256 maxDelegatable = (delegateePower * maxDelegationRatio) / 100;
        return
            delegatorPower > maxDelegatable ? maxDelegatable : delegatorPower;
    }

    /**
     * @dev Validates execution conditions
     */
    function validateExecution(
        IGovernance.ProposalStatus status,
        uint256 executionTime,
        bool executed
    ) internal view {
        if (status != IGovernance.ProposalStatus.Queued) {
            revert ProposalNotSucceeded();
        }

        if (block.timestamp < executionTime) {
            revert ExecutionDelayNotMet();
        }

        if (executed) {
            revert("GovernanceLibrary: already executed");
        }
    }

    /**
     * @dev Calculates time-weighted voting power decay
     */
    function calculateTimeWeightedPower(
        uint256 basePower,
        uint256 lastActivityTime,
        uint256 decayPeriod
    ) internal view returns (uint256) {
        if (block.timestamp <= lastActivityTime + decayPeriod) {
            return basePower;
        }

        uint256 timeElapsed = block.timestamp - lastActivityTime;
        uint256 decayFactor = timeElapsed / decayPeriod;

        // Maximum decay of 50%
        if (decayFactor >= 2) {
            return basePower / 2;
        }

        return basePower - (basePower * decayFactor) / 4;
    }

    /**
     * @dev Calculates proposal execution cost
     */
    function calculateExecutionCost(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) internal view returns (uint256) {
        uint256 totalCost = 0;

        for (uint256 i = 0; i < targets.length; i++) {
            totalCost += values[i];

            // Estimate gas cost for call (simplified)
            uint256 gasCost = (calldatas[i].length * 16 + 21000) * tx.gasprice;
            totalCost += gasCost;
        }

        return totalCost;
    }

    /**
     * @dev Formats proposal for display
     */
    function formatProposalId(
        uint256 proposalId
    ) internal pure returns (string memory) {
        return string(abi.encodePacked("PROP-", uint2str(proposalId)));
    }

    /**
     * @dev Gets proposal phase based on timestamps
     */
    function getProposalPhase(
        uint256 startTime,
        uint256 endTime,
        uint256 executionTime
    ) internal view returns (string memory) {
        if (block.timestamp < startTime) {
            return "Pending";
        } else if (block.timestamp <= endTime) {
            return "Voting";
        } else if (executionTime > 0 && block.timestamp < executionTime) {
            return "Queued";
        } else if (executionTime > 0 && block.timestamp >= executionTime) {
            return "Executable";
        } else {
            return "Closed";
        }
    }

    /**
     * @dev Calculates voting participation rate
     */
    function calculateParticipationRate(
        uint256 totalVotes,
        uint256 totalEligiblePower
    ) internal pure returns (uint256) {
        if (totalEligiblePower == 0) return 0;
        return (totalVotes * 10000) / totalEligiblePower; // Return in basis points
    }

    /**
     * @dev Square root function for quadratic calculations
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    /**
     * @dev Convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
