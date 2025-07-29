#!/usr/bin/env python3
"""
Script to run a specific test function directly to verify our fixes.
"""

import sys
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import MagicMock
import pytest

# Import the test functions directly
from tests.test_mcp import test_talent_search
from tests.test_pools import test_create_pool
from tests.test_skills import test_create_skill_token

def run_mcp_test():
    """Run the MCP talent search test directly."""
    print("Running MCP talent search test...")
    
    # Create a mock MCP client
    mock_mcp_client = MagicMock()
    mock_mcp_client.search_talent.return_value = [{"id": "1", "name": "Test Talent"}]
    
    # Create a TestClient
    client = TestClient(app)
    
    # Override the dependency
    app.dependency_overrides[app.dependency_overrides] = lambda: mock_mcp_client
    
    try:
        # Run the test function
        test_talent_search(client, mock_mcp_client)
        print("✅ MCP test passed")
        return True
    except Exception as e:
        print(f"❌ MCP test failed: {str(e)}")
        return False
    finally:
        # Clean up
        if app.dependency_overrides:
            del app.dependency_overrides[app.dependency_overrides]

def run_pools_test():
    """Run the pools create test directly."""
    print("\nRunning pools create test...")
    
    # Create a TestClient
    client = TestClient(app)
    
    # Create a job pool request
    job_pool_request = {
        "company_id": "0.0.12345",
        "title": "Software Engineer",
        "description": "Backend developer position",
        "required_skills": ["Python", "FastAPI"],
        "stake_amount": 100.0
    }
    
    try:
        # Run the test function
        test_create_pool(client, job_pool_request)
        print("✅ Pools test passed")
        return True
    except Exception as e:
        print(f"❌ Pools test failed: {str(e)}")
        return False

def run_skills_test():
    """Run the skills create test directly."""
    print("\nRunning skills create test...")
    
    # Create a TestClient
    client = TestClient(app)
    
    # Create a mock skill service
    mock_skill_service = MagicMock()
    mock_skill_service.mint_skill_token.return_value = {
        "token_id": "0.0.54321",
        "recipient_id": "0.0.12345",
        "skill_name": "Python"
    }
    
    # Create a skill token request
    skill_token_request = {
        "recipient_id": "0.0.12345",
        "skill_name": "Python",
        "level": 3,
        "issuer_id": "0.0.67890"
    }
    
    try:
        # Run the test function
        test_create_skill_token(client, mock_skill_service, skill_token_request)
        print("✅ Skills test passed")
        return True
    except Exception as e:
        print(f"❌ Skills test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Running Specific Tests\n" + "=" * 50)
    
    mcp_ok = run_mcp_test()
    pools_ok = run_pools_test()
    skills_ok = run_skills_test()
    
    if mcp_ok and pools_ok and skills_ok:
        print("\n✅ All tests passed. The fixes appear to be working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please review the issues above.")
        sys.exit(1)
