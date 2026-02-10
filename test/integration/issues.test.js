import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock gitlabApi before importing routes
vi.mock('../../src/services/gitlabApi.js', () => ({
  default: {
    getIssues: vi.fn(),
    getIssue: vi.fn(),
    getNotes: vi.fn(),
    updateIssue: vi.fn(),
    addNote: vi.fn(),
    createIssue: vi.fn()
  }
}))

describe('Issues Integration', () => {
  let request
  let app
  let gitlabApi

  beforeAll(async () => {
    const supertest = await import('supertest')
    request = supertest.default

    gitlabApi = (await import('../../src/services/gitlabApi.js')).default

    const express = await import('express')
    app = express.default()

    app.set('view engine', 'ejs')
    app.set('views', './src/views')
    app.use(express.default.json())
    app.use(express.default.urlencoded({ extended: true }))

    // Provide template locals that partials expect
    app.use((req, res, next) => {
      res.locals.user = null
      res.locals.projectPath = 'test/project'
      next()
    })

    // Import routes with mocked dependencies
    const { default: issueRoutes } = await import('../../src/routes/issueRoutes.js')
    app.use('/issues', issueRoutes)

    // Add error handler
    const { notFoundHandler, errorHandler } = await import('../../src/middleware/errorHandler.js')
    app.use(notFoundHandler)
    app.use(errorHandler)
  })

  describe('GET /issues', () => {
    it('returns issues explorer page', async () => {
      gitlabApi.getIssues.mockResolvedValue({
        issues: [
          {
            iid: 1,
            title: 'Test issue',
            state: 'opened',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-16T10:30:00Z',
            user_notes_count: 2,
            author: { username: 'testuser' }
          }
        ],
        pagination: { page: 1, perPage: 20, total: 1, totalPages: 1 }
      })

      const response = await request(app)
        .get('/issues')
        .expect('Content-Type', /html/)
        .expect(200)

      expect(response.text).toContain('Issues')
      expect(response.text).toContain('Test issue')
    })
  })

  describe('GET /issues/expanded/:iid', () => {
    it('returns expanded issue page', async () => {
      gitlabApi.getIssue.mockResolvedValue({
        iid: 1,
        title: 'Implement user authentication flow',
        state: 'opened',
        description: 'A detailed description',
        created_at: '2024-01-15T10:30:00Z',
        author: { username: 'testuser' }
      })
      gitlabApi.getNotes.mockResolvedValue([])

      const response = await request(app)
        .get('/issues/expanded/1')
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
      gitlabApi.updateIssue.mockResolvedValue({ iid: 1, state: 'closed' })

      const response = await request(app)
        .put('/issues/update-issue-status/1')
        .send({ state_event: 'close' })
        .expect(200)

      expect(response.body.success).toBe(true)
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
