#!/usr/bin/env python3
"""
Test database setup with automatic fallback from PostgreSQL to SQLite.
"""

import sys
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.config import get_settings
    from app.database import init_database, check_database_health, get_database_url
    
    def test_database_setup():
        """Test database initialization and fallback logic."""
        print("=" * 60)
        print("Testing TalentChain Pro Database Setup")
        print("=" * 60)
        
        # Test configuration
        settings = get_settings()
        print(f"Environment: {settings.environment}")
        print(f"Debug mode: {settings.debug}")
        print(f"Auto-fallback enabled: {settings.database_auto_fallback}")
        
        # Test database URL selection
        effective_url = get_database_url()
        print(f"Configured PostgreSQL URL: {settings.database_url}")
        print(f"SQLite fallback URL: {settings.sqlite_database_url}")
        print(f"Effective database URL: {effective_url}")
        
        if effective_url.startswith("sqlite"):
            print("✅ Using SQLite database (PostgreSQL not available)")
        else:
            print("✅ Using PostgreSQL database")
        
        # Test database initialization
        print("\n" + "-" * 40)
        print("Initializing database...")
        try:
            init_database()
            print("✅ Database initialization successful")
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False
        
        # Test database health
        print("\n" + "-" * 40)
        print("Checking database health...")
        health = check_database_health()
        
        print(f"Database status: {health['database']['status']}")
        if health['database']['error']:
            print(f"Database error: {health['database']['error']}")
        
        print(f"Redis status: {health['redis']['status']}")
        if health['redis']['error']:
            print(f"Redis error: {health['redis']['error']}")
        
        # Test basic database operations
        print("\n" + "-" * 40)
        print("Testing basic database operations...")
        try:
            from app.database import get_db_session
            from app.models.database import SkillToken, SkillCategoryEnum
            from datetime import datetime, timezone
            import uuid
            
            with get_db_session() as db:
                # Test creating a skill token record
                test_token = SkillToken(
                    token_id="test_token_123",
                    owner_address="0.0.123456",
                    skill_name="Test Skill",
                    skill_category=SkillCategoryEnum.FRONTEND,
                    level=1,
                    experience_points=100,
                    contract_address="0.0.CONTRACT",
                    transaction_id="test_tx_123",
                    block_timestamp=datetime.now(timezone.utc)
                )
                
                db.add(test_token)
                db.commit()
                
                # Test querying
                found_token = db.query(SkillToken).filter_by(token_id="test_token_123").first()
                if found_token:
                    print("✅ Database operations successful")
                    print(f"   Created and retrieved skill token: {found_token.skill_name}")
                    
                    # Cleanup
                    db.delete(found_token)
                    db.commit()
                    print("✅ Test data cleaned up")
                else:
                    print("❌ Failed to retrieve test data")
                    return False
                    
        except Exception as e:
            print(f"❌ Database operations failed: {e}")
            return False
        
        print("\n" + "=" * 60)
        print("✅ Database setup test completed successfully!")
        print("=" * 60)
        return True

    if __name__ == "__main__":
        success = test_database_setup()
        sys.exit(0 if success else 1)
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the backend directory and all dependencies are installed.")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)
