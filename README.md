# GitLab Issue Manager

<!-- [![CI](https://github.com/vrydberg/gitlab-issue-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/vrydberg/gitlab-issue-manager/actions/workflows/ci.yml) -->

A real-time issue management dashboard for GitLab. Connects to a GitLab repository via OAuth2 and provides live updates through WebSocket integration — when issues are created, updated, or commented on in GitLab, the dashboard reflects changes instantly without page refresh.

## Technical Highlights

- **Real-time sync** — GitLab webhooks trigger Socket.IO events, pushing updates to all connected clients
- **OAuth2 authentication** — Secure GitLab login with Passport.js, session-based auth with protected routes
- **Centralized API layer** — All GitLab API calls routed through a single Axios service client
- **Input validation** — Express middleware validates and sanitizes all user input
- **Error handling** — Global error handler with user-friendly error pages

## Tech Stack

| Layer | Technology |
|-------|------------|
| Server | Node.js, Express 5.x |
| Auth | Passport.js, GitLab OAuth2 |
| Real-time | Socket.IO, GitLab Webhooks |
| API Client | Axios |
| Templating | EJS |
| Testing | Vitest, Supertest |
| CI | GitHub Actions (lint, test, security audit) |

## Architecture

```
src/
├── app.js                    # Express server, Socket.IO, webhook handler
├── auth.js                   # Passport GitLab OAuth2 strategy
├── services/
│   └── gitlabApi.js          # Centralized GitLab API client
├── middleware/
│   ├── errorHandler.js       # Global error handling
│   └── validators.js         # Input validation
├── controllers/
│   └── issueController.js    # Issue CRUD operations
├── routes/
│   └── issueRoutes.js        # Protected routes
└── views/
    ├── pages/                # EJS page templates
    └── partials/             # Reusable components

public/
├── css/                      # Page-specific stylesheets
└── js/
    └── client.js             # WebSocket handlers, DOM updates
```

## Data Flow

```
┌─────────────┐    webhook     ┌─────────────┐   Socket.IO   ┌─────────────┐
│   GitLab    │ ─────────────► │   Server    │ ────────────► │   Browser   │
└─────────────┘                └─────────────┘               └─────────────┘
       ▲                              │
       │         REST API             │
       └──────────────────────────────┘
```

1. User actions in the dashboard trigger REST API calls to GitLab
2. GitLab sends webhook events back to the server
3. Server broadcasts updates to all connected clients via Socket.IO
4. Browser updates DOM without page refresh

## Setup

### Prerequisites
- Node.js 20+
- A GitLab account with access to a project
- Ability to configure webhooks on the target GitLab project

### Installation

```bash
git clone https://github.com/vrydberg/gitlab-issue-manager.git
cd gitlab-issue-manager
npm install
cp .env.example .env
```

### Environment Variables

```bash
# GitLab OAuth (create at GitLab > Preferences > Applications)
GITLAB_OAUTH_APP_ID=
GITLAB_OAUTH_APP_SECRET=
GITLAB_OAUTH_CALLBACK=http://localhost:3000/gitlab/callback

# GitLab API
GITLAB_BASE_URL=https://gitlab.com
GITLAB_PROJECT_ID=           # Numeric project ID
GITLAB_API_TOKEN=            # Personal access token with api scope

# App
WEBHOOK_SECRET=              # Shared secret for webhook validation
SESSION_SECRET=              # Express session secret
PORT=3000
```

### GitLab Webhook Configuration

1. Navigate to your GitLab project > Settings > Webhooks
2. Add webhook URL: `https://your-domain/webhook`
3. Set secret token to match `WEBHOOK_SECRET`
4. Enable triggers: **Issues events**, **Comments**

### Run

```bash
npm run dev     # Development with hot reload
npm start       # Production
```

## Development

```bash
npm run dev           # Start with nodemon
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run lint          # Run all linters (ESLint, StyleLint, HTMLHint)
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Login page |
| `GET` | `/gitlab` | Initiate OAuth flow |
| `GET` | `/gitlab/callback` | OAuth callback |
| `POST` | `/logout` | End session |
| `POST` | `/webhook` | GitLab webhook receiver |
| `GET` | `/issues` | Issues list |
| `GET` | `/issues/expanded/:iid` | Issue details |
| `GET` | `/issues/create` | Create issue form |
| `POST` | `/issues/create` | Submit new issue |
| `GET` | `/issues/edit/:iid` | Edit issue form |
| `PUT` | `/issues/edit/:iid` | Update issue |
| `PUT` | `/issues/update-issue-status/:iid` | Toggle issue state |
| `POST` | `/issues/add-comment/:iid` | Add comment |

## License

ISC
