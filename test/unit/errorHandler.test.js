import { describe, it, expect, vi } from 'vitest'
import { AppError, asyncHandler } from '../../src/middleware/errorHandler.js'

describe('AppError', () => {
  it('creates an error with message and status code', () => {
    const error = new AppError('Test error', 404)

    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(404)
    expect(error.isOperational).toBe(true)
  })

  it('defaults to 500 status code', () => {
    const error = new AppError('Server error')

    expect(error.statusCode).toBe(500)
  })

  it('is an instance of Error', () => {
    const error = new AppError('Test error', 400)

    expect(error).toBeInstanceOf(Error)
    expect(error.stack).toBeDefined()
  })
})

describe('asyncHandler', () => {
  it('wraps async function and passes through on success', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const req = {}
    const res = {}
    const next = vi.fn()

    const wrapped = asyncHandler(mockFn)
    await wrapped(req, res, next)

    expect(mockFn).toHaveBeenCalledWith(req, res, next)
    expect(next).not.toHaveBeenCalled()
  })

  it('catches errors and passes to next', async () => {
    const testError = new Error('Test error')
    const mockFn = vi.fn().mockRejectedValue(testError)
    const req = {}
    const res = {}
    const next = vi.fn()

    const wrapped = asyncHandler(mockFn)
    await wrapped(req, res, next)

    expect(next).toHaveBeenCalledWith(testError)
  })
})
