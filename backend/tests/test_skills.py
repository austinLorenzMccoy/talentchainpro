"""
Test suite for Skills API endpoints.

This module tests the skills-related API endpoints including:
- Creating skill tokens
- Retrieving skill tokens
- Listing skill tokens  
- Updating skill tokens
- Work evaluation
- Reputation management
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

@pytest.fixture
def skill_token_request():
    """Fixture for skill token request."""
    return {
        "recipient_address": "0.0.12345",
        "skill_name": "React.js",
        "skill_category": "frontend",
        "level": 3,
        "description": "Advanced React.js development with hooks and context API",
        "metadata_uri": "https://metadata.example.com/react-skills"
    }

@pytest.mark.asyncio
async def test_create_skill_token(skill_token_request):
    """Test creating a skill token."""
    with patch('app.api.skills.get_skill_service') as mock_skill_service:
        mock_service = AsyncMock()
        mock_skill_service.return_value = mock_service
        mock_service.create_skill_token.return_value = {
            "success": True,
            "transaction_id": "0.0.12345@1234567890.123456789",
            "token_id": "0.0.54321",
            "level": 3,
            "timestamp": "2023-01-01T00:00:00Z"
        }
        
        response = client.post("/api/v1/skills/", json=skill_token_request)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["token_id"] == "0.0.54321"
        assert data["skill_name"] == "React.js"
        assert data["level"] == 3
        
        # Verify service call
        mock_service.create_skill_token.assert_called_once()

@pytest.mark.asyncio  
async def test_create_skill_token_validation_error():
    """Test creating a skill token with validation error."""
    invalid_request = {
        "recipient_address": "",  # Invalid empty recipient_address
        "skill_name": "A",   # Too short skill name
        "skill_category": "invalid_category",
        "level": 11,   # Invalid skill level (> 10)
        "description": ""
    }
    
    response = client.post("/api/v1/skills/", json=invalid_request)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_create_skill_token_service_error(skill_token_request):
    """Test creating a skill token with service error."""
    with patch('app.api.skills.get_skill_service') as mock_skill_service:
        mock_service = AsyncMock()
        mock_skill_service.return_value = mock_service
        mock_service.create_skill_token.side_effect = Exception("Service error")
        
        response = client.post("/api/v1/skills/", json=skill_token_request)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

@pytest.mark.asyncio
async def test_get_skill_token():
    """Test retrieving a skill token."""
    token_id = "0.0.54321"
    
    with patch('app.api.skills.get_skill_service') as mock_skill_service:
        mock_service = AsyncMock()
        mock_skill_service.return_value = mock_service
        mock_service.get_skill_token.return_value = {
            "success": True,
            "data": {
                "token_id": token_id,
                "owner_address": "0.0.12345",
                "skill_name": "React.js",
                "skill_category": "frontend", 
                "level": 3,
                "experience_points": 150,
                "description": "Advanced React.js development",
                "metadata_uri": "https://metadata.example.com/react-skills",
                "is_active": True,
                "created_at": "2023-01-01T00:00:00+00:00",
                "last_updated": "2023-01-01T00:00:00+00:00"
            }
        }
        
        response = client.get(f"/api/v1/skills/{token_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["token_id"] == token_id
        assert data["skill_name"] == "React.js"
        
        mock_service.get_skill_token.assert_called_once_with(token_id)

@pytest.mark.asyncio
async def test_get_skill_token_not_found():
    """Test retrieving a non-existent skill token."""
    token_id = "0.0.99999"
    
    with patch('app.api.skills.get_skill_service') as mock_skill_service:
        mock_service = AsyncMock()
        mock_skill_service.return_value = mock_service
        mock_service.get_skill_token.return_value = {"success": False, "error": "Token not found"}
        
        response = client.get(f"/api/v1/skills/{token_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_list_skill_tokens():
    """Test listing skill tokens."""
    owner_id = "0.0.12345"
    
    with patch('app.api.skills.get_skill_service') as mock_skill_service:
        mock_service = AsyncMock()
        mock_skill_service.return_value = mock_service
        mock_service.list_skill_tokens.return_value = [
            {
                "token_id": "0.0.54321",
                "skill_name": "React.js", 
                "skill_category": "frontend",
                "skill_level": 3
            },
            {
                "token_id": "0.0.54322",
                "skill_name": "Node.js",
                "skill_category": "backend", 
                "skill_level": 4
            },
            {
                "token_id": "0.0.54323", 
                "skill_name": "Python",
                "skill_category": "backend",
                "skill_level": 5
            }
        ]
        
        response = client.get(f"/api/v1/skills/?owner_id={owner_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3
        assert data[0]["skill_name"] == "React.js"
        
        mock_service.list_skill_tokens.assert_called_once_with(owner_id)

@pytest.mark.asyncio
async def test_update_skill_token():
    """Test updating a skill token."""
    token_id = "0.0.54321"
    
    with patch('app.api.skills.get_skill_service') as mock_skill_service:
        mock_service = AsyncMock()
        mock_skill_service.return_value = mock_service
        
        # Mock the current token data (for get_skill_token call)
        mock_service.get_skill_token.return_value = {
            "success": True,
            "data": {
                "token_id": token_id,
                "owner_address": "0.0.12345",
                "skill_name": "React.js",
                "skill_category": "frontend",
                "level": 3,
                "experience_points": 100,
                "description": "Advanced React.js development",
                "metadata_uri": "https://metadata.example.com/react-skills",
                "is_active": True,
                "created_at": "2023-01-01T00:00:00+00:00",
                "last_updated": "2023-01-01T00:00:00+00:00"
            }
        }
        
        # Mock the update operation 
        mock_service.update_skill_level.return_value = {
            "success": True,
            "transaction_id": "0.0.12345@1234567890.123456789",
            "old_level": 3,
            "new_level": 4
        }
        
        update_data = {
            "new_level": 4,
            "experience_points": 50,
            "evidence_uri": "Completed advanced project"
        }
        
        response = client.put(f"/api/v1/skills/{token_id}", json=update_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["token_id"] == token_id
        
        # Verify service calls were made
        assert mock_service.get_skill_token.call_count >= 1

@pytest.mark.asyncio
async def test_evaluate_work():
    """Test work evaluation."""
    with patch('app.api.skills.get_reputation_service') as mock_reputation_service:
        mock_service = AsyncMock()
        mock_reputation_service.return_value = mock_service
        mock_service.evaluate_work.return_value = {
            "evaluation_id": "eval_123",
            "user_id": "0.0.12345",
            "skill_token_ids": ["0.0.54321"],
            "overall_score": 85,
            "skill_scores": {"React.js": 85, "JavaScript": 80},
            "feedback": "Excellent work quality",
            "evaluated_at": "2023-01-01T00:00:00+00:00",
            "evaluator": "AI Oracle"
        }
        
        work_data = {
            "user_id": "0.0.12345",
            "skill_token_ids": ["0.0.54321"],
            "work_description": "Built a React dashboard",
            "work_content": "https://github.com/user/dashboard"
        }
        
        response = client.post("/api/v1/skills/evaluate", json=work_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["overall_score"] == 85
        assert "feedback" in data

@pytest.mark.asyncio
async def test_get_reputation():
    """Test getting user reputation."""
    user_id = "0.0.12345"
    
    with patch('app.api.skills.get_reputation_service') as mock_reputation_service:
        mock_service = AsyncMock()
        mock_reputation_service.return_value = mock_service
        mock_service.get_reputation_score.return_value = {
            "user_id": user_id,
            "overall_score": 850,
            "skill_scores": {
                "React.js": 85,
                "Node.js": 90,
                "Python": 80
            },
            "total_evaluations": 25,
            "avg_score": 85.0
        }
        
        response = client.get(f"/api/v1/skills/reputation/{user_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == user_id
        assert data["overall_score"] == 850
        
        mock_service.get_reputation_score.assert_called_once_with(user_id)

@pytest.mark.asyncio
async def test_get_reputation_history():
    """Test getting user reputation history."""
    user_id = "0.0.12345"
    
    with patch('app.api.skills.get_reputation_service') as mock_reputation_service:
        mock_service = AsyncMock()
        mock_reputation_service.return_value = mock_service
        mock_service.get_reputation_history.return_value = [
            {
                "timestamp": "2023-01-01T00:00:00Z",
                "score": 80,
                "event": "work_evaluation",
                "skill": "React.js"
            },
            {
                "timestamp": "2023-01-02T00:00:00Z", 
                "score": 85,
                "event": "work_evaluation",
                "skill": "Node.js"
            }
        ]
        
        response = client.get(f"/api/v1/skills/reputation/{user_id}/history?limit=5")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) > 0
        assert data[0]["score"] == 80
