import dotenv from 'dotenv'
import express from 'express'
import session from 'express-session'
import methodOverride from 'method-override'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { passport, isAuthenticated } from './auth.js'
import gitlabApi from './services/gitlabApi.js'
import issueRoutes from './routes/issueRoutes.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'

dotenv.config()

// Initialize WebSocket io on express http server and set WebSocket event handlers
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)

io.on('connection', (socket) => {
  socket.on('disconnect', () => {})
})

app.set('view engine', 'ejs')
app.set('views', './src/views')

// Apply express-session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(express.json())
app.use(methodOverride('_method'))

app.get('/', (req, res) => {
  res.render('pages/index', {
    css: '/css/index.css'
  })
})

// GitLab OAuth login route
app.get('/gitlab', passport.authenticate('gitlab', {
  scope: ['api'],
  prompt: 'consent'
}))

// GitLab OAuth callback handler to determine whether user authenticated themselves
app.get('/gitlab/callback', (req, res, next) => {
  passport.authenticate('gitlab', { keepSessionInfo: true }, (err, user, info) => {
    if (err) return next(err)
    if (!user) return res.redirect('/')
    req.logIn(user, { keepSessionInfo: true }, (loginErr) => {
      if (loginErr) return next(loginErr)
      return res.redirect('/issues')
    })
  })(req, res, next)
})

// Logout route
app.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    res.redirect('/')
  })
})

// Test route for socket events (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/test-socket/:event', (req, res) => {
    const { event } = req.params
    const events = {
      issue: () => io.emit('newIssue', { iid: 999, title: 'Test issue from socket' }),
      status: () => io.emit('statusUpdated', { iid: 999, newState: 'closed' }),
      comment: () => io.emit('newComment', { iid: 999, author: { username: 'testuser' } })
    }
    if (events[event]) {
      events[event]()
      res.send(`Emitted ${event} event`)
    } else {
      res.status(400).send('Invalid event. Use: issue, status, or comment')
    }
  })
}

// Handles incoming webhooks from Gitlab and emits io events to clients to be handled on frontend
app.post('/webhook', async (req, res) => {
  try {
    if (req.headers['x-gitlab-token'] !== process.env.WEBHOOK_SECRET) {
      return res.status(403).send('Forbidden')
    }

    const gitlabEvent = req.body

    if (gitlabEvent.object_kind === 'issue') {
      const action = gitlabEvent.object_attributes.action
      const issue = req.body.object_attributes

      const author = await gitlabApi.getUser(issue.author_id)

      if (action === 'open') {
        io.emit('newIssue', {
          iid: issue.iid,
          title: issue.title,
          author,
          description: issue.description,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          state: issue.state
        })
      } else if (action === 'close' || action === 'reopen') {
        io.emit('statusUpdated', {
          iid: issue.iid,
          author,
          created_at: issue.created_at,
          newState: issue.state
        })
      }
    } else if (gitlabEvent.object_kind === 'note') {
      const action = gitlabEvent.object_attributes.action
      const author = gitlabEvent.user
      const issue = gitlabEvent.issue
      const noteAttributes = req.body.object_attributes

      if (action === 'create') {
        io.emit('newComment', {
          iid: issue.iid,
          note: noteAttributes.note,
          author,
          created_at: noteAttributes.created_at
        })
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Internal Server Error')
  }
})

// Make authenticated user available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null
  next()
})

// Middleware to provide project info to all views
let cachedProjectPath = null
app.use(async (req, res, next) => {
  if (!cachedProjectPath) {
    try {
      const project = await gitlabApi.getProject()
      cachedProjectPath = project.path_with_namespace
    } catch {
      cachedProjectPath = ''
    }
  }
  res.locals.projectPath = cachedProjectPath
  next()
})

// Protected issue routes
app.use('/issues', isAuthenticated, issueRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Starts the HTTP server on the given port number
httpServer.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`)
})
