import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validationResult } from 'express-validator'

// Mock request/response for testing validators
const mockRequest = (params = {}, body = {}, query = {}) => ({
  params,
  body,
  query
})

const mockResponse = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

const mockNext = vi.fn()

describe('Validators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateIssueId', () => {
    it('should accept valid positive integer IID', async () => {
      const { validateIssueId } = await import('../../src/middleware/validators.js')

      const req = mockRequest({ iid: '123' })
      const res = mockResponse()

      // Run all middleware in the array
      for (const middleware of validateIssueId) {
        await middleware(req, res, mockNext)
      }

      // If validation passed, next should be called
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject non-integer IID', async () => {
      const { validateIssueId } = await import('../../src/middleware/validators.js')

      const req = mockRequest({ iid: 'abc' })
      const res = mockResponse()

      for (const middleware of validateIssueId) {
        await middleware(req, res, mockNext)
      }

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should reject negative IID', async () => {
      const { validateIssueId } = await import('../../src/middleware/validators.js')

      const req = mockRequest({ iid: '-1' })
      const res = mockResponse()

      for (const middleware of validateIssueId) {
        await middleware(req, res, mockNext)
      }

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('validateStatusUpdate', () => {
    it('should accept "close" state_event', async () => {
      const { validateStatusUpdate } = await import('../../src/middleware/validators.js')

      const req = mockRequest({}, { state_event: 'close' })
      const res = mockResponse()

      for (const middleware of validateStatusUpdate) {
        await middleware(req, res, mockNext)
      }

      expect(mockNext).toHaveBeenCalled()
    })

    it('should accept "reopen" state_event', async () => {
      const { validateStatusUpdate } = await import('../../src/middleware/validators.js')

      const req = mockRequest({}, { state_event: 'reopen' })
      const res = mockResponse()

      for (const middleware of validateStatusUpdate) {
        await middleware(req, res, mockNext)
      }

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid state_event', async () => {
      const { validateStatusUpdate } = await import('../../src/middleware/validators.js')

      const req = mockRequest({}, { state_event: 'invalid' })
      const res = mockResponse()

      for (const middleware of validateStatusUpdate) {
        await middleware(req, res, mockNext)
      }

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('validateIssueCreate', () => {
    it('should accept valid title', async () => {
      const { validateIssueCreate } = await import('../../src/middleware/validators.js')

      const req = mockRequest({}, { title: 'Valid Issue Title' })
      const res = mockResponse()

      for (const middleware of validateIssueCreate) {
        await middleware(req, res, mockNext)
      }

      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject empty title', async () => {
      const { validateIssueCreate } = await import('../../src/middleware/validators.js')

      const req = mockRequest({}, { title: '' })
      const res = mockResponse()

      for (const middleware of validateIssueCreate) {
        await middleware(req, res, mockNext)
      }

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should reject title exceeding max length', async () => {
      const { validateIssueCreate } = await import('../../src/middleware/validators.js')

      const req = mockRequest({}, { title: 'a'.repeat(256) })
      const res = mockResponse()

      for (const middleware of validateIssueCreate) {
        await middleware(req, res, mockNext)
      }

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
