"""
Pools API Router

This module provides API endpoints for managing talent pools,
including creation, joining, and matching.
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel

from app.models.schemas import (
    JobPoolRequest,
    JobPoolResponse,
    CandidateJoinRequest,
    MatchRequest,
    MatchResponse,
    ErrorResponse
)

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Mock data for pools (in a real implementation, this would use a service)
mock_pools = {}
mock_pool_counter = 1000

@router.post(
    "/",
    response_model=JobPoolResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def create_job_pool(
    request: JobPoolRequest
) -> Dict[str, Any]:
    """
    Create a new job pool.
    
    Args:
        request: Job pool creation request
        
    Returns:
        Job pool details
    """
    try:
        global mock_pool_counter
        pool_id = f"0.0.{mock_pool_counter}"
        mock_pool_counter += 1
        
        # In a real implementation, this would create a pool on-chain
        # For now, we'll use mock data
        from datetime import datetime, timedelta, UTC
        
        pool = {
            "pool_id": pool_id,
            "company_id": request.company_id,
            "job_title": request.job_title,
            "job_description": request.job_description,
            "required_skills": request.required_skills,
            "stake_amount": request.stake_amount,
            "transaction_id": f"0.0.{mock_pool_counter + 1000}",
            "expiry_date": (datetime.now(UTC) + timedelta(days=request.duration_days)).isoformat(),
            "status": "active",
            "candidates": []
        }
        
        mock_pools[pool_id] = pool
        
        logger.info(f"Created job pool {pool_id} for company {request.company_id}")
        return pool
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Error creating job pool: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job pool"
        )

@router.get(
    "/{pool_id}",
    response_model=JobPoolResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Pool not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_job_pool(
    pool_id: str = Path(..., description="Job pool ID")
) -> Dict[str, Any]:
    """
    Get details of a job pool.
    
    Args:
        pool_id: Job pool ID
        
    Returns:
        Job pool details
    """
    try:
        # In a real implementation, this would get pool details from the chain
        # For now, we'll use mock data
        pool = mock_pools.get(pool_id)
        
        if not pool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job pool {pool_id} not found"
            )
        
        logger.info(f"Retrieved job pool {pool_id}")
        return pool
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error retrieving job pool: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve job pool"
        )

@router.get(
    "/",
    response_model=List[JobPoolResponse],
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def list_job_pools(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skill: Optional[str] = Query(None, description="Filter by required skill")
) -> List[Dict[str, Any]]:
    """
    List job pools with optional filters.
    
    Args:
        company_id: Optional filter by company ID
        status: Optional filter by status
        skill: Optional filter by required skill
        
    Returns:
        List of job pool details
    """
    try:
        # In a real implementation, this would query pools from the chain
        # For now, we'll use mock data
        pools = list(mock_pools.values())
        
        # Apply filters
        if company_id:
            pools = [p for p in pools if p["company_id"] == company_id]
        
        if status:
            pools = [p for p in pools if p["status"] == status]
        
        if skill:
            pools = [p for p in pools if any(s["name"].lower() == skill.lower() for s in p["required_skills"])]
        
        logger.info(f"Listed {len(pools)} job pools")
        return pools
    
    except Exception as e:
        logger.error(f"Error listing job pools: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list job pools"
        )

@router.post(
    "/{pool_id}/join",
    response_model=Dict[str, Any],
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "Pool not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def join_pool(
    pool_id: str,
    request: CandidateJoinRequest
) -> Dict[str, Any]:
    # Use the pool_id from the URL path, ignoring any pool_id in the request body
    """
    Join a job pool as a candidate.
    
    Args:
        pool_id: Job pool ID
        request: Candidate join request
        
    Returns:
        Join operation details
    """
    try:
        # In a real implementation, this would join a pool on-chain
        # For now, we'll use mock data
        pool = mock_pools.get(pool_id)
        
        if not pool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job pool {pool_id} not found"
            )
        
        if pool["status"] != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job pool {pool_id} is not active"
            )
        
        # Check if candidate already joined
        if any(c["candidate_id"] == request.candidate_id for c in pool["candidates"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Candidate {request.candidate_id} already joined pool {pool_id}"
            )
        
        # Add candidate to pool
        candidate = {
            "candidate_id": request.candidate_id,
            "skill_token_ids": request.skill_token_ids,
            "stake_amount": request.stake_amount,
            "joined_at": "2025-07-17T10:00:00Z"  # In a real implementation, use current time
        }
        
        pool["candidates"].append(candidate)
        
        logger.info(f"Candidate {request.candidate_id} joined pool {pool_id}")
        return {
            "pool_id": pool_id,
            "candidate_id": request.candidate_id,
            "status": "joined",
            "transaction_id": f"0.0.{mock_pool_counter + 2000}"
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error joining pool: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join pool"
        )

@router.post(
    "/{pool_id}/leave",
    response_model=Dict[str, Any],
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "Pool or candidate not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def leave_pool(
    pool_id: str,
    candidate_id: str
) -> Dict[str, Any]:
    """
    Leave a job pool as a candidate.
    
    Args:
        pool_id: Job pool ID
        candidate_id: Candidate ID
        
    Returns:
        Leave operation details
    """
    try:
        # In a real implementation, this would leave a pool on-chain
        # For now, we'll use mock data
        pool = mock_pools.get(pool_id)
        
        if not pool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job pool {pool_id} not found"
            )
        
        # Find and remove candidate
        candidate_index = None
        for i, c in enumerate(pool["candidates"]):
            if c["candidate_id"] == candidate_id:
                candidate_index = i
                break
        
        if candidate_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate {candidate_id} not found in pool {pool_id}"
            )
        
        pool["candidates"].pop(candidate_index)
        
        logger.info(f"Candidate {candidate_id} left pool {pool_id}")
        return {
            "pool_id": pool_id,
            "candidate_id": candidate_id,
            "status": "left",
            "transaction_id": f"0.0.{mock_pool_counter + 3000}"
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error leaving pool: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave pool"
        )

@router.post(
    "/{pool_id}/match",
    response_model=MatchResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "Pool or candidate not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def make_match(
    pool_id: str,
    request: MatchRequest
) -> Dict[str, Any]:
    # Use the pool_id from the URL path, ignoring any pool_id in the request body
    """
    Make a match between a company and a candidate.
    
    Args:
        pool_id: Job pool ID
        request: Match request
        
    Returns:
        Match details
    """
    try:
        # In a real implementation, this would make a match on-chain
        # For now, we'll use mock data
        pool = mock_pools.get(pool_id)
        
        if not pool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job pool {pool_id} not found"
            )
        
        if pool["company_id"] != request.company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company {request.company_id} is not the owner of pool {pool_id}"
            )
        
        # Check if candidate is in the pool
        if not any(c["candidate_id"] == request.candidate_id for c in pool["candidates"]):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate {request.candidate_id} not found in pool {pool_id}"
            )
        
        # Update pool status
        pool["status"] = "matched"
        
        # Create match response
        match_id = f"match_{pool_id}_{request.candidate_id}"
        match_response = {
            "match_id": match_id,
            "pool_id": pool_id,
            "company_id": request.company_id,
            "candidate_id": request.candidate_id,
            "transaction_id": f"0.0.{mock_pool_counter + 4000}",
            "timestamp": "2025-07-17T10:00:00Z",  # In a real implementation, use current time
            "status": "matched"
        }
        
        logger.info(f"Match made in pool {pool_id} between company {request.company_id} and candidate {request.candidate_id}")
        return match_response
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error making match: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to make match"
        )

@router.get(
    "/{pool_id}/candidates",
    response_model=List[Dict[str, Any]],
    responses={
        404: {"model": ErrorResponse, "description": "Pool not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_pool_candidates(
    pool_id: str = Path(..., description="Job pool ID")
) -> List[Dict[str, Any]]:
    """
    Get candidates in a job pool.
    
    Args:
        pool_id: Job pool ID
        
    Returns:
        List of candidates in the pool
    """
    try:
        # In a real implementation, this would get candidates from the chain
        # For now, we'll use mock data
        pool = mock_pools.get(pool_id)
        
        if not pool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job pool {pool_id} not found"
            )
        
        logger.info(f"Retrieved {len(pool['candidates'])} candidates for pool {pool_id}")
        return pool["candidates"]
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error retrieving pool candidates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve pool candidates"
        )
