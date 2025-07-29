"""
Tests for Skills API

This module contains tests for the skills API endpoints.
"""

import pytest
from fastapi import status
from starlette.testclient import TestClient
from unittest.mock import patch, MagicMock

def test_create_skill_token(
    test_client: TestClient,
    mock_skill_service: MagicMock,
    skill_token_request: dict
):
    """
    Test creating a skill token.
    
    Args:
        async_client: Async test client
        mock_skill_service: Mock skill service
        skill_token_request: Sample skill token request
    """
    response = test_client.post("/api/v1/skills/", json=skill_token_request)
    
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["token_id"] == "0.0.54321"
    assert response.json()["recipient_id"] == skill_token_request["recipient_id"]
    assert response.json()["skill_name"] == skill_token_request["skill_name"]
    
    # Verify service was called with correct arguments
    mock_skill_service.mint_skill_token.assert_called_once()
    call_args = mock_skill_service.mint_skill_token.call_args[1]
    assert call_args["recipient_id"] == skill_token_request["recipient_id"]
    assert call_args["skill_name"] == skill_token_request["skill_name"]

def test_create_skill_token_validation_error(
    test_client: TestClient,
    mock_skill_service: MagicMock
):
    """
    Test validation error when creating a skill token.
    
    Args:
        async_client: Async test client
        mock_skill_service: Mock skill service
    """
    # Missing required fields
    invalid_request = {
        "recipient_id": "0.0.12345",
        "skill_name": "React.js"
        # Missing other required fields
    }
    
    response = test_client.post("/api/v1/skills/", json=invalid_request)
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "detail" in response.json()
    
    # Service should not be called
    mock_skill_service.mint_skill_token.assert_not_called()

def test_create_skill_token_service_error(
    test_client: TestClient,
    mock_skill_service: MagicMock,
    skill_token_request: dict
):
    """
    Test service error when creating a skill token.
    
    Args:
        test_client: Test client
        mock_skill_service: Mock skill service
        skill_token_request: Sample skill token request
    """
    # Make service raise an exception
    mock_skill_service.mint_skill_token.side_effect = Exception("Service error")
    
    response = test_client.post("/api/v1/skills/", json=skill_token_request)
    
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "detail" in response.json()

def test_get_skill_token(
    test_client: TestClient,
    mock_skill_service: MagicMock
):
    """
    Test getting a skill token.
    
    Args:
        async_client: Async test client
        mock_skill_service: Mock skill service
    """
    token_id = "0.0.54321"
    
    response = test_client.get(f"/api/v1/skills/{token_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["token_id"] == token_id
    
    # Verify service was called with correct arguments
    mock_skill_service.get_skill_token.assert_called_once_with(token_id)

def test_get_skill_token_not_found(
    test_client: TestClient,
    mock_skill_service: MagicMock
):
    """
    Test getting a non-existent skill token.
    
    Args:
        async_client: Async test client
        mock_skill_service: Mock skill service
    """
    token_id = "0.0.99999"
    
    # Make service return None for non-existent token
    mock_skill_service.get_skill_token.return_value = None
    
    response = test_client.get(f"/api/v1/skills/{token_id}")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "detail" in response.json()

def test_list_skill_tokens(
    test_client: TestClient,
    mock_skill_service: MagicMock
):
    """
    Test listing skill tokens.
    
    Args:
        async_client: Async test client
        mock_skill_service: Mock skill service
    """
    owner_id = "0.0.12345"
    
    response = test_client.get(f"/api/v1/skills/?owner_id={owner_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0
    
    # Verify service was called with correct arguments
    mock_skill_service.list_skill_tokens.assert_called_once_with(owner_id)

def test_update_skill_token(
    test_client: TestClient,
    mock_skill_service: MagicMock
):
    """
    Test updating a skill token.
    
    Args:
        async_client: Async test client
        mock_skill_service: Mock skill service
    """
    token_id = "0.0.54321"
    new_level = 4
    update_reason = "Completed advanced project"
    
    # Mock update_skill_token to return a successful result
    mock_update_result = {
        "token_id": token_id,
        "new_level": new_level,
        "transaction_id": "0.0.12345@1234567890.000000000",
        "timestamp": "2025-07-17T10:00:00Z"
    }
    
    mock_skill_service.update_skill_token.return_value = mock_update_result
    
    response = test_client.put(
        f"/api/v1/skills/{token_id}",
        params={
            "new_level": new_level,
            "update_reason": update_reason
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["token_id"] == token_id
    assert response.json()["new_level"] == new_level
    
    # Verify service was called with correct arguments
    mock_skill_service.update_skill_token.assert_called_once_with(
        token_id=token_id,
        new_level=new_level,
        update_reason=update_reason,
        evidence_links=None
    )

def test_evaluate_work(
    test_client: TestClient,
    mock_reputation_service: MagicMock,
    work_evaluation_request: dict
):
    """
    Test evaluating work.
    
    Args:
        async_client: Async test client
        mock_reputation_service: Mock reputation service
        work_evaluation_request: Sample work evaluation request
    """
    response = test_client.post("/api/v1/skills/evaluate", json=work_evaluation_request)
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["user_id"] == work_evaluation_request["user_id"]
    assert "overall_score" in response.json()
    assert "skill_scores" in response.json()
    
    # Verify service was called with correct arguments
    mock_reputation_service.evaluate_work.assert_called_once()
    call_args = mock_reputation_service.evaluate_work.call_args[1]
    assert call_args["user_id"] == work_evaluation_request["user_id"]
    assert call_args["skill_token_ids"] == work_evaluation_request["skill_token_ids"]

def test_get_reputation(
    test_client: TestClient,
    mock_reputation_service: MagicMock
):
    """
    Test getting reputation score.
    
    Args:
        async_client: Async test client
        mock_reputation_service: Mock reputation service
    """
    user_id = "0.0.12345"
    
    response = test_client.get(f"/api/v1/skills/reputation/{user_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["user_id"] == user_id
    assert "overall_score" in response.json()
    assert "skill_scores" in response.json()
    
    # Verify service was called with correct arguments
    mock_reputation_service.get_reputation_score.assert_called_once_with(user_id)

def test_get_reputation_history(
    test_client: TestClient,
    mock_reputation_service: MagicMock
):
    """
    Test getting reputation history.
    
    Args:
        async_client: Async test client
        mock_reputation_service: Mock reputation service
    """
    user_id = "0.0.12345"
    limit = 5
    
    response = test_client.get(f"/api/v1/skills/reputation/{user_id}/history?limit={limit}")
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0
    
    # Verify service was called with correct arguments
    mock_reputation_service.get_reputation_history.assert_called_once_with(user_id, limit)
