/* globals makeID */
/**
 * Handles websocket connection and communication
 */
fr.ws = !fr.config || !fr.user ? null : {

  socket: null,
  clientId: '',
  reconnected: false,
  initComp: false,
  openRequests: {},

  /**
   * Initiates websocket connection.
   */
  initConnection: function() {
    if (this.initComp) {
      window.console.debug("fr.ws.initConnection - init completed already!");
      return;
    }

    this.socket = new WebSocket(fr.config.WssURI);

    if (!fr.user.hasPermission()) {
      return;
    }

    window.console.debug("fr.ws.initConnection - WS Connection Starting. DEBUG MODE ACTIVE.");

    this.socket.onmessage = (data) => {
      fr.ws.onMessage(data);
    };
    this.socket.onerror = (error) => {
      fr.ws.onError(error);
    };
    this.socket.onclose = (dc) => {
      fr.ws.onClose(dc);
    };
    this.socket.onopen = () => {
      fr.ws.onOpen();
    };

    this.initComp = true;
  },

  /**
   * handles incoming websocket message events
   * @param  {Object} data websocket message data
   */
  onMessage: function(data) {
    let _data = JSON.parse(data.data);
    if (_data.meta.action === 'welcome') {
      this.clientId = _data.meta.id;
      this.authenticateWSS();
    }

    // Handle request responses
    if(typeof _data.meta.dwbRequestUID === "string" && this.openRequests.hasOwnProperty(_data.meta.dwbRequestUID)) {
      this.openRequests[_data.meta.dwbRequestUID](_data);
      delete this.openRequests[_data.meta.dwbRequestUID];
      return;
    }
    // If the message wasn't a response, send it to the normal TPA handler.
    this.onTPA(_data);
  },
  
  /**
   * Handles websocket error events
   * @param  {Object} error Websocket error metadata
   */
  onError: function(error) {
    window.console.log("=Websocket Module Error=");
    window.console.log(error);
  },

  /**
   * Handles websocket (re)connection events
   */
  onOpen: function() {
    if (!fr.user.hasPermission()) {
      return;
    }
    this.subscribe('0xDEADBEEF');

    if (this.reconnected) {
      window.console.debug("fr.ws.onOpen - WS Reconnected!");
      this.onReconnect();
      this.reconnected = false;
    }
  },

  /**
   * Handles websocket disconnection events
   * @param  {Object} dc Websocket disconnection metadata
   */
  onClose: function(dc) {
    if (dc.wasClean === false) {
      window.console.debug("fr.ws.onClose - Disconnected from WSocket. Reconnecting...");
      this.initComp = false;
      setTimeout(this.initConnection, 10000);
      this.reconnected = true;
    }
  },

  /**
   * Open assignable function to be called when a TPA is recieved over websocket.
   */
  onTPA: function() {},
  /**
   * Open assignable function to be called when the wss reconnects.
   */
  onReconnect: function() {},

  /**
   * Sends a given JSON Object to the API.
   * @param  {Object} data JSON data to be sent over the socket.
   */
  sendJson: function(data) {
    if (!fr.user.isAuthenticated()) {
      window.console.debug("fr.ws.send - Sending failed, Not Authenticated");
      return;
    }
    if (this.socket.readyState !== 1) {
      if (this.socket.readyState > 1) {
        this.initComp = false;
        this.initConnection();
      }
      setTimeout(() => {
        this.sendJson(data);
      }, 1000);
      return;
    }
    this.socket.send(JSON.stringify(data));
  },

  sendJsonRequest: function(data) {
    if(!data.hasOwnProperty('meta') && typeof data.meta !== 'object') {
      data.meta = {};
    }
    let requestID = makeID(48); 
    data.meta.dwbRequestUID = requestID;

    return new Promise((resolve, reject) => {
      this.sendJson(data);
      this.openRequests[requestID] = (data) => { 
        resolve(data); 
      };
      setTimeout(() => {
        reject({
          'errors': [
            {
              'code':408, 
              'detail':'Server produced no response.', 
              'status':'Request Timeout', 
              'title':'Request Timeout'
            }
          ],
          'meta': data.meta});
      }, 60000);
    });
  },

  /**
   * Sends a preformatted TPA message to the API.
   * @param  {String} action Action (namespace:method) to invoke with the given data and meta.
   * @param  {Object} data   Data object to send with the message.
   * @param  {Object} meta   Metadata to send with the message.
   */
  send: function(action, data, meta) {
    this.sendJson({
      "action": action,
      "applicationId": this.clientId,
      "data": data || {},
      "meta": meta || {}
    });
  },
  sendRequest: function(action,data,meta) {
    return this.sendJsonRequest({
      "action": action,
      "applicationId": this.clientId,
      "data": data || {},
      "meta": meta || {}
    });
  },

  /**
   * Sends bearer token to the server to authenticate the client.
   */
  authenticateWSS: function() {
    if (!fr.user.hasPermission()) {
      window.console.debug("fr.ws.authenticateWSS - Subscribing failed, Not API Authenticated");
      return;
    }
    this.sendJson({
      "action": "authorization",
      "applicationId": this.clientId,
      "bearer": fr.user.AuthHeader,
      "data": {},
      "meta": {}
    });
  },

  /**
   * Subscribes to a given TPA stream applicationID
   * @param  {string} stream Stream name (IE: 0xDEADBEEF)
   */
  subscribe: function(stream) {
    if (!fr.user.hasPermission()) {
      window.console.debug("fr.ws.subscribe - Subscribing failed, Not Authenticated");
      return;
    }
    window.console.debug("fr.ws.subscribe - Subscirbing to stream!");
    this.sendJson({
      'action': 'stream:subscribe',
      'applicationId': stream,
      "data": {},
      "meta": {}
    });
  },

  /**
   * requests information about a given nickname
   * @param  {String} nickname nickname of the user to find
   * @param  {Object} meta     Optional meta data to send
   */
  searchNickName: function(nickname, meta) {
    if (!fr.user.hasPermission()) {
      window.console.debug("fr.ws.searchNickName - Search failed, Not Authenticated");
      return;
    }
    window.console.debug("fr.ws.searchNickName - Searching for nick: " + nickname);
    this.sendJson({
      "action": 'nicknames:search',
      "applicationId": this.clientId,
      "nickname": nickname,
      "data": {},
      "meta": meta || {}
    });
  }
};