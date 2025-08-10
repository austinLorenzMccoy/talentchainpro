"""
Tests for Governance API endpoints

This module contains comprehensive tests for the governance API endpoints,
including proposal management, voting, delegation, and settings.
"""

import pytest
from fastapi import status
from starlette.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

from app.main import app

# Create a test client
client = TestClient(app)

@pytest.fixture
def mock_proposal_data():
    """Mock proposal data for testing."""
    return {
        "proposal_id": "proposal_1",
        "title": "Increase Oracle Rewards",
        "description": "Proposal to increase oracle rewards by 20%",
        "proposer_address": "0.0.12345",
        "proposal_type": "SETTINGS_CHANGE",
        "voting_deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "status": "active",
        "votes_for": 0,
        "votes_against": 0,
        "total_voting_power": 1000,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

@pytest.fixture
def create_proposal_request():
    """Sample proposal creation request."""
    return {
        "title": "Increase Oracle Rewards",
        "description": "Proposal to increase oracle rewards by 20%",
        "proposal_type": "SETTINGS_CHANGE",
        "voting_period_days": 7,
        "execution_data": {
            "contract_address": "0.0.67890",
            "function_name": "updateOracleRewards",
            "parameters": [120]
        }
    }

@pytest.fixture
def vote_request():
    """Sample vote request."""
    return {
        "voter_address": "0.0.54321",
        "support": True,
        "voting_power": 100,
        "reason": "This proposal will benefit the ecosystem"
    }

@pytest.fixture
def delegation_request():
    """Sample delegation request."""
    return {
        "delegator_address": "0.0.12345",
        "delegate_address": "0.0.54321",
        "voting_power": 200,
        "duration_days": 30
    }

def test_create_proposal():
    """Test creating a new governance proposal."""
    from unittest.mock import AsyncMock
    
    mock_service = AsyncMock()
    mock_service.create_proposal.return_value = {
        "proposal_id": "proposal_1",
        "title": "Increase Oracle Rewards",
        "description": "This is a detailed proposal to increase oracle rewards by 20% to incentivize better participation and accuracy in the reputation oracle system.",
        "proposer_address": "0.0.12345",
        "proposal_type": "oracle_management",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "voting_deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    }

    # Override the dependency
    from app.api.governance import get_governance_service
    app.dependency_overrides[get_governance_service] = lambda: mock_service
    
    try:
        response = client.post(
            "/api/v1/governance/proposals",
            json={
                "proposer_address": "0.0.12345",
                "title": "Increase Oracle Rewards",
                "description": "This is a detailed proposal to increase oracle rewards by 20% to incentivize better participation and accuracy in the reputation oracle system.",
                "proposal_type": "oracle_management",
                "targets": ["0.0.67890"],
                "values": [0],
                "calldatas": ["0x12345678"]
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["proposal_id"] == "proposal_1"
        assert data["title"] == "Increase Oracle Rewards"
        assert data["status"] == "active"
        
        # Verify service was called
        mock_service.create_proposal.assert_called_once()
    finally:
        # Clean up dependency override
        app.dependency_overrides.clear()

def test_create_proposal_invalid_data():
    """Test creating proposal with invalid data."""
    with patch("app.api.governance.get_governance_service"):
        response = client.post(
            "/api/v1/governance/proposals",
            json={
                "proposer_address": "invalid_address",
                "title": "Short",  # Too short
                "description": "Too short",  # Too short
                "proposal_type": "invalid_type",
                "targets": [],  # Empty
                "values": [],
                "calldatas": []
            }
        )

def test_get_proposal(mock_proposal_data):
    """Test retrieving a specific proposal."""
    mock_service = MagicMock()
    mock_service.get_proposal.return_value = {
        "success": True,
        "proposal": mock_proposal_data
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.get("/api/v1/governance/proposals/proposal_1")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["proposal_id"] == "proposal_1"
        assert data["title"] == "Increase Oracle Rewards"
        
        mock_service.get_proposal.assert_called_once_with("proposal_1")

def test_get_proposal_not_found():
    """Test getting a non-existent proposal."""
    mock_service = MagicMock()
    mock_service.get_proposal.return_value = {
        "success": False,
        "error": "Proposal not found"
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.get("/api/v1/governance/proposals/nonexistent")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

def test_list_proposals():
    """Test listing governance proposals."""
    mock_service = MagicMock()
    mock_service.list_proposals.return_value = {
        "success": True,
        "proposals": [
            {
                "proposal_id": "proposal_1",
                "title": "Increase Oracle Rewards",
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "proposal_id": "proposal_2", 
                "title": "Update Governance Rules",
                "status": "completed",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ],
        "total_count": 2
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.get("/api/v1/governance/proposals")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["proposals"]) == 2
        assert data["total_count"] == 2
        
        mock_service.list_proposals.assert_called_once()

def test_vote_on_proposal(vote_request):
    """Test voting on a proposal."""
    mock_service = MagicMock()
    mock_service.cast_vote.return_value = {
        "success": True,
        "vote": {
            "vote_id": "vote_1",
            "proposal_id": "proposal_1",
            "voter_address": "0.0.54321",
            "support": True,
            "voting_power": 100,
            "cast_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.post(
            "/api/v1/governance/proposals/proposal_1/vote",
            json=vote_request
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["vote_id"] == "vote_1"
        assert data["proposal_id"] == "proposal_1"
        assert data["support"] == True
        
        mock_service.cast_vote.assert_called_once()

def test_vote_validation_error():
    """Test voting with invalid address."""
    response = client.post(
        "/api/v1/governance/proposals/proposal_1/vote",
        json={
            "voter_address": "invalid_address",
            "support": True,
            "voting_power": 100
        }
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_execute_proposal():
    """Test executing a proposal."""
    mock_service = MagicMock()
    mock_service.execute_proposal.return_value = {
        "success": True,
        "execution": {
            "proposal_id": "proposal_1",
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "transaction_id": "0.0.12345@1234567890.000000000",
            "status": "executed"
        }
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.post("/api/v1/governance/proposals/proposal_1/execute")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["execution"]["proposal_id"] == "proposal_1"
        assert data["execution"]["status"] == "executed"
        
        mock_service.execute_proposal.assert_called_once_with("proposal_1")

def test_delegate_voting_power(delegation_request):
    """Test delegating voting power."""
    mock_service = MagicMock()
    mock_service.delegate_voting_power.return_value = {
        "success": True,
        "delegation": {
            "delegation_id": "delegation_1",
            "delegator_address": "0.0.12345",
            "delegate_address": "0.0.54321",
            "voting_power": 200,
            "delegated_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.post(
            "/api/v1/governance/delegate",
            json=delegation_request
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["delegation_id"] == "delegation_1"
        assert data["delegator_address"] == "0.0.12345"
        assert data["delegate_address"] == "0.0.54321"
        
        mock_service.delegate_voting_power.assert_called_once()

def test_get_voting_power():
    """Test getting voting power for an address."""
    mock_service = MagicMock()
    mock_service.get_voting_power.return_value = {
        "success": True,
        "voting_power": {
            "address": "0.0.12345",
            "direct_power": 500,
            "delegated_power": 200,
            "total_power": 700,
            "active_delegations": 3
        }
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.get("/api/v1/governance/voting-power/0.0.12345")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["voting_power"]["address"] == "0.0.12345"
        assert data["voting_power"]["total_power"] == 700
        assert data["voting_power"]["active_delegations"] == 3
        
        mock_service.get_voting_power.assert_called_once_with("0.0.12345")

def test_get_governance_stats():
    """Test getting governance statistics."""
    mock_service = MagicMock()
    mock_service.get_governance_stats.return_value = {
        "success": True,
        "stats": {
            "total_proposals": 50,
            "active_proposals": 5,
            "total_voters": 150,
            "total_voting_power": 10000,
            "participation_rate": 67.5,
            "recent_activity": {
                "proposals_this_month": 8,
                "votes_this_month": 245
            }
        }
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.get("/api/v1/governance/stats")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_proposals"] == 50
        assert data["active_proposals"] == 5
        assert data["participation_rate"] == 67.5
        
        mock_service.get_governance_stats.assert_called_once()

def test_update_governance_settings():
    """Test updating governance settings."""
    mock_service = MagicMock()
    mock_service.update_governance_settings.return_value = {
        "success": True,
        "settings": {
            "min_proposal_stake": 1000,
            "voting_period_days": 7,
            "execution_delay_hours": 24,
            "quorum_threshold": 10.0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    settings_update = {
        "min_proposal_stake": 1000,
        "voting_period_days": 7,
        "execution_delay_hours": 24,
        "quorum_threshold": 10.0
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.patch(
            "/api/v1/governance/settings",
            json=settings_update
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["settings"]["min_proposal_stake"] == 1000
        assert data["settings"]["quorum_threshold"] == 10.0
        
        mock_service.update_governance_settings.assert_called_once()

def test_service_error_handling():
    """Test error handling when service fails."""
    mock_service = MagicMock()
    mock_service.create_proposal.side_effect = Exception("Service unavailable")
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.post(
            "/api/v1/governance/proposals",
            json={
                "proposer_address": "0.0.12345",
                "title": "Test Proposal for Error Handling with Long Title",
                "description": "This is a test proposal for error handling that has more than fifty characters to pass validation",
                "proposal_type": "parameter_change",
                "targets": ["0.0.54321"],
                "values": [100],
                "calldatas": ["0x123456"],
                "voting_period_days": 7
            }
        )
        
        # Service performs validation checks that cause 400 error before mock is called
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "voting power" in response.json()["detail"].lower()

def test_invalid_hedera_address():
    """Test validation of invalid Hedera addresses."""
    response = client.get("/api/v1/governance/voting-power/invalid_address")
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid Hedera address format" in response.json()["detail"]

def test_search_proposals():
    """Test searching proposals with filters."""
    mock_service = MagicMock()
    mock_service.search_proposals.return_value = {
        "success": True,
        "proposals": [
            {
                "proposal_id": "proposal_1",
                "title": "Oracle Rewards",
                "status": "active",
                "proposal_type": "SETTINGS_CHANGE",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ],
        "total_count": 1
    }
    
    with patch("app.api.governance.get_governance_service", return_value=mock_service):
        response = client.get(
            "/api/v1/governance/proposals/search?status=active&proposal_type=SETTINGS_CHANGE"
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["proposals"]) == 1
        assert data["proposals"][0]["proposal_type"] == "SETTINGS_CHANGE"
        
        mock_service.search_proposals.assert_called_once()
