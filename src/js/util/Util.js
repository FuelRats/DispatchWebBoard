import {monthString as monthHumanReadable} from './frConstants.js';

export function GetCookie(name) {
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

export function SetCookie(name, value, expire) {
  let temp = name + "=" + encodeURIComponent(value) + (expire !== 0 ? "; path=/; expires=" + (new Date((new Date()).getTime() + expire)).toUTCString() + ";" : "; path=/;");
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

export function isObject(object) {
  return object !== null &&
         typeof object === 'object' &&
         Object.prototype.toString.call(object) === '[object Object]';
}

export function isElement(obj) {
  return obj &&
         typeof obj === 'object' &&
         obj.nodeType === 1 &&
         typeof obj.nodeName === 'string';
}

/**
 * Checks that the given key is a proper member of the given object, and is of the correct given type.
 * 
 * @param  {Object}            obj   - object containing the given property.
 * @param  {String}            key   - Name of the property to check for.
 * @param  {(String|String[])} ktype - Expected type of the property object.
 * @return {Boolean}                 - Boolean representing if the given key exists, and is of expected type.
 */
export function isValidProperty(obj, key, ktype) {
  let isValidType = function(item, type) {
    if(type === "array" ) {
      return Array.isArray(item);
    } else if (type === "object") {
      return isObject(item);
    } else {
      return typeof item === type;
    }
  };
  return obj.hasOwnProperty(key) && ( !Array.isArray(ktype) ? isValidType(obj[key],ktype) : ktype.some(i => isValidType(obj[key],i)) );
}

/**
 * Maps included relationship data to the relationship of the main data model.
 *
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
export function mapRelationships(data) {
  // Ensure data integrity, just to be safe.
  if (!isObject(data) || 
      !isValidProperty(data, "data", ["array","object"]) || 
      !isValidProperty(data,"included", "array")) {
    throw TypeError("Invalid data model");
  }

  function findInclude(member, included) {
    let includeMatches = included.filter(obj => !obj.id || !obj.type ? false : obj.id === member.id && obj.type === member.type);
    if (includeMatches.length > 1) { 
      window.console.error("fr.user.mapProfileRelationships.findInclude - Multiple matches to included filter: ", includeMatches);
    }
    return includeMatches[0];
  }

  function mapRelationshipItems(relationships, included) {
    if(!isObject(relationships) || !Array.isArray(included)) { throw TypeError("Invalid Parameters"); }

    for(let relType in relationships) {
      if(!relationships.hasOwnProperty(relType)) { continue; }

      if(Array.isArray(relationships[relType].data) && relationships[relType].data.length > 0) {
        let typeMembers = relationships[relType].data;
        for (let i=0; i < typeMembers.length; i+=1) {
          let member = typeMembers[i];
          if(member && member.id && member.type) {
            relationships[relType][member.id] = findInclude(member, included);
            if (relationships[relType][member.id].hasOwnProperty("relationships")) {
              relationships[relType][member.id].relationships = mapRelationshipItems(relationships[relType][member.id].relationships, included);
            }
          }
        }
      } else if (isObject(relationships[relType].data)) {
        let member = relationships[relType].data;
        if(member.id && member.type) {
          relationships[relType][member.id] = findInclude(member, included);
          if (relationships[relType][member.id].hasOwnProperty("relationships")) {
            relationships[relType][member.id].relationships = mapRelationshipItems(relationships[relType][member.id].relationships, included);
          }
        }
      }
      delete relationships[relType].data;
    }
    return relationships;
  }
  
  if(Array.isArray(data.data)) {
    for (let dataItem in data.data) {
      if (!data.data.hasOwnProperty(dataItem)) { continue; }
      data.data[dataItem].relationships = mapRelationshipItems(data.data[dataItem].relationships, data.included);
    }
  } else {
    data.data.relationships = mapRelationshipItems(data.data.relationships, data.included);
  }
  
  return data;
}

/**
 * Generates a random base64 ID of a given char length
 * 
 * @param  {Number} length - Desired length of the ID
 * @return {String}        - Generated base64 ID
 */
export function makeID (length = 48) {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let text = [];
  let i = 0;
  for (i=0; i < length; i+=1) {
    text.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  return text.join('');
}

export function getDateHumanReadable(date) {
  return (date.getUTCFullYear() + 1286) +
    ' ' + monthHumanReadable[date.getUTCMonth()] +
    ' ' + (date.getUTCDate() < 10 ? '0' : '') + date.getUTCDate() +
    ' ' + (date.getUTCHours() < 10 ? '0' : '') + date.getUTCHours() +
    ':' + (date.getUTCMinutes() < 10 ? '0' : '') + date.getUTCMinutes() +
    ':' + (date.getUTCSeconds() < 10 ? '0' : '') + date.getUTCSeconds();
}

export function getTimeSpanString(startTime, endTime) {
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

export function getUrlParam(r) {
  let param = window.location.href.slice(window.location.href.indexOf("?")+1)
                                  .split("&")
                                  .find(e => e.split("=")[0] === r);
  return param === undefined ? null : param.split("=")[1];
  //Can you tell I tried REALLY HARD to make this a one liner?
}