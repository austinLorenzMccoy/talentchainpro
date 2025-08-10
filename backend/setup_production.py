#!/usr/bin/env python3
"""
Production Setup Script for TalentChain Pro
This script helps configure the system for production Hedera network usage.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_java_installation():
    """Check if Java is installed."""
    try:
        result = subprocess.run(['java', '-version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Java is installed")
            return True
        else:
            print("❌ Java is not installed")
            return False
    except FileNotFoundError:
        print("❌ Java is not installed")
        return False

def check_hedera_sdk():
    """Check if Hedera SDK is available."""
    try:
        import hedera
        print("✅ Hedera SDK is available")
        return True
    except ImportError:
        print("❌ Hedera SDK is not installed")
        return False

def check_pyjnius():
    """Check if PyJNIus is available."""
    try:
        import jnius
        print("✅ PyJNIus is available")
        return True
    except ImportError:
        print("❌ PyJNIus is not installed")
        return False

def install_dependencies():
    """Install required dependencies."""
    print("\n🔧 Installing dependencies...")
    
    # Install Hedera SDK
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'hedera-sdk'], check=True)
        print("✅ Installed hedera-sdk")
    except subprocess.CalledProcessError:
        print("❌ Failed to install hedera-sdk")
    
    # Install PyJNIus
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyjnius'], check=True)
        print("✅ Installed pyjnius")
    except subprocess.CalledProcessError:
        print("❌ Failed to install pyjnius")

def create_production_env():
    """Create production environment file."""
    env_content = """# Hedera Network Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY_HERE
HEDERA_MAX_TRANSACTION_FEE=100000000
HEDERA_MAX_QUERY_PAYMENT=50000000

# Contract Addresses (update these with your deployed contracts)
SKILL_TOKEN_CONTRACT=0.0.6545000
TALENT_POOL_CONTRACT=0.0.6545001
REPUTATION_ORACLE_CONTRACT=0.0.6545002
GOVERNANCE_CONTRACT=0.0.6545003

# Database Configuration
DATABASE_URL=sqlite:///./talentchain.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
"""
    
    env_file = Path('.env.production')
    env_file.write_text(env_content)
    print(f"✅ Created {env_file}")

def create_contracts_config():
    """Create contracts configuration file."""
    contracts_config = {
        "contracts": {
            "SkillToken": {
                "address": "0.0.6545000",
                "abi": [],
                "deployed_at": "2025-08-10T22:00:00Z"
            },
            "TalentPool": {
                "address": "0.0.6545001",
                "abi": [],
                "deployed_at": "2025-08-10T22:00:00Z"
            },
            "ReputationOracle": {
                "address": "0.0.6545002",
                "abi": [],
                "deployed_at": "2025-08-10T22:00:00Z"
            },
            "Governance": {
                "address": "0.0.6545003",
                "abi": [],
                "deployed_at": "2025-08-10T22:00:00Z"
            }
        }
    }
    
    config_file = Path('contracts.json')
    config_file.write_text(json.dumps(contracts_config, indent=2))
    print(f"✅ Created {config_file}")

def test_hedera_connection():
    """Test Hedera connection."""
    print("\n🧪 Testing Hedera connection...")
    
    try:
        # Try importing the hedera utilities
        sys.path.append('app')
        from app.utils.hedera import HEDERA_SDK_AVAILABLE, check_hedera_connection
        
        if HEDERA_SDK_AVAILABLE:
            print("✅ Hedera SDK is properly loaded")
            # Note: This would require valid credentials to actually test
            print("⚠️  Configure your .env.production with real credentials to test connection")
        else:
            print("❌ Hedera SDK is not available - still using mocks")
            
    except Exception as e:
        print(f"❌ Error testing Hedera connection: {e}")

def main():
    """Main setup function."""
    print("🚀 TalentChain Pro Production Setup")
    print("="*50)
    
    # Check current state
    print("\n📋 Checking current environment...")
    java_ok = check_java_installation()
    hedera_ok = check_hedera_sdk()
    pyjnius_ok = check_pyjnius()
    
    if not java_ok:
        print("\n⚠️  Please install Java first:")
        print("   macOS: brew install openjdk@11")
        print("   Ubuntu: sudo apt-get install openjdk-11-jdk")
        print("   Windows: Download from Oracle or OpenJDK")
        return
    
    if not hedera_ok or not pyjnius_ok:
        install_dependencies()
    
    # Create configuration files
    print("\n📝 Creating configuration files...")
    create_production_env()
    create_contracts_config()
    
    # Test connection
    test_hedera_connection()
    
    print("\n✅ Production setup complete!")
    print("\n📋 Next steps:")
    print("1. Update .env.production with your actual Hedera credentials")
    print("2. Update contracts.json with your deployed contract addresses")
    print("3. Set CONTRACTS_FILE=contracts.json in your environment")
    print("4. Restart your application")
    print("\n🔒 For mainnet:")
    print("   - Change HEDERA_NETWORK=mainnet")
    print("   - Use mainnet account IDs and contracts")
    print("   - Ensure sufficient HBAR balance for transactions")

if __name__ == "__main__":
    main()
