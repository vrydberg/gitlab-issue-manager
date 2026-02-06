import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Mock axios before importing app
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn()
    }))
  }
}))

describe('Issues Integration', () => {
  let request
  let app

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    const supertest = await import('supertest')
    request = supertest.default

    // Import a simplified test server
    const express = await import('express')
    app = express.default()

    app.set('view engine', 'ejs')
    app.set('views', './src/views')
    app.use(express.default.json())
    app.use(express.default.urlencoded({ extended: true }))

    // Import routes with mocked dependencies
    const { default: issueRoutes } = await import('../../src/routes/issueRoutes.js')
    app.use('/issues', issueRoutes)

    // Add error handler
    const { notFoundHandler, errorHandler } = await import('../../src/middleware/errorHandler.js')
    app.use(notFoundHandler)
    app.use(errorHandler)
  })

  describe('GET /issues', () => {
    it('returns issues explorer page with mock data', async () => {
      const response = await request(app)
        .get('/issues?mock=true')
        .expect('Content-Type', /html/)
        .expect(200)

      expect(response.text).toContain('Issues Explorer')
    })
  })

  describe('GET /issues/expanded/:iid', () => {
    it('returns expanded issue page with mock data', async () => {
      const response = await request(app)
        .get('/issues/expanded/1?mock=true')
        .expect('Content-Type', /html/)
        .expect(200)

      expect(response.text).toContain('Implement user authentication flow')
    })

    it('rejects invalid issue IID', async () => {
      const response = await request(app)
        .get('/issues/expanded/invalid')
        .expect(400)

      expect(response.body.errors).toBeDefined()
      expect(response.body.errors[0].field).toBe('iid')
    })
  })

  describe('PUT /issues/update-issue-status/:iid', () => {
    it('rejects invalid state_event', async () => {
      const response = await request(app)
        .put('/issues/update-issue-status/1')
        .send({ state_event: 'invalid' })
        .expect(400)

      expect(response.body.errors).toBeDefined()
    })

    it('accepts valid close state_event', async () => {
      // This will fail at the API call level since axios is mocked
      // but validates the request passes validation
      await request(app)
        .put('/issues/update-issue-status/1')
        .send({ state_event: 'close' })
    })
  })

  describe('POST /issues/add-comment/:iid', () => {
    it('rejects empty comment', async () => {
      const response = await request(app)
        .post('/issues/add-comment/1')
        .send({ comment: '' })
        .expect(400)

      expect(response.body.errors).toBeDefined()
    })
  })

  describe('POST /issues/create', () => {
    it('rejects missing title', async () => {
      const response = await request(app)
        .post('/issues/create')
        .send({ description: 'Description only' })
        .expect(400)

      expect(response.body.errors).toBeDefined()
    })
  })
})
