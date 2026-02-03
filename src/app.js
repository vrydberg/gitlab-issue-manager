import dotenv from 'dotenv'
import express from 'express'
import session from 'express-session'
import methodOverride from 'method-override'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { passport, isAuthenticated } from './auth.js'
import { getRequest } from './http.js'
import issueRoutes from './routes/issueRoutes.js'

dotenv.config()

// Initialize WebSocket io on express http server and set WebSocket event handlers
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)

io.on('connection', (socket) => {
  console.log('a user connected')
  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

app.set('view engine', 'ejs')
app.set('views', './src/views')

// Apply express-session middleware
app.use(session({
  secret: '2c339e76c6bd214d1a62e35a162b7a47abc56578ca2da5b83dc833342f7f08c1',
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
app.get('/gitlab/callback',
  passport.authenticate('gitlab', {
    successRedirect: '/issues',
    failureRedirect: '/failure'
  })
)

// Handles incoming webhooks from Gitlab and emits io events to clients to be handled on frontend
app.post('/webhook', async (req, res) => {
  console.log('received a web hook')
  try {
    if (req.headers['x-gitlab-token'] !== process.env.WEBHOOK_SECRET) {
      return res.status(403).send('Forbidden')
    }

    const gitlabEvent = req.body

    console.log(gitlabEvent)

    if (gitlabEvent.object_kind === 'issue') {
      const action = gitlabEvent.object_attributes.action
      const issue = req.body.object_attributes

      const config = {
        headers: {
          Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
        }
      }

      const author = await getRequest(`${process.env.GITLAB_BASE_URL}/api/v4/users/${issue.author_id}`, config)

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
  } catch (error) {
    console.log(error)
  }
})

app.use('/issues', isAuthenticated, issueRoutes)

// Starts the HTTP server on the given port number
httpServer.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}}`)
})
