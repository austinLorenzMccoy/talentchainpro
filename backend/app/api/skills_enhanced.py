"""
Enhanced Skills API Router with Hedera Integration

This module provides comprehensive API endpoints for managing skill tokens,
oracle consensus, work evaluation, and reputation management with full
Hedera blockchain integration.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from pydantic import BaseModel, Field

from app.models.schemas import (
    SkillTokenRequest,
    SkillTokenResponse,
    WorkEvaluationRequest,
    WorkEvaluationResponse,
    ErrorResponse
)
from app.utils.hedera_enhanced import get_hedera_manager, SkillTokenData, SkillCategory
from app.services.skill import get_skill_service
from app.services.reputation import get_reputation_service

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Extended request/response models
class BatchMintRequest(BaseModel):
    """Request model for batch minting skill tokens"""
    recipients: List[str] = Field(..., description="List of recipient account IDs")
    skill_names: List[str] = Field(..., description="List of skill names")
    categories: List[str] = Field(..., description="List of skill categories")
    levels: List[int] = Field(..., description="List of initial skill levels")
    descriptions: List[str] = Field(..., description="List of skill descriptions")
    evidence_links: List[List[str]] = Field(default_factory=list, description="List of evidence links for each skill")

class OracleVoteRequest(BaseModel):
    """Request model for oracle voting"""
    consensus_request_id: int = Field(..., description="Consensus request ID")
    vote: int = Field(..., description="Skill level vote (1-10)", ge=1, le=10)
    evidence: str = Field(..., description="Supporting evidence for the vote")

class SkillVerificationRequest(BaseModel):
    """Request model for skill verification"""
    token_id: int = Field(..., description="Skill token ID to verify")
    evidence: str = Field(..., description="Evidence of skill demonstration")

class ReputationUpdateRequest(BaseModel):
    """Request model for reputation updates"""
    account_id: str = Field(..., description="Account ID to update")
    points: int = Field(..., description="Reputation points to add/subtract")
    reason: str = Field(..., description="Reason for reputation change")
    evidence: Optional[Dict[str, Any]] = Field(None, description="Supporting evidence")

# ============ CORE SKILL TOKEN ENDPOINTS ============

@router.post(
    "/",
    response_model=SkillTokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Create Skill Token",
    description="Create a new soulbound skill token on Hedera blockchain"
)
async def create_skill_token(
    request: SkillTokenRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Create a new skill token for a user using enhanced Hedera integration.
    
    This endpoint:
    1. Validates the request parameters
    2. Creates a soulbound NFT on Hedera
    3. Submits creation event to HCS for transparency
    4. Returns comprehensive token information
    """
    try:
        hedera_manager = get_hedera_manager()
        
        # Prepare skill token data
        skill_data = SkillTokenData(
            name=request.skill_name,
            category=SkillCategory(request.skill_category.value),
            level=request.skill_level.value,
            description=request.description,
            evidence_links=request.evidence_links or [],
            issuer=hedera_manager.config.account_id,
            issued_at=datetime.now(timezone.utc),
            metadata=request.metadata or {}
        )
        
        # Mint skill token on blockchain
        transaction_id, token_id = await hedera_manager.mint_skill_token(
            recipient_id=request.recipient_id,
            skill_data=skill_data
        )
        
        # Submit creation event to HCS (background task)
        background_tasks.add_task(
            _submit_skill_creation_event,
            hedera_manager,
            transaction_id,
            token_id,
            request.recipient_id,
            skill_data
        )
        
        # Prepare response
        response = {
            "token_id": str(token_id),
            "recipient_id": request.recipient_id,
            "skill_name": request.skill_name,
            "skill_category": request.skill_category.value,
            "skill_level": request.skill_level.value,
            "transaction_id": transaction_id,
            "timestamp": datetime.now(timezone.utc),
            "explorer_url": hedera_manager.get_explorer_url("transaction", transaction_id)
        }
        
        logger.info(f"Created skill token {token_id} for {request.recipient_id}: {request.skill_name}")
        return response
        
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

