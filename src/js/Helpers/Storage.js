import AppConfig from 'Config/Config.js'

const storageProxyHandler = {
  
  /**
   * Gets the given property from the target storage object.
   *
   * @param   {Object} target   Storage object
   * @param   {String} property Property name
   * @returns {String}          Value of property
   */
  get(target, property) {
    return target.getItem(`${AppConfig.AppNamespace}.${property}`)
  },

  /**
   * Sets the value for the given property to the target Storage object.
   *
   * @param {Object} target   Storage object
   * @param {String} property Property name
   * @param {String} value    Value of property
   * @returns {void}
   */
  set(target, property, value) {
    target.setItem(`${AppConfig.AppNamespace}.${property}`, value)
    
    if (target.getItem(`${AppConfig.AppNamespace}.${property}`) === value) {
      return true
    }
    return false
  },

  /**
   * Deletes the given property from the target storage object.
   *
   * @param   {Object}  target   Storage object
   * @param   {String}  property Property name
   * @returns {Boolean}          Whether the delete operation succeeds.
   */
  delete(target, property) {
    target.removeItem(`${AppConfig.AppNamespace}.${property}`)
    
    if (target.getItem(`${AppConfig.AppNamespace}.${property}`)) {
      return false
    }
    return true
  }
}

export const WebStore = {
  local: new Proxy(window.localStorage, storageProxyHandler),
  session: new Proxy(window.sessionStorage, storageProxyHandler)
}