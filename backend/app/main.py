import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .routers import downloader_router, converter_router, editor_router, history_router
from .services.cleanup_service import cleanup_service

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mediaverse")

# Rate limiting
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start cleanup worker in background
    cleanup_task = asyncio.create_task(cleanup_service.start_periodic_cleanup())
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} initialized successfully.")
    yield
    # Shutdown: Stop cleanup worker
    cleanup_service.stop()
    cleanup_task.cancel()
    logger.info("🛑 Application shutdown complete.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="GSK MEDIAVERSE - All-in-One Video & Audio Studio API with YouTube, Instagram, Converter & Editor capabilities.",
    lifespan=lifespan
)

# Set rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(downloader_router)
app.include_router(converter_router)
app.include_router(editor_router)
app.include_router(history_router)

@app.get("/")
async def root():
    return {
        "platform": "GSK MEDIAVERSE",
        "tagline": "One Platform. Endless Media Possibilities.",
        "documentation": "/docs",
        "status": "online"
    }
