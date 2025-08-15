"""
Pools API Request/Response Models

This module defines Pydantic models for pools-related API endpoints.
Perfect 1:1 mapping with TalentPool.sol smart contract functions.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator

from app.utils.hedera import validate_hedera_address


# ============ CONTRACT-ALIGNED REQUEST MODELS ============

class CreatePoolRequest(BaseModel):
    """Request model for creating talent pool - matches TalentPool.createPool() exactly."""
    title: str = Field(..., description="Pool title")
    description: str = Field(..., description="Pool description") 
    job_type: str = Field(..., description="Job type string")
    required_skills: List[str] = Field(..., description="Required skills array")
    minimum_levels: List[int] = Field(..., description="Minimum skill levels array")
    salary_min: int = Field(..., description="Minimum salary")
    salary_max: int = Field(..., description="Maximum salary")
    deadline: int = Field(..., description="Application deadline timestamp")
    location: str = Field(..., description="Job location")
    is_remote: bool = Field(..., description="Remote work allowed")
    stake_amount: int = Field(0, description="Stake amount")

class SubmitApplicationRequest(BaseModel):
    """Request model for submitting application - matches TalentPool.submitApplication() exactly."""
    pool_id: int = Field(..., description="Pool ID")
    applicant: str = Field(..., description="Applicant address")
    expected_salary: int = Field(..., description="Expected salary")
    availability_date: int = Field(..., description="Availability date timestamp")
    cover_letter: str = Field(..., description="Cover letter")
    stake_amount: int = Field(0, description="Stake amount")

class SelectCandidateRequest(BaseModel):
    """Request model for selecting candidate - matches TalentPool.selectCandidate() exactly."""
    pool_id: int = Field(..., description="Pool ID")
    selected_candidate: str = Field(..., description="Selected candidate address")
    selection_reason: str = Field(..., description="Selection reason")

class CompletePoolRequest(BaseModel):
    """Request model for completing pool - matches TalentPool.completePool() exactly."""
    pool_id: int = Field(..., description="Pool ID")
    completion_notes: str = Field("", description="Completion notes")
    final_rating: int = Field(0, description="Final rating")

class ClosePoolRequest(BaseModel):
    """Request model for closing pool - matches TalentPool.closePool() exactly."""
    pool_id: int = Field(..., description="Pool ID")
    closure_reason: str = Field(..., description="Closure reason")

class WithdrawApplicationRequest(BaseModel):
    """Request model for withdrawing application - matches TalentPool.withdrawApplication() exactly."""
    pool_id: int = Field(..., description="Pool ID")
    applicant: str = Field(..., description="Applicant address")
    withdrawal_reason: str = Field("", description="Withdrawal reason")

# ============ LEGACY REQUEST MODELS ============

class JobPoolCreateRequest(BaseModel):
    """Legacy request model for job pool creation."""
    title: str = Field(..., min_length=1, max_length=200, description="Job title")
    description: str = Field(..., min_length=1, max_length=2000, description="Job description")
    job_type: int = Field(..., ge=0, le=3, description="Job type enum: 0=FullTime, 1=PartTime, 2=Contract, 3=Freelance")
    required_skills: List[str] = Field(..., min_items=1, description="Required skill categories (string array)")
    minimum_levels: List[int] = Field(..., min_items=1, description="Minimum levels for each skill (uint8 array)")
    salary_min: int = Field(..., ge=0, description="Minimum salary in smallest currency unit")
    salary_max: int = Field(..., ge=0, description="Maximum salary in smallest currency unit")
    deadline: int = Field(..., gt=0, description="Application deadline as Unix timestamp (uint64)")
    location: str = Field(..., description="Job location")
    is_remote: bool = Field(False, description="Whether job allows remote work")
    stake_amount: int = Field(..., gt=0, description="Stake amount in tinybar (for msg.value)")
    
    @validator('minimum_levels')
    def validate_levels_match_skills(cls, v, values):
        if 'required_skills' in values and len(v) != len(values['required_skills']):
            raise ValueError('minimum_levels array must have same length as required_skills array')
        for level in v:
            if not 1 <= level <= 10:
                raise ValueError('Each minimum level must be between 1 and 10')
        return v
    
    @validator('salary_max')
    def validate_salary_range(cls, v, values):
        if 'salary_min' in values and v < values['salary_min']:
            raise ValueError('salary_max must be greater than or equal to salary_min')
        return v


class PoolApplicationRequest(BaseModel):
    """Legacy request model for pool applications."""
    pool_id: int = Field(..., ge=0, description="Pool ID to apply to (uint256)")
    skill_token_ids: List[int] = Field(..., min_items=1, description="Skill token IDs to submit (uint256[] array)")
    cover_letter: str = Field(..., min_length=1, max_length=1000, description="Cover letter (string)")
    portfolio: str = Field("", description="Portfolio URL or description (string)")
    stake_amount: int = Field(..., gt=0, description="Application stake amount in tinybar (for msg.value)")
    # Note: applicant address is derived from msg.sender in the contract, not a parameter


class SelectCandidateRequest(BaseModel):
    """Request model for selecting candidates - matches TalentPool.sol selectCandidate function exactly."""
    pool_id: int = Field(..., ge=0, description="Pool ID to select candidate for (uint256)")
    candidate_address: str = Field(..., description="Selected candidate address (address)")
    
    @validator('candidate_address')
    def validate_candidate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class CompletePoolRequest(BaseModel):
    """Request model for completing pools - matches TalentPool.sol completePool function exactly."""
    pool_id: int = Field(..., ge=0, description="Pool ID to complete (uint256)")
    # Note: company address is derived from msg.sender in the contract, not a parameter


class ClosePoolRequest(BaseModel):
    """Request model for closing pools - matches TalentPool.sol closePool function exactly."""
    pool_id: int = Field(..., ge=0, description="Pool ID to close (uint256)")
    # Note: company address is derived from msg.sender in the contract, not a parameter


class WithdrawApplicationRequest(BaseModel):
    """Request model for withdrawing applications - matches TalentPool.sol withdrawApplication function exactly."""
    pool_id: int = Field(..., ge=0, description="Pool ID to withdraw from (uint256)")
    # Note: applicant address is derived from msg.sender in the contract, not a parameter


class PoolMatchRequest(BaseModel):
    """Request model for creating pool matches."""
    pool_id: str = Field(..., description="Pool ID")
    candidate_address: str = Field(..., description="Selected candidate address")
    match_score: int = Field(..., ge=0, le=100, description="AI-calculated match score")
    selection_criteria: Optional[str] = Field(None, description="Selection criteria used")
    
    @validator('candidate_address')
    def validate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class PoolSearchRequest(BaseModel):
    """Request model for pool search."""
    title: Optional[str] = Field(None, description="Job title to search")
    skills: Optional[List[str]] = Field(None, description="Required skills filter")
    min_reputation: Optional[int] = Field(None, ge=0, le=100, description="Minimum reputation filter")
    location: Optional[str] = Field(None, description="Location filter")
    is_remote: Optional[bool] = Field(None, description="Remote work filter")
    min_stake: Optional[float] = Field(None, gt=0, description="Minimum stake amount")
    max_stake: Optional[float] = Field(None, gt=0, description="Maximum stake amount")


# ============ RESPONSE MODELS ============

class JobPoolDetailResponse(BaseModel):
    """Detailed response model for job pools."""
    pool_id: str
    creator_address: str
    title: str
    description: str
    required_skills: List[Dict[str, Any]]
    min_reputation: int
    stake_amount: float
    duration_days: int
    status: str
    applicants_count: int
    max_applicants: int
    created_at: datetime
    application_deadline: Optional[datetime]
    matched_candidate: Optional[str] = None
    match_score: Optional[int] = None


class PoolApplicationResponse(BaseModel):
    """Response model for pool applications."""
    application_id: str
    pool_id: str
    applicant_address: str
    status: str
    applied_at: datetime
    match_score: Optional[float] = None


class PoolSearchResponse(BaseModel):
    """Response model for pool search results."""
    pools: List[JobPoolDetailResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
