import dotenv from 'dotenv'
import passport from 'passport'
import passportGitlab from 'passport-gitlab2'

const GitLabStrategy = passportGitlab
dotenv.config()

// Initialize GitLab OAuth2 strategy
passport.use(
  new GitLabStrategy(
    {
      clientID: process.env.GITLAB_OAUTH_APP_ID,
      clientSecret: process.env.GITLAB_OAUTH_APP_SECRET,
      callbackURL: process.env.GITLAB_OAUTH_CALLBACK,
      baseURL: process.env.GITLAB_BASE_URL
    },
    function (accessToken, refreshToken, profile, cb) {
      return cb(null, profile)
    }
  )
)

// passportjs.org/concepts/authentication/sessions

// Serializes user information to the express session
passport.serializeUser(function (user, cb) {
  cb(null, user)
})

// Deserializes user information to the express session
passport.deserializeUser(function (user, cb) {
  cb(null, user)
})

// Authentication middleware to protect routes
const isAuthenticated = (req, res, next) => {
  if (req.user) {
    return next()
  }
  console.log('User is not authenticated')
  return res.status(401)
}

// Export default passport module instance
export { passport, isAuthenticated }
