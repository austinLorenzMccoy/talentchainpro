"""
Governance API Request/Response Models

This module defines Pydantic models for governance-related API endpoints.
Perfect 1:1 mapping with Governance.sol smart contract functions.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator, model_validator

from app.utils.hedera import validate_hedera_address
from app.services.governance import ProposalType, VoteType


# ============ CONTRACT-ALIGNED REQUEST MODELS ============

class ContractCreateProposalRequest(BaseModel):
    """Request model for creating governance proposal - matches Governance.createProposal() exactly."""
    proposer: str = Field(..., description="Proposer address")
    description: str = Field(..., description="Proposal description")
    targets: List[str] = Field(..., description="Target contract addresses")
    values: List[int] = Field(..., description="Values to send with calls")
    calldatas: List[str] = Field(..., description="Encoded function calls")
    proposal_type: int = Field(0, description="Proposal type")

class ContractCastVoteRequest(BaseModel):
    """Request model for casting vote - matches Governance.castVote() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")
    voter: str = Field(..., description="Voter address")
    support: int = Field(..., description="Vote support (0=against, 1=for, 2=abstain)")
    reason: str = Field("", description="Vote reason")

class ContractCastVoteWithSignatureRequest(BaseModel):
    """Request model for casting vote with signature - matches Governance.castVoteWithSignature() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")
    voter: str = Field(..., description="Voter address")
    support: int = Field(..., description="Vote support")
    reason: str = Field(..., description="Vote reason")
    signature: str = Field(..., description="Vote signature")

class ContractQueueProposalRequest(BaseModel):
    """Request model for queueing proposal - matches Governance.queueProposal() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")
    execution_time: int = Field(..., description="Execution time timestamp")

class ContractExecuteProposalRequest(BaseModel):
    """Request model for executing proposal - matches Governance.executeProposal() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")
    targets: List[str] = Field(..., description="Target contract addresses")
    values: List[int] = Field(..., description="Values to send with calls")
    calldatas: List[str] = Field(..., description="Encoded function calls")

class ContractCancelProposalRequest(BaseModel):
    """Request model for cancelling proposal - matches Governance.cancelProposal() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")
    cancellation_reason: str = Field(..., description="Cancellation reason")

class ContractDelegateVotesRequest(BaseModel):
    """Request model for delegating votes - matches Governance.delegate() exactly."""
    delegator: str = Field(..., description="Delegator address")
    delegatee: str = Field(..., description="Delegatee address")

class ContractUndelegateVotesRequest(BaseModel):
    """Request model for undelegating votes - matches Governance.undelegate() exactly."""
    delegator: str = Field(..., description="Delegator address")

# ============ LEGACY REQUEST MODELS ============

# ============ REQUEST MODELS ============

class CreateProposalRequest(BaseModel):
    """Request model for creating a governance proposal - matches Governance.sol createProposal function exactly."""
    title: str = Field(..., min_length=1, description="Proposal title (string)")
    description: str = Field(..., min_length=1, description="Proposal description (string)")
    targets: List[str] = Field(..., description="Target contract addresses (address[] array)")
    values: List[int] = Field(..., description="Values for each target call (uint256[] array)")
    calldatas: List[str] = Field(..., description="Encoded function calls (bytes[] array)")
    ipfs_hash: str = Field(..., description="IPFS hash for proposal metadata (string)")
    
    @validator('targets', 'values', 'calldatas')
    def validate_arrays_length_match(cls, v, values):
        if 'targets' in values and 'values' in values and 'calldatas' in values:
            targets_len = len(values.get('targets', []))
            values_len = len(values.get('values', []))
            calldatas_len = len(values.get('calldatas', []))
            if not (targets_len == values_len == calldatas_len):
                raise ValueError('targets, values, and calldatas arrays must have same length')
        return v

class CreateEmergencyProposalRequest(BaseModel):
    """Request model for creating emergency proposals - matches Governance.sol createEmergencyProposal function exactly."""
    title: str = Field(..., min_length=1, description="Emergency proposal title (string)")
    description: str = Field(..., min_length=1, description="Emergency proposal description (string)")
    targets: List[str] = Field(..., description="Target contract addresses (address[] array)")
    values: List[int] = Field(..., description="Values for each target call (uint256[] array)")
    calldatas: List[str] = Field(..., description="Encoded function calls (bytes[] array)")
    ipfs_hash: str = Field(..., description="IPFS hash for proposal metadata (string)")
    justification: str = Field(..., min_length=1, description="Emergency justification (string)")
    
    @validator('targets', 'values', 'calldatas')
    def validate_arrays_length_match(cls, v, values):
        if 'targets' in values and 'values' in values and 'calldatas' in values:
            targets_len = len(values.get('targets', []))
            values_len = len(values.get('values', []))
            calldatas_len = len(values.get('calldatas', []))
            if not (targets_len == values_len == calldatas_len):
                raise ValueError('targets, values, and calldatas arrays must have same length')
        return v


