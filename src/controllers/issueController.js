import gitlabApi from '../services/gitlabApi.js'
import { AppError } from '../middleware/errorHandler.js'

/**
 * Format ISO date to readable string (e.g., "Jan 28, 2026, 10:30")
 * @param {string} unformattedDate - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (unformattedDate) => {
  const date = new Date(unformattedDate)

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }

  return date.toLocaleString('en-US', options)
}

// Fetches the issues to be rendered on explorer view page
const fetchExplorerIssues = async (req, res, next) => {
  try {
    // Parse query params with defaults
    const orderBy = req.query.order_by || 'created_at'
    const sort = req.query.sort || 'desc'
    const page = parseInt(req.query.page, 10) || 1
    const perPage = parseInt(req.query.per_page, 10) || 20
    const state = req.query.state || 'all'

    // Build base URL for pagination links
    const buildUrl = (newPage) => {
      const params = new URLSearchParams()
      params.set('order_by', orderBy)
      params.set('sort', sort)
      params.set('page', newPage.toString())
      params.set('per_page', perPage.toString())
      if (state !== 'all') params.set('state', state)
      return `/issues/?${params.toString()}`
    }

    const { issues, pagination } = await gitlabApi.getIssues({ state: state !== 'all' ? state : undefined, orderBy, sort, page, perPage })

    if (!issues) {
      throw new AppError('Failed to fetch issues from GitLab', 502)
    }

    issues.forEach(i => {
      i.created_at_formatted = formatDate(i.created_at)
      i.updated_at_formatted = formatDate(i.updated_at)
    })

    res.render('pages/issues-explorer', {
      css: '/css/issues-explorer.css',
      issues,
      pagination,
      sorting: { orderBy, sort },
      activeFilter: state,
      buildUrl
    })
  } catch (error) {
    next(error)
  }
}

// Fetch details and comments for a specific issue to be rendered the expanded view
const expandIssue = async (req, res, next) => {
  try {
    const iid = req.params.iid

    const issue = await gitlabApi.getIssue(iid)

    if (!issue) {
      throw new AppError('Issue not found', 404)
    }

    issue.created_at = formatDate(issue.created_at)

    const comments = await gitlabApi.getNotes(iid)
    if (comments) {
      comments.reverse()
      comments.forEach(c => {
        c.created_at = formatDate(c.created_at)
      })
    }

    res.render('pages/expanded-issue', {
      css: '/css/expanded-issue.css',
      issue,
      comments: comments || []
    })
  } catch (error) {
    next(error)
  }
}

// Updates the status of the issue (reopen or close)
const updateIssueStatus = async (req, res, next) => {
  try {
    const iid = req.params.iid
    await gitlabApi.updateIssue(iid, { state_event: req.body.state_event })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

// Adds a new comment for a particular issue
const addIssueComment = async (req, res, next) => {
  try {
    const iid = req.params.iid
    await gitlabApi.addNote(iid, req.body.comment)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

// Renders the issue creation webpage
const renderIssueCreation = async (req, res, _next) => {
  res.render('pages/issue-creation', {
    css: '/css/issue-creation.css',
  })
}

// Creates a particular issue to be posted on Gitlab
const createIssue = async (req, res, next) => {
  try {
    await gitlabApi.createIssue({
      title: req.body.title,
      description: req.body.description
    })

    res.redirect('/issues/create')
  } catch (error) {
    next(error)
  }
}

// Renders the issue editing webpage
const renderIssueEdit = async (req, res, next) => {
  try {
    const iid = req.params.iid
    const issue = await gitlabApi.getIssue(iid)

    if (!issue) {
      throw new AppError('Issue not found', 404)
    }

    res.render('pages/issue-edit', {
      css: '/css/issue-creation.css',
      issue
    })
  } catch (error) {
    next(error)
  }
}

// Edits a particular issue and updates on Gitlab using PUT method
const editIssue = async (req, res, next) => {
  try {
    const iid = req.params.iid
    await gitlabApi.updateIssue(iid, {
      title: req.body.title,
      description: req.body.description
    })

    res.redirect('/issues')
  } catch (error) {
    next(error)
  }
}

// Renders the repository information page
const renderRepository = async (req, res, next) => {
  try {
    const project = await gitlabApi.getProject()

    if (!project) {
      throw new AppError('Failed to fetch project information', 502)
    }

    res.render('pages/repository', {
      css: '/css/repository.css',
      project
    })
  } catch (error) {
    next(error)
  }
}

export { fetchExplorerIssues, expandIssue, updateIssueStatus, addIssueComment, renderIssueCreation, createIssue, renderIssueEdit, editIssue, renderRepository }
