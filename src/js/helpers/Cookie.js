export function GetCookie(name) {
  try {
    let cookie = document.cookie;
    let valueStart = cookie.indexOf(name + '=') + 1;
    if (valueStart === 0) {
      return null;
    }
    valueStart += name.length;
    let valueEnd = cookie.indexOf(';', valueStart);
    if (valueEnd === -1) {
      valueEnd = cookie.length;
    }
    return decodeURIComponent(cookie.substring(valueStart, valueEnd));
  } catch (e) {
    return null;
  }
}

export function SetCookie(name, value, expire) {
  let temp = name + '=' + encodeURIComponent(value) + (expire !== 0 ? '; path=/; expires=' + (new Date((new Date()).getTime() + expire)).toUTCString() + ';' : '; path=/;');
  document.cookie = temp;
}

export function DelCookie(name) {
  document.cookie = name + '=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export function CanSetCookies() {
  SetCookie('CookieTest', 'true', 0);
  let can = GetCookie('CookieTest') !== null;
  DelCookie('CookieTest');
  return can;
}