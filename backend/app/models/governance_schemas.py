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
    title: str = Field(..., description="Proposal title")
    description: str = Field(..., description="Proposal description")
    targets: List[str] = Field(..., description="Target contract addresses")
    values: List[int] = Field(..., description="Values to send with calls")
    calldatas: List[str] = Field(..., description="Encoded function calls")
    ipfs_hash: str = Field(..., description="IPFS hash for proposal metadata")

class ContractCreateEmergencyProposalRequest(BaseModel):
    """Request model for creating emergency proposal - matches Governance.createEmergencyProposal() exactly."""
    title: str = Field(..., description="Emergency proposal title")
    description: str = Field(..., description="Emergency proposal description")
    targets: List[str] = Field(..., description="Target contract addresses")
    values: List[int] = Field(..., description="Values to send with calls")
    calldatas: List[str] = Field(..., description="Encoded function calls")
    ipfs_hash: str = Field(..., description="IPFS hash for proposal metadata")
    justification: str = Field(..., description="Emergency justification")

class ContractCastVoteRequest(BaseModel):
    """Request model for casting vote - matches Governance.castVote() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")
    vote: int = Field(..., description="Vote type (0=against, 1=for, 2=abstain)")
    reason: str = Field("", description="Vote reason")

class ContractCastVoteWithSignatureRequest(BaseModel):
    """Request model for casting vote with signature - matches Governance.castVoteWithSignature() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")
    vote: int = Field(..., description="Vote type")
    reason: str = Field(..., description="Vote reason")
    signature: str = Field(..., description="Vote signature")

class ContractQueueProposalRequest(BaseModel):
    """Request model for queueing proposal - matches Governance.queueProposal() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")

class ContractExecuteProposalRequest(BaseModel):
    """Request model for executing proposal - matches Governance.executeProposal() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")

class ContractCancelProposalRequest(BaseModel):
    """Request model for cancelling proposal - matches Governance.cancelProposal() exactly."""
    proposal_id: int = Field(..., description="Proposal ID")

class ContractDelegateVotesRequest(BaseModel):
    """Request model for delegating votes - matches Governance.delegate() exactly."""
    delegatee: str = Field(..., description="Delegatee address")

class ContractUndelegateVotesRequest(BaseModel):
    """Request model for undelegating votes - matches Governance.undelegate() exactly."""
    # No parameters needed for undelegate

# ============ LEGACY REQUEST MODELS (DEPRECATED) ============

class CreateProposalRequest(BaseModel):
    """Legacy request model - DEPRECATED: Use ContractCreateProposalRequest instead."""
    title: str = Field(..., min_length=1, description="Proposal title")
    description: str = Field(..., min_length=1, description="Proposal description")
    targets: List[str] = Field(..., description="Target contract addresses")
    values: List[int] = Field(..., description="Values for each target call")
    ipfs_hash: str = Field(..., description="IPFS hash for proposal metadata")
    
    @validator('targets', 'values')
    def validate_arrays_length_match(cls, v, values):
        if 'targets' in values and 'values' in values:
            targets_len = len(values.get('targets', []))
            values_len = len(values.get('values', []))
            if targets_len != values_len:
                raise ValueError('targets and values arrays must have same length')
        return v

class CreateEmergencyProposalRequest(BaseModel):
    """Legacy request model - DEPRECATED: Use ContractCreateEmergencyProposalRequest instead."""
    title: str = Field(..., min_length=1, description="Emergency proposal title")
    description: str = Field(..., min_length=1, description="Emergency proposal description")
    targets: List[str] = Field(..., description="Target contract addresses")
    values: List[int] = Field(..., description="Values for each target call")
    ipfs_hash: str = Field(..., min_length=1, description="IPFS hash for proposal metadata")
    justification: str = Field(..., min_length=1, description="Emergency justification")

class CastVoteRequest(BaseModel):
    """Legacy request model - DEPRECATED: Use ContractCastVoteRequest instead."""
    proposal_id: int = Field(..., ge=0, description="Proposal ID to vote on")
    vote: int = Field(..., ge=0, le=2, description="Vote type: 0=Against, 1=For, 2=Abstain")
    reason: str = Field("", description="Optional reason for the vote")
    
    @validator('vote')
    def validate_vote_type(cls, v):
        if v not in [0, 1, 2]:
            raise ValueError('Vote must be 0 (Against), 1 (For), or 2 (Abstain)')
        return v

class CastVoteWithSignatureRequest(BaseModel):
    """Legacy request model - DEPRECATED: Use ContractCastVoteWithSignatureRequest instead."""
    proposal_id: int = Field(..., ge=0, description="Proposal ID to vote on")
    vote: int = Field(..., ge=0, le=2, description="Vote type: 0=Against, 1=For, 2=Abstain")
    reason: str = Field(..., description="Optional reason for the vote")
    signature: str = Field(..., description="EIP-712 signature for gasless voting")
    
    @validator('vote')
    def validate_vote_type(cls, v):
        if v not in [0, 1, 2]:
            raise ValueError('Vote must be 0 (Against), 1 (For), or 2 (Abstain)')
        return v

class DelegateVotingPowerRequest(BaseModel):
    """Legacy request model - DEPRECATED: Use ContractDelegateVotesRequest instead."""
    delegatee_address: str = Field(..., description="Address to delegate voting power to")
    
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
