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
    
    print("\nRunning Skills tests...")
    skills_result = subprocess.run(
        ["python", "-m", "pytest", "backend/tests/test_skills.py", "-v"], 
        capture_output=True, 
        text=True
    )
    print(f"Skills tests exit code: {skills_result.returncode}")
    print(skills_result.stdout)
    if skills_result.stderr:
        print(f"Errors: {skills_result.stderr}")
    
    print("\nRunning Reputation tests...")
    reputation_result = subprocess.run(
        ["python", "-m", "pytest", "backend/tests/test_reputation.py", "-v"], 
        capture_output=True, 
        text=True
    )
    print(f"Reputation tests exit code: {reputation_result.returncode}")
    print(reputation_result.stdout)
    if reputation_result.stderr:
        print(f"Errors: {reputation_result.stderr}")

if __name__ == "__main__":
    run_tests()
