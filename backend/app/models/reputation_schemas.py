"""
Reputation API Request/Response Models

This module defines Pydantic models for reputation-related API endpoints.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator

from app.utils.hedera import validate_hedera_address


# ============ REQUEST MODELS ============

class RegisterOracleRequest(BaseModel):
    """Request model for oracle registration."""
    oracle_address: str = Field(..., description="Oracle's Hedera account address")
    name: str = Field(..., min_length=3, max_length=100, description="Oracle display name")
    specializations: List[str] = Field(..., min_items=1, description="List of specialization categories")
    stake_amount: float = Field(100.0, ge=1.0, description="Stake amount for oracle registration")
    
    @validator('oracle_address')
    def validate_oracle_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class WorkEvaluationRequest(BaseModel):
    """Request model for work evaluation submission."""
    oracle_address: str = Field(..., description="Oracle submitting the evaluation")
    user_address: str = Field(..., description="User being evaluated")
    skill_token_ids: List[str] = Field(..., min_items=1, description="Skill tokens being evaluated")
    work_description: str = Field(..., min_length=10, description="Description of the work")
    artifacts: List[str] = Field(default_factory=list, description="Work artifacts (URLs, IPFS hashes)")
    overall_score: int = Field(..., ge=0, le=100, description="Overall evaluation score")
    skill_scores: Dict[str, int] = Field(..., description="Individual skill scores")
    feedback: str = Field("", description="Detailed feedback")
    ipfs_hash: Optional[str] = Field(None, description="IPFS hash for additional data")
    
    @validator('oracle_address', 'user_address')
    def validate_addresses(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class ChallengeEvaluationRequest(BaseModel):
    """Request model for challenging an evaluation."""
    challenger_address: str = Field(..., description="Address challenging the evaluation")
    evaluation_id: str = Field(..., description="ID of evaluation being challenged")
    reason: str = Field(..., min_length=20, description="Reason for the challenge")
    evidence: List[str] = Field(..., min_items=1, description="Supporting evidence")
    stake_amount: float = Field(10.0, ge=1.0, description="Stake required for challenge")
    
    @validator('challenger_address')
    def validate_challenger_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class UpdateReputationRequest(BaseModel):
    """Request model for reputation updates."""
    user_address: str = Field(..., description="User's address")
    event_type: str = Field(..., description="Type of reputation event")
    impact_score: float = Field(..., ge=-100, le=100, description="Impact score")
    context: Dict[str, Any] = Field(..., description="Event context")
    validator_address: Optional[str] = Field(None, description="Validator address")
    blockchain_evidence: Optional[str] = Field(None, description="Blockchain evidence")
    
    @validator('user_address')
    def validate_user_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('validator_address')
    def validate_validator_address(cls, v):
        if v and not validate_hedera_address(v):
            raise ValueError('Invalid validator address format')
        return v


# ============ RESPONSE MODELS ============

class OracleResponse(BaseModel):
    """Response model for oracle information."""
    oracle_address: str
    name: str
    specializations: List[str]
    stake_amount: float
    reputation_score: float
    evaluations_count: int
    accuracy_rate: float
    is_active: bool
    registered_at: datetime


class EvaluationResponse(BaseModel):
    """Response model for work evaluation."""
    evaluation_id: str
    oracle_address: str
    user_address: str
    skill_token_ids: List[str]
    work_description: str
    artifacts: List[str]
    overall_score: int
    skill_scores: Dict[str, int]
    feedback: str
    ipfs_hash: Optional[str]
    status: str
    submitted_at: datetime
    consensus_reached: bool


class ChallengeResponse(BaseModel):
    """Response model for evaluation challenges."""
    challenge_id: str
    challenger_address: str
    evaluation_id: str
    reason: str
    evidence: List[str]
    stake_amount: float
    status: str
    submitted_at: datetime
    resolved_at: Optional[datetime]
    resolution: Optional[str]


class ReputationResponse(BaseModel):
    """Response model for user reputation."""
    user_address: str
    overall_score: float
    category_scores: Dict[str, float]
    skill_scores: Dict[str, float]
    total_evaluations: int
    successful_evaluations: int
    last_evaluation_date: Optional[datetime]
    reputation_history: List[Dict[str, Any]]
