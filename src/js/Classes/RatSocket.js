// App Imports
import EventEmitter from 'Classes/EventEmitter.js';
import {
  default as SocketPayload,
  SubscribePayload
} from 'Classes/SocketPayload.js';


// Constants
const
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
      'connection',
      'ratsocket:connect',
      'ratsocket:disconnect',
      'ratsocket:error',
      'ratsocket:reconnect',
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
  async connect(token) {
    if (typeof token !== 'string') {
      throw TypeError('Invalid token string');
    }

    this.currentToken = token;
    return new Promise ((resolve,reject) => {
      let rejectTimeout = window.setTimeout(() => {
        window.console.error('RatSocket - Connection failed.');
        reject({
          'errors': [ {'code': 408, 'detail': 'Server produced no response.', 'status': 'Request Timeout', 'title': 'Request Timeout'} ],
          'meta': {}
        });
      }, REQUEST_TIMEOUT);

      let
        onConnection = (data) => {
          window.clearTimeout(rejectTimeout);
          this.off('ratsocket:error', onSocketError);

          if (this.reconnected) {
            window.console.debug('RatSocket - Reconnected and ready! ');
            this._emitEvent('ratsocket:reconnect', data);
            this.reconnected = false;
          } else {
            window.console.debug('RatSocket - Socket ready!');
            this._emitEvent('ratsocket:connect', data);
          }

          resolve(data);
        },

        onSocketError = (data) => {
          window.clearTimeout(rejectTimeout);
          this.off('connection', onConnection);

          reject({
            'errors': [ {'code': 500, 'detail': data, 'status': 'Error.', 'title': 'Error.'} ],
            'meta': {}
          });
        };

      this.once('connection', onConnection)
        .once('ratsocket:error', onSocketError);

      this.socket = new WebSocket(`${this.WSSUri}?bearer=${token}`);
      this.socket.onopen    = () => {  this._onSocketOpen();   };
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
  _tryReconnect() {
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
  _onSocketOpen() {
    window.console.debug('RatSocket - Socket Connected. Awaiting welcome...');
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
      setTimeout(() => {
        window.console.debug(this);
        this._tryReconnect();
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

    if (typeof _data.meta.plid === 'string' && this.openRequests.hasOwnProperty(_data.meta.plid)) { // If the message was the response to a request, then call the request's callback.
      window.console.debug(`RatSocket - Closing request '${_data.meta.plid}' with data:`, _data);

      this.openRequests[_data.meta.plid](_data);
      delete this.openRequests[_data.meta.plid];

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
   * @param   {Object} payload SocketPayload to be sent
   * @returns {Object}         Current instance of RatSocket.
   */ 
  send(payload) {
    if (!(payload instanceof SocketPayload)) {
      throw new TypeError('Payload must be SocketPayload');
    }

    if (this.socket.readyState !== 1) {
      if (this.socket.readyState > 1) {
        this._reconnect();
      }
      setTimeout(() => {
        this.send(payload);
      });
      return this;
    }

    window.console.debug('RatSocket - Sending message: ', payload);
    this.socket.send(payload.json());

    return this;
  }

  /**
   * Promise wrapper for RatSocket.send().
   * 
   * @param  {Object}  payload SocketPayload to be sent
   * @param  {Object}  opts    Options to define specific request behavior.
   * @return {Promise}         Promise to be resolved upon a response from the API.
   */
  request(payload, opts) {
    if (!(payload instanceof SocketPayload)) {
      throw new TypeError('Payload must be SocketPayload');
    }
    if (!opts) {
      opts = {};
    }
    return new Promise((resolve, reject) => {
      let payloadId = payload.getPayloadId();
      
      let timeout = window.setTimeout(() => {
        reject({
          'errors': [ { 'code': 408, 'detail': 'Server produced no response.', 'status': 'Request Timeout', 'title': 'Request Timeout' } ],
          'meta': payload.payload.meta
        });
      }, (opts.timeout || REQUEST_TIMEOUT_SEC) * MILLISECONDS_IN_SECOND);

      this.openRequests[payloadId] = response => {
        window.clearTimeout(timeout);
        if (response.errors) {
          reject(response);
        }
        resolve(response);
      };

      this.send(payload);
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
    if (!streamName) {
      throw new ReferenceError('streamName must be defined');
    }
    return this.request(new SubscribePayload(streamName), opts || {
      'timeout': 15
    });
  }
}