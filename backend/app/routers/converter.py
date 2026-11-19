import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from ..services.ffmpeg_service import ffmpeg_service
from ..config import settings

router = APIRouter(prefix="/api/convert", tags=["Universal Media Converter"])

SUPPORTED_TARGETS = ["mp3", "wav", "aac", "m4a", "gif", "mp4"]

@router.post("/file")
async def convert_file(
    file: UploadFile = File(...),
    target_format: str = Form("mp3"),
    bitrate: str = Form("320k"),
    gif_fps: int = Form(15)
):
    """
    Converts user-uploaded media files between audio/video formats and GIFs.
    Supported: MP4 to MP3, MP4 to WAV, WAV to MP3, Video to GIF, Audio conversions.
    """
    target_format = target_format.lower().strip()
    if target_format not in SUPPORTED_TARGETS:
        raise HTTPException(
            status_code=400, 
            detail=f"Target format '{target_format}' unsupported. Choose from: {', '.join(SUPPORTED_TARGETS)}"
        )

    # Validate file size
    file_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1] or ".bin"
    temp_input = os.path.join(settings.TEMP_DIR, f"upload_{file_id}{ext}")

    try:
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_input)
        if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            os.remove(temp_input)
            raise HTTPException(status_code=413, detail=f"File exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

        # Process conversion
        if target_format == "gif":
            output_path = await ffmpeg_service.video_to_gif(temp_input, fps=gif_fps)
        elif target_format in ["mp3", "wav", "aac", "m4a"]:
            output_path = await ffmpeg_service.convert_audio(temp_input, output_format=target_format, bitrate=bitrate)
        else:
            output_path = temp_input

        if not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Conversion processing failed. Verify source media validity.")

        out_name = f"gsk_converted_{file_id}.{target_format}"
        return FileResponse(
            path=output_path,
            filename=out_name,
            media_type="application/octet-stream"
        )

    finally:
        if os.path.exists(temp_input):
            try:
                os.remove(temp_input)
            except OSError:
                pass
