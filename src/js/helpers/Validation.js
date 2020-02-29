/**
 * Confirms that the object is a generic object and not a specific type.
 *
 * @param   {any}     object Object to validate.
 * @returns {boolean}        Boolean representing if the given object is a generic object.
 */
const isObject = (object) => {
  return object
    && typeof object === 'object'
    && Object.prototype.toString.call(object) === '[object Object]'
}


/**
 * Checks that the given key is a proper member of the given object, and is of the correct given type.
 *
 * @param   {object}            obj   object containing the given property.
 * @param   {string}            key   Name of the property to check for.
 * @param   {(string|string[])} ktype Expected type of the property object.
 * @returns {boolean}                 Boolean representing if the given key exists, and is of expected type.
 */
const isValidProperty = (obj, key, ktype) => {
  const isValidType = (item, type) => {
    switch (type) {
      case 'array':
        return Array.isArray(item)
      case 'object':
        return isObject(item)
      case 'null':
        /* eslint-disable-next-line eqeqeq */// explicit check required.
        return item === null
      case 'undefined':
        return item === undefined
      default:
        return typeof item === type
    }
  }
  return Array.isArray(ktype)
    ? ktype.some((item) => {
      return isValidType(obj[key], item)
    })
    : isValidType(obj[key], ktype)
}


/**
 * Checks if the given number is within the given range.
 *
 * @param  {number}  num Number to validate.
 * @param  {number}  min Minimum value of the range.
 * @param  {number}  max Maximum value of the range.
 * @returns {boolean}     Boolean representing whether or not the given number is within the given range.
 */
const isInRange = (num, min, max) => {
  return typeof num === 'number' //
         && typeof min === 'number' // Ensure all args are numbers
         && typeof max === 'number' //
         && max >= min // Ensure max is at least = to min
         && num >= min // Is number greater than or equal to min
         && num <= max
} // Is number less than or equal to max





export {
  isObject,
  isValidProperty,
  isInRange,
}
