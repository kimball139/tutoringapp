PR2 = window.PR2 || {};

/**
 *
 * A static class that represents the whiteboard, the most important PR2 object. 
 * @class whiteboard
 * @static
 * @requires utils
*/ 
PR2.whiteboard = (function(self) {
	var $ = PR2.utils;
	// event handlers
	var action_handler = function(action, depends) {};
    var file_drop_handler = function(file, x, y){};
	var property_change_handler = function(property, value) {};
    var image_paste_handler = function(data_url){};
	var pointer_handler = function(x, y, state) {};
    var helper_move_handler = function(x, y){};
    var helper_toggle_handler = function(show){};
    var click_handler = function(x, y){};
    // canvas boundaries
	var bounds = {left : 0, right : 0, top : 0, bottom : 0};
	var config = {
		width : 0,
		height : 0,
		action : 'point',
		access : false,
		lineWidth : 1,
		strokeStyle : 'black',
		fillStyle : 'transparent',
		lineCap : 'round',
		lineJoin : 'round',
		background : "",
		shape : ''
	},
	visible_helpers = false,
    patternImage = new Image(),
	shapeFunction = function(context, old_x, old_y, new_x, new_y){}, // Holds internal references to the shapeFunction
	valid_properties = ['action', 'shape', 'pattern', 'fillStyle', 'strokeStyle', 'lineWidth', 'lineJoin', 'lineCap', 'background'],
	valid_actions = ['paint', 'point', 'shape', 'none', 'editor', 'pattern'],
	mouse_down = false;


	// create a container for the whiteboard layers
	var container = $.create('div', document.body, {"id" : "pr2_canvas_container"}),
		// create canvas
		canvas = $.create("canvas", container, {"id" : "pr2_canvas", "class" : "pr2_canvas"}),
		ctx = canvas.getContext("2d"),
		// create upper temporary canvas
		temp_canvas = $.create("canvas", container, {"id" : "pr2_temp_canvas", "class" : "pr2_canvas"}),
		temp_ctx = temp_canvas.getContext("2d"),
		// a hidden element that can be 'trigger' clicked to force a file donwload
		download_link = $.create("a", document.body , {"id" : "pr2_download_link", "download": "canvas.png", "target" : "_blank"}, {"display" : "none"}),
		// a hidden div intented to catch a pasted image
		paste_buffer = $.create('div', document.body, {"contenteditable" : "true"},{"overflow": "hidden", "max-height" : 0, "max-width" : 0, "opacity" : "hidden"}),
		// the pointer that is visible
	    remote_pointer = $.create('div', document.body, {"id" : "pr2_remote_pointer"}, {"backgroundImage" : "url(/whiteboard/icons/pointer.png)"}),
        // the pattern helper (cursor) image
        pattern_pointer = $.create('div', document.body, {id: "pr2_pattern_pointer"});
		// helpers
		horizontal_helper = $.create("div", document.body, {"id" : "pr2_horizontal_helper"}),
		vertical_helper = $.create("div", document.body, {"id" : "pr2_vertical_helper"}),
	// layers to prevent images and stuff flow outside of the canvas
		top_layer = $.create('div', document.body, {"id": "pr2_top_layer", "class" : "pr2_canvas_border_layers"}),
		bottom_layer = $.create('div', document.body, {"id" : "pr2_bottom_layer", "class" : "pr2_canvas_border_layers"}),
		left_layer = $.create('div', document.body, {"id" : "pr2_left_layer", "class" : "pr2_canvas_border_layers"}),
		right_layer = $.create('div', document.body, {"id" : "pr2_right_layer", "class" : "pr2_canvas_border_layers"});


	// This is a DOM event, normal listeners are deprecated in this case
	var paste_observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			var added_element = mutation.addedNodes[0];

			if (typeof added_element != 'undefined' && added_element.tagName == 'IMG' ) {
			    image_paste_handler(added_element.src);
				paste_buffer.lastChild.remove();
			}
		});
	});

	// The whiteboard needs to be reprainted and properties reset
	var _setDimensions = function(width, height) {
		config.height = canvas.height = temp_canvas.height = height;
 		config.width = canvas.width = temp_canvas.width = width;
		_setProperty('lineWidth', config.lineWidth);
		_setProperty('strokeStyle', config.strokeStyle);
		_setProperty('fillStyle', config.fillStyle);
		_setProperty('lineCap', config.lineCap);
		_setProperty('lineJoin', config.lineJoin);
		_setBounds();
		_repaintWhiteboard.start();
		horizontal_helper.style.left = 1 + 'px';
		horizontal_helper.style.width = canvas.width + 2 + 'px';
		horizontal_helper.style.top = 40 + 'px';
		vertical_helper.style.left = 1 + 'px';
		vertical_helper.style.height = canvas.height + 2 + 'px';
		vertical_helper.style.top = 40 + 'px';
		top_layer.style.height = 40 + 'px';
		left_layer.style.width = 1 + 'px';
		right_layer.style.left = canvas.width + 1 + 'px';
        right_layer.style.height = canvas.height + 2 + 'px';
		bottom_layer.style.top = canvas.height +1 + 'px';
	};

    var _clear = function() {
        ctx.clearRect(0, 0, config.width, config.height);
        store.clear();
    };

    var _setAccess = function(access) {
        if (access) {
            config.access = true;
            if(typeof config.action != 'undefined') {
                _setProperty('action', config.action);
            }
        }
        else {
            config.access = false;
            temp_canvas.style.cursor = 'default';
            pattern_pointer.style.display = 'none';
        }
    };

    var _getOffset = function() {
        return {left: canvas.offsetLeft + 1, top: canvas.offsetTop + 1, right: canvas.offsetLeft + canvas.offsetWidth - 2, bottom: canvas.offsetTop + canvas.offsetHeight - 2};
    };

    var _toggleRemotePointer = function(action) {
          remote_pointer.style.display = action == 'show' ? 'block' : 'none';
    };

	var _toggleHelpers = function(action) {
		if (action == 'show') {
			horizontal_helper.style.display  = vertical_helper.style.display = 'block';
			visible_helpers = true;
		}
		else if (action == 'hide') {
			horizontal_helper.style.display  = vertical_helper.style.display = 'none';
			visible_helpers = false;
		}
        helper_toggle_handler(action);
	};

	// Get the value of a property
	var _getProperty = function(property) {
		if (!$.inArray(property, valid_properties)) {
			throw new Error('Invalid property: ' + property);
		}
		return config[property];
	};

	// Set the value of a property
	var _setProperty = function(property, value) {
		if (!$.inArray(property, valid_properties)) {
			throw new Error('Invalid property: ' + property);
		}
		config[property] = value;
		// when the shape changes;
		if (property == 'shape') {
			shapeFunction  = PR2.shapes.get(value).shapeFunction;
		}
        // when the patter changes
        else if(property == 'pattern') {
            patternImage.src= '';
            patternImage.src = value;
            patternImage.originalSource = value;
        }
		// when the action changes
		else if (property == "action") {
			if (!$.inArray(value, valid_actions)) {
				throw new Error(property + ' is not a valid action');
			}
			// set the cursor corresponding to the action type
			if (!config.access || value == 'none' || value == 'editor' || value == 'pattern') {
				temp_canvas.style.cursor = 'default';
			}
			else if (value == 'point') {
				temp_canvas.style.cursor = 'url(/whiteboard/icons/pointer.png), move';
			}
			else if(value == 'paint' || value == 'shape') {
				temp_canvas.style.cursor = 'crosshair';
			}
            pattern_pointer.style.display = (value == 'pattern' && config.access)  ? 'block' : 'none';
		}
		else {
			if($.inArray(property, ['lineWidth', 'fillStyle', 'lineCap', 'lineJoin', 'strokeStyle'])){
				ctx[property] = temp_ctx[property] = value;
			}
			else if (property == 'background') {
				canvas.style.background = value;
			}
		}
		property_change_handler(property, value);
	};

	var _save_whiteboard_snapshot = function(){
		var img = new Image();
	    var save_img = document.createElement('canvas');
		var save_ctx = save_img.getContext('2d');

		save_img.height = config.height;
		save_img.width = config.width;

		save_ctx.rect(0, 0, canvas.width,canvas.height);

		if(canvas.style.backgroundImage == '') {
			save_ctx.fillStyle = "white";
			save_ctx.fill();
			canvasToImage();
		}
		else {
			img.onload = function() {
				save_ctx.fillStyle = ctx.createPattern(img,"repeat");
				save_ctx.fill();
				canvasToImage();
			};
			img.src = canvas.style.backgroundImage.replace(/"/g, '').slice(4, -1);
		}

		function canvasToImage() {
			save_ctx.rect(0, 0, canvas.width,canvas.height);
			save_ctx.fillStyle = save_ctx.createPattern(canvas, 'no-repeat');
			save_ctx.fill();
			download_link.href = save_img.toDataURL();
			download_link.click();
		}
	};

	var _addAction = function(action) {
		switch (action.type) {
			case 'paint' : _paint(action.config, action.data); break;
			case 'image' : _drawImage(action.data); break;
			case 'text' : _drawText(action.config, action.data); break;
			case 'shape' : _shape(action.config, action.data); break;
            case 'pattern' : _drawPattern(action.data); break;
		}
		store.add(action.type, action.config, action.data);
	};

	/* Function that repaints the whiteboard. It uses the ordinary canvas action functions,
	 * with callbacks to make sure images aren't loaded after simple strokes
	 */
	var _repaintWhiteboard = (function() {
		var actions, current_action;

		var resetConfig = function() {
			ctx.strokeStyle = config.strokeStyle;
			ctx.fillStyle = config.fillStyle;
			ctx.lineWidth = config.lineWidth;
			shapeFunction = PR2.shapes.get(config.shape).shapeFunction;
		};

		return {
			start : function() {
				actions = store.get();
                ctx.clearRect(0, 0, config.width, config.height);
				if (actions.length > 0) {
					this.next();
				}
			},
			next : function() {
				current_action = actions.shift();
				if (typeof current_action == 'undefined') {
					resetConfig();
					return false;
				}
				else {
					switch (current_action.type) {
						case 'paint' : _paint(current_action.config, current_action.data, true); break;
						case 'image' : _drawImage(current_action.data, true); break;
						case 'text' : _drawText(current_action.config, current_action.data, true); break;
						case 'shape' : _shape(current_action.config, current_action.data, true); break;
                        case 'pattern' : _drawPattern(current_action.data, true); break;
                }
                return true;
				}
			}
		};
	})();


	// create text editor and span to measure it'
	// for the point action only the cursor pictogram is changed
    var _point = function(status, x, y) {
		if (status == 'start') {
			temp_canvas.style.cursor = 'url(/whiteboard/icons/pointer-click.png), move';
			pointer_handler(x, y, 'down');
		}
		else if (status == 'continue') {
			pointer_handler(x, y, 'down_move');
		}
		else if (status == 'end') {
			temp_canvas.style.cursor = 'url(/whiteboard/icons/pointer.png), move';
			pointer_handler(x, y, 'up');
	    }
		else if (status == 'moving') {
			pointer_handler(x, y, 'up_move');
	    }
	};

	// Paints onto the temporary canvas (if stroke let's go add it to the canvas)
	var _paintFunction = function(context, old_x, old_y, new_x, new_y) {

		var leftCoord = canvas.getBoundingClientRect().left;
		var topCoord = canvas.getBoundingClientRect().top;

		context.beginPath();
		context.moveTo(old_x, old_y);
		context.lineTo(new_x, new_y);
		context.closePath();
		context.stroke();
	};

	var _paintRealtime = (function() {
		var old_x, old_y, coords = [];

		return function(status, x, y) {
			if (status == 'start') {
				coords = [];
				old_x = x - 1;
                old_y = y - 1;
                coords.push([old_x, old_y]);
			}
			_paintFunction(temp_ctx, old_x, old_y, x, y);
			coords.push([x, y]);
			old_x = x;
            old_y = y;
			// When a paint stroke is finished store the data, and paint the data, but also clear the temperary canvas
			if (status == 'end') {
				store.add('paint', {strokeStyle : config.strokeStyle, lineWidth : config.lineWidth}, coords);
				_paint({strokeStyle : config.strokeStyle, lineWidth : config.lineWidth}, coords);
				temp_ctx.clearRect(0, 0, config.width, config.height);
			}
		};
	})();

	var _paint = function(conf, data, repaint) {
		var j = 0, last = data.length - 1;

		ctx.strokeStyle = conf.strokeStyle;
		ctx.lineWidth = conf.lineWidth;
		for(j; j < last; j++) {
			_paintFunction(ctx, data[j][0], data[j][1], data[j + 1][0], data[j + 1][1]);
		}
		if (repaint) { _repaintWhiteboard.next() }
	};

	var _shapeRealtime = (function() {
		var old_x, old_y, conf;
		return function(status, x, y) {
			if (status == 'start') {
				old_x = x;
                old_y = y;
				return;
			}
			temp_ctx.clearRect(0, 0, config.width, config.height);
			shapeFunction(temp_ctx, old_x, old_y, x, y);
			// When a paint stroke is finished store the data, and paint the data, but also clear the temperary canvas
			if (status == 'end') {
				conf = {strokeStyle : config.strokeStyle, lineWidth : config.lineWidth, fillStyle : config.fillStyle, shape : config.shape};
				store.add('shape', conf, [old_x, old_y, x, y]);
				_shape(conf, [old_x, old_y, x, y]);
				temp_ctx.clearRect(0, 0, config.width, config.height);
			}
		}
	})();

	var _shape = function(conf, data, repaint) {
		ctx.strokeStyle = conf.strokeStyle;
		ctx.fillStyle = conf.fillStyle;
		ctx.lineWidth = conf.lineWidth;
		shapeFunction = PR2.shapes.get(conf.shape).shapeFunction;
		shapeFunction(ctx, data[0], data[1], data[2], data[3]);
		if (repaint) { _repaintWhiteboard.next() }
	};

    var _addText = function(text, properties, x, y, width, height) {
        store.add('text', properties, [x, y, width, height, text]);
        _drawText(properties, [x, y, width, height, text]);
    };

    var _drawText = function(c, data, repaint) {
        var img = new Image() ;
        var underline = c.underline ? "text-decoration: underline; " : "";
        var italic = c.italic ? "font-style:italic; " : "";
        var bold = c.bold ? "font-weight: bold; " : "";
        var align = "text-align:" + c.align + "; ";
        var font = "font-family:" + c.font + "; color:" + c.color + "; font-size:" + c.size + "px; ";

        var svg_object = "<svg xmlns='http://www.w3.org/2000/svg' width='" + data[2] + "' height='" + data[3] + "'>" +
            "<foreignObject width='100%' height='100%'>" +
            "<div xmlns='http://www.w3.org/1999/xhtml'>" +
            "<textarea style='border: 0; overflow: hidden; margin:0; outline:0; padding:0; background-color: transparent;" +
            font + underline + italic + bold + align +
            "height : "  + data[3] + "px; width: " + data[2] + "px'>" + data[4] + "</textarea>" +
            "</div>" +
            "</foreignObject>" +
            "</svg>";
        var img_object = new Blob([svg_object], {type: "image/svg+xml;charset=utf-8"});
        var img_url = window.URL.createObjectURL(img_object);
        img.onload = function() {
            ctx.drawImage(img, data[0], data[1], data[2], data[3]);
            URL.revokeObjectURL(img_url);
            if (repaint) { _repaintWhiteboard.next() }
        };
        img.src = img_url;
    };

    var _addImage = function(data_url, x, y, width, height) {
        store.add('image', null, [x, y, width, height, data_url]);
        _drawImage([x, y, width, height, data_url]);
    };

    var _drawImage = function(data, repaint) {
		var img = new Image();

		img.onload = function() {
			ctx.drawImage(img, data[0], data[1], data[2], data[3]);
			if (repaint) { _repaintWhiteboard.next() }
		};
		img.src = data[4];
    };

    var _addPattern = function(x, y) {
        if(typeof patternImage.originalSource == 'string') {
            store.add('pattern', null, [x,y, patternImage.originalSource]);
            _drawPattern([x, y, patternImage.originalSource]);
        }
        else {
            PR2.modals.alert('Please select a pattern first');
        }
    };

    var _drawPattern = function(data, repaint) {
        var img = new Image();

        img.onload = function() {
          ctx.drawImage(img, data[0], data[1], img.width, img.height);
            if (repaint) { _repaintWhiteboard.next() }
        };
        img.src =  data[2];
    };

    // object to store the actions for undo and repaint operations
    var store = (function(){
		var stack = [];
        var redo_stack = [];

		return {
			add : function(action, config, data) {
				var item = { "type" : action, "config" : config, "data" : data };
				stack.push(item);
				redo_stack = [];
				action_handler('add', item);
			},
			redo : function() {
				var item = redo_stack.pop();
				stack.push(item);
				action_handler('redo', redo_stack.length != 0);
			},
			undo : function() {
				var item = stack.pop();
				redo_stack.push(item);
				action_handler('undo', stack.length != 0);
			},
			get : function() {
				return stack.slice();
			},
			count : function() {
				return stack.length;
			},
			redo_count : function() {
				return redo_stack.length;
			},
			last : function() {
				return stack[stack.length - 1];
			},
			clear : function() {
				stack = [];
                redo_stack = [];
				action_handler('clear', true);
			},
			concat : function(data) {
				stack.concat(data);
			},
			replace : function(data) {
				stack = data;
                redo_stack = [];
			}
		}
    })();

	var _undo = function() {
		if (store.count() > 0) {
			store.undo();
			_repaintWhiteboard.start();
		}
	};

	var _redo = function() {
		if (store.redo_count() > 0) {
			store.redo();
			_repaintWhiteboard.start();
		}
	};

	// Load data and repaint the whiteboard, if second parameter is 'add' thhe store will not be replaced but appended
	var _loadActions = function(data, action) {
		if (action == 'add') {
			store.add(data);
		}
		else if (action == 'replace') {
			store.replace(data);
		}
		_repaintWhiteboard.start();
	};

    // OFFSET METHOD, returns the offset of the canvas: left, top, right, bottom
    var _setBounds = function() {
		bounds = {"left" : canvas.offsetLeft - window.scrollX, "top" : canvas.offsetTop - window.scrollY, "right" : canvas.offsetLeft + canvas.offsetWidth - window.scrollX, "bottom" : canvas.offsetTop + canvas.offsetHeight - window.scrollY};
    };

	// Initialize dimensions
	_setDimensions(900, 650);

	// Observes changes in the paste_buffer
	paste_observer.observe(paste_buffer, { attributes: false, childList: true, characterData: false });

    //
    patternImage.onload = function() {
        pattern_pointer.style.backgroundImage = 'url(' + this.src + ')';
        pattern_pointer.style.height = this.height + 'px';
        pattern_pointer.style.width = this.width + 'px';
    };

	$.subscribe(window, {
		mousedown: function(e) {
			if(e.target == temp_canvas|| e.target == pattern_pointer) {
				if (!config.access) {
                    return;
                }
                else if(config.action == 'editor')  {
                    click_handler(e.clientX, e.clientY);
                }
                else {
				    mouse_down = true;
                }
			}
			if (mouse_down) {
				switch(config.action) {
					case 'paint': _paintRealtime('start', e.clientX - bounds.left, e.clientY - bounds.top); break;
					case 'shape': _shapeRealtime('start', e.clientX - bounds.left, e.clientY - bounds.top); break;
					case 'point': _point('start', e.clientX - bounds.left, e.clientY - bounds.top); break;
				}
			}
		},
		mouseup: function(e) {
			if (mouse_down) {
				if (!config.access) { return; }
				switch(config.action) {
					case 'paint': _paintRealtime('end', e.clientX - bounds.left, e.clientY - bounds.top); break;
					case 'shape': _shapeRealtime('end', e.clientX - bounds.left, e.clientY - bounds.top); break;
					case 'point':
						if(e.target == temp_canvas) {
							_point('end', e.clientX - bounds.left, e.clientY - bounds.top);
						}
						break;
                    case 'pattern': _addPattern(e.clientX - bounds.left - 1, e.clientY - bounds.top - 1); break;
				}
			}
            mouse_down = false;
		},
		mousemove: function(e) {
			e.preventDefault();
			if (!config.access) { return; }
			// take care of rulers
			if (visible_helpers) {
				vertical_helper.style.left = e.clientX + 'px';
				horizontal_helper.style.top = e.clientY + 'px';
                helper_move_handler(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
			}
            if(config.action == 'pattern')  {
              //  if(e.clientY >= bounds.top && e.clientY <= bounds.bottom && e.clientX >= bounds.left && e.clientX <= bounds.right) {
                if(e.target == temp_canvas || e.target == pattern_pointer)  {
                    pattern_pointer.style.left = e.clientX + 'px';
                    pattern_pointer.style.top = e.clientY + 'px';
                    pattern_pointer.style.display = 'block';
                }
                else {
                    pattern_pointer.style.display = 'none';
                }
            }
			else if (mouse_down) {
				switch (config.action) {
					case 'paint': _paintRealtime('continue', e.clientX - bounds.left, e.clientY - bounds.top); break;
					case 'shape' : _shapeRealtime('continue', e.clientX - bounds.left, e.clientY - bounds.top); break;
					case 'point' : _point('continue', e.clientX - bounds.left, e.clientY - bounds.top); break;
				}
			}
			// When the cursor is on the whiteboard but not down in pointing mode
			else if (config.action == 'point' && e.target == temp_canvas) {
				_point('moving', e.clientX - bounds.left, e.clientY - bounds.top); 
			}
		},
		keydown: function(e) {
			if (e.target.tagName.toLowerCase() == 'textarea') {
				return;
			}
		},
        paste: function(e) {
            if(self.hasAccess() == false) { e.preventDefault(); }

            if(typeof e.clipboardData.items != 'undefined')  {
                var image = e.clipboardData.items[0];
                if (image.kind == 'file' && image.type.indexOf('image/') !== -1)  {
                    var reader = new FileReader();

                    reader.onload = function() {
                        image_paste_handler(this.result);
                    }

                    reader.readAsDataURL(image.getAsFile());
                }
            }
            else if(e.target.tagName.toLowerCase() != 'textarea') {
                paste_buffer.focus();
            }
        }
	});
 
	$.subscribe(temp_canvas,{
		dragover: function(e) {
			e.preventDefault();
		},
		dragenter: function(e) {
			e.preventDefault();
		},
		drop: function(e) {
			var file = e.dataTransfer.files[0];
            e.preventDefault();
			// no dropping if there's no ownership
			if (!config.access) { return; }
				// only allow image files
			if (typeof file.type == 'undefined' || !file.type.match(/image.*/)) return;
			// read the image and add it to the whiteboard or background
			file_drop_handler(file, e.clientX, e.clientY);

		},
		contextmenu: function(e) {
			e.preventDefault();
		}
	});	

	self = {
		/**
		 * Add an action to the whiteboard
         *
		 * @param action {Object} an object contaning the type of action, the data and the configuration  {type: .., data: .., config: ..}
         * @return {self}
		 */
		addAction: function(action) {
			_addAction(action);
            return this;
		},
        /**
         * Add an image from a data url to the whiteboard
         *
         * @param data_url {String} Data url to add to the whiteboard
         * @param x {Number} The x start position of the image
         * @param y {Number} The y start position of the image
         * @param width {Number} The width of the image
         * @param height {Number} The height of the image
         */
        addImage: function(data_url, x, y, width, height) {
            _addImage(data_url, x, y, width, height);
        },
        /**
         * Add text to the whiteboard
         *
         * @param text {String} The text to add
         * @param properties {Object} Text properties, like color, font, size, etc)
         * @param x {Number} The x coordinate to place the text
         * @param y {Number} The y coordinate to place the text
         * @param width {Number} The width in pixels of the text
         * @param height {Number} The height in pixels of the text
         */
        addText: function(text, properties, x, y, width, height) {
            _addText(text, properties, x, y, width, height);
        },
		/**
		 * Clear the whiteboard
         *
         * @return {whiteboard}
		 */
		clear: function() {
            _clear();
            return this;
		},
		/**
		 * Retrieve all the data from whiteboard actions (paint, shape, etc)
         *
		 * @return {object[]} An array containing a copy of all the whiteboard actions as objects
		 */
		getData: function(){
			return store.get();
		},
		/**
		 * Get the value of the specified property
         *
         * @param property {String} The name of the property
		 * @return {String} the property value
		 */		
		getProperty: function(property) {
			return _getProperty(property);
		},
        /**
         * Get the inner Offset of the whiteboard relatively of the window
         *
         * @return {Object} Object with top, left, right and bottom values
         */
        getOffset: function() {
            return _getOffset();
        },
		/**
		 * Inform if the user is allowed to perform actions on the whiteboard
         *
		 * @return {Boolean} true if the user is allowed to perform actions on the whiteboard, or false if not
		 */
		hasAccess: function() {
			return config.access;
		},
		/**
		 * Redo an undone whiteboard action. Note: when a new action is performed on the whiteboard the list with actions to be redone will be cleared.
         *
		 */
		redo: function() {
			_redo();
		},
		/**
		 * Save a snapshot of the whiteboard.
         *
		 * @param target {string} only allowed value is currently 'local', to save the snapshot local
		 */
		save: function(target) {
			switch (target) {
				case 'local' : _save_whiteboard_snapshot(); break;
			}
		},
		/**
		 * (dis)allow a user to perform actions on the whiteboard
         *
		 * @param access {boolean} true to allow a user to perform actions on the whiteboard, or false to disallow
         * @return {self}
		 */
		setAccess: function(access) {
            _setAccess(access);
            return this;
		},
		/**
		 * set the height and width of the whiteboard
         *
		 * @param width {number} sets the width
		 * @param height {number} sets the height
         * @return {self}
		 */
		setDimensions: function(width, height) {
			_setDimensions(width, height);
            return this;
		},
		/**
		 * returns whether the helper lines are anabled
         *
		 * @return {boolean}
		 */
		helpersEnabled: function () {
			return visible_helpers;
		},
		/**
		 * show hide vertical and horizontal helper lines for the cursor
         *
		 * @param action {string} 'hide' or 'show'
         * @return {self}
		 */
		toggleHelpers: function(action) {
			_toggleHelpers(action);
            return this;
		},
		/**
		 * sets a property of the whiteboard
         *
		 * @param property {string} represents the property to set, can be: 'action', 'shape', 'pattern', 'background', 'lineWidth',
		 * 'fillStyle', 'strokeStyle', 'lineJoin', or 'lineCap'
		 * @param value {string} represents the property value to set
		 */
		setProperty: function(property, value) {
			_setProperty(property, value);
            return this;
		},
		/**
		 * a shorthand to set multiple properties of the whiteboard at the same time
         *
		 * @param properties_object {object} Object that contains key/value pairs of properties and corresponding values
		 */
		setProperties: function(properties_object) {
			for (var property in properties_object) {
				if (properties_object.hasOwnProperty(property)) {
					_setProperty(property, properties_object[property])		
				}
			}
            return this;
		},
        /**
         * Shows or hide the remote pointer on the observer whiteboard
         *
         * @param action {string} Action, either 'hide' or 'show'
         */
        toggleRemotePointer: function(action) {
            if(!$.inArray(action, ['hide', 'show'])) {
                throw new Error('invalid action');
            }
            _toggleRemotePointer(action);
            return this;
        },
		/**
		 * Load Actions (draw operations, etc.) into the whiteboard
         *
		 * @param {array} data An array of objects that contain whiteboard actions.
         * @param {string} action Action, either 'replace' or 'add'. The first option will clear all the data
		 */
		loadActions: function(data, action) {
            if(!$.inArray(action, ['add', 'replace']))   {
                throw new Error('Invalid action');
            }
			_loadActions(data, action);
		},
		/**
		 * Undo a performed whiteboard action
         *
		 */
		undo: function() {
			_undo();
		},
		/**
		 * Fired when a whiteboard action occurs (add, redo, undo or clear);
		 * @event onAction
		 * @param action {string} The action type
		 * @param value {boolean|object} In case of 'clear' simply true, in case of 'add' the data, in case of 'undo'/'redo' true if there items left to undo/redo
         * @returns {self}
		 */
		onAction: function(callback) {
			action_handler = callback;
            return this;
		},
        /**
         * Fired when in editor mode the whiteboard is clicked, to get the coordinates of the current position
         * @event onEditorTarget
         * @param x {number} The x coordinate of the clicked position
         * @param y {number} The y coordinate of the clicked position
         * @returns {self}
         */
        onEditorTarget: function(callback) {
            click_handler = callback;
            return this;
        },
        /**
         * Fired when a file is dropped onto the whiteboard
         * @event onFileDrop
         * @param file {file} The dropped file
         * @param x {number} The mouse x coordinate where the file was dropped
         * @param y {number} The mouse y coordinate where the file was dropped
         */
        onFileDrop: function(callback) {
            file_drop_handler = callback;
            return this;
        },
        /**
         * Fired when an image is pasted on the whiteboard. Note that the image is not added yet as an object. Only the image is captured as a data url and passed a an argument
         * @event onImagePaste
         * @param data_url {string} The pasted image as a data url
         * @returns {self}
         */
        onImagePaste: function(callback) {
            image_paste_handler = callback;
            return this;
        },
        /**
         * Fired when the helper lines are moved
         * @event onHelperMove
         * @param x {number} The x coordinate of the helper's cross point
         * @param y {number} The y coordinate of the helper's cross point
         * @returns {self}
         */
        onHelperMove: function(callback) {
            helper_move_handler = callback;
            return this;
        },
        /**
         * Fires when the helper lines are shown or hidden
         *
         * @event onHelperToggle
         * @param {string} action Either 'show' or 'hide
         * @returns {self}
         */
        onHelperToggle: function(callback) {
            helper_toggle_handler = callback;
            return this;

        },
		/**
		 * Fired when a property is changed
		 * @event onPropertyChange
		 * @param property {string} The name of the property
		 * @param value {string} The value of the property
		 */
		onPropertyChange: function(callback) {
			property_change_handler = callback;
            return this;
		},
		/**
		 * Fired when the cursor is in pointer state on the whitebard
		 * @event onPointerAction
		 * @param x {number} The pointer x coordinate
		 * @param y {number} The pointer y coordinate
		 * @param state {string} The state of the pointer, can be up, down, up_move, or down_move
		 */
		onPointerAction: function(callback) {
			pointer_handler = callback;
            return this;
		}
	}
	return self;
	
	
})({});
