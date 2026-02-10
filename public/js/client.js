/* global io */
const socket = io()


// Mobile Sidebar Toggle
const hamburgerBtn = document.getElementById('hamburger-btn')
const sidebar = document.querySelector('.sidebar')

// Create backdrop element for mobile sidebar
let sidebarBackdrop = document.querySelector('.sidebar-backdrop')
if (!sidebarBackdrop && sidebar) {
  sidebarBackdrop = document.createElement('div')
  sidebarBackdrop.className = 'sidebar-backdrop'
  document.body.appendChild(sidebarBackdrop)
}

/**
 * Enable sidebar transition temporarily for user-initiated actions
 */
function enableSidebarTransition () {
  if (!sidebar) return
  sidebar.classList.add('transitioning')
}

/**
 * Remove sidebar transition class after animation completes
 */
function handleSidebarTransitionEnd () {
  if (!sidebar) return
  sidebar.classList.remove('transitioning')
}

// Listen for transition end to clean up
if (sidebar) {
  sidebar.addEventListener('transitionend', handleSidebarTransitionEnd)
}

/**
 * Toggle the mobile sidebar open/closed state
 */
function toggleSidebar () {
  if (!sidebar || !hamburgerBtn) return

  enableSidebarTransition()
  const isOpen = sidebar.classList.toggle('open')
  hamburgerBtn.classList.toggle('active', isOpen)

  if (sidebarBackdrop) {
    sidebarBackdrop.classList.toggle('visible', isOpen)
  }
}

/**
 * Close the mobile sidebar
 */
function closeSidebar () {
  if (!sidebar || !hamburgerBtn) return

  enableSidebarTransition()
  sidebar.classList.remove('open')
  hamburgerBtn.classList.remove('active')

  if (sidebarBackdrop) {
    sidebarBackdrop.classList.remove('visible')
  }
}

// Hamburger button click
if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', toggleSidebar)
}

// Backdrop click closes sidebar
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', closeSidebar)
}

// Escape key closes sidebar
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
    closeSidebar()
  }
})

// Close sidebar when clicking nav links (better mobile UX)
if (sidebar) {
  sidebar.querySelectorAll('.sidebar-nav-item').forEach(link => {
    link.addEventListener('click', () => {
      // Small delay to allow navigation to start
      setTimeout(closeSidebar, 100)
    })
  })
}

