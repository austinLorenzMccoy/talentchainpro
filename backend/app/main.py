"""
TalentChain Pro - FastAPI Backend Entry Point

This module serves as the main entry point for the TalentChain Pro FastAPI application.
It initializes the FastAPI app, includes all routers, and sets up middleware.
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.api import skills, pools, mcp, reputation, governance
from app.utils.hedera import initialize_hedera_client, check_hedera_connection, check_contract_deployments
from app.utils.mcp_server import get_mcp_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Try to import database components
try:
    from app.database import check_database_connection
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False

# Define lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Initializing TalentChain Pro backend...")
    
    logger.info("Initializing Hedera client...")
    try:
        initialize_hedera_client()
        
        # Check Hedera connection health
        hedera_health = await check_hedera_connection()
        logger.info(f"Hedera connection status: {hedera_health['status']}")
        
        # Check contract deployments
        contract_status = await check_contract_deployments()
        logger.info(f"Contract deployment status: {contract_status}")
        
    except Exception as e:
        logger.warning(f"Hedera initialization warning: {str(e)}")
    
    logger.info("Initializing MCP client...")
    try:
        get_mcp_client()
    except Exception as e:
        logger.warning(f"MCP client initialization warning: {str(e)}")
    
    # Check database connection if available
    if DATABASE_AVAILABLE:
        try:
            db_health = await check_database_connection()
            logger.info(f"Database connection status: {db_health}")
        except Exception as e:
            logger.warning(f"Database connection warning: {str(e)}")
    
    logger.info("Application startup complete")
    
    yield  # This is where the app runs
    
    # Shutdown logic
    logger.info("Application shutting down gracefully")

# Create FastAPI app with enhanced configuration
app = FastAPI(
    title="TalentChain Pro API",
    description="Enterprise-grade Hedera-based talent ecosystem with AI reputation oracles and comprehensive skill management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    contact={
        "name": "TalentChain Pro Team",
        "email": "support@talentchainpro.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    }
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with comprehensive API coverage
app.include_router(skills.router, prefix="/api/v1/skills", tags=["Skills Management"])
app.include_router(pools.router, prefix="/api/v1/pools", tags=["Talent Pools"])
app.include_router(governance.router, prefix="/api/v1/governance", tags=["Governance & Voting"])
app.include_router(reputation.router, prefix="/api/v1/reputation", tags=["Reputation & Oracles"])
app.include_router(mcp.router, prefix="/api/v1/mcp", tags=["AI & Analytics"])

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and return appropriate response."""
    # Convert error context to string to ensure JSON serializability
    errors = []
    for error in exc.errors():
        error_dict = dict(error)
        if 'ctx' in error_dict and 'error' in error_dict['ctx']:
            error_dict['ctx']['error'] = str(error_dict['ctx']['error'])
        errors.append(error_dict)
    
    logger.warning(f"Validation error on {request.url}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": errors, 
            "body": exc.body,
            "message": "Request validation failed"
        },
    )


@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    """Handle internal server errors."""
    logger.error(f"Internal server error on {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "message": "An unexpected error occurred"
        },
    )

# Health and status endpoints
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "TalentChain Pro API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "skills": "/api/v1/skills",
            "pools": "/api/v1/pools", 
            "governance": "/api/v1/governance",
            "reputation": "/api/v1/reputation",
            "mcp": "/api/v1/mcp",
            "docs": "/docs",
            "health": "/health"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Comprehensive health check endpoint."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {}
    }
    
    # Check Hedera connection
    try:
        hedera_health = await check_hedera_connection()
        health_status["services"]["hedera"] = hedera_health
    except Exception as e:
        health_status["services"]["hedera"] = {"status": "unhealthy", "error": str(e)}
    
    # Check contract deployments
    try:
        contract_health = await check_contract_deployments()
        health_status["services"]["contracts"] = {"status": "checked", "contracts": contract_health}
    except Exception as e:
        health_status["services"]["contracts"] = {"status": "error", "error": str(e)}
    
    # Check database if available
    if DATABASE_AVAILABLE:
        try:
            db_health = await check_database_connection()
            health_status["services"]["database"] = db_health
        except Exception as e:
            health_status["services"]["database"] = {"status": "unhealthy", "error": str(e)}
    else:
        health_status["services"]["database"] = {"status": "fallback", "note": "Using in-memory storage"}
    
    # Check MCP service
    try:
        mcp_client = get_mcp_client()
        health_status["services"]["mcp"] = {"status": "available" if mcp_client else "unavailable"}
    except Exception as e:
        health_status["services"]["mcp"] = {"status": "error", "error": str(e)}
    
    # Determine overall status
    service_statuses = [s.get("status") for s in health_status["services"].values()]
    if any(status in ["unhealthy", "error"] for status in service_statuses):
        health_status["status"] = "degraded"
    
    return health_status


@app.get("/metrics", tags=["Monitoring"])
async def get_metrics():
    """Get basic application metrics."""
    return {
        "uptime": "Available in production deployment",
        "requests_total": "Available in production deployment", 
        "active_connections": "Available in production deployment",
        "error_rate": "Available in production deployment",
        "note": "Detailed metrics require production monitoring setup"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
