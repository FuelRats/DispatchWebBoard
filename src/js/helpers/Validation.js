/**
 * Confirms that the object is a generic object and not a specific type.
 *
 * @param  {Any}     object Object to validate.
 * @return {Boolean}        Boolean representing if the given object is a generic object.
 */
export function isObject(object) {
  return object !== null &&
         typeof object === 'object' &&
         Object.prototype.toString.call(object) === '[object Object]';
}


/**
 * Checks that the given key is a proper member of the given object, and is of the correct given type.
 * 
 * @param  {Object}            obj   - object containing the given property.
 * @param  {String}            key   - Name of the property to check for.
 * @param  {(String|String[])} ktype - Expected type of the property object.
 * @return {Boolean}                 - Boolean representing if the given key exists, and is of expected type.
 */
export function isValidProperty(obj, key, ktype) {
  let isValidType = (item, type) => {
    switch (type) {
    case 'array':
      return Array.isArray(item);
    case 'object':
      return isObject(item);
    case 'null':
      return item === null;
    case 'undefined':
      return item === undefined;
    default:
      return typeof item === type;
    }
  };
  return Array.isArray(ktype) ? ktype.some(item => isValidType(obj[key],item)) : isValidType(obj[key],ktype);
}


/**
 * Checks if the given number is within the given range.
 *
 * @param  {Number}  num Number to validate.
 * @param  {Number}  min Minimum value of the range.
 * @param  {Number}  max Maximum value of the range.
 * @return {Boolean}     Boolean representing whether or not the given number is within the given range.
 */
export function isInRange(num, min, max) {
  return typeof num === 'number' && //
         typeof min === 'number' && // Ensure all args are numbers
         typeof max === 'number' && // 
         max >= min && // Ensure max is at least = to min
         num >= min && // Is number greater than or equal to min
         num <= max;   // Is number less than or equal to max
}