// App Imports
import AppConfig from 'Config/Config.js';
import { 
  http, 
  htmlSanitizeObject, 
  mapRelationships
} from 'Helpers';


// Module Imports
import url from 'url';

/**
 * Perform a GET XHR on the API
 *
 * @param   {String} endpoint API endpoint path.
 * @param   {Object} opts     Options to pass to underlaying http XHR handler.
 * @returns {Object}          Response data from the XHR handler.
 */
export const get = (endpoint, opts) => http.get(url.resolve(AppConfig.ApiURI, endpoint), opts);

/**
 * Gets the current user profile
 *
 * @returns {Object} Object containing API user profile data.
 */
export function getProfile() {
  let token = localStorage.getItem(`${AppConfig.AppNamespace}.token`);

  if (!token) {
    return Promise.reject(null);
  }

  return get('/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }).then(response => htmlSanitizeObject(mapRelationships(response.json()).data));
}