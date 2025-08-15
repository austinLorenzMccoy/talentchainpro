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
    """Request model for skill token creation - matches SkillToken.sol mintSkillToken function exactly."""
    recipient_address: str = Field(..., description="Recipient's Hedera account address")
    category: str = Field(..., min_length=2, max_length=100, description="Main skill category")
    subcategory: str = Field(..., min_length=2, max_length=100, description="Specific skill subcategory")
    level: int = Field(..., ge=1, le=10, description="Initial skill level (1-10)")
    expiry_date: int = Field(0, ge=0, description="Expiry date as Unix timestamp (0 for default)")
    metadata: str = Field("", description="Additional metadata for the skill")
    uri: str = Field(..., description="URI to additional metadata (IPFS hash)")
    
    @validator('recipient_address')
    def validate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class EndorseSkillTokenRequest(BaseModel):
    """Request model for skill token endorsement - matches SkillToken.sol endorseSkillToken function exactly."""
    token_id: int = Field(..., description="Skill token ID to endorse")
    endorsement_data: str = Field(..., description="Endorsement data/message")


class EndorseSkillTokenWithSignatureRequest(BaseModel):
    """Request model for skill token endorsement with signature - matches SkillToken.sol function exactly."""
    token_id: int = Field(..., description="Skill token ID to endorse")
    endorsement_data: str = Field(..., description="Endorsement data/message")
    deadline: int = Field(..., description="Signature deadline as Unix timestamp")
    signature: str = Field(..., description="EIP712 signature bytes")


class RenewSkillTokenRequest(BaseModel):
    """Request model for skill token renewal - matches SkillToken.sol renewSkillToken function exactly."""
    token_id: int = Field(..., description="Skill token ID to renew")
    new_expiry_date: int = Field(..., description="New expiry date as Unix timestamp")


class RevokeSkillTokenRequest(BaseModel):
    """Request model for skill token revocation - matches SkillToken.sol revokeSkillToken function exactly."""
    token_id: int = Field(..., description="Skill token ID to revoke")
    reason: str = Field(..., description="Reason for revocation")


class UpdateSkillLevelRequest(BaseModel):
    """Request model for skill level update - matches SkillToken.sol updateSkillLevel function exactly."""
    token_id: int = Field(..., description="Skill token ID to update")
    new_level: int = Field(..., ge=1, le=10, description="New skill level (1-10)")
    evidence: str = Field("", description="Evidence supporting the level update")


class SkillTokenUpdateRequest(BaseModel):
    """Request model for skill token updates."""
    new_level: Optional[int] = Field(None, ge=1, le=10, description="New skill level")
    experience_points: Optional[int] = Field(None, ge=0, description="Experience points to add")
    evidence_uri: Optional[str] = Field(None, description="Evidence supporting the update")


class BatchSkillTokenRequest(BaseModel):
    """Request model for batch skill token creation - matches SkillToken.sol batchMintSkillTokens function exactly."""
    recipient_address: str = Field(..., description="Recipient's Hedera account address (address)")
    categories: List[str] = Field(..., min_items=1, description="Skill categories (string[] array)")
    subcategories: List[str] = Field(..., min_items=1, description="Skill subcategories (string[] array)")
    levels: List[int] = Field(..., min_items=1, description="Skill levels (uint8[] array)")
    expiry_dates: List[int] = Field(..., min_items=1, description="Expiry dates (uint64[] array)")
    metadata_array: List[str] = Field(..., min_items=1, description="Metadata for each skill (string[] array)")
    token_uris: List[str] = Field(..., min_items=1, description="Token URIs (string[] array)")
    
    @validator('recipient_address')
    def validate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('categories', 'subcategories', 'levels', 'expiry_dates', 'metadata_array', 'token_uris')
    def validate_arrays_same_length(cls, v, values, field):
        # Get the length of the first array to compare against
        first_array = None
        for field_name in ['categories', 'subcategories', 'levels', 'expiry_dates', 'metadata_array', 'token_uris']:
            if field_name in values:
                first_array = values[field_name]
                break
        
        if first_array is not None and len(v) != len(first_array):
            raise ValueError('All arrays must have the same length')
        return v


class UpdateSkillLevelRequest(BaseModel):
    """Request model for skill level updates - matches SkillToken.sol updateSkillLevel function exactly."""
    token_id: int = Field(..., ge=0, description="Skill token ID to update (uint256)")
    new_level: int = Field(..., ge=1, le=10, description="New skill level 1-10 (uint8)")
    evidence: str = Field(..., min_length=1, description="Evidence supporting the update (string)")


class RevokeSkillTokenRequest(BaseModel):
    """Request model for skill token revocation - matches SkillToken.sol revokeSkillToken function exactly."""
    token_id: int = Field(..., ge=0, description="Skill token ID to revoke (uint256)")
    reason: str = Field(..., min_length=1, description="Reason for revocation (string)")


class EndorseSkillTokenRequest(BaseModel):
    """Request model for skill endorsements - matches SkillToken.sol endorseSkillToken function exactly."""
    token_id: int = Field(..., ge=0, description="Skill token ID to endorse (uint256)")
    endorsement_data: str = Field(..., min_length=1, description="Endorsement data (string)")


class EndorseSkillTokenWithSignatureRequest(BaseModel):
    """Request model for gasless skill endorsements - matches SkillToken.sol endorseSkillTokenWithSignature function exactly."""
    token_id: int = Field(..., ge=0, description="Skill token ID to endorse (uint256)")
    endorsement_data: str = Field(..., min_length=1, description="Endorsement data (string)")
    deadline: int = Field(..., gt=0, description="Signature deadline timestamp (uint256)")
    signature: str = Field(..., description="EIP-712 signature for gasless endorsement (bytes)")


class RenewSkillTokenRequest(BaseModel):
    """Request model for skill token renewal - matches SkillToken.sol renewSkillToken function exactly."""
    token_id: int = Field(..., ge=0, description="Skill token ID to renew (uint256)")
    new_expiry_date: int = Field(..., gt=0, description="New expiry date timestamp (uint64)")


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
