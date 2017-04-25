// File for global functions.
function GetCookie(name) {
  try {
    var cookie = document.cookie;
    var valueStart = cookie.indexOf(name + "=") + 1;
    if (valueStart === 0) {
      return null;
    }
    valueStart += name.length;
    var valueEnd = cookie.indexOf(";", valueStart);
    if (valueEnd == -1)
      valueEnd = cookie.length;
    return decodeURIComponent(cookie.substring(valueStart, valueEnd));
  } catch (e) {
  }
  return null;
}
function SetCookie(name, value, expire) {
  var temp = name + "=" + escape(value) + (expire !== 0 ? "; path=/; expires=" + ((new Date((new Date()).getTime() + expire)).toUTCString()) + ";" : "; path=/;");
  document.cookie = temp;
}
function CanSetCookies() {
  SetCookie('CookieTest', 'true', 0);
  var can = GetCookie('CookieTest') !== null;
  DelCookie('CookieTest');
  return can;
}
function DelCookie(name) {
  document.cookie = name + '=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function selfCheck() {
  var validInstall = true;
  if (!fr.config) {
    console.log("%cSLFCHK:CONFIG - ERROR",'color: red; font-weight: bold;');
    validInstall = false;
  } else
    console.log("%cSLFCHK:CONFIG - OK",'color: lightgreen;');
  if (!fr.user) {
    console.log("%cSLFCHK:USER - ERROR",'color: red; font-weight: bold;');
    validInstall = false;
  } else
    console.log("%cSLFCHK:USER - OK",'color: lightgreen;');
  if (!fr.ws) {
    console.log("%cSLFCHK:WEBSOCKET - ERROR",'color: red; font-weight: bold;');
    validInstall = false;
  } else
    console.log("%cSLFCHK:WEBSOCKET - OK",'color: lightgreen;');
  if (!fr.client) {
    console.log("%cSLFCHK:CLIENT - ERROR",'color: red; font-weight: bold;');
    validInstall = false;
  } else
    console.log("%cSLFCHK:CLIENT - OK",'color: lightgreen;');
  return validInstall;
}

function getTimeSpanString (startTime, endTime) {
  var secondsElapsed = Math.round(startTime / 1000) - Math.round(endTime / 1000);
  var seconds = secondsElapsed % 60;
  secondsElapsed -= seconds;
  var minutes = Math.floor(secondsElapsed / 60) % 60;
  secondsElapsed -= (minutes * 60);
  var hours   = Math.floor(secondsElapsed / 3600);
  return (hours   < 10 ? '0' : '') + hours + 
   ':' + (minutes < 10 ? '0' : '') + minutes + 
   ':' + (seconds < 10 ? '0' : '') + seconds;
}

/* == Below are defined constants == */
fr.const = {
  platform: {
    pc: {
      short: 'PC',
      long: 'PC'
    },
    xb: {
      short: 'XB1',
      long: 'Xbox One'
    },
    ps: {
      short: 'PS4',
      long: 'Playstation 4'
    },
    unknown: {
      short: '?',
      long: 'Unknown...'
    }
  },
  language: {
    'bg': {
      short: 'bg',
      long: 'Bulgarian'
    },
    'bs': {
      short: 'bs',
      long: 'Bosnian'
    },
    'ca': {
      short: 'ca',
      long: 'Catalan / Valencian'
    },
    'cs': {
      short: 'cs',
      long: 'Czech'
    },
    'da': {
      short: 'da',
      long: 'Danish'
    },
    'de': {
      short: 'de',
      long: 'German'
    },
    'el': {
      short: 'el',
      long: 'Modern Greek'
    },
    'en': {
      short: 'en',
      long: 'English'
    },
    'es': {
      short: 'es',
      long: 'Spanish / Castilian'
    },
    'et': {
      short: 'et',
      long: 'Estonian'
    },
    'fi': {
      short: 'fi',
      long: 'Finnish'
    },
    'fr': {
      short: 'fr',
      long: 'French'
    },
    'he': {
      short: 'he',
      long: 'Modern Hebrew'
    },
    'hr': {
      short: 'hr',
      long: 'Croatian'
    },
    'hu': {
      short: 'hu',
      long: 'Hungarian'
    },
    'it': {
      short: 'it',
      long: 'Italian'
    },
    'ja': {
      short: 'ja',
      long: 'Japanese'
    },
    'lt': {
      short: 'lt',
      long: 'Lithuanian'
    },
    'lv': {
      short: 'lv',
      long: 'Latvian'
    },
    'nb': {
      short: 'nb',
      long: 'Navajo, Navaho'
    },
    'nl': {
      short: 'nl',
      long: 'Dutch'
    },
    'pl': {
      short: 'pl',
      long: 'Polish'
    },
    'pt': {
      short: 'pt',
      long: 'Portuguese'
    },
    'ro': {
      short: 'ro',
      long: 'Romanian, Moldavian, Moldovan'
    },
    'ru': {
      short: 'ru',
      long: 'Russian'
    },
    'sk': {
      short: 'sk',
      long: 'Slovak'
    },
    'sl': {
      short: 'sl',
      long: 'Slovene'
    },
    'sr': {
      short: 'sr',
      long: 'Serbian'
    },
    'sv': {
      short: 'sv',
      long: 'Swedish'
    },
    'th': {
      short: 'th',
      long: 'Thai'
    },
    'tr': {
      short: 'tr',
      long: 'Turkish'
    },
    'uk': {
      short: 'uk',
      long: 'Ukrainian'
    },
    'unknown': {
      short: '?',
      long: 'Unknown...'
    },
    'zh': {
      short: 'zh',
      long: 'Chinese'
    }
  }
};