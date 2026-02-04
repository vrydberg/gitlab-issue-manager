/**
 * Custom error class for operational errors
 */
export class AppError extends Error {
  constructor (message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Wrapper for async route handlers to catch errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404)
  next(error)
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500
  const message = err.isOperational ? err.message : 'Something went wrong'

  if (statusCode >= 500) {
    console.error('Error:', err)
  }

  res.status(statusCode).render('pages/error', {
    css: '/css/error.css',
    statusCode,
    message,
  })
}
