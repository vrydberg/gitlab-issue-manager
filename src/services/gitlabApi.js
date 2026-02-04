import axios from 'axios'

/**
 * Centralized GitLab API client with pre-configured authentication
 */
class GitLabApiClient {
  constructor () {
    this.baseUrl = process.env.GITLAB_BASE_URL
    this.projectId = process.env.GITLAB_PROJECT_ID
    this.client = axios.create({
      baseURL: `${this.baseUrl}/api/v4`,
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`
      }
    })
  }

  /**
   * Get issues for the configured project with pagination
   * @param {Object} options - Query options
   * @param {string} options.orderBy - Field to order by (created_at, updated_at, etc.)
   * @param {string} options.sort - Sort direction (asc, desc)
   * @param {number} options.page - Page number
   * @param {number} options.perPage - Items per page
   * @returns {Promise<{issues: Array, pagination: Object}>} Issues and pagination metadata
   */
  async getIssues (options = {}) {
    const params = {}
    if (options.orderBy) params.order_by = options.orderBy
    if (options.sort) params.sort = options.sort
    if (options.page) params.page = options.page
    if (options.perPage) params.per_page = options.perPage

    const response = await this.client.get(`/projects/${this.projectId}/issues`, { params })

    const pagination = {
      page: parseInt(response.headers['x-page'] || '1', 10),
      perPage: parseInt(response.headers['x-per-page'] || '20', 10),
      total: parseInt(response.headers['x-total'] || '0', 10),
      totalPages: parseInt(response.headers['x-total-pages'] || '1', 10)
    }

    return { issues: response.data, pagination }
  }

  /**
   * Get a single issue by IID
   * @param {number|string} iid - Issue internal ID
   * @returns {Promise<Object>} Issue object
   */
  async getIssue (iid) {
    const response = await this.client.get(`/projects/${this.projectId}/issues/${iid}`)
    return response.data
  }

  /**
   * Create a new issue
   * @param {Object} data - Issue data (title, description)
   * @returns {Promise<Object>} Created issue
   */
  async createIssue (data) {
    const response = await this.client.post(`/projects/${this.projectId}/issues`, data)
    return response.data
  }

  /**
   * Update an issue
   * @param {number|string} iid - Issue internal ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated issue
   */
  async updateIssue (iid, data) {
    const response = await this.client.put(`/projects/${this.projectId}/issues/${iid}`, data)
    return response.data
  }

  /**
   * Get notes (comments) for an issue
   * @param {number|string} iid - Issue internal ID
   * @returns {Promise<Array>} Array of notes
   */
  async getNotes (iid) {
    const response = await this.client.get(`/projects/${this.projectId}/issues/${iid}/notes`)
    return response.data
  }

  /**
   * Add a note (comment) to an issue
   * @param {number|string} iid - Issue internal ID
   * @param {string} body - Note body text
   * @returns {Promise<Object>} Created note
   */
  async addNote (iid, body) {
    const response = await this.client.post(`/projects/${this.projectId}/issues/${iid}/notes`, { body })
    return response.data
  }

  /**
   * Get a user by ID
   * @param {number|string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUser (userId) {
    const response = await this.client.get(`/users/${userId}`)
    return response.data
  }
}

// Export singleton instance
const gitlabApi = new GitLabApiClient()
export default gitlabApi
