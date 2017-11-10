// App Imports
import EventEmitter from 'Classes/EventEmitter.js';
import {
  isValidProperty,
  makeID
} from 'Helpers';


// Constants
const
  ACTION_ARRAY_LENGTH = 2,
  RECONNECT_TIMEOUT = 5000,
  REQUEST_ID_LENGTH = 32,
  REQUEST_TIMEOUT = 60000,
  REQUEST_TIMEOUT_SEC = 60,
  MILLISECONDS_IN_SECOND = 1000;

/**
 * Websocket handler for the FuelRats API
 */
export default class RatSocket extends EventEmitter {

  /**
   * 
   * @param   {String} uri Address of the API to connect to.
   * @returns {Object}     Current instance of RatSocket
   */
  constructor(uri) {
    super(true, [
      'rescueCreated',
      'rescueUpdated',
      'rescueDeleted',
      'connection'
    ]);

    if (typeof uri !== 'string') {
      throw new TypeError('URI must be a string');
    }
    this.WSSUri = uri;
    this.socket = null;
    this.currentToken = null;
    this.reconnected = false;
    this.isAuthenticated = false;
    this.openRequests = {};
    this.listeners = {};


    this.isRatSocket = {};
  }

  /* ====== Socket Handling  ====== */

  
  /**
   * Creates, opens, and handles the initial setup of the WebSocket client.
   *
   * @param   {String}  token oAuth token to authenticate with.
   * @returns {Promise}       Resolved upon receiving the API's welcome message.
   */
  connect(token) {
    if (typeof token !== 'string') {
      throw TypeError('Invalid token string');
    }

    this.currentToken = token;
    return new Promise ((resolve,reject) => {
      let rejectTimeout = window.setTimeout(() => {
        window.console.error('RatSocket - Connection failed.');
        reject({'context': this, 'data': {
          'errors': [ {'code': 408, 'detail': 'Server produced no response.', 'status': 'Request Timeout', 'title': 'Request Timeout'} ],
          'meta': {}
        }});
      }, REQUEST_TIMEOUT);

      let
        onConnection = (context, data) => {
          window.clearTimeout(rejectTimeout);
          this.off('ratsocket:error', onSocketError);
          window.console.debug('RatSocket - Connection successful!');
          resolve({context, data});
        },
        onSocketError = (context, data) => {
          window.clearTimeout(rejectTimeout);
          this.off('connection', onConnection);
          reject({'context': context, 'data': {
            'errors': [ {'code': 500, 'detail': data, 'status': 'Error.', 'title': 'Error.'} ],
            'meta': {}
          }});
        };

      this.once('connection', onConnection)
        .once('ratsocket:error', onSocketError);

      this.socket = new WebSocket(`${this.WSSUri}?bearer=${token}`);
      this.socket.onopen    = (data) => {  this._onSocketOpen(data);   };
      this.socket.onclose   = (data) => {  this._onSocketClose(data);  };
      this.socket.onerror   = (data) => {  this._onSocketError(data);  };
      this.socket.onmessage = (data) => { this._onSocketMessage(data); };
      window.console.debug('RatSocket - Socket opened, awaiting connection confirmation...');
    });
  }

  /**
   * Reinitializes the WebSocket using the last known token.
   *
   * @returns {void}
   */
  _reconnect() {
    if (this.currentToken !== null) {
      window.console.debug('RatSocket - Attempting reconnect with last known bearer token....');
      this.connect(this.currentToken);
    } else {
      window.console.debug('RatSocket - A reconnect was attempted, but no token was found!');
    }
  }

  /**
   * Handler method for when the websocket opens.
   *
   * @param   {Object} data Data from WebSocket
   * @returns {void}
   */
  _onSocketOpen(data) {
    if (this.reconnected) {
      window.console.debug('RatSocket - Socket reconnected! ', data);
      this._emitEvent('ratsocket:reconnect', data);
      this.reconnected = false;
      return;
    }
    this._emitEvent('ratsocket:connect', data);
    window.console.debug('RatSocket - Socket Connected!', data);
  }

  /**
   * Handler method for when the WebSocket closes.
   *
   * @param   {Object} data Data from WebSocket.
   * @returns {void}
   */
  _onSocketClose(data) {
    if (data.wasClean === false) {
      window.console.debug('RatSocket - Disconnected from API! Attempting to reconnect... ', data);
      this._emitEvent('ratsocket:disconnect', data);
      this.initComp = false;
      setTimeout(() => {
        window.console.debug(this);
        this._reconnect();
      }, RECONNECT_TIMEOUT);
      this.reconnected = true;
    }
  }

