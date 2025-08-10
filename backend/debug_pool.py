#!/usr/bin/env python3
"""Debug script to test pool service directly."""

import asyncio
import sys
import traceback

async def test_pool_service():
    """Test the pool service apply_to_pool method."""
    try:
        from app.services.pool import TalentPoolService
        
        print("Creating pool service...")
        service = TalentPoolService()
        
        print("Testing apply_to_pool method...")
        result = await service.apply_to_pool(
            pool_id="test_pool",
            applicant_address="0.0.12345",
            skill_token_ids=["skill_1", "skill_2"],
            cover_letter="Test application"
        )
        
        print(f"Result: {result}")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_pool_service())
    sys.exit(0 if result else 1)
