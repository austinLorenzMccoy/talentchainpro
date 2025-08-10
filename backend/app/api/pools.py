"""
Enhanced Pools API Router

This module provides comprehensive API endpoints for managing talent pools,
including creation, application, matching, and integration with reputation system.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from pydantic import BaseModel, Field, validator

from app.models.schemas import (
    JobPoolRequest,
    JobPoolResponse,
    CandidateJoinRequest,
    MatchRequest,
    MatchResponse,
    ErrorResponse
)
from app.services.pool import get_talent_pool_service
from app.services.reputation import get_reputation_service
from app.utils.hedera import validate_hedera_address

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Enhanced Request/Response Models

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
    """Response model for pool search."""
    pools: List[JobPoolDetailResponse]
    total_count: int
    filters_applied: Dict[str, Any]


# Enhanced API Endpoints

@router.post(
    "/",
    response_model=JobPoolDetailResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def create_job_pool(
    request: JobPoolCreateRequest,
    background_tasks: BackgroundTasks
) -> JobPoolDetailResponse:
    """
    Create a new job pool.
    
    Args:
        request: Job pool creation request
        background_tasks: Background task queue
        
    Returns:
        Detailed job pool information
    """
    try:
        pool_service = get_talent_pool_service()
        
        # Create job pool using enhanced service
        result = await pool_service.create_job_pool(
            title=request.title,
            description=request.description,
            required_skills=request.required_skills,
            min_reputation=request.min_reputation,
            stake_amount=request.stake_amount,
            duration_days=request.duration_days
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to create job pool")
            )
        
        pool_data = result["pool"]
        
        # Add background task for reputation update
        background_tasks.add_task(
            update_reputation_for_pool_creation,
            pool_data["creator_address"],
            request.stake_amount,
            len(request.required_skills)
        )
        
        logger.info(f"Created job pool {pool_data['pool_id']} by {pool_data['creator_address']}")
        
        return JobPoolDetailResponse(
            pool_id=pool_data["pool_id"],
            creator_address=pool_data["creator_address"],
            title=request.title,
            description=request.description,
            required_skills=request.required_skills,
            min_reputation=request.min_reputation,
            stake_amount=request.stake_amount,
            duration_days=request.duration_days,
            status=pool_data.get("status", "active"),
            applicants_count=0,
            max_applicants=request.max_applicants or 100,
            created_at=datetime.now(timezone.utc),
            application_deadline=request.application_deadline
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job pool: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job pool"
        )


@router.get(
    "/{pool_id}",
    response_model=JobPoolDetailResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Pool not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_job_pool(
    pool_id: str = Path(..., description="Job pool ID")
) -> JobPoolDetailResponse:
    """
    Get detailed information about a specific job pool.
    
    Args:
        pool_id: Job pool ID
        
    Returns:
        Detailed job pool information
    """
    try:
        pool_service = get_talent_pool_service()
        
        # Get pool details
        result = await pool_service.get_job_pool(pool_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job pool not found"
            )
        
        pool_data = result["pool"]
        
        return JobPoolDetailResponse(
            pool_id=pool_id,
            creator_address=pool_data["creator_address"],
            title=pool_data["title"],
            description=pool_data["description"],
            required_skills=pool_data["required_skills"],
            min_reputation=pool_data["min_reputation"],
            stake_amount=pool_data["stake_amount"],
            duration_days=pool_data["duration_days"],
            status=pool_data.get("status", "active"),
            applicants_count=pool_data.get("applicants_count", 0),
            max_applicants=pool_data.get("max_applicants", 100),
            created_at=datetime.fromisoformat(pool_data.get("created_at", datetime.now(timezone.utc).isoformat())),
            application_deadline=datetime.fromisoformat(pool_data["application_deadline"]) if pool_data.get("application_deadline") else None,
            matched_candidate=pool_data.get("matched_candidate"),
            match_score=pool_data.get("match_score")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job pool {pool_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve job pool"
        )


@router.post(
    "/{pool_id}/apply",
    response_model=PoolApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "Pool not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def apply_to_pool(
    pool_id: str = Path(..., description="Job pool ID"),
    request: PoolApplicationRequest = ...,
    background_tasks: BackgroundTasks = ...
) -> PoolApplicationResponse:
    """
    Apply to a job pool.
    
    Args:
        pool_id: Job pool ID
        request: Application request
        background_tasks: Background task queue
        
    Returns:
        Application confirmation
    """
    try:
        pool_service = get_talent_pool_service()
        
        # Apply to pool using enhanced service
        result = await pool_service.apply_to_pool(
            pool_id=int(pool_id),
            skill_token_ids=[int(id) for id in request.skill_token_ids],
            cover_letter=request.cover_letter or ""
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to apply to pool")
            )
        
        application_data = result["application"]
        
        # Add background task for reputation update
        background_tasks.add_task(
            update_reputation_for_pool_application,
            request.applicant_address,
            pool_id,
            len(request.skill_token_ids)
        )
        
        logger.info(f"Application submitted to pool {pool_id} by {request.applicant_address}")
        
        return PoolApplicationResponse(
            application_id=application_data["application_id"],
            pool_id=pool_id,
            applicant_address=request.applicant_address,
            status="submitted",
            applied_at=datetime.now(timezone.utc)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying to pool {pool_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply to pool"
        )


@router.get(
    "/search",
    response_model=PoolSearchResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def search_job_pools(
    skill_category: Optional[str] = Query(None, description="Filter by skill category"),
    min_stake: Optional[float] = Query(None, ge=0, description="Minimum stake amount"),
    max_stake: Optional[float] = Query(None, gt=0, description="Maximum stake amount"),
    status: Optional[str] = Query(None, description="Pool status filter"),
    creator_address: Optional[str] = Query(None, description="Creator address filter"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Results offset for pagination")
) -> PoolSearchResponse:
    """
    Search for job pools based on various criteria.
    
    Args:
        skill_category: Filter by required skill category
        min_stake: Minimum stake amount filter
        max_stake: Maximum stake amount filter
        status: Pool status filter
        creator_address: Creator address filter
        limit: Maximum results to return
        offset: Results offset for pagination
        
    Returns:
        Search results with matching pools
    """
    try:
        pool_service = get_talent_pool_service()
        
        # Build search criteria
        search_criteria = {}
        if skill_category:
            search_criteria["skill_category"] = skill_category
        if min_stake is not None:
            search_criteria["min_stake"] = min_stake
        if max_stake is not None:
            search_criteria["max_stake"] = max_stake
        if status:
            search_criteria["status"] = status
        if creator_address:
            if not validate_hedera_address(creator_address):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid creator address format"
                )
            search_criteria["creator_address"] = creator_address
        
        # Search for pools
        result = await pool_service.search_job_pools(search_criteria, limit=limit, offset=offset)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to search job pools"
            )
        
        pools_data = result["pools"]
        
        # Convert to response models
        pools = []
        for pool in pools_data:
            pools.append(JobPoolDetailResponse(
                pool_id=pool["pool_id"],
                creator_address=pool["creator_address"],
                title=pool["title"],
                description=pool["description"],
                required_skills=pool["required_skills"],
                min_reputation=pool["min_reputation"],
                stake_amount=pool["stake_amount"],
                duration_days=pool["duration_days"],
                status=pool.get("status", "active"),
                applicants_count=pool.get("applicants_count", 0),
                max_applicants=pool.get("max_applicants", 100),
                created_at=datetime.fromisoformat(pool.get("created_at", datetime.now(timezone.utc).isoformat())),
                application_deadline=datetime.fromisoformat(pool["application_deadline"]) if pool.get("application_deadline") else None,
                matched_candidate=pool.get("matched_candidate"),
                match_score=pool.get("match_score")
            ))
        
        logger.info(f"Found {len(pools)} pools matching search criteria")
        
        return PoolSearchResponse(
            pools=pools,
            total_count=result.get("total_count", len(pools)),
            filters_applied=search_criteria
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching job pools: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search job pools"
        )


# Background Task Functions

async def update_reputation_for_pool_creation(creator_address: str, stake_amount: float, skills_count: int):
    """Background task to update reputation when pool is created."""
    try:
        reputation_service = get_reputation_service()
        
        from app.services.reputation import ReputationEventType
        
        # Higher stake and more skills = more reputation impact
        impact_score = min(15.0, (stake_amount * 2.0) + (skills_count * 1.0))
        
        await reputation_service.update_reputation(
            user_address=creator_address,
            event_type=ReputationEventType.PLATFORM_CONTRIBUTION,
            impact_score=impact_score,
            context={
                "stake_amount": stake_amount,
                "skills_count": skills_count,
                "event": "pool_creation"
            }
        )
        
        logger.info(f"Updated reputation for pool creation: {creator_address}")
    
    except Exception as e:
        logger.error(f"Error updating reputation for pool creation: {str(e)}")


async def update_reputation_for_pool_application(applicant_address: str, pool_id: str, skills_count: int):
    """Background task to update reputation when applying to pool."""
    try:
        reputation_service = get_reputation_service()
        
        from app.services.reputation import ReputationEventType
        
        # Small positive impact for applying (shows engagement)
        impact_score = min(5.0, skills_count * 0.5)
        
        await reputation_service.update_reputation(
            user_address=applicant_address,
            event_type=ReputationEventType.PLATFORM_CONTRIBUTION,
            impact_score=impact_score,
            context={
                "pool_id": pool_id,
                "skills_count": skills_count,
                "event": "pool_application"
            }
        )
        
        logger.info(f"Updated reputation for pool application: {applicant_address}")
    
    except Exception as e:
        logger.error(f"Error updating reputation for pool application: {str(e)}")
