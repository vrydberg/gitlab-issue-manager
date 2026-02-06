// Test environment setup
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes'
process.env.GITLAB_BASE_URL = 'https://gitlab.example.com'
process.env.GITLAB_PROJECT_ID = '12345'
process.env.GITLAB_API_TOKEN = 'test-api-token'
process.env.WEBHOOK_SECRET = 'test-webhook-secret'
process.env.BYPASS_AUTH = 'true'
