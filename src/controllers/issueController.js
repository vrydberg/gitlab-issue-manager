import { getRequest, postRequest, putRequest } from '../http.js'

// Function that helps format ISO dates retrieved from Gitlab responses
const formatDate = (unformattedDate) => {
  const createdDate = new Date(unformattedDate)

  const options = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }

  const formattedDate = createdDate.toLocaleString('en-uk', options)

  return formattedDate
}

// Fetches the issues to be rendered on explorer view page
const fetchExplorerIssues = async (req, res, next) => {
  try {
    console.log(process.env.GITLAB_PROJECT_ID)
    const issuesUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues`
    const issuesConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }
    const issues = await getRequest(issuesUrl, issuesConfig)

    console.log(issues)

    issues.forEach(i => {
      i.created_at = formatDate(i.created_at)
    })

    res.render('pages/issues-explorer', {
      css: '/css/issues-explorer.css',
      issues
    })
  } catch (error) {
    return next(error)
  }
}

// Fetch details and comments for a specific issue to be rendered the expanded view
const expandIssue = async (req, res, next) => {
  try {
    const iid = req.params.iid

    const issueUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues/${iid}`
    const issueConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }
    const issue = await getRequest(issueUrl, issueConfig)
    issue.created_at = formatDate(issue.created_at)

    const commentsUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues/${iid}/notes`
    const commentsConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }

    const comments = await getRequest(commentsUrl, commentsConfig)
    comments.reverse()

    comments.forEach(c => {
      c.created_at = formatDate(c.created_at)
    })

    res.render('pages/expanded-issue', {
      css: '/css/expanded-issue.css',
      issue: issue || null,
      comments: comments || []
    })
  } catch (error) {
    return next(error)
  }
}

// Updates the status of the issue (reopen or close)
const updateIssueStatus = async (req, res, next) => {
  const iid = req.params.iid

  try {
    const updateStatusUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues/${iid}`
    const updateStatusData = { state_event: req.body.state_event }
    const updateStatusConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }

    await putRequest(updateStatusUrl, updateStatusData, updateStatusConfig)
  } catch (error) {
    console.log(error)
  }
}

// Adds a new comment for a particular issue
const addIssueComment = async (req, res, next) => {
  const iid = req.params.iid

  try {
    const newCommentUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues/${iid}/notes`
    const newCommentData = { body: req.body.comment }
    const newCommentConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }

    await postRequest(newCommentUrl, newCommentData, newCommentConfig)
  } catch (error) {
    return next(error)
  }
}

// Renders the issue creation webpage
const renderIssueCreation = async (req, res, next) => {
  res.render('pages/issue-creation', {
    css: '/css/issue-creation.css'
  })
}

// Creates a particular issue to be posted on Gitlab
const createIssue = async (req, res, next) => {
  try {
    const createIssueUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues/`
    const createIssueData = {
      title: req.body.title,
      description: req.body.description
    }
    const createIssueConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }

    await postRequest(createIssueUrl, createIssueData, createIssueConfig)

    res.redirect('/issues/create')
  } catch (error) {
    return next(error)
  }
}

// Renders the issue editing webpage
const renderIssueEdit = async (req, res, next) => {
  const iid = req.params.iid

  try {
    const issueUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues/${iid}`
    const issueConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }
    const issue = await getRequest(issueUrl, issueConfig)

    res.render('pages/issue-edit', {
      css: '/css/issue-creation.css',
      issue: issue || null
    })
  } catch (error) {
    return next(error)
  }
}

// Edits a particular issue and updates on Gitlab using PUT method
const editIssue = async (req, res, next) => {
  const iid = req.params.iid
  try {
    const editIssueUrl = `${process.env.GITLAB_BASE_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/issues/${iid}`

    const editIssueData = {
      title: req.body.title,
      description: req.body.description
    }
    const editIssueConfig = {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    }

    await putRequest(editIssueUrl, editIssueData, editIssueConfig)

    res.redirect('/issues')
  } catch (error) {
    return next(error)
  }
}

export { fetchExplorerIssues, expandIssue, updateIssueStatus, addIssueComment, renderIssueCreation, createIssue, renderIssueEdit, editIssue }
