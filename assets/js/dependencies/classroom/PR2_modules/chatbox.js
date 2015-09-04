/**
 * A static class that displays a chatbox with text field, and file picker. It can be used to display messages (including emoticons) and file transfers.
 * @class chatbox
 * @static
 * @requires utils
*/
PR2.chatbox = (function(self){
	var $ = PR2.utils,
		enabled = true,
		file_add_handler = function(file_list){},
		link_click_handler = function(type, id){},
		message_add_handler = function(message) {},
		container = $.create('div', document.body, {id : "pr2_chat_container"}),
		dialog = $.create('div', container, {id : "pr2_chat_conversation"}),
        left_box = $.create('div', container, {id: "pr2_chat_leftbox"}),
        input = $.create('textarea', left_box, {id : "pr2_chat_input", placeholder: "Write your message here (Send: Ctrl-Enter)"}),
        right_box = $.create('div', container, {id : "pr2_chat_rightbox"}),
        send_button = $.create('span', right_box, {id : "pr2_chat_send_button", class: "pr2_chat_container_button pr2_chat_container_disabled"}),
		file_button = $.create('span', right_box, {id : "pr2_file_send_button", class: "pr2_chat_container_button"}),
		file_picker = $.create('input', document.body, {"type" : "file", "multiple" : "true"}, {"display" : "none"});

	var _addFileOffer = function(id, filename, offerer) {
		var file_field = $.create('div', dialog), progress_field = $.create('div', dialog);

		if (!enabled) { return; }

		if (offerer == 'local') {
			file_field.innerHTML = '<span>you:</span><span id="file-' + id + '"><a data-action="revoke-offer" href="#">cancel</a> ' + filename + '</span>';
		}
		else if (offerer == 'remote') {
			file_field.innerHTML = '<span class="pr2_chat_other">other:</span><span id="file-' + id + '"><a data-action="decline-offer" href="#">decline</a> | <a data-action="accept-offer" href="#">accept</a> ' + filename + '</span>';
		}
		progress_field.innerHTML = '<span></span><span><progress value="0" max="100" id="progr-' + id + '"></progress></span>';
	};

    var _toggle = function(action) {
        container.style.display = (action == 'show') ? 'block' : 'none';
    };

    var _toggleStatus = function(action) {
		if (action == 'enable') {
			enabled = true;
			container.style.opacity = "1";
			input.disabled = false;
			input.value.length == 0 ? send_button.classList.add('pr2_chat_container_disabled') : send_button.classList.remove('pr2_chat_container_disabled');
            file_button.classList.remove('pr2_chat_container_disabled');
		}
		else if(action == 'disable') {
			enabled = false;
			container.style.opacity = "0.4";
			input.disabled = true;
            send_button.classList.add('pr2_chat_container_disabled');
            file_button.classList.add('pr2_chat_container_disabled');
		}
	};

	var _parse_message = function (message) {
		var emos = [[":-?\\)", "smile"], ["8-\\|", "nerd"], [";-?\\)", "wink"], ["\\*-?\\)", "think"]],
			url_regex = new RegExp("((https?:\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])", "gi");
		// replace emoticon codes for emoticons
		emos.forEach(function(item){
			message = message.replace(new RegExp(item[0], "gi"), '<span class="pr2_emo pr2_emo_' + item[1] + '"></span>');
		});
		// return message with URL's replaced
		return message.replace(url_regex, '<a href="$1" target="_blank">$1</a>');
	};

	var _addMyMessage = function() {
		var message = input.value.trim();
		_addMessage("local", message);
		input.value = "";
        send_button.classList.add('pr2_chat_container_disabled');
	};

	var _addMessage = function(source, message) {
		var message_wrapper, owner;

		if (!enabled || message == "" || message.length == 0 || typeof message != 'string') {
			return;
		}
		message_wrapper = document.createElement('div');
		if(source == 'remote') {
			message_wrapper.classList.add('pr2_chat_other');
			owner = 'Other';
		}
		else {
			owner = 'You';
            message_add_handler(message);
		}
		message_wrapper.innerHTML = "<span>" + owner + ":</span><span>" + _parse_message(message) + "</span>";
		dialog.appendChild(message_wrapper);
		dialog.scrollTop = dialog.scrollHeight - parseInt(window.getComputedStyle(dialog, null).getPropertyValue('height').slice(0,-2),10);
	};

	var _updateFileStatus = function(id, name, status, object_url) {
		var html;

		if (!enabled) { return; }

		switch (status) {
			case 'downloading' :
				html = 'downloading ' + name + ' <a href="#" data-action="cancel-download">cancel</a>'; break;
			case "uploading" :
				html = "uploading " + name + " <a href='#' data-action='cancel-upload'>cancel</a>"; break;
			case "upload-waiting" :
				html = name + " is waiting <a href='#' data-action='cancel-upload'>cancel</a>";	break;
			case "download-waiting" :
				html = name + " is waiting <a href='#' data-action='cancel-upload'>cancel</a>"; break;
			case "upload-completed" :
				html = name + " upload complete"; break;
			case "download-completed" :
				html = "<a href='" + object_url + "' download='" + name + "'>" + name + "</a> is complete"; break;
			case "download-canceled" :
				html = "Other canceled " + name; break;
			case "upload-canceled" :
				html = "You canceled " + name; break;

		}
		$.get('file-' + id).innerHTML = html;
		dialog.scrollTop = dialog.scrollHeight - parseInt(window.getComputedStyle(dialog, null).getPropertyValue('height').slice(0,-2),10);
	};

	var _updateFileProgress = function(file_id, file_progress) {

	$.get('progr-' + file_id).value = file_progress;
	};

	$.subscribe(file_button, {
		'click' : function() {
            if(enabled) file_picker.click();
		}
	});

	$.subscribe(file_picker, {
		'change' : function(e){
			file_add_handler(e.target.files);
		}
	});

	$.subscribe(input, {
		'keydown' : function(e){
			if (enabled && e.keyCode === 13 && e.ctrlKey && this.value.length > 0)	{
				_addMyMessage();
			}
		},
		'keyup' : function() {
			if (this.value.length > 0) {
                send_button.classList.remove('pr2_chat_container_disabled');
			}
			else {
                send_button.classList.add('pr2_chat_container_disabled');
			}
		},
		'dragover' : function(e) {
			e.preventDefault();
		},
		'drop' : function(e) {
			file_add_handler(e.dataTransfer.files);
			e.preventDefault();       return false;
		}
	});

	$.subscribe(send_button, {
		'click' : function() {
			_addMyMessage();
		}
	});

	$.subscribe(dialog, {
		'click' : function(e) {
			var el = e.target;
			if (el.tagName.toLowerCase() == 'a' && typeof el.dataset.action != 'undefined') {
				e.preventDefault();
				link_click_handler(el.dataset.action, el.parentElement.id.substring(5));
			}
		}
	});

	self = {
		/**
		 * Add a message to the conversation box. Fires the onMessageAdd event
         *
		 * @param {string} source Can be 'local' for the local or 'remote' for the remote user
		 * @param {string} message The message to add
		 */
		addMessage : function(source, message) {
			_addMessage(source, message);
		},
		/**
		 * Add a file offer to the conversation box
         *
		 * @param {string} file_id  A unique id to identify the file
		 * @param {string} file_name The name of the file
		 * @param {string} source Can be 'local' for the local or 'remote' for the remote user
		 */
		addFileOffer : function(file_id, file_name, source) {
			_addFileOffer(file_id, file_name, source);
		},
        /**
         * Toggle the visibility of the chatbox
         *
         * @param {string} action Can either be 'show' or  'hide'
         */
        toggle: function(action) {
            if(!$.inArray(action, ['show', 'hide'])) {
                throw new Error('Invalid action');
            }
            _toggle(action);
        },
		/**
		 * Update the status of a file in the conversation box
		 *
		 * @param {string} file_id A unique id to identify the file
		 * @param {string} file_name The name of the file
		 * @param {string} status Can be one of the following values: 'download-waiting', 'upload-waiting', 'downloading', 'uploading', 'download-completed', 'upload-completed', 'download-canceled' or 'upload-canceled'
		 * @param {string} [object_url] An object url which is only required when a download is complete, in other words the status is 'download-complete'
		 */
		updateFileStatus : function(file_id, file_name, status, object_url) {
			_updateFileStatus(file_id, file_name, status, object_url);
		},
		/**
		 * Update the progress of a file in the conversation box
         *
		 * @param {string} file_id A unique id to identify the file
		 * @param {number} file_progress A number between 0 and 100, indicating the progress of the file
		 */
		updateFileProgress : function (file_id, file_progress) {
			_updateFileProgress(file_id, file_progress);
		},
		/**
		 * Toggle the active state of the chatbox
		 *
		 * @param status {string} Either 'enable' to enable it, or 'disable' to disable it
		 */
		toggleStatus : function(status) {
			_toggleStatus(status);
		},
		/**
		 * Fired when a *local* message is added to the chatbox
         *
		 * @event onMessageAdd
		 * @param message {string} the message that was added
		 */
		onMessageAdd : function(callback) {
			message_add_handler = callback;
		},
		/**
		 * Fired when files are added to the chatbox. Note that more files can be added at the same time, but the event fires only once, outputting a file list
		 *
         * @event onFilesAdd
		 * @param {object} file_list A list of files to add
		 */
		onFilesAdd : function(callback) {
			if (typeof callback == 'function') {
				file_add_handler = callback;
			}
		},
		/**
		 * Fired when a link is clicked. Note that this only applies to upload and download links to exchange file transfer information. Regular links are ignored.
         *
		 * @event onLinkClicked
		 * @param action {string} The type of action of the clicked link, can be 'cancel-offer', 'decline-offer', 'accept-offer' 'cancel-upload' or 'cancel-download'
		 * @param file_id {string} The unique file id
		 */
		onLinkClicked : function(callback) {
			if (typeof callback == 'function') {
				link_click_handler = callback;
			}
		}
	}
	return self;

})(PR2.chatbox);