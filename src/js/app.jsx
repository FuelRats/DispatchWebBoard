// App Imports
import IndexPage from 'Pages/index.jsx';

// Module Imports
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Handles user authentication and app injection.
 *
 * @returns {[type]} [description]
 */
function init() {       
  let page = (<IndexPage />);
  ReactDOM.render(page, document.getElementById('reactApp'));
  
  window._dwbug = page;
}
init();