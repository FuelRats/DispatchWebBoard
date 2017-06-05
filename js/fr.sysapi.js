fr.sysapi = {
  
  GetSysInfo: function (SystemName) {
    let sysName = SystemName.toUpperCase();
    if (sessionStorage.getItem('system.' + sysName)) {

      let sysData = JSON.parse(sessionStorage.getItem('system.' + sysName));
      window.console.debug("fr.sysapi.GetSysInfo - Cached System Info Requested: ", sysData);

      if (sysData === null) {
        return Promise.reject("System not found.");
      }
      return Promise.resolve(sysData);

    } else {
      window.console.debug("fr.sysapi.GetSysInfo - Retrieving System Info: " + SystemName);
      return fr.sysapi.ApiLookupCall(sysName);
    }
  },

  ApiLookupCall: function (SystemName) {
    return new Promise((resolve, reject) => {
      $.ajax({
        dataType: 'json',
        url: 'https://system.api.fuelrats.com/systems?' + 'filter[name:eq]=' + encodeURIComponent(SystemName) +
          '&include=bodies',
        success: function(response) {
          if (response.meta.results.returned < 1) {

            window.console.debug("fr.sysapi.ApiEqCall - No system info found for: \"" + SystemName +
              "\". Sysinfo search failed. Calling failCallback.");

            sessionStorage.setItem('system.' + SystemName.toUpperCase(), null); // This essentially marks it as missing, and we should not look for it again.
            reject("System not found.");
            return;
          }
          let sysData = response.data[0];
          let sysName = sysData.attributes.name;

          //jsonAPI does not yet support included data filtering, so this cannot be offloaded to the server.
          if (response.included && response.included[0]) {
            sysData.bodies = response.included.filter(function(body) {
              return body.attributes.group_name === "Star";
            });
            //cleanup body info
            for (let body in sysData.bodies) {
              if (sysData.bodies.hasOwnProperty(body)) {
                delete sysData.bodies[body].relationships;
                delete sysData.bodies[body].type;
                delete sysData.bodies[body].links;
              }
            }
          }
          //clean up other json properties.
          delete sysData.relationships;
          delete sysData.type;
          delete sysData.links;

          if (!sessionStorage.getItem('system.' + sysName)) { //we're gonna check this to be safe.
            sessionStorage.setItem('system.' + sysName, JSON.stringify(sysData));
          }

          window.console.debug("fr.sysapi.ApiEqCall - System information found: ", sysData);

          resolve(sysData);
        },
      });
    });
  },
  DeleteCachedInfo: function(SystemName) {
    let sysName = SystemName.toUpperCase();
    if (sessionStorage.getItem('system.' + sysName)) {
      sessionStorage.removeItem('system.' + sysName);
    }
  },
};