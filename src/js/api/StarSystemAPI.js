// App Imports
import AppConfig from '../config/config.js';
import {
  http,
  htmlSanitizeObject,
  isObject
} from '../helpers';


// Module Imports
import url from 'url';


export const get = (endpoint, opts) => http.get(url.resolve(AppConfig.SystemsURI, endpoint), opts);

/**
 * Gets system information for the given system name
 *
 * @param  {String} system System name to get info on.
 * @return {Object}        Object containing information pertaining to the given starsystem name.
 */
export function getSystem(system) {
  system = system.toUpperCase();

  if (sessionStorage.getItem(`${AppConfig.AppNamespace}.system.${system}`)) {

    let sysData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.system.${system}`));

    if (sysData === null) {
      window.console.debug(`System ${system} not found`);
      return Promise.reject('System not found.');
    }

    return Promise.resolve(sysData);

  } else {

    let populated_systems = get(`/api/populated_systems?filter[name:eq]=${encodeURIComponent(system)}`);

    let systems = get(`/api/systems?filter[name:eq]=${encodeURIComponent(system)}`);

    return Promise.all([populated_systems, systems]).then(values => {
      let _populated_system = values[0].json();

      if (!isObject(_populated_system) || _populated_system.meta.results.returned < 1) {
        let _system = values[1].json();
        if (!isObject(_system) || _system.meta.results.returned < 1) {
          return null;
        }

        let sysData = htmlSanitizeObject(processNewStarSystemData(_system).then(r => {
          sessionStorage.setItem(`${AppConfig.AppNamespace}.system.${system}`, r !== null ? JSON.stringify(r) : r);
          return r;
        }));
        return sysData;
      }

      let sysData = htmlSanitizeObject(processNewStarSystemData(_populated_system).then(r => {
        sessionStorage.setItem(`${AppConfig.AppNamespace}.system.${system}`, r !== null ? JSON.stringify(r) : r);
        return r;
      }));
      return sysData;
    });
  }
}

/**
 * Formats returned data into a single object for ease of use.
 *
 * @param  {Object} data System data to process.
 * @return {Object}      Simplified system data.
 */
function processNewStarSystemData(data) {
  let system = JSON.parse(JSON.stringify(data)); // Deep clone copy.
  if (!isObject(system) || system.meta.results.returned < 1) {
    return null;
  }
  let sysData = system.data[0];

  if (sysData.attributes.bodies && sysData.attributes.bodies.length > 0) {
    sysData.attributes.is_populated = 1;
    sysData.bodies = sysData.attributes.bodies.filter(body => {
      return body.type === 'Star';
    });
  } else {
    sysData.attributes.is_populated = 0;
    let bodies = get(`/api/stars?filter[systemId:eq]=${sysData.id}`);

    // clean up other json properties.
    delete sysData.relationships;
    delete sysData.type;
    delete sysData.links;

    return Promise.all([sysData, bodies]).then(values => {
      let _sysData = values[0];
      let _bodies = values[1].json();
      if (isObject(_bodies) && _bodies.meta.results.returned > 0) {
        _sysData.bodies = _bodies.data;

        for (let body in _sysData.bodies) {
          if (_sysData.bodies.hasOwnProperty(body)) {
            delete _sysData.bodies[body].relationships;
            delete _sysData.bodies[body].type;
            delete _sysData.bodies[body].links;
          }
        }
      }

      return _sysData;
    });
  }

  // clean up other json properties.
  delete sysData.relationships;
  delete sysData.type;
  delete sysData.links;

  return sysData;
}