"""
Tests for Skills API (Synchronous Version)

This module contains synchronous tests for the skills API endpoints.
"""

import pytest
from fastapi import status
from starlette.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.services.skill import get_skill_service
from app.main import app

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

def test_create_skill_token(
    mock_skill_service: MagicMock,
    skill_token_request: dict
):
    """
    Test creating a skill token.
    
    Args:
        mock_skill_service: Mock skill service
        skill_token_request: Sample skill token request
    """
    # Create a test client with dependency override
    app.dependency_overrides[get_skill_service] = lambda: mock_skill_service
    client = TestClient(app)
    
    try:
        response = client.post("/api/v1/skills/", json=skill_token_request)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["token_id"] == "0.0.54321"
        assert response.json()["recipient_id"] == skill_token_request["recipient_id"]
        assert response.json()["skill_name"] == skill_token_request["skill_name"]
        
        # Verify service was called with correct arguments
        mock_skill_service.mint_skill_token.assert_called_once()
        call_args = mock_skill_service.mint_skill_token.call_args[1]
        assert call_args["recipient_id"] == skill_token_request["recipient_id"]
        assert call_args["skill_name"] == skill_token_request["skill_name"]
    finally:
        # Clean up the dependency override
        app.dependency_overrides.clear()

def test_create_skill_token_validation_error(
    mock_skill_service: MagicMock
):
    """
    Test validation error when creating a skill token.
    
    Args:
        mock_skill_service: Mock skill service
    """
    # Create a test client with dependency override
    app.dependency_overrides[get_skill_service] = lambda: mock_skill_service
    client = TestClient(app)
    
    try:
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
        mock_skill_service.mint_skill_token.assert_not_called()
    finally:
        # Clean up the dependency override
        app.dependency_overrides.clear()

def test_get_skill_token(
    mock_skill_service: MagicMock
):
    """
    Test getting a skill token.
    
    Args:
        mock_skill_service: Mock skill service
    """
    # Create a test client with dependency override
    app.dependency_overrides[get_skill_service] = lambda: mock_skill_service
    client = TestClient(app)
    
    try:
        token_id = "0.0.54321"
        
        response = client.get(f"/api/v1/skills/{token_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["token_id"] == "0.0.54321"
        
        # Verify service was called with correct arguments
        mock_skill_service.get_skill_token.assert_called_once_with(token_id)
    finally:
        # Clean up the dependency override
        app.dependency_overrides.clear()

def test_get_skill_token_not_found(
    mock_skill_service: MagicMock
):
    """
    Test getting a non-existent skill token.
    
    Args:
        mock_skill_service: Mock skill service
    """
    # Create a test client with dependency override
    app.dependency_overrides[get_skill_service] = lambda: mock_skill_service
    client = TestClient(app)
    
    try:
        token_id = "0.0.99999"
        
        # Make service return None for non-existent token
        mock_skill_service.get_skill_token.return_value = None
        
        response = client.get(f"/api/v1/skills/{token_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        
        # Verify service was called with correct arguments
        mock_skill_service.get_skill_token.assert_called_once_with(token_id)
    finally:
        # Clean up the dependency override
        app.dependency_overrides.clear()

def test_list_skill_tokens(
    mock_skill_service: MagicMock
):
    """
    Test listing skill tokens for a user.
    
    Args:
        mock_skill_service: Mock skill service
    """
    # Create a test client with dependency override
    app.dependency_overrides[get_skill_service] = lambda: mock_skill_service
    client = TestClient(app)
    
    try:
        owner_id = "0.0.12345"
        
        response = client.get(f"/api/v1/skills/?owner_id={owner_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
        assert len(response.json()) > 0
        
        # Verify service was called with correct arguments
        mock_skill_service.list_skill_tokens.assert_called_once_with(owner_id)
    finally:
        # Clean up the dependency override
        app.dependency_overrides.clear()
