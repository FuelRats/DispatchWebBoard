// App Imports
import IndexPage from 'Pages/index.jsx';
import User from 'Classes/User.js';

// Module Imports
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Handles user authentication and app injection.
 *
 * @returns {[type]} [description]
 */
function init() {
  let user = new User();

  // Begin user authentication process.
  if (user.hasToken()) {
    user.authenticate().then(() =>{
      if (user.hasPermission()) {
        // Begin Client
        
        let page = (<IndexPage user={user} />);
        ReactDOM.render(page, document.getElementById('reactApp'));
  
  
        window.console.log(`%cWelcome CMDR ${user.getUserDisplayName()}. We're now on v1.0! Fly safe!`,
          'color: lightgreen; font-weight: bold; font-size: 1.25em;');
  
        window._dwbug = {
          'UserCon': user,
          'page': page
        };
      } else {
        // Show "user must be drilled" page
      }
    }).catch(() => {
      // Display login.
    });
  } else {
    // Display login. (or in this case just head to the login page for ease.)
  }
}
init();