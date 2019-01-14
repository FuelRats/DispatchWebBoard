// Module Imports
import url from 'url'





// App Imports
import AppConfig from '../config/config'
import {
  http,
  htmlSanitizeObject,
  isObject,
} from '../helpers'





/**
 * Formats returned data into a single object for ease of use.
 *
 * @param  {Object} data System data to process.
 * @return {Object}      Simplified system data.
 */
const processNewStarSystemData = (data) => {
  const system = JSON.parse(JSON.stringify(data)) // Deep clone copy.
  if (!isObject(system) || system.meta.results.returned < 1) {
    return null
  }
  const [sysData] = system.data

  if (system.included && system.included[0]) {
    sysData.bodies = system.included.filter((body) => body.attributes.group_name === 'Star')
    // cleanup body info
    Object.keys(sysData.bodies).forEach((body) => {
      delete sysData.bodies[body].relationships
      delete sysData.bodies[body].type
      delete sysData.bodies[body].links
    })
  }

  // clean up other json properties.
  delete sysData.relationships
  delete sysData.type
  delete sysData.links

  return sysData
}





const get = (endpoint, opts) => http.get(url.resolve('https://system.api.fuelrats.com/', endpoint), opts)

/**
 * Gets system information for the given system name
 *
 * @param  {String} system System name to get info on.
 * @return {Object}        Object containing information pertaining to the given starsystem name.
 */
const getSystem = (_system) => {
  const system = _system.toUpperCase()

  if (sessionStorage.getItem(`${AppConfig.AppNamespace}.system.${system}`)) {
    const sysData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.system.${system}`))

    if (sysData === null) {
      return Promise.reject('System not found.')
    }

    return Promise.resolve(sysData)
  }
  return get(`/systems?filter[name:eq]=${encodeURIComponent(system)}&include=bodies`)
    .then((response) => {
      const sysData = htmlSanitizeObject(processNewStarSystemData(response.json()))
      sessionStorage.setItem(`${AppConfig.AppNamespace}.system.${system}`, sysData === null ? sysData : JSON.stringify(sysData))
      return sysData
    })
}





export {
  get,
  getSystem,
}
