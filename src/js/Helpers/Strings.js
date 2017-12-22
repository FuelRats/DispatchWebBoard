import {monthString} from 'Config/Strings.js'


const 
  // makeID
  DEFAULT_ID_LENGTH = 48,
  DEFAULT_ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', // Base64 characters
  // makeDateHumanReadable
  GAME_TIME_YEAR_DISPARITY = 1286,
  // makeTimeSpanString
  MILLISECONDS_IN_SECOND = 1000,
  MINUTES_IN_HOUR = 60,
  SECONDS_IN_HOUR = 3600,
  SECONDS_IN_MINUTE = 60,
  // makeDateHumanReadable, makeTimeSpanString
  TEN = 10


/**
 * Generates a random ID of a given char length, which has been created from the string of allowed characters.
 * 
 * @param   {Number=} length Desired length of the ID. Default: 48
 * @param   {String=} chars  Chars used in generating the id. Default: Base64
 * @returns {String}         Generated ID.
 */
export function makeID(length = DEFAULT_ID_LENGTH, chars = DEFAULT_ALLOWED_CHARS) {
  // Make array the size of the desired length, fill values of array with random characters then return as a single joined string.
  return Array.from(Array(length), () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

/**
 * Formats a date object to the galactic standard date-time format. (yyyy MMM dd HH:mm:ss)
 *
 * @param   {Object} date Date object to convert.
 * @returns {String}      Formatted date string.
 */
export function makeDateHumanReadable(date) {

  // Extract required information to be formatted
  let
    year   = date.getUTCFullYear() + GAME_TIME_YEAR_DISPARITY,
    month  = monthString[date.getUTCMonth()],
    day    = date.getUTCDate()    < TEN ? `0${date.getUTCDate()}`    : date.getUTCDate(),
    hour   = date.getUTCHours()   < TEN ? `0${date.getUTCHours()}`   : date.getUTCHours(),
    minute = date.getUTCMinutes() < TEN ? `0${date.getUTCMinutes()}` : date.getUTCMinutes(),
    second = date.getUTCSeconds() < TEN ? `0${date.getUTCSeconds()}` : date.getUTCSeconds()

  // Format: 1970 JAN 01 00:00:00
  return `${year} ${month} ${day} ${hour}:${minute}:${second}`
}

/**
 * Takes the difference between the provided start and end time, then formats it into a string. (HH:mm:ss)
 *
 * @param   {Object} startTime starting time
 * @param   {Object} endTime   ending time
 * @returns {String}           Formatted time string
 */
export function makeTimeSpanString(startTime, endTime) {
  
  // Get disparity between start and end times, then convert that disparity to hours, minutes, and seconds.
  let 
    secondsElapsed = Math.round(startTime / MILLISECONDS_IN_SECOND) - Math.round(endTime / MILLISECONDS_IN_SECOND),
    hours   = ~~(secondsElapsed / SECONDS_IN_HOUR),
    minutes = ~~(secondsElapsed % SECONDS_IN_HOUR / MINUTES_IN_HOUR),
    seconds = secondsElapsed % SECONDS_IN_MINUTE

  // Format: 00:00:00
  return `${hours < TEN ? `0${hours}` : hours}:${minutes < TEN ? `0${minutes}` : minutes}:${seconds < TEN ? `0${seconds}` : seconds}`
}