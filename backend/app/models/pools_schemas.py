"""
Pools API Request/Response Models

This module defines Pydantic models for pools-related API endpoints.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator

from app.utils.hedera import validate_hedera_address


# ============ REQUEST MODELS ============

class JobPoolCreateRequest(BaseModel):
    """Request model for job pool creation - matches TalentPool.sol createPool function."""
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
    """Request model for pool applications - matches TalentPool.sol submitApplication function."""
    pool_id: int = Field(..., ge=0, description="Pool ID to apply to")
    skill_token_ids: List[int] = Field(..., min_items=1, description="Skill token IDs to submit (uint256 array)")
    cover_letter: str = Field(..., min_length=1, max_length=1000, description="Cover letter")
    portfolio: str = Field("", description="Portfolio URL or description")
    stake_amount: int = Field(..., gt=0, description="Application stake amount in tinybar (for msg.value)")
    applicant_address: str = Field(..., description="Applicant's Hedera address")
    
    @validator('applicant_address')
    def validate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


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
