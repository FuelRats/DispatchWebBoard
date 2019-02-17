// Module Imports
import axios from 'axios'





// App Imports
import AppConfig from '../AppConfig'
import { isObject } from '../helpers/Validation'





const StarSystemApi = axios.create({
  baseURL: `${AppConfig.SystemsURI}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})





const getStarsForSystemId = async (systemId) => {
  let bodyData = []

  try {
    const bodies = await StarSystemApi.request({
      url: '/stars',
      params: {
        'filter[systemId:eq]': systemId,
      },
    }).then((res) => res.data)

    if (isObject(bodies) && bodies.meta.results.returned > 0) {
      bodyData = bodies.data
    }
  } catch {
    // do nothing
  }

  return bodyData
}

const getPopulatedSystemsByName = (system) => StarSystemApi.request({
  url: '/populated_systems',
  params: {
    'filter[name:eq]': encodeURIComponent(system),
  },
}).then((res) => res.data)

const getSystemsByName = (system) => StarSystemApi.request({
  url: '/systems',
  params: {
    'filter[name:eq]': encodeURIComponent(system),
  },
}).then((res) => res.data)





const getSystem = async (_system) => {
  const system = _system.toUpperCase()

  const cachedSystem = sessionStorage.getItem(`${AppConfig.AppNamespace}.system.${system}`)
  let systemData = null

  if (cachedSystem) {
    systemData = JSON.parse(cachedSystem)
  } else {
    const populatedSystems = await getPopulatedSystemsByName(system)

    if (isObject(populatedSystems) && populatedSystems.meta.results.returned > 0) {
      systemData = populatedSystems.data[0]
      systemData.attributes.isPopulated = true
    } else {
      const systems = await getSystemsByName(system)

      if (isObject(populatedSystems) && populatedSystems.meta.results.returned > 0) {
        systemData = systems.data[0]

        systemData.attributes.bodies = await getStarsForSystemId(systemData.id)
      }
    }

    sessionStorage.setItem(`${AppConfig.AppNamespace}.system.${system}`, JSON.stringify(systemData))
  }

  if (!systemData) {
    throw new Error('System not found.')
  }

  return { ...systemData }
}





export default StarSystemApi
export {
  getSystem,
}
