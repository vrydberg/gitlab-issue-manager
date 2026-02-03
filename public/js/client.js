console.log('client.js loaded')
/* global io */
const socket = io()

socket.on('connect', function () {
  console.log('Succesfully connected - active connection')
})

// Handle real-time new issue creation
socket.on('newIssue', (issue) => {
  const issuesExplorer = document.getElementById('main-explorer')

  if (issuesExplorer) {
    const issuesExplorerList = issuesExplorer.querySelector('.issue-list')
    const newExplorerIssue = createExplorerIssueHTML(issue)
    issuesExplorerList.prepend(newExplorerIssue)
  }
})

/**
 * Function that creates the inner html for an issue displayed in explorer view
 * @param {object} issue - Object containing information about the issue, passed from app.js
 * @returns {HTMLElement} - Returns the newly created explorer issue HTML element
 */
function createExplorerIssueHTML (issue) {
  const newExplorerIssue = document.createElement('div')
  newExplorerIssue.className = 'issue'

  newExplorerIssue.innerHTML = `
      <div class="issue-left">
        <p class="issue-status ${issue.state === 'opened' ? 'status-open' : 'status-closed'}">
          ${issue.state === 'opened' ? 'Open' : 'Closed'}
        </p>
        <h4 class="issue-title">${issue.title}</h4>
        <div class="issue-comment-container">
          <img class="issue-comment-icon" src="/images/comments-icon-96.png" alt="Comments Icon">
        </div>
      </div>
  
      <div class="issue-right">
        <p class="issue-info">Issue created on <span class="issue-date">${issue.created_at}</span> by <span class="issue-user">${issue.author.username}</span></p>
        <div class="issue-btns-container">
          <a href="/issues/expanded/${issue.iid}" class="base-btn issue-btn">
            <img class="issue-btn-img" src="/images/issue-expand-48.png" alt="Issue Expand Button">
          </a>
  
          <a href="/issues/edit${issue.iid}" class="base-btn issue-btn">
            <img class="issue-btn-img" src="/images/issue-edit-48.png" alt="Issue Edit Button">
          </a>
  
        </div>
      </div>
    `

  return newExplorerIssue
}

// Handle real-time issue status update
socket.on('statusUpdated', (issue) => {
  const expandedIssue = document.getElementById('main-expanded')

  if (expandedIssue) {
    const btnsContainer = expandedIssue.querySelector('.expanded-btns-container')
    const issueInfo = expandedIssue.querySelector('.issue-info')

    let btnsContainerInnerHTML = ''
    let issueInfoInnerHTML = ''

    if (issue.newState === 'opened') {
      btnsContainerInnerHTML = `
                <form class="update-status-form" action="/issues/update-issue-status/${issue.iid}" method="POST">
                    <input type="hidden" name="state_event" value="close">
                    <button type="submit" class="update-status-btn close-issue-btn">Close issue</button>
                </form>
                <a href="" class="base-btn expanded-btn">
                    <img class="expanded-btn-img" src="/images/issue-edit-48.png" alt="Issue Edit Button">
                </a>
            `

      issueInfoInnerHTML = `
                <p class="issue-status status-open">Open</p>
                <p class="issue-info">Issue created on <span class="issue-date">${issue.created_at}</span> by <span class="issue-user">${issue.author.username}</span></p>
            `
    } else {
      btnsContainerInnerHTML = `
                <form class="update-status-form" action="/issues/update-issue-status/${issue.iid}" method="POST">
                    <input type="hidden" name="state_event" value="reopen">
                    <button type="submit" class="update-status-btn reopen-issue-btn">Reopen issue</button>
                </form>
                <a href="" class="base-btn expanded-btn">
                    <img class="expanded-btn-img" src="/images/issue-edit-48.png" alt="Issue Edit Button">
                </a>
            `

      issueInfoInnerHTML = `
                <p class="issue-status status-closed">Closed</p>
                <p class="issue-info">Issue created on <span class="issue-date">${issue.created_at}</span> by <span class="issue-user">${issue.author.username}</span></p>
            `
    }

    btnsContainer.innerHTML = btnsContainerInnerHTML
    issueInfo.innerHTML = issueInfoInnerHTML
  }
})

document.querySelectorAll('.update-status-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const url = form.action
    const stateEvent = form.elements.state_event.value

    try {
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state_event: stateEvent })
      })
    } catch (error) {
      console.error('Error:', error)
    }
  })
})

// Handle real-time new comment creation
socket.on('newComment', (comment) => {
  const expandedIssue = document.getElementById('main-expanded')

  if (expandedIssue) {
    const commentsList = expandedIssue.querySelector('.comments-container')
    const newComment = document.createElement('div')
    newComment.className = 'comment'

    newComment.innerHTML = `
            <p class="comment-user">${comment.author.username}, ${comment.created_at}</p>
            <p class="comment-text">${comment.note}</p>
        `
    commentsList.append(newComment)
  }
})

document.querySelectorAll('.comment-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const comment = form.elements.comment.value
    const url = form.action
    form.reset()

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      })
    } catch (error) {
      console.error('Error submitting comment: ', error)
    }
  })
})
