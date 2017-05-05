var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : false;
fr.sysapi = {
  CachedSysInfo: {},
  /**
   * Retrives related system information
   * @param {String} SystemName      Name of the system to retrive info for
   * @param {[type]} successCallback [description]
   * @param {[type]} failCallback    [description]
   */
  GetSysInfo: function(SystemName, successCallback, failCallback) {
    var sysName = SystemName.toLowerCase();
    if(fr.sysapi.CachedSysInfo.hasOwnProperty(sysName)) {
      if(debug) console.log("fr.sysapi.GetSysInfo - Cached info Requested:");
      if(debug) console.log(fr.sysapi.CachedSysInfo[sysName]);
      if(fr.sysapi.CachedSysInfo[sysName] === null) {
        failCallback("error", "Not Found", null);
      }
      successCallback(fr.sysapi.CachedSysInfo[sysName]);
    } else {
      if(debug) console.log("fr.sysapi.GetSysInfo - Gathering System Info: " + sysName);
      fr.sysapi.ApiEqCall(SystemName, successCallback, failCallback);
    }
  },
  ApiEqCall: function(SystemName, successCallback, failCallback) {
    $.ajax({
        dataType: 'json',
        url: 'https://system.api.fuelrats.com/systems?filter[name:eq]=' + encodeURIComponent(SystemName),
        success: function (response) {
          // None found with exact naming, check through ilike.
          if(response.meta.results.returned < 1) {
            fr.sysapi.ApiIlikeCall(SystemName, successCallback, failCallback);
            return;
          }

          var sysName = response.data[0].attributes.name.toLowerCase();
          if(!fr.sysapi.CachedSysInfo.hasOwnProperty(sysName)){ //we're gonna check this to be safe.
            fr.sysapi.CachedSysInfo[sysName] = response.data[0];
          }
          successCallback(response.data[0]);
        },
      });
  },
  ApiIlikeCall: function(SystemName, successCallback, failCallback) {
    $.ajax({
        dataType: 'json',
        url: 'https://system.api.fuelrats.com/systems?filter[name:ilike]=' + encodeURIComponent(SystemName),
        success: function (response,status,jqxhr) {
          // None found with exact naming, check through ilike.
          if(response.meta.results.returned < 1) {
            failCallback();
            fr.sysapi.CachedSysInfo[SystemName.toLowerCase()] = null; // This essentially marks it as missing, and we should not look for it again.
            return;
          }

          var sysName = response.data[0].attributes.name.toLowerCase();
          if(!fr.sysapi.CachedSysInfo.hasOwnProperty(sysName)){ //we're gonna check this to be safe.
            fr.sysapi.CachedSysInfo[sysName] = response.data[0];
          }
          successCallback(response.data[0]);
        },
      });
  },
  GetBodyInfo: function(eddbID) {
    return;
  },
  DeleteCacheInfo: function(SystemName) {
    var sysName = SystemName.toLowerCase();
    if(fr.sysapi.CachedSysInfo.hasOwnProperty(sysName)){
      delete fr.sysapi.CachedSysInfo[sysName];
    }
  },
};