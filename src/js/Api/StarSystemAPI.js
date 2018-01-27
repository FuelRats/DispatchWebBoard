// App Imports
import {
  http,
  mapRelationships,
  WebStore,
} from 'Helpers';





// Module Imports
import url from 'url';



const SYSTEM_NOT_FOUND = 'System not found.';
const REQUEST_ERROR = 'Systems API request error.';

/**
 * http wrapper to request information from the Systems API.
 *
 * @param   {String} endpoint Endpoint of the systems API to request.
 * @param   {Object} opts     Options to pass to the XHR request handler.
 * @returns {Object}          XHRResponse object containing information from the request.
 */
export const get = (endpoint, opts) => http.get(url.resolve('https://system.api.fuelrats.com/', endpoint), opts);

/**
 * Gets system information for the given system name
 *
 * @param   {String} system System name to get info on.
 * @returns {Object}        Object containing information pertaining to the given starsystem name.
 */
export async function getSystem(system) {
  system = system.toUpperCase();

  if (WebStore.session[`system.${system}`]) {

    const sysData = JSON.parse(WebStore.session[`system.${system}`]);

    if (sysData === null) {
      throw new SystemNotFoundError(system, SYSTEM_NOT_FOUND);
    }

    return sysData;

  } else {

    try {

      let response = await get(`/systems?filter[name:eq]=${encodeURIComponent(system)}&include=bodies`);
      response = response.json();

      if (response.data && response.data.length > 0) {

        response = mapRelationships(response);

        WebStore.session[`system.${system}`] = JSON.stringify(response);
        return response;

      } else {
        throw new SystemNotFoundError(system, SYSTEM_NOT_FOUND);
      }

    } catch (error) {

      if (error instanceof SystemNotFoundError) {
        WebStore.session[`system.${system}`] = null;
        throw error;
      }

      throw new Error(REQUEST_ERROR);
    }
  }
}

/**
 * Error thrown when no system is found
 */
export class SystemNotFoundError extends Error {
  /**
   * Creates a SystemNotFoundError
   *
   * @param   {String} system Name of the system that was not found.
   * @param   {...*}   params Params to be passed to super.
   * @returns {void}
   */
  constructor(system, ...params) {
    super(...params);
    this.system = system;
  }
}


