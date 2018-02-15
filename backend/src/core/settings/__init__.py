from pydantic import SecretStr, PostgresDsn, RedisDsn

from functools import lru_cache

from .base import BaseSettings

import logging, os


class Settings(BaseSettings):
    DEBUG: bool = False
    SECRET_KEY: SecretStr

    ALLOWED_HOSTS: list[str] = ['*']

    DOCS_URL: str = '/docs'
    OPENAPI_PREFIX: str = ''
    OPENAPI_URL: str = '/openapi.json'
    REDOC_URL: str = '/redoc'

    TITLE: str = 'TopFunds Application'
    VERSION: str = '1.0.0'

    DATABASE_URL: PostgresDsn
    MIN_CONNECTION_COUNT: int = 10
    MAX_CONNECTION_COUNT: int = 10

    ADMIN_PREFIX: str = '/admin'
    ADMIN_DEFAULT_PORT: int = 8000
    ADMIN_VIEWS_FOLDER: str = os.path.join(os.getcwd(), 'admin', 'views')

    API_PREFIX: str = '/api'
    API_AUTHENTICATION_ENDPOINT: str = 'api/v1/user/login'
    JWT_TOKEN_LIFETIME: int = 86400

    LOGGING_LEVEL: int = logging.INFO
    LOGGERS: list[str] = ['uvicorn.asgi', 'uvicorn.access', 'celery']

    REDIS_URL: RedisDsn = 'redis://127.0.0.1:6379/0'

    CELERY_BROKER_URL: str = str(REDIS_URL)
    CELERY_RESULT_BACKEND: str = str(CELERY_BROKER_URL)
    CELERY_ACCEPT_CONTENT: list[str] = ['application/json']
    CELERY_TASK_SERIALIZER: str = 'json'
    CELERY_RESULT_SERIALIZER: str = 'json'

    IEXCLOUD_API_TOKEN: str = ''

    class Config:
        validate_assignment = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.CELERY_BROKER_URL = kwargs.get('CELERY_BROKER_URL', str(self.REDIS_URL))
        self.CELERY_RESULT_BACKEND = self.CELERY_BROKER_URL

    @property
    def fastapi_settings(self) -> dict[str, any]:
        return {
            'debug': self.DEBUG,
            'docs_url': self.DOCS_URL,
            'openapi_prefix': self.OPENAPI_PREFIX,
            'openapi_url': self.OPENAPI_URL,
            'redoc_url': self.REDOC_URL,
            'title': self.TITLE,
            'version': self.VERSION,
        }

    @property
    def celery_settings(self) -> dict[str, any]:
        return {
            'broker_url': self.CELERY_BROKER_URL,
            'result_backend': self.CELERY_RESULT_BACKEND,
            'task_serializer': self.CELERY_TASK_SERIALIZER,
            'accept_content': self.CELERY_ACCEPT_CONTENT,
            'result_serializer': self.CELERY_RESULT_SERIALIZER,
            'broker_connection_retry_on_startup': True,
        }


@lru_cache
def get_application_settings() -> Settings:
    return Settings()


__all__ = (
    'Settings',
    'get_application_settings',
)
