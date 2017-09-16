/* globals Util */
;(function (exports) {
  'use strict';

  /**
   * Websocket handler for the FuelRats API
   * @param  {String} uri - Address of the API to connect to.
   * @return {Object}     - Current instance of RatSocket
   */
  function RatSocket(uri) {
    if(typeof uri !== "string") {
      throw new TypeError("URI must be a string");
    }

    this.WSSUri = uri;
    this.socket = null;
    this.currentToken = null;
    this.reconnected = false;
    this.isAuthenticated = false;
    this.openRequests = {};
    this.listeners = {};
  }
  let rsp = RatSocket.prototype;

  /**
   * Allows for definition of function aliases.
   * "I sure as hell didn't write this, but nor did the 1000s of others who have it unattributed in their code on github. Who the heck wrote this?" - Clapton
   * 
   * @param  {String}   funcName - Target function name
   * @return {Function}          - The aliased function
   */
  function alias (funcName) {
    return function aliasWrapper() {
      return this[funcName].apply(this, arguments);
    };
  }

  /**
   * Generates a random base64 ID of a given char length
   * 
   * @param  {Number} length - Desired length of the ID
   * @return {String}        - Generated base64 ID
   */
  function makeID (length = 48) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let text = [];
    let i = 0;
    for (i=0; i < length; i+=1) {
      text.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    return text.join('');
  }

  /*====== Socket Handling  ======*/
  
  /**
   * Creates, opens, and handles the initial setup of the WebSocket client.
   * 
   * @return {Promise} - Promise to be resolved when the API's welcome message is received.
   */
  rsp.createSocket = function createSocket(token) {
    if(typeof token !== "string" ) {
      throw TypeError("Invalid token string");
    }

    this.currentToken = token;
    return new Promise ((resolve,reject) => {
      let rejectTimeout = window.setTimeout(() => {
        window.console.error(`RatSocket - Connection failed.`);
        reject({"context": this, "data": {
          'errors': [ {'code': 408, 'detail': 'Server produced no response.', 'status': 'Request Timeout', 'title': 'Request Timeout'} ],
          'meta': {}
        }});
      }, 60000);

      this.once("ratsocket:connect", (context, data) => {
        window.clearTimeout(rejectTimeout);
        window.console.debug(`RatSocket - Connection successful!`);
        resolve({context, data});
      }).once('ratsocket:error', (context, data) => {
        window.clearTimeout(rejectTimeout);
        reject({"context": context, "data": {
          'errors': [ {'code': 500, 'detail': data, 'status': 'Error.', 'title': 'Error.'} ],
          'meta': {}
        }});
      });

      this.socket = new WebSocket(`${this.WSSUri}?bearer=${token}`);
      this.socket.onopen    = (data) => {  this._onSocketOpen(data);   };
      this.socket.onclose   = (data) => {  this._onSocketClose(data);  };
      this.socket.onerror   = (data) => {  this._onSocketError(data);  };
      this.socket.onmessage = (data) => { this._onSocketMessage(data); };
      window.console.debug("RatSocket - Socket opened, awaiting connection confirmation...");
    });
  };
  rsp.connect = alias("createSocket");

  rsp._reconnect = function reconnect() {
    if(this.currentToken !== null) {
      window.console.debug("RatSocket - Attempting reconnect with last known bearer token.... ", this);
      this.createSocket(this.currentToken);
    } else {
      window.console.debug("RatSocket - A reconnect was attempted, but no token was found!");
    }
  };

  rsp._onSocketOpen = function onSocketOpen(data) {
    if (this.reconnected) {
      window.console.debug("RatSocket - Socket reconnected! ", data);
      this._emitEvent("ratsocket:reconnect", data);
      this.reconnected = false;
      return;
    }
    this._emitEvent("ratsocket:connect", data);
    window.console.debug("RatSocket - Socket Connected!", data);
  };
  rsp._onSocketClose = function onSocketClose(dc) {
    if (dc.wasClean === false) {
      window.console.debug("RatSocket - Disconnected from API! Attempting to reconnect... ", dc);
      this._emitEvent("ratsocket:disconnect", dc);
      this.initComp = false;
      setTimeout(() => {
        window.console.debug(this);
        this._reconnect();
      }, 5000);
      this.reconnected = true;
    }
  };
  rsp._onSocketError = function onSocketError(data) {
    window.console.error("RatSocket - Socket Error: ", data);
    this._emitEvent("ratsocket:error", data);
  };

  rsp._onSocketMessage = function onSocketMessage(data) {
    window.console.debug("RatSocket - Received message: ", data);
    
    let _data = JSON.parse(data.data);

    // Handle request responses
    if(typeof _data.meta.reqID === "string" && this.openRequests.hasOwnProperty(_data.meta.reqID)) { // If the message was the response to a request, then call the request's callback.
      window.console.debug(`RatSocket - Detected request response. closing request: ${_data.meta.reqID}`);
      this.openRequests[_data.meta.reqID](_data);
      delete this.openRequests[_data.meta.reqID];
      return;
    } else if (_data.meta.event) { // If the message wasn't a response to a request, and the message contains an event, then emit the event.
      this._emitEvent(_data.meta.event, _data);
    } else { //if neither of the above conditions are true, just spit it out as an error to the console. This shouldn't happen.
      window.console.error("RatSocket - Received an unknown message from the attached websocket: ", data);
    }
  };

  /*====== Messaging ======*/

  /**
   * Sends the given JSON Object to the API.
   * 
   * @param  {Object} data        - Object to be sent.
   * @param  {Array} data.action - Method to call on the API in the format of ["Controller","Method"]
   * @param  {Object} data.data   - Serves as the message body to be sent to the given method
   * @param  {Object} data.meta   - Metadata to be returned with the message response.
   * @return {Object}             - Current instance of RatSocket
   */ 
  rsp.send = function send(data) {
    if (this.socket.readyState !== 1) {
      if(this.socket.readyState > 1) {
        this._reconnect();
      }
      setTimeout(() => {
        this.send(data);
      });
      return this;
    }
    
    if (!Util.isValidProperty(data, "action", "array") || data.action.length > 2 || data.action.length < 1) {
      throw TypeError("Action array must be defined.");
    }
    if (!Util.isValidProperty(data, "data", "object")) {
      data.data = {};
    }
    if (!Util.isValidProperty(data, "meta", "object")) {
      data.meta = {};
    }

    window.console.debug('RatSocket - Sending message: ', data);
    this.socket.send(JSON.stringify(data));
    return this;
  };

  /**
   * Promise "wrapper" for RatSocket.send.
   * 
   * @param  {Object}  data - Object to be sent.
   * @return {Promise}      - Promise to be resolved upon a response from the API
   */
  rsp.sendRequest = function sendRequest(data) {

    if(!Util.isValidProperty(data, "meta", "object")) {
      data.meta = {};
    }
    
    let requestID = makeID(48);
    data.meta.reqID = requestID;

    return new Promise((resolve, reject) => {
      this.send(data);
      let timeout = window.setTimeout(() => {
        reject({
          "context": this, 
          "data": {
            'errors': [ { 'code': 408, 'detail': 'Server produced no response.', 'status': 'Request Timeout', 'title': 'Request Timeout' } ],
            'meta': data.meta
          }
        });
      }, 60000);
      this.openRequests[requestID] = (data) => {
        window.clearTimeout(timeout);
        if (data.errors) {
          reject({"context": this, "data": data});
        }
        resolve({"context": this, "data": data});
      };
    });
  };
  rsp.request = alias("sendRequest");

  /**
   * Pseudo-alias for RatSocket.request to send a preformatted subscribe message to the API.
   * 
   * @param  {String}  streamName - Name of the information stream to subscribe to
   * @return {Promise}            - Promise to resolved upon a successful response.
   */
  rsp.subscribe = function subscribe(streamName) {
    return this.request({
      "action": ['stream','subscribe'],
      "id": streamName,
      "data": {},
      "meta": {}
    });
  };

  /*====== Event Handling ======*/
  
  /**
   * Adds listener for the given event name.
   * 
   * @param  {String}   evt  - Name of the event to listen to.
   * @param  {Function} func - Function to be called on event.
   * @return {Object}        - Current instance of RatSocket.
   */
  rsp.addListener = function addListener(evt, func) {
    if(typeof evt !== "string" || typeof func === null) {
      throw new TypeError('Invalid argument(s)');
    }

    if(!this.listeners.hasOwnProperty(evt)) {
      this.listeners[evt] = [];
    }

    this.listeners[evt].push(typeof func === 'object' ? func : { 
      "func": func, 
      "once": false 
    });

    return this;
  };
  rsp.on = alias("addListener");

  rsp.addListenerOnce = function addListenerOnce(evt, func) {
    return this.addListener(evt, {
      'func': func,
      'once': true
    });
  };
  rsp.once = alias("addListenerOnce");

  /**
   * Removes a listener from the given event name.
   * 
   * @param  {String}   evt  - Name of the event.
   * @param  {Function} func - Function to remove.
   * @return {Object}        - Current instance of RatSocket.
   */
  rsp.removeListener = function removeListener(evt, func) {
    if(typeof evt !== "string" || typeof func !== "function") {
      throw new TypeError('Invalid argument(s)');
    }

    if (!this.listeners.hasOwnProperty(evt)) {
      return;
    }

    let listenerIndex = this.listeners[evt].findIndex(x => x.func === func);
    if (listenerIndex < 0) { return; }

    this.listeners[evt].splice(listenerIndex, 1);

    return this;
  };
  rsp.off = alias("removeListener");

  /**
   * Executes all listeners of a given event name.
   * 
   * @param  {String}  evt    - Name of the event to emit.
   * @param  {(*|*[])} [args] - Argument(s) to send with the event.
   * @return {Object}         - Current instance of RatSocket.
   */
  rsp._emitEvent = function emitEvent(evt, args) {
    if (typeof evt !== "string") {
      throw new TypeError("Event must be string");
    }

    if(!this.listeners.hasOwnProperty(evt)) {
      window.console.debug(`RatSocket - Event: "${evt}" has no listener. Returning...`);
      return;
    }

    let evtargs = [this];

    if (Array.isArray(args)) {
      evtargs.concat(args);
    } else {
      evtargs.push(args);
    }

    let evtListeners = this.listeners[evt];

    window.console.debug(`RatSocket - Executing listener functions for: ${evt} with args:`, args);
    for(let i = 0; i < evtListeners.length; i++) {
      let listener = evtListeners[i];

      // Execute function and get response from it.
      let res = listener.func.apply(this, evtargs);

      // If the listener was set to run once, or returned as "true", remove it from the listener list.
      if(listener.once === true || res === true) {
        this.removeListener(evt, listener.func);
      }

    }
    return this;
  };

  exports.RatSocket = RatSocket;
}(this || {}));