// IMPORTANT: make a copy of this file, and name it 'app.prod.config.js'
// You can create any environment config you like with the pattern 'app.<environment>.config.js', Then use it by executing 'gulp --env=<environment>'. The default is 'dev'.
// Repo .gitignore ignores any 'app.*.config.js', so updating through git pull is possible.
module.exports = {
  
  gulp: {
    // Toggles production optimizations and minification. Set this to false if you wish to create a debugging build.
    production: true
  },

  appconf: {

    // API URLS
    
    // Set this to the WebSocket URL of the FuelRats API instance you're connecting to.
    WssURI: 'wss://api.fuelrats.com:443',
    // Set this to the FuelRats API instance you're connecting to.
    ApiURI: 'https://api.fuelrats.com/',
    // FuelRats Website instance. www.fuelrats.com for production, beta.fuelrats.com for development
    // This is required for APIv2's implicit grant flow. The authorization process is handled by the FuelRats' main website.
    WebURI: 'https://www.fuelrats.com/',

    // FuelRats API ClientID
    ClientID: '00000000-0000-4000-a000-000000000000',
    // Title of the page
    AppTitle: 'Page Title',
    // This app's publicly accessible address. This is the same address as the oAuth Redirect URL.
    AppURI: 'https://dispatch.domain.tld/',
    // Permission scope to request from the API. It is generally recommended you leave this be, but can be edited if creating a feature that requires a new scope.
    AppScope: 'user.read.me rescues.read',
    // Namespacing for domain-scoped storage. This is to prevent conflicts with multiple instances on the same sub-domain.
    AppNamespace: 'SomeNamespace',
  },

  rsync: {

    // ==================================================================================================== //
    //  NOTE: THIS STEP IS OPTIONAL. ONLY CONFIGURE IF YOU'RE USING --deploy TO ASSIST IN YOUR DEVELOPMENT //
    // ================================================================================================== //
    // 
    // An rsync task runner has been baked into the gulpfile to assist in easy development deployment.
    // While it can be used in an production environment, it's main purpose is to allow developers to work remotely from the webserver hosting their dev instance. 
    // 
    //     // ================= //
    //    // RECOMMENDED SETUP //
    // = // ================= // ===================================== //
    //  Use the ~/.ssh/config file to define your ssh login settings. //
    //  Then define your hostname and destination path in this file. //
    //                                                              //
    //  Example .ssh/config entry:                                 //
    //  Host dwbrsync                                             //
    //       HostName remoteserver                               //
    //       User remoteuser                                    //
    //       IdentityFile ~/.ssh/id_rsa                        //
    //                                                        //
    // ===================================================== //
    // 
    // Options documentation: https://www.npmjs.com/package/gulp-rsync#options
    
    hostname: 'dwbrsync',
    destination: '/path/to/destination/path'
  }
}