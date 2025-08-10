"""
Common API Request/Response Models

This module defines shared Pydantic models used across multiple API endpoints.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# ============ COMMON RESPONSE MODELS ============

class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")


class SuccessResponse(BaseModel):
    """Standard success response model."""
    success: bool = Field(True, description="Operation success status")
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")


class PaginatedResponse(BaseModel):
    """Standard paginated response model."""
    items: List[Dict[str, Any]] = Field(..., description="List of items")
    total_count: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_previous: bool = Field(..., description="Whether there are previous pages")


class TransactionResponse(BaseModel):
    """Standard blockchain transaction response model."""
    success: bool = Field(..., description="Transaction success status")
    transaction_id: str = Field(..., description="Hedera transaction ID")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    network: str = Field(..., description="Hedera network (mainnet/testnet)")
    cost: Optional[float] = Field(None, description="Transaction cost in HBAR")
    receipt: Optional[Dict[str, Any]] = Field(None, description="Transaction receipt")


class BatchResponse(BaseModel):
    """Standard batch operation response model."""
    success: bool = Field(..., description="Overall batch success status")
    total_requested: int = Field(..., description="Total number of operations requested")
    successful: int = Field(..., description="Number of successful operations")
    failed: int = Field(..., description="Number of failed operations")
    results: List[Dict[str, Any]] = Field(..., description="Individual operation results")
    errors: List[str] = Field(default_factory=list, description="List of error messages")


# ============ COMMON REQUEST MODELS ============

class PaginationRequest(BaseModel):
    """Standard pagination request parameters."""
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: Optional[str] = Field("asc", description="Sort order (asc/desc)")


class SearchRequest(BaseModel):
    """Standard search request parameters."""
    query: Optional[str] = Field(None, description="Search query")
    filters: Optional[Dict[str, Any]] = Field(None, description="Search filters")
    pagination: Optional[PaginationRequest] = Field(None, description="Pagination parameters")


# ============ BLOCKCHAIN-SPECIFIC MODELS ============

class HederaAddressRequest(BaseModel):
    """Request model for Hedera address validation."""
    address: str = Field(..., description="Hedera account address")


class ContractCallRequest(BaseModel):
    """Request model for smart contract calls."""
    contract_address: str = Field(..., description="Contract address")
    function_name: str = Field(..., description="Function name to call")
    parameters: List[Any] = Field(default_factory=list, description="Function parameters")
    gas_limit: Optional[int] = Field(None, description="Gas limit for the call")
    value: Optional[float] = Field(None, description="HBAR value to send")


# ============ METADATA MODELS ============

class MetadataRequest(BaseModel):
    """Request model for metadata operations."""
    name: str = Field(..., description="Metadata name")
    description: Optional[str] = Field(None, description="Metadata description")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Metadata attributes")
    external_url: Optional[str] = Field(None, description="External URL")
    image_url: Optional[str] = Field(None, description="Image URL")


class IPFSResponse(BaseModel):
    """Response model for IPFS operations."""
    success: bool = Field(..., description="Upload success status")
    ipfs_hash: str = Field(..., description="IPFS hash")
    url: str = Field(..., description="IPFS URL")
    size: int = Field(..., description="File size in bytes")
    uploaded_at: datetime = Field(..., description="Upload timestamp")
