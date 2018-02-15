from fastapi import HTTPException


class APIError(HTTPException):
    status_code: int
    field: str
    detail: str

    def __init__(self, field: str = None, **kwargs) -> None:
        if field is not None:
            self.field = field

        if self.field and self.detail:
            detail = {self.field: self.detail}
        else:
            detail = self.detail

        super().__init__(detail=detail, status_code=self.status_code, **kwargs)
