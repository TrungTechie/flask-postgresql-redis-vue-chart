from fastapi import HTTPException

from starlette.requests import Request
from starlette.responses import JSONResponse

from core.schemas import Error, ErrorWrapper


async def http_exception_handler(_: Request, exception: HTTPException) -> JSONResponse:
    serializer = ErrorWrapper()
    
    if isinstance(exception.detail, dict):
        serializer.errors = [Error(field=field, detail=detail) for field, detail in exception.detail.items()]
    else:
        serializer.errors = [Error(detail=exception.detail)]

    return JSONResponse(serializer.model_dump(exclude_none=True), status_code=exception.status_code)


__all__ = (
    'http_exception_handler',
)
