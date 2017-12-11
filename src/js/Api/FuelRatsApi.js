// App Imports
import AppConfig from 'Config/Config.js';
import { 
  http, 
  htmlSanitizeObject, 
  mapRelationships,
  WebStore
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
export const get = (endpoint, opts) => http.get(resolve(endpoint), opts);

/**
 * Resolves an endpoint path to the current attached API.
 *
 * @param   {...String} args  API endpoint path.
 * @returns {String}          Full API URL with the given path.          
 */
export const resolve = (...args) => url.resolve(AppConfig.ApiURI, ...args);

/**
 * Gets the current user profile
 *
 * @returns {Object} Object containing API user profile data.
 */
export async function getProfile() {
  let token = WebStore.local.get('token');

  let response = await get('/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  return mapRelationships(response.json()).data;
}