class CastVoteRequest(BaseModel):
    """Request model for casting votes - matches Governance.sol castVote function exactly."""
    proposal_id: int = Field(..., ge=0, description="Proposal ID to vote on (uint256)")
    vote: int = Field(..., ge=0, le=2, description="Vote type: 0=Against, 1=For, 2=Abstain (VoteType enum)")
    reason: str = Field("", description="Optional reason for the vote (string)")
    
    @validator('vote')
    def validate_vote_type(cls, v):
        # VoteType enum: Against = 0, For = 1, Abstain = 2
        if v not in [0, 1, 2]:
            raise ValueError('Vote must be 0 (Against), 1 (For), or 2 (Abstain)')
        return v


class CastVoteWithSignatureRequest(BaseModel):
    """Request model for gasless voting - matches Governance.sol castVoteWithSignature function exactly."""
    proposal_id: int = Field(..., ge=0, description="Proposal ID to vote on (uint256)")
    vote: int = Field(..., ge=0, le=2, description="Vote type: 0=Against, 1=For, 2=Abstain (VoteType enum)")
    reason: str = Field("", description="Optional reason for the vote (string)")
    signature: str = Field(..., description="EIP-712 signature for gasless voting (bytes)")
    
    @validator('vote')
    def validate_vote_type(cls, v):
        if v not in [0, 1, 2]:
            raise ValueError('Vote must be 0 (Against), 1 (For), or 2 (Abstain)')
        return v


class DelegateVotingPowerRequest(BaseModel):
    """Request model for delegating voting power - matches Governance.sol delegate function exactly."""
    delegatee_address: str = Field(..., description="Address to delegate voting power to (address)")
    
    @validator('delegatee_address')
    def validate_delegatee_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class GovernanceSettingsUpdateRequest(BaseModel):
    """Request model for updating governance settings - matches Governance.sol GovernanceSettings struct exactly."""
    voting_delay: int = Field(..., ge=0, description="Delay before voting starts (uint256)")
    voting_period: int = Field(..., gt=0, description="Duration of voting period (uint256)")
    proposal_threshold: int = Field(..., ge=0, description="Min voting power to create proposal (uint256)")
    quorum: int = Field(..., gt=0, description="Min participation for valid vote (uint256)")
    execution_delay: int = Field(..., ge=0, description="Delay before execution (uint256)")
    emergency_quorum: int = Field(..., gt=0, description="Quorum for emergency proposals (uint256)")
    emergency_voting_period: int = Field(..., gt=0, description="Voting period for emergency proposals (uint256)")


# Remove duplicate classes and keep only contract-aligned ones
class CastVoteRequest(BaseModel):
    """Request model for casting votes - matches Governance.sol castVote function exactly."""
    proposal_id: int = Field(..., ge=0, description="Proposal ID to vote on (uint256)")
    vote: int = Field(..., ge=0, le=2, description="Vote type: 0=Against, 1=For, 2=Abstain (VoteType enum)")
    reason: str = Field("", description="Optional reason for the vote (string)")
    
    @validator('vote')
    def validate_vote_type(cls, v):
        # VoteType enum: Against = 0, For = 1, Abstain = 2
        if v not in [0, 1, 2]:
            raise ValueError('Vote must be 0 (Against), 1 (For), or 2 (Abstain)')
        return v


class DelegateVotingPowerRequest(BaseModel):
    """Request model for delegating voting power - matches Governance.sol delegate function exactly."""
    delegatee_address: str = Field(..., description="Address to delegate voting power to (address)")
    
    @validator('delegatee_address')
    def validate_delegatee_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


# ============ RESPONSE MODELS ============

class ProposalResponse(BaseModel):
    """Response model for proposal data."""
    proposal_id: str
    proposer_address: str
    title: str
    description: str
    proposal_type: str
    status: str
    start_time: str
    end_time: str
    for_votes: int
    against_votes: int
    abstain_votes: int
    total_votes: int
    created_at: str
    current_status: str
    targets: List[str]
    values: List[int]
    calldatas: List[str]
    ipfs_hash: Optional[str]
    is_emergency: bool


class VoteResponse(BaseModel):
    """Response model for vote data."""
    vote_id: str
    proposal_id: str
    voter_address: str
    vote_type: str
    voting_power: int
    reason: Optional[str]
    cast_at: datetime


class VotingPowerResponse(BaseModel):
    """Response model for voting power information."""
    address: str
    voting_power: int
    delegated_power: int
    self_power: int
    delegated_to: Optional[str]
    delegates_count: int
    updated_at: datetime


class GovernanceStatsResponse(BaseModel):
    """Response model for governance statistics."""
    total_proposals: int
    active_proposals: int
    total_votes_cast: int
    unique_voters: int
    total_voting_power: int
    participation_rate: float
    average_proposal_duration: float
