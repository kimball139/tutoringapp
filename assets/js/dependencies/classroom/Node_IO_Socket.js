/* Object to exchange Peer connection meta data (sdp's and ice candidates), can be replaced by any other object that connects to a server to exchange peer data.
 * Only important factors are:
 * 1. When two users are connected through the socket server and ready to call: PR2.peer.usersConnected()
 * 2. After the connection, when peer data is received call: PR2.peer.addPeerInfo()
 * */

var Socket = (function() {
	var connected  = false, socket, pusher_socket, _room
	users_connected_handler = function() {},
	message_received_handler = function(){};	  

	return {
		// Public methods
		// Open a websocket connection and create channel event listeners	
		open : function(room) {
			socket = io('http://fabfactory.cloud.tilaa.com:3003'); 
			_room = room;

			console.log('connecting user to socket server');

			socket.on('error', function() {
				console.log('there was an error');
			});

			socket.on('user joined', function(data) { 
				console.log(data);
				if (data.user_count == 2) {	
					console.log('users are connected');
					users_connected_handler();
				}
			});
			
			socket.on('webrtc', function(data){ 
				message_received_handler(data.data);	
			});
			
			socket.on('connect', function() {
				console.log('socket connection established');
				console.log("connecting to " + _room)
				socket.emit('join room', {room: _room});
				connected = true;		
			});
		},
		/* Send data to the other user through the websocket but only if 'connected' is true
		 * Parameter is an object with two keys: type (ice or sdp) and data (the concerned data 
		 */
		send : function(data) {
			if (!connected) {
				throw new Error('There is no connection with the websocket server');
			}
			else { 
				socket.emit('webrtc', {room: _room, data: data});
			}
		},	
		// close the websocket connection		
		close : function() {
			if (connected) {
				connected = false;
				socket.disconnect();
				console.log('socket disconnected');		
			}
		},
		onMessage : function(callback) {
			message_received_handler = callback;
		},
		onUsersConnect : function(callback) {
			users_connected_handler = callback;
		}
	};
})();