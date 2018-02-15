from celery import Celery
from celery.signals import setup_logging

from core.settings import get_application_settings
from .utils import application_modules

import asyncio


settings = get_application_settings()

app = Celery('topfunds', broker=settings.CELERY_BROKER_URL)
app.config_from_object(settings.celery_settings)
app.autodiscover_tasks(application_modules(), force=True)


@app.on_after_finalize.connect
def _on_celery_startup(sender, **kwargs):
    from core.db import setup_database_service_sync, setup_database_service

    setup_database_service_sync(settings)
    asyncio.run(setup_database_service(settings))


@setup_logging.connect
def _setup_logging(*args, **kwargs):
    from core.logger import InterceptHandler
    import logging

    logging.basicConfig(handlers=[InterceptHandler()], level=settings.LOGGING_LEVEL)


__all__ = (
    'app',
)
