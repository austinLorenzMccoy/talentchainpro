#!/usr/bin/env python
"""
TalentChain Pro API Demo Script

This script demonstrates the TalentChain Pro API endpoints
with mocked services to show expected responses.
"""

import sys
import os
import json
from unittest.mock import patch, MagicMock
from pprint import pprint
from datetime import datetime, timezone

# Configure Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(current_dir) == 'backend':
    # If running from backend directory
    sys.path.insert(0, os.path.dirname(current_dir))
else:
    # If running from project root
    sys.path.insert(0, current_dir)
    backend_dir = os.path.join(current_dir, 'backend')
    if os.path.exists(backend_dir):
        sys.path.insert(0, backend_dir)

# Now import the app
from backend.app.main import app
from starlette.testclient import TestClient

print("\n" + "=" * 80)
print("TALENTCHAIN PRO API DEMO".center(80))
print("=" * 80 + "\n")
print("This script demonstrates the TalentChain Pro API endpoints using mocked services.")
print("All responses are simulated and do not reflect actual database data.\n")

# Create a test client
client = TestClient(app)

def print_response(title, response):
    """Print a formatted API response"""
    print(f"\n{'=' * 80}")
    print(f"{title} - Status: {response.status_code}")
    print(f"{'=' * 80}")
    try:
        formatted_json = json.dumps(response.json(), indent=2)
        print(formatted_json)
    except:
        print(response.text)
    print(f"{'=' * 80}\n")

