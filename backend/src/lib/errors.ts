/**
 * errors.ts
 * Application error hierarchy. All errors extend AppError so the
 * global error-handler can distinguish them from unexpected runtime errors
 * and return the correct HTTP status code and machine-readable code.
 */

/** Base class for all intentional application errors. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = 'INTERNAL_ERROR',
  ) {
    super(message)
  }
}

/** 400 — malformed request (missing/wrong fields, invalid values). */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST')
  }
}

/** 401 — no valid authentication credentials were provided. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

/** 403 — authenticated but not allowed to perform this action. */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

/** 404 — the requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

/** 409 — request conflicts with current state (e.g. duplicate username). */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}

/** 422 — request is well-formed but fails schema/business validation. */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR')
  }
}
