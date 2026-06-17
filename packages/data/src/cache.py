from __future__ import annotations

import time
from typing import Optional

import redis

from src.config.settings import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

_redis: Optional[redis.Redis] = None
_redis_last_attempt: float = 0.0
_REDIS_RETRY_INTERVAL = 60


def _get_redis() -> Optional[redis.Redis]:
    global _redis, _redis_last_attempt
    if _redis is not None:
        return _redis

    now = time.time()
    if now - _redis_last_attempt < _REDIS_RETRY_INTERVAL:
        return None
    _redis_last_attempt = now

    try:
        client = redis.Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
        )
        client.ping()
        _redis = client
        logger.info("Redis 연결 성공")
        return _redis
    except Exception as e:
        logger.warning(f"Redis 연결 실패 (캐시 없이 동작): {e}")
        return None


def cache_get(key: str) -> Optional[str]:
    r = _get_redis()
    if r is None:
        return None
    try:
        return r.get(key)
    except Exception:
        return None


def cache_set(key: str, value: str, ttl: int = 3600) -> None:
    r = _get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl, value)
    except Exception:
        pass


def cache_delete(key: str) -> None:
    r = _get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception:
        pass
