// Module Imports
import url from 'url'





// App Imports
import AppConfig from '../config/config'
import {
  http,
  htmlSanitizeObject,
  isObject,
} from '../helpers'

const get = (endpoint, opts) => http.get(url.resolve(AppConfig.SystemsURI, endpoint), opts)

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
  window.console.debug(sysData)

  if (sysData.bodies && sysData.bodies.length > 0) {
    sysData.attributes.isPopulated = 1
    sysData.bodies = sysData.attributes.bodies.filter((body) => body.type === 'Star')
  } else {
    sysData.attributes.isPopulated = 0
    const bodies = get(`/api/stars?filter[systemId:eq]=${sysData.id}`)

    // clean up other json properties.
    delete sysData.relationships
    delete sysData.type
    delete sysData.links

    return Promise.all([sysData, bodies]).then((values) => {
      const [_sysData, _bodies] = [values[0], values[1].json()]
      if (isObject(_bodies) && _bodies.meta.results.returned > 0) {
        _sysData.bodies = _bodies.data

        Object.keys(sysData.bodies).forEach((body) => {
          delete sysData.bodies[body].relationships
          delete sysData.bodies[body].type
          delete sysData.bodies[body].links
        })
      }

      return _sysData
    })
  }

  // clean up other json properties.
  delete sysData.relationships
  delete sysData.type
  delete sysData.links

  return htmlSanitizeObject(sysData)
}


const cacheSystemData = (sysName, sysData) => {
  sessionStorage.setItem(`${AppConfig.AppNamespace}.system.${sysName}`, sysData ? JSON.stringify(sysData) : null)
  return sysData
}


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
  const populatedSystems = get(`/api/populated_systems?filter[name:eq]=${encodeURIComponent(system)}`)
  const systems = get(`/api/systems?filter[name:eq]=${encodeURIComponent(system)}`)

  return Promise.all([populatedSystems, systems]).then((values) => {
    const _populatedSystem = values[0].json()

    if (!isObject(_populatedSystem) || _populatedSystem.meta.results.returned < 1) {
      const _nonPopSystem = values[1].json()
      if (!isObject(_nonPopSystem) || _nonPopSystem.meta.results.returned < 1) {
        return null
      }

      return processNewStarSystemData(_nonPopSystem).then((resolvedSystem) => cacheSystemData(system, resolvedSystem))
    }

    return processNewStarSystemData(_populatedSystem).then((resolvedSystem) => cacheSystemData(system, resolvedSystem))
  })
}


export {
  get,
  getSystem,
}
