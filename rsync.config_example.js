// ==================================================================== //
//  IMPORTANT: make a copy of this file, and name it "rsync.config.js" //
// ================================================================== //
// 
// Repo .gitignore ignores "rsync.config.js", so updating through git pull is possible.
// 
// Use this file to define rsync options for the gulp deployment task. You can see the options available using the link below, but 
// 
//    // ================= //
//   // RECOMMENDED SETUP //
// =//================== // ======================================================================================================= //
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
// 
module.exports = {
  destination: '/path/to/destination/path',
  hostname: 'dwbrsync'
};