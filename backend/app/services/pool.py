"""
Pool Service

This module provides services for managing talent pools,
including creation, joining, and matching.
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, UTC
import json
import uuid

from app.utils.hedera import get_client, submit_message_to_topic
from app.models.schemas import (
    JobPoolRequest,
    JobPoolResponse,
    CandidateJoinRequest,
    MatchRequest,
    MatchResponse
)

# Configure logging
logger = logging.getLogger(__name__)

# Mock data for pools (in a real implementation, this would use blockchain)
mock_pools = {}
mock_pool_counter = 1000
mock_matches = {}

class PoolService:
    """Service for managing job pools."""
    
    async def create_job_pool(
        self,
        company_id: str,
        job_title: str,
        job_description: str,
        required_skills: List[Dict[str, Any]],
        stake_amount: float,
        duration_days: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new job pool.
        
        Args:
            company_id: Company account ID
            job_title: Job title
            job_description: Job description
            required_skills: List of required skills with category, name, and min_level
            stake_amount: Amount to stake in HBAR
            duration_days: Duration of the pool in days
            metadata: Optional additional metadata
            
        Returns:
            Job pool details
        """
        try:
            global mock_pool_counter
            pool_id = f"0.0.{mock_pool_counter}"
            mock_pool_counter += 1
            
            # In a real implementation, this would create a pool on-chain using the TalentPool contract
            # For now, we'll use mock data
            expiry_date = (datetime.now(UTC) + timedelta(days=duration_days)).isoformat()
            
            pool = {
                "pool_id": pool_id,
                "company_id": company_id,
                "job_title": job_title,
                "job_description": job_description,
                "required_skills": required_skills,
                "stake_amount": stake_amount,
                "transaction_id": f"0.0.{mock_pool_counter + 1000}",
                "expiry_date": expiry_date,
                "status": "active",
                "candidates": [],
                "metadata": metadata or {}
            }
            
            mock_pools[pool_id] = pool
            
            # In a real implementation, we would submit a message to HCS for transparency
            # topic_id = os.getenv("POOLS_TOPIC_ID")
            # if topic_id:
            #     await submit_message_to_topic(topic_id, json.dumps({
            #         "type": "pool_created",
            #         "pool_id": pool_id,
            #         "company_id": company_id,
            #         "timestamp": datetime.utcnow().isoformat()
            #     }))
            
            logger.info(f"Created job pool {pool_id} for company {company_id}")
            return pool
            
        except Exception as e:
            logger.error(f"Error creating job pool: {str(e)}")
            raise
    
    async def get_job_pool(self, pool_id: str) -> Optional[Dict[str, Any]]:
        """
        Get details of a job pool.
        
        Args:
            pool_id: Job pool ID
            
        Returns:
            Job pool details or None if not found
        """
        try:
            # In a real implementation, this would get pool details from the chain
            # For now, we'll use mock data
            pool = mock_pools.get(pool_id)
            
            if not pool:
                logger.warning(f"Job pool {pool_id} not found")
                return None
            
            logger.info(f"Retrieved job pool {pool_id}")
            return pool
            
        except Exception as e:
            logger.error(f"Error retrieving job pool: {str(e)}")
            raise
    
    async def list_job_pools(
        self,
        company_id: Optional[str] = None,
        status: Optional[str] = None,
        skill: Optional[str] = None
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
            raise
    
    async def join_pool(
        self,
        pool_id: str,
        candidate_id: str,
        skill_token_ids: List[str],
        stake_amount: float
    ) -> Dict[str, Any]:
        """
        Join a job pool as a candidate.
        
        Args:
            pool_id: Job pool ID
            candidate_id: Candidate account ID
            skill_token_ids: List of skill token IDs
            stake_amount: Amount to stake in HBAR
            
        Returns:
            Join operation details
        """
        try:
            # In a real implementation, this would join a pool on-chain
            # For now, we'll use mock data
            pool = mock_pools.get(pool_id)
            
            if not pool:
                logger.warning(f"Job pool {pool_id} not found")
                return None
            
            if pool["status"] != "active":
                raise ValueError(f"Job pool {pool_id} is not active")
            
            # Check if candidate already joined
            if any(c["candidate_id"] == candidate_id for c in pool["candidates"]):
                raise ValueError(f"Candidate {candidate_id} already joined pool {pool_id}")
            
            # Add candidate to pool
            candidate = {
                "candidate_id": candidate_id,
                "skill_token_ids": skill_token_ids,
                "stake_amount": stake_amount,
                "joined_at": datetime.now(UTC).isoformat()
            }
            
            pool["candidates"].append(candidate)
            
            # In a real implementation, we would submit a message to HCS for transparency
            # topic_id = os.getenv("POOLS_TOPIC_ID")
            # if topic_id:
            #     await submit_message_to_topic(topic_id, json.dumps({
            #         "type": "candidate_joined",
            #         "pool_id": pool_id,
            #         "candidate_id": candidate_id,
            #         "timestamp": datetime.utcnow().isoformat()
            #     }))
            
            logger.info(f"Candidate {candidate_id} joined pool {pool_id}")
            return {
                "pool_id": pool_id,
                "candidate_id": candidate_id,
                "status": "joined",
                "transaction_id": f"0.0.{mock_pool_counter + 2000}"
            }
            
        except ValueError as e:
            logger.warning(str(e))
            raise
            
        except Exception as e:
            logger.error(f"Error joining pool: {str(e)}")
            raise
    
    async def leave_pool(
        self,
        pool_id: str,
        candidate_id: str
    ) -> Dict[str, Any]:
        """
        Leave a job pool as a candidate.
        
        Args:
            pool_id: Job pool ID
            candidate_id: Candidate account ID
            
        Returns:
            Leave operation details
        """
        try:
            # In a real implementation, this would leave a pool on-chain
            # For now, we'll use mock data
            pool = mock_pools.get(pool_id)
            
            if not pool:
                logger.warning(f"Job pool {pool_id} not found")
                return None
            
            # Find and remove candidate
            candidate_index = None
            for i, c in enumerate(pool["candidates"]):
                if c["candidate_id"] == candidate_id:
                    candidate_index = i
                    break
            
            if candidate_index is None:
                logger.warning(f"Candidate {candidate_id} not found in pool {pool_id}")
                return None
            
            pool["candidates"].pop(candidate_index)
            
            # In a real implementation, we would submit a message to HCS for transparency
            # topic_id = os.getenv("POOLS_TOPIC_ID")
            # if topic_id:
            #     await submit_message_to_topic(topic_id, json.dumps({
            #         "type": "candidate_left",
            #         "pool_id": pool_id,
            #         "candidate_id": candidate_id,
            #         "timestamp": datetime.utcnow().isoformat()
            #     }))
            
            logger.info(f"Candidate {candidate_id} left pool {pool_id}")
            return {
                "pool_id": pool_id,
                "candidate_id": candidate_id,
                "status": "left",
                "transaction_id": f"0.0.{mock_pool_counter + 3000}"
            }
            
        except Exception as e:
            logger.error(f"Error leaving pool: {str(e)}")
            raise
    
    async def make_match(
        self,
        pool_id: str,
        company_id: str,
        candidate_id: str
    ) -> Dict[str, Any]:
        """
        Make a match between a company and a candidate.
        
        Args:
            pool_id: Job pool ID
            company_id: Company account ID
            candidate_id: Candidate account ID
            
        Returns:
            Match details
        """
        try:
            # In a real implementation, this would make a match on-chain
            # For now, we'll use mock data
            pool = mock_pools.get(pool_id)
            
            if not pool:
                logger.warning(f"Job pool {pool_id} not found")
                return None
            
            if pool["company_id"] != company_id:
                raise ValueError(f"Company {company_id} is not the owner of pool {pool_id}")
            
            # Check if candidate is in the pool
            if not any(c["candidate_id"] == candidate_id for c in pool["candidates"]):
                logger.warning(f"Candidate {candidate_id} not found in pool {pool_id}")
                return None
            
            # Update pool status
            pool["status"] = "matched"
            
            # Create match
            match_id = f"match_{pool_id}_{candidate_id}"
            match = {
                "match_id": match_id,
                "pool_id": pool_id,
                "company_id": company_id,
                "candidate_id": candidate_id,
                "transaction_id": f"0.0.{mock_pool_counter + 4000}",
                "timestamp": datetime.now(UTC).isoformat(),
                "status": "matched"
            }
            
            mock_matches[match_id] = match
            
            # In a real implementation, we would submit a message to HCS for transparency
            # topic_id = os.getenv("POOLS_TOPIC_ID")
            # if topic_id:
            #     await submit_message_to_topic(topic_id, json.dumps({
            #         "type": "match_made",
            #         "match_id": match_id,
            #         "pool_id": pool_id,
            #         "company_id": company_id,
            #         "candidate_id": candidate_id,
            #         "timestamp": datetime.utcnow().isoformat()
            #     }))
            
            logger.info(f"Match made in pool {pool_id} between company {company_id} and candidate {candidate_id}")
            return match
            
        except ValueError as e:
            logger.warning(str(e))
            raise
            
        except Exception as e:
            logger.error(f"Error making match: {str(e)}")
            raise
    
    async def get_pool_candidates(
        self,
        pool_id: str
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
                logger.warning(f"Job pool {pool_id} not found")
                return None
            
            logger.info(f"Retrieved {len(pool['candidates'])} candidates for pool {pool_id}")
            return pool["candidates"]
            
        except Exception as e:
            logger.error(f"Error retrieving pool candidates: {str(e)}")
            raise

# Singleton instance
_pool_service = None

def get_pool_service() -> PoolService:
    """
    Get the pool service singleton instance.
    
    Returns:
        PoolService instance
    """
    global _pool_service
    if _pool_service is None:
        _pool_service = PoolService()
    return _pool_service
