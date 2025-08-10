"""
Governance API Endpoints

This module provides REST API endpoints for DAO governance functionality
including proposal management, voting, delegation, and governance analytics.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

from app.services.governance import get_governance_service, GovernanceService, ProposalType, VoteType
from app.utils.hedera import validate_hedera_address

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/governance", tags=["governance"])

# ============ REQUEST/RESPONSE MODELS ============

class CreateProposalRequest(BaseModel):
    """Request model for creating a governance proposal."""
    proposer_address: str = Field(..., description="Proposer's Hedera account address")
    title: str = Field(..., min_length=10, max_length=200, description="Proposal title")
    description: str = Field(..., min_length=50, description="Detailed proposal description")
    proposal_type: str = Field(..., description="Type of proposal")
    targets: List[str] = Field(..., description="Target contract addresses")
    values: List[int] = Field(..., description="Values to send with calls")
    calldatas: List[str] = Field(..., description="Encoded function calls")
    ipfs_hash: Optional[str] = Field(None, description="IPFS hash for additional content")
    is_emergency: bool = Field(False, description="Whether this is an emergency proposal")
    
    @validator('proposer_address')
    def validate_proposer_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('proposal_type')
    def validate_proposal_type(cls, v):
        valid_types = [pt.value for pt in ProposalType]
        if v not in valid_types:
            raise ValueError(f'Invalid proposal type. Must be one of: {valid_types}')
        return v
    
    @validator('targets', 'values', 'calldatas')
    def validate_arrays_same_length(cls, v, values):
        if 'targets' in values.data and 'values' in values.data:
            if len(v) != len(values.data['targets']) or len(v) != len(values.data['values']):
                raise ValueError('targets, values, and calldatas must have the same length')
        return v

class CastVoteRequest(BaseModel):
    """Request model for casting a vote."""
    voter_address: str = Field(..., description="Voter's Hedera account address")
    vote_type: str = Field(..., description="Type of vote (for, against, abstain)")
    reason: Optional[str] = Field("", description="Optional reason for the vote")
    signature: Optional[str] = Field(None, description="Optional signature for gasless voting")
    
    @validator('voter_address')
    def validate_voter_address(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v
    
    @validator('vote_type')
    def validate_vote_type(cls, v):
        valid_votes = [vt.value for vt in VoteType]
        if v not in valid_votes:
            raise ValueError(f'Invalid vote type. Must be one of: {valid_votes}')
        return v

class DelegateRequest(BaseModel):
    """Request model for delegating voting power."""
    delegator_address: str = Field(..., description="Delegator's Hedera account address")
    delegatee_address: str = Field(..., description="Delegatee's Hedera account address")
    
    @validator('delegator_address', 'delegatee_address')
    def validate_addresses(cls, v):
        if not validate_hedera_address(v):
            raise ValueError('Invalid Hedera address format')
        return v

class ProposalResponse(BaseModel):
    """Response model for proposal data."""
    proposal_id: str
    proposer_address: str
    title: str
    description: str
    proposal_type: str
    status: str
    start_time: str
    end_time: str
    for_votes: int
    against_votes: int
    abstain_votes: int
    total_votes: int
    created_at: str
    current_status: str
    votes: Optional[List[Dict[str, Any]]] = None
    ai_analysis: Optional[Dict[str, Any]] = None

class VoteResponse(BaseModel):
    """Response model for vote data."""
    vote_id: str
    proposal_id: str
    voter_address: str
    vote_type: str
    voting_power: int
    reason: str
    cast_at: str
    proposal_status: str

class VotingPowerResponse(BaseModel):
    """Response model for voting power data."""
    user_address: str
    base_voting_power: int
    delegated_voting_power: int
    total_voting_power: int
    has_delegated: bool
    delegated_to: Optional[str]
    calculation_method: str
    last_updated: str

# ============ API ENDPOINTS ============

@router.post("/proposals", response_model=Dict[str, Any])
async def create_proposal(
    request: CreateProposalRequest,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Create a new governance proposal.
    
    Creates a new proposal for community voting. The proposer must have
    sufficient voting power unless it's an emergency proposal.
    """
    try:
        result = await governance_service.create_proposal(
            proposer_address=request.proposer_address,
            title=request.title,
            description=request.description,
            proposal_type=ProposalType(request.proposal_type),
            targets=request.targets,
            values=request.values,
            calldatas=request.calldatas,
            ipfs_hash=request.ipfs_hash,
            is_emergency=request.is_emergency
        )
        
        logger.info(f"Created proposal {result['proposal_id']} by {request.proposer_address}")
        return result
    
    except ValueError as e:
        logger.warning(f"Validation error creating proposal: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating proposal: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create proposal")

