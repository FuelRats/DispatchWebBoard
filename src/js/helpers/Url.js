/* eslint-disable import/prefer-default-export */





/**
 * Gets parameter from the page querystring
 *
 * @param   {string} key Param key to find.
 * @returns {object}     The value of the specified key, returns null if not found.
 */
const getUrlParam = (key) => {
  const param = window.location.href.slice(window.location.href.indexOf('?') + 1)
    .split('&')
    .find((kvPair) => {
      return kvPair.split('=')[0] === key
    })
  return param === undefined ? null : param.split('=')[1]
  // Can you tell I tried REALLY HARD to make this a one liner?
}




export {
  getUrlParam,
}
