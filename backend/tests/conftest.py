"""
Pytest Configuration and Fixtures

This module provides fixtures for testing the TalentChain Pro backend.
"""

import os
import pytest
import asyncio
from typing import Dict, Any, Generator, AsyncGenerator
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app
from app.utils.hedera import get_client
from app.utils.ai_oracle import get_ai_oracle
from app.services.skill import get_skill_service
from app.services.reputation import get_reputation_service
from app.utils.mcp_server import MCPServerClient

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_client() -> Generator:
    """
    Create a FastAPI TestClient instance that will be used for the entire test session.
    
    Returns:
        TestClient: FastAPI test client
    """
    with TestClient(app) as client:
        yield client

@pytest.fixture
async def async_client() -> AsyncGenerator:
    """
    Create an AsyncClient instance for async testing.
    
    Yields:
        AsyncClient: Async test client
    """
    async with AsyncClient(base_url="http://test") as client:
        app_client = TestClient(app)
        # Transfer cookies and headers if needed
        client.cookies = app_client.cookies
        yield client

@pytest.fixture(scope="session")
def mock_hedera_client() -> MagicMock:
    """
    Create a mock Hedera client for testing.
    
    Returns:
        MagicMock: Mock Hedera client
    """
    mock_client = MagicMock()
    
    # Mock operator account ID and key
    mock_client.getOperatorAccountId.return_value = "0.0.12345"
    mock_client.getOperatorPublicKey.return_value = "mock_public_key"
    
    # Mock transaction execution
    mock_transaction_response = MagicMock()
    mock_transaction_response.transactionId.toString.return_value = "0.0.12345@1234567890.000000000"
    
    mock_receipt = MagicMock()
    mock_receipt.tokenId.toString.return_value = "0.0.54321"
    mock_receipt.serials = [1]
    
    # For synchronous tests, return the values directly instead of futures
    mock_transaction_response.getReceiptAsync.return_value = mock_receipt
    mock_client.executeAsync.return_value = mock_transaction_response
    
    # Patch the get_client function to return our mock
    with patch("app.utils.hedera.get_client", return_value=mock_client):
        yield mock_client

@pytest.fixture(scope="session")
def mock_ai_oracle() -> MagicMock:
    """
    Create a mock AI oracle for testing.
    
    Returns:
        MagicMock: Mock AI oracle
    """
    mock_oracle = MagicMock()
    
    # Mock evaluate_work method
    mock_evaluation_result = (
        85.0,  # overall_score
        {
            "overall_score": 85.0,
            "skill_scores": {
                "0.0.54321": {
                    "score": 85.0,
                    "reasoning": "Good quality work with attention to detail",
                    "strengths": ["Clean code", "Good documentation"],
                    "weaknesses": ["Could improve test coverage"]
                }
            },
            "recommendation": "Focus on improving test coverage",
            "level_change": 1
        }
    )
    
    # For synchronous tests, return the values directly instead of futures
    mock_oracle.evaluate_work.return_value = mock_evaluation_result
    
    # Patch the get_ai_oracle function to return our mock
    with patch("app.utils.ai_oracle.get_ai_oracle", return_value=mock_oracle):
        yield mock_oracle

@pytest.fixture
def mock_skill_service() -> MagicMock:
    """
    Create a mock skill service for testing.
    
    Returns:
        MagicMock: Mock skill service
    """
    mock_service = MagicMock()
    
    # Mock mint_skill_token method
    mock_token_result = {
        "token_id": "0.0.54321",
        "recipient_id": "0.0.12345",
        "skill_name": "React.js",
        "skill_category": "frontend",
        "skill_level": 3,
        "transaction_id": "0.0.12345@1234567890.000000000",
        "timestamp": "2025-07-17T10:00:00Z"
    }
    
    # For synchronous tests, return the values directly instead of futures
    mock_service.mint_skill_token.return_value = mock_token_result
    
    # Mock get_skill_token method
    mock_service.get_skill_token.return_value = mock_token_result
    
    # Mock list_skill_tokens method
    mock_service.list_skill_tokens.return_value = [mock_token_result]
    
    # Patch the get_skill_service function to return our mock
    with patch("app.services.skill.get_skill_service", return_value=mock_service):
        yield mock_service

