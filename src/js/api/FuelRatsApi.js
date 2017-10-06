
// App Imports
import AppConfig from '../config/config.js';
import { mapRelationships, http, htmlSanitizeObject } from '../helpers';

// Module Imports
import url from 'url';

export const get = (endpoint, opts) => http.get(url.resolve(AppConfig.ApiURI, endpoint), opts);

export const getProfile = () => {
  let token = localStorage.getItem(`${AppConfig.AppNamespace}.token`);

  return get('/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }).then(response => { return htmlSanitizeObject(mapRelationships(response.json()).data); });
};