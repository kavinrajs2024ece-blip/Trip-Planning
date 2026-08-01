"""
In-Memory Cache Service
=======================
Thread-safe caching module with automatic expiration (TTL = 10 minutes / 600s).
Caches repeated API requests for Google Places, Weather, Hotels, and Geocoding.
"""

import time
import threading
import logging
from typing import Any, Optional

logger = logging.getLogger("cache_service")

class SimpleCache:
    def __init__(self, default_ttl: int = 600):
        self._cache = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        """Retrieves item if present and not expired."""
        with self._lock:
            if key not in self._cache:
                return None
            
            entry = self._cache[key]
            if time.time() > entry["expires_at"]:
                del self._cache[key]
                logger.info(f"[CACHE EXPIRED] Key '{key}' removed.")
                return None
            
            logger.info(f"[CACHE HIT] Reusing cached response for key '{key}'.")
            return entry["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stores item with TTL (default 600 seconds = 10 minutes)."""
        actual_ttl = ttl if ttl is not None else self.default_ttl
        expires_at = time.time() + actual_ttl
        with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": expires_at
            }
            logger.info(f"[CACHE SET] Stored key '{key}' (TTL={actual_ttl}s).")

    def clear(self) -> None:
        """Clears all cached entries."""
        with self._lock:
            self._cache.clear()

# Global Singleton Cache Instance (10-minute TTL)
memory_cache = SimpleCache(default_ttl=600)
