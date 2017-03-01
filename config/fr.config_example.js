var fr = fr !== undefined ? fr : {};
var debug = false;
// IMPORTANT: make a copy of this file, and name it "fr.config.js"
// Repo .gitignore ignores "fr.config.js", so updating through git pull is possible.
fr.config = {
	WebPageTitle: "Page Title",
  // Board Version
  VersionInfo: "v0.0",
  // Set this to a proper WS Stream URL on setup.
  WebSocketStreamURL: "wss://some.wss.domain.tld:443",
  // Any preferred prefix. this is to avoid confusion with other copies on the same domain.
  CookieBase: 'cookie_prefix_'
};