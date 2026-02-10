import { param, body, query, validationResult } from 'express-validator'

/**
 * Handle validation errors - returns 400 with error messages
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    })
  }
  next()
}

/**
 * Validate issue IID parameter
 */
export const validateIssueId = [
  param('iid')
    .isInt({ min: 1 })
    .withMessage('Issue ID must be a positive integer'),
  handleValidationErrors
]

/**
 * Validate issue creation request body
 */
export const validateIssueCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description must be less than 10000 characters'),
  handleValidationErrors
]

/**
 * Validate comment body
 */
export const validateComment = [
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment body is required')
    .isLength({ max: 5000 })
    .withMessage('Comment must be less than 5000 characters'),
  handleValidationErrors
]

/**
 * Validate status update request
 */
export const validateStatusUpdate = [
  body('state_event')
    .isIn(['close', 'reopen'])
    .withMessage('state_event must be either "close" or "reopen"'),
  handleValidationErrors
]

/**
 * Validate explorer query parameters for sorting and pagination
 */
export const validateExplorerQuery = [
  query('order_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'title'])
    .withMessage('order_by must be one of: created_at, updated_at, title'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sort must be either "asc" or "desc"'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('per_page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('per_page must be between 1 and 100'),
  query('state')
    .optional()
    .isIn(['opened', 'closed', 'all'])
    .withMessage('state must be one of: opened, closed, all'),
  handleValidationErrors
]
