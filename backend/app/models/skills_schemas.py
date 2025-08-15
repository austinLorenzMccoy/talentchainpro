"""
Skills API Request/Response Models

This module defines Pydantic models for skills-related API endpoints.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator

from app.utils.hedera import validate_hedera_address


# ============ REQUEST MODELS ============

class SkillTokenCreateRequest(BaseModel):
    """Request model for skill token creation - matches SkillToken.sol mintSkillToken function."""
    recipient_address: str = Field(..., description="Recipient's Hedera account address")
    category: str = Field(..., min_length=2, max_length=100, description="Skill category")
    level: int = Field(..., ge=1, le=10, description="Initial skill level (1-10)")
    uri: str = Field(..., description="URI to additional metadata (IPFS hash)")
    
    @validator('recipient_address')
    def validate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class SkillTokenUpdateRequest(BaseModel):
    """Request model for skill token updates."""
    new_level: Optional[int] = Field(None, ge=1, le=10, description="New skill level")
    experience_points: Optional[int] = Field(None, ge=0, description="Experience points to add")
    evidence_uri: Optional[str] = Field(None, description="Evidence supporting the update")


class BatchSkillTokenRequest(BaseModel):
    """Request model for batch skill token creation."""
    recipient_address: str = Field(..., description="Recipient's Hedera account address")
    skills: List[Dict[str, Any]] = Field(..., min_items=1, max_items=50, description="List of skills to create")
    
    @validator('recipient_address')
    def validate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class SkillSearchRequest(BaseModel):
    """Request model for skill search."""
    skill_name: Optional[str] = Field(None, description="Skill name to search")
    skill_category: Optional[str] = Field(None, description="Skill category filter")
    min_level: Optional[int] = Field(None, ge=1, le=10, description="Minimum skill level")
    max_level: Optional[int] = Field(None, ge=1, le=10, description="Maximum skill level")
    owner_address: Optional[str] = Field(None, description="Owner address filter")


class WorkEvaluationRequest(BaseModel):
    """Request model for work evaluation."""
    user_id: str = Field(..., description="User ID")
    skill_token_ids: List[str] = Field(..., description="List of skill token IDs to evaluate")
    work_description: str = Field(..., description="Description of the work")
    work_content: str = Field(..., description="Content or artifacts of the work")
    evaluation_criteria: Optional[str] = Field(None, description="Custom evaluation criteria")


# ============ RESPONSE MODELS ============

class SkillTokenDetailResponse(BaseModel):
    """Detailed response model for skill tokens."""
    token_id: str
    owner_address: str
    skill_name: str
    skill_category: str
    level: int
    experience_points: int
    description: Optional[str]
    metadata_uri: Optional[str]
    is_active: bool
    created_at: datetime
    last_updated: datetime
    reputation_impact: Optional[Dict[str, Any]] = None


class BatchOperationResponse(BaseModel):
    """Response model for batch operations."""
    success: bool
    total_requested: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]
    errors: List[str]


class WorkEvaluationResponse(BaseModel):
    """Response model for work evaluation."""
    evaluation_id: str
    user_id: str
    skill_token_ids: List[str]
    overall_score: int
    skill_scores: Dict[str, int]
    feedback: str
    evaluated_at: datetime
    evaluator: str