socket.on('connect', function () {})

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
 * Format ISO date to readable string matching server-side format (e.g., "Jan 28, 2026, 10:30")
 * @param {string} unformattedDate - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate (unformattedDate) {
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

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml (text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Function that creates the inner html for an issue displayed in explorer view
 * @param {object} issue - Object containing information about the issue, passed from app.js
 * @returns {HTMLElement} - Returns the newly created explorer issue HTML element
 */
function createExplorerIssueHTML (issue) {
  const newExplorerIssue = document.createElement('article')
  newExplorerIssue.className = 'issue'
  newExplorerIssue.dataset.iid = issue.iid

  // Status cell
  const statusCell = document.createElement('div')
  statusCell.className = 'issue-status-cell'
  const statusSpan = document.createElement('span')
  statusSpan.className = `issue-status ${issue.state === 'opened' ? 'status-open' : 'status-closed'}`
  const statusDot = document.createElement('span')
  statusDot.className = 'status-dot'
  statusSpan.appendChild(statusDot)
  statusSpan.appendChild(document.createTextNode(issue.state === 'opened' ? 'Open' : 'Closed'))
  statusCell.appendChild(statusSpan)

  // Main cell (title + labels)
  const mainCell = document.createElement('div')
  mainCell.className = 'issue-main'

  const titleRow = document.createElement('div')
  titleRow.className = 'issue-title-row'
  const titleH3 = document.createElement('h3')
  titleH3.className = 'issue-title'
  titleH3.textContent = issue.title
  const issueId = document.createElement('div')
  issueId.className = 'issue-id'
  issueId.textContent = `#${issue.iid}`
  titleRow.appendChild(titleH3)
  titleRow.appendChild(issueId)
  mainCell.appendChild(titleRow)

  // Labels
  if (issue.labels && issue.labels.length > 0) {
    const labelsDiv = document.createElement('div')
    labelsDiv.className = 'issue-labels'
    const displayLabels = issue.labels.slice(0, 5)
    displayLabels.forEach(label => {
      const badge = document.createElement('span')
      badge.className = 'label-badge'
      badge.style.backgroundColor = label.color || '#FF7143'
      badge.textContent = label.name
      labelsDiv.appendChild(badge)
    })
    if (issue.labels.length > 5) {
      const overflow = document.createElement('span')
      overflow.className = 'label-badge label-overflow'
      overflow.textContent = `+${issue.labels.length - 5}`
      labelsDiv.appendChild(overflow)
    }
    mainCell.appendChild(labelsDiv)
  }

  // Comments cell
  const commentsCell = document.createElement('div')
  commentsCell.className = 'issue-comments'
  const commentCount = document.createElement('span')
  const notesCount = issue.user_notes_count || 0
  commentCount.className = `comment-count ${notesCount === 0 ? 'muted' : ''}`
  commentCount.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3h12v8H4l-2 2V3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> ${notesCount}`
  commentsCell.appendChild(commentCount)

  // Updated cell
  const updatedCell = document.createElement('div')
  updatedCell.className = 'issue-updated'
  const updatedTime = document.createElement('time')
  updatedTime.className = 'updated-date'
  updatedTime.textContent = issue.updated_at_formatted || issue.updated_at || '-'
  updatedCell.appendChild(updatedTime)

  // Actions cell
  const actionsCell = document.createElement('div')
  actionsCell.className = 'issue-actions'

  const viewLink = document.createElement('a')
  viewLink.href = `/issues/expanded/${encodeURIComponent(issue.iid)}`
  viewLink.className = 'action-btn action-view'
  viewLink.title = 'View details'
  viewLink.setAttribute('aria-label', 'View issue details')
  viewLink.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3C4.5 3 1.5 6 1 8c.5 2 3.5 5 7 5s6.5-3 7-5c-.5-2-3.5-5-7-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>'

  const editLink = document.createElement('a')
  editLink.href = `/issues/edit/${encodeURIComponent(issue.iid)}`
  editLink.className = 'action-btn action-edit'
  editLink.title = 'Edit issue'
  editLink.setAttribute('aria-label', 'Edit issue')
  editLink.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 4l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'

  actionsCell.appendChild(viewLink)
  actionsCell.appendChild(editLink)

  // Assemble row
  newExplorerIssue.appendChild(statusCell)
  newExplorerIssue.appendChild(mainCell)
  newExplorerIssue.appendChild(commentsCell)
  newExplorerIssue.appendChild(updatedCell)
  newExplorerIssue.appendChild(actionsCell)

  return newExplorerIssue
}

/**
 * Update per-page selector and navigate to new URL
 * @param {string} value - New per_page value
 */
function updatePerPage (value) {
  const es = window.explorerState || {}
  const params = new URLSearchParams()
  params.set('order_by', es.orderBy || 'created_at')
  params.set('sort', es.sort || 'desc')
  params.set('page', '1')
  params.set('per_page', value)
  if (es.state && es.state !== 'all') params.set('state', es.state)
  window.location.href = `/issues/?${params.toString()}`
}

// Quick filter radios — navigate to filtered URL on change
document.querySelectorAll('input[name="status-filter"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const es = window.explorerState || {}
    const params = new URLSearchParams()
    params.set('order_by', es.orderBy || 'created_at')
    params.set('sort', es.sort || 'desc')
    params.set('page', '1')
    params.set('per_page', es.perPage || '20')
    if (radio.value !== 'all') params.set('state', radio.value)
    window.location.href = `/issues/?${params.toString()}`
  })
})

// Handle real-time issue status update
socket.on('statusUpdated', (issue) => {
  const expandedIssue = document.getElementById('main-expanded')

  if (expandedIssue) {
    const btnsContainer = expandedIssue.querySelector('.expanded-btns-container')
    const issueInfo = expandedIssue.querySelector('.issue-info')

    // Clear existing content
    btnsContainer.innerHTML = ''
    issueInfo.innerHTML = ''

    // Create form
    const form = document.createElement('form')
    form.className = 'update-status-form'
    form.action = `/issues/update-issue-status/${encodeURIComponent(issue.iid)}`
    form.method = 'POST'

    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    hiddenInput.name = 'state_event'

    const button = document.createElement('button')
    button.type = 'submit'

    if (issue.newState === 'opened') {
      hiddenInput.value = 'close'
      button.className = 'update-status-btn close-issue-btn'
      button.textContent = 'Close issue'
    } else {
      hiddenInput.value = 'reopen'
      button.className = 'update-status-btn reopen-issue-btn'
      button.textContent = 'Reopen issue'
    }

    form.appendChild(hiddenInput)
    form.appendChild(button)

    const editLink = document.createElement('a')
    editLink.href = ''
    editLink.className = 'base-btn expanded-btn'
    const editImg = document.createElement('img')
    editImg.className = 'expanded-btn-img'
    editImg.src = '/images/issue-edit-48.png'
    editImg.alt = 'Issue Edit Button'
    editLink.appendChild(editImg)

    btnsContainer.appendChild(form)
    btnsContainer.appendChild(editLink)

    // Update issue info
    const statusP = document.createElement('p')
    statusP.className = `issue-status ${issue.newState === 'opened' ? 'status-open' : 'status-closed'}`
    statusP.textContent = issue.newState === 'opened' ? 'Open' : 'Closed'

    const infoP = document.createElement('p')
    infoP.className = 'issue-info'
    infoP.innerHTML = `Issue created on <span class="issue-date">${escapeHtml(formatDate(issue.created_at))}</span> by <span class="issue-user">${escapeHtml(issue.author.username)}</span>`

    issueInfo.appendChild(statusP)
    issueInfo.appendChild(infoP)

    // Re-attach form event listener
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const url = form.action
      const stateEvent = form.elements.state_event.value
      try {
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state_event: stateEvent })
        })
      } catch (error) {
        console.error('Error:', error)
      }
    })
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

    const userP = document.createElement('p')
    userP.className = 'comment-user'
    userP.textContent = `${comment.author.username} `
    const timeSpan = document.createElement('span')
    timeSpan.className = 'comment-time'
    timeSpan.textContent = `\u00B7 ${formatDate(comment.created_at)}`
    userP.appendChild(timeSpan)

    const textP = document.createElement('p')
    textP.className = 'comment-text'
    textP.textContent = comment.note

    newComment.appendChild(userP)
    newComment.appendChild(textP)
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
