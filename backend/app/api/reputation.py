"""
Reputation API Router

This module provides comprehensive API endpoints for managing reputation scores,
peer validation, governance participation, and reputation analytics.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from pydantic import BaseModel, Field, validator

from app.services.reputation import get_reputation_service, ReputationEventType, ReputationCategory
from app.utils.hedera import validate_hedera_address
from app.models.schemas import ErrorResponse

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Request/Response Models

class ReputationScoreRequest(BaseModel):
    """Request model for reputation score calculation."""
    user_address: str = Field(..., description="User's Hedera account address")
    category: Optional[str] = Field(None, description="Specific reputation category")
    
    @validator('user_address')
    def validate_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('category')
    def validate_category(cls, v):
        if v and v not in [cat.value for cat in ReputationCategory]:
            raise ValueError(f'Invalid category. Must be one of: {[cat.value for cat in ReputationCategory]}')
        return v


class ReputationUpdateRequest(BaseModel):
    """Request model for reputation updates."""
    user_address: str = Field(..., description="User's Hedera account address")
    event_type: str = Field(..., description="Type of reputation event")
    impact_score: float = Field(..., ge=-100, le=100, description="Impact score (-100 to +100)")
    context: Dict[str, Any] = Field(..., description="Event context and metadata")
    validator_address: Optional[str] = Field(None, description="Validator's address")
    blockchain_evidence: Optional[str] = Field(None, description="Blockchain transaction ID")
    
    @validator('user_address', 'validator_address')
    def validate_addresses(cls, v):
        if v and not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('event_type')
    def validate_event_type(cls, v):
        if v not in [event.value for event in ReputationEventType]:
            raise ValueError(f'Invalid event type. Must be one of: {[event.value for event in ReputationEventType]}')
        return v


class WorkEvaluationRequest(BaseModel):
    """Request model for work evaluation."""
    user_id: str = Field(..., description="User ID")
    skill_token_ids: List[str] = Field(..., description="Skill token IDs")
    work_description: str = Field(..., min_length=10, description="Work description")
    work_content: str = Field(..., min_length=50, description="Work content or artifacts")
    evaluation_criteria: Optional[str] = Field(None, description="Custom evaluation criteria")


class ReputationHistoryRequest(BaseModel):
    """Request model for reputation history."""
    user_id: str = Field(..., description="User ID")
    limit: int = Field(10, ge=1, le=100, description="Maximum number of history items")


class ReputationScoreResponse(BaseModel):
    """Response model for reputation scores."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ReputationUpdateResponse(BaseModel):
    """Response model for reputation updates."""
    success: bool
    transaction_id: Optional[str] = None
    updated_scores: Optional[Dict[str, float]] = None
    message: str


class WorkEvaluationResponse(BaseModel):
    """Response model for work evaluation."""
    evaluation_id: str
    user_id: str
    overall_score: float
    skill_scores: Dict[str, Any]
    recommendation: str
    level_changes: Dict[str, int]
    timestamp: datetime


class ReputationHistoryResponse(BaseModel):
    """Response model for reputation history."""
    user_id: str
    history: List[Dict[str, Any]]
    total_count: int


# API Endpoints

@router.get(
    "/score/{user_address}",
    response_model=ReputationScoreResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation_score(
    user_address: str = Path(..., description="User's Hedera account address"),
    category: Optional[str] = Query(None, description="Specific reputation category")
) -> ReputationScoreResponse:
    """
    Get comprehensive reputation score for a user.
    
    Args:
        user_address: User's Hedera account address
        category: Optional specific category to calculate
        
    Returns:
        Reputation score details and breakdown
    """
    try:
        if not validate_hedera_address(user_address):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Hedera address format"
            )
        
        reputation_service = get_reputation_service()
        
        # Convert category string to enum if provided
        category_enum = None
        if category:
            try:
                category_enum = ReputationCategory(category)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid category. Must be one of: {[cat.value for cat in ReputationCategory]}"
                )
        
        # Calculate reputation score
        score_data = await reputation_service.calculate_reputation_score(
            user_address=user_address,
            category=category_enum
        )
        
        logger.info(f"Retrieved reputation score for {user_address}")
        
        return ReputationScoreResponse(
            success=True,
            data=score_data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting reputation score: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reputation score"
        )


