#!/usr/bin/env python3
"""
Script to verify that the test fixes have resolved the connection errors.
"""

import sys
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.services.mcp import MCPService, get_mcp_client
from unittest.mock import MagicMock

async def verify_mcp_mocking():
    """Verify that MCP client can be properly mocked."""
    print("Testing MCP client mocking...")
    
    # Create a mock MCP client
    mock_client = MagicMock()
    mock_client.find_talent_by_skills.return_value = [{"id": "1", "name": "Test Talent"}]
    
    # Create an instance of MCPService with the mock client
    mcp_service = MCPService(mcp_client=mock_client)
    
    # Test the service with the mock
    result = await mcp_service.search_talent_pool(["Python"])
    
    if result == [{"id": "1", "name": "Test Talent"}]:
        print("✅ MCP service works correctly with mocked client")
    else:
        print(f"❌ MCP service returned unexpected result: {result}")
        return False
    
    return True

def verify_test_client():
    """Verify that TestClient works without connection errors."""
    print("\nTesting TestClient...")
    
    # Override the dependency to use a mock MCP client
    original_get_mcp_client = app.dependency_overrides.get(get_mcp_client, None)
    
    mock_client = MagicMock()
    mock_client.search_talent.return_value = [{"id": "1", "name": "Test Talent"}]
    app.dependency_overrides[get_mcp_client] = lambda: mock_client
    
    try:
        # Create a TestClient instance
        client = TestClient(app)
        
        # Test an MCP endpoint
        response = client.post("/api/v1/mcp/talent-search", json={"query": "test"})
        
        if response.status_code == 200:
            print(f"✅ TestClient works correctly with status code {response.status_code}")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ TestClient returned unexpected status code: {response.status_code}")
            print(f"Response: {response.json()}")
            return False
        
    except Exception as e:
        print(f"❌ Error using TestClient: {str(e)}")
        return False
    finally:
        # Restore the original dependency if it existed
        if original_get_mcp_client:
            app.dependency_overrides[get_mcp_client] = original_get_mcp_client
        else:
            del app.dependency_overrides[get_mcp_client]
    
    return True

if __name__ == "__main__":
    print("Test Verification\n" + "=" * 50)
    
    # Run the async verification function
    mcp_ok = asyncio.run(verify_mcp_mocking())
    client_ok = verify_test_client()
    
    if mcp_ok and client_ok:
        print("\n✅ All verifications passed. The test fixes appear to be working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some verifications failed. Please review the issues above.")
        sys.exit(1)
