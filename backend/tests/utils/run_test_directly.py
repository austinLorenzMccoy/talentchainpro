#!/usr/bin/env python3
"""
Script to run a specific test directly to verify our fixes.
"""

import sys
import pytest

if __name__ == "__main__":
    print("Running MCP Tests...")
    # Run the MCP tests with verbose output
    mcp_result = pytest.main(["-xvs", "tests/test_mcp.py"])
    
    print("\nRunning Pools Tests...")
    # Run the Pools tests with verbose output
    pools_result = pytest.main(["-xvs", "tests/test_pools.py"])
    
    print("\nRunning Skills Tests...")
    # Run the Skills tests with verbose output
    skills_result = pytest.main(["-xvs", "tests/test_skills.py"])
    
    print("\nRunning Reputation Tests...")
    # Run the Reputation tests with verbose output
    reputation_result = pytest.main(["-xvs", "tests/test_reputation.py"])
    
    # Check if all tests passed
    if mcp_result == 0 and pools_result == 0 and skills_result == 0 and reputation_result == 0:
        print("\n✅ All tests passed. The fixes have successfully resolved the connection errors.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. The fixes may not have fully resolved the connection errors.")
        sys.exit(1)
