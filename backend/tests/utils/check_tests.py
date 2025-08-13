import subprocess
import sys

def run_test(test_path):
    print(f"Running test: {test_path}")
    process = subprocess.Popen(
        [sys.executable, "-m", "pytest", test_path, "-v"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate()
    print("STDOUT:")
    print(stdout)
    print("STDERR:")
    print(stderr)
    print(f"Exit code: {process.returncode}")
    return process.returncode == 0

if __name__ == "__main__":
    test_files = [
        "backend/tests/test_skills_fixed.py",
        "backend/tests/test_reputation_fixed.py",
        "backend/tests/test_pools.py",
        "backend/tests/test_mcp.py"
    ]
    
    all_passed = True
    for test_file in test_files:
        if not run_test(test_file):
            all_passed = False
        print("-" * 80)
    
    if all_passed:
        print("All tests passed!")
    else:
        print("Some tests failed!")
        sys.exit(1)
