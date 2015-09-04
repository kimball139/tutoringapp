PR2 = window.PR2 || {};

/**
 * A static class to create a toolbar with a menu's, grouped buttons and pickers
 * @class toolbar
 * @static
 * @requires utils
*/
PR2.toolbar = (function(self) {
	var $ = PR2.utils,
	open_menu = null,
	toolbar = $.create("span", document.body, {id: "pr2_toolbar"}),
	start_button = $.create('span', toolbar, {id: "pr2_start_button", "data-type": "open_button",  title: "Start"}),
	start_menu = $.create('ul', toolbar, {id: "pr2_start_menu"}, {"display" : "none", "top" : (toolbar.offsetHeight + 4) + "px"}),
	whiteboard_tools = $.create("span", toolbar,  {id: "pr2_whiteboard_tools"}),
	spacer = $.create('span', whiteboard_tools, {class: "pr2_spacer"}),
	history_group = $.create("span", whiteboard_tools, {id: "pr2_history_group"}),
	spacer = $.create('span', whiteboard_tools, {class: "pr2_spacer"}),
	action_group = $.create("span", whiteboard_tools, {id: "pr2_action_group"}),
	spacer = $.create('span', whiteboard_tools, {class: "pr2_spacer"}),
	properties_group = $.create("span", whiteboard_tools, {id: "pr2_property_group"}),
	spacer = $.create('span', whiteboard_tools, {class: "pr2_spacer"});

	var toolbar_creator = {
		button : function(group, config) {
			var button = $.create("span", group, {id : config.id || "", "data-type": "button", "data-value" : config.value, class: "pr2_tool_button", title : config.title || ""}, {backgroundPosition: config.style});
			if(config.enabled == false) { button.classList.add('pr2_tool_button_disabled'); }
			if (typeof config.group != 'undefined') {button.dataset.group = config.group;}
            $.subscribe(button, {
                click: (function() {
                    var value = config.value;

                    return function() {
                        config.action(value);
                    }
                })()
            });
		},
        label: function(group, config) {
            $.create('span', group, {class: "pr2_toolbar_label", html: config.title});
        },
		image_icon : function(group, config) {
			$.create('span', group, {class: "pr2_image_icon", id: config.id || ""}, {backgroundPosition: config.style}, {backgroundPosition: config.style});
		},
		pulldown : function(group, config) {
			var wrapper = $.create("div", group, {class: "pr2_select_wrapper"});
			var select = $.create("select", wrapper, {id : config.id, "data-type": "pulldown"});

			config.items.forEach(function(value) {
				$.create("option", select, {value : value, html : value});
			});
			
			$.subscribe(select, {
				change: function() {
					select.action("change", this.value);
				}
			});
		},
 
		sub_menu : function(group, config) {
			var parent = $.create('li', start_menu, {
				id: config.id,
				class:  "pr2_startmenu_menu",
				html: config.label || "",
				"data-access": config.access || "always"
			});
			var menu = $.create('ul', parent);

			config.items.forEach(function(item){
				var li = $.create('li', menu, {
					id: item.id,
					"data-type": "startmenu_button",
					html: item.label,
					"data-access": item.access || "always"
				});
                $.subscribe(li, {
                    click: item.action
                });
			});
		},
		menu_item : function(group, config) {
            var item = $.create('li', start_menu, {
                id: config.id,
                "data-type": "startmenu_button",
                html: config.label,
                "data-access": config.access || "always"
            });
            $.subscribe(item, {
                click: config.action || function(){}
            });
		},
		picker : function(group, config) {
			var picker_button =  $.create("span", group, {id : config.id || "", "data-type": "open_button",  class: "pr2_toolbar_picker_button", title : config.title || "", data : config.data || "" }, {backgroundPosition: config.style});
			var picker =  $.create("span", group, {class: "pr2_toolbar_picker", title : config.title || ""}, {"display" : "none", "left" : picker_button.offsetLeft + "px", "top" : (toolbar.offsetHeight + 6) + "px", width: config.width || 300});
			picker.action = config.action || function() {};
			config.items.forEach(function(button) {
				var item = $.create("span", picker, {
					id: button.id || "",
					"data-type": "picker_button",
					class: "pr2_picker_button",
					"data-value": button.value,
					title: button.title
				},{ background: button.background || ""});
				if (typeof button.class != 'undefined') {
					item.classList.add(button.class);
				}
			});
            if(typeof config.link != 'undefined') {
                $.create('div', picker, {
                    class: "pr2_picker_link",
                    html: config.link.text,
                    "data-type": 'picker_link'
                }).addEventListener('click', (function(){
                    var action = config.link.action;
                    return function() {
                        action();
                    }
                })());
            }
		}
	};
	
	var _focus = function(id, value) {
		var el = $.get(id);
        var picker;
        var parent;
        var match;

		switch (el.dataset.type) {
			case "button" :
				parent = el.parentElement;
				if (typeof el.dataset.group == 'undefined') {
					return;
				}
				for (var i = 0, len = parent.children.length; i < len; i++) {  
					if (parent.children[i].dataset.group == el.dataset.group) {
						parent.children[i].classList.remove('pr2_tool_button_selected'); 
					}				
				}
				el.classList.add('pr2_tool_button_selected');
				break;
			case "pulldown" :
				el.value = value;
				break;
			case "open_button" :
				picker = el.nextElementSibling, match = false;
				for (var i = 0, len = picker.children.length; i < len; i++) {
					if (picker.children[i].dataset.value == value) { 
						el.setAttribute('style', picker.children[i].getAttribute('style'));
						match = true;
					}
					if (!match) {
						el.setAttribute('style', value);
					}
				}				

		}
	};
	
	var _toggleButtonState = function(id, action) {
		var button = $.get(id);
		if (action == 'enable') {
			button.classList.remove('pr2_tool_button_disabled');
		}
		else if (action == 'disable') {
			button.classList.add('pr2_tool_button_disabled');
		}		
	};
	
	var _toggleControls = function(action) {
		if (action == 'show') {
			whiteboard_tools.style.display = 'inline-block';
		}
		else if (action == 'hide') {
			whiteboard_tools.style.display = 'none';
		}
	};
	
	var _setMenuAccess = function(role) {
		var items =  start_menu.getElementsByTagName( 'li'), i, len, access;
	
		for (i = 0, len = items.length; i < len; i++) {
			access = items[i].dataset.access;
			switch(access) {
				case 'always' : items[i].style.display = 'block'; break;
				case 'never' : items[i].style.display = 'none'; break;
				case 'creator' : items[i].style.display = (role == 'creator' ?  'block' : 'none'); break;
				case 'observer' : items[i].style.display = (role == 'observer' ?  'block' : 'none'); break;
			}
		}
	};

    var handleMenus = function(el) {
        var type = el.dataset.type;

        if(!$.inArray(type, ['open_button', 'button', 'picker_link', 'picker_button', 'startmenu_button']))  {
            if(open_menu != null)  {
                open_menu.style.display = 'none';
                open_menu = null;
            }
            return;
        }
        switch (type) {
            case 'open_button':
                var target_menu = el.nextElementSibling;

                if(open_menu == null) {
                    open_menu = target_menu;
                    open_menu.style.display = 'block';
                }
                else if(open_menu == target_menu) {
                    open_menu.style.display = 'none';
                    open_menu = null;
                }
                else {
                    open_menu.style.display = 'none';
                    open_menu = target_menu;
                    open_menu.style.display = 'block' ;
                }
                break;
            case 'picker_button':
                el.parentElement.action(el.dataset.value, el);
                open_menu.style.display = 'none';
                open_menu = null;
                break;
            case "button" :
                if(open_menu != null) {
                    open_menu.style.display = 'none';
                    open_menu = null;
                }
                break;
            case "startmenu_button" :
                if(open_menu != null) {
                    open_menu.style.display = 'none';
                    open_menu = null;
                }
                break;
            case 'picker_link':
                open_menu.style.display = 'none';
                open_menu = null;
                break;

        }
    };

    $.subscribe(window, {
        'mousedown': function(e) {
            setTimeout(function() {
                handleMenus(e.target);
            }, 200);
        }
    });
	
	self = {
		/**
		 * Add control to the toolbar.
		 *
		 * @param {string} group Can be one of the following values: 'properties', 'history' and 'actions'. These values respresent the toolbar group to which the control is added.
		 * @param {string} type Can be one of the following values: 'image_icon', 'pulldown', 'picker' and 'button'.
		 * @param {object} config A configuration object for the control. Each configuration object should at least have a unique id and a title. To group a button a group name must be added. Each button also needs a value and an action.
		 */
		add : function(group, type, config) {
            if(!$.inArray(group, ['history', 'properties', 'actions']) || !$.inArray(type, ['picker', 'label', 'button', 'pulldown', 'image_icon'])) {
                throw new Error('Invalid configuration of toolbar item');
            }
            switch (group) {
                case 'properties' : group = properties_group; break;
                case 'history' : group = history_group; break;
                case 'actions' : group = action_group; break;
            }
            toolbar_creator[type](group, config);
            return this;
		},
		/**
		 * Add control to the toolbar start menu.
		 *
		 * @param {string} type Can be one of the following values: 'menu_item' or 'sub_menu'. These values respresent either an item added directly to the root of the menu, or to a submenu. Note that the start menu can only have one level of submenu's.
		 * @param {object} config A configuration object that must contain at least an id, and a label. In case of a menu_item an action is also required. In case of a sub_menu you will need an array with menu_item object, so like this:
		 * @example	[{id: "unique_id", "label" : "Click me please", "action" : function() { ... )}}]
		 */
		addToMenu : function(type, config) {
			if (!$.inArray(type, ['sub_menu', 'menu_item'])) {
                throw new Error('Invalid configuration of menu item');
			}
            toolbar_creator[type]('menu', config);
            return this;
		},
		/**
		 * Set focus to a toolbar control. This can either be a group button, a picker item, or a pulldown menu item
		 *
		 * @param {string} id The id of the control
		 * @param {string} [value] The value to set the control to. In case of a picker this value represents one of the item values, in case of a pulldown menu the value of an option, and in case of a grouped button the value isn't needed.
		 */
		focus : function(id, value) {
			_focus(id, value);
		},
		/**
		 * Enable or disable button, applies only to buttons that are not grouped
		 *
		 * @param {string} id The id of the button
		 * @param {string} action Can either be 'enable' or 'disable'
		 */
		toggleButtonState : function(id, action) {
			_toggleButtonState(id, action);
		},
		/**
		 * Show or hide the whiteboard controls
		 *
		 * @param {string} action Either 'hide' or 'show'
		 */
		toggleControls : function(action) {
			_toggleControls(action);
		},
		setMenuAccess : function(role) {
            _setMenuAccess(role);
            /**
             * Hide or show start menu items, based on their respective roles. That means certain menu items can be hidden based on their role access
             *
             * @param {string} role Either 'creator' for the person that is working with the whiteboard, or 'observer' for the person observing it
             */
        }
	};
	return self;
})(PR2.toolbar);
