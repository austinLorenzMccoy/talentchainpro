"""
Reputation API Request/Response Models

This module defines Pydantic models for reputation-related API endpoints.
Perfect 1:1 mapping with ReputationOracle.sol smart contract functions.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator

from app.utils.hedera import validate_hedera_address


# ============ CONTRACT-ALIGNED REQUEST MODELS ============

class ContractRegisterOracleRequest(BaseModel):
    """Request model for registering oracle - matches ReputationOracle.registerOracle() exactly."""
    oracle_address: str = Field(..., description="Oracle address")
    name: str = Field(..., description="Oracle name")
    specializations: List[str] = Field(..., description="Oracle specializations")
    stake_amount: int = Field(..., description="Stake amount")

class ContractSubmitEvaluationRequest(BaseModel):
    """Request model for submitting evaluation - matches ReputationOracle.submitEvaluation() exactly."""
    oracle_address: str = Field(..., description="Oracle address")
    user_address: str = Field(..., description="User address")
    work_id: int = Field(..., description="Work ID")
    score: int = Field(..., description="Evaluation score")
    ipfs_hash: str = Field(..., description="IPFS hash")
    evaluation_type: int = Field(0, description="Evaluation type")

class ContractUpdateReputationScoreRequest(BaseModel):
    """Request model for updating reputation score - matches ReputationOracle.updateReputationScore() exactly."""
    user_address: str = Field(..., description="User address")
    new_score: int = Field(..., description="New reputation score")
    skill_categories: List[int] = Field(..., description="Skill categories")
    evaluation_id: int = Field(..., description="Evaluation ID")

class ContractChallengeEvaluationRequest(BaseModel):
    """Request model for challenging evaluation - matches ReputationOracle.challengeEvaluation() exactly."""
    evaluation_id: int = Field(..., description="Evaluation ID")
    challenger: str = Field(..., description="Challenger address")
    challenge_reason: str = Field(..., description="Challenge reason")
    stake_amount: int = Field(..., description="Stake amount")

class ContractResolveChallengeRequest(BaseModel):
    """Request model for resolving challenge - matches ReputationOracle.resolveChallenge() exactly."""
    challenge_id: int = Field(..., description="Challenge ID")
    resolution: bool = Field(..., description="Challenge resolution")
    resolution_reason: str = Field(..., description="Resolution reason")

class ContractUpdateOracleStatusRequest(BaseModel):
    """Request model for updating oracle status - matches ReputationOracle.updateOracleStatus() exactly."""
    oracle_address: str = Field(..., description="Oracle address")
    is_active: bool = Field(..., description="Is oracle active")
    reason: str = Field("", description="Status change reason")

class ContractSlashOracleRequest(BaseModel):
    """Request model for slashing oracle - matches ReputationOracle.slashOracle() exactly."""
    oracle_address: str = Field(..., description="Oracle address")
    slash_amount: int = Field(..., description="Slash amount")
    slash_reason: str = Field(..., description="Slash reason")

class ContractWithdrawOracleStakeRequest(BaseModel):
    """Request model for withdrawing oracle stake - matches ReputationOracle.withdrawOracleStake() exactly."""
    oracle_address: str = Field(..., description="Oracle address")
    withdrawal_amount: int = Field(..., description="Withdrawal amount")

# ============ LEGACY REQUEST MODELS ============

class RegisterOracleRequest(BaseModel):
    """Request model for oracle registration - matches ReputationOracle.sol registerOracle function exactly."""
    name: str = Field(..., min_length=1, description="Oracle name (string)")
    specializations: List[str] = Field(..., min_items=1, description="Oracle specializations (string[] array)")
    stake_amount: int = Field(..., gt=0, description="Stake amount in tinybar (for msg.value)")
    oracle_address: str = Field(..., description="Oracle's Hedera account address")
    
    @validator('oracle_address')
    def validate_oracle_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class SubmitWorkEvaluationRequest(BaseModel):
    """Request model for work evaluation - matches ReputationOracle.sol submitWorkEvaluation function exactly."""
    user_address: str = Field(..., description="User being evaluated (address)")
    skill_token_ids: List[int] = Field(..., min_items=1, description="Skill token IDs (uint256[] array)")
    work_description: str = Field(..., min_length=1, description="Work description (string)")
    work_content: str = Field(..., min_length=1, description="Work content (string)")
    overall_score: int = Field(..., ge=0, le=10000, description="Overall score 0-10000 (uint256)")
    skill_scores: List[int] = Field(..., min_items=1, description="Individual skill scores (uint256[] array)")
    feedback: str = Field(..., description="Evaluation feedback (string)")
    ipfs_hash: str = Field(..., min_length=1, description="IPFS hash for evaluation data (string)")
    oracle_address: str = Field(..., description="Oracle submitting the evaluation")
    
    @validator('user_address', 'oracle_address')
    def validate_addresses(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('skill_scores')
    def validate_skill_scores_length(cls, v, values):
        if 'skill_token_ids' in values and len(v) != len(values['skill_token_ids']):
            raise ValueError('skill_scores array must have same length as skill_token_ids array')
        for score in v:
            if not 0 <= score <= 10000:
                raise ValueError('Each skill score must be between 0 and 10000')
        return v


class UpdateReputationScoreRequest(BaseModel):
    """Request model for reputation updates - matches ReputationOracle.sol updateReputationScore function exactly."""
    user_address: str = Field(..., description="User address to update (address)")
    category: str = Field(..., min_length=1, description="Skill category (string)")
    new_score: int = Field(..., ge=0, le=10000, description="New reputation score 0-10000 (uint256)")
    evidence: str = Field(..., min_length=1, description="Evidence supporting the update (string)")
    oracle_address: str = Field(..., description="Oracle updating the reputation")
    
    @validator('user_address', 'oracle_address')
    def validate_addresses(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class ChallengeEvaluationRequest(BaseModel):
    """Request model for challenging evaluations - matches ReputationOracle.sol challengeEvaluation function exactly."""
    evaluation_id: int = Field(..., ge=0, description="Evaluation ID to challenge (uint256)")
    reason: str = Field(..., min_length=1, description="Challenge reason (string)")
    stake_amount: int = Field(..., gt=0, description="Challenge stake in tinybar (for msg.value)")
    challenger_address: str = Field(..., description="Address challenging the evaluation")
    
    @validator('challenger_address')
    def validate_challenger_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


class ResolveChallengeRequest(BaseModel):
    """Request model for resolving challenges - matches ReputationOracle.sol resolveChallenge function exactly."""
    challenge_id: int = Field(..., ge=0, description="Challenge ID to resolve (uint256)")
    uphold_original: bool = Field(..., description="Whether to uphold original evaluation (bool)")
    resolution: str = Field(..., min_length=1, description="Resolution explanation (string)")
    resolver_address: str = Field(..., description="Challenge resolver address")
    
    @validator('resolver_address')
    def validate_resolver_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v


# ============ RESPONSE MODELS ============

class OracleInfoResponse(BaseModel):
    """Response model for oracle information - matches ReputationOracle.sol OracleInfo struct."""
    oracle_address: str
    name: str
    specializations: List[str]
    evaluations_completed: int
    average_score: int
    registered_at: int  # uint64 timestamp
    is_active: bool
    stake: int  # stake amount in tinybar


class WorkEvaluationResponse(BaseModel):
    """Response model for work evaluations - matches ReputationOracle.sol WorkEvaluation data."""
    evaluation_id: int
    user_address: str
    skill_token_ids: List[int]
    work_description: str
    work_content: str
    overall_score: int
    feedback: str
    evaluated_by: str  # oracle address
    timestamp: int  # uint64 timestamp
    ipfs_hash: str


class ReputationScoreResponse(BaseModel):
    """Response model for reputation scores - matches ReputationOracle.sol getReputationScore return values."""
    user_address: str
    overall_score: int  # 0-10000 scale
    total_evaluations: int
    last_updated: int  # uint64 timestamp
    is_active: bool


class CategoryScoreResponse(BaseModel):
    """Response model for category-specific reputation scores."""
    user_address: str
    category: str
    score: int  # 0-10000 scale


class ChallengeResponse(BaseModel):
    """Response model for evaluation challenges - matches ReputationOracle.sol Challenge struct."""
    challenge_id: int
    evaluation_id: int
    challenger_address: str
    reason: str
    stake: int  # stake amount in tinybar
    created_at: int  # uint64 timestamp
    resolution_deadline: int  # uint64 timestamp
    is_resolved: bool
    uphold_original: bool
    resolution: str
    resolver_address: str


class OraclePerformanceResponse(BaseModel):
    """Response model for oracle performance metrics."""
    oracle_address: str
    evaluations_completed: int
    successful_challenges: int
    failed_challenges: int
    last_activity: int  # timestamp
    accuracy_rate: float  # calculated field
