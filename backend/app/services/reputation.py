"""
Reputation Service Module

This module provides services for evaluating work quality and managing
reputation scores using AI oracles and HCS messaging.
"""

import os
import json
import logging
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, UTC

from app.utils.hedera import get_client, submit_hcs_message
from app.utils.ai_oracle import get_ai_oracle
from app.services.skill import get_skill_service

# Configure logging
logger = logging.getLogger(__name__)

class ReputationService:
    """
    Service for evaluating work and managing reputation on the Hedera network.
    
    This class provides methods for evaluating work submissions using AI oracles
    and updating reputation scores via HCS messaging.
    """
    
    def __init__(self):
        """Initialize the reputation service."""
        self.client = get_client()
        self.ai_oracle = get_ai_oracle()
        self.skill_service = get_skill_service()
        self.reputation_topic_id = os.getenv("REPUTATION_TOPIC_ID")
        logger.info("Reputation service initialized")
    
    async def evaluate_work(
        self,
        user_id: str,
        skill_token_ids: List[str],
        work_description: str,
        work_content: str,
        evaluation_criteria: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate work submission and generate reputation scores.
        
        Args:
            user_id: User ID
            skill_token_ids: List of skill token IDs to evaluate
            work_description: Description of the work
            work_content: Content or artifacts of the work
            evaluation_criteria: Optional custom evaluation criteria
            
        Returns:
            Dict containing evaluation results:
                - evaluation_id: Unique evaluation ID
                - user_id: User ID
                - overall_score: Overall numerical score between 0-100
                - skill_scores: Individual skill evaluations
                - recommendation: AI recommendation for skill improvement
                - level_changes: Recommended level changes for each skill token
                - timestamp: Timestamp of the evaluation
                
        Raises:
            ValueError: If required data is missing or invalid
            Exception: If evaluation fails
        """
        try:
            # Generate unique evaluation ID
            evaluation_id = str(uuid.uuid4())
            
            # Get skill token details
            skill_details = {}
            current_levels = {}
            skill_categories = []
            
            for token_id in skill_token_ids:
                # In a real implementation, this would get actual token details
                # For now, we'll use mock data or the skill service
                token_info = await self.skill_service.get_skill_token(token_id)
                skill_details[token_id] = token_info
                current_levels[token_id] = token_info["skill_level"]
                skill_categories.append(token_info["skill_category"])
            
            # Prepare work data for evaluation
            work_data = {
                "skill_categories": skill_categories,
                "current_levels": current_levels,
                "work_description": work_description,
                "work_content": work_content,
                "evaluation_criteria": evaluation_criteria or "Standard evaluation criteria"
            }
            
            # Evaluate work using AI oracle
            logger.info(f"Evaluating work for user {user_id} with skills {skill_token_ids}")
            overall_score, evaluation_results = await self.ai_oracle.evaluate_work(work_data)
            
            # Determine level changes based on scores
            level_changes = {}
            for token_id, skill_eval in evaluation_results["skill_scores"].items():
                # Simple algorithm: score > 85 = upgrade, score < 40 = downgrade, else no change
                # Access score as a dictionary key, not an attribute
                score = skill_eval["score"] if isinstance(skill_eval, dict) else skill_eval.score
                
                if score > 85:
                    level_change = 1
                elif score < 40:
                    level_change = -1
                else:
                    level_change = 0
                
                level_changes[token_id] = level_change
            
            # Submit evaluation results to HCS
            if self.reputation_topic_id:
                hcs_message = {
                    "type": "work_evaluation",
                    "evaluation_id": evaluation_id,
                    "user_id": user_id,
                    "overall_score": overall_score,
                    "skill_token_ids": skill_token_ids,
                    "level_changes": level_changes,
                    "timestamp": datetime.now(UTC).isoformat()
                }
                
                await submit_hcs_message(self.reputation_topic_id, json.dumps(hcs_message))
                logger.info(f"Submitted evaluation results to HCS topic {self.reputation_topic_id}")
            
            # Update skill levels if needed
            for token_id, level_change in level_changes.items():
                if level_change != 0:
                    current_level = current_levels.get(token_id, 3)  # Default to level 3 if not found
                    new_level = max(1, min(5, current_level + level_change))  # Keep within 1-5 range
                    
                    # In a real implementation, this would update the token on-chain
                    # For now, we'll just log the change
                    logger.info(f"Skill token {token_id} level change: {current_level} -> {new_level}")
            
            # Return evaluation results
            return {
                "evaluation_id": evaluation_id,
                "user_id": user_id,
                "overall_score": overall_score,
                "skill_scores": evaluation_results["skill_scores"],
                "recommendation": evaluation_results["recommendation"],
                "level_changes": level_changes,
                "timestamp": datetime.utcnow()
            }
        
        except Exception as e:
            logger.error(f"Error evaluating work: {str(e)}")
            raise
    
    async def get_reputation_history(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get reputation history for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of history items to return
            
        Returns:
            List of reputation history items
            
        Raises:
            ValueError: If user ID is invalid
            Exception: If history retrieval fails
        """
        try:
            # In a real implementation, this would query HCS for reputation history
            # For now, we'll simulate this with mock data
            
            # Mock reputation history
            history = [
                {
                    "evaluation_id": str(uuid.uuid4()),
                    "overall_score": 75 + (i * 5) % 20,
                    "skill_token_ids": [f"0.0.{100000 + i}"],
                    "level_changes": {f"0.0.{100000 + i}": (i % 3) - 1},  # -1, 0, or 1
                    "timestamp": f"2025-0{(i % 6) + 1}-{(i % 28) + 1}T00:00:00Z"
                }
                for i in range(limit)
            ]
            
            logger.info(f"Retrieved {len(history)} reputation history items for user {user_id}")
            return history
        
        except Exception as e:
            logger.error(f"Error retrieving reputation history: {str(e)}")
            raise
    
    async def get_reputation_score(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get aggregated reputation score for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict containing reputation score details:
                - user_id: User ID
                - overall_score: Overall reputation score
                - skill_scores: Scores by skill category
                - last_updated: Timestamp of last update
                
        Raises:
            ValueError: If user ID is invalid
            Exception: If score retrieval fails
        """
        try:
            # In a real implementation, this would calculate reputation from history
            # For now, we'll simulate this with mock data
            
            # Mock reputation score
            reputation = {
                "user_id": user_id,
                "overall_score": 85,
                "skill_scores": {
                    "blockchain": 90,
                    "frontend": 85,
                    "backend": 80
                },
                "last_updated": datetime.now(UTC).isoformat()
            }
            
            logger.info(f"Retrieved reputation score for user {user_id}")
            return reputation
        
        except Exception as e:
            logger.error(f"Error retrieving reputation score: {str(e)}")
            raise

# Singleton instance
_reputation_service: Optional[ReputationService] = None

def get_reputation_service() -> ReputationService:
    """
    Get or create the reputation service instance.
    
    Returns:
        ReputationService: The reputation service instance
    """
    global _reputation_service
    
    if _reputation_service is None:
        _reputation_service = ReputationService()
        
    return _reputation_service
