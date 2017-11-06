// import User from './User.js';
// 
// /* DEVBLOCK:START */
// import DebugHelper from './util/DebugHelper.js';
// 
// window.console.debug = window.console.log.bind(window.console);
// /* DEVBLOCK:END */
// 
// 
// let dwbApp = new User();
// 
// /* DEVBLOCK:START */
// window._dwbug = new DebugHelper(dwbApp);
// /* DEVBLOCK:END */
// 
// ^^ OLD CODE ABOVE ^^

// App Imports
import RescueBoard from './components/RescueBoard.jsx';
import _user from './classes/User.js';

// Module Imports
import React from 'react';
import ReactDOM from 'react-dom';

let 
  User = new _user(),
  Page = React.createElement(RescueBoard, {}, null);


// Begin user authentication process.
if (User.hasToken()) {
  User.authenticate().then(() =>{
    if (User.hasPermission()) {
      // Begin Client
      ReactDOM.render(Page, document.getElementById('reactApp'));
      window.console.log(`%cWelcome CMDR ${User.getUserDisplayName()}. We're now on v1.0! Fly safe!`,
        'color: lightgreen; font-weight: bold; font-size: 1.25em;');
      window._dwbug = {
        'UserCon': User
      };
    } else {
      // Show "user must be drilled" page
    }
  }).catch(() => {
    // Display login.
    User.login();
  });
} else {
  // Display login. (or in this case just head to the login page for ease.)
  User.login();
}