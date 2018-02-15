from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from starlette.exceptions import HTTPException
from starlette.middleware.cors import CORSMiddleware

from core.exceptions import http_exception_handler, request_validation_exception_handler
from core.events import on_startup_handler, on_shutdown_handler

from router import router as api_router

from core.cli.cli import app

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.settings import Settings


@app.command(default_command=True)
def setup_application(settings: 'Settings') -> FastAPI:
    application = FastAPI(**settings.fastapi_settings)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    application.add_event_handler(
        'startup',
        on_startup_handler(settings),
    )

    application.add_event_handler(
        'shutdown',
        on_shutdown_handler(settings),
    )

    application.add_exception_handler(
        HTTPException,
        http_exception_handler,
    )

    application.add_exception_handler(
        RequestValidationError,
        request_validation_exception_handler,
    )

    application.include_router(api_router, prefix=settings.API_PREFIX)

    return application


__all__ = (
    'setup_application',
)
