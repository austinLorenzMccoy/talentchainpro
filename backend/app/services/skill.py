"""
Comprehensive Skill Service Module

This module provides enterprise-level service functions for skill token management,
including creation, updating, evaluation, oracle integration, and caching.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.models.database import (
    SkillToken, WorkEvaluation, SkillUpdateProposal, SkillUpdateVote,
    ReputationScore, AuditLog, SkillCategoryEnum
)
from app.database import get_db_session, cache_manager
from app.utils.hedera import (
    get_contract_manager, create_skill_token, update_skill_level,
    add_skill_experience, get_skill_token_info, get_user_skills,
    SkillTokenData, SkillCategory
)
from app.config import get_settings

# Configure logging
logger = logging.getLogger(__name__)


class SkillTokenService:
    """Comprehensive service for managing skill tokens with blockchain integration."""
    
    def __init__(self):
        """Initialize the skill token service."""
        self.settings = get_settings()
        self.contract_manager = None
        logger.info("Skill token service initialized")
    
    def _get_contract_manager(self):
        """Lazy load contract manager."""
        if self.contract_manager is None:
            self.contract_manager = get_contract_manager()
        return self.contract_manager
    
    # ============ CORE SKILL TOKEN FUNCTIONS ============
    
    async def create_skill_token(
        self,
        recipient_id: str,
        skill_name: str,
        skill_category: str,
        level: int = 1,
        description: str = "",
        evidence_uri: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new skill token on blockchain and cache in database.
        
        Args:
            recipient_id: Hedera account ID to receive the token
            skill_name: Name of the skill
            skill_category: Category of the skill
            level: Initial skill level (1-10)
            description: Description of the skill
            evidence_uri: URI to evidence supporting the skill
            metadata: Additional metadata for the skill
            
        Returns:
            Dict containing creation result and token information
        """
        try:
            # Validate inputs
            if level < 1 or level > 10:
                raise ValueError("Skill level must be between 1 and 10")
            
            if skill_category not in [cat.value for cat in SkillCategoryEnum]:
                raise ValueError(f"Invalid skill category: {skill_category}")
            
            # Create skill token on blockchain
            contract_result = await create_skill_token(
                recipient_address=recipient_id,
                skill_name=skill_name,
                skill_category=skill_category,
                level=level,
                description=description,
                metadata_uri=evidence_uri
            )
            
            if not contract_result.success:
                raise Exception(f"Blockchain transaction failed: {contract_result.error}")
            
            # Extract token ID from contract result
            # Note: This would need to be implemented based on actual contract response
            token_id = f"token_{hash(skill_name + recipient_id) % 100000}"
            
            # Cache in database
            with get_db_session() as db:
                skill_token = SkillToken(
                    token_id=token_id,
                    owner_address=recipient_id,
                    skill_name=skill_name,
                    skill_category=SkillCategoryEnum(skill_category),
                    level=level,
                    experience_points=0,
                    description=description,
                    metadata=metadata or {},
                    token_uri=evidence_uri,
                    evidence_uri=evidence_uri,
                    contract_address=self.settings.contract_skill_token,
                    transaction_id=contract_result.transaction_id,
                    block_timestamp=datetime.now(timezone.utc),
                    is_active=True
                )
                
                db.add(skill_token)
                
                # Add audit log
                audit_log = AuditLog(
                    user_address=recipient_id,
                    action="create_skill_token",
                    resource_type="skill_token",
                    resource_id=token_id,
                    details={
                        "skill_name": skill_name,
                        "skill_category": skill_category,
                        "level": level,
                        "transaction_id": contract_result.transaction_id
                    },
                    success=True
                )
                db.add(audit_log)
            
            # Invalidate relevant caches
            cache_manager.invalidate_pattern(f"user_skills:{recipient_id}:*")
            cache_manager.invalidate_pattern(f"skills_category:{skill_category}:*")
            
            logger.info(f"Created skill token {token_id} for {recipient_id}")
            
            return {
                "success": True,
                "token_id": token_id,
                "transaction_id": contract_result.transaction_id,
                "recipient": recipient_id,
                "skill_name": skill_name,
                "skill_category": skill_category,
                "level": level,
                "description": description,
                "evidence_uri": evidence_uri,
                "metadata": metadata,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "gas_used": contract_result.gas_used
            }
        
        except Exception as e:
            logger.error(f"Error creating skill token: {str(e)}")
            
            # Add failed audit log
            with get_db_session() as db:
                audit_log = AuditLog(
                    user_address=recipient_id,
                    action="create_skill_token",
                    resource_type="skill_token",
                    resource_id=None,
                    details={
                        "skill_name": skill_name,
                        "skill_category": skill_category,
                        "level": level,
                        "error": str(e)
                    },
                    success=False,
                    error_message=str(e)
                )
                db.add(audit_log)
            
            raise
    
    async def batch_create_skill_tokens(
        self,
        tokens_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create multiple skill tokens in a batch operation.
        
        Args:
            tokens_data: List of skill token creation data
            
        Returns:
            Dict containing batch creation results
        """
        if len(tokens_data) > 50:
            raise ValueError("Maximum 50 tokens per batch")
        
        results = []
        successful_count = 0
        failed_count = 0
        
        for token_data in tokens_data:
            try:
                result = await self.create_skill_token(**token_data)
                results.append(result)
                successful_count += 1
            except Exception as e:
                results.append({
                    "success": False,
                    "error": str(e),
                    "token_data": token_data
                })
                failed_count += 1
        
        logger.info(f"Batch created {successful_count} skill tokens, {failed_count} failed")
        
        return {
            "success": failed_count == 0,
            "total_requested": len(tokens_data),
            "successful_count": successful_count,
            "failed_count": failed_count,
            "results": results
        }
    
    async def update_skill_level(
        self,
        token_id: str,
        new_level: int,
        evidence_uri: str = "",
        oracle_required: bool = True
    ) -> Dict[str, Any]:
        """
        Update the level of a skill token.
        
        Args:
            token_id: ID of the skill token
            new_level: New skill level (1-10)
            evidence_uri: URI to evidence supporting the level increase
            oracle_required: Whether oracle consensus is required
            
        Returns:
            Dict containing update result
        """
        try:
            if new_level < 1 or new_level > 10:
                raise ValueError("Skill level must be between 1 and 10")
            
            # Get current skill token from database
            with get_db_session() as db:
                skill_token = db.query(SkillToken).filter(
                    SkillToken.token_id == token_id
                ).first()
                
                if not skill_token:
                    raise ValueError(f"Skill token {token_id} not found")
                
                if new_level <= skill_token.level:
                    raise ValueError("New level must be higher than current level")
                
                current_level = skill_token.level
                owner_address = skill_token.owner_address
            
            # Check if oracle consensus is required (level increase > 2)
            if oracle_required and (new_level - current_level) > 2:
                # Create skill update proposal
                return await self.propose_skill_level_update(
                    token_id=token_id,
                    proposed_level=new_level,
                    evidence_uri=evidence_uri,
                    proposer_address=owner_address
                )
            
            # Direct update on blockchain
            contract_result = await update_skill_level(
                token_id=int(token_id.split('_')[1]) if '_' in token_id else int(token_id),
                new_level=new_level,
                evidence_uri=evidence_uri
            )
            
            if not contract_result.success:
                raise Exception(f"Blockchain transaction failed: {contract_result.error}")
            
            # Update database cache
            with get_db_session() as db:
                skill_token = db.query(SkillToken).filter(
                    SkillToken.token_id == token_id
                ).first()
                
                if skill_token:
                    skill_token.level = new_level
                    skill_token.evidence_uri = evidence_uri
                    skill_token.updated_at = datetime.now(timezone.utc)
                    
                    # Add audit log
                    audit_log = AuditLog(
                        user_address=skill_token.owner_address,
                        action="update_skill_level",
                        resource_type="skill_token",
                        resource_id=token_id,
                        details={
                            "old_level": current_level,
                            "new_level": new_level,
                            "evidence_uri": evidence_uri,
                            "transaction_id": contract_result.transaction_id
                        },
                        success=True
                    )
                    db.add(audit_log)
            
            # Invalidate caches
            cache_manager.delete(f"skill_token:{token_id}")
            cache_manager.invalidate_pattern(f"user_skills:{owner_address}:*")
            
            logger.info(f"Updated skill token {token_id} level from {current_level} to {new_level}")
            
            return {
                "success": True,
                "token_id": token_id,
                "old_level": current_level,
                "new_level": new_level,
                "evidence_uri": evidence_uri,
                "transaction_id": contract_result.transaction_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "gas_used": contract_result.gas_used
            }
        
        except Exception as e:
            logger.error(f"Error updating skill level: {str(e)}")
            raise
    
    async def add_experience(
        self,
        token_id: str,
        experience_points: int,
        source: str = "manual",
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Add experience points to a skill token.
        
        Args:
            token_id: ID of the skill token
            experience_points: Points to add (must be positive)
            source: Source of the experience points
            description: Description of the experience gain
            
        Returns:
            Dict containing experience addition result
        """
        try:
            if experience_points <= 0:
                raise ValueError("Experience points must be positive")
            
            # Get current skill token
            with get_db_session() as db:
                skill_token = db.query(SkillToken).filter(
                    SkillToken.token_id == token_id
                ).first()
                
                if not skill_token:
                    raise ValueError(f"Skill token {token_id} not found")
                
                current_experience = skill_token.experience_points
                current_level = skill_token.level
                owner_address = skill_token.owner_address
            
            # Add experience on blockchain
            contract_result = await add_skill_experience(
                token_id=int(token_id.split('_')[1]) if '_' in token_id else int(token_id),
                experience_points=experience_points
            )
            
            if not contract_result.success:
                raise Exception(f"Blockchain transaction failed: {contract_result.error}")
            
            # Update database and check for level up
            new_experience = current_experience + experience_points
            new_level = self._calculate_level_from_experience(new_experience)
            level_up = new_level > current_level
            
            with get_db_session() as db:
                skill_token = db.query(SkillToken).filter(
                    SkillToken.token_id == token_id
                ).first()
                
                if skill_token:
                    skill_token.experience_points = new_experience
                    if level_up:
                        skill_token.level = new_level
                    skill_token.updated_at = datetime.now(timezone.utc)
                    
                    # Add audit log
                    audit_log = AuditLog(
                        user_address=owner_address,
                        action="add_experience",
                        resource_type="skill_token",
                        resource_id=token_id,
                        details={
                            "experience_added": experience_points,
                            "total_experience": new_experience,
                            "source": source,
                            "description": description,
                            "level_up": level_up,
                            "new_level": new_level if level_up else current_level,
                            "transaction_id": contract_result.transaction_id
                        },
                        success=True
                    )
                    db.add(audit_log)
            
            # Invalidate caches
            cache_manager.delete(f"skill_token:{token_id}")
            cache_manager.invalidate_pattern(f"user_skills:{owner_address}:*")
            
            logger.info(f"Added {experience_points} experience to skill token {token_id}")
            
            return {
                "success": True,
                "token_id": token_id,
                "experience_added": experience_points,
                "total_experience": new_experience,
                "level_up": level_up,
                "current_level": new_level if level_up else current_level,
                "source": source,
                "description": description,
                "transaction_id": contract_result.transaction_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "gas_used": contract_result.gas_used
            }
        
        except Exception as e:
            logger.error(f"Error adding experience: {str(e)}")
            raise
    
    # ============ ORACLE AND PROPOSAL FUNCTIONS ============
    
    async def propose_skill_level_update(
        self,
        token_id: str,
        proposed_level: int,
        evidence_uri: str,
        proposer_address: str,
        reasoning: str = ""
    ) -> Dict[str, Any]:
        """
        Create a proposal for skill level update requiring oracle consensus.
        
        Args:
            token_id: ID of the skill token
            proposed_level: Proposed new level
            evidence_uri: URI to evidence supporting the proposal
            proposer_address: Address of the proposer
            reasoning: Reasoning for the level update
            
        Returns:
            Dict containing proposal creation result
        """
        try:
            # Get current skill token
            with get_db_session() as db:
                skill_token = db.query(SkillToken).filter(
                    SkillToken.token_id == token_id
                ).first()
                
                if not skill_token:
                    raise ValueError(f"Skill token {token_id} not found")
                
                current_level = skill_token.level
            
            # Create proposal in database
            proposal_id = f"proposal_{hash(token_id + str(proposed_level)) % 100000}"
            voting_deadline = datetime.now(timezone.utc) + timedelta(days=7)  # 7 days to vote
            
            with get_db_session() as db:
                proposal = SkillUpdateProposal(
                    proposal_id=proposal_id,
                    skill_token_id=skill_token.id,
                    proposer_address=proposer_address,
                    current_level=current_level,
                    proposed_level=proposed_level,
                    evidence={
                        "uri": evidence_uri,
                        "reasoning": reasoning,
                        "submitted_at": datetime.now(timezone.utc).isoformat()
                    },
                    reasoning=reasoning,
                    voting_deadline=voting_deadline,
                    transaction_id=f"mock_tx_{hash(proposal_id) % 100000}",
                    block_timestamp=datetime.now(timezone.utc)
                )
                
                db.add(proposal)
                
                # Add audit log
                audit_log = AuditLog(
                    user_address=proposer_address,
                    action="propose_skill_update",
                    resource_type="skill_update_proposal",
                    resource_id=proposal_id,
                    details={
                        "token_id": token_id,
                        "current_level": current_level,
                        "proposed_level": proposed_level,
                        "evidence_uri": evidence_uri,
                        "voting_deadline": voting_deadline.isoformat()
                    },
                    success=True
                )
                db.add(audit_log)
            
            logger.info(f"Created skill update proposal {proposal_id} for token {token_id}")
            
            return {
                "success": True,
                "proposal_id": proposal_id,
                "token_id": token_id,
                "current_level": current_level,
                "proposed_level": proposed_level,
                "evidence_uri": evidence_uri,
                "reasoning": reasoning,
                "voting_deadline": voting_deadline.isoformat(),
                "required_votes": 3,
                "vote_threshold": 0.67,
                "status": "pending"
            }
        
        except Exception as e:
            logger.error(f"Error creating skill update proposal: {str(e)}")
            raise
    
    # ============ QUERY FUNCTIONS ============
    
    async def get_skill_info(
        self,
        token_id: str,
        include_metadata: bool = True
    ) -> Dict[str, Any]:
        """
        Get comprehensive information about a skill token.
        
        Args:
            token_id: ID of the skill token
            include_metadata: Whether to include full metadata
            
        Returns:
            Dict containing skill token information
        """
        # Check cache first
        cache_key = f"skill_token:{token_id}:{'full' if include_metadata else 'basic'}"
        cached_result = cache_manager.get(cache_key)
        
        if cached_result:
            return json.loads(cached_result)
        
        try:
            with get_db_session() as db:
                skill_token = db.query(SkillToken).filter(
                    SkillToken.token_id == token_id
                ).first()
                
                if not skill_token:
                    # Try to fetch from blockchain
                    blockchain_result = await get_skill_token_info(
                        int(token_id.split('_')[1]) if '_' in token_id else int(token_id)
                    )
                    
                    if not blockchain_result.get("success"):
                        raise ValueError(f"Skill token {token_id} not found")
                    
                    return blockchain_result
                
                result = {
                    "success": True,
                    "token_id": skill_token.token_id,
                    "owner_address": skill_token.owner_address,
                    "skill_name": skill_token.skill_name,
                    "skill_category": skill_token.skill_category.value,
                    "level": skill_token.level,
                    "experience_points": skill_token.experience_points,
                    "description": skill_token.description,
                    "is_active": skill_token.is_active,
                    "created_at": skill_token.created_at.isoformat(),
                    "updated_at": skill_token.updated_at.isoformat(),
                    "contract_address": skill_token.contract_address,
                    "transaction_id": skill_token.transaction_id
                }
                
                if include_metadata:
                    result.update({
                        "metadata": skill_token.metadata,
                        "token_uri": skill_token.token_uri,
                        "evidence_uri": skill_token.evidence_uri,
                        "block_timestamp": skill_token.block_timestamp.isoformat(),
                        "last_synced": skill_token.last_synced.isoformat()
                    })
            
            # Cache the result
            cache_manager.set(
                cache_key,
                json.dumps(result),
                ttl=self.settings.cache_ttl_skill_tokens
            )
            
            return result
        
        except Exception as e:
            logger.error(f"Error getting skill info: {str(e)}")
            raise
    
    def _calculate_level_from_experience(self, experience: int) -> int:
        """
        Calculate skill level based on experience points.
        
        Args:
            experience: Total experience points
            
        Returns:
            int: Calculated skill level (1-10)
        """
        # Experience thresholds for each level
        level_thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
        
        for level, threshold in enumerate(level_thresholds[1:], 1):
            if experience < threshold:
                return level
        
        return 10  # Maximum level


# Singleton getter for dependency injection
def get_skill_service() -> SkillTokenService:
    """
    Get the skill service instance.
    
    Returns:
        SkillTokenService: The skill service instance
    """
    return SkillTokenService()

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
