import express from 'express'
import * as issueController from '../controllers/issueController.js'
import {
  validateIssueId,
  validateIssueCreate,
  validateComment,
  validateStatusUpdate,
  validateExplorerQuery
} from '../middleware/validators.js'

const router = express.Router()

router.get('/', validateExplorerQuery, issueController.fetchExplorerIssues)

router.get('/expanded/:iid', validateIssueId, issueController.expandIssue)

router.put('/update-issue-status/:iid', validateIssueId, validateStatusUpdate, issueController.updateIssueStatus)

router.post('/add-comment/:iid', validateIssueId, validateComment, issueController.addIssueComment)

router.get('/create', issueController.renderIssueCreation)

router.post('/create', validateIssueCreate, issueController.createIssue)

router.get('/edit/:iid', validateIssueId, issueController.renderIssueEdit)

router.put('/edit/:iid', validateIssueId, validateIssueCreate, issueController.editIssue)

router.get('/repository', issueController.renderRepository)

export default router
