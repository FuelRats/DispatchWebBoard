var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : false;
fr.sysapi = {
  GetSysInfo: function(SystemName, successCallback, failCallback) {
    var sysName = SystemName.toUpperCase();
    if(sessionStorage.getItem('system.' + sysName)) {
      var sysData = JSON.parse(sessionStorage.getItem('system.' + sysName));
      if(debug) console.log("fr.sysapi.GetSysInfo - Cached System Info Requested: ", sysData);
      if(sysData === null) {
        failCallback("error", "Not Found", null);
        return;
      }
      successCallback(sysData);
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
          sessionStorage.setItem('system.' + SystemName.toUpperCase(), null); // This essentially marks it as missing, and we should not look for it again.
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
          //cleanup body info
          for (var body in sysData.bodies) {
            delete sysData.bodies[body].relationships;
            delete sysData.bodies[body].type;
            delete sysData.bodies[body].links;
          }
        }
        //clean up other json properties.
        delete sysData.relationships;
        delete sysData.type;
        delete sysData.links;

        if(!sessionStorage.getItem('system.' + sysName)){ //we're gonna check this to be safe.
          sessionStorage.setItem('system.' + sysName, JSON.stringify(sysData));
        }

        if(debug) console.log("fr.sysapi.ApiEqCall - System information found: ", sysData);
        successCallback(sysData);
      },
    });
  },
  DeleteCachedInfo: function(SystemName) {
    var sysName = SystemName.toUpperCase();
    if(sessionStorage.getItem('system.' + sysName)){
      sessionStorage.removeItem('system.' + sysName);
    }
  },
};