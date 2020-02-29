/* global ENV:false */

const environment = ENV

const getEnvironmentVariable = (namespace, prop) => {
  return (environment && environment[namespace] && environment[namespace][prop] ? environment[namespace][prop] : null)
}

const config = {
  WssURI: getEnvironmentVariable('FR', 'WSSURI') || 'wss://dev.api.fuelrats.com:443',
  ApiURI: getEnvironmentVariable('FR', 'APIURI') || 'https://dev.api.fuelrats.com/',
  WebURI: getEnvironmentVariable('FR', 'WEBURI') || 'https://beta.fuelrats.com/',
  SystemsURI: getEnvironmentVariable('FR', 'SYSTEMURI') || 'https://system.api.fuelrats.com/',
  ClientID: getEnvironmentVariable('APP', 'CLIENTID') || null,
  AppTitle: getEnvironmentVariable('APP', 'APPTITLE') || 'Dispatch Web Board',
  AppURI: getEnvironmentVariable('APP', 'APPURI') || null,
  AppScope: getEnvironmentVariable('APP', 'APPSCOPE') || 'user.read.me rescue.read',
  AppNamespace: getEnvironmentVariable('APP', 'APPNAMESPACE') || 'dwb',
}



export default config
