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
    """Enhanced request model for job pool creation."""
    title: str = Field(..., min_length=5, max_length=200, description="Job title")
    description: str = Field(..., min_length=20, max_length=2000, description="Job description")
    required_skills: List[Dict[str, Any]] = Field(..., min_items=1, description="Required skills with levels")
    min_reputation: int = Field(0, ge=0, le=100, description="Minimum reputation required")
    stake_amount: float = Field(..., gt=0, description="Stake amount in HBAR")
    duration_days: int = Field(..., ge=1, le=365, description="Pool duration in days")
    max_applicants: Optional[int] = Field(100, ge=1, le=1000, description="Maximum number of applicants")
    application_deadline: Optional[datetime] = Field(None, description="Application deadline")
    
    @validator('required_skills')
    def validate_skills(cls, v):
        for skill in v:
            if not all(key in skill for key in ['name', 'level']):
                raise ValueError('Each skill must have name and level')
            if not isinstance(skill['level'], int) or not 1 <= skill['level'] <= 10:
                raise ValueError('Skill level must be between 1 and 10')
        return v


class PoolApplicationRequest(BaseModel):
    """Request model for pool applications."""
    pool_id: str = Field(..., description="Pool ID to apply to")
    applicant_address: str = Field(..., description="Applicant's Hedera address")
    skill_token_ids: List[str] = Field(..., min_items=1, description="Skill token IDs to submit")
    cover_letter: Optional[str] = Field(None, max_length=1000, description="Cover letter")
    proposed_rate: Optional[float] = Field(None, gt=0, description="Proposed hourly rate in HBAR")
    
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
