import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from ..services.ffmpeg_service import ffmpeg_service
from ..config import settings

router = APIRouter(prefix="/api/editor", tags=["Video & Audio Editor"])

@router.post("/trim")
async def trim_media(
    file: UploadFile = File(...),
    start_time: float = Form(0.0),
    end_time: float = Form(...),
    extract_audio_only: bool = Form(False)
):
    """
    Precision video trimming and audio extraction:
    - Select start and end times
    - Cut unwanted segments
    - Optionally extract audio track only
    """
    if start_time < 0 or end_time <= start_time:
        raise HTTPException(status_code=400, detail="Invalid start/end time range. End time must be greater than start time.")

    file_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1] or ".mp4"
    temp_input = os.path.join(settings.TEMP_DIR, f"trim_in_{file_id}{ext}")

    try:
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_input)
        if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"File exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

        output_path = await ffmpeg_service.trim_video(
            temp_input,
            start_time=start_time,
            end_time=end_time,
            extract_audio=extract_audio_only
        )

        if not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Trimming failed. Please check the video format.")

        out_ext = "mp3" if extract_audio_only else "mp4"
        out_name = f"gsk_trimmed_{start_time}s_to_{end_time}s_{file_id}.{out_ext}"

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
