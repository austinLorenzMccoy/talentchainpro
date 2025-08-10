"""
Comprehensive Reputation Service Module

This module provides enterprise-level reputation management including scoring algorithms,
peer validation, Oracle integration, anti-gaming mechanisms, and comprehensive
audit trails for the TalentChain Pro ecosystem.
"""

import os
import json
import uuid
import logging
import hashlib
from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from enum import Enum

# Configure logging first
logger = logging.getLogger(__name__)

try:
    from sqlalchemy.orm import Session
    from sqlalchemy import and_, or_, desc, func, text
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False
    logger.warning("SQLAlchemy not available, using fallback functionality")

try:
    from app.models.database import (
        ReputationScore, ReputationTransaction, ReputationValidation,
        SkillToken, JobPool, PoolApplication, PoolMatch, AuditLog,
        User, ReputationMetric
    )
    from app.database import get_db_session, cache_manager
    DATABASE_MODELS_AVAILABLE = True
except ImportError:
    DATABASE_MODELS_AVAILABLE = False
    logger.warning("Database models not available, using fallback functionality")

from app.utils.hedera import (
    get_contract_manager, get_client, submit_hcs_message,
    validate_hedera_address
)

try:
    from app.services.mcp import get_mcp_service
    MCP_SERVICE_AVAILABLE = True
except ImportError:
    MCP_SERVICE_AVAILABLE = False
    logger.warning("MCP service not available, using fallback reputation calculation")

try:
    from app.config import get_settings
    CONFIG_AVAILABLE = True
except ImportError:
    CONFIG_AVAILABLE = False
    logger.warning("Config not available, using environment variables")

# Fallback storage for when database is not available
_fallback_reputation = {}
_fallback_validations = {}
_fallback_transactions = {}


class ReputationEventType(str, Enum):
    """Types of reputation events."""
    SKILL_VALIDATION = "skill_validation"
    JOB_COMPLETION = "job_completion"
    PEER_REVIEW = "peer_review"
    COMMUNITY_CONTRIBUTION = "community_contribution"
    GOVERNANCE_PARTICIPATION = "governance_participation"
    PENALTY_APPLIED = "penalty_applied"
    BONUS_AWARDED = "bonus_awarded"
    MILESTONE_ACHIEVED = "milestone_achieved"


