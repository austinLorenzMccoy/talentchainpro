"""
Configuration Management for TalentChain Pro Backend

This module provides centralized configuration management with environment variable
validation and default values for development and production environments.
"""

import os
from typing import Optional, List
from pydantic import BaseSettings, Field, validator
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application Settings
    app_name: str = Field(default="TalentChain Pro API", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # API Settings
    api_prefix: str = Field(default="/api/v1", env="API_PREFIX")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Security Settings
    secret_key: str = Field(default="dev-secret-key-change-in-production", env="SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=1440, env="JWT_EXPIRE_MINUTES")  # 24 hours
    
    # CORS Settings
    cors_origins: List[str] = Field(
        default=["*"], 
        env="CORS_ORIGINS"
    )
    
    # Database Settings
    database_url: str = Field(
        default="postgresql://talentchain:password@localhost:5432/talentchain_dev",
        env="DATABASE_URL"
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    
    # Hedera Blockchain Settings
    hedera_network: str = Field(default="testnet", env="HEDERA_NETWORK")
    hedera_account_id: str = Field(..., env="HEDERA_ACCOUNT_ID")
    hedera_private_key: str = Field(..., env="HEDERA_PRIVATE_KEY")
    hedera_public_key: Optional[str] = Field(None, env="HEDERA_PUBLIC_KEY")
    
    # Smart Contract Addresses
    contract_skill_token: str = Field(..., env="CONTRACT_SKILL_TOKEN")
    contract_talent_pool: str = Field(..., env="CONTRACT_TALENT_POOL")
    contract_governance: Optional[str] = Field(None, env="CONTRACT_GOVERNANCE")
    contract_reputation_oracle: Optional[str] = Field(None, env="CONTRACT_REPUTATION_ORACLE")
    
    # AI/MCP Settings
    groq_api_key: str = Field(..., env="GROQ_API_KEY")
    mcp_server_host: str = Field(default="localhost", env="MCP_SERVER_HOST")
    mcp_server_port: int = Field(default=3001, env="MCP_SERVER_PORT")
    
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
    cache_ttl_default: int = Field(default=300, env="CACHE_TTL_DEFAULT")  # 5 minutes
    cache_ttl_skill_tokens: int = Field(default=600, env="CACHE_TTL_SKILL_TOKENS")  # 10 minutes
    cache_ttl_pools: int = Field(default=180, env="CACHE_TTL_POOLS")  # 3 minutes
    cache_ttl_reputation: int = Field(default=900, env="CACHE_TTL_REPUTATION")  # 15 minutes
    
    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
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


class ProductionSettings(Settings):
    """Production environment settings."""
    debug: bool = False
    log_level: str = "WARNING"
    
    @validator("secret_key")
    def validate_production_secret(cls, v):
        """Ensure production secret key is not default."""
        if v == "dev-secret-key-change-in-production":
            raise ValueError("Production secret key must be changed from default")
        return v


class TestingSettings(Settings):
    """Testing environment settings."""
    debug: bool = True
    database_url: str = "postgresql://talentchain:password@localhost:5432/talentchain_test"
    redis_url: str = "redis://localhost:6379/15"


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
