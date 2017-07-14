var fr = fr !== undefined ? fr : {};
var debug = false;
// IMPORTANT: make a copy of this file, and name it "fr.config.js"
// Repo .gitignore ignores "fr.config.js", so updating through git pull is possible.
fr.config = {
  // Title of the page
  WebPageTitle: "Page Title",
  // Set this to a proper WS Stream URL on setup.
  WssURI: "wss://some.wss.domain.tld:443",
  // FR API location (should be "https://domain.tld/")
  ApiURI: "https://api.domain.tld/",
  // FR API ClientID
  ClientID: "00000000-0000-4000-a000-000000000000",
  // Any preferred prefix. this is to avoid confusion with other copies on the same domain.
  CookieBase: 'cookie_prefix_'
};