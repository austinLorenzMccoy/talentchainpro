"""
TalentChain Pro - FastAPI Backend Entry Point

This module serves as the main entry point for the TalentChain Pro FastAPI application.
It initializes the FastAPI app, includes all routers, and sets up middleware.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.api import skills, pools, mcp
from app.utils.hedera import initialize_hedera_client
from app.utils.mcp_server import get_mcp_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Define lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Initializing Hedera client...")
    initialize_hedera_client()
    
    logger.info("Initializing MCP client...")
    get_mcp_client()
    
    logger.info("Application startup complete")
    
    yield  # This is where the app runs
    
    # Shutdown logic
    logger.info("Application shutting down")

# Create FastAPI app
app = FastAPI(
    title="TalentChain Pro API",
    description="Hedera-based talent ecosystem with AI reputation oracles",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(skills.router, prefix="/api/v1/skills", tags=["skills"])
app.include_router(pools.router, prefix="/api/v1/pools", tags=["pools"])
app.include_router(mcp.router, prefix="/api/v1/mcp", tags=["mcp"])

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and return appropriate response."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Lifecycle events are now handled by the lifespan context manager

@app.get("/", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "TalentChain Pro API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
