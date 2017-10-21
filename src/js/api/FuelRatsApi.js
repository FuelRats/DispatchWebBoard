// App Imports
import AppConfig from '../config/config.js';
import { 
  http, 
  htmlSanitizeObject, 
  mapRelationships
} from '../helpers';


// Module Imports
import url from 'url';

/**
 * Perform a GET XHR on the API
 *
 * @param  {String} endpoint API endpoint path.
 * @param  {Object} opts     Options to pass to underlaying http XHR handler.
 * @return {Object}          Response data from the XHR handler.
 */
export const get = (endpoint, opts) => http.get(url.resolve(AppConfig.ApiURI, endpoint), opts);

/**
 * Gets the current user profile
 *
 * @return {Object} Object containing API user profile data.
 */
export function getProfile() {
  let token = localStorage.getItem(`${AppConfig.AppNamespace}.token`);

  return get('/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    withCredentials: true
  }).then(response => { return htmlSanitizeObject(mapRelationships(response.json()).data); });
}