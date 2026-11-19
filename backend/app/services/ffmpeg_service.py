import os
import asyncio
import subprocess
import logging
from typing import Optional
from ..config import settings

logger = logging.getLogger("mediaverse.ffmpeg")

class FFmpegService:
    def __init__(self):
        self.temp_dir = settings.TEMP_DIR

    async def _run_command(self, cmd: list) -> bool:
        loop = asyncio.get_event_loop()
        def execute():
            try:
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True,
                    timeout=180
                )
                return True
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
                logger.error(f"FFmpeg execution failed: {e}")
                return False
            except FileNotFoundError:
                logger.warning("FFmpeg binary not detected on host system.")
                return False

        return await loop.run_in_executor(None, execute)

    async def convert_audio(self, input_path: str, output_format: str, bitrate: str = "320k") -> Optional[str]:
        output_filename = f"{os.path.splitext(os.path.basename(input_path))[0]}.{output_format}"
        output_path = os.path.join(self.temp_dir, output_filename)

        cmd = ["ffmpeg", "-y", "-i", input_path]

        if output_format == "mp3":
            cmd.extend(["-vn", "-c:a", "libmp3lame", "-b:a", bitrate, output_path])
        elif output_format == "wav":
            cmd.extend(["-vn", "-c:a", "pcm_s16le", output_path])
        elif output_format == "aac":
            cmd.extend(["-vn", "-c:a", "aac", "-b:a", bitrate, output_path])
        elif output_format == "m4a":
            cmd.extend(["-vn", "-c:a", "aac", "-b:a", bitrate, output_path])
        else:
            cmd.extend(["-vn", output_path])

        success = await self._run_command(cmd)
        return output_path if success and os.path.exists(output_path) else None

    async def video_to_gif(self, input_path: str, fps: int = 15, scale: int = 480) -> Optional[str]:
        output_filename = f"{os.path.splitext(os.path.basename(input_path))[0]}.gif"
        output_path = os.path.join(self.temp_dir, output_filename)
        palette_path = os.path.join(self.temp_dir, "palette.png")

        # 2-pass high quality GIF generation
        cmd_palette = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", f"fps={fps},scale={scale}:-1:flags=lanczos,palettegen",
            palette_path
        ]
        
        cmd_gif = [
            "ffmpeg", "-y", "-i", input_path, "-i", palette_path,
            "-filter_complex", f"fps={fps},scale={scale}:-1:flags=lanczos[x];[x][1:v]paletteuse",
            output_path
        ]

        if await self._run_command(cmd_palette):
            success = await self._run_command(cmd_gif)
            if os.path.exists(palette_path):
                os.remove(palette_path)
            return output_path if success and os.path.exists(output_path) else None
        return None

    async def trim_video(self, input_path: str, start_time: float, end_time: float, extract_audio: bool = False) -> Optional[str]:
        ext = "mp3" if extract_audio else "mp4"
        output_filename = f"trimmed_{start_time}_{end_time}_{os.path.splitext(os.path.basename(input_path))[0]}.{ext}"
        output_path = os.path.join(self.temp_dir, output_filename)

        duration = max(0.1, end_time - start_time)

        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_time),
            "-i", input_path,
            "-t", str(duration)
        ]

        if extract_audio:
            cmd.extend(["-vn", "-c:a", "libmp3lame", "-b:a", "320k", output_path])
        else:
            cmd.extend(["-c:v", "libx264", "-c:a", "aac", "-strict", "experimental", output_path])

        success = await self._run_command(cmd)
        return output_path if success and os.path.exists(output_path) else None

ffmpeg_service = FFmpegService()
