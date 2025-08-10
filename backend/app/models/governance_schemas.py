"""
Governance API Request/Response Models

This module defines Pydantic models for governance-related API endpoints.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator, model_validator

from app.utils.hedera import validate_hedera_address
from app.services.governance import ProposalType, VoteType


# ============ REQUEST MODELS ============

# ============ REQUEST MODELS ============

class CreateProposalRequest(BaseModel):
    """Request model for creating a governance proposal."""
    proposer_address: str
    title: str = Field(..., min_length=10, max_length=200, description="Title of the proposal")
    description: str = Field(..., min_length=50, max_length=2000, description="Description of the proposal")
    proposal_type: str
    targets: Optional[List[str]] = Field(default_factory=list, description="Target addresses for proposal execution")
    values: Optional[List[int]] = Field(default_factory=list, description="Values for each target")
    calldatas: Optional[List[str]] = Field(default_factory=list, description="Calldata for each target")
    ipfs_hash: Optional[str] = Field(None, description="IPFS hash for additional proposal data")
    voting_delay_hours: Optional[int] = Field(None, ge=0, le=168, description="Hours to wait before voting starts")
    voting_period_days: Optional[int] = Field(None, ge=1, le=30, description="Days voting will be open")
    is_emergency: Optional[bool] = Field(False, description="Whether this is an emergency proposal")

    @validator('proposer_address')
    def validate_proposer_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError("Invalid Hedera address format")
        return v
    
    @validator('proposal_type')
    def validate_proposal_type(cls, v):
        valid_types = ['parameter_change', 'feature_update', 'treasury_allocation', 
                      'emergency_action', 'oracle_management', 'skill_validation_rules', 
                      'reputation_parameters', 'pool_management']
        if v not in valid_types:
            raise ValueError(f"Invalid proposal type. Must be one of: {valid_types}")
        return v


class CastVoteRequest(BaseModel):
    """Request model for casting a vote on a proposal."""
    voter_address: str
    proposal_id: str
    vote_type: Optional[str] = None  # New field name
    support: Optional[str] = None    # Legacy field name  
    reason: Optional[str] = Field(None, max_length=500, description="Reason for the vote")
    voting_power: Optional[int] = Field(None, ge=0, description="Voting power to use")

    @validator('voter_address')
    def validate_voter_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError("Invalid Hedera address format")
        return v
    
    @validator('vote_type')
    def validate_vote_type(cls, v):
        if v and v not in ['for', 'against', 'abstain']:
            raise ValueError("Vote type must be 'for', 'against', or 'abstain'")
        return v

    def __init__(self, **data):
        # Convert legacy field name to new field name
        if 'support' in data and 'vote_type' not in data:
            data['vote_type'] = data['support']
        super().__init__(**data)


class DelegateRequest(BaseModel):
    """Request model for delegating voting power."""
    delegator_address: str
    delegatee_address: Optional[str] = None  # New field name
    delegate_address: Optional[str] = None   # Legacy field name
    amount: Optional[int] = Field(None, ge=0, description="Amount of voting power to delegate")

    @validator('delegator_address', 'delegatee_address')
    def validate_addresses(cls, v):
        if v and not validate_hedera_address(v):
            raise ValueError("Invalid Hedera address format")
        return v

    def __init__(self, **data):
        # Convert legacy field name to new field name
        if 'delegate_address' in data and 'delegatee_address' not in data:
            data['delegatee_address'] = data['delegate_address']
        super().__init__(**data)


class GovernanceSettingsUpdateRequest(BaseModel):
    """Request model for updating governance settings."""
    min_proposal_stake: Optional[int] = Field(None, ge=0, description="Minimum stake required to create a proposal")
    voting_period_days: Optional[int] = Field(None, ge=1, le=30, description="Days voting will be open")
    execution_delay_hours: Optional[int] = Field(None, ge=0, le=168, description="Hours to wait before execution")
    quorum_threshold: Optional[float] = Field(None, ge=0.0, le=100.0, description="Quorum threshold percentage")
    voting_delay_hours: Optional[int] = Field(None, ge=0, le=168, description="Hours to wait before voting starts")
    proposal_threshold: Optional[int] = Field(None, ge=0, description="Minimum voting power to create proposals")


class CastVoteRequest(BaseModel):
    """Request model for casting a vote."""
    voter_address: str = Field(..., description="Voter's Hedera account address")
    vote_type: str = Field(..., description="Type of vote (for, against, abstain)")
    reason: Optional[str] = Field("", description="Optional reason for the vote")
    signature: Optional[str] = Field(None, description="Optional signature for gasless voting")
    
    @validator('voter_address')
    def validate_voter_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('vote_type')
    def validate_vote_type(cls, v):
        valid_votes = [vt.value for vt in VoteType]
        if v not in valid_votes:
            raise ValueError(f'Invalid vote type. Must be one of: {valid_votes}')
        return v


class DelegateRequest(BaseModel):
    """Request model for delegating voting power."""
    delegator_address: str = Field(..., description="Delegator's Hedera account address")
    delegatee_address: str = Field(..., description="Delegatee's Hedera account address")
    
    @validator('delegator_address', 'delegatee_address')
    def validate_addresses(cls, v):
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
