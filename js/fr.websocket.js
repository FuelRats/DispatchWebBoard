/**
 * Handles websocket connection and communication
 */
fr.ws = !fr.config || !fr.user ? null : {
  socket: null,
  initComp: false,
  initConnection: function() {
    if (this.initComp) {
      if (debug) {
        window.console.log("fr.ws.initConnection - init completed already!");
      }
      return Promise.reject("Init is already completed.");
    }

    this.socket = new WebSocket(fr.config.WssURI);
    if (!fr.user.hasPermission()) {
      return;
    }
    
    if (debug) {
      window.console.log("fr.ws.initConnection - WS Connection Starting. DEBUG MODE ACTIVE.");
    }
    this.socket.onmessage = (data) => { fr.ws.onMessage(data); };
    this.socket.onerror = (error) => { fr.ws.onError(error); };
    this.socket.onclose = (dc) => { fr.ws.onClose(dc); };
    this.socket.onopen = () => { fr.ws.onOpen(); };
    this.initComp = true;
  },
  reconnected: false,
  clientId: '',
  onOpen: function() {
    if (!fr.user.hasPermission()) {
      return;
    }
    this.subscribe('0xDEADBEEF');
    if (this.reconnected) {
      if (debug) {
        window.console.log("fr.ws.onOpen - WS Connected!");
      }
      this.send('rescues:read', {
        'open': 'true'
      }, {
        'updateList': 'true'
      });
      this.reconnected = false;
    }
  },
  onClose: function(dc) {
    if (dc.wasClean === false) {
      window.console.debug("fr.ws.onClose - Disconnected from WSocket. Reconnecting...");
      this.initComp = false;
      setTimeout(this.initConnection, 60000);
      this.reconnected = true;
    }
  },
  onMessage: function(data) {
    var _data = JSON.parse(data.data);
    if (_data.meta.action === 'welcome') {
      this.clientId = _data.meta.id;
      this.authenticateWSS();
    }
    this.HandleTPA(_data);
  },
  HandleTPA: function() {},
  onError: function(error) {
      window.console.log("=Websocket Module Error=");
      window.console.log(error);
  },
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
  send: function(action, data, meta) {
    this.sendJson({
      "action": action,
      "applicationId": this.clientId,
      "data": data,
      "meta": meta
    });
  },

  authenticateWSS: function() {
    if (!fr.user.hasPermission()) {
      if (debug) {
        window.console.log("fr.ws.authenticateWSS - Subscribing failed, Not API Authenticated");
      }
      return;
    }

    this.socket.send(JSON.stringify({
      "action": "authorization",
      "applicationId": this.clientId,
      "bearer": fr.user.AuthHeader,
      "data": {},
      "meta": {}
    }));
  },

  subscribe: function(stream) {
    if (!fr.user.hasPermission()) {
      if (debug) {
        window.console.log("fr.ws.subscribe - Subscribing failed, Not Authenticated");
      }
      return;
    }
    if (debug) {
      window.console.log("fr.ws.subscribe - Subscirbing to stream!");
    }
    this.socket.send(JSON.stringify({
      'action': 'stream:subscribe',
      'applicationId': stream
    }));
  },

  searchNickName: function(nickname, meta) {
    if (!fr.user.hasPermission()) {
      if (debug) {
        window.console.log("fr.ws.searchNickName - Search failed, Not Authenticated");
      }
      return;
    }

    if (debug) {
      window.console.log("fr.ws.searchNickName - Searching for nick: " + nickname);
    }

    this.socket.send(JSON.stringify({
      "action": 'nicknames:search',
      "applicationId": this.clientId,
      "nickname": nickname,
      "meta": meta
    }));
  },
};