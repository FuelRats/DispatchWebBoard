/* globals debug:false, RatSocket:false */
/* exported GetCookie, SetCookie, CanSetCookies, DelCookie, selfCheck, getTimeSpanString, checkNested */

function GetCookie(name) {
  try {
    let cookie = document.cookie;
    let valueStart = cookie.indexOf(name + "=") + 1;
    if (valueStart === 0) {
      return null;
    }
    valueStart += name.length;
    let valueEnd = cookie.indexOf(";", valueStart);
    if (valueEnd === -1) {
      valueEnd = cookie.length;
    }
    return decodeURIComponent(cookie.substring(valueStart, valueEnd));
  } catch (e) {}
  return null;
}

function SetCookie(name, value, expire) {
  let temp = name + "=" + encodeURIComponent(value) + (expire !== 0 ? "; path=/; expires=" + (new Date((new Date())
      .getTime() + expire))
    .toUTCString() + ";" : "; path=/;");
  document.cookie = temp;
}

function DelCookie(name) {
  document.cookie = name + '=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function CanSetCookies() {
  SetCookie('CookieTest', 'true', 0);
  let can = GetCookie('CookieTest') !== null;
  DelCookie('CookieTest');
  return can;
}

function selfCheck() {
  let validInstall = true;
  if (!fr.config) {
    window.console.log("%cSLFCHK:CONFIG - ERROR", 'color: red; font-weight: bold;');
    validInstall = false;
  } else {
    window.console.log("%cSLFCHK:CONFIG - OK", 'color: lightgreen;');
  }
  if (!fr.user) {
    window.console.log("%cSLFCHK:USER - ERROR", 'color: red; font-weight: bold;');
    validInstall = false;
  } else {
    window.console.log("%cSLFCHK:USER - OK", 'color: lightgreen;');
  }
  if (!fr.sysapi) {
    window.console.log("%cSLFCHK:SYSAPI - ERROR", 'color: red; font-weight: bold;');
    validInstall = false;
  } else {
    window.console.log("%cSLFCHK:SYSAPI - OK", 'color: lightgreen;');
  }
  if (!fr.ws) {
    window.console.log("%cSLFCHK:WEBSOCKET - ERROR", 'color: red; font-weight: bold;');
    validInstall = false;
  } else {
    window.console.log("%cSLFCHK:WEBSOCKET - OK", 'color: lightgreen;');
  }
  if (!fr.client) {
    window.console.log("%cSLFCHK:CLIENT - ERROR", 'color: red; font-weight: bold;');
    validInstall = false;
  } else {
    window.console.log("%cSLFCHK:CLIENT - OK", 'color: lightgreen;');
  }
  window.console.log(`%cSLFCHK:DEBUG - ${debug.toString().toUpperCase()}`, 'color: lightgreen;');
  return validInstall;
}

function getTimeSpanString(startTime, endTime) {
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

// God I hate nested JSON sometimes
// Good thing this is now being phased out for better handling of errors.
// https://stackoverflow.com/questions/2631001/javascript-test-for-existence-of-nested-object-key
function checkNested(obj /*, level1, level2, ... levelN*/ ) {
  let args = Array.prototype.slice.call(arguments, 1);

  for (let i = 0; i < args.length; i++) {
    if (!obj || !obj.hasOwnProperty(args[i])) {
      return false;
    }
    obj = obj[args[i]];
  }
  return true;
}

window.console.debug = function() {
  if (debug) {
    window.console.log.apply(this, arguments);
  }
};