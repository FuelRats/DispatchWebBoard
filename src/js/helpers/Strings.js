import { monthString } from '../util/frConstants'

// makeID
const DEFAULT_ID_LENGTH = 48

// Base64 characters
const DEFAULT_ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// makeDateHumanReadable
const GAME_TIME_YEAR_DISPARITY = 1286

// makeTimeSpanString
const MILLISECONDS_IN_SECOND = 1000
const MINUTES_IN_HOUR = 60
const SECONDS_IN_HOUR = 3600
const SECONDS_IN_MINUTE = 60

// makeDateHumanReadable, makeTimeSpanString
const TEN = 10





/**
 * Generates a random base64 ID of a given char length
 *
 * @param   {number=} length Desired length of the ID
 * @param   {string}  chars  Allowed Chars
 * @returns {string}         Generated base64 ID
 */
const makeID = (length = DEFAULT_ID_LENGTH, chars = DEFAULT_ALLOWED_CHARS) => {
  return Array.from(Array(length), () => {
    return chars.charAt(Math.floor(Math.random() * chars.length))
  }).join('')
}


/**
 * Formats a date object to the galactic standard date-time format. (yyyy MMM dd HH:mm:ss)
 *
 * @param   {object} date Date object to convert
 * @returns {string}      Formatted date string
 */
const makeDateHumanReadable = (date) => {
  // Extract required information to be formatted
  const year = date.getUTCFullYear() + GAME_TIME_YEAR_DISPARITY
  const month = monthString[date.getUTCMonth()]
  const day = date.getUTCDate() < TEN ? `0${date.getUTCDate()}` : date.getUTCDate()
  const hour = date.getUTCHours() < TEN ? `0${date.getUTCHours()}` : date.getUTCHours()
  const minute = date.getUTCMinutes() < TEN ? `0${date.getUTCMinutes()}` : date.getUTCMinutes()
  const second = date.getUTCSeconds() < TEN ? `0${date.getUTCSeconds()}` : date.getUTCSeconds()

  // Format: 1970 JAN 01 00:00:00
  return `${year} ${month} ${day} ${hour}:${minute}:${second}`
}

/**
 * Takes the difference between the provided start and end time, then formats it into a string. (HH:mm:ss)
 *
 * @param   {object} startTime starting time
 * @param   {object} endTime   ending time
 * @returns {string}           Formatted time string
 */
const makeTimeSpanString = (startTime, endTime) => {
  // Get disparity between start and end times, then convert that disparity to hours, minutes, and seconds.
  const secondsElapsed = Math.round(startTime / MILLISECONDS_IN_SECOND) - Math.round(endTime / MILLISECONDS_IN_SECOND)


  const hours = ~~(secondsElapsed / SECONDS_IN_HOUR) /* eslint-disable-line no-bitwise */// not a typo


  const minutes = ~~((secondsElapsed % SECONDS_IN_HOUR) / MINUTES_IN_HOUR) /* eslint-disable-line no-bitwise */// not a typo


  const seconds = secondsElapsed % SECONDS_IN_MINUTE

  // Format: 00:00:00
  return `${hours < TEN ? `0${hours}` : hours}:${minutes < TEN ? `0${minutes}` : minutes}:${seconds < TEN ? `0${seconds}` : seconds}`
}



export {
  makeID,
  makeDateHumanReadable,
  makeTimeSpanString,
}
