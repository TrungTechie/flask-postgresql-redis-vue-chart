from flask import Flask

from core.admin import setup_admin_service

from core.cli.cli import app

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.settings import Settings


@app.command()
def admin(settings: 'Settings', port: int = None) -> Flask | None:
    return setup_admin_service(settings=settings, port=port)


__all__ = (
    'admin',
)