  /**
   * Handler method for when the WebSocket errors.
   *
   * @param   {Object} data Data from WebSocket.
   * @returns {void}
   */
  _onSocketError(data) {
    window.console.error('RatSocket - Socket Error: ', data);
    this._emitEvent('ratsocket:error', data);
  }

  /**
   * Handler method for when the WebSocket receives a message.
   *
   * @param   {Object} data Data from the WebSocket.
   * @returns {void}
   */
  _onSocketMessage(data) {
    window.console.debug('RatSocket - Received message: ', data);
    
    let _data = JSON.parse(data.data);

    if (typeof _data.meta.reqID === 'string' && this.openRequests.hasOwnProperty(_data.meta.reqID)) { // If the message was the response to a request, then call the request's callback.
      window.console.debug(`RatSocket - Closing request '${_data.meta.reqID}' with data:`, _data);

      this.openRequests[_data.meta.reqID](_data);
      delete this.openRequests[_data.meta.reqID];

    } else if (_data.meta.event) { // If the message wasn't a response to a request, and the message contains an event, then emit the event.
      window.console.log(`RatSocket - Emitting event '${_data.meta.event}' with data:`, _data);

      this._emitEvent(_data.meta.event, _data);

    } else { // if neither of the above conditions are true, just spit it out as an error to the console. This shouldn't happen.
      window.console.error('RatSocket - Received an unknown message from the attached websocket: ', data);
    }
  }

  /* ====== Messaging ====== */

  /**
   * Sends the given JSON Object to the API.
   * 
   * @param   {Object}   data        Object to be sent.
   * @param   {String[]} data.action Method to call on the API in the format of ['Controller','Method'].
   * @param   {Object}   data.data   Serves as the message body to be sent to the given method.
   * @param   {Object}   data.meta   Metadata to be returned with the message response.
   * @returns {Object}               Current instance of RatSocket.
   */ 
  send(data) {
    if (this.socket.readyState !== 1) {
      if (this.socket.readyState > 1) {
        this._reconnect();
      }
      setTimeout(() => {
        this.send(data);
      });
      return this;
    }
    if (!isValidProperty(data, 'action', 'array') || data.action.length > ACTION_ARRAY_LENGTH || data.action.length < 1) {
      throw TypeError('Action array must be defined.');
    }
    if (!isValidProperty(data, 'data', 'object')) {
      data.data = {};
    }
    if (!isValidProperty(data, 'meta', 'object')) {
      data.meta = {};
    }

    window.console.debug('RatSocket - Sending message: ', data);
    this.socket.send(JSON.stringify(data));
    window.console.debug('RatSocket - Socket State post-send: ', this.socket);
    return this;
  }

  /**
   * Promise wrapper for RatSocket.send().
   * 
   * @param  {Object}  data         Object to be sent.
   * @param  {Object}  opts         Request options. All options are optional.
   * @param  {Number}  opts.timeout Time (in seconds) to wait before manually timing out the request.
   * @param  {String}  opts.reqID   Override request ID generated by RatSocket.
   * @return {Promise}              Promise to be resolved upon a response from the API.
   */
  request(data, opts) {
    if (!opts) {
      opts = {};
    }

    if (!isValidProperty(data, 'meta', 'object')) {
      data.meta = {};
    }
    
    let requestID = opts.reqID || makeID(REQUEST_ID_LENGTH);
    data.meta.reqID = requestID;

    return new Promise((resolve, reject) => {
      let timeout = window.setTimeout(() => {
        reject({
          'context': this, 
          'data': {
            'errors': [ { 'code': 408, 'detail': 'Server produced no response.', 'status': 'Request Timeout', 'title': 'Request Timeout' } ],
            'meta': data.meta
          }
        });
      }, (opts.timeout || REQUEST_TIMEOUT_SEC) * MILLISECONDS_IN_SECOND);

      this.openRequests[requestID] = (data) => {
        window.clearTimeout(timeout);
        if (data.errors) {
          reject({'context': this, 'data': data});
        }
        resolve({'context': this, 'data': data});
      };

      this.send(data);
    });
  }

  /**
   * Pseudo-alias for RatSocket.request to send a preformatted subscribe message to the API.
   * 
   * @param  {String}  streamName Name of the information stream to subscribe to.
   * @param  {Object}  opts       See RatSocket.request() opts.
   * @return {Promise}            Promise to resolved upon a successful response.
   */
  subscribe(streamName, opts) {
    return this.request({
      'action': ['stream','subscribe'],
      'id': streamName,
      'data': {},
      'meta': {}
    }, opts || {
      'timeout': 15
    });
  }
}