from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from .exceptions import ApplicationError

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If an unexpected error occurs (and DRF handler returns None)
    # but it's one of our ApplicationError types
    if isinstance(exc, ApplicationError):
        data = {
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": exc.timestamp.isoformat()
            }
        }
        return Response(data, status=exc.status_code)

    # If DRF already handled it (e.g. 401, 403, 400 validation)
    if response is not None:
        code = "API_ERROR"
        if response.status_code == 401:
            code = "UNAUTHORIZED"
        elif response.status_code == 403:
            code = "FORBIDDEN"
        elif response.status_code == 404:
            code = "NOT_FOUND"
        elif response.status_code == 400:
            code = "VALIDATION_ERROR"

        # Build a human-readable message: extract the first string from field errors
        # instead of using str(exc) which produces an ugly Python dict repr.
        message = str(exc)
        raw = response.data
        if isinstance(raw, dict):
            for errors in raw.values():
                if isinstance(errors, list) and errors:
                    message = str(errors[0])
                    break
        elif isinstance(raw, list) and raw:
            message = str(raw[0])

        standardized_data = {
            "error": {
                "code": code,
                "message": message,
                "details": response.data,
            }
        }

        response.data = standardized_data

    # If we get here and response is still None, it's an unhandled system exception (500)
    if response is None:
        return Response({
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server.",
                "details": str(exc) if context.get('request').user.is_staff else None
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
