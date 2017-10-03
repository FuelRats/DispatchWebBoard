
// App Imports
import AppConfig from '../../../app.config.js';
import { mapRelationships, http } from '../helpers';

// Module Imports
import url from 'url';

export const get = (endpoint, opts) => http.get(url.resolve(AppConfig.ApiURI, endpoint), opts);

export function getProfile() {
  let token = localStorage.getItem(`${AppConfig.AppNamespace}.token`);

  return get('/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }).then(response => { return mapRelationships(response); });
}