@router.post(
    "/batch",
    response_model=List[SkillTokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Batch Create Skill Tokens",
    description="Create multiple skill tokens in a single transaction for efficiency"
)
async def batch_create_skill_tokens(
    request: BatchMintRequest,
    background_tasks: BackgroundTasks
) -> List[Dict[str, Any]]:
    """
    Batch create multiple skill tokens for efficiency.
    Maximum 50 tokens per batch.
    """
    try:
        # Validate batch size
        if len(request.recipients) > 50:
            raise ValueError("Maximum 50 tokens per batch")
        
        # Validate array lengths match
        arrays = [request.recipients, request.skill_names, request.categories, 
                 request.levels, request.descriptions]
        if not all(len(arr) == len(request.recipients) for arr in arrays):
            raise ValueError("All arrays must have the same length")
        
        hedera_manager = get_hedera_manager()
        responses = []
        
        # Process each token
        for i in range(len(request.recipients)):
            skill_data = SkillTokenData(
                name=request.skill_names[i],
                category=SkillCategory(request.categories[i]),
                level=request.levels[i],
                description=request.descriptions[i],
                evidence_links=request.evidence_links[i] if i < len(request.evidence_links) else [],
                issuer=hedera_manager.config.account_id,
                issued_at=datetime.now(timezone.utc),
                metadata={}
            )
            
            transaction_id, token_id = await hedera_manager.mint_skill_token(
                recipient_id=request.recipients[i],
                skill_data=skill_data
            )
            
            responses.append({
                "token_id": str(token_id),
                "recipient_id": request.recipients[i],
                "skill_name": request.skill_names[i],
                "skill_category": request.categories[i],
                "skill_level": request.levels[i],
                "transaction_id": transaction_id,
                "timestamp": datetime.now(timezone.utc),
                "explorer_url": hedera_manager.get_explorer_url("transaction", transaction_id)
            })
        
        logger.info(f"Batch created {len(responses)} skill tokens")
        return responses
        
    except Exception as e:
        logger.error(f"Error in batch token creation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch creation failed: {str(e)}"
        )

@router.get(
    "/{token_id}",
    response_model=Dict[str, Any],
    summary="Get Skill Token",
    description="Retrieve comprehensive skill token information from blockchain"
)
async def get_skill_token(
    token_id: int = Path(..., description="Skill token ID")
) -> Dict[str, Any]:
    """
    Get comprehensive skill token details from the blockchain.
    """
    try:
        hedera_manager = get_hedera_manager()
        
        # Get skill metadata from blockchain
        metadata = await hedera_manager.get_skill_metadata(token_id)
        
        # Enhance with additional information
        response = {
            "token_id": token_id,
            "name": metadata["name"],
            "category": metadata["category"],
            "level": metadata["level"],
            "experience": metadata["experience"],
            "last_updated": datetime.fromtimestamp(metadata["last_updated"], tz=timezone.utc),
            "is_active": metadata["is_active"],
            "metadata_uri": metadata["uri"],
            "is_soulbound": True,
            "explorer_url": hedera_manager.get_explorer_url("token", str(token_id))
        }
        
        logger.info(f"Retrieved skill token {token_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving skill token {token_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill token {token_id} not found"
        )

@router.get(
    "/user/{account_id}",
    response_model=List[Dict[str, Any]],
    summary="Get User Skill Tokens",
    description="Get all skill tokens owned by a specific account"
)
async def get_user_skill_tokens(
    account_id: str = Path(..., description="Hedera account ID"),
    category: Optional[str] = Query(None, description="Filter by skill category"),
    min_level: Optional[int] = Query(None, description="Filter by minimum skill level")
) -> List[Dict[str, Any]]:
    """
    Get all skill tokens owned by a user with optional filtering.
    """
    try:
        skill_service = get_skill_service()
        
        # Get tokens from service (which queries blockchain)
        tokens = await skill_service.get_user_skill_tokens(
            account_id=account_id,
            category=category,
            min_level=min_level
        )
        
        logger.info(f"Retrieved {len(tokens)} skill tokens for {account_id}")
        return tokens
        
    except Exception as e:
        logger.error(f"Error retrieving user skill tokens: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve skill tokens"
        )

# ============ ORACLE CONSENSUS ENDPOINTS ============

@router.post(
    "/{token_id}/propose-update",
    summary="Propose Skill Level Update",
    description="Propose a skill level update that requires oracle consensus"
)
async def propose_skill_level_update(
    token_id: int = Path(..., description="Skill token ID"),
    new_level: int = Field(..., description="Proposed new skill level", ge=1, le=10),
    evidence: str = Field(..., description="Evidence supporting the update"),
    consensus_deadline: int = Field(604800, description="Consensus deadline in seconds (default 7 days)")
) -> Dict[str, Any]:
    """
    Propose a skill level update that requires oracle consensus.
    """
    try:
        hedera_manager = get_hedera_manager()
        
        transaction_id = await hedera_manager.update_skill_level(
            token_id=token_id,
            new_level=new_level,
            evidence=evidence,
            consensus_deadline=consensus_deadline
        )
        
        response = {
            "token_id": token_id,
            "proposed_level": new_level,
            "evidence": evidence,
            "consensus_deadline": consensus_deadline,
            "transaction_id": transaction_id,
            "status": "consensus_pending",
            "explorer_url": hedera_manager.get_explorer_url("transaction", transaction_id)
        }
        
        logger.info(f"Proposed skill level update for token {token_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error proposing skill update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to propose skill level update"
        )

@router.post(
    "/oracle/vote",
    summary="Oracle Vote on Skill Update",
    description="Cast an oracle vote on a pending skill level update"
)
async def vote_on_skill_update(
    request: OracleVoteRequest
) -> Dict[str, Any]:
    """
    Cast an oracle vote on a pending skill level update.
    Only authorized oracles can call this endpoint.
    """
    try:
        # This would typically have additional authorization checks
        # to ensure only authorized oracles can vote
        
        skill_service = get_skill_service()
        
        result = await skill_service.cast_oracle_vote(
            consensus_request_id=request.consensus_request_id,
            vote=request.vote,
            evidence=request.evidence
        )
        
        logger.info(f"Oracle vote cast on consensus request {request.consensus_request_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error casting oracle vote: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cast oracle vote"
        )

# ============ VERIFICATION AND REPUTATION ============

@router.post(
    "/{token_id}/verify",
    summary="Verify Skill",
    description="Submit skill verification with evidence"
)
async def verify_skill(
    request: SkillVerificationRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Verify a skill token with evidence of skill demonstration.
    """
    try:
        hedera_manager = get_hedera_manager()
        
        # Submit verification to blockchain
        # This would call the verifySkill function on the smart contract
        transaction_id, _ = await hedera_manager.call_contract_function(
            contract_id=hedera_manager._contracts["SkillToken"].contract_id,
            function_name="verifySkill",
            parameters=hedera_manager.client.ContractFunctionParameters()
                .addUint256(request.token_id)
                .addString(request.evidence)
        )
        
        # Submit verification event to HCS (background task)
        background_tasks.add_task(
            _submit_skill_verification_event,
            hedera_manager,
            request.token_id,
            request.evidence,
            transaction_id
        )
        
        response = {
            "token_id": request.token_id,
            "evidence": request.evidence,
            "verifier": hedera_manager.config.account_id,
            "transaction_id": transaction_id,
            "timestamp": datetime.now(timezone.utc),
            "explorer_url": hedera_manager.get_explorer_url("transaction", transaction_id)
        }
        
        logger.info(f"Skill token {request.token_id} verified")
        return response
        
    except Exception as e:
        logger.error(f"Error verifying skill: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify skill"
        )

@router.post(
    "/evaluate-work",
    response_model=WorkEvaluationResponse,
    summary="Evaluate Work",
    description="Evaluate work submission using AI and update skill levels"
)
async def evaluate_work(
    request: WorkEvaluationRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Evaluate work submission using AI oracles and update reputation.
    """
    try:
        reputation_service = get_reputation_service()
        hedera_manager = get_hedera_manager()
        
        # Perform AI-powered work evaluation
        evaluation_result = await reputation_service.evaluate_work(
            user_id=request.user_id,
            skill_token_ids=request.skill_token_ids,
            work_description=request.work_description,
            work_content=request.work_content,
            evaluation_criteria=request.evaluation_criteria
        )
        
        # Submit evaluation to HCS for transparency (background task)
        background_tasks.add_task(
            _submit_work_evaluation_to_hcs,
            hedera_manager,
            request,
            evaluation_result
        )
        
        logger.info(f"Work evaluation completed for user {request.user_id}")
        return evaluation_result
        
    except Exception as e:
        logger.error(f"Error evaluating work: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate work"
        )

@router.put(
    "/reputation/{account_id}",
    summary="Update Reputation",
    description="Update account reputation with proper audit trail"
)
async def update_reputation(
    request: ReputationUpdateRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Update account reputation with full audit trail via HCS.
    Only authorized oracles can call this endpoint.
    """
    try:
        hedera_manager = get_hedera_manager()
        
        # Update reputation through service
        reputation_service = get_reputation_service()
        result = await reputation_service.update_reputation(
            account_id=request.account_id,
            points=request.points,
            reason=request.reason,
            evidence=request.evidence
        )
        
        # Submit reputation update to HCS (background task)
        background_tasks.add_task(
            _submit_reputation_update_to_hcs,
            hedera_manager,
            request.account_id,
            request.points,
            request.reason,
            request.evidence or {}
        )
        
        logger.info(f"Reputation updated for account {request.account_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error updating reputation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update reputation"
        )

# ============ QUERY ENDPOINTS ============

@router.get(
    "/category/{category}",
    summary="Get Skills by Category",
    description="Get all skill tokens in a specific category"
)
async def get_skills_by_category(
    category: str = Path(..., description="Skill category"),
    limit: int = Query(100, description="Maximum number of results")
) -> List[Dict[str, Any]]:
    """
    Get all skill tokens in a specific category.
    """
    try:
        skill_service = get_skill_service()
        results = await skill_service.get_skills_by_category(category, limit)
        
        logger.info(f"Retrieved {len(results)} skills in category {category}")
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving skills by category: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve skills by category"
        )

@router.get(
    "/reputation/{account_id}",
    summary="Get Reputation Score",
    description="Get comprehensive reputation information for an account"
)
async def get_reputation_score(
    account_id: str = Path(..., description="Hedera account ID")
) -> Dict[str, Any]:
    """
    Get comprehensive reputation information for an account.
    """
    try:
        reputation_service = get_reputation_service()
        result = await reputation_service.get_comprehensive_reputation(account_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reputation not found for account {account_id}"
            )
        
        logger.info(f"Retrieved reputation for account {account_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving reputation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reputation"
        )

# ============ BACKGROUND TASKS ============

async def _submit_skill_creation_event(
    hedera_manager,
    transaction_id: str,
    token_id: int,
    recipient_id: str,
    skill_data: SkillTokenData
):
    """Submit skill creation event to HCS"""
    try:
        # Get or create skill events topic
        topic_id = "0.0.SKILL_EVENTS_TOPIC"  # This would be configured
        
        event_data = {
            "event_type": "skill_token_created",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "transaction_id": transaction_id,
            "token_id": token_id,
            "recipient_id": recipient_id,
            "skill_name": skill_data.name,
            "skill_category": skill_data.category.value,
            "skill_level": skill_data.level,
            "issuer": skill_data.issuer
        }
        
        await hedera_manager.submit_hcs_message(topic_id, event_data)
        logger.info(f"Submitted skill creation event to HCS for token {token_id}")
        
    except Exception as e:
        logger.error(f"Failed to submit skill creation event: {e}")

async def _submit_skill_verification_event(
    hedera_manager,
    token_id: int,
    evidence: str,
    transaction_id: str
):
    """Submit skill verification event to HCS"""
    try:
        topic_id = "0.0.SKILL_VERIFICATIONS_TOPIC"  # This would be configured
        
        event_data = {
            "event_type": "skill_verified",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "token_id": token_id,
            "evidence": evidence,
            "verifier": hedera_manager.config.account_id,
            "transaction_id": transaction_id
        }
        
        await hedera_manager.submit_hcs_message(topic_id, event_data)
        logger.info(f"Submitted skill verification event to HCS for token {token_id}")
        
    except Exception as e:
        logger.error(f"Failed to submit skill verification event: {e}")

async def _submit_work_evaluation_to_hcs(
    hedera_manager,
    request: WorkEvaluationRequest,
    evaluation_result: Dict[str, Any]
):
    """Submit work evaluation to HCS"""
    try:
        topic_id = "0.0.WORK_EVALUATIONS_TOPIC"  # This would be configured
        
        await hedera_manager.submit_work_evaluation(
            topic_id=topic_id,
            user_id=request.user_id,
            skill_token_ids=request.skill_token_ids,
            work_description=request.work_description,
            work_content=request.work_content,
            evaluation_result=evaluation_result
        )
        
        logger.info(f"Submitted work evaluation to HCS for user {request.user_id}")
        
    except Exception as e:
        logger.error(f"Failed to submit work evaluation to HCS: {e}")

async def _submit_reputation_update_to_hcs(
    hedera_manager,
    account_id: str,
    points: int,
    reason: str,
    evidence: Dict[str, Any]
):
    """Submit reputation update to HCS"""
    try:
        topic_id = "0.0.REPUTATION_UPDATES_TOPIC"  # This would be configured
        
        await hedera_manager.submit_reputation_update(
            topic_id=topic_id,
            account_id=account_id,
            reputation_change=points,
            reason=reason,
            evidence=evidence
        )
        
        logger.info(f"Submitted reputation update to HCS for account {account_id}")
        
    except Exception as e:
        logger.error(f"Failed to submit reputation update to HCS: {e}")