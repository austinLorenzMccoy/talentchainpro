"""
Tests for MCP server integration.

This module contains test cases for the MCP server integration,
including talent search, match evaluation, and natural language queries.
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.utils.mcp_server import MCPServerClient

# Mock MCP server responses
MOCK_TALENT_SEARCH_RESPONSE = {
    "output": "Found 2 React developers:",
    "data": [
        {
            "address": "0.0.12345",
            "skill": "ReactJS L4",
            "reputation": 92,
            "other_skills": ["TypeScript", "NextJS"]
        },
        {
            "address": "0.0.56789",
            "skill": "ReactJS L5",
            "reputation": 87,
            "other_skills": ["Redux", "GraphQL"]
        }
    ]
}

MOCK_MATCH_EVALUATION_RESPONSE = {
    "match_score": 85,
    "skill_gaps": ["Docker", "AWS"],
    "strengths": ["ReactJS", "TypeScript"],
    "recommendations": ["Consider improving cloud deployment skills"]
}

@pytest.fixture
def mock_mcp_client_fixture():
    """Create a mock MCP client for testing."""
    # Create a mock client
    client = AsyncMock(spec=MCPServerClient)
    client.process_query = AsyncMock()
    client.find_talent_by_skills = AsyncMock()
    client.evaluate_skill_match = AsyncMock()
    client.register_skill_token = AsyncMock()
    
    # Override the dependency in FastAPI
    original_dependencies = app.dependency_overrides.copy()
    
    # Override get_mcp_client to return our mock
    from app.services.mcp import get_mcp_client
    app.dependency_overrides[get_mcp_client] = lambda: client
    
    yield client
    
    # Restore original dependencies
    app.dependency_overrides = original_dependencies

def test_talent_search(mock_mcp_client_fixture, test_client: TestClient):
    """Test the talent search endpoint."""
    # Set up mock response
    mock_mcp_client_fixture.find_talent_by_skills.return_value = MOCK_TALENT_SEARCH_RESPONSE["data"]
    
    # Make request
    response = test_client.post(
        "/api/v1/mcp/search",
        json={
            "skills": ["ReactJS", "TypeScript"],
            "min_level": 3
        }
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["results"]) == 2
    assert data["results"][0]["address"] == "0.0.12345"
    assert data["results"][0]["skill"] == "ReactJS L4"
    assert data["results"][0]["reputation"] == 92
    
    # Verify mock was called
    assert mock_mcp_client_fixture.find_talent_by_skills.called
    # Get the call arguments
    call_args = mock_mcp_client_fixture.find_talent_by_skills.call_args
    assert call_args is not None
    args, kwargs = call_args
    # Verify the first argument (skills list)
    assert len(args) >= 1
    assert set(args[0]) == set(["ReactJS", "TypeScript"])
    # Verify the second argument (min_level)
    assert len(args) >= 2
    assert args[1] == 3

def test_evaluate_match(mock_mcp_client_fixture, test_client: TestClient):
    """Test the match evaluation endpoint."""
    # Set up mock response
    mock_mcp_client_fixture.evaluate_skill_match.return_value = MOCK_MATCH_EVALUATION_RESPONSE
    
    # Test data
    job_requirements = {
        "required_skills": ["ReactJS", "TypeScript", "Docker"],
        "min_level": 4
    }
    candidate_skills = {
        "skills": [
            {"name": "ReactJS", "level": 5},
            {"name": "TypeScript", "level": 4}
        ]
    }
    
    # Make request
    response = test_client.post(
        "/api/v1/mcp/evaluate-match",
        json={
            "job_id": "job123",
            "candidate_id": "cand456",
            "job_requirements": job_requirements,
            "candidate_skills": candidate_skills
        }
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["match_score"] == 85
    assert "Docker" in data["skill_gaps"]
    assert "ReactJS" in data["strengths"]
    assert len(data["recommendations"]) > 0
    
    # Verify mock called correctly
    mock_mcp_client_fixture.evaluate_skill_match.assert_called_once_with(
        job_requirements, candidate_skills
    )

def test_natural_language_query(mock_mcp_client_fixture, test_client: TestClient):
    """Test the natural language query endpoint."""
    # Set up mock response
    mock_mcp_client_fixture.process_query.return_value = {
        "output": "Found 2 developers with blockchain experience",
        "data": {"count": 2}
    }
    
    # Make request
    response = test_client.post(
        "/api/v1/mcp/query",
        json={
            "query": "Find developers with blockchain experience",
            "context": {"operation": "search"}
        }
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["output"] == "Found 2 developers with blockchain experience"
    assert data["data"]["count"] == 2
    
    # Verify mock called correctly
    mock_mcp_client_fixture.process_query.assert_called_once_with(
        "Find developers with blockchain experience",
        {"operation": "search"}
    )

def test_empty_query_error(test_client: TestClient):
    """Test error handling for empty queries."""
    # Make request with empty query
    response = test_client.post(
        "/api/v1/mcp/query",
        json={
            "query": "",
            "context": {}
        }
    )
    
    # Verify error response
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "empty" in data["detail"].lower()

def test_talent_search_error_handling(mock_mcp_client_fixture, test_client: TestClient):
    """Test error handling in talent search."""
    # Set up mock to raise exception
    mock_mcp_client_fixture.find_talent_by_skills.side_effect = Exception("Connection error")
    
    # Make request
    response = test_client.post(
        "/api/v1/mcp/search",
        json={
            "skills": ["ReactJS"],
            "min_level": 3
        }
    )
    
    # The service catches exceptions and returns an empty list, so we expect a 200 response
    # with an empty result set
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert len(data["results"]) == 0
