"""
Skill Service Module

This module provides services for managing skill tokens, including minting,
updating, and retrieving skill tokens on the Hedera network.
"""

import os
import json
import logging
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, UTC

from app.utils.hedera import get_client, create_nft_token, mint_nft
from app.models.schemas import SkillLevel, SkillCategory

# Configure logging
logger = logging.getLogger(__name__)

class SkillService:
    """
    Service for managing skill tokens on the Hedera network.
    
    This class provides methods for minting, updating, and retrieving
    skill tokens as Soulbound NFTs.
    """
    
    def __init__(self):
        """Initialize the skill service."""
        self.client = get_client()
        self.skill_token_contract = os.getenv("SKILL_TOKEN_CONTRACT")
        logger.info("Skill service initialized")
    
    async def mint_skill_token(
        self,
        recipient_id: str,
        skill_name: str,
        skill_category: SkillCategory,
        skill_level: SkillLevel,
        description: str,
        evidence_links: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Mint a new skill token for a recipient.
        
        Args:
            recipient_id: Hedera account ID of the recipient
            skill_name: Name of the skill
            skill_category: Category of the skill
            skill_level: Initial skill level
            description: Description of the skill
            evidence_links: Optional links to evidence of the skill
            metadata: Optional additional metadata
            
        Returns:
            Dict containing token details:
                - token_id: Hedera token ID
                - recipient_id: Hedera account ID of the recipient
                - skill_name: Name of the skill
                - skill_category: Category of the skill
                - skill_level: Skill level
                - transaction_id: Transaction ID
                - timestamp: Timestamp of the operation
                
        Raises:
            Exception: If token creation or minting fails
        """
        try:
            # Prepare token metadata
            token_metadata = {
                "name": f"{skill_name} - Level {skill_level.value}",
                "description": description,
                "category": skill_category.value,
                "level": skill_level.value,
                "evidence_links": evidence_links or [],
                "created_at": datetime.now(UTC).isoformat(),
                "updated_at": datetime.now(UTC).isoformat(),
                "is_soulbound": True
            }
            
            # Add custom metadata if provided
            if metadata:
                token_metadata.update(metadata)
            
            # Create token name and symbol
            token_name = f"{skill_name} Skill Token"
            token_symbol = f"SKILL_{skill_category.value[:3].upper()}"
            
            # Create NFT token
            logger.info(f"Creating skill token for {recipient_id}: {skill_name} (Level {skill_level.value})")
            token_id = await create_nft_token(token_name, token_symbol, token_metadata)
            
            # Mint NFT with metadata
            metadata_uri = json.dumps(token_metadata)
            transaction_id = await mint_nft(token_id, metadata_uri, recipient_id)
            
            # Return token details
            return {
                "token_id": token_id,
                "recipient_id": recipient_id,
                "skill_name": skill_name,
                "skill_category": skill_category.value,
                "skill_level": skill_level.value,
                "transaction_id": transaction_id,
                "timestamp": datetime.utcnow()
            }
        
        except Exception as e:
            logger.error(f"Error minting skill token: {str(e)}")
            raise
    
    async def update_skill_token(
        self,
        token_id: str,
        new_level: int,
        update_reason: str,
        evidence_links: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Update the level of a skill token.
        
        Args:
            token_id: Hedera token ID of the skill token
            new_level: New skill level
            update_reason: Reason for the update
            evidence_links: Optional links to evidence for the update
            
        Returns:
            Dict containing updated token details:
                - token_id: Hedera token ID
                - new_level: New skill level
                - transaction_id: Transaction ID
                - timestamp: Timestamp of the operation
                
        Raises:
            ValueError: If token ID is invalid or new level is out of range
            Exception: If token update fails
        """
        try:
            # Validate new level
            if not 1 <= new_level <= 5:
                raise ValueError("Skill level must be between 1 and 5")
            
            # Get current token info
            # In a real implementation, this would query the token info from Hedera
            # For now, we'll simulate this
            
            # Prepare updated metadata
            updated_metadata = {
                "level": new_level,
                "update_reason": update_reason,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if evidence_links:
                updated_metadata["evidence_links"] = evidence_links
            
            # In a real implementation, this would update the token metadata
            # For now, we'll simulate a successful update
            transaction_id = f"0.0.{uuid.uuid4().hex[:8]}"
            
            logger.info(f"Updated skill token {token_id} to level {new_level}")
            
            # Return updated token details
            return {
                "token_id": token_id,
                "new_level": new_level,
                "transaction_id": transaction_id,
                "timestamp": datetime.utcnow()
            }
        
        except Exception as e:
            logger.error(f"Error updating skill token: {str(e)}")
            raise
    
    async def get_skill_token(self, token_id: str) -> Dict[str, Any]:
        """
        Get details of a skill token.
        
        Args:
            token_id: Hedera token ID of the skill token
            
        Returns:
            Dict containing token details
            
        Raises:
            ValueError: If token ID is invalid
            Exception: If token retrieval fails
        """
        try:
            # In a real implementation, this would query the token info from Hedera
            # For now, we'll simulate this with mock data
            
            # Mock token data
            token_data = {
                "token_id": token_id,
                "name": "React.js Skill Token",
                "skill_name": "React.js",
                "skill_category": "frontend",
                "skill_level": 3,
                "description": "Advanced React.js development with hooks and context API",
                "evidence_links": ["https://github.com/user/react-project"],
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-01T00:00:00Z"
            }
            
            logger.info(f"Retrieved skill token {token_id}")
            return token_data
        
        except Exception as e:
            logger.error(f"Error retrieving skill token: {str(e)}")
            raise
    
    async def list_skill_tokens(self, owner_id: str) -> List[Dict[str, Any]]:
        """
        List all skill tokens owned by an account.
        
        Args:
            owner_id: Hedera account ID of the owner
            
        Returns:
            List of token details
            
        Raises:
            ValueError: If owner ID is invalid
            Exception: If token retrieval fails
        """
        try:
            # In a real implementation, this would query the tokens owned by the account
            # For now, we'll simulate this with mock data
            
            # Mock token list
            tokens = [
                {
                    "token_id": f"0.0.{100000 + i}",
                    "name": f"Skill Token {i}",
                    "skill_name": ["React.js", "Solidity", "Python"][i % 3],
                    "skill_category": ["frontend", "blockchain", "backend"][i % 3],
                    "skill_level": (i % 5) + 1,
                    "description": f"Description for skill {i}",
                    "created_at": "2025-01-01T00:00:00Z"
                }
                for i in range(3)  # Mock 3 tokens
            ]
            
            logger.info(f"Listed {len(tokens)} skill tokens for {owner_id}")
            return tokens
        
        except Exception as e:
            logger.error(f"Error listing skill tokens: {str(e)}")
            raise

# Singleton instance
_skill_service: Optional[SkillService] = None

def get_skill_service() -> SkillService:
    """
    Get or create the skill service instance.
    
    Returns:
        SkillService: The skill service instance
    """
    global _skill_service
    
    if _skill_service is None:
        _skill_service = SkillService()
        
    return _skill_service