@router.post(
    "/update",
    response_model=ReputationUpdateResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def update_reputation(
    request: ReputationUpdateRequest,
    background_tasks: BackgroundTasks
) -> ReputationUpdateResponse:
    """
    Update user reputation based on an event.
    
    Args:
        request: Reputation update request
        background_tasks: Background task queue
        
    Returns:
        Update result with transaction ID and new scores
    """
    try:
        reputation_service = get_reputation_service()
        
        # Convert event type string to enum
        event_type = ReputationEventType(request.event_type)
        
        # Update reputation
        result = await reputation_service.update_reputation(
            user_address=request.user_address,
            event_type=event_type,
            impact_score=request.impact_score,
            context=request.context,
            validator_address=request.validator_address,
            blockchain_evidence=request.blockchain_evidence
        )
        
        logger.info(f"Updated reputation for {request.user_address}: {request.event_type}")
        
        return ReputationUpdateResponse(
            success=result["success"],
            transaction_id=result.get("transaction_id"),
            updated_scores=result.get("updated_scores"),
            message=f"Reputation updated successfully with impact {request.impact_score}"
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating reputation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update reputation"
        )


@router.post(
    "/evaluate-work",
    response_model=WorkEvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def evaluate_work(
    request: WorkEvaluationRequest,
    background_tasks: BackgroundTasks
) -> WorkEvaluationResponse:
    """
    Evaluate work submission and update reputation.
    
    Args:
        request: Work evaluation request
        background_tasks: Background task queue
        
    Returns:
        Evaluation results with scores and recommendations
    """
    try:
        reputation_service = get_reputation_service()
        
        # Evaluate work using AI oracle
        evaluation_result = await reputation_service.evaluate_work(
            user_id=request.user_id,
            skill_token_ids=request.skill_token_ids,
            work_description=request.work_description,
            work_content=request.work_content,
            evaluation_criteria=request.evaluation_criteria
        )
        
        logger.info(f"Evaluated work for {request.user_id}: score {evaluation_result['overall_score']}")
        
        return WorkEvaluationResponse(**evaluation_result)
    
    except Exception as e:
        logger.error(f"Error evaluating work: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate work"
        )


@router.get(
    "/history/{user_id}",
    response_model=ReputationHistoryResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation_history(
    user_id: str = Path(..., description="User ID"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of history items")
) -> ReputationHistoryResponse:
    """
    Get reputation history for a user.
    
    Args:
        user_id: User ID
        limit: Maximum number of history items to return
        
    Returns:
        Reputation history with evaluation details
    """
    try:
        reputation_service = get_reputation_service()
        
        # Get reputation history
        history = await reputation_service.get_reputation_history(
            user_id=user_id,
            limit=limit
        )
        
        logger.info(f"Retrieved {len(history)} reputation history items for {user_id}")
        
        return ReputationHistoryResponse(
            user_id=user_id,
            history=history,
            total_count=len(history)
        )
    
    except Exception as e:
        logger.error(f"Error getting reputation history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reputation history"
        )


@router.get(
    "/leaderboard",
    response_model=Dict[str, Any],
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation_leaderboard(
    category: Optional[str] = Query(None, description="Filter by reputation category"),
    limit: int = Query(50, ge=1, le=100, description="Number of top users to return"),
    min_score: float = Query(0, ge=0, le=100, description="Minimum reputation score")
) -> Dict[str, Any]:
    """
    Get reputation leaderboard.
    
    Args:
        category: Optional category filter
        limit: Number of top users to return
        min_score: Minimum reputation score threshold
        
    Returns:
        Leaderboard with top users by reputation
    """
    try:
        # This would typically query the database for top users
        # For now, return a mock leaderboard structure
        
        leaderboard = {
            "category": category or "overall",
            "limit": limit,
            "min_score": min_score,
            "users": [
                {
                    "rank": i + 1,
                    "user_address": f"0.0.{100000 + i}",
                    "score": 95.0 - (i * 2.5),
                    "category_scores": {
                        "technical_skill": 90.0 - (i * 2),
                        "collaboration": 85.0 - (i * 1.5),
                        "reliability": 92.0 - (i * 2.2)
                    }
                }
                for i in range(min(limit, 20))
            ],
            "total_eligible_users": min(limit, 20),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Generated reputation leaderboard with {len(leaderboard['users'])} users")
        
        return leaderboard
    
    except Exception as e:
        logger.error(f"Error generating leaderboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate leaderboard"
        )


@router.get(
    "/analytics/{user_address}",
    response_model=Dict[str, Any],
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation_analytics(
    user_address: str = Path(..., description="User's Hedera account address"),
    time_period: str = Query("30d", description="Time period (7d, 30d, 90d, 1y)")
) -> Dict[str, Any]:
    """
    Get detailed reputation analytics for a user.
    
    Args:
        user_address: User's Hedera account address
        time_period: Time period for analytics
        
    Returns:
        Detailed analytics including trends, breakdowns, and predictions
    """
    try:
        if not validate_hedera_address(user_address):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Hedera address format"
            )
        
        reputation_service = get_reputation_service()
        
        # Get current reputation score for analytics base
        current_score = await reputation_service.calculate_reputation_score(user_address)
        
        # Generate analytics (in production, this would query historical data)
        analytics = {
            "user_address": user_address,
            "time_period": time_period,
            "current_score": current_score,
            "trends": {
                "overall_trend": "increasing",
                "category_trends": {
                    "technical_skill": {"direction": "increasing", "change": 5.2},
                    "collaboration": {"direction": "stable", "change": 0.8},
                    "reliability": {"direction": "increasing", "change": 3.1}
                }
            },
            "activity_summary": {
                "total_events": 45,
                "positive_events": 38,
                "negative_events": 7,
                "peer_validations": 12
            },
            "predictions": {
                "projected_score_30d": current_score.get("overall_score", 50) + 2.5,
                "confidence": 0.85,
                "recommendations": [
                    "Continue maintaining high work quality",
                    "Seek more peer validations",
                    "Participate in governance activities"
                ]
            },
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Generated reputation analytics for {user_address}")
        
        return analytics
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate reputation analytics"
        )


@router.get(
    "/categories",
    response_model=Dict[str, Any],
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation_categories() -> Dict[str, Any]:
    """
    Get available reputation categories and their descriptions.
    
    Returns:
        List of reputation categories with descriptions and weights
    """
    try:
        categories = {
            "categories": [
                {
                    "id": cat.value,
                    "name": cat.value.replace("_", " ").title(),
                    "description": f"Reputation score for {cat.value.replace('_', ' ')} performance",
                    "weight": 0.25 if cat == ReputationCategory.TECHNICAL_SKILL else 0.15
                }
                for cat in ReputationCategory
            ],
            "total_categories": len(ReputationCategory),
            "max_score": 100.0,
            "default_score": 50.0
        }
        
        return categories
    
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reputation categories"
        )


@router.get(
    "/event-types",
    response_model=Dict[str, Any],
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation_event_types() -> Dict[str, Any]:
    """
    Get available reputation event types and their impact ranges.
    
    Returns:
        List of event types with descriptions and impact ranges
    """
    try:
        event_types = {
            "event_types": [
                {
                    "id": event.value,
                    "name": event.value.replace("_", " ").title(),
                    "description": f"Reputation event for {event.value.replace('_', ' ')}",
                    "impact_range": {"min": -25, "max": 25},
                    "affected_categories": ["technical_skill", "reliability"]  # This would be dynamic
                }
                for event in ReputationEventType
            ],
            "total_event_types": len(ReputationEventType),
            "impact_scale": {"min": -100, "max": 100}
        }
        
        return event_types
    
    except Exception as e:
        logger.error(f"Error getting event types: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve event types"
        )
