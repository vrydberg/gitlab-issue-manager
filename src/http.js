import axios from 'axios'

/**
 * Function that sends an axios get request by specificying the request url and config properties
 * @param {string} url - The URL that is sent the request
 * @param {Array} config - Array of request configuration properties (e.g. headers, params)
 * @returns {object} - Returns a HTTP response if valid
 */
const getRequest = async (url, config) => {
  try {
    const getResponse = await axios.get(url, config)
    return getResponse.data
  } catch (error) {
    console.log('ERROR: ' + error.message)
    return null
  }
}

/**
 *  Function that sends an axios post request by specificying the request url, data, and config properties
 * @param {string} url - The URL that is sent the request
 * @param {object} data - The post request data included in the body
 * @param {Array} config - Array of request configuration properties (e.g. headers, params)
 * @returns {object} - Returns a HTTP response if valid
 */
const postRequest = async (url, data, config) => {
  try {
    const postResponse = await axios.post(url, data, config)
    return postResponse.data
  } catch (error) {
    console.log('ERROR: ' + error.message)
    return null
  }
}

/**
 *  Function that sends an axios put request by specificying the request url, data, and config properties
 * @param {string} url - The URL that is sent the request
 * @param {object} data - The put request data included in the body
 * @param {Array} config - Array of request configuration properties (e.g. headers, params)
 * @returns {object} - Returns a HTTP response if valid
 */
const putRequest = async (url, data, config) => {
  try {
    const putResponse = await axios.put(url, data, config)
    return putResponse.data
  } catch (error) {
    console.log('ERROR: ' + error.message)
    return null
  }
}

export { getRequest, postRequest, putRequest }
