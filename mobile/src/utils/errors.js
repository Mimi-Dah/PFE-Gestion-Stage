export class BaseError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ApiError extends BaseError {
  constructor(message, code, status, details) {
    super(message, code, details);
    this.status = status;
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Session expired or invalid', status = 401) {
    super(message, 'UNAUTHORIZED', status);
  }
}

export class NetworkError extends BaseError {
  constructor(message = 'Network connection failed') {
    super(message, 'NETWORK_ERROR');
  }
}

export class ValidationError extends ApiError {
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}
