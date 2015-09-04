PR2 = window.PR2 || {};

/**
 * A static class to show various types of modals to a user
 * @class modals
 * @static
 * @requires utils
*/

PR2.modals = (function(self) {
	var $ = PR2.utils,
	modal_background = $.create('div', document.body, {"id" : "pr2_modal_background"}),
	info_modal = $.create('div', document.body, {"id" : "pr2_info_modal"}),
	info_message = $.create('div',info_modal, {"id" : "pr2_info_message"}),
	alert_modal = $.create('div', document.body, {"id" : "pr2_alert_modal"}),
	alert_message = $.create('div', alert_modal, {"id" : "pr2_alert_message"}),
	alert_button = $.create("button", alert_modal, {"id" : "pr2_alert_button", "html" : "Ok"}),
	help_modal = $.create('div', document.body, {"id" : "pr2_help_modal"}),
	help_modal_close = $.create('div', document.body, {"id" : "pr2_help_modal_close"}),
	confirm_modal = $.create("div", document.body, {"id" : "pr2_confirm_modal"}),
	confirm_modal_question = $.create("div", confirm_modal, {"id" : "pr2_confirm_question"}),
	confirm_handler = function(){},
	confirm_modal_yes = $.create("button", confirm_modal, {"id" : "pr2_confirm_yes", "html": "Yes"}),
	confirm_button_cancel = $.create("button", confirm_modal, {"id" : "pr2_confirm_cancel", "html" : "Cancel"});

	
	var _confirm = function(message, callback) {
		modal_background.style.display = 'block';
		confirm_modal.style.display = 'block';
		confirm_modal_question.textContent = message;
		confirm_handler = callback;			
	};
	
	var _alert = function(message) {
		modal_background.style.display = 'block';
		alert_modal.style.display = 'block';
		alert_message.textContent = message;
	};
	
	var _info = function(display, message)  {
		if (display == 'show') {
			modal_background.style.display = 'block';
			info_message.textContent = message;
			info_modal.style.display = 'block';
		}
		else if (display == 'hide') {
			modal_background.style.display = 'none';
			info_modal.style.display = 'none';
		}		
	};
	
	var _help = function(display, relative_url) {
		var request;
		if(display == "hide") {
			modal_background.style.display = help_modal.style.display = help_modal_close.style.display = 'none';
		}
		else if(display == "show") {
			modal_background.style.display = 'block';				
			help_modal.style.display = 'block';
			help_modal_close.style.display = 'block';
			request = new XMLHttpRequest(); 
			request.open('GET', document.location.origin + document.location.pathname + relative_url);
			request.responseType = 'document';
			request.onload = function(e) {  
				if(this.responseXML.documentElement.tagName == 'parsererror') {
					console.log("There was an error loading the content");
					help_modal.innerHTML = "There was an error loading the content";						
					return;
				}
				help_modal.innerHTML = this.responseXML.documentElement.innerHTML;
				help_modal.scrollTop = 0;
			};
			request.onerror = function(e) {
				console.log(e.currentTarget.response);
			}
			request.send(null);
		}					
	};
		
	// Listeners
	
	$.subscribe(help_modal_close, {
		'click' : function() {
			self.help('hide');
		}
	});
	
	// this is to make sure that when an inline link is clicked the hash doesn't change
	$.subscribe(help_modal, {
		'click' : function(e) {
			var temp_hash;
			if (e.target.tagName == 'A') {
				temp_hash = document.location.hash;
				e.preventDefault();
				document.location = e.target.href;
				document.location.hash = temp_hash;
			}
		}
	});

	$.subscribe(alert_button, {
		'click' : function() {
			modal_background.style.display = 'none';
			alert_modal.style.display = 'none';
			alert_message.textContent = '';	
		}
	});
	 
	
	$.subscribe(confirm_button_cancel, {
		'click' : function(e) {
			confirm_handler = null;
			modal_background.style.display = 'none';
			confirm_modal.style.display = 'none';
		}
	});

	$.subscribe(confirm_modal_yes, {
		'click' : function(){
			confirm_handler();
			confirm_handler = null;
			modal_background.style.display = 'none';
			confirm_modal.style.display = 'none';
		}
	});	

	self = {
		/**
		 * Displays a dialog with a question that requires confirmation
		 *
		 * @param {string} message the question text
		 * @param {function} callback function that is called when the user confirms
		 */
		confirm : function(message, callback) {
			_confirm(message, callback);		
		},
		/**
		 * Displays an information dialog with a message to the user
		 *
		 * @param {string} display either 'show' or 'hide'
		 * @param {string} [message] the message text (only relevant when showed)
		 */
		info : function(display, message) {
			_info(display, message);
		},
		/**
		 * Displays a help dialog with an embedded HTML file
		 *
		 * @param {string} display either 'show' or 'hide'
		 * @param {string} [url] [relative_url] that point to the help file
		 */
		help : function(display, relative_url) {
			_help(display, relative_url)	
		},
		/**
		 * Displays a notification dialog (Not yet implemented)
		 *
		 * @param {string} message the message to display
		 */
		alert : function(message) {
			_alert(message);
		}
	}
	
	return self;
})({});