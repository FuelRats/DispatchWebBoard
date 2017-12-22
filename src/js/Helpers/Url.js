/**
 * Gets parameter from the page querystring
 *
 * @param   {String} key Param key to find.
 * @returns {Object}     The value of the specified key, returns null if not found.
 */
export function getUrlParam(key) {
  let param = window.location.search.slice(1)
    .split('&')
    .find(kvPair => kvPair.split('=')[0] === key)
  return param === undefined ? null : param.split('=')[1]
  // Can you tell I tried REALLY HARD to make this a one liner?
}

/**
 * Removes url hash information from the active URL.
 *
 * @returns {void}
 */
export function clearUrlHash() {
  if (window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
  }
}

/**
 * Removes all params defined in the URL.
 *
 * @returns {[type]} [description]
 */
export function clearUrlParams() {
  if (window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
  }
}