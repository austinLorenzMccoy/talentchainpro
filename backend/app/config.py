"""
Configuration Management for TalentChain Pro Backend

This module provides centralized configuration management with environment variable
validation and default values for development and production environments.

Based on the complete contract analysis, this supports all 4 main contracts:
1. SkillToken - Soulbound NFTs for skill verification
2. TalentPool - Job pool management and matching  
3. Governance - DAO governance and protocol management
4. ReputationOracle - AI-powered reputation scoring
"""

import os
from typing import Optional, List
from pydantic import Field, validator
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application Settings
    app_name: str = Field(default="TalentChain Pro API", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    development_mode: bool = Field(default=True, env="DEVELOPMENT_MODE")
    
    # API Settings
    api_prefix: str = Field(default="/api/v1", env="API_PREFIX")
    host: str = Field(default="0.0.0.0", env="API_HOST")
    port: int = Field(default=8000, env="API_PORT")
    reload: bool = Field(default=True, env="API_RELOAD")
    workers: int = Field(default=1, env="API_WORKERS")
    
    # Security Settings
    secret_key: str = Field(default="dev-secret-key-change-in-production", env="SECRET_KEY")
    jwt_secret_key: str = Field(default="your-super-secret-jwt-key-change-this-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=30, env="JWT_EXPIRE_MINUTES")
    encryption_key: str = Field(default="your-32-byte-encryption-key-change-this", env="ENCRYPTION_KEY")
    
    # CORS Settings
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"], 
        env="CORS_ORIGINS"
    )
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    
    # Database Settings
    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/talentchainpro",
        env="DATABASE_URL"
    )
    # SQLite fallback database (for development when PostgreSQL is not available)
    sqlite_database_url: str = Field(
        default="sqlite:///./talentchainpro.db",
        env="SQLITE_DATABASE_URL"
    )
    # Auto-fallback to SQLite if PostgreSQL is not available
    database_auto_fallback: bool = Field(default=True, env="DATABASE_AUTO_FALLBACK")
    database_echo: bool = Field(default=False, env="DATABASE_ECHO")
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    
    # Hedera Blockchain Settings
    hedera_network: str = Field(default="testnet", env="HEDERA_NETWORK")
    hedera_account_id: str = Field(default="0.0.YOUR_ACCOUNT_ID", env="HEDERA_ACCOUNT_ID")
    hedera_private_key: str = Field(default="YOUR_PRIVATE_KEY", env="HEDERA_PRIVATE_KEY")
    hedera_public_key: Optional[str] = Field(None, env="HEDERA_PUBLIC_KEY")
    hedera_mirror_node_url: str = Field(
        default="https://testnet.mirrornode.hedera.com", 
        env="HEDERA_MIRROR_NODE_URL"
    )
    
    # Smart Contract Addresses (All 4 main contracts)
    # Placeholders until deployment - will be updated by deployment script
    contract_skill_token: str = Field(default="", env="CONTRACT_SKILL_TOKEN")
    contract_talent_pool: str = Field(default="", env="CONTRACT_TALENT_POOL")
    contract_governance: str = Field(default="", env="CONTRACT_GOVERNANCE")
    contract_reputation_oracle: str = Field(default="", env="CONTRACT_REPUTATION_ORACLE")
    
    # AI/ML Services
    groq_api_key: str = Field(default="your_groq_api_key_here", env="GROQ_API_KEY")
    groq_model: str = Field(default="mixtral-8x7b-32768", env="GROQ_MODEL")
    openai_api_key: Optional[str] = Field(default="your_openai_key_if_using_openai", env="OPENAI_API_KEY")
    
    # MCP Server Configuration
    mcp_server_host: str = Field(default="localhost", env="MCP_SERVER_HOST")
    mcp_server_port: int = Field(default=3001, env="MCP_SERVER_PORT")
    mcp_server_url: str = Field(default="ws://localhost:3001/ws", env="MCP_SERVER_URL")
    mcp_timeout: int = Field(default=30, env="MCP_TIMEOUT")
    
    # External APIs
    ipfs_gateway_url: str = Field(
        default="https://ipfs.io/ipfs/",
        env="IPFS_GATEWAY_URL"
    )
    ipfs_upload_url: str = Field(
        default="https://api.pinata.cloud/pinning/pinFileToIPFS",
        env="IPFS_UPLOAD_URL"
    )
    pinata_api_key: Optional[str] = Field(None, env="PINATA_API_KEY")
    pinata_secret_key: Optional[str] = Field(None, env="PINATA_SECRET_KEY")
    
    # Rate Limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # Monitoring & Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    sentry_dsn: Optional[str] = Field(None, env="SENTRY_DSN")
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    
    # Background Jobs
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1",
        env="CELERY_BROKER_URL"
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2",
        env="CELERY_RESULT_BACKEND"
    )
    
    # Cache Settings
    cache_ttl_default: int = Field(default=300, env="CACHE_TTL")  # 5 minutes
    cache_ttl_skill_tokens: int = Field(default=600, env="CACHE_TTL_SKILL_TOKENS")  # 10 minutes
    cache_ttl_pools: int = Field(default=180, env="CACHE_TTL_POOLS")  # 3 minutes
    cache_ttl_reputation: int = Field(default=900, env="CACHE_TTL_REPUTATION")  # 15 minutes
    
    # Performance Settings
    max_connections: int = Field(default=100, env="MAX_CONNECTIONS")
    keep_alive_timeout: int = Field(default=65, env="KEEP_ALIVE_TIMEOUT")
    
    # File Upload Settings
    max_file_size: int = Field(default=10485760, env="MAX_FILE_SIZE")  # 10MB
    upload_directory: str = Field(default="./uploads", env="UPLOAD_DIRECTORY")
    
    # Email Configuration
    smtp_server: Optional[str] = Field(None, env="SMTP_SERVER")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_username: Optional[str] = Field(None, env="SMTP_USERNAME")
    smtp_password: Optional[str] = Field(None, env="SMTP_PASSWORD")
    email_from: str = Field(default="noreply@talentchainpro.io", env="EMAIL_FROM")
    
    # Webhook Configuration
    webhook_secret: str = Field(default="your-webhook-secret-key", env="WEBHOOK_SECRET")
    
    # Testing Configuration
    test_database_url: str = Field(
        default="postgresql://test_user:test_pass@localhost:5432/test_talentchainpro", 
        env="TEST_DATABASE_URL"
    )
    test_hedera_account_id: str = Field(default="0.0.TEST_ACCOUNT", env="TEST_HEDERA_ACCOUNT_ID")
    test_hedera_private_key: str = Field(default="test_private_key", env="TEST_HEDERA_PRIVATE_KEY")
    
    def get_effective_database_url(self) -> str:
        """
        Get the effective database URL with automatic fallback to SQLite.
        
        Returns:
            str: Database URL to use (PostgreSQL or SQLite fallback)
        """
        if not self.database_auto_fallback:
            return self.database_url
        
        # If explicitly set to SQLite, use it
        if self.database_url.startswith("sqlite://"):
            return self.database_url
        
        # For PostgreSQL, test connection availability
        if self.database_url.startswith("postgresql://"):
            try:
                # Try to test PostgreSQL connection
                import psycopg2
                from urllib.parse import urlparse
                
                parsed = urlparse(self.database_url)
                test_conn = psycopg2.connect(
                    host=parsed.hostname,
                    port=parsed.port or 5432,
                    user=parsed.username,
                    password=parsed.password,
                    database=parsed.path[1:] if parsed.path else '',
                    connect_timeout=3
                )
                test_conn.close()
                return self.database_url
            except (ImportError, Exception):
                # PostgreSQL not available, fallback to SQLite
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(
                    f"PostgreSQL not available ({self.database_url}), "
                    f"falling back to SQLite: {self.sqlite_database_url}"
                )
                return self.sqlite_database_url
        
        # Default fallback
        return self.database_url
    
    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            # Handle JSON string format
            if v.startswith('[') and v.endswith(']'):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Handle comma-separated format
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("hedera_network")
    def validate_hedera_network(cls, v):
        """Validate Hedera network selection."""
        valid_networks = ["testnet", "mainnet", "previewnet"]
        if v not in valid_networks:
            raise ValueError(f"Invalid Hedera network. Must be one of: {valid_networks}")
        return v
    
    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment setting."""
        valid_environments = ["development", "staging", "production"]
        if v not in valid_environments:
            raise ValueError(f"Invalid environment. Must be one of: {valid_environments}")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


# Environment-specific configurations
class DevelopmentSettings(Settings):
    """Development environment settings."""
    debug: bool = True
    log_level: str = "DEBUG"
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    development_mode: bool = True


class ProductionSettings(Settings):
    """Production environment settings."""
    debug: bool = False
    log_level: str = "WARNING"
    development_mode: bool = False
    
    @validator("secret_key")
    def validate_production_secret(cls, v):
        """Ensure production secret key is not default."""
        if v == "dev-secret-key-change-in-production":
            raise ValueError("Production secret key must be changed from default")
        return v
    
    @validator("jwt_secret_key")
    def validate_production_jwt_secret(cls, v):
        """Ensure production JWT secret key is not default."""
        if v == "your-super-secret-jwt-key-change-this-in-production":
            raise ValueError("Production JWT secret key must be changed from default")
        return v


class TestingSettings(Settings):
    """Testing environment settings."""
    debug: bool = True
    database_url: str = "postgresql://talentchain:password@localhost:5432/talentchain_test"
    redis_url: str = "redis://localhost:6379/15"
    development_mode: bool = True


def get_environment_settings() -> Settings:
    """Get settings based on current environment."""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()


# Export the settings instance
settings = get_environment_settings()
