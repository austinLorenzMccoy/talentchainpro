"""
MCP API Router

This module provides API endpoints for interacting with the MCP server
for talent matching, skill verification, and other NLP-based operations.
"""

import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.mcp import MCPService, get_mcp_service

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Request and response models
class TalentSearchRequest(BaseModel):
    """Request model for talent search."""
    skills: List[str] = Field(..., description="Required skills to search for")
    min_level: Optional[int] = Field(None, description="Minimum skill level (1-5)")
    company_id: Optional[str] = Field(None, description="Company ID for context")

class TalentProfile(BaseModel):
    """Response model for talent profile."""
    address: str = Field(..., description="Hedera account ID of the talent")
    skill: str = Field(..., description="Primary skill with level")
    reputation: int = Field(..., description="Reputation score (0-100)")
    other_skills: Optional[List[str]] = Field(None, description="Other skills")

class TalentSearchResponse(BaseModel):
    """Response model for talent search."""
    results: List[TalentProfile] = Field(..., description="List of matching talent profiles")
    count: int = Field(..., description="Number of results")

class MatchEvaluationRequest(BaseModel):
    """Request model for match evaluation."""
    job_id: str = Field(..., description="Job pool ID")
    candidate_id: str = Field(..., description="Candidate ID")
    job_requirements: Dict[str, Any] = Field(..., description="Job skill requirements")
    candidate_skills: Dict[str, Any] = Field(..., description="Candidate's verified skills")

class MatchEvaluationResponse(BaseModel):
    """Response model for match evaluation."""
    match_score: float = Field(..., description="Match score (0-100)")
    skill_gaps: Optional[List[str]] = Field(None, description="Identified skill gaps")
    strengths: Optional[List[str]] = Field(None, description="Candidate strengths")
    recommendations: List[str] = Field(..., description="Recommendations for improvement")

class NaturalLanguageQueryRequest(BaseModel):
    """Request model for natural language query."""
    query: str = Field(..., description="Natural language query")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class NaturalLanguageQueryResponse(BaseModel):
    """Response model for natural language query."""
    output: str = Field(..., description="Output text")
    data: Optional[Dict[str, Any]] = Field(None, description="Structured data response")

# API endpoints
@router.post("/search", response_model=TalentSearchResponse, status_code=status.HTTP_200_OK)
async def search_talent(
    request: TalentSearchRequest,
    mcp_service: MCPService = Depends(get_mcp_service)
):
    """
    Search for talent with specific skills using natural language processing.
    """
    logger.info(f"Talent search request for skills: {request.skills}")
    
    try:
        results = await mcp_service.search_talent_pool(
            request.skills,
            request.min_level,
            request.company_id
        )
        
        # Convert to response model
        profiles = []
        for result in results:
            profiles.append(TalentProfile(
                address=result.get("address", ""),
                skill=result.get("skill", ""),
                reputation=result.get("reputation", 0),
                other_skills=result.get("other_skills")
            ))
        
        return TalentSearchResponse(
            results=profiles,
            count=len(profiles)
        )
    except Exception as e:
        logger.error(f"Error in talent search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing talent search: {str(e)}"
        )

@router.post("/evaluate-match", response_model=MatchEvaluationResponse, status_code=status.HTTP_200_OK)
async def evaluate_match(
    request: MatchEvaluationRequest,
    mcp_service: MCPService = Depends(get_mcp_service)
):
    """
    Evaluate how well a candidate matches job requirements.
    """
    logger.info(f"Match evaluation request for job {request.job_id} and candidate {request.candidate_id}")
    
    try:
        result = await mcp_service.evaluate_candidate_match(
            request.job_id,
            request.candidate_id,
            request.job_requirements,
            request.candidate_skills
        )
        
        return MatchEvaluationResponse(
            match_score=result.get("match_score", 0),
            skill_gaps=result.get("skill_gaps"),
            strengths=result.get("strengths"),
            recommendations=result.get("recommendations", ["No recommendations available"])
        )
    except Exception as e:
        logger.error(f"Error in match evaluation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating match: {str(e)}"
        )

@router.post("/query", response_model=NaturalLanguageQueryResponse, status_code=status.HTTP_200_OK)
async def process_query(
    request: NaturalLanguageQueryRequest,
    mcp_service: MCPService = Depends(get_mcp_service)
):
    """
    Process a natural language query through the MCP server.
    """
    logger.info(f"Natural language query: {request.query}")
    
    if not request.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty"
        )
    
    try:
        # Use the raw MCP client for direct queries
        mcp_client = mcp_service.mcp_client
        response = await mcp_client.process_query(request.query, request.context)
        
        return NaturalLanguageQueryResponse(
            output=response.get("output", "No output available"),
            data=response.get("data")
        )
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing query: {str(e)}"
        )
