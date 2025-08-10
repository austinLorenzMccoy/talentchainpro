"""
Tests for Reputation API endpoints with direct patching

This module contains tests for the reputation API endpoints using direct patching of the service.
"""

import pytest
from fastapi import status
from starlette.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

# Create a test client
client = TestClient(app)

@pytest.fixture
def mock_reputation_result():
    """
    Mock reputation result for testing.
    
    Returns:
        dict: Mock reputation result
    """
    return {
        "user_id": "0.0.12345",
        "overall_score": 4.5,
        "skill_scores": [
            {"skill_name": "React.js", "score": 4.2},
            {"skill_name": "Python", "score": 4.8}
        ],
        "total_evaluations": 10,
        "last_updated": "2025-07-17T10:00:00Z"
    }

@pytest.fixture
def mock_reputation_history():
    """
    Mock reputation history for testing.
    
    Returns:
        list: Mock reputation history
    """
    return [
        {
            "timestamp": "2025-07-17T10:00:00Z",
            "overall_score": 4.5,
            "skill_scores": [
                {"skill_name": "React.js", "score": 4.2},
                {"skill_name": "Python", "score": 4.8}
            ]
        },
        {
            "timestamp": "2025-06-17T10:00:00Z",
            "overall_score": 4.3,
            "skill_scores": [
                {"skill_name": "React.js", "score": 4.0},
                {"skill_name": "Python", "score": 4.6}
            ]
        }
    ]

def test_get_reputation(mock_reputation_result):
    """
    Test getting user reputation.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.get_reputation_score = MagicMock(return_value=mock_reputation_result)
    
    # Patch the get_reputation_service function
    with patch("app.api.skills.get_reputation_service", return_value=mock_service):
        user_id = "0.0.12345"
        
        response = client.get(f"/api/v1/skills/reputation/{user_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["user_id"] == user_id
        assert response.json()["overall_score"] == 4.5
        assert len(response.json()["skill_scores"]) == 2
        
        # Verify service was called with correct arguments
        mock_service.get_reputation_score.assert_called_once_with(user_id)

def test_get_reputation_not_found():
    """
    Test getting reputation for a user that doesn't exist.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.get_reputation_score = MagicMock(return_value=None)
    
    # Patch the get_reputation_service function
    with patch("app.api.skills.get_reputation_service", return_value=mock_service):
        user_id = "0.0.99999"
        
        response = client.get(f"/api/v1/skills/reputation/{user_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        
        # Verify service was called with correct arguments
        mock_service.get_reputation_score.assert_called_once_with(user_id)

def test_get_reputation_history(mock_reputation_history):
    """
    Test getting user reputation history.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.get_reputation_history = MagicMock(return_value=mock_reputation_history)
    
    # Patch the get_reputation_service function
    with patch("app.api.skills.get_reputation_service", return_value=mock_service):
        user_id = "0.0.12345"
        
        response = client.get(f"/api/v1/skills/reputation/{user_id}/history")
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
        assert len(response.json()) == 2
        assert response.json()[0]["overall_score"] == 4.5
        assert response.json()[1]["overall_score"] == 4.3
        
        # Verify service was called with correct arguments - include default limit parameter
        mock_service.get_reputation_history.assert_called_once_with(user_id, 10)

def test_get_reputation_history_not_found():
    """
    Test getting reputation history for a user that doesn't exist.
    """
    # Create a mock service
    mock_service = MagicMock()
    mock_service.get_reputation_history = MagicMock(return_value=None)
    
    # Patch the get_reputation_service function
    with patch("app.api.skills.get_reputation_service", return_value=mock_service):
        user_id = "0.0.99999"
        
        response = client.get(f"/api/v1/skills/reputation/{user_id}/history")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "detail" in response.json()
        
        # Verify service was called with correct arguments - include default limit parameter
        mock_service.get_reputation_history.assert_called_once_with(user_id, 10)

def test_evaluate_work():
    """
    Test evaluating work.
    """
    # Create mock reputation service
    mock_reputation_service = MagicMock()
    mock_reputation_service.evaluate_work.return_value = {
        "evaluation_id": "eval-123",
        "user_id": "0.0.12345",
        "skill_token_ids": ["0.0.54321"],
        "overall_score": 85,
        "skill_scores": {"React.js": 85, "JavaScript": 80},
        "feedback": "Good implementation with clean code and good performance. Focus on improving test coverage.",
        "evaluated_at": "2023-01-01T00:00:00+00:00",
        "evaluator": "AI Oracle"
    }
    
    # Patch the reputation service
    with patch("app.api.skills.get_reputation_service", return_value=mock_reputation_service):
        
        request_data = {
            "user_id": "0.0.12345",
            "skill_token_ids": ["0.0.54321"],
            "work_description": "Implemented a React component",
            "work_content": "Code and documentation",
            "evaluation_criteria": "Code quality, UI/UX, performance"
        }
        
        response = client.post("/api/v1/skills/evaluate", json=request_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == "0.0.12345"
        assert data["overall_score"] == 85
        assert "skill_scores" in data
        assert "feedback" in data
        
        # Verify service was called with correct arguments
        mock_reputation_service.evaluate_work.assert_called_once_with(
            user_id=request_data["user_id"],
            skill_token_ids=request_data["skill_token_ids"],
            work_description=request_data["work_description"],
            work_content=request_data["work_content"],
            evaluation_criteria=request_data["evaluation_criteria"]
        )