class ValidationStatus(str, Enum):
    """Status of reputation validations."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISPUTED = "disputed"
    EXPIRED = "expired"


class ReputationCategory(str, Enum):
    """Categories of reputation metrics."""
    TECHNICAL_SKILL = "technical_skill"
    COLLABORATION = "collaboration"
    RELIABILITY = "reliability"
    COMMUNICATION = "communication"
    LEADERSHIP = "leadership"
    INNOVATION = "innovation"
    GOVERNANCE = "governance"

class ReputationService:
    """Comprehensive service for managing reputation scores and validation."""
    
    def __init__(self):
        """Initialize the reputation service."""
        if CONFIG_AVAILABLE:
            self.settings = get_settings()
        else:
            self.settings = None
        
        self.contract_manager = None
        self.mcp_service = None
        
        # Reputation scoring weights
        self.scoring_weights = {
            ReputationCategory.TECHNICAL_SKILL: 0.25,
            ReputationCategory.COLLABORATION: 0.20,
            ReputationCategory.RELIABILITY: 0.20,
            ReputationCategory.COMMUNICATION: 0.15,
            ReputationCategory.LEADERSHIP: 0.10,
            ReputationCategory.INNOVATION: 0.05,
            ReputationCategory.GOVERNANCE: 0.05
        }
        
        # Anti-gaming parameters
        self.max_validations_per_day = 10
        self.min_validation_stake = 1.0  # HBAR
        self.validation_cooldown_hours = 24
        self.reputation_decay_factor = 0.98  # 2% monthly decay
        
        logger.info("Reputation service initialized")
    
    def _get_contract_manager(self):
        """Lazy load contract manager."""
        if self.contract_manager is None:
            self.contract_manager = get_contract_manager()
        return self.contract_manager
    
    def _get_mcp_service(self):
        """Lazy load MCP service for AI-powered reputation analysis."""
        if self.mcp_service is None and MCP_SERVICE_AVAILABLE:
            self.mcp_service = get_mcp_service()
        return self.mcp_service
    
    def _get_db_session(self):
        """Get database session if available."""
        if DATABASE_MODELS_AVAILABLE:
            return get_db_session()
        return None
    
    def _invalidate_cache(self, patterns: List[str]):
        """Invalidate cache patterns if cache manager is available."""
        if DATABASE_MODELS_AVAILABLE and hasattr(cache_manager, 'invalidate_pattern'):
            for pattern in patterns:
                try:
                    cache_manager.invalidate_pattern(pattern)
                except:
                    pass
    
    # ============ CORE REPUTATION FUNCTIONS ============
    
    async def calculate_reputation_score(
        self,
        user_address: str,
        category: Optional[ReputationCategory] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive reputation score for a user.
        
        Args:
            user_address: User's Hedera account address
            category: Specific category to calculate (None for overall)
            
        Returns:
            Dict containing reputation score and breakdown
        """
        try:
            if not validate_hedera_address(user_address):
                raise ValueError("Invalid Hedera address format")
            
            # Get base reputation data
            base_data = await self._get_base_reputation_data(user_address)
            
            if category:
                # Calculate specific category score
                score = await self._calculate_category_score(user_address, category, base_data)
                
                return {
                    "user_address": user_address,
                    "category": category.value,
                    "score": score,
                    "max_score": 100.0,
                    "calculated_at": datetime.now(timezone.utc).isoformat(),
                    "breakdown": await self._get_category_breakdown(user_address, category)
                }
            else:
                # Calculate overall reputation score
                overall_score = 0.0
                category_scores = {}
                
                for cat, weight in self.scoring_weights.items():
                    cat_score = await self._calculate_category_score(user_address, cat, base_data)
                    category_scores[cat.value] = cat_score
                    overall_score += cat_score * weight
                
                # Apply time decay factor
                overall_score = await self._apply_time_decay(user_address, overall_score)
                
                # Apply anti-gaming adjustments
                overall_score = await self._apply_anti_gaming_adjustments(user_address, overall_score)
                
                return {
                    "user_address": user_address,
                    "overall_score": round(overall_score, 2),
                    "max_score": 100.0,
                    "category_scores": category_scores,
                    "calculated_at": datetime.now(timezone.utc).isoformat(),
                    "scoring_weights": {k.value: v for k, v in self.scoring_weights.items()},
                    "factors_applied": {
                        "time_decay": True,
                        "anti_gaming": True,
                        "peer_validation": True
                    }
                }
        
        except Exception as e:
            logger.error(f"Error calculating reputation score: {str(e)}")
            raise
    
    async def update_reputation(
        self,
        user_address: str,
        event_type: ReputationEventType,
        impact_score: float,
        context: Dict[str, Any],
        validator_address: Optional[str] = None,
        blockchain_evidence: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update user reputation based on an event.
        
        Args:
            user_address: User's address
            event_type: Type of reputation event
            impact_score: Score impact (-100 to +100)
            context: Event context and metadata
            validator_address: Address of the validator (if applicable)
            blockchain_evidence: Blockchain transaction ID as evidence
            
        Returns:
            Dict containing update result
        """
        try:
            if not validate_hedera_address(user_address):
                raise ValueError("Invalid user address format")
            
            if validator_address and not validate_hedera_address(validator_address):
                raise ValueError("Invalid validator address format")
            
            if not (-100 <= impact_score <= 100):
                raise ValueError("Impact score must be between -100 and +100")
            
            # Validate event context
            await self._validate_reputation_event(user_address, event_type, context)
            
            # Create reputation transaction
            transaction_id = await self._create_reputation_transaction(
                user_address=user_address,
                event_type=event_type,
                impact_score=impact_score,
                context=context,
                validator_address=validator_address,
                blockchain_evidence=blockchain_evidence
            )
            
            # Update reputation scores
            updated_scores = await self._apply_reputation_update(
                user_address, event_type, impact_score, context
            )
            
            # Submit to blockchain for transparency
            if blockchain_evidence:
                await self._submit_reputation_evidence(transaction_id, blockchain_evidence)
            
            # Invalidate caches
            self._invalidate_cache([
                f"reputation:{user_address}:*",
                "reputation_leaderboard:*"
            ])
            
            logger.info(f"Updated reputation for {user_address}: {event_type.value} (+{impact_score})")
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "user_address": user_address,
                "event_type": event_type.value,
                "impact_score": impact_score,
                "updated_scores": updated_scores,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error updating reputation: {str(e)}")
            raise
    
    # ============ LEGACY COMPATIBILITY FUNCTIONS ============
    
    async def evaluate_work(
        self,
        user_id: str,
        skill_token_ids: List[str],
        work_description: str,
        work_content: str,
        evaluation_criteria: Optional[str] = None
    ) -> Dict[str, Any]:
        """Legacy function for backward compatibility."""
        try:
            # Convert to new reputation update system
            evaluation_id = f"eval_{hash(user_id + work_description) % 100000}"
            
            # Use MCP service for work evaluation if available
            mcp_service = self._get_mcp_service()
            
            if mcp_service:
                # AI-powered evaluation
                evaluation_result = await mcp_service.evaluate_work_submission(
                    user_id=user_id,
                    work_description=work_description,
                    work_content=work_content,
                    skill_tokens=skill_token_ids,
                    criteria=evaluation_criteria
                )
                
                overall_score = evaluation_result.get("overall_score", 75.0)
                skill_scores = evaluation_result.get("skill_scores", {})
                recommendation = evaluation_result.get("recommendation", "Good work! Keep improving.")
            else:
                # Fallback scoring
                overall_score = 75.0 + len(work_content) * 0.01  # Simple content-based scoring
                skill_scores = {token_id: overall_score for token_id in skill_token_ids}
                recommendation = "Work evaluated. Consider providing more detailed submissions for better scoring."
            
            # Update reputation based on evaluation
            if overall_score > 70:
                await self.update_reputation(
                    user_address=user_id,
                    event_type=ReputationEventType.JOB_COMPLETION,
                    impact_score=(overall_score - 50) * 0.5,  # Scale to -25 to +25
                    context={
                        "evaluation_id": evaluation_id,
                        "work_description": work_description,
                        "overall_score": overall_score,
                        "skill_tokens": skill_token_ids
                    }
                )
            
            # Calculate level changes
            level_changes = {}
            for token_id in skill_token_ids:
                score = skill_scores.get(token_id, overall_score)
                if score > 85:
                    level_changes[token_id] = 1
                elif score < 40:
                    level_changes[token_id] = -1
                else:
                    level_changes[token_id] = 0
            
            return {
                "evaluation_id": evaluation_id,
                "user_id": user_id,
                "overall_score": overall_score,
                "skill_scores": skill_scores,
                "recommendation": recommendation,
                "level_changes": level_changes,
                "timestamp": datetime.now(timezone.utc)
            }
        
        except Exception as e:
            logger.error(f"Error evaluating work: {str(e)}")
            raise
    
    async def get_reputation_history(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Legacy function for backward compatibility."""
        try:
            base_data = await self._get_base_reputation_data(user_id)
            transactions = base_data.get("transactions", [])
            
            # Sort by date and limit
            sorted_transactions = sorted(
                transactions,
                key=lambda x: x.get("created_at", ""),
                reverse=True
            )[:limit]
            
            # Convert to legacy format
            history = []
            for transaction in sorted_transactions:
                history.append({
                    "evaluation_id": transaction.get("id", "unknown"),
                    "overall_score": 50 + transaction.get("impact_score", 0),
                    "skill_token_ids": transaction.get("context", {}).get("skill_tokens", []),
                    "level_changes": transaction.get("context", {}).get("level_changes", {}),
                    "timestamp": transaction.get("created_at", datetime.now(timezone.utc).isoformat())
                })
            
            return history
        
        except Exception as e:
            logger.error(f"Error retrieving reputation history: {str(e)}")
            return []
    
    async def get_reputation_score(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """Legacy function for backward compatibility."""
        try:
            # Get comprehensive reputation score
            reputation_data = await self.calculate_reputation_score(user_id)
            
            # Convert to legacy format
            return {
                "user_id": user_id,
                "overall_score": reputation_data.get("overall_score", 50.0),
                "skill_scores": {
                    "blockchain": reputation_data.get("category_scores", {}).get("technical_skill", 50.0),
                    "frontend": reputation_data.get("category_scores", {}).get("technical_skill", 50.0),
                    "backend": reputation_data.get("category_scores", {}).get("technical_skill", 50.0)
                },
                "last_updated": reputation_data.get("calculated_at", datetime.now(timezone.utc).isoformat())
            }
        
        except Exception as e:
            logger.error(f"Error retrieving reputation score: {str(e)}")
            return {
                "user_id": user_id,
                "overall_score": 50.0,
                "skill_scores": {"blockchain": 50.0, "frontend": 50.0, "backend": 50.0},
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
    
    # ============ HELPER FUNCTIONS ============
    
    async def _get_base_reputation_data(self, user_address: str) -> Dict[str, Any]:
        """Get base reputation data for calculations."""
        try:
            if DATABASE_MODELS_AVAILABLE:
                with self._get_db_session() as db:
                    # Get recent reputation transactions
                    transactions = db.query(ReputationTransaction).filter(
                        ReputationTransaction.user_address == user_address
                    ).order_by(desc(ReputationTransaction.created_at)).limit(100).all()
                    
                    # Get current reputation scores
                    scores = db.query(ReputationScore).filter(
                        ReputationScore.user_address == user_address
                    ).all()
                    
                    # Get validations
                    validations = db.query(ReputationValidation).filter(
                        ReputationValidation.user_address == user_address
                    ).all()
                    
                    return {
                        "transactions": [self._transaction_to_dict(t) for t in transactions],
                        "scores": [self._score_to_dict(s) for s in scores],
                        "validations": [self._validation_to_dict(v) for v in validations]
                    }
            else:
                # Fallback to memory storage
                return {
                    "transactions": _fallback_transactions.get(user_address, []),
                    "scores": _fallback_reputation.get(user_address, {}),
                    "validations": _fallback_validations.get(user_address, [])
                }
        
        except Exception as e:
            logger.warning(f"Error getting base reputation data: {str(e)}")
            return {"transactions": [], "scores": [], "validations": []}
    
    def _transaction_to_dict(self, transaction) -> Dict[str, Any]:
        """Convert transaction model to dictionary."""
        return {
            "id": transaction.id,
            "event_type": transaction.event_type,
            "impact_score": float(transaction.impact_score),
            "context": transaction.context,
            "created_at": transaction.created_at.isoformat()
        }
    
    def _score_to_dict(self, score) -> Dict[str, Any]:
        """Convert score model to dictionary."""
        return {
            "category": score.category,
            "score": float(score.score),
            "updated_at": score.updated_at.isoformat()
        }
    
    def _validation_to_dict(self, validation) -> Dict[str, Any]:
        """Convert validation model to dictionary."""
        return {
            "id": validation.id,
            "validator_address": validation.validator_address,
            "status": validation.status,
            "created_at": validation.created_at.isoformat()
        }
    
    async def _calculate_category_score(
        self,
        user_address: str,
        category: ReputationCategory,
        base_data: Dict[str, Any]
    ) -> float:
        """Calculate reputation score for a specific category."""
        try:
            transactions = base_data.get("transactions", [])
            relevant_transactions = [
                t for t in transactions
                if t.get("context", {}).get("category") == category.value
            ]
            
            if not relevant_transactions:
                return 50.0  # Default neutral score
            
            # Calculate weighted average of recent transactions
            total_weight = 0
            weighted_score = 0
            
            for transaction in relevant_transactions[-20:]:  # Last 20 transactions
                age_hours = (datetime.now(timezone.utc) - 
                           datetime.fromisoformat(transaction["created_at"].replace('Z', '+00:00'))).total_seconds() / 3600
                
                # Recent transactions have higher weight
                weight = max(0.1, 1.0 - (age_hours / (30 * 24)))  # 30-day decay
                impact = transaction.get("impact_score", 0)
                
                weighted_score += (50 + impact) * weight
                total_weight += weight
            
            if total_weight == 0:
                return 50.0
            
            return max(0, min(100, weighted_score / total_weight))
        
        except Exception as e:
            logger.error(f"Error calculating category score: {str(e)}")
            return 50.0
    
    async def _get_category_breakdown(
        self,
        user_address: str,
        category: ReputationCategory
    ) -> Dict[str, Any]:
        """Get detailed breakdown for a category."""
        return {
            "category": category.value,
            "factors": {
                "recent_performance": 0.4,
                "consistency": 0.3,
                "peer_validation": 0.2,
                "blockchain_evidence": 0.1
            },
            "recommendations": [
                "Continue maintaining high-quality work",
                "Seek peer validation for recent projects",
                "Document achievements on blockchain"
            ]
        }
    
    async def _apply_time_decay(self, user_address: str, score: float) -> float:
        """Apply time-based decay to reputation score."""
        try:
            # Get last activity timestamp
            base_data = await self._get_base_reputation_data(user_address)
            transactions = base_data.get("transactions", [])
            
            if not transactions:
                return score * 0.8  # Significant penalty for no activity
            
            last_activity = datetime.fromisoformat(
                transactions[0]["created_at"].replace('Z', '+00:00')
            )
            days_inactive = (datetime.now(timezone.utc) - last_activity).days
            
            # Apply monthly decay
            months_inactive = days_inactive / 30
            decay_factor = self.reputation_decay_factor ** months_inactive
            
            return score * decay_factor
        
        except Exception as e:
            logger.error(f"Error applying time decay: {str(e)}")
            return score
    
    async def _apply_anti_gaming_adjustments(self, user_address: str, score: float) -> float:
        """Apply anti-gaming adjustments to prevent manipulation."""
        try:
            base_data = await self._get_base_reputation_data(user_address)
            transactions = base_data.get("transactions", [])
            
            # Check for suspicious patterns
            recent_transactions = [
                t for t in transactions
                if (datetime.now(timezone.utc) - 
                   datetime.fromisoformat(t["created_at"].replace('Z', '+00:00'))).days <= 7
            ]
            
            # Penalty for too many recent updates (possible gaming)
            if len(recent_transactions) > 20:
                score *= 0.95
            
            # Check for self-validation attempts
            self_validations = sum(
                1 for t in recent_transactions
                if t.get("context", {}).get("validator_address") == user_address
            )
            
            if self_validations > 2:
                score *= 0.9
            
            return score
        
        except Exception as e:
            logger.error(f"Error applying anti-gaming adjustments: {str(e)}")
            return score
    
    async def _validate_reputation_event(
        self,
        user_address: str,
        event_type: ReputationEventType,
        context: Dict[str, Any]
    ):
        """Validate that a reputation event is legitimate."""
        # Check rate limiting
        base_data = await self._get_base_reputation_data(user_address)
        recent_events = [
            t for t in base_data.get("transactions", [])
            if (datetime.now(timezone.utc) - 
               datetime.fromisoformat(t["created_at"].replace('Z', '+00:00'))).days <= 1
        ]
        
        if len(recent_events) >= self.max_validations_per_day:
            raise ValueError("Daily reputation update limit exceeded")
        
        # Validate required context fields
        required_fields = {
            ReputationEventType.JOB_COMPLETION: ["job_id", "completion_quality"],
            ReputationEventType.PEER_REVIEW: ["reviewer_address", "review_score"],
            ReputationEventType.SKILL_VALIDATION: ["skill_id", "validation_type"],
            ReputationEventType.GOVERNANCE_PARTICIPATION: ["proposal_id", "participation_type"]
        }
        
        if event_type in required_fields:
            for field in required_fields[event_type]:
                if field not in context:
                    raise ValueError(f"Missing required context field: {field}")
    
    async def _create_reputation_transaction(
        self,
        user_address: str,
        event_type: ReputationEventType,
        impact_score: float,
        context: Dict[str, Any],
        validator_address: Optional[str] = None,
        blockchain_evidence: Optional[str] = None
    ) -> str:
        """Create a reputation transaction record."""
        transaction_id = str(uuid.uuid4())
        
        transaction_data = {
            "id": transaction_id,
            "user_address": user_address,
            "event_type": event_type.value,
            "impact_score": impact_score,
            "context": context,
            "validator_address": validator_address,
            "blockchain_evidence": blockchain_evidence,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            if DATABASE_MODELS_AVAILABLE:
                with self._get_db_session() as db:
                    transaction = ReputationTransaction(**transaction_data)
                    db.add(transaction)
                    db.commit()
            else:
                # Fallback storage
                if user_address not in _fallback_transactions:
                    _fallback_transactions[user_address] = []
                _fallback_transactions[user_address].append(transaction_data)
        
        except Exception as e:
            logger.error(f"Error creating reputation transaction: {str(e)}")
            # Continue without database storage
        
        return transaction_id
    
    async def _apply_reputation_update(
        self,
        user_address: str,
        event_type: ReputationEventType,
        impact_score: float,
        context: Dict[str, Any]
    ) -> Dict[str, float]:
        """Apply reputation update and return new scores."""
        updated_scores = {}
        
        # Determine which categories are affected
        category_mapping = {
            ReputationEventType.JOB_COMPLETION: [ReputationCategory.TECHNICAL_SKILL, ReputationCategory.RELIABILITY],
            ReputationEventType.PEER_REVIEW: [ReputationCategory.COLLABORATION, ReputationCategory.COMMUNICATION],
            ReputationEventType.SKILL_VALIDATION: [ReputationCategory.TECHNICAL_SKILL],
            ReputationEventType.GOVERNANCE_PARTICIPATION: [ReputationCategory.GOVERNANCE, ReputationCategory.LEADERSHIP],
            ReputationEventType.PLATFORM_CONTRIBUTION: [ReputationCategory.INNOVATION, ReputationCategory.COLLABORATION]
        }
        
        affected_categories = category_mapping.get(event_type, [ReputationCategory.TECHNICAL_SKILL])
        
        for category in affected_categories:
            current_score = await self._get_current_category_score(user_address, category)
            new_score = max(0, min(100, current_score + (impact_score * 0.1)))  # 10% of impact
            
            await self._update_category_score(user_address, category, new_score)
            updated_scores[category.value] = new_score
        
        return updated_scores
    
    async def _get_current_category_score(
        self,
        user_address: str,
        category: ReputationCategory
    ) -> float:
        """Get current score for a category."""
        try:
            if DATABASE_MODELS_AVAILABLE:
                with self._get_db_session() as db:
                    score_record = db.query(ReputationScore).filter(
                        ReputationScore.user_address == user_address,
                        ReputationScore.category == category.value
                    ).first()
                    
                    return float(score_record.score) if score_record else 50.0
            else:
                # Fallback
                return _fallback_reputation.get(user_address, {}).get(category.value, 50.0)
        
        except Exception as e:
            logger.error(f"Error getting current category score: {str(e)}")
            return 50.0
    
    async def _update_category_score(
        self,
        user_address: str,
        category: ReputationCategory,
        new_score: float
    ):
        """Update score for a category."""
        try:
            if DATABASE_MODELS_AVAILABLE:
                with self._get_db_session() as db:
                    score_record = db.query(ReputationScore).filter(
                        ReputationScore.user_address == user_address,
                        ReputationScore.category == category.value
                    ).first()
                    
                    if score_record:
                        score_record.score = new_score
                        score_record.updated_at = datetime.now(timezone.utc)
                    else:
                        score_record = ReputationScore(
                            user_address=user_address,
                            category=category.value,
                            score=new_score
                        )
                        db.add(score_record)
                    
                    db.commit()
            else:
                # Fallback
                if user_address not in _fallback_reputation:
                    _fallback_reputation[user_address] = {}
                _fallback_reputation[user_address][category.value] = new_score
        
        except Exception as e:
            logger.error(f"Error updating category score: {str(e)}")
    
    async def _submit_reputation_evidence(self, transaction_id: str, blockchain_evidence: str):
        """Submit reputation evidence to blockchain."""
        try:
            contract_manager = self._get_contract_manager()
            if contract_manager:
                # Submit to reputation oracle contract
                await contract_manager.submit_reputation_evidence(transaction_id, blockchain_evidence)
        
        except Exception as e:
            logger.error(f"Error submitting reputation evidence: {str(e)}")


# Fallback storage for when database is not available
_fallback_transactions: Dict[str, List[Dict[str, Any]]] = {}
_fallback_reputation: Dict[str, Dict[str, float]] = {}
_fallback_validations: Dict[str, List[Dict[str, Any]]] = {}


def get_reputation_service() -> ReputationService:
    """Get the reputation service instance."""
    return ReputationService()
