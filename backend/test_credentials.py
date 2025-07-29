#!/usr/bin/env python3
"""
Test script to verify TalentChain Pro credentials and MCP integration.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

def check_hedera_credentials():
    """Check if Hedera credentials are properly configured."""
    operator_id = os.getenv("HEDERA_OPERATOR_ID")
    operator_key = os.getenv("HEDERA_OPERATOR_KEY")
    contract_id = os.getenv("CONTRACT_SKILL_TOKEN")
    reputation_topic = os.getenv("HCS_REPUTATION_TOPIC")
    registry_topic = os.getenv("HCS_REGISTRY_TOPIC")
    
    print("\n=== Hedera Credentials Check ===")
    print(f"HEDERA_OPERATOR_ID: {'✓' if operator_id else '✗'} {operator_id}")
    print(f"HEDERA_OPERATOR_KEY: {'✓' if operator_key else '✗'} {'[Hidden]' if operator_key else 'Not set'}")
    print(f"CONTRACT_SKILL_TOKEN: {'✓' if contract_id else '✗'} {contract_id}")
    print(f"HCS_REPUTATION_TOPIC: {'✓' if reputation_topic else '✗'} {reputation_topic}")
    print(f"HCS_REGISTRY_TOPIC: {'✓' if registry_topic else '✗'} {registry_topic}")
    
    all_valid = all([operator_id, operator_key, contract_id, reputation_topic, registry_topic])
    print(f"\nAll Hedera credentials valid: {'✓' if all_valid else '✗'}")
    return all_valid

def check_ai_credentials():
    """Check if AI credentials are properly configured."""
    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL")
    
    print("\n=== AI Credentials Check ===")
    print(f"GROQ_API_KEY: {'✓' if groq_api_key else '✗'} {'[Hidden]' if groq_api_key else 'Not set'}")
    print(f"GROQ_MODEL: {'✓' if groq_model else '✗'} {groq_model}")
    
    all_valid = all([groq_api_key, groq_model])
    print(f"\nAll AI credentials valid: {'✓' if all_valid else '✗'}")
    return all_valid

def check_mcp_credentials():
    """Check if MCP server credentials are properly configured."""
    mcp_url = os.getenv("MCP_SERVER_URL")
    mcp_auth_token = os.getenv("MCP_AUTH_TOKEN")
    
    print("\n=== MCP Server Credentials Check ===")
    print(f"MCP_SERVER_URL: {'✓' if mcp_url else '✗'} {mcp_url}")
    print(f"MCP_AUTH_TOKEN: {'✓' if mcp_auth_token else '✗'} {'[Hidden]' if mcp_auth_token else 'Not set'}")
    
    all_valid = all([mcp_url, mcp_auth_token])
    print(f"\nAll MCP credentials valid: {'✓' if all_valid else '✗'}")
    return all_valid

async def test_mcp_import():
    """Test importing MCP client module."""
    print("\n=== Testing MCP Module Import ===")
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
        from app.utils.mcp_server import get_mcp_client
        print("✓ Successfully imported MCP client module")
        
        # Try initializing the client
        try:
            mcp_client = get_mcp_client()
            print("✓ Successfully initialized MCP client")
            print(f"  - MCP URL: {mcp_client.mcp_url}")
            print(f"  - Registry Topic: {mcp_client.registry_topic_id}")
            return True
        except Exception as e:
            print(f"✗ Failed to initialize MCP client: {str(e)}")
            return False
    except Exception as e:
        print(f"✗ Failed to import MCP client module: {str(e)}")
        return False

async def main():
    """Run all credential tests."""
    print("=== TalentChain Pro Credentials Test ===")
    
    hedera_valid = check_hedera_credentials()
    ai_valid = check_ai_credentials()
    mcp_valid = check_mcp_credentials()
    mcp_import_valid = await test_mcp_import()
    
    print("\n=== Summary ===")
    print(f"Hedera Credentials: {'✓' if hedera_valid else '✗'}")
    print(f"AI Credentials: {'✓' if ai_valid else '✗'}")
    print(f"MCP Credentials: {'✓' if mcp_valid else '✗'}")
    print(f"MCP Module Import: {'✓' if mcp_import_valid else '✗'}")
    
    all_valid = all([hedera_valid, ai_valid, mcp_valid, mcp_import_valid])
    print(f"\nOverall Status: {'✓ All credentials valid!' if all_valid else '✗ Some credentials invalid'}")
    
    if not all_valid:
        print("\nRecommendations:")
        if not hedera_valid:
            print("- Check your Hedera credentials in the .env file")
        if not ai_valid:
            print("- Verify your GROQ API key and model settings")
        if not mcp_valid:
            print("- Ensure MCP server URL and auth token are set")
        if not mcp_import_valid:
            print("- Check your MCP client implementation and dependencies")

if __name__ == "__main__":
    asyncio.run(main())
