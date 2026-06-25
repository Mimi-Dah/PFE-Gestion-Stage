from datetime import datetime

class ApplicationError(Exception):
    """Base exception for all application errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: dict = None, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}
        self.status_code = status_code
        self.timestamp = datetime.utcnow()

class ValidationError(ApplicationError):
    """Raised when validation fails."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="VALIDATION_ERROR", details=details, status_code=400)

class NotFoundError(ApplicationError):
    """Raised when resource not found."""
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} with ID {identifier} not found" if identifier else f"{resource} not found"
        super().__init__(message, code="NOT_FOUND", status_code=404)

class UnauthorizedError(ApplicationError):
    """Raised when authentication fails (401)."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, code="UNAUTHORIZED", status_code=401)

class ExternalServiceError(ApplicationError):
    """Raised when external service fails."""
    def __init__(self, message: str, service: str, details: dict = None):
        details = details or {}
        details['service'] = service
        super().__init__(message, code="EXTERNAL_SERVICE_ERROR", details=details, status_code=502)
class AuthorizationError(ApplicationError):
    """Raised when user is authorized but lacks permissions for a specific resource."""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, code="FORBIDDEN", status_code=403)

class PermissionDeniedError(ApplicationError):
    """Raised when user does not have permission for an action."""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, code="PERMISSION_DENIED", status_code=403)

class BadRequestError(ApplicationError):
    """Raised when request is malformed or invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="BAD_REQUEST", details=details, status_code=400)

class ConflictError(ApplicationError):
    """Raised when request conflicts with current state (e.g. duplicate resource)."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="CONFLICT", details=details, status_code=409)
