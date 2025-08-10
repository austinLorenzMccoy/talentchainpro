"""
Database Connection and Session Management

This module provides database connection pooling, session management,
and migration utilities for the TalentChain Pro backend.
"""

import logging
from typing import Generator, Optional
from contextlib import contextmanager, asynccontextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import SQLAlchemyError
import redis
from redis.exceptions import RedisError

from app.config import get_settings
from app.models.database import Base, create_tables

# Configure logging
logger = logging.getLogger(__name__)

# Global variables for database connections
engine = None
SessionLocal = None
redis_client = None


def get_database_url() -> str:
    """Get the database URL from settings with automatic fallback."""
    settings = get_settings()
    return settings.get_effective_database_url()


def create_database_engine():
    """Create and configure the database engine."""
    global engine
    
    if engine is not None:
        return engine
    
    settings = get_settings()
    database_url = get_database_url()  # This will get the effective URL with fallback
    
    # Base engine configuration
    engine_kwargs = {
        "echo": settings.debug,  # Log SQL queries in debug mode
    }
    
    # Database-specific configuration
    if database_url.startswith("sqlite"):
        # SQLite configuration
        engine_kwargs.update({
            "poolclass": StaticPool,
            "connect_args": {"check_same_thread": False}
        })
    else:
        # PostgreSQL configuration
        engine_kwargs.update({
            "pool_pre_ping": True,
            "pool_recycle": 3600,  # Recycle connections every hour
            "pool_size": 10,
            "max_overflow": 20,
        })
    
    try:
        engine = create_engine(database_url, **engine_kwargs)
        
        # Configure connection events
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            """Configure SQLite settings on connection."""
            if database_url.startswith("sqlite"):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()
        
        logger.info(f"Database engine created successfully for: {database_url}")
        return engine
        
    except Exception as e:
        logger.error(f"Failed to create database engine: {str(e)}")
        raise


def create_session_factory():
    """Create the session factory."""
    global SessionLocal, engine
    
    if SessionLocal is not None:
        return SessionLocal
    
    if engine is None:
        engine = create_database_engine()
    
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    
    logger.info("Database session factory created")
    return SessionLocal


def get_redis_client():
    """Get Redis client for caching."""
    global redis_client
    
    if redis_client is not None:
        return redis_client
    
    settings = get_settings()
    
    try:
        redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        
        # Test connection
        redis_client.ping()
        logger.info("Redis client connected successfully")
        return redis_client
        
    except RedisError as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        # Return None if Redis is not available (graceful degradation)
        return None


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    
    Yields:
        Session: SQLAlchemy database session
    """
    if SessionLocal is None:
        create_session_factory()
    
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.
    
    Yields:
        Session: SQLAlchemy database session
    """
    if SessionLocal is None:
        create_session_factory()
    
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


@asynccontextmanager
async def get_async_db_session():
    """
    Async context manager for database sessions.
    
    Note: This is a placeholder for future async implementation.
    Currently uses sync session in async context.
    """
    with get_db_session() as session:
        yield session


def init_database():
    """Initialize the database with tables and indexes."""
    try:
        logger.info("Initializing database...")
        
        # Create engine if not exists
        if engine is None:
            create_database_engine()
        
        # Create all tables
        create_tables(engine)
        logger.info("Database tables created successfully")
        
        # Create session factory
        create_session_factory()
        
        # Test database connection
        with get_db_session() as db:
            # Simple query to test connection
            from sqlalchemy import text
            result = db.execute(text("SELECT 1")).fetchone()
            if result:
                logger.info("Database connection test successful")
        
        logger.info("Database initialization complete")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise


def close_database_connections():
    """Close all database connections."""
    global engine, SessionLocal, redis_client
    
    try:
        if SessionLocal:
            SessionLocal.close_all()
            logger.info("Database sessions closed")
        
        if engine:
            engine.dispose()
            logger.info("Database engine disposed")
        
        if redis_client:
            redis_client.close()
            logger.info("Redis client closed")
        
        # Reset global variables
        engine = None
        SessionLocal = None
        redis_client = None
        
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}")


