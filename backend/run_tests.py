import os
import sys
import subprocess

def run_tests():
    """Run the tests and print the results."""
    print("Running MCP tests...")
    mcp_result = subprocess.run(
        ["python", "-m", "pytest", "backend/tests/test_mcp.py", "-v"], 
        capture_output=True, 
        text=True
    )
    print(f"MCP tests exit code: {mcp_result.returncode}")
    print(mcp_result.stdout)
    if mcp_result.stderr:
        print(f"Errors: {mcp_result.stderr}")
    
    print("\nRunning Pools tests...")
    pools_result = subprocess.run(
        ["python", "-m", "pytest", "backend/tests/test_pools.py", "-v"], 
        capture_output=True, 
        text=True
    )
    print(f"Pools tests exit code: {pools_result.returncode}")
    print(pools_result.stdout)
    if pools_result.stderr:
        print(f"Errors: {pools_result.stderr}")
    
    print("\nRunning Fixed Skills tests...")
    skills_fixed_result = subprocess.run(
        ["python", "-m", "pytest", "backend/tests/test_skills_fixed.py", "-v"], 
        capture_output=True, 
        text=True
    )
    print(f"Fixed Skills tests exit code: {skills_fixed_result.returncode}")
    print(skills_fixed_result.stdout)
    if skills_fixed_result.stderr:
        print(f"Errors: {skills_fixed_result.stderr}")
    
    print("\nRunning Fixed Reputation tests...")
    reputation_fixed_result = subprocess.run(
        ["python", "-m", "pytest", "backend/tests/test_reputation_fixed.py", "-v"], 
        capture_output=True, 
        text=True
    )
    print(f"Fixed Reputation tests exit code: {reputation_fixed_result.returncode}")
    print(reputation_fixed_result.stdout)
    if reputation_fixed_result.stderr:
        print(f"Errors: {reputation_fixed_result.stderr}")

if __name__ == "__main__":
    run_tests()
