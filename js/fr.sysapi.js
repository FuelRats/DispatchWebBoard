var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : false;
fr.sysapi = {
  CachedSysInfo: {},
  /**
   * Retrieves starsystem information.
   * @param {[type]} SystemName      [description]
   * @param {[type]} successCallback [description]
   * @param {[type]} failCallback    [description]
   */
  GetSysInfo: function(SystemName, successCallback, failCallback) {
    var sysName = SystemName.toUpperCase();
    if(fr.sysapi.CachedSysInfo.hasOwnProperty(sysName)) {
      if(debug) console.log("fr.sysapi.GetSysInfo - Cached System Info Requested: ", fr.sysapi.CachedSysInfo[sysName]);
      if(fr.sysapi.CachedSysInfo[sysName] === null) {
        failCallback("error", "Not Found", null);
        return;
      }
      successCallback(fr.sysapi.CachedSysInfo[sysName]);
    } else {
      if(debug) console.log("fr.sysapi.GetSysInfo - Retrieving System Info: " + SystemName);
      fr.sysapi.ApiLookupCall(sysName, successCallback, failCallback);
    }
  },
  ApiLookupCall: function(SystemName, successCallback, failCallback) {
    $.ajax({
      dataType: 'json',
      url: 'https://system.api.fuelrats.com/systems?' + 'filter[name:eq]=' + encodeURIComponent(SystemName) + '&include=bodies',
      success: function (response) {
        if(response.meta.results.returned < 1) {
          if(debug) console.log("fr.sysapi.ApiEqCall - No system info found for: \"" + SystemName + "\". Sysinfo search failed. Calling failCallback.");
          fr.sysapi.CachedSysInfo[SystemName.toUpperCase()] = null; // This essentially marks it as missing, and we should not look for it again.                         
          failCallback();
          return;
        }
        var sysData = response.data[0];
        var sysName = sysData.attributes.name;

        //jsonAPI does not yet support included data filtering, so this cannot be offloaded to the server.
        if(response.included && response.included[0]) {
          sysData.bodies = response.included.filter(function(body) {
            return body.attributes.group_name === "Star";
          });
          //cleanup woo
          for (var body in sysData.bodies) {
            delete sysData.bodies[body].relationships;
            delete sysData.bodies[body].type;
            delete sysData.bodies[body].links;
          }
        }
        delete sysData.relationships;
        delete sysData.type;
        delete sysData.links;

        if(!fr.sysapi.CachedSysInfo.hasOwnProperty(sysName)){ //we're gonna check this to be safe.
          fr.sysapi.CachedSysInfo[sysName] = sysData;
        }

        if(debug) console.log("fr.sysapi.ApiEqCall - System information found: ", sysData);
        successCallback(sysData);
      },
    });
  },
  DeleteCacheInfo: function(SystemName) {
    var sysName = SystemName.toUpperCase();
    if(fr.sysapi.CachedSysInfo.hasOwnProperty(sysName)){
      delete fr.sysapi.CachedSysInfo[sysName];
    }
  },
};