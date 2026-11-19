from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Literal

class MediaInfoRequest(BaseModel):
    url: str = Field(..., description="Target media URL (YouTube or Instagram)")
    platform: Optional[Literal["youtube", "instagram", "auto"]] = "auto"

class FormatOption(BaseModel):
    format_id: str
    extension: str
    resolution: Optional[str] = None
    note: Optional[str] = None
    filesize_approx: Optional[int] = None
    has_audio: bool = True
    has_video: bool = True
    fps: Optional[int] = None

class MediaMetadataResponse(BaseModel):
    id: str
    title: str
    url: str
    platform: Literal["youtube", "instagram", "generic"]
    thumbnail: Optional[str] = None
    duration: Optional[int] = 0
    duration_formatted: Optional[str] = "00:00"
    uploader: Optional[str] = None
    view_count: Optional[int] = None
    available_video_formats: List[FormatOption] = []
    available_audio_formats: List[FormatOption] = []
    is_live: bool = False
    is_authorized: bool = True
    notice: Optional[str] = None

class DownloadRequest(BaseModel):
    url: str
    format_type: Literal["video", "audio"] = "video"
    quality: Optional[str] = "best"  # "1080p", "720p", "480p", "360p", "best"
    audio_format: Optional[Literal["mp3", "wav", "aac", "m4a"]] = "mp3"
    audio_bitrate: Optional[str] = "320k"
    format_id: Optional[str] = None

class DownloadJobResponse(BaseModel):
    job_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    download_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    format: Optional[str] = None
    error: Optional[str] = None

class VideoTrimRequest(BaseModel):
    start_time: float = Field(0.0, ge=0)
    end_time: float = Field(..., gt=0)
    extract_audio_only: bool = False
    output_format: Optional[str] = "mp4"

class AudioProcessRequest(BaseModel):
    start_time: Optional[float] = 0.0
    end_time: Optional[float] = None
    playback_speed: Optional[float] = 1.0
    volume_gain: Optional[float] = 1.0
    output_format: Literal["mp3", "wav", "aac", "m4a"] = "mp3"
