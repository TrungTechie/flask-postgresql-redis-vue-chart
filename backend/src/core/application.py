from core.settings import get_application_settings
from core.logger import configure_logging
from core.cli import app as cli_app


def setup_application() -> any:
    settings = get_application_settings()
    print("************************** this is setup_application ********************************")
    print(settings)
    configure_logging(settings)

    application = cli_app(settings)

    return application

__all__ = (
    'setup_application',
)