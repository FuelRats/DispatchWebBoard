import User from './User.js';

/* DEVBLOCK:START */
import DebugHelper from './util/DebugHelper.js';

window.console.debug = window.console.log.bind(window.console);
/* DEVBLOCK:END */


let dwbApp = new User();

/* DEVBLOCK:START */
window._dwbug = new DebugHelper(dwbApp);
/* DEVBLOCK:END */