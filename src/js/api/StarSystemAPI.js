// App Imports
import AppConfig from '../config/config.js';
import {
  http, 
  htmlSanitizeObject,
  isObject
} from '../helpers';


// Module Imports
import url from 'url';


export const get = (endpoint, opts) => http.get(url.resolve('https://system.api.fuelrats.com/', endpoint), opts);

export function getSystem(system) {
  system = system.toUpperCase();

  if (sessionStorage.getItem(`${AppConfig.AppNamespace}.system.${system}`)) {

    let sysData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.system.${system}`));

    if (sysData === null) { 
      return Promise.reject('System not found.');
    }

    return Promise.resolve(sysData);

  } else {
    return get(`/systems?filter[name:eq]=${encodeURIComponent(system)}&include=bodies`)
      .then(response => {
        let sysData = htmlSanitizeObject(processNewStarSystemData(response.json()));
        sessionStorage.setItem(`${AppConfig.AppNamespace}.system.${system}`, sysData !== null ? JSON.stringify(sysData) : sysData);
        return sysData;
      });
  }
}

function processNewStarSystemData(data) {
  if (!isObject(data) || data.meta.results.returned < 1) {
    return null;
  }
  let sysData = data.data[0];

  if (data.included && data.included[0]) {
    sysData.bodies = data.included.filter(function(body) {
      return body.attributes.group_name === 'Star';
    });
    // cleanup body info
    for (let body in sysData.bodies) {
      if (sysData.bodies.hasOwnProperty(body)) {
        delete sysData.bodies[body].relationships;
        delete sysData.bodies[body].type;
        delete sysData.bodies[body].links;
      }
    }
  }
  
  // clean up other json properties.
  delete sysData.relationships;
  delete sysData.type;
  delete sysData.links;

  return sysData;
}