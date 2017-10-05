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
  let isValidType = function(item, type) {
    if(type === 'array') {
      return Array.isArray(item);
    } else if (type === 'object') {
      return isObject(item);
    } else {
      return typeof item === type;
    }
  };
  return obj.hasOwnProperty(key) && (!Array.isArray(ktype) ? isValidType(obj[key],ktype) : ktype.some(i => isValidType(obj[key],i)));
}

export function isInRange(num, min, max) {
  return typeof num === 'number' && //
         typeof min === 'number' && // Ensure all args are numbers
         typeof max === 'number' && // 
         max >= min && // Ensure max is at least = to min
         num >= min && // Is number greater than or equal to min
         num <= max;   // Is number less than or equal to max
}