import {isObject} from './Validation.js';

export const htmlSanitize = (string) => {
  return (string.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;'));
};
/**
 * Deep HTML sanitation of all string values of an object.
 *
 * @param  {Object} obj Object to sanitize
 * @return {Object}     Sanitized object.
 */
export const htmlSanitizeObject = (obj) => {
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
};

export const htmlSanitizeArray = (array) => {
  let newArray = [];
  for(let value of array) {
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
};