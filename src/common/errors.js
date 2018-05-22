/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Define errors.
 *
 * @author TCSCODER
 * @version 1.0
 */

/* eslint-disable no-magic-numbers */

// The common API error
class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// The validation error
class ValidationError extends ApiError {
  constructor(message, details) {
    super(400, 'VALIDATION', message);
    this.details = details;
  }
}

// The not found error
class NotFoundError extends ApiError {
  constructor(message, details) {
    super(404, 'NOT_FOUND', message);
    this.details = details;
  }
}

// The unauthorized error
class UnauthorizedError extends ApiError {
  constructor(message, details) {
    super(401, 'UNAUTHORIZED', message);
    this.details = details;
  }
}

// The forbidden error
class ForbiddenError extends ApiError {
  constructor(message, details) {
    super(403, 'FORBIDDEN', message);
    this.details = details;
  }
}

module.exports = {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
};
