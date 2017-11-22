// App Imports
import User from 'Classes/User.js';
import IndexPage from 'Pages/index.jsx';

// Module Imports
import Clipboard from 'clipboard';
import React from 'react';
import ReactDOM from 'react-dom';



export let CurrentUser = null;

/**
 * Handles user authentication and app injection.
 *
 * @returns {[type]} [description]
 */
function init() {
  CurrentUser = new User();

  // Handle theming and changes to the theme setting.
  CurrentUser.store.observe('boardTheme', (ctx, newValue) => {
    document.getElementsByTagName('body')[0].className = `theme-${newValue}`;
  });
  document.getElementsByTagName('body')[0].className = `theme-${CurrentUser.store.boardTheme}`;

  // Render page.
  let page = (<IndexPage />);
  ReactDOM.render(page, document.getElementById('reactApp'));

  // Initialize clipboard.
  new Clipboard('.clipboard');
  
  // Expose user and page for console access during debug
  window._dwbug = {
    'user': CurrentUser,
    'page': page
  };
}

init();