from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

from redis import asyncio as aioredis

from loguru import logger

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .settings import Settings


async def setup_redis_cache_service(settings: 'Settings') -> None:
    redis = aioredis.from_url(str(settings.REDIS_URL), encoding='utf8', decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix='topfunds-cache')
    logger.debug('setup_redis_cache_service() attached')


async def shutdown_redis_cache_service(settings: 'Settings') -> None:
    if settings.DEBUG is True:
        await FastAPICache.clear()
