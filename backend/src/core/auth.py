from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy

from .settings import get_application_settings


settings = get_application_settings()

bearer_transport = BearerTransport(tokenUrl='api/v1/user/login')


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=settings.SECRET_KEY, lifetime_seconds=settings.JWT_TOKEN_LIFETIME)


auth_backend = AuthenticationBackend(
    name='jwt',
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


__all__ = (
    'auth_backend',
)
