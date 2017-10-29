/**
 * Gets the value of the cookie matching the given name.
 *
 * @param  {String} name Name of the cookie
 * @return {String}      Value of the cookie, null if not found.
 */
export function GetCookie(name) {
  try {
    let cookie = document.cookie;
    let valueStart = cookie.indexOf(`${name}=`) + 1;
    if (valueStart === 0) {
      return null;
    }
    valueStart += name.length;
    let valueEnd = cookie.indexOf(';', valueStart);
    if (valueEnd === -1) {
      valueEnd = cookie.length;
    }
    return decodeURIComponent(cookie.substring(valueStart, valueEnd));
  } catch (error) {
    return null;
  }
}

/**
 * Sets the value of the given cookie name
 *
 * @param {string} name   Name of the cookie
 * @param {string} value  Value of the cookie
 * @param {Number} expire Time (in milliseconds) until cookie expiration.
 */
export function SetCookie(name, value, expire) {
  let temp = `${name}=${encodeURIComponent(value)}${(expire !== 0 ? `; path=/; expires=${(new Date((new Date()).getTime() + expire)).toUTCString()};` : '; path=/;')}`;
  document.cookie = temp;
}

/**
 * Deletes the cookie matching the  given name.
 *
 * @param {String} name Name of the cookie
 */
export function DelCookie(name) {
  document.cookie = `${name}=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

/**
 * Creates and deletes a test cookie to check if cookies can be set
 * 
 * @return {Boolean} Representing the ability to set cookies.
 */
export function CanSetCookies() {
  SetCookie('CookieTest', 'true', 0);
  let can = GetCookie('CookieTest') !== null;
  DelCookie('CookieTest');
  return can;
}