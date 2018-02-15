from types import FrameType
from typing import cast, TYPE_CHECKING

from loguru import logger

import logging, sys

if TYPE_CHECKING:
    from .settings import Settings


class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = str(record.levelno)

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = cast(FrameType, frame.f_back)
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level,
            record.getMessage(),
        )


def configure_logging(settings: 'Settings') -> None:
    logging.getLogger().handlers = [InterceptHandler()]

    for logger_name in settings.LOGGERS:
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler(level=settings.LOGGING_LEVEL)]

    logger.configure(handlers=[{'sink': sys.stderr, 'level': settings.LOGGING_LEVEL}])
