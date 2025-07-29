"""
Tests for Skills API with direct patching

This module contains tests for the skills API endpoints using direct patching of the service.
"""

import pytest
from fastapi import status
from starlette.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

# Create a test client
client = TestClient(app)

@pytest.fixture
def skill_token_request():
    """
    Sample skill token request for testing.
    
    Returns:
        dict: Sample skill token request
    """
    return {
        "recipient_id": "0.0.12345",
        "skill_name": "React.js",
        "skill_category": "frontend",
        "skill_level": 3,
        "description": "Advanced React.js development skills",
        "evidence_links": ["https://github.com/user/react-project"],
        "metadata": {"years_experience": 5}
    }

@pytest.fixture
def mock_token_result():
    """
    Mock token result for testing.
    
    Returns:
        dict: Mock token result
    """
    return {
        "token_id": "0.0.54321",
        "recipient_id": "0.0.12345",
        "skill_name": "React.js",
        "skill_category": "frontend",
        "skill_level": 3,
        "transaction_id": "0.0.12345@1234567890.000000000",
        "timestamp": "2025-07-17T10:00:00Z"
    }

def test_create_skill_token(skill_token_request, mock_token_result):
    """
    Test creating a skill token.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.mint_skill_token.return_value = mock_token_result
    
    # Patch the get_skill_service function
    with patch("app.api.skills.get_skill_service", return_value=mock_service):
        response = client.post("/api/v1/skills/", json=skill_token_request)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["token_id"] == "0.0.54321"
        assert response.json()["recipient_id"] == skill_token_request["recipient_id"]
        assert response.json()["skill_name"] == skill_token_request["skill_name"]
        
        # Verify service was called with correct arguments
        mock_service.mint_skill_token.assert_called_once()
        call_args = mock_service.mint_skill_token.call_args[1]
        assert call_args["recipient_id"] == skill_token_request["recipient_id"]
        assert call_args["skill_name"] == skill_token_request["skill_name"]

def test_create_skill_token_validation_error(skill_token_request):
    """
    Test validation error when creating a skill token.
    """
    # Create a mock service
    mock_service = MagicMock()
    
    # Patch the get_skill_service function
    with patch("app.api.skills.get_skill_service", return_value=mock_service):
        # Missing required fields
        invalid_request = {
            "recipient_id": "0.0.12345",
            "skill_name": "React.js"
            # Missing other required fields
        }
        
        response = client.post("/api/v1/skills/", json=invalid_request)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "detail" in response.json()
        
        # Service should not be called
        mock_service.mint_skill_token.assert_not_called()

def test_get_skill_token(mock_token_result):
    """
    Test getting a skill token.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.get_skill_token.return_value = mock_token_result
    
    # Patch the get_skill_service function
    with patch("app.api.skills.get_skill_service", return_value=mock_service):
        token_id = "0.0.54321"
        
        response = client.get(f"/api/v1/skills/{token_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["token_id"] == "0.0.54321"
        
        # Verify service was called with correct arguments
        mock_service.get_skill_token.assert_called_once_with(token_id)

def test_get_skill_token_not_found():
    """
    Test getting a non-existent skill token.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.get_skill_token.return_value = None
    
    # Patch the get_skill_service function
    with patch("app.api.skills.get_skill_service", return_value=mock_service):
        token_id = "0.0.99999"
        
        response = client.get(f"/api/v1/skills/{token_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        
        # Verify service was called with correct arguments
        mock_service.get_skill_token.assert_called_once_with(token_id)

def test_list_skill_tokens():
    """
    Test listing skill tokens for a user.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.list_skill_tokens.return_value = [
        {
            "token_id": "0.0.54321",
            "recipient_id": "0.0.12345",
            "skill_name": "React.js",
            "skill_category": "frontend",
            "skill_level": 3
        }
    ]
    
    # Patch the get_skill_service function
    with patch("app.api.skills.get_skill_service", return_value=mock_service):
        owner_id = "0.0.12345"
        
        response = client.get(f"/api/v1/skills/?owner_id={owner_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
        assert len(response.json()) > 0
        
        # Verify service was called with correct arguments
        mock_service.list_skill_tokens.assert_called_once_with(owner_id)
