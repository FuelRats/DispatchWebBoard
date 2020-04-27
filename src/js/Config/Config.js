/* global ENV:false */

let envVar = ENV;

let getEnvironmentVariable = (namespace, prop) => envVar && envVar[namespace] && envVar[namespace][prop] !== undefined ? envVar[namespace][prop] : null;

export default {
  WssURI:       getEnvironmentVariable('FR', 'WSSURI')       || 'wss://dev.api.fuelrats.com:443',
  ApiURI:       getEnvironmentVariable('FR', 'APIURI')       || 'https://dev.api.fuelrats.com/',
  WebURI:       getEnvironmentVariable('FR', 'WEBURI')       || 'https://beta.fuelrats.com/',
  SAPIURI:      getEnvironmentVariable('FR', 'SAPIURI')      || 'https://sapi.fuelrats.dev/',
  ClientID:     getEnvironmentVariable('APP','CLIENTID')     || null,
  AppTitle:     getEnvironmentVariable('APP','APPTITLE')     || 'Dispatch Web Board',
  AppURI:       getEnvironmentVariable('APP','APPURI')       || null,
  AppScope:     getEnvironmentVariable('APP','APPSCOPE')     || 'user.read.me rescue.read',
  AppNamespace: getEnvironmentVariable('APP','APPNAMESPACE') || 'dwb',
};
