var fr = fr !== undefined ? fr : {};

fr.ws = {
  socket: null,
  initConnection: function () {
      fr.ws.socket = new WebSocket('wss://dev.api.fuelrats.com:443');
      fr.ws.socket.onmessage = fr.ws.onMessage;
      fr.ws.socket.onerror = fr.ws.onError;
      fr.ws.socket.onclose = fr.ws.onClose;
      fr.ws.socket.onopen = fr.ws.onOpen;
  },
	reconnected: false,
	clientId: '',
  onOpen: function (dc) {
		fr.ws.subscribe('0xDEADBEEF');
		if (fr.ws.reconnected) {
			fr.ws.send('rescues:read', { 'open': 'true' }, { 'updateList': 'true' });
			fr.ws.reconnected = false;
		}	
	},
	onClose: function (dc) {
		if(dc.wasClean === false) {
			setTimeout(fr.ws.initConnection, 2000);
			fr.ws.reconnected = true;
		}
	},
	onMessage: function(data) {
		var _data = eval('d = ' + data.data);
		if(_data.meta.action == 'welcome') {
			fr.ws.clientId = _data.meta.id;
		}
		fr.client.HandleTPA(_data);
	},
	onError: function(error) {
		console.log(error);
	},
	send: function(action, data, meta) {
		if(fr.ws.socket.readyState != 1) {
			if(fr.ws.socket.readyState == 0) {
			} else if (fr.ws.socket.readyState == 2 || fr.ws.socket.readyState == 3) {
				fr.ws.initConnection();
			}
			setTimeout(function() {fr.ws.send(action, data, meta); }, 1000);
			return;
		}
		fr.ws.socket.send(JSON.stringify({ "action": action, "applicationId": fr.ws.clientId, "data": data, "meta": meta }));		
	},
	subscribe: function(stream) {
		fr.ws.socket.send(JSON.stringify({ 'action': 'stream:subscribe', 'applicationId': stream }))
	},
	searchNickName: function(nickname, meta) {
		if(fr.ws.socket.readyState != 1) {
			if(fr.ws.socket.readyState == 0) {
			} else if (fr.ws.socket.readyState == 2 || fr.ws.socket.readyState == 3) {
				fr.ws.initConnection();
			}
			setTimeout(function() {fr.ws.searchNickName(nickname, meta); }, 1000);
			return;
		}
		fr.ws.socket.send(JSON.stringify({ "action": 'nicknames:search', "applicationId": fr.ws.clientId, "nickname": nickname, "meta": meta }));
	},
  fetchAuthCode: function (code) {
		return;
		/*$.ajax({
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', 'Basic ' + btoa('6ae5920a-8764-4338-9877-aa4d9f851e0e:ec2652de67f923743415440e82d780521d62a9064aa6f0c6'));
			},
			type: 'POST',
			url: 'https://api.fuelrats.com/oauth2/token',
			data: {
				code: code,
				redirect_uri: 'https://dispatch.fuelr.at',
				grant_type: 'authorization_code'
			},
			success: function(bearer) {
				if(bearer != undefined) {
					fr.client.SetCookie('tokenBearer', bearer.access_token, (60 * 60 * 24 * 1000));
					location.href = './';
				}
			}
		});*/
	}
};