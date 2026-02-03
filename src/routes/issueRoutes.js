import express from 'express'
import * as issueController from '../controllers/issueController.js'

const router = express.Router()

router.get('/', issueController.fetchExplorerIssues)

router.get('/expanded/:iid', issueController.expandIssue)

router.put('/update-issue-status/:iid', issueController.updateIssueStatus)

router.post('/add-comment/:iid', issueController.addIssueComment)

router.get('/create', issueController.renderIssueCreation)

router.post('/create', issueController.createIssue)

router.get('/edit/:iid', issueController.renderIssueEdit)

router.put('/edit/:iid', issueController.editIssue)

export default router
