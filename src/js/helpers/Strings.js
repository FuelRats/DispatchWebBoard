import {monthString} from '../util/frConstants.js';

/**
 * Generates a random base64 ID of a given char length
 * 
 * @param  {Number} length - Desired length of the ID
 * @return {String}        - Generated base64 ID
 */
export function makeID(length = 48) {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let text = [];
  let i = 0;
  for (i = 0; i < length; i += 1) {
    text.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  return text.join('');
}

export function makeDateHumanReadable(date) {
  return (date.getUTCFullYear() + 1286) +
    ' ' + monthString[date.getUTCMonth()] +
    ' ' + (date.getUTCDate() < 10 ? '0' : '') + date.getUTCDate() +
    ' ' + (date.getUTCHours() < 10 ? '0' : '') + date.getUTCHours() +
    ':' + (date.getUTCMinutes() < 10 ? '0' : '') + date.getUTCMinutes() +
    ':' + (date.getUTCSeconds() < 10 ? '0' : '') + date.getUTCSeconds();
}

export function makeTimeSpanString(startTime, endTime) {
  let secondsElapsed = Math.round(startTime / 1000) - Math.round(endTime / 1000);
  let seconds = secondsElapsed % 60;
  secondsElapsed -= seconds;
  let minutes = Math.floor(secondsElapsed / 60) % 60;
  secondsElapsed -= minutes * 60;
  let hours = Math.floor(secondsElapsed / 3600);
  return (hours < 10 ? '0' : '') + hours +
    ':' + (minutes < 10 ? '0' : '') + minutes +
    ':' + (seconds < 10 ? '0' : '') + seconds;
}