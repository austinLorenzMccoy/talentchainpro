#!/usr/bin/env python3
"""
Test MCP server integration with TalentChain Pro.

This script tests the MCP server integration by initializing the MCP client
and verifying that it can connect to the server and process queries.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Import the MCP client
from app.utils.mcp_server import get_mcp_client

async def test_mcp_connection():
    """Test the MCP server connection and configuration."""
    print("Testing MCP server connection...")
    
    # Get MCP client
    mcp_client = get_mcp_client()
    
    # Print configuration
    print(f"\nMCP Client Configuration:")
    print(f"MCP Server URL: {mcp_client.mcp_url}")
    print(f"Auth Token: {'Configured' if mcp_client.auth_token else 'Not configured'}")
    print(f"Registry Topic ID: {mcp_client.registry_topic_id or 'Not configured'}")
    print(f"Reputation Topic ID: {mcp_client.reputation_topic_id or 'Not configured'}")
    
    # Test connection if URL is configured
    if mcp_client.mcp_url:
        try:
            # Simple test query
            test_query = "Hello, MCP server!"
            print(f"\nSending test query: '{test_query}'")
            
            response = await mcp_client.process_query(test_query)
            print(f"\nMCP server response:")
            print(f"Output: {response.get('output', 'No output')}")
            print(f"Data: {response.get('data', 'No data')}")
            
            print("\nMCP server connection test successful!")
        except Exception as e:
            print(f"\nError connecting to MCP server: {str(e)}")
            print("\nPossible causes:")
            print("1. MCP server is not running")
            print("2. MCP_SERVER_URL is incorrect")
            print("3. MCP_AUTH_TOKEN is invalid")
            print("\nPlease check your configuration and ensure the MCP server is running.")
    else:
        print("\nMCP_SERVER_URL is not configured. Please set it in your .env file.")

async def main():
    """Run all MCP integration tests."""
    print("=== TalentChain Pro MCP Integration Test ===\n")
    
    # Check environment variables
    mcp_url = os.getenv("MCP_SERVER_URL")
    mcp_auth_token = os.getenv("MCP_AUTH_TOKEN")
    registry_topic = os.getenv("HCS_REGISTRY_TOPIC")
    
    print("Environment Variables Check:")
    print(f"MCP_SERVER_URL: {'✓' if mcp_url else '✗'}")
    print(f"MCP_AUTH_TOKEN: {'✓' if mcp_auth_token else '✗'}")
    print(f"HCS_REGISTRY_TOPIC: {'✓' if registry_topic else '✗'}")
    
    # Test MCP connection
    await test_mcp_connection()
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    asyncio.run(main())
