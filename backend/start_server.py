#!/usr/bin/env python3
"""
Startup script for TalentChain Pro Backend

This script initializes the database and starts the FastAPI application
with automatic fallback from PostgreSQL to SQLite.
"""

import sys
import os
import uvicorn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize the database with automatic fallback."""
    try:
        from app.database import init_database
        from app.config import get_settings
        
        settings = get_settings()
        logger.info("Initializing TalentChain Pro backend...")
        logger.info(f"Environment: {settings.environment}")
        logger.info(f"Debug mode: {settings.debug}")
        
        init_database()
        logger.info("Database initialization completed")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False

def start_server():
    """Start the FastAPI server."""
    from app.config import get_settings
    
    settings = get_settings()
    
    logger.info("Starting TalentChain Pro API server...")
    logger.info(f"Server will be available at: http://{settings.host}:{settings.port}")
    logger.info("API documentation will be available at: http://localhost:8000/docs")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload and settings.development_mode,
        workers=settings.workers if not settings.development_mode else 1,
        log_level="info" if not settings.debug else "debug"
    )

if __name__ == "__main__":
    # Initialize database first
    if not initialize_database():
        logger.error("Failed to initialize database. Exiting.")
        sys.exit(1)
    
    # Start the server
    try:
        start_server()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)
