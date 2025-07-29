"""
MCP Server Integration Module

This module provides integration with Hedera's MCP (Message Communication Protocol) server
for natural language processing and agent-based interactions with the Hedera network.
"""

import os
import json
import logging
import asyncio
import aiohttp
from typing import Dict, Any, List, Optional, Union
from dotenv import load_dotenv

from app.utils.hedera import get_client, submit_hcs_message

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class MCPServerClient:
    """
    Client for interacting with the Hedera MCP Server.
    
    This class provides methods to send natural language queries to the MCP server
    and process responses for talent matching and skill verification.
    """
    
    def __init__(self):
        """Initialize the MCP Server client with configuration from environment variables."""
        self.mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:3000")
        self.auth_token = os.getenv("MCP_AUTH_TOKEN")
        
        if not self.auth_token:
            logger.warning("MCP_AUTH_TOKEN not set. Authentication may fail.")
        
        self.headers = {
            "Content-Type": "application/json",
            "X-MCP-AUTH-TOKEN": self.auth_token or ""
        }
        
        # Topic IDs for HCS-10 communication
        self.registry_topic_id = os.getenv("HCS_REGISTRY_TOPIC")
        self.reputation_topic_id = os.getenv("HCS_REPUTATION_TOPIC")
        
        logger.info(f"MCP Server client initialized with URL: {self.mcp_url}")
    
    async def process_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a natural language query through the MCP server.
        
        Args:
            query (str): The natural language query to process
            context (Optional[Dict[str, Any]]): Additional context for the query
            
        Returns:
            Dict[str, Any]: The processed response from the MCP server
            
        Raises:
            Exception: If the request fails or times out
        """
        if not query:
            raise ValueError("Query cannot be empty")
        
        payload = {
            "message": query,
            "context": context or {}
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.mcp_url}/process",
                    headers=self.headers,
                    json=payload,
                    timeout=30  # 30 second timeout
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"MCP server error: {response.status} - {error_text}")
                        raise Exception(f"MCP server returned status {response.status}: {error_text}")
                    
                    return await response.json()
        except asyncio.TimeoutError:
            logger.error("MCP server request timed out")
            raise Exception("MCP server request timed out after 30 seconds")
        except Exception as e:
            logger.error(f"Error processing MCP query: {str(e)}")
            raise
    
    async def find_talent_by_skills(self, skills: List[str], experience_level: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Find talent with specific skills using natural language processing.
        
        Args:
            skills (List[str]): List of required skills
            experience_level (Optional[int]): Minimum experience level (1-5)
            
        Returns:
            List[Dict[str, Any]]: List of matching talent profiles
        """
        skill_str = ", ".join(skills)
        level_str = f" with level {experience_level}+" if experience_level else ""
        
        query = f"Find developers with {skill_str} skills{level_str}"
        context = {
            "operation": "talent_search",
            "skills": skills,
            "min_level": experience_level
        }
        
        response = await self.process_query(query, context)
        
        if "data" in response and isinstance(response["data"], list):
            return response["data"]
        else:
            logger.warning(f"Unexpected response format from MCP server: {response}")
            return []
    
    async def evaluate_skill_match(self, job_requirements: Dict[str, Any], candidate_skills: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate how well a candidate's skills match job requirements.
        
        Args:
            job_requirements (Dict[str, Any]): Job skill requirements
            candidate_skills (Dict[str, Any]): Candidate's verified skills
            
        Returns:
            Dict[str, Any]: Match evaluation with scores and recommendations
        """
        query = "Evaluate how well this candidate matches the job requirements"
        context = {
            "operation": "skill_match",
            "job_requirements": job_requirements,
            "candidate_skills": candidate_skills
        }
        
        return await self.process_query(query, context)
    
    async def register_skill_token(self, token_id: str, skill_type: str, skill_level: int) -> bool:
        """
        Register a skill token in the HCS-10 registry.
        
        Args:
            token_id (str): The token ID to register
            skill_type (str): Type of skill (e.g., "ReactJS")
            skill_level (int): Skill level (1-5)
            
        Returns:
            bool: True if registration was successful
            
        Raises:
            Exception: If the registration fails
        """
        if not self.registry_topic_id:
            raise ValueError("HCS_REGISTRY_TOPIC environment variable is not set")
        
        message = json.dumps({
            "p": "hcs-10",
            "op": "register_skill",
            "token_id": token_id,
            "skill_type": skill_type,
            "skill_level": skill_level,
            "timestamp": int(asyncio.get_event_loop().time() * 1000)
        })
        
        try:
            tx_id = await submit_hcs_message(self.registry_topic_id, message)
            logger.info(f"Registered skill token {token_id} with tx_id {tx_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to register skill token: {str(e)}")
            raise

# Singleton instance
_mcp_client: Optional[MCPServerClient] = None

def get_mcp_client() -> MCPServerClient:
    """
    Get or create the MCP Server client instance.
    
    Returns:
        MCPServerClient: The MCP Server client instance
    """
    global _mcp_client
    
    if _mcp_client is None:
        _mcp_client = MCPServerClient()
        
    return _mcp_client
