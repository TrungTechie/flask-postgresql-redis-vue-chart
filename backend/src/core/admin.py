from flask import (
    Flask,
    Response,
    send_from_directory,
    render_template,
    request,
    redirect,
    url_for,
    session
)

from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

from functools import lru_cache
from typing import TYPE_CHECKING, Callable

from .db import get_sync_session_maker, setup_database_service_sync

from passlib.context import CryptContext

from users.dependencies import use_user_repository

from time import time

import os, importlib

if TYPE_CHECKING:
    from .db.base import BaseModel
    from .settings import Settings


@lru_cache
def get_admin_instance() -> Admin:
    return Admin(name='TopFunds', template_mode='bootstrap4', base_template='template.html')


class AdminModelView(ModelView):
    pass


def register_view(model: type['BaseModel']) -> Callable:
    def _decorator(view: type[AdminModelView]) -> AdminModelView:
        instance = view(model, get_sync_session_maker())
        get_admin_instance().add_view(instance)
        return instance
    return _decorator


def setup_admin_service(settings: 'Settings', port: int = None) -> Flask | None:
    setup_database_service_sync(settings)

    if not port:
        port = settings.ADMIN_DEFAULT_PORT

    template_folder = os.path.join(os.getcwd(), 'admin', 'templates')
    static_folder = os.path.join(os.getcwd(), 'admin', 'static')

    flask = Flask('admin', template_folder=template_folder)
    flask.secret_key = str(settings.SECRET_KEY)
    flask.debug = settings.DEBUG
    flask.config.update({
        'FLASK_ADMIN_SWATCH': 'united',
        'FLASK_ADMIN_FLUID_LAYOUT': True,
        'FILES_DIR': static_folder,
    })

    admin_service = get_admin_instance()
    admin_service.init_app(flask)

    for root, dirs, files in os.walk(settings.ADMIN_VIEWS_FOLDER):
        check_extension = filter(lambda x: x.endswith('.py'), files)
        for command in check_extension:
            path = os.path.join(root, command)
            spec = importlib.util.spec_from_file_location(command, os.path.abspath(path))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

    @flask.route('/files/<path:file>')
    def retrieve_files(file: str) -> Response:
        return send_from_directory(static_folder, file)

    @flask.route('/admin/login', methods=['GET', 'POST'])
    def login() -> Response:
        error = None

        if request.method == "POST":
            email = request.form['email']
            password = request.form['password']
            remember_me = request.form.get("rememberMe", None)

            repository = use_user_repository()

            if user := repository.find_one(email=email):
                crypt_context = CryptContext(
                    schemes=["bcrypt"], deprecated="auto"
                )

                if crypt_context.verify(password, user.hashed_password):
                    session["user_id"] = user.id
                    session["lifetime"] = time() + settings.JWT_TOKEN_LIFETIME
                    session["remember"] = remember_me

                    return redirect(url_for('admin.index'))

            error = "Wrong email or password"

        return render_template("login.html", error=error)

    @flask.route('/admin/logout')
    def logout() -> Response:
        session.clear()
        return redirect(url_for('login'))

    @flask.before_request
    def before_request():
        if request.endpoint not in ["login"]:
            repository = use_user_repository()

            if user_id := session.get("user_id", None):
                if repository.find_one(id=user_id):
                    if session["lifetime"] - time() > 0 or session["remember"]:
                        return
            return redirect('/admin/login')

    if settings.DEBUG is True:
        flask.run(port=port)
    else:
        return flask
