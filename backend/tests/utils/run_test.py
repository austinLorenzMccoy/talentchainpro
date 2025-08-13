#!/usr/bin/env python3
import subprocess
import sys

def run_test(test_file):
    """Run a specific test file and print the output"""
    print(f"Running tests in {test_file}")
    result = subprocess.run(
        ["pytest", test_file, "-v"], 
        capture_output=True,
        text=True
    )
    print(f"Exit code: {result.returncode}")
    print("Output:")
    print(result.stdout)
    
    if result.stderr:
        print("Errors:")
        print(result.stderr)
    
    return result.returncode == 0

if __name__ == "__main__":
    test_files = [
        "tests/test_mcp.py",
        "tests/test_pools.py",
        "tests/test_skills.py",
        "tests/test_reputation.py"
    ]
    
    success = True
    for test_file in test_files:
        if not run_test(test_file):
            success = False
        print("\n" + "-" * 80 + "\n")
    
    if not success:
        sys.exit(1)
