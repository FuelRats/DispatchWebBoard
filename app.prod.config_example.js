// IMPORTANT: make a copy of this file, and name it "app.prod.config.js"
// You can create any environment config you like with the pattern "app.<environment>.config.js", Then use it by executing "gulp --env=<environment>". The default is "dev".
// Repo .gitignore ignores any "app.*.config.js", so updating through git pull is possible.
module.exports = {
  
  gulp: {
    // Toggles production optimizations and minification.
    production: true
  },

  appconf: {
    // Set this to a proper WS Stream URL on setup.
    WssURI: "wss://some.wss.domain.tld:443",
    // FR API location (should be "https://domain.tld/")
    ApiURI: "https://api.domain.tld/",
    // FuelRats Website location (required for APIv2 oAuth)
    WebURI: "https://www.website.tld/",
    // FuelRats API ClientID
    ClientID: "00000000-0000-4000-a000-000000000000",
    // Title of the page
    AppTitle: "Page Title",
    // This app"s publicly accessible address. (Required for oAuth)
    AppURI: "https://dispatch.domain.tld/",
    // Permission scope to request from the API.
    AppScope: "user.read.me rescues.read",
    // Namespacing for domain-scoped storage. This is to prevent conflicts with duplicate instances on the same domain.
    AppNamespace: "SomeNamespace",
  },

  rsync: {

    // ==================================================================== //
    //  IMPORTANT: IF USING RSYNC, CONFIGURE OPENSSH FOR THE EASIET SETUP  //
    // ================================================================== //
    // 
    //     // ================= //
    //    // RECOMMENDED SETUP //
    // = // ================= // ====================================================================================================== //
    //  Use the ~/.ssh/config file to define your ssh login settings, and then define your hostname and destination path in this file. //
    //                                                                                                                                //
    //  Example .ssh/config entry:                                                                                                   //
    //  Host dwbrsync                                                                                                               //
    //       HostName remoteserver                                                                                                 //
    //       User remoteuser                                                                                                      //
    //       IdentityFile ~/.ssh/id_rsa                                                                                          //
    //                                                                                                                          //
    // ======================================================================================================================= //
    // 
    // Options documentation: https://www.npmjs.com/package/gulp-rsync#options
    
    destination: "/path/to/destination/path",
    hostname: "dwbrsync"
  }
};