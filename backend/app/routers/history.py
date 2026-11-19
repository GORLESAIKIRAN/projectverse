import time
from fastapi import APIRouter
from ..config import settings

router = APIRouter(tags=["System & Diagnostics"])

START_TIME = time.time()

@router.get("/api/health")
async def health_check():
    """
    Returns API health status, supported platforms, features, and system uptime.
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "supported_platforms": ["youtube", "instagram", "generic"],
        "features": {
            "youtube_downloader": True,
            "youtube_audio_converter": True,
            "instagram_downloader": True,
            "instagram_audio_extractor": True,
            "universal_converter": True,
            "video_editor": True,
            "audio_studio": True,
            "qr_generator": True
        }
    }
