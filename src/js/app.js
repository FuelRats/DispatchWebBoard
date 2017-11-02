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


import React from 'react';
import ReactDOM from 'react-dom';
import RatList from './components/RatList.jsx';


ReactDOM.render(
  React.createElement(RatList, {
    rats: [
      { 
        'id': '4807dccb-da0c-4244-8483-dab4087e562d',
        'attributes': { 
          'name': 'Nepxious', 
          'platform': 'pc', 
          'identified': true 
        } 
      },
      { 
        'id': '3bd62758-bf7d-428b-8711-4f3798e4d2ee',
        'attributes': { 
          'name': 'Nepton', 
          'platform': 'pc', 
          'identified': true 
        } 
      },
      { 
        'id': '3e147fbd-3ae2-47b0-936f-d2fff849763b',
        'attributes': { 
          'name': 'NoNepKing', 
          'platform': 'pc', 
          'identified': true 
        } 
      },
      { 
        'id': 'add060b6-9333-45c9-b1f8-8153b2a5587c',
        'attributes': { 
          'name': 'Nepnaran', 
          'platform': 'pc', 
          'identified': true 
        } 
      },
      { 
        'id': 'e7ed6c61-8ec1-442e-94a4-70ab144ce25e',
        'attributes': { 
          'name': 'Nep_Sheets', 
          'platform': 'pc', 
          'identified': true 
        } 
      },
    ]
  }, null),
  document.getElementById('reactApp')
);