@pytest.fixture
def mock_reputation_service() -> MagicMock:
    """
    Create a mock reputation service for testing.
    
    Returns:
        MagicMock: Mock reputation service
    """
    mock_service = MagicMock()
    
    # Mock evaluate_work method
    mock_evaluation_result = {
        "evaluation_id": "12345678-1234-5678-1234-567812345678",
        "user_id": "0.0.12345",
        "overall_score": 85.0,
        "skill_scores": {
            "0.0.54321": {
                "score": 85.0,
                "reasoning": "Good quality work with attention to detail",
                "strengths": ["Clean code", "Good documentation"],
                "weaknesses": ["Could improve test coverage"]
            }
        },
        "recommendation": "Focus on improving test coverage",
        "level_changes": {"0.0.54321": 1},
        "timestamp": "2025-07-17T10:00:00Z"
    }
    
    # For synchronous tests, return the values directly instead of futures
    mock_service.evaluate_work.return_value = mock_evaluation_result
    
    # Mock get_reputation_score method
    mock_reputation_score = {
        "user_id": "0.0.12345",
        "overall_score": 85.0,
        "skill_scores": {
            "frontend": 85.0,
            "blockchain": 80.0
        },
        "last_updated": "2025-07-17T10:00:00Z"
    }
    
    mock_service.get_reputation_score.return_value = mock_reputation_score
    
    # Mock get_reputation_history method
    mock_history_item = {
        "evaluation_id": "12345678-1234-5678-1234-567812345678",
        "overall_score": 85.0,
        "skill_token_ids": ["0.0.54321"],
        "level_changes": {"0.0.54321": 1},
        "timestamp": "2025-07-17T10:00:00Z"
    }
    
    # For synchronous tests, return the values directly instead of futures
    mock_service.get_reputation_history.return_value = [mock_history_item]
    
    # Patch the get_reputation_service function to return our mock
    with patch("app.services.reputation.get_reputation_service", return_value=mock_service):
        yield mock_service

@pytest.fixture
def mock_mcp_client():
    """
    Create a mock MCP client for testing.
    
    Returns:
        AsyncMock: Mock MCP client
    """
    # Create a mock client
    client = AsyncMock(spec=MCPServerClient)
    client.process_query = AsyncMock()
    client.find_talent_by_skills = AsyncMock()
    client.evaluate_skill_match = AsyncMock()
    client.register_skill_token = AsyncMock()
    
    # Patch the get_mcp_client function to return our mock
    with patch("app.utils.mcp_server.MCPServerClient", return_value=client):
        with patch("app.services.mcp.get_mcp_client", return_value=client):
            yield client

@pytest.fixture
def skill_token_request() -> Dict[str, Any]:
    """
    Create a sample skill token request for testing.
    
    Returns:
        Dict: Sample skill token request
    """
    return {
        "recipient_id": "0.0.12345",
        "skill_name": "React.js",
        "skill_category": "frontend",
        "skill_level": 3,
        "description": "Advanced React.js development with hooks and context API",
        "evidence_links": ["https://github.com/user/react-project"],
        "metadata": {"years_experience": 3}
    }

@pytest.fixture
def work_evaluation_request() -> Dict[str, Any]:
    """
    Create a sample work evaluation request for testing.
    
    Returns:
        Dict: Sample work evaluation request
    """
    return {
        "user_id": "0.0.12345",
        "skill_token_ids": ["0.0.54321"],
        "work_description": "Frontend implementation of a DeFi dashboard",
        "work_content": "https://github.com/user/defi-dashboard",
        "evaluation_criteria": "Code quality, UI/UX, performance"
    }

@pytest.fixture
def job_pool_request() -> Dict[str, Any]:
    """
    Create a sample job pool request for testing.
    
    Returns:
        Dict: Sample job pool request
    """
    return {
        "title": "Senior Blockchain Developer",
        "description": "Develop smart contracts for DeFi platform using Solidity and Hedera technologies",
        "required_skills": [
            {"name": "Solidity", "level": 4},
            {"name": "Hedera", "level": 3}
        ],
        "min_reputation": 70,
        "stake_amount": 100.0,
        "duration_days": 30,
        "max_applicants": 50
    }
