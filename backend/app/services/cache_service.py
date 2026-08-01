"""
App Services Cache Service Alias
================================
Re-exports memory_cache and SimpleCache for app.services package namespace.
"""

from services.cache_service import SimpleCache, memory_cache

__all__ = ["SimpleCache", "memory_cache"]
