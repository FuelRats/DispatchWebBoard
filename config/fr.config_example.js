var fr = fr !== undefined ? fr : {};
var debug = false;
// IMPORTANT: make sure to rename this file to "fr.config.js"
fr.config = {
  //Set this to a proper WS Stream URL on setup.
  WebSocketStreamURL: "wss://some.wss.domain.tld:443",
  // Any preferred prefix. this is to avoid confusion with other copies on the same domain.
  CookieBase: 'cookie_prefix_'
};