@router.post("/proposals/emergency", response_model=Dict[str, Any])
async def create_emergency_proposal(
    request: CreateProposalRequest,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Create an emergency governance proposal.
    
    Emergency proposals have shorter voting periods and may bypass
    certain validation requirements.
    """
    try:
        # Force emergency flag
        request.is_emergency = True
        
        result = await governance_service.create_proposal(
            proposer_address=request.proposer_address,
            title=f"[EMERGENCY] {request.title}",
            description=request.description,
            proposal_type=ProposalType(request.proposal_type),
            targets=request.targets,
            values=request.values,
            calldatas=request.calldatas,
            ipfs_hash=request.ipfs_hash,
            is_emergency=True
        )
        
        logger.info(f"Created emergency proposal {result['proposal_id']} by {request.proposer_address}")
        return result
    
    except ValueError as e:
        logger.warning(f"Validation error creating emergency proposal: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating emergency proposal: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create emergency proposal")

@router.get("/proposals", response_model=List[Dict[str, Any]])
async def list_proposals(
    status: Optional[str] = Query(None, description="Filter by proposal status"),
    proposer_address: Optional[str] = Query(None, description="Filter by proposer address"),
    proposal_type: Optional[str] = Query(None, description="Filter by proposal type"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    governance_service: GovernanceService = Depends(get_governance_service)
) -> List[Dict[str, Any]]:
    """
    List governance proposals with optional filters.
    
    Returns a paginated list of proposals, optionally filtered by status,
    proposer, or proposal type.
    """
    try:
        # Validate proposer address if provided
        if proposer_address and not validate_hedera_address(proposer_address):
            raise HTTPException(status_code=400, detail="Invalid proposer address format")
        
        proposals = await governance_service.list_proposals(
            status=status,
            proposer_address=proposer_address,
            proposal_type=proposal_type,
            limit=limit,
            offset=offset
        )
        
        logger.info(f"Listed {len(proposals)} proposals with filters: status={status}, proposer={proposer_address}")
        return proposals
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing proposals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list proposals")

@router.get("/proposals/{proposal_id}", response_model=Dict[str, Any])
async def get_proposal(
    proposal_id: str,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Get detailed information about a specific proposal.
    
    Returns comprehensive proposal data including vote counts,
    voter information, and current status.
    """
    try:
        proposal = await governance_service.get_proposal(proposal_id)
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        logger.info(f"Retrieved proposal {proposal_id}")
        return proposal
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving proposal {proposal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve proposal")

@router.post("/proposals/{proposal_id}/vote", response_model=Dict[str, Any])
async def cast_vote(
    proposal_id: str,
    request: CastVoteRequest,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Cast a vote on a governance proposal.
    
    Allows eligible users to vote FOR, AGAINST, or ABSTAIN on active proposals.
    Voting power is calculated based on skill tokens and reputation.
    """
    try:
        result = await governance_service.cast_vote(
            proposal_id=proposal_id,
            voter_address=request.voter_address,
            vote_type=VoteType(request.vote_type),
            reason=request.reason,
            signature=request.signature
        )
        
        logger.info(f"Vote cast on proposal {proposal_id} by {request.voter_address}: {request.vote_type}")
        return result
    
    except ValueError as e:
        logger.warning(f"Validation error casting vote: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error casting vote on proposal {proposal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cast vote")

@router.post("/delegate", response_model=Dict[str, Any])
async def delegate_voting_power(
    request: DelegateRequest,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Delegate voting power to another address.
    
    Allows users to delegate their voting power to another trusted address.
    The delegatee can then vote with the combined power.
    """
    try:
        result = await governance_service.delegate_voting_power(
            delegator_address=request.delegator_address,
            delegatee_address=request.delegatee_address
        )
        
        logger.info(f"Voting power delegated from {request.delegator_address} to {request.delegatee_address}")
        return result
    
    except ValueError as e:
        logger.warning(f"Validation error delegating voting power: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error delegating voting power: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delegate voting power")

@router.delete("/delegate")
async def undelegate_voting_power(
    delegator_address: str = Query(..., description="Address to remove delegation from"),
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Remove delegation and reclaim voting power.
    
    Allows users to reclaim their delegated voting power and vote directly.
    """
    try:
        if not validate_hedera_address(delegator_address):
            raise HTTPException(status_code=400, detail="Invalid delegator address format")
        
        # For undelegation, we delegate to self (effectively removing delegation)
        result = await governance_service.delegate_voting_power(
            delegator_address=delegator_address,
            delegatee_address=delegator_address
        )
        
        logger.info(f"Voting power undelegated for {delegator_address}")
        return {
            "success": True,
            "delegator_address": delegator_address,
            "message": "Voting power reclaimed successfully",
            "undelegated_at": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error undelegating voting power: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to undelegate voting power")

@router.get("/voting-power/{user_address}", response_model=Dict[str, Any])
async def get_voting_power(
    user_address: str,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Get comprehensive voting power information for a user.
    
    Returns base voting power, delegated power, and delegation status.
    """
    try:
        if not validate_hedera_address(user_address):
            raise HTTPException(status_code=400, detail="Invalid user address format")
        
        voting_power_info = await governance_service.get_voting_power(user_address)
        
        logger.info(f"Retrieved voting power for {user_address}: {voting_power_info['total_voting_power']}")
        return voting_power_info
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving voting power for {user_address}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve voting power")

@router.get("/proposals/active", response_model=List[Dict[str, Any]])
async def get_active_proposals(
    governance_service: GovernanceService = Depends(get_governance_service)
) -> List[Dict[str, Any]]:
    """
    Get all currently active proposals.
    
    Returns proposals that are currently in the voting period.
    """
    try:
        active_proposals = await governance_service.list_proposals(
            status="active",
            limit=100
        )
        
        logger.info(f"Retrieved {len(active_proposals)} active proposals")
        return active_proposals
    
    except Exception as e:
        logger.error(f"Error retrieving active proposals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve active proposals")

@router.get("/proposals/user/{user_address}", response_model=List[Dict[str, Any]])
async def get_user_proposals(
    user_address: str,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> List[Dict[str, Any]]:
    """
    Get all proposals created by a specific user.
    
    Returns proposals where the user is the proposer.
    """
    try:
        if not validate_hedera_address(user_address):
            raise HTTPException(status_code=400, detail="Invalid user address format")
        
        user_proposals = await governance_service.list_proposals(
            proposer_address=user_address,
            limit=100
        )
        
        logger.info(f"Retrieved {len(user_proposals)} proposals for user {user_address}")
        return user_proposals
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving proposals for user {user_address}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user proposals")

@router.get("/settings", response_model=Dict[str, Any])
async def get_governance_settings(
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Get current governance settings and parameters.
    
    Returns voting periods, thresholds, and other governance parameters.
    """
    try:
        settings = {
            "voting_delay_hours": governance_service.voting_delay / 3600,
            "voting_period_days": governance_service.voting_period / (24 * 3600),
            "proposal_threshold": governance_service.proposal_threshold,
            "quorum_threshold_percent": governance_service.quorum_threshold * 100,
            "execution_delay_hours": governance_service.execution_delay / 3600,
            "proposal_types": [pt.value for pt in ProposalType],
            "vote_types": [vt.value for vt in VoteType],
            "last_updated": datetime.now().isoformat()
        }
        
        logger.info("Retrieved governance settings")
        return settings
    
    except Exception as e:
        logger.error(f"Error retrieving governance settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve governance settings")

# ============ ADDITIONAL ENDPOINTS FOR ADVANCED GOVERNANCE ============

@router.post("/proposals/{proposal_id}/queue")
async def queue_proposal(
    proposal_id: str,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Queue a successful proposal for execution.
    
    Moves a succeeded proposal to the execution queue with timelock.
    """
    try:
        # This would implement proposal queuing logic
        # For now, return a mock response
        
        proposal = await governance_service.get_proposal(proposal_id)
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        if proposal["current_status"] != "succeeded":
            raise HTTPException(status_code=400, detail="Only succeeded proposals can be queued")
        
        return {
            "success": True,
            "proposal_id": proposal_id,
            "status": "queued",
            "execution_time": (datetime.now() + timedelta(seconds=governance_service.execution_delay)).isoformat(),
            "queued_at": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error queueing proposal {proposal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to queue proposal")

@router.post("/proposals/{proposal_id}/execute")
async def execute_proposal(
    proposal_id: str,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Execute a queued proposal.
    
    Executes the actions defined in a queued proposal after timelock expires.
    """
    try:
        # This would implement proposal execution logic
        # For now, return a mock response
        
        proposal = await governance_service.get_proposal(proposal_id)
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        return {
            "success": True,
            "proposal_id": proposal_id,
            "status": "executed",
            "execution_results": [
                {"target": target, "success": True, "return_data": "0x"}
                for target in proposal.get("targets", [])
            ],
            "executed_at": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing proposal {proposal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to execute proposal")

@router.delete("/proposals/{proposal_id}")
async def cancel_proposal(
    proposal_id: str,
    governance_service: GovernanceService = Depends(get_governance_service)
) -> Dict[str, Any]:
    """
    Cancel a proposal.
    
    Allows proposers or governance admins to cancel proposals.
    """
    try:
        # This would implement proposal cancellation logic
        # For now, return a mock response
        
        proposal = await governance_service.get_proposal(proposal_id)
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        return {
            "success": True,
            "proposal_id": proposal_id,
            "status": "canceled",
            "canceled_at": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling proposal {proposal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel proposal")
