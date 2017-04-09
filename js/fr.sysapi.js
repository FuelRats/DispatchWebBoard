var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : false;
fr.sysapi = {
  CachedSysInfo: {},
  GetSysInfo: function(SystemName) {
    var sys = SystemName.toUpperCase();
    if(fr.sysapi.CachedSysInfo.hasOwnProperty(sys)) {
      return fr.sysapi.CachedSysInfo[sys];
    } else {
      $.ajax({
        dataType: 'json',
        url: 'http://erebor.localecho.net:6543/api?name=' + encodeURIComponent(sys),
        success: fr.sysapi.HandleAJAX,
      });
      return null;
    }
  },
  DeleteCacheInfo: function(SystemName) {
    var sys = SystemName.toUpperCase();
    if(fr.sysapi.CachedSysInfo.hasOwnProperty(sys)){
      delete fr.sysapi.CachedSysInfo[sys];
    }
  },
  HandleAJAX: function(response) {
    if(!fr.sysapi.CachedSysInfo.hasOwnProperty(response.name)){ //we're gonna check this to be safe.
      fr.sysapi.CachedSysInfo[response.name] = response;
    }
    fr.sysapi.OnResponse(response);
  },
  OnResponse: function(response) {}
};