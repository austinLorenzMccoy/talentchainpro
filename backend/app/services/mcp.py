"""
MCP Service Module

This module provides service-level functions for interacting with the MCP server
and integrating it with the TalentChain Pro application.
"""

import logging
from typing import Dict, Any, List, Optional, Union
from fastapi import Depends

from app.utils.mcp_server import get_mcp_client, MCPServerClient

# Configure logging
logger = logging.getLogger(__name__)

class MCPService:
    """
    Service for MCP server operations.
    
    This class provides high-level methods for talent matching, skill verification,
    and other MCP server operations integrated with the TalentChain Pro application.
    """
    
    def __init__(self, mcp_client: MCPServerClient = Depends(get_mcp_client)):
        """Initialize the MCP Service with a client dependency."""
        self.mcp_client = mcp_client
    
    async def search_talent_pool(
        self,
        skills: List[str],
        min_level: Optional[int] = None,
        company_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for talent with specific skills in the talent pool.
        
        Args:
            skills (List[str]): Required skills
            min_level (Optional[int]): Minimum skill level
            company_id (Optional[str]): Company ID for context
            
        Returns:
            List[Dict[str, Any]]: List of matching talent profiles
        """
        logger.info(f"Searching talent pool for skills: {skills}, min_level: {min_level}")
        
        try:
            results = await self.mcp_client.find_talent_by_skills(skills, min_level)
            logger.info(f"Found {len(results)} matching talent profiles")
            return results
        except Exception as e:
            logger.error(f"Error searching talent pool: {str(e)}")
            # Return empty list instead of raising to prevent API failures
            return []
    
    async def evaluate_candidate_match(
        self,
        job_id: str,
        candidate_id: str,
        job_requirements: Dict[str, Any],
        candidate_skills: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate how well a candidate matches job requirements.
        
        Args:
            job_id (str): Job pool ID
            candidate_id (str): Candidate ID
            job_requirements (Dict[str, Any]): Job skill requirements
            candidate_skills (Dict[str, Any]): Candidate's verified skills
            
        Returns:
            Dict[str, Any]: Match evaluation with scores and recommendations
        """
        logger.info(f"Evaluating match for job {job_id} and candidate {candidate_id}")
        
        try:
            result = await self.mcp_client.evaluate_skill_match(job_requirements, candidate_skills)
            logger.info(f"Match evaluation complete with score: {result.get('match_score', 'N/A')}")
            return result
        except Exception as e:
            logger.error(f"Error evaluating candidate match: {str(e)}")
            # Return basic result instead of raising to prevent API failures
            return {
                "match_score": 0,
                "error": str(e),
                "recommendations": ["Error occurred during evaluation"]
            }
    
    async def register_new_skill_token(
        self,
        token_id: str,
        skill_type: str,
        skill_level: int,
        user_id: str
    ) -> bool:
        """
        Register a newly minted skill token in the HCS-10 registry.
        
        Args:
            token_id (str): The token ID to register
            skill_type (str): Type of skill
            skill_level (int): Skill level (1-5)
            user_id (str): User ID associated with the token
            
        Returns:
            bool: True if registration was successful
        """
        logger.info(f"Registering skill token {token_id} for user {user_id}")
        
        try:
            success = await self.mcp_client.register_skill_token(token_id, skill_type, skill_level)
            if success:
                logger.info(f"Successfully registered skill token {token_id}")
            else:
                logger.warning(f"Failed to register skill token {token_id}")
            return success
        except Exception as e:
            logger.error(f"Error registering skill token: {str(e)}")
            return False

# Singleton getter for dependency injection
def get_mcp_service(mcp_client: MCPServerClient = Depends(get_mcp_client)) -> MCPService:
    """
    Get the MCP Service instance for dependency injection.
    
    Args:
        mcp_client (MCPServerClient): The MCP client dependency
        
    Returns:
        MCPService: The MCP Service instance
    """
    return MCPService(mcp_client)
