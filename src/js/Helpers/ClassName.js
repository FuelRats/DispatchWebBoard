import { isObject } from './Validation'

/**
 * Returns a class string from a given set of class name parameters.
 *
 * @param {...(String|Object)} classNames Class names to resolve. 
 * @returns {String}                      String containing resolved class names separated by a space.
 */
export function classNames(...classNames) {
  let classes = {}

  for (let className of classNames) {
    if (typeof className === 'string') {
      classes[className] = true
    } else if (isObject(className)) {
      for (let [key, value] of Object.entries(className)) {
        classes[key] = typeof value === 'function' ? Boolean(value()) : Boolean(value)
      }
    }
  }
  return Object.keys(classes).filter(item => classes[item] === true).join(' ')
}