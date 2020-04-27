// Module Imports
import url from 'url'





// App Imports
import AppConfig from '../config/config'
import {
  http,
  htmlSanitizeObject,
  mapRelationships,
} from '../helpers'





/**
 * Perform a GET XHR on the API
 *
 * @param   {string} endpoint API endpoint path.
 * @param   {object} opts     Options to pass to underlaying http XHR handler.
 * @returns {object}          Response data from the XHR handler.
 */
const get = (endpoint, opts) => {
  return http.get(url.resolve(AppConfig.ApiURI, endpoint), opts)
}





/**
 * Gets the current user profile
 *
 * @returns {object} Object containing API user profile data.
 */
const getProfile = () => {
  const token = localStorage.getItem(`${AppConfig.AppNamespace}.token`)

  return get('/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  }).then((response) => {
    return htmlSanitizeObject(mapRelationships(response.json()).data)
  })
}





export {
  get,
  getProfile,
}
