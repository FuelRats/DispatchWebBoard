var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : false;

// fr.config and fr.auth is required.
fr.ws = !fr.config || !fr.user ? null : {
  socket: null,
  initComp: false,
  initConnection: function () {
  	if(!fr.ws.initComp) {
      fr.ws.socket = new WebSocket(fr.config.WssURI);
      if (!fr.user.isAuthenticated() || !fr.user.hasPermission()) {
        return;
      }
  		if (debug) console.log("fr.ws.initConnection - WS Connection Starting. DEBUG MODE ACTIVE.");
    	fr.ws.socket.onmessage = fr.ws.onMessage;
    	fr.ws.socket.onerror = fr.ws.onError;
    	fr.ws.socket.onclose = fr.ws.onClose;
    	fr.ws.socket.onopen = fr.ws.onOpen;
      fr.ws.initComp = true;
  	} else {
  		if (debug) console.log("fr.ws.initConnection - init completed already!");
  	}
  },
	reconnected: false,
	clientId: '',
  onOpen: function (dc) {
		fr.ws.subscribe('0xDEADBEEF');
		if (fr.ws.reconnected) {
			if (debug) console.log("fr.ws.onOpen - WS Connected!");
      fr.ws.send('rescues:read', { 'open': 'true' }, { 'updateList': 'true' });
			fr.ws.reconnected = false;
		}	
	},
	onClose: function (dc) {
		if(dc.wasClean === false) {
			if (debug) console.log("fr.ws.onClose - Disconnected from WSocket. Reconnecting...");
			setTimeout(fr.ws.initConnection, 60000);
			fr.ws.reconnected = true;
		}
	},
	onMessage: function(data) {
		var _data = eval('d = ' + data.data);
		if(_data.meta.action === 'welcome') {
			fr.ws.clientId = _data.meta.id;
		}
		fr.ws.HandleTPA(_data);
	},
	HandleTPA: function(tpa) {},
	onError: function(error) {
		console.log("=Websocket Module Error=");
		console.log(error);
	},
	send: function(action, data, meta) {
    if(!fr.user.isAuthenticated()) {
      if(debug) console.log("fr.ws.send - Sending failed, Not Authenticated");
      return;
    }
		if(fr.ws.socket.readyState !== 1) {
			if(fr.ws.socket.readyState === 0) {
			} else if (fr.ws.socket.readyState == 2 || fr.ws.socket.readyState == 3) {
				fr.ws.initConnection();
			}
			setTimeout(function() {fr.ws.send(action, data, meta); }, 1000);
			return;
		}
		if (debug) console.log("fr.ws.send - Sending TPA");
		fr.ws.socket.send(JSON.stringify({ "action": action, "applicationId": fr.ws.clientId, "data": data, "meta": meta }));		
	},
	subscribe: function(stream) {
    if(!fr.user.isAuthenticated() || !fr.user.hasPermission()) {
      if(debug) console.log("fr.ws.subscribe - Subscribing failed, Not Authenticated");
      return;
    }
  	if (debug) console.log("fr.ws.subscribe - Subscirbing to stream!");
		fr.ws.socket.send(JSON.stringify({ 'action': 'stream:subscribe', 'applicationId': stream }));
	},
	searchNickName: function(nickname, meta) {
    if(!fr.user.isAuthenticated() || !fr.user.hasPermission()) {
      if(debug) console.log("fr.ws.searchNickName - Search failed, Not Authenticated");
      return;
    }
		if(fr.ws.socket.readyState != 1) {
			if(fr.ws.socket.readyState === 0) {
			} else if (fr.ws.socket.readyState == 2 || fr.ws.socket.readyState == 3) {
				fr.ws.initConnection();
			}
			setTimeout(function() {fr.ws.searchNickName(nickname, meta); }, 1000);
			return;
		}
		if (debug) console.log("fr.ws.searchNickName - Searching for nick: " + nickname);
		fr.ws.socket.send(JSON.stringify({ "action": 'nicknames:search', "applicationId": fr.ws.clientId, "nickname": nickname, "meta": meta }));
	},
};