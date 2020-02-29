// App Imports
import { isObject } from './Validation'


class Sanitizers {
  /**
   * Sanitize a given string to make it DOM safe.
   *
   * @param   {string} string String to sanitized
   * @returns {string}        String clean of HTML-specific characters.
   */
  static htmlSanitize (string) {
    return string.replace(/&/gu, '&amp;')
      .replace(/</gu, '&lt;')
      .replace(/>/gu, '&gt;')
      .replace(/"/gu, '&quot;')
      .replace(/'/gu, '&#x27;')
      .replace(/\//gu, '&#x2F;')
  }

  /**
   * Deep HTML sanitation of all string values within an array.
   *
   * @param   {object[]} array Array to sanitize
   * @returns {object}         Sanitized object.
   */
  static htmlSanitizeArray (array) {
    return array.map((value) => {
      if (typeof value === 'string') {
        return Sanitizers.htmlSanitize(value)
      }
      if (isObject(value)) {
        return Sanitizers.htmlSanitizeObject(value)
      }
      if (Array.isArray(value)) {
        return Sanitizers.htmlSanitizeArray(value)
      }
      return value
    })
  }

  /**
   * Deep HTML sanitation of all string values of an object.
   *
   * @param   {object} obj Object to sanitize
   * @returns {object}     Sanitized object.
   */
  static htmlSanitizeObject (obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        return {
          ...acc,
          [key]: Sanitizers.htmlSanitize(value),
        }
      }
      if (isObject(value)) {
        return {
          ...acc,
          [key]: Sanitizers.htmlSanitizeObject(value),
        }
      }
      if (Array.isArray(value)) {
        return {
          ...acc,
          [key]: Sanitizers.htmlSanitizeArray(value),
        }
      }
      return {
        ...acc,
        [key]: value,
      }
    }, {})
  }
}





const {
  htmlSanitize,
  htmlSanitizeArray,
  htmlSanitizeObject,
} = Sanitizers

export {
  htmlSanitize,
  htmlSanitizeArray,
  htmlSanitizeObject,
}