def check_database_health() -> dict:
    """
    Check database and Redis health.
    
    Returns:
        dict: Health status of database connections
    """
    health_status = {
        "database": {"status": "unknown", "error": None},
        "redis": {"status": "unknown", "error": None}
    }
    
    # Check database
    try:
        with get_db_session() as db:
            from sqlalchemy import text
            db.execute(text("SELECT 1")).fetchone()
        health_status["database"]["status"] = "healthy"
    except Exception as e:
        health_status["database"]["status"] = "unhealthy"
        health_status["database"]["error"] = str(e)
        logger.error(f"Database health check failed: {str(e)}")
    
    # Check Redis
    try:
        redis_client = get_redis_client()
        if redis_client:
            redis_client.ping()
            health_status["redis"]["status"] = "healthy"
        else:
            health_status["redis"]["status"] = "disabled"
    except Exception as e:
        health_status["redis"]["status"] = "unhealthy"
        health_status["redis"]["error"] = str(e)
        logger.error(f"Redis health check failed: {str(e)}")
    
    return health_status


# Cache utilities
class CacheManager:
    """Redis cache manager with fallback."""
    
    def __init__(self):
        self._redis_client = None
        self._initialized = False
        self.settings = get_settings()
    
    @property
    def redis_client(self):
        """Lazy initialization of Redis client."""
        if not self._initialized:
            self._redis_client = get_redis_client()
            self._initialized = True
        return self._redis_client
    
    def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        if not self.redis_client:
            return None
        
        try:
            return self.redis_client.get(key)
        except RedisError as e:
            logger.warning(f"Cache get error for key {key}: {str(e)}")
            return None
    
    def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL."""
        if not self.redis_client:
            return False
        
        try:
            if ttl is None:
                ttl = self.settings.cache_ttl_default
            
            return self.redis_client.setex(key, ttl, value)
        except RedisError as e:
            logger.warning(f"Cache set error for key {key}: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.redis_client:
            return False
        
        try:
            return bool(self.redis_client.delete(key))
        except RedisError as e:
            logger.warning(f"Cache delete error for key {key}: {str(e)}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern."""
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except RedisError as e:
            logger.warning(f"Cache invalidation error for pattern {pattern}: {str(e)}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        if not self.redis_client:
            return False
        
        try:
            return bool(self.redis_client.exists(key))
        except RedisError as e:
            logger.warning(f"Cache exists check error for key {key}: {str(e)}")
            return False


# Database utility functions
def execute_sql_file(file_path: str):
    """Execute SQL commands from a file."""
    try:
        with open(file_path, 'r') as file:
            sql_commands = file.read()
        
        with get_db_session() as db:
            # Split commands and execute individually
            commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
            for command in commands:
                db.execute(command)
        
        logger.info(f"SQL file executed successfully: {file_path}")
        
    except Exception as e:
        logger.error(f"Failed to execute SQL file {file_path}: {str(e)}")
        raise


def backup_database(backup_path: str):
    """Create a database backup (PostgreSQL specific)."""
    import subprocess
    import os
    
    settings = get_settings()
    database_url = settings.database_url
    
    try:
        # Extract database info from URL
        # postgresql://user:password@host:port/database
        if not database_url.startswith("postgresql://"):
            raise ValueError("Backup only supported for PostgreSQL")
        
        # Use pg_dump for backup
        env = os.environ.copy()
        env["PGPASSWORD"] = database_url.split(":")[-3].split("@")[0]
        
        result = subprocess.run([
            "pg_dump",
            "-h", database_url.split("@")[1].split(":")[0],
            "-p", database_url.split(":")[-2].split("/")[0],
            "-U", database_url.split("://")[1].split(":")[0],
            "-d", database_url.split("/")[-1],
            "-f", backup_path
        ], env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Database backup created: {backup_path}")
        else:
            raise Exception(f"pg_dump failed: {result.stderr}")
    
    except Exception as e:
        logger.error(f"Database backup failed: {str(e)}")
        raise


# Singleton cache manager instance
cache_manager = CacheManager()
