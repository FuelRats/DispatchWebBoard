/* globals debug:false, RatSocket:false */
/* exported selfCheck */
;(function(exports) {
  'use strict';

  function Util() {}

  Util.GetCookie = function GetCookie(name) {
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
  };

  Util.SetCookie = function SetCookie(name, value, expire) {
    let temp = name + "=" + encodeURIComponent(value) + (expire !== 0 ? "; path=/; expires=" + (new Date((new Date()).getTime() + expire)).toUTCString() + ";" : "; path=/;");
    document.cookie = temp;
  };

  Util.DelCookie = function DelCookie(name) {
    document.cookie = name + '=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  Util.CanSetCookies = function CanSetCookies() {
    Util.SetCookie('CookieTest', 'true', 0);
    let can = Util.GetCookie('CookieTest') !== null;
    Util.DelCookie('CookieTest');
    return can;
  };

  /**
   * Checks that the given key is a proper member of the given object, and is of the correct given type.
   * 
   * @param  {Object}            obj   - object containing the given property.
   * @param  {String}            key   - Name of the property to check for.
   * @param  {(String|String[])} ktype - Expected type of the property object.
   * @return {Boolean}                 - Boolean representing if the given key exists, and is of expected type.
   */
  Util.isValidProperty = function isValidProperty(obj, key, ktype) {
    let isValidType = function(item, type) {
      if(type === "array" ) {
        return Array.isArray(item);
      } else if (type === "object") {
        return Util.isObject(item);
      } else {
        return typeof item === type;
      }
    };
    return obj.hasOwnProperty(key) && ( !Array.isArray(ktype) ? isValidType(obj[key],ktype) : ktype.some(i => isValidType(obj[key],i)) );
  };

  Util.isObject = function isObject(object) {
    return object != null &&
           typeof object === 'object' &&
           Object.prototype.toString.call(object) === '[object Object]';
  };

  /**
   * Maps included relationship data to the relationship of the main data model.
   *
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  Util.mapRelationships =  function mapRelationships(data) {
    // Ensure data integrity, just to be safe.
    if (!Util.isObject(data) || 
        !Util.isValidProperty(data, "data", ["array","object"]) || 
        !Util.isValidProperty(data,"included", "array")) {
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
      if(!Util.isObject(relationships) || !Array.isArray(included)) { throw TypeError("Invalid Parameters"); }

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
        } else if (Util.isObject(relationships[relType].data)) {
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
  };

  Util.getTimeSpanString = function getTimeSpanString(startTime, endTime) {
    let secondsElapsed = Math.round(startTime / 1000) - Math.round(endTime / 1000);
    let seconds = secondsElapsed % 60;
    secondsElapsed -= seconds;
    let minutes = Math.floor(secondsElapsed / 60) % 60;
    secondsElapsed -= minutes * 60;
    let hours = Math.floor(secondsElapsed / 3600);
    return (hours < 10 ? '0' : '') + hours +
      ':' + (minutes < 10 ? '0' : '') + minutes +
      ':' + (seconds < 10 ? '0' : '') + seconds;
  };

  exports.Util = Util;
}(this || {}));

function selfCheck() {
  let validInstall = true;

  if (!fr.config) {
    window.console.error("%cSLFCHK:CONFIG - ERROR", 'color: red; font-weight: bold;');
    window.console.error(fr.config);
    validInstall = false;
  }

  if (!fr.user) {
    window.console.error("%cSLFCHK:USER - ERROR", 'color: red; font-weight: bold;');
    window.console.error(fr.user);
    validInstall = false;
  }

  if (!StarSystems) {
    window.console.error("%cSLFCHK:SYSAPI - ERROR", 'color: red; font-weight: bold;');
    window.console.error(StarSystems);
    validInstall = false;
  } 

  if (!RatSocket) {
    window.console.error("%cSLFCHK:RATSOCKET - ERROR", 'color: red; font-weight: bold;');
    window.console.error(RatSocket);
    validInstall = false;
  }

  if (!fr.client) {
    window.console.error("%cSLFCHK:CLIENT - ERROR", 'color: red; font-weight: bold;');
    window.console.error(fr.client);
    validInstall = false;
  }

  if(debug) {
    window.console.log('%cSLFCHK:DEBUG - TRUE', 'color: yellow;');
  }
  return validInstall;
}

window.console.debug = debug ? window.console.log.bind(window.console) : function(){ return false; };