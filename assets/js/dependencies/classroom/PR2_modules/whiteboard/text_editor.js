var PR2 = PR2 || {};

PR2.textEditor = (function(self) {
    var $ = PR2.utils;
    var mode = '';
    var mouse_down = null;
    var editor_focus = false;
    var text_move = function(x, y){};
    var text_resize = function(width, height){};
    var helper_resize = function(width, height){};
    var property_change = function(property, value) {};
    var double_click = function(text, properties, x, y, width, height){};
    var control_enter = function(text, properties, x, y, width, height){};
    var compensate = {left: 0, top: 0};
    var valid_properties = ['size', 'font', 'color', 'bold', 'italic', 'underline', 'align'];
    var clipping =  {left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight};
    var wrapper = $.create('div', document.body, {id: 'pr2_text_editor_wrapper', tabIndex: 1}, {width : "200px", display: 'none'});
    var editor = $.create('textarea', document.body, {id : "pr2_text_editor"}, {width : "200px", color: 'black', fontFamily: 'Arial', textAlign: 'left', fontWeight: 'normal', textDecoration: 'none', fontStyle: 'normal', fontSize: '12px'});
    var lu_handle = $.create('div', wrapper, {id: "pr2_text_editor_handle_nw"}),
        ru_handle = $.create('div', wrapper, {id: "pr2_text_editor_handle_ne"}),
        ld_handle = $.create('div', wrapper, {id: "pr2_text_editor_handle_sw"}),
        rd_handle = $.create('div', wrapper, {id: "pr2_text_editor_handle_se"});

    var _toggle = function(action) {
        var display = action == 'show' ? 'block' : 'none';
        _setStyles('display', display);

        if(action == 'show')  {
            setTimeout(function() {  editor.focus() }, 30);
        }
        else {
            editor.value = "";
        }
    };

    var _synchronizeEditor = function() {
        editor.style.left = wrapper.offsetLeft + 'px';
        editor.style.top = wrapper.offsetTop + 'px';
        editor.style.width = wrapper.offsetWidth - 6 + 'px';
        editor.style.height = wrapper.offsetHeight - 6 +'px';
    };

    var _resize = function(width, height) {
        editor.style.width = wrapper.style.width =  width + 'px';
        editor.style.height = wrapper.style.height = height + 'px';
        text_resize(width, height);
    };


    var _moveTo = function(x, y) {
        $.css(wrapper, {left: x + 'px', top: y + 'px' });
        $.css(editor, {left: x + 'px', top: y + 'px' });
        text_move(x, y);
    };

    var _setStyles = function(style, value) {
        wrapper.style[style] = value;
        editor.style[style] = value;
    };

    var _setProperty = function(name, value) {
        property_change(name, value);
        switch (name) {
            case 'size':
                name = 'fontSize';
                value = value + 'px';
                break;
            case 'font':
                name = 'fontFamily';
                break;
            case 'bold':
                name = 'fontWeight';
                value = value == true ? 'bold' : 'normal';
                break;
            case 'underline':
                name = 'textDecoration';
                value = value == true ? 'underline' : 'none';
                break;
            case 'italic':
                name = 'fontStyle';
                value = value == true ? 'italic' : 'normal';
                break;
            case 'align':
                name = 'textAlign';
                break;
        }
        _setStyles(name, value);

    };

    //noinspection FunctionWithInconsistentReturnsJS
    var _getProperty = function(name) {
        switch (name) {
            case 'size':
                return editor.style.fontSize.slice(0, -2);
            case 'color':
                return editor.style.color;
            case 'font':
                return editor.style.fontFamily;
            case 'bold':
                return editor.style.fontWeight == 'bold';
            case 'underline':
                return editor.style.textDecoration == 'underline';
            case 'italic':
                return editor.style.fontStyle == 'italic';
            case 'align':
                return editor.style.textAlign;
        }
    };

    var _getProperties = function(property_list) {
        var properties = {};

        property_list.forEach(function(property) {
             properties[property] = _getProperty(property);
        });
        return properties;
    };

    var _setProperties = function(object) {
        Object.getOwnPropertyNames(object).forEach(function(item) {
            _setProperty(item, object[item]);
        });
    };

    var _setText = function(text) {
        editor.value = text;
    };

    $.subscribe(editor, {
        mouseenter: function() {
            wrapper.style.borderColor = ru_handle.style.backgroundColor = rd_handle.style.backgroundColor = ld_handle.style.backgroundColor  = lu_handle.style.backgroundColor  = 'red';
            editor_focus = true;
        } ,
        mouseout: function() {
            if(mode == 'resizing') {  return; }
            wrapper.style.borderColor = ru_handle.style.backgroundColor = rd_handle.style.backgroundColor = ld_handle.style.backgroundColor  = lu_handle.style.backgroundColor  = '#3399FF';
            editor_focus = false;
        },
        mousedown: function(e)  {
            if (e.ctrlKey) {
                mouse_down = this;
                window.getSelection().collapse(this, 0);
                editor.classList.add('hide-selection');
                compensate = {left: e.clientX - wrapper.offsetLeft, top: e.clientY - wrapper.offsetTop};
            }
        },
        dblclick: function() {
            double_click(editor.value,_getProperties(valid_properties), editor.offsetLeft + 1, editor.offsetTop + 1, editor.offsetWidth - 2, editor.offsetHeight -2);
        },
        keydown: function(e) {
            if(e.ctrlKey) {
                switch(e.keyCode) {
                    case 66:
                        e.preventDefault();
                        editor.style.fontWeight = editor.style.fontWeight == 'bold' ? 'normal' : 'bold';
                        break;
                    case 73:
                        e.preventDefault();
                        editor.style.fontStyle = editor.style.fontStyle == 'italic' ? 'normal' : 'italic';
                        break;
                    case 85:
                        e.preventDefault();
                        editor.style.textDecoration = editor.style.textDecoration == 'underline' ? 'none' : 'underline';
                        break;
                    case 76:
                        e.preventDefault();
                        editor.style.textAlign = 'left';
                        break;
                    case 82:
                        e.preventDefault();
                        editor.style.textAlign = 'right';
                        break;
                    case 77:
                        e.preventDefault();
                        editor.style.textAlign = 'center';
                        break;
                }
            }
        }
    });


    $.subscribe(window, {
        mousemove: function(e) {
            if(mouse_down == null) {
                return;
            }
            // clip the text editor to the specified borders
            else if(e.clientX <= clipping.left || e.clientX >= clipping.right || e.clientY <= clipping.top || e.clientY >= clipping.bottom) {return;}
            switch(mouse_down) {
                case editor:
                    _moveTo(e.clientX - compensate.left, e.clientY - compensate.top);
                    break;
                case lu_handle:
                    wrapper.style.left = e.clientX + 'px';
                    wrapper.style.top = e.clientY + 'px';
                    wrapper.style.height = editor.offsetTop + editor.offsetHeight - e.clientY + 'px';
                    wrapper.style.width = editor.offsetLeft + editor.offsetWidth - e.clientX + 'px';
                    break;
                case ru_handle:
                    wrapper.style.width = e.clientX - wrapper.offsetLeft + 'px';
                    wrapper.style.top = e.clientY  + 'px';
                    wrapper.style.height = editor.offsetTop + editor.offsetHeight - 2 - e.clientY + 'px';
                    break;
                case ld_handle:
                    wrapper.style.left = e.clientX + 'px';
                    wrapper.style.height = e.clientY - wrapper.offsetTop + 'px';
                    wrapper.style.width = editor.offsetLeft + editor.offsetWidth - e.clientX + 'px';
                    break;
                case rd_handle:
                    wrapper.style.width = e.clientX - wrapper.offsetLeft + 'px';
                    wrapper.style.height = e.clientY - wrapper.offsetTop + 'px';
                    break;
            }
            helper_resize(wrapper.offsetWidth, wrapper.offsetHeight);

        },
        mouseup: function() {
            if(mode == 'resizing') {
                document.body.style.cursor = "default";
                _synchronizeEditor();
                _resize(editor.offsetWidth, editor.offsetHeight);
            }
            mode = '';
            mouse_down = null;
            editor.classList.remove('hide-selection');

        },
        keydown: function(e) {
            if (e.ctrlKey && editor_focus) {
                if(e.keyCode == 13) {
                    control_enter(editor.value,_getProperties(valid_properties), editor.offsetLeft + 1, editor.offsetTop + 1, editor.offsetWidth - 2, editor.offsetHeight -2);
                    return;
                }
                editor.style.cursor = 'move';
            }
        },
        keyup: function() {
          //  if (e.keyCode == 17 && editor_focus) {
                editor.style.cursor = 'text';
          //  }
        }
    });

    $.subscribe([lu_handle, ru_handle, ld_handle, rd_handle], {
        mousedown: function() {
            mode = 'resizing';
            switch(this) {
                case lu_handle: document.body.style.cursor  = 'nw-resize'; break;
                case ru_handle: document.body.style.cursor  = 'ne-resize'; break;
                case ld_handle: document.body.style.cursor  = 'sw-resize'; break;
                case rd_handle: document.body.style.cursor  = 'se-resize'; break;
            }
            mouse_down = this;
        },
        mouseover: function() {
            wrapper.style.borderColor = ru_handle.style.backgroundColor = rd_handle.style.backgroundColor = ld_handle.style.backgroundColor  = lu_handle.style.backgroundColor  = 'red';
        } ,
        mouseout: function() {
            if(mode == 'resizing') {  return; }
            wrapper.style.borderColor = ru_handle.style.backgroundColor = rd_handle.style.backgroundColor = ld_handle.style.backgroundColor  = lu_handle.style.backgroundColor  = '#3399FF';
        }
    }, false);

    self = {
        /**
         * Sets the text of the text editor
         *
         * @param {string} text The text to set the editor to
         * @returns {self}
         */
        setText: function(text) {
            if(typeof text != 'string')  {
                throw new Error('First parameter must be a string');
            }
            _setText(text);
            return this;
        },
        /**
         * Toggle the visibility of the text editor
         *
         * @param {string} action The toggle action, either 'hide' or 'show'
         * @returns {self}
         */
        toggle: function(action) {
            if(!$.inArray(action, ['hide', 'show'])) {
                throw new Error('Invalid action');
            }
            _toggle(action);
            return this;
        },
        /**
         * Get the inner dimensions and text of the text editor
         *
         * @returns {string[]}
         */
        getTextData: function() {
            return [editor.value, _getProperties(valid_properties), editor.offsetLeft + 1, editor.offsetTop, editor.offsetWidth - 2, editor.offsetHeight -2]
        },
        /**
         * Move the text editor to the specified coordinates
         *
         * @param {number} x The x coordinate to move the editor to
         * @param {number} y The y coordinate to move the editor to
         * @returns {self}
         */
        moveTo: function(x, y) {
            _moveTo(x, y);
            return this;
        },
        /**
         * Resize the text editor to the specified widht and height
         * @param width The width of the text editor
         * @param height The height of the text editor
         * @returns {self}
         */
        resize: function(width, height) {
            _resize(width, height);
            return this;
        },
        /**
         * Set the outer regions to which the text editor will clip
         *
         * @param {object} dimensions Object that specifies the top, left, right and bottom border to clip the editor to
         * @returns {self}
         */
        setClipping: function(dimensions) {
            clipping = dimensions;
            return this;
        },
        /**
         * Get the value of the specified property
         *
         * @param {string} name Name of the property, can be 'size', 'font', 'color', 'bold', 'italic', 'underline', 'align'
         * @returns {string}
         */
        getProperty: function(name) {
            if(!$.inArray(name, valid_properties)) {
                throw new Error('Invalid action');
            }
            return _getProperties(name);
        },
        /**
         * Set the value of the specified property
         *
         * @param {string} name The name of the property, can be 'size', 'font', 'color', 'bold', 'italic', 'underline', 'align'
         * @param {string} value The value of the property
         * @returns {self}
         */
        setProperty: function(name, value) {
            if(!$.inArray(name, valid_properties)) {
                throw new Error('Invalid action');
            }
            _setProperty(name, value);
            return this;
        },
        /**
         * Shorthand for multiple 'setProperty' calls
         * @param {object} properties Key/value pairs of properties
         * @returns {self}
         */
        setProperties: function(properties) {
            _setProperties(properties);
            return this;
        },
        /**
         * Fires when the text editor is double clicked and returns its data: text, coordinates and dimensions
         *
         * @event onDoubleClick
         * @param {string} text
         * @param {string} left
         * @param {string} top
         * @param {string} width
         * @param {string} height
         * @returns {self}
         */
        onDoubleClick: function(callback) {
            double_click = callback;
            return this;
        },
        /**
         * Fires when Ctrl Etner is pressed and returns its data: text, coordinates and dimensions
         *
         * @event onCtrlEnter
         * @param {string} text
         * @param {string} left
         * @param {string} top
         * @param {string} width
         * @param {string} height
         * @returns {self}
         */
        onCtrlEnter: function(callback) {
            control_enter = callback;
            return this;
        },
        /**
         * Fires when the text editor is moved
         *
         * @event onMove
         * @param {string} x
         * @param {string} y
         * @returns {self}
         */
        onMove: function(callback) {
            text_move = callback;
            return this;
        },
        /**
         * Fires when the text editor is resized
         *
         * @event onResize
         * @param {string} width
         * @param {string} height
         * @returns {self}
         */
        onResize: function(callback) {
            text_resize = callback;
            return this;
        },
        /**
         * Fires when a property is set to a new value
         *
         * @event onPropertyChange
         * @param {string} name Name of the property
         * @param callback value Value of the property
         * @returns {self}
         */
        onPropertyChange: function(callback) {
          property_change = callback;
            return this;
        },
        /**
         * Fires when the handles of the text editor are being resized
         * @param callback
         * @returns {self}
         */
        onHandleResize: function(callback) {
            helper_resize = callback;
            return this;
        }
    };
    return self;
})({});