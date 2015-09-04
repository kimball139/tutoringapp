/**
 * A static class that displays a webcam box. This box contains a remote player and a smaller local player.
 * @class camplayer
 * @static
 * @requires utils
*/


PR2.camplayer = (function(self) {
	var $ = PR2.utils,
        container = $.create('div', document.body, {"id" : "pr2_player_container"}),
		local_player = $.create('video', container, {"id" : "pr2_local_player", "class" : "pr2_player", "height" : 200, "width" : 300}),
		remote_player = $.create('video', container, {"id" : "pr2_remote_player", "class" : "pr2_player", "height" : 200, "width" : 300}),
		cam_controls = $.create('span', container, {"id" : "pr2_cam_controls"}, {"display" : "none"}),
		fullscreen_button = $.create('span', cam_controls, {"id" : "pr2_fullscreen_button"}),
		cam_button = $.create('span', cam_controls, {"id" : "pr2_cam_button"}),
		local_stream = null,
		local_player_start_handler = function(stream) {},
		local_stream_stop_handler = function() {},
		remote_player_start_handler = function() {},
		remote_stream_stop_handler = function() {},
		fullscreen_button_click_handler = function() {};
		
	// polyfill
	navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
	
	var _startLocalStream = function() {
		navigator.getUserMedia({audio : true, video : true}, function(stream) {
			cam_button.classList.add('pr2_active_cam_button');
			local_stream = stream;
			cam_button.classList.add('pr2_active_cam_button');
			local_player_start_handler(local_stream);
			local_player.src = URL.createObjectURL(local_stream);
			local_player.play();
			
		}, function(e) {
			$.log('error', e);
		});
	};

    var _toggle = function(action) {
         container.style.display = (action == 'show') ? 'block' : 'none';
    };

	var _stopLocalStream = function() {
		cam_button.classList.remove('pr2_active_cam_button');
		local_stream.stop();
		local_stream = null;
		local_stream_stop_handler();
	};
	
	var _addRemoteStream = function(stream) {
		remote_player.src = URL.createObjectURL(stream);
		remote_player.play();
		remote_player_start_handler();
	};
	
	var _removeRemoteStream = function() {
		remote_stream.stop();
		remote_stream_stop_handler();		
	};
	
	var _toggleControls = function(action) {
		if (action == 'show') {
			cam_controls.style.display = 'block';
		}
		else if (action == 'hide') {
			cam_controls.style.display = 'none';  
		}
	};
	
	$.subscribe(cam_button, {
		'click' : function() {
			if (local_stream == null) {
				_startLocalStream();
			}
			else {
				_stopLocalStream();
			}
		}
	});
	
	$.subscribe(fullscreen_button, {
		click : function() {
			fullscreen_button_click_handler();
		}
	});
	
	self = {
		/**
		 * Add a remote stream to the remote player. Fires the onStartRemoteStream event
		 *
		 * @param {stream} stream The remote stream to add
		 */
		addRemoteStream : function(stream) {
			_addRemoteStream(stream);
		},
		/**
		 * Remove the stream from the remote player. Fires the onStopRemoteStream event
		 */
		removeRemoteStream : function() {
			_removeRemoteStream();
		},
		/**
		 * Add a local stream to the local player. Fires the onStartLocalStream event
		 *
		 * @param {stream} stream The local stream to add
		 */
		startLocalStream : function() {
			_startLocalStream();
		},
		/**
		 * Remove the stream from the local player. Fires the onStopLocalStream event
		 */	
		stopLocalStream : function() {
			_stopLocalStream();
		},
        /**
         * Show or hide the can player
         *
         * @param {string} action Can either be 'show' or 'hide'
         */
        toggle: function(action) {
            if(!$.inArray(action, ['show', 'hide'])) {
                throw new Error('Invalid action');
            }
            _toggle(action);
        },
		/**
		 * Toggle the visible state of the player controls
		 *
		 * @param {string} action Can either be 'show' or 'hide'
		 */	
		toggleControls :function(action) {
			_toggleControls(action);
		},
		/**
		 * Fires when a local stream is added
         *
		 * @event onStartLocalStream
		 * @param {stream} stream The local stream
		 */	
		onStartLocalStream : function(callback) {
			local_player_start_handler = callback;
		},
		/**
		 * Fires when a local stream is removed
         *
		 * @event onStopLocalStream
		 */	
		onStopLocalStream : function(callback) {
			local_stream_stop_handler = callback;
		},
		/**
		 * Fires when a remote stream is added
         *
		 * @event onStartRemoteStream
		 */	
		onStartRemoteStream : function(callback) {
			remote_player_start_handler = callback;
		},
		/**
		 * Fires when a remote stream is removed
         *
		 * @event onStopRemoteStream
		 */	
		onStopRemoteStream : function(callback) {
			remote_stream_stop_handler = callback;
		},
		/**
		 * Fires when the fullscreen button is clicked
		 * @event onFullscreenButtonClick
		 */	
		onFullscreenButtonClick : function(callback) {
			fullscreen_button_click_handler = callback;
		}
	};
	return self;
})(PR2.camplayer);
