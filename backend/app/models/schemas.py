"""
Pydantic Models for API Schemas

This module defines the Pydantic models used for request and response validation
in the TalentChain Pro API.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from enum import Enum


class SkillLevel(Enum):
    """Enum for skill levels."""
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4
    MASTER = 5


class SkillCategory(str, Enum):
    """Enum for skill categories."""
    BLOCKCHAIN = "blockchain"
    FRONTEND = "frontend"
    BACKEND = "backend"
    DEVOPS = "devops"
    DESIGN = "design"
    PRODUCT = "product"
    DATA_SCIENCE = "data_science"
    AI = "ai"
    MANAGEMENT = "management"
    OTHER = "other"


class SkillTokenRequest(BaseModel):
    """Request model for creating a skill token."""
    recipient_id: str = Field(..., description="Hedera account ID of the recipient")
    skill_name: str = Field(..., description="Name of the skill")
    skill_category: SkillCategory = Field(..., description="Category of the skill")
    skill_level: SkillLevel = Field(..., description="Initial skill level")
    description: str = Field(..., description="Description of the skill")
    evidence_links: Optional[List[str]] = Field(None, description="Links to evidence of the skill")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "recipient_id": "0.0.12345",
                "skill_name": "React.js",
                "skill_category": "frontend",
                "skill_level": 3,
                "description": "Advanced React.js development with hooks and context API",
                "evidence_links": ["https://github.com/user/react-project"],
                "metadata": {"years_experience": 3}
            }
        }
    )


class SkillTokenResponse(BaseModel):
    """Response model for skill token operations."""
    token_id: str = Field(..., description="Hedera token ID")
    recipient_id: str = Field(..., description="Hedera account ID of the recipient")
    skill_name: str = Field(..., description="Name of the skill")
    skill_category: str = Field(..., description="Category of the skill")
    skill_level: int = Field(..., description="Skill level")
    transaction_id: str = Field(..., description="Transaction ID")
    timestamp: datetime = Field(..., description="Timestamp of the operation")


class WorkEvaluationRequest(BaseModel):
    """Request model for work evaluation."""
    user_id: str = Field(..., description="User ID")
    skill_token_ids: List[str] = Field(..., description="List of skill token IDs to evaluate")
    work_description: str = Field(..., description="Description of the work")
    work_content: str = Field(..., description="Content or artifacts of the work")
    evaluation_criteria: Optional[str] = Field(None, description="Custom evaluation criteria")

    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "user_id": "0.0.12345",
                "skill_token_ids": ["0.0.67890", "0.0.67891"],
                "work_description": "Frontend implementation of a DeFi dashboard",
                "work_content": "https://github.com/user/defi-dashboard",
                "evaluation_criteria": "Code quality, UI/UX, performance"
            }
        }
    )


class SkillEvaluationResult(BaseModel):
    """Model for skill evaluation results."""
    score: float = Field(..., description="Numerical score between 0-100")
    reasoning: str = Field(..., description="Reasoning behind the score")
    strengths: List[str] = Field(..., description="List of identified strengths")
    weaknesses: List[str] = Field(..., description="List of identified weaknesses")

    @field_validator('score')
    @classmethod
    def validate_score(cls, v):
        """Validate that score is between 0 and 100."""
        if not 0 <= v <= 100:
            raise ValueError('Score must be between 0 and 100')
        return v


class WorkEvaluationResponse(BaseModel):
    """Response model for work evaluation."""
    evaluation_id: str = Field(..., description="Unique evaluation ID")
    user_id: str = Field(..., description="User ID")
    overall_score: float = Field(..., description="Overall numerical score between 0-100")
    skill_scores: Dict[str, SkillEvaluationResult] = Field(
        ..., description="Individual skill evaluations"
    )
    recommendation: str = Field(..., description="AI recommendation for skill improvement")
    level_changes: Dict[str, int] = Field(
        ..., description="Recommended level changes for each skill token"
    )
    timestamp: datetime = Field(..., description="Timestamp of the evaluation")

    @field_validator('overall_score')
    @classmethod
    def validate_overall_score(cls, v):
        """Validate that overall score is between 0 and 100."""
        if not 0 <= v <= 100:
            raise ValueError('Overall score must be between 0 and 100')
        return v


class JobPoolRequest(BaseModel):
    """Request model for creating a job pool."""
    company_id: str = Field(..., description="Hedera account ID of the company")
    job_title: str = Field(..., description="Title of the job")
    job_description: str = Field(..., description="Description of the job")
    required_skills: List[Dict[str, Any]] = Field(
        ..., description="List of required skills with categories and minimum levels"
    )
    stake_amount: float = Field(..., description="Amount to stake in HBAR")
    duration_days: Optional[int] = Field(30, description="Duration of the pool in days")

    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "company_id": "0.0.12345",
                "job_title": "Senior Blockchain Developer",
                "job_description": "Develop smart contracts for DeFi platform",
                "required_skills": [
                    {"category": "blockchain", "name": "Solidity", "min_level": 4},
                    {"category": "blockchain", "name": "Hedera", "min_level": 3}
                ],
                "stake_amount": 100.0,
                "duration_days": 30
            }
        }
    )


class JobPoolResponse(BaseModel):
    """Response model for job pool operations."""
    pool_id: str = Field(..., description="Unique pool ID")
    company_id: str = Field(..., description="Hedera account ID of the company")
    job_title: str = Field(..., description="Title of the job")
    job_description: str = Field(..., description="Description of the job")
    required_skills: List[Dict[str, Any]] = Field(
        ..., description="List of required skills"
    )
    stake_amount: float = Field(..., description="Amount staked in HBAR")
    transaction_id: str = Field(..., description="Transaction ID")
    expiry_date: datetime = Field(..., description="Expiry date of the pool")
    status: str = Field(..., description="Status of the pool")


class CandidateJoinRequest(BaseModel):
    """Request model for a candidate joining a pool."""
    candidate_id: str = Field(..., description="Hedera account ID of the candidate")
    pool_id: Optional[str] = Field(None, description="Pool ID to join (optional, can be provided in URL path)")
    skill_token_ids: List[str] = Field(..., description="List of skill token IDs to stake")
    stake_amount: Optional[float] = Field(0.0, description="Optional amount to stake in HBAR")

    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "candidate_id": "0.0.67890",
                "pool_id": "0.0.12345",
                "skill_token_ids": ["0.0.67891", "0.0.67892"],
                "stake_amount": 10.0
            }
        }
    )


class MatchRequest(BaseModel):
    """Request model for making a match."""
    company_id: str = Field(..., description="Hedera account ID of the company")
    pool_id: Optional[str] = Field(None, description="Pool ID (optional, can be provided in URL path)")
    candidate_id: str = Field(..., description="Hedera account ID of the candidate")

    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "company_id": "0.0.12345",
                "pool_id": "0.0.12346",
                "candidate_id": "0.0.67890"
            }
        }
    )


class MatchResponse(BaseModel):
    """Response model for match operations."""
    match_id: str = Field(..., description="Unique match ID")
    pool_id: str = Field(..., description="Pool ID")
    company_id: str = Field(..., description="Hedera account ID of the company")
    candidate_id: str = Field(..., description="Hedera account ID of the candidate")
    transaction_id: str = Field(..., description="Transaction ID")
    timestamp: datetime = Field(..., description="Timestamp of the match")
    status: str = Field(..., description="Status of the match")


class ErrorResponse(BaseModel):
    """Response model for errors."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(..., description="Timestamp of the error")
