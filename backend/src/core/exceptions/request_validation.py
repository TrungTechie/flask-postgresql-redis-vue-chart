from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import validation_error_response_definition
from fastapi.openapi.constants import REF_PREFIX

from pydantic import ValidationError

from starlette.responses import JSONResponse
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from starlette.requests import Request


async def request_validation_exception_handler(
    _: 'Request',
    exception: RequestValidationError | ValidationError,
) -> JSONResponse:
    return JSONResponse({'errors': exception.errors()}, status_code=HTTP_422_UNPROCESSABLE_ENTITY)


validation_error_response_definition['properties'] = {
    'errors': {
        'title': 'Errors',
        'type': 'array',
        'items': {'$ref': '{0}ValidationError'.format(REF_PREFIX)},
    },
}

__all__ = (
    'request_validation_exception_handler',
)
