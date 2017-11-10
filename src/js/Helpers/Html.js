// App Imports
import {isObject} from './Validation.js';

/**
 * Sanitize a given string to make it DOM safe.
 *
 * @param   {String} string String to sanitized
 * @returns {String}        String clean of HTML-specific characters.
 */
export function htmlSanitize(string) {
  return string.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Deep HTML sanitation of all string values of an object.
 *
 * @param   {Object} obj Object to sanitize
 * @returns {Object}     Sanitized object.
 */
export function htmlSanitizeObject(obj) {
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      obj[key] = htmlSanitize(value);
    } else if (isObject(value)) {
      obj[key] = htmlSanitizeObject(value);
    } else if (Array.isArray(value)) {
      obj[key] = htmlSanitizeArray(value);
    }
  }
  return obj;
}

/**
 * Deep HTML sanitation of all string values within an array.
 *
 * @param   {Object[]} array Array to sanitize
 * @returns {Object}         Sanitized object.
 */
export function htmlSanitizeArray(array) {
  let newArray = [];
  for (let value of array) {
    if (typeof value === 'string') {
      newArray.push(htmlSanitize(value));
    } else if (isObject(value)) {
      newArray.push(htmlSanitizeObject(value));
    } else if (Array.isArray(value)) {
      newArray.push(htmlSanitizeArray(value));
    } else {
      newArray.push(value);
    }
  }
  return newArray;
}