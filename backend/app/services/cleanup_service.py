import os
import time
import asyncio
import logging
from ..config import settings

logger = logging.getLogger("mediaverse.cleanup")

class CleanupService:
    def __init__(self):
        self.temp_dir = settings.TEMP_DIR
        self.ttl = settings.FILE_TTL_SECONDS
        self._is_running = False

    async def start_periodic_cleanup(self):
        self._is_running = True
        logger.info(f"Cleanup service started for directory: {self.temp_dir}")
        while self._is_running:
            try:
                self.clean_old_files()
            except Exception as e:
                logger.error(f"Error during cleanup execution: {e}")
            await asyncio.sleep(settings.CLEANUP_INTERVAL_MINUTES * 60)

    def clean_old_files(self):
        now = time.time()
        count = 0
        if not os.path.exists(self.temp_dir):
            return

        for fname in os.listdir(self.temp_dir):
            fpath = os.path.join(self.temp_dir, fname)
            if os.path.isfile(fpath):
                file_age = now - os.path.getmtime(fpath)
                if file_age > self.ttl:
                    try:
                        os.remove(fpath)
                        count += 1
                    except OSError:
                        pass
        if count > 0:
            logger.info(f"Cleaned up {count} expired temporary files.")

    def stop(self):
        self._is_running = False

cleanup_service = CleanupService()
