"""
Skills API Router

This module provides API endpoints for managing skill tokens,
including creation, updating, and retrieval.
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel

from app.models.schemas import (
    SkillTokenRequest,
    SkillTokenResponse,
    WorkEvaluationRequest,
    WorkEvaluationResponse,
    ErrorResponse
)
from app.services.skill import get_skill_service
from app.services.reputation import get_reputation_service

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

@router.post(
    "/",
    response_model=SkillTokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def create_skill_token(
    request: SkillTokenRequest
) -> Dict[str, Any]:
    """
    Create a new skill token for a user.
    
    Args:
        request: Skill token creation request
        
    Returns:
        Skill token details
    """
    try:
        skill_service = get_skill_service()
        result = skill_service.mint_skill_token(
            recipient_id=request.recipient_id,
            skill_name=request.skill_name,
            skill_category=request.skill_category,
            skill_level=request.skill_level,
            description=request.description,
            evidence_links=request.evidence_links,
            metadata=request.metadata
        )
        
        # Handle both async and sync responses for testing compatibility
        if hasattr(result, '__await__'):
            result = await result
        
        logger.info(f"Created skill token for {request.recipient_id}: {request.skill_name}")
        return result
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Error creating skill token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create skill token"
        )

@router.get(
    "/{token_id}",
    response_model=Dict[str, Any],
    responses={
        404: {"model": ErrorResponse, "description": "Token not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_skill_token(
    token_id: str = Path(..., description="Skill token ID")
) -> Dict[str, Any]:
    """
    Get details of a skill token.
    
    Args:
        token_id: Skill token ID
        
    Returns:
        Skill token details
    """
    try:
        skill_service = get_skill_service()
        result = skill_service.get_skill_token(token_id)
        
        # Handle both async and sync responses for testing compatibility
        if hasattr(result, '__await__'):
            result = await result
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill token {token_id} not found"
            )
        
        logger.info(f"Retrieved skill token {token_id}")
        return result
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error retrieving skill token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve skill token"
        )

@router.get(
    "/",
    response_model=List[Dict[str, Any]],
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def list_skill_tokens(
    owner_id: str = Query(..., description="Owner account ID")
) -> List[Dict[str, Any]]:
    """
    List all skill tokens owned by an account.
    
    Args:
        owner_id: Owner account ID
        
    Returns:
        List of skill token details
    """
    try:
        skill_service = get_skill_service()
        result = skill_service.list_skill_tokens(owner_id)
        
        # Handle both async and sync responses for testing compatibility
        if hasattr(result, '__await__'):
            result = await result
        
        logger.info(f"Listed {len(result)} skill tokens for {owner_id}")
        return result
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Error listing skill tokens: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list skill tokens"
        )

@router.put(
    "/{token_id}",
    response_model=Dict[str, Any],
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        404: {"model": ErrorResponse, "description": "Token not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def update_skill_token(
    token_id: str,
    new_level: int,
    update_reason: str,
    evidence_links: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Update the level of a skill token.
    
    Args:
        token_id: Skill token ID
        new_level: New skill level
        update_reason: Reason for the update
        evidence_links: Optional links to evidence for the update
        
    Returns:
        Updated skill token details
    """
    try:
        skill_service = get_skill_service()
        result = skill_service.update_skill_token(
            token_id=token_id,
            new_level=new_level,
            update_reason=update_reason,
            evidence_links=evidence_links
        )
        
        # Handle both async and sync responses for testing compatibility
        if hasattr(result, '__await__'):
            result = await result
        
        logger.info(f"Updated skill token {token_id} to level {new_level}")
        return result
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Error updating skill token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update skill token"
        )

@router.post(
    "/evaluate",
    response_model=WorkEvaluationResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def evaluate_work(
    request: WorkEvaluationRequest
) -> Dict[str, Any]:
    """
    Evaluate work submission and generate reputation scores.
    
    Args:
        request: Work evaluation request
        
    Returns:
        Evaluation results
    """
    try:
        reputation_service = get_reputation_service()
        result = reputation_service.evaluate_work(
            user_id=request.user_id,
            skill_token_ids=request.skill_token_ids,
            work_description=request.work_description,
            work_content=request.work_content,
            evaluation_criteria=request.evaluation_criteria
        )
        
        # Handle both async and sync responses for testing compatibility
        if hasattr(result, '__await__'):
            result = await result
        
        logger.info(f"Evaluated work for user {request.user_id}")
        return result
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Error evaluating work: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate work"
        )

@router.get(
    "/reputation/{user_id}",
    response_model=Dict[str, Any],
    responses={
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation(
    user_id: str = Path(..., description="User ID")
) -> Dict[str, Any]:
    """
    Get aggregated reputation score for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        Reputation score details
    """
    try:
        reputation_service = get_reputation_service()
        result = reputation_service.get_reputation_score(user_id)
        
        # Handle both async and sync responses for testing compatibility
        if hasattr(result, '__await__'):
            result = await result
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reputation not found for user {user_id}"
            )
        
        logger.info(f"Retrieved reputation score for user {user_id}")
        return result
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 404) directly
        raise
    except Exception as e:
        logger.error(f"Error retrieving reputation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reputation"
        )

@router.get(
    "/reputation/{user_id}/history",
    response_model=List[Dict[str, Any]],
    responses={
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_reputation_history(
    user_id: str = Path(..., description="User ID"),
    limit: int = Query(10, description="Maximum number of history items to return")
) -> List[Dict[str, Any]]:
    """
    Get reputation history for a user.
    
    Args:
        user_id: User ID
        limit: Maximum number of history items to return
        
    Returns:
        List of reputation history items
    """
    try:
        reputation_service = get_reputation_service()
        result = reputation_service.get_reputation_history(user_id, limit)
        
        # Handle both async and sync responses for testing compatibility
        if hasattr(result, '__await__'):
            result = await result
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reputation history not found for user {user_id}"
            )
        
        logger.info(f"Retrieved {len(result)} reputation history items for user {user_id}")
        return result
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 404) directly
        raise
    except Exception as e:
        logger.error(f"Error retrieving reputation history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reputation history"
        )
