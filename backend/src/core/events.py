from loguru import logger

from typing import Callable, TYPE_CHECKING

from .db import setup_database_service, shutdown_database_service
from .redis import setup_redis_cache_service, shutdown_redis_cache_service

if TYPE_CHECKING:
    from .settings import Settings


def on_startup_handler(settings: 'Settings') -> Callable:
    async def start_app() -> None:
        logger.debug('Application startup requested')

        await setup_database_service(settings)
        await setup_redis_cache_service(settings)

    return start_app


def on_shutdown_handler(settings: 'Settings') -> Callable:
    @logger.catch
    async def stop_app() -> None:
        logger.debug('Application shutdown requested')

        await shutdown_database_service()
        await shutdown_redis_cache_service(settings)

    return stop_app