def demo_skills_api():
    """Demonstrate the Skills API endpoints"""
    print("\n\n🔍 DEMONSTRATING SKILLS API ENDPOINTS")
    
    # Mock skill token data
    mock_skill_token = {
        "token_id": "0.0.54321",
        "name": "React.js Skill Token",
        "skill_name": "React.js",
        "skill_category": "frontend",
        "skill_level": 3,
        "description": "Advanced React.js development with hooks and context API",
        "evidence_links": ["https://github.com/user/react-project"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    mock_skill_tokens = [mock_skill_token]
    
    # Patch the skill service
    with patch("backend.app.api.skills.get_skill_service") as mock_get_service:
        mock_service = MagicMock()
        mock_service.get_skill_token = MagicMock(return_value=mock_skill_token)
        mock_service.list_skill_tokens = MagicMock(return_value=mock_skill_tokens)
        mock_get_service.return_value = mock_service
        
        # Test GET /api/v1/skills/tokens
        response = client.get("/api/v1/skills/tokens")
        print_response("GET /api/v1/skills/tokens", response)
        
        # Test GET /api/v1/skills/tokens/{token_id}
        token_id = "0.0.54321"
        response = client.get(f"/api/v1/skills/tokens/{token_id}")
        print_response(f"GET /api/v1/skills/tokens/{token_id}", response)

def demo_reputation_api():
    """Demonstrate the Reputation API endpoints"""
    print("\n\n🔍 DEMONSTRATING REPUTATION API ENDPOINTS")
    
    # Mock reputation data
    mock_reputation = {
        "user_id": "0.0.12345",
        "overall_score": 4.5,
        "skill_scores": [
            {"skill_name": "React.js", "score": 4.2},
            {"skill_name": "Python", "score": 4.8}
        ],
        "total_evaluations": 10,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    mock_reputation_history = [
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
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
    
    mock_evaluation = {
        "evaluation_id": "eval-123",
        "user_id": "0.0.12345",
        "overall_score": 4.5,
        "skill_scores": {
            "0.0.54321": {
                "score": 4.2,
                "reasoning": "Good implementation",
                "strengths": ["Clean code", "Good performance"],
                "weaknesses": ["Limited test coverage"]
            }
        },
        "recommendation": "Focus on improving test coverage",
        "level_changes": {"0.0.54321": 1},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Patch the reputation service
    with patch("backend.app.api.skills.get_reputation_service") as mock_get_service:
        mock_service = MagicMock()
        mock_service.get_reputation_score = MagicMock(return_value=mock_reputation)
        mock_service.get_reputation_history = MagicMock(return_value=mock_reputation_history)
        mock_service.evaluate_work = MagicMock(return_value=mock_evaluation)
        mock_get_service.return_value = mock_service
        
        # Test GET /api/v1/skills/reputation/{user_id}
        user_id = "0.0.12345"
        response = client.get(f"/api/v1/skills/reputation/{user_id}")
        print_response(f"GET /api/v1/skills/reputation/{user_id}", response)
        
        # Test GET /api/v1/skills/reputation/{user_id}/history
        response = client.get(f"/api/v1/skills/reputation/{user_id}/history")
        print_response(f"GET /api/v1/skills/reputation/{user_id}/history", response)
        
        # Test POST /api/v1/skills/evaluate
        request_data = {
            "user_id": "0.0.12345",
            "skill_token_ids": ["0.0.54321"],
            "work_description": "Implemented a React component",
            "work_content": "Code and documentation",
            "evaluation_criteria": "Code quality, UI/UX, performance"
        }
        response = client.post("/api/v1/skills/evaluate", json=request_data)
        print_response("POST /api/v1/skills/evaluate", response)

def demo_pools_api():
    """Demonstrate the pools API endpoints"""
    print("\n\n🔍 DEMONSTRATING POOLS API ENDPOINTS")
    
    # Import FastAPI app and create a new test client with custom routes
    from fastapi import FastAPI, Path, Depends, HTTPException, status
    from fastapi.testclient import TestClient
    from typing import Dict, Any, List, Optional
    from pydantic import BaseModel
    
    # Define our mock pool data
    mock_pool = {
        "pool_id": "pool-123",
        "title": "Senior React Developer",
        "company_id": "0.0.54321",
        "required_skills": [
            {"name": "React.js", "level": 4},
            {"name": "TypeScript", "level": 3}
        ],
        "min_reputation": 75,
        "stake_amount": 100.0,
        "candidates": [],
        "status": "active",
        "description": "We're looking for a senior React developer",
        "location": "Remote",
        "created_at": "2025-07-17T10:00:00Z",
        "transaction_id": "0.0.3000",
        "expiry_date": "2025-08-17T10:00:00Z"
    }
    
    # Create a temporary FastAPI app for testing
    test_app = FastAPI()
    
    # Define request model for join pool
    class JoinPoolRequest(BaseModel):
        candidate_id: str
        skill_token_ids: List[str]
        stake_amount: float
    
    # Define mock routes
    @test_app.get("/api/v1/pools/")
    async def list_pools():
        return [mock_pool]
    
    @test_app.get("/api/v1/pools/{pool_id}")
    async def get_pool(pool_id: str = Path(...)):
        if pool_id == "pool-123":
            return mock_pool
        raise HTTPException(status_code=404, detail=f"Job pool {pool_id} not found")
    
    @test_app.get("/api/v1/pools/{pool_id}/candidates")
    async def get_candidates(pool_id: str = Path(...)):
        if pool_id == "pool-123":
            return []
        raise HTTPException(status_code=404, detail=f"Job pool {pool_id} not found")
    
    @test_app.post("/api/v1/pools/{pool_id}/join")
    async def join_pool(pool_id: str, request: JoinPoolRequest):
        if pool_id == "pool-123":
            return {
                "pool_id": pool_id,
                "candidate_id": request.candidate_id,
                "status": "joined",
                "transaction_id": "0.0.3001"
            }
        raise HTTPException(status_code=404, detail=f"Job pool {pool_id} not found")
    
    # Create a test client with our custom app
    test_client = TestClient(test_app)
    
    # Test GET /api/v1/pools
    response = test_client.get("/api/v1/pools/")
    print_response("GET /api/v1/pools", response)
    
    # Test GET /api/v1/pools/{pool_id}
    pool_id = "pool-123"
    response = test_client.get(f"/api/v1/pools/{pool_id}")
    print_response(f"GET /api/v1/pools/{pool_id}", response)
    
    # Test GET /api/v1/pools/{pool_id}/candidates
    response = test_client.get(f"/api/v1/pools/{pool_id}/candidates")
    print_response(f"GET /api/v1/pools/{pool_id}/candidates", response)
    
    # Test POST /api/v1/pools/{pool_id}/join with correct fields
    join_data = {
        "candidate_id": "0.0.12345",
        "skill_token_ids": ["0.0.67891", "0.0.67892"],
        "stake_amount": 10.0
    }
    response = test_client.post(f"/api/v1/pools/{pool_id}/join", json=join_data)
    print_response(f"POST /api/v1/pools/{pool_id}/join", response)

def demo_mcp_api():
    """Demonstrate the MCP API endpoints"""
    print("\n\n🔍 DEMONSTRATING MCP API ENDPOINTS")
    
    # Create a mock MCP service
    class MockMCPService:
        def __init__(self):
            # Create a mock MCP client for direct queries
            self.mcp_client = type('MockMCPClient', (), {
                'process_query': self.process_query
            })()
        
        async def search_talent_pool(self, skills, min_level=None, company_id=None):
            return [
                {
                    "address": "0.0.12345",
                    "skill": "React.js (Level 4)",
                    "reputation": 85,
                    "other_skills": ["TypeScript", "NextJS"]
                },
                {
                    "address": "0.0.67890",
                    "skill": "React.js (Level 3)",
                    "reputation": 75,
                    "other_skills": ["JavaScript", "CSS"]
                }
            ]
        
        async def evaluate_candidate_match(self, job_id, candidate_id, job_requirements, candidate_skills):
            return {
                "match_score": 85.5,
                "skill_gaps": ["GraphQL", "AWS"],
                "strengths": ["React.js", "TypeScript"],
                "recommendations": ["Learn GraphQL", "Practice AWS services"]
            }
        
        async def process_query(self, query, context=None):
            return {
                "output": "Based on the skills required, I recommend focusing on React.js and TypeScript.",
                "data": {
                    "recommended_skills": ["React.js", "TypeScript"],
                    "confidence": 0.85
                }
            }
    
    # Create an instance of the mock service
    mock_mcp_service = MockMCPService()
    
    # Override the dependency in the router
    from backend.app.api.mcp import get_mcp_service
    app.dependency_overrides[get_mcp_service] = lambda: mock_mcp_service
    
    try:
        # Test POST /api/v1/mcp/search
        search_data = {
            "skills": ["React.js", "TypeScript"],
            "min_level": 3
        }
        response = client.post("/api/v1/mcp/search", json=search_data)
        print_response("POST /api/v1/mcp/search", response)
        
        # Test POST /api/v1/mcp/evaluate-match
        evaluate_data = {
            "job_id": "pool-123",
            "candidate_id": "0.0.12345",
            "job_requirements": {"skills": ["React.js", "TypeScript", "GraphQL"]},
            "candidate_skills": {"skills": ["React.js", "TypeScript"]}
        }
        response = client.post("/api/v1/mcp/evaluate-match", json=evaluate_data)
        print_response("POST /api/v1/mcp/evaluate-match", response)
        
        # Test POST /api/v1/mcp/query
        query_data = {
            "query": "What skills should I focus on for frontend development?",
            "context": {"role": "frontend"}
        }
        response = client.post("/api/v1/mcp/query", json=query_data)
        print_response("POST /api/v1/mcp/query", response)
    finally:
        # Clean up the dependency override
        app.dependency_overrides.pop(get_mcp_service, None)

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("TALENTCHAIN PRO API DEMO".center(80))
    print("=" * 80)
    print("\nThis script demonstrates the TalentChain Pro API endpoints using mocked services.")
    print("All responses are simulated and do not reflect actual database data.")
    
    try:
        demo_skills_api()
        demo_reputation_api()
        demo_pools_api()
        demo_mcp_api()
        
        print("\n" + "=" * 80)
        print("DEMO COMPLETED SUCCESSFULLY".center(80))
        print("=" * 80 + "\n")
    except Exception as e:
        print(f"\nERROR: {str(e)}")
