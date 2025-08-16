"""
Authentication and Authorization Utilities

This module provides utilities for handling user authentication,
authorization, and context management in the TalentChain Pro backend.
"""

import jwt
import logging
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta

from app.config import get_settings

logger = logging.getLogger(__name__)

# Security scheme for JWT tokens
security = HTTPBearer()

class AuthContext:
    """Authentication context for request handling."""
    
    def __init__(self, user_address: str, user_id: Optional[str] = None, 
                 permissions: Optional[list] = None):
        self.user_address = user_address
        self.user_id = user_id
        self.permissions = permissions or []
        self.authenticated_at = datetime.now(timezone.utc)
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        return permission in self.permissions
    
    def is_authenticated(self) -> bool:
        """Check if user is authenticated."""
        return bool(self.user_address)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary."""
        return {
            "user_address": self.user_address,
            "user_id": self.user_id,
            "permissions": self.permissions,
            "authenticated_at": self.authenticated_at.isoformat()
        }

class AuthManager:
    """Authentication manager for handling JWT tokens and user context."""
    
    def __init__(self):
        self.settings = get_settings()
        self.secret_key = self.settings.jwt_secret_key
        self.algorithm = self.settings.jwt_algorithm
        self.expire_minutes = self.settings.jwt_expire_minutes
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.JWTError as e:
            logger.warning(f"JWT token verification failed: {str(e)}")
            return None
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Extract user information from JWT token."""
        payload = self.verify_token(token)
        if payload:
            return {
                "user_address": payload.get("sub"),  # Subject is typically the user address
                "user_id": payload.get("user_id"),
                "permissions": payload.get("permissions", []),
                "expires_at": payload.get("exp")
            }
        return None

# Global auth manager instance
auth_manager = AuthManager()

async def get_current_user(request: Request) -> Optional[AuthContext]:
    """
    Get the current authenticated user from the request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        AuthContext object or None if not authenticated
    """
    try:
        # Check for JWT token in Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            user_data = auth_manager.get_user_from_token(token)
            if user_data:
                return AuthContext(
                    user_address=user_data["user_address"],
                    user_id=user_data["user_id"],
                    permissions=user_data["permissions"]
                )
        
        # Check for API key in headers (alternative authentication)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            # TODO: Implement API key validation
            # For now, return a mock authenticated user
            return AuthContext(
                user_address="0.0.123456",  # Mock address
                user_id="mock_user",
                permissions=["read", "write"]
            )
        
        # Check for wallet signature in headers (blockchain authentication)
        wallet_signature = request.headers.get("X-Wallet-Signature")
        wallet_address = request.headers.get("X-Wallet-Address")
        if wallet_signature and wallet_address:
            # TODO: Implement wallet signature validation
            # For now, return the wallet address as authenticated user
            return AuthContext(
                user_address=wallet_address,
                user_id=f"wallet_{wallet_address}",
                permissions=["read", "write", "governance"]
            )
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        return None

async def require_auth(request: Request) -> AuthContext:
    """
    Require authentication for a request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        AuthContext object
        
    Raises:
        HTTPException: If user is not authenticated
    """
    user = await get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def require_permission(request: Request, permission: str) -> AuthContext:
    """
    Require a specific permission for a request.
    
    Args:
        request: FastAPI request object
        permission: Required permission
        
    Returns:
        AuthContext object
        
    Raises:
        HTTPException: If user doesn't have required permission
    """
    user = await require_auth(request)
    if not user.has_permission(permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{permission}' required"
        )
    return user

def get_mock_auth_context() -> AuthContext:
    """
    Get a mock authentication context for development/testing.
    
    Returns:
        Mock AuthContext object
    """
    return AuthContext(
        user_address="0.0.123456",
        user_id="mock_user",
        permissions=["read", "write", "governance", "oracle"]
    )

# Dependency functions for FastAPI
async def get_auth_context(request: Request) -> Optional[AuthContext]:
    """FastAPI dependency for getting authentication context."""
    return await get_current_user(request)

async def get_authenticated_user(request: Request) -> AuthContext:
    """FastAPI dependency for requiring authentication."""
    return await require_auth(request)

async def get_governance_user(request: Request) -> AuthContext:
    """FastAPI dependency for governance operations."""
    return await require_permission(request, "governance")

async def get_oracle_user(request: Request) -> AuthContext:
    """FastAPI dependency for oracle operations."""
    return await require_permission(request, "oracle")
