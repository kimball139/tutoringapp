var PR2 = PR2 || {};

PR2.imageEditor = (function(self) {
    var $ = PR2.utils;
    var backspace = function(){};
    var image_loaded = function(dim) {};
    var image_updated = function(dim) {};
    var image_move = function(x, y){};
    var image_resize = function(dim){};
    var crop_borders = function(dim){};
    var double_click = function(data_url, x, y, width, height){};
    var enter = function(data_url, x, y, width, height){};
    var image_helper_resize = function(dim){};
    var mode = ''; // can be crop or move
    var crop_cursor = "url('icons/crop.cur'), default";
    var mouse_down = null;
    var processing = false;
    var clipping =  {left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight};
    var compensate = {left: 0, top: 0};
    var config = {},
        wrapper = $.create('div', document.body, {id: 'pr2_image_editor_wrapper', tabIndex: 1}, {display: 'none'}),
        canvas = $.create('canvas', document.body, {"id" : "pr2_image_editor_canvas"}, {display: 'none'}),
        ctx = canvas.getContext('2d'),
        crop_lines = $.create('div', document.body, {"id" : "pr2_image_editor_croplines", "display" : "none"}),
        image_lu_handle = $.create('div', wrapper, {id: "pr2_image_editor_handle_nw"}),
        image_ru_handle = $.create('div', wrapper, {id: "pr2_image_editor_handle_ne"}),
        image_ld_handle = $.create('div', wrapper, {id: "pr2_image_editor_handle_sw"}),
        image_rd_handle = $.create('div', wrapper, {id: "pr2_image_editor_handle_se"});

    var _initCropping = function(x, y) {
        document.body.style.cursor = crop_cursor;
        mode = 'cropping';
        $.css(crop_lines, {display: 'block', left: x + 'px', width: '0px', height: '0px', top: y + 'px'});
        config.crop.left = x - canvas.offsetLeft;
        config.crop.top = y - canvas.offsetTop;
    };

    var _moveCropBorders = function(x, y) {
        var max_x = Math.min(config.dim.right, x);
        var max_y = Math.min(config.dim.bottom, y);
        $.css(crop_lines,{ width: max_x - crop_lines.offsetLeft - 2 + 'px', height: max_y - crop_lines.offsetTop - 2 + 'px'});
        config.crop.right = config.dim.right - max_x;
        config.crop.bottom = config.dim.bottom - max_y;
        crop_borders(config.crop);
    };

    var _setCropBorders = function(borders) {
        var left = config.dim.left + borders.crop_left + 'px';
        var top = config.dim.top + borders.crop_top + 'px';
        var width = config.dim.width - borders.crop_left - borders.crop_right - 2 + 'px';
        var height = config.dim.height - borders.crop_top - borders.crop_bottom - 2 + 'px';

        $.css(crop_lines, {display: 'block', left: left, top: top, width: width, height: height});
    };

    var _resetCropBorders = function() {
        crop_lines.style.display = 'none';
        config.crop = {left: 0, top: 0, right: 0, bottom: 0};
        crop_borders(config.crop);
    };

    var _crop = function(dimensions) {
        if(crop_lines.style.display == 'none') {
            return;
        }
        var new_width = config.dim.width - dimensions.right - dimensions.left;
        var new_height = config.dim.height - dimensions.bottom - dimensions.top;
        var  img_data = ctx.getImageData(dimensions.left, dimensions.top, new_width, new_height);
        // reset canvas dimensions
        canvas.width = new_width;
        canvas.height = new_height;
        wrapper.style.width = new_width - 2 + 'px' ;
        wrapper.style.height = new_height - 2 + 'px';
        canvas.style.top = wrapper.style.top = crop_lines.style.top;
        canvas.style.left = wrapper.style.left = crop_lines.style.left;

        ctx.putImageData(img_data, 0, 0);

        config.data_url = canvas.toDataURL();
        config.rotate = 0;
        config.rotate_factor = 1;
        config.constrain = false;
        config.flip_h =  false;
        config.flip_v = false;
        config.dim = {
            left: crop_lines.offsetLeft,
            top: crop_lines.offsetTop,
            right: crop_lines.offsetLeft + new_width,
            bottom: crop_lines.offsetTop + new_height,
            height: new_height,
            width: new_width,
            aspect: new_width / new_height
        };
        config.crop = { left:  0,right: 0, top: 0,  bottom: 0};
        _resetCropBorders();
    };

    var _moveTo = function(x, y) {
        config.dim.left = x;
        config.dim.top = y;
        config.right = x + config.left;
        config.bottom = y + config.top;
        wrapper.style.left = canvas.style.left = config.dim.left + 'px';
        wrapper.style.top = canvas.style.top = config.dim.top + 'px';
        image_move(x, y);
    };

    var _resize = function(x, y, width, height) {
        config.dim.left = x ||config.dim.left;
        config.dim.top = y || config.dim.top;
        config.dim.right = x + width;
        config.dim.bottom = y + height;
        config.dim.width = width;
        config.dim.height = height;
        config.dim.aspect = width / height;
        image_resize(_getdim());
        _processImage('update');
    };

    var _rotate = function(direction) {
        var temp;
        var center = {
            x: canvas.offsetLeft + config.dim.width / 2,
            y: canvas.offsetTop + config.dim.height / 2
        };



        direction == 'cw' ? config.rotate += (90 * config.rotate_factor ) : (config.rotate -= 90 * config.rotate_factor);

        //normalize
        if (config.rotate == 360) {
            config.rotate = 0;
        }
        else if (config.rotate == -90) {
            config.rotate = 270;
        }

        config.dim.top = center.y - (config.dim.width /  2);
        config.dim.left = center.x - (config.dim.height / 2);
        temp = config.dim.width;
        config.dim.width = config.dim.height;
        config.dim.height = temp;
        config.dim.right = config.dim.left + config.dim.width;
        config.dim.bottom = config.dim.top + config.dim.height;

        _moveTo(config.dim.left, config.dim.top);
        _processImage('update');
    };

    var _flip = function(axis) {


        if(axis == 'horizontal') {
            config.rotate_factor = ( config.flip_h) ? 1 : - 1;
            config.flip_h = !config.flip_h;
        }
        else {
            config.rotate_factor = ( config.flip_h) ? 1 : - 1;
            config.flip_v = !config.flip_v;
        }
        //config.rotate =
        _processImage('update');

    };

    var _getdim = function() {
        return { left: canvas.offsetLeft, top: canvas.offsetTop, width: canvas.width, height: canvas.height}
    };

    var _load = (function() {
        var img = new Image();
        var _x;
        var _y;

        img.onload = function() {
            // set canvas dim
            canvas.width = this.width;
            canvas.height =  this.height;

            // set edit image properties
            config = {
                data_url : this.src,
                o_data_url: this.src,
                rotate : 0,
                rotate_factor : 1,
                constrain : false,
                flip_h : false,
                flip_v : false,
                o_dim: {
                    left: _x,
                    top: _y,
                    right: _x + this.width,
                    bottom: _y + this.height,
                    height: this.height,
                    width: this.width,
                    aspect : this.width / this.height
                },
                dim : {
                    left: _x,
                    top: _y,
                    right: _x + this.width,
                    bottom: _y + this.height,
                    height: this.height,
                    width: this.width,
                    aspect : this.width / this.height
                },
                crop : {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                }
            };
            _processImage('load');
            img.src = "";
        };
        return function(data_url, x, y) {
            img.src = data_url;
            _x = x;
            _y = y;
        }
    })();

    var _resetImage = function() {
        Object.getOwnPropertyNames(config.o_dim).forEach(function(key) {
            config.dim[key] = config.o_dim[key];
        });
        config.rotate = 0;
        config.rotate_factor = 1;
        config.flip_h = false;
        config.flip_v = false;
        config.crop = {left: 0, top: 0, right: 0, bottom: 0};
        config.data_url = config.o_data_url;
        _processImage('update');
    };

    var _processImage = (function(){
        var img = new Image();
        var _type;
        var width;
        var height;
        var askew;

        img.onload = function() {
            ctx.drawImage(img, 0, 0, width, height);
            ctx.restore();
            processing = false;
            _type == 'load' ? image_loaded(_getdim()) : image_updated(_getdim());
        };

        return function(type) {
            if(processing) {
                return;
            }
            processing = true;
            _type = type;
            askew = (config.rotate == 90 || config.rotate == 270);
            _resetCropBorders();

            canvas.width = config.dim.width;
            canvas.height = config.dim.height;
            canvas.style.top = config.dim.top + 'px';
            canvas.style.left = config.dim.left + 'px';
            wrapper.style.width = config.dim.width - 2 + 'px';
            wrapper.style.height = config.dim.height - 2 + 'px';
            wrapper.style.top = config.dim.top + 'px';
            wrapper.style.left = config.dim.left + 'px';

            ctx.save();
            width = askew ? config.dim.height : config.dim.width;
            height = askew ? config.dim.width : config.dim.height;

            if (config.rotate == 90) {
                ctx.translate(config.dim.width, 0);
            }
            else if (config.rotate == 270) {
                ctx.translate(0, config.dim.height);
            }
            else if (config.rotate == 180) {
                ctx.translate(config.dim.width, config.dim.height);
            }
            ctx.rotate((config.rotate/180) * Math.PI);

            if (config.flip_h) {
                if(askew) {
                    ctx.scale(1, -1);
                    ctx.translate(0, -height);
                }
                else {
                    ctx.scale(-1, 1);
                    ctx.translate(-width, 0);
                }
            }
            if (config.flip_v) {
                if(askew) {
                    ctx.scale(-1, 1);
                    ctx.translate(-width, 0);
                }
                else {
                    ctx.scale(1, -1);
                    ctx.translate(0, -height);
                }
            }
            img.src = "";
            img.src = config.data_url;
        }
    })();

    var _toggle = function(action) {
        var show = action == 'hide' ? 'none' : 'block';

        wrapper.style.display = show;
        canvas.style.display = show;
        if(show == 'none') {
            crop_lines.style.display = show;
        }
    };

    $.subscribe(crop_lines, {
        mousedown: function(e) {
            mouse_down = this;
            if (e.ctrlKey) {
                _initCropping(e.clientX, e.clientY);
            }
        },
        keydown: function() {

        }
    });

    $.subscribe(wrapper, {
        mousedown: function(e) {
            compensate = {left: e.clientX - wrapper.offsetLeft, top: e.clientY - wrapper.offsetTop};
            mouse_down = this;
            wrapper.focus();
            if (e.ctrlKey) {
                _initCropping(e.clientX, e.clientY);
            }
            else {
                document.body.style.cursor = 'move';
                _resetCropBorders();
                mode = 'moving';
            }
        },
        dblclick: function() {
            return double_click(canvas.toDataURL(), config.dim.left, config.dim.top, config.dim.width, config.dim.height);
        },
        keydown: function(e) {
            if(e.ctrlKey)  {
                document.body.style.cursor = crop_cursor;
            }
            else {
                switch (e.keyCode) {
                    case 8:
                        e.preventDefault();
                        backspace();
                        break;
                    case 38:
                        this.style.top = this.offsetTop - 1 + 'px';
                        this.style.bottom = parseInt(this.style.bottom.slice(0, -2), 10) + 1 + 'px';
                        canvas.style.top = canvas.offsetTop - 1 + 'px';
                        break;
                    case 40:
                        this.style.top = this.offsetTop + 1 + 'px';
                        this.style.bottom = parseInt(this.style.bottom.slice(0, -2), 10) - 1 + 'px';
                        canvas.style.top = canvas.offsetTop + 1 + 'px';
                        break;
                    case 37:
                        this.style.left = this.offsetLeft - 1 + 'px';
                        this.style.right = parseInt(this.style.right.slice(0, -2), 10) + 1 + 'px';
                        canvas.style.left = canvas.offsetLeft - 1 + 'px';
                        break;
                    case 39:
                        this.style.left = this.offsetLeft + 1 + 'px';
                        this.style.right = parseInt(this.style.right.slice(0, -2), 10) - 1 + 'px';
                        canvas.style.left = canvas.offsetLeft + 1 + 'px';
                        break;
                }
                image_move(this.offsetLeft, this.offsetTop);
            }
        },
        keyup: function() {
            document.body.style.cursor = 'move';
        },
        mouseenter: function(e) {
            if(mode == 'resizing') return;
            this.focus();
            document.body.style.cursor =  (e.ctrlKey) ? crop_cursor : "move";
        },
        mouseout: function() {
            if(mode == 'resizing') return;
            this.blur();
            document.body.style.cursor = "default";
        }
    });

    $.subscribe(window, {
        mousemove: function(e) {
            if(mouse_down == null) {
                return;
            }
            else if(e.clientX <= clipping.left || e.clientX >= clipping.right || e.clientY <= clipping.top || e.clientY >= clipping.bottom) {return;}

            switch(mouse_down) {
                case wrapper:
                   e.ctrlKey ? _moveCropBorders(e.clientX, e.clientY) : _moveTo(e.clientX - compensate.left, e.clientY - compensate.top);
                    break;
                case crop_lines:
                    _moveCropBorders(e.clientX, e.clientY);
                    break;
                case image_lu_handle:
                    wrapper.style.left = e.clientX + 'px';
                    wrapper.style.top = e.clientY + 'px';
                    wrapper.style.height = config.dim.top + config.dim.height - 2 - e.clientY + 'px';
                    wrapper.style.width = config.dim.left + config.dim.width - 2 - e.clientX + 'px';
                    break;
                case image_ru_handle:
                    wrapper.style.width = e.clientX - wrapper.offsetLeft + 'px';
                    wrapper.style.top = e.clientY  + 'px';
                    wrapper.style.height = config.dim.top + config.dim.height - 2 - e.clientY + 'px';
                    break;
                case image_ld_handle:
                    wrapper.style.left = e.clientX + 'px';
                    wrapper.style.height = e.clientY - wrapper.offsetTop + 'px';
                    wrapper.style.width = config.dim.left + config.dim.width - 2 - e.clientX + 'px';
                    break;
                case image_rd_handle:
                    wrapper.style.width = e.clientX - wrapper.offsetLeft + 'px';
                    wrapper.style.height = e.clientY - wrapper.offsetTop + 'px';
                    break;
            }
            if(mouse_down != wrapper) {
                image_helper_resize({
                    x: wrapper.style.left.slice(0, -2),
                    y: wrapper.style.top.slice(0, -2),
                    width: wrapper.style.width.slice(0, -2),
                    height: wrapper.style.height.slice(0, -2)
                });
            }
        },
        mouseup: function() {
            if(mode == 'resizing') {
                _resize(wrapper.offsetLeft, wrapper.offsetTop, wrapper.offsetWidth - 2, wrapper.offsetHeight - 2);
                wrapper.blur();
            }
            else if(mode == 'moving') {
                config.dim.left = canvas.offsetLeft;
                config.dim.right = canvas.offsetLeft + canvas.offsetWidth;
                config.dim.top = canvas.offsetTop;
                config.dim.bottom = canvas.offsetTop + canvas.offsetHeight;
            }
            mode = '';
            mouse_down = null;

        },
        keydown: function(e) {
            if(e.keyCode == 13) {
                if(crop_lines.style.display == 'block') {
                    _crop(config.crop);
                }
                else {
                    enter(canvas.toDataURL(), config.dim.left, config.dim.top, config.dim.width, config.dim.height);
                }
            }
        }
    });

    $.subscribe([image_lu_handle, image_ru_handle, image_ld_handle, image_rd_handle], {
        mousedown: function() {
            mode = 'resizing';
            switch(this) {
                case image_lu_handle: document.body.style.cursor  = 'nw-resize'; break;
                case image_ru_handle: document.body.style.cursor  = 'ne-resize'; break;
                case image_ld_handle: document.body.style.cursor  = 'sw-resize'; break;
                case image_rd_handle: document.body.style.cursor  = 'se-resize'; break;
            }
            mouse_down = this;
        }
    }, false);

    self = {
        /**
         * Crop the image to the specified borders
         *
         * @param {object} borders Object with the top, left, right and bottom border values
         * @returns {self}
         */
        crop: function(borders) {
            if(typeof borders != 'object')  {
                throw new Error('parameter is not object');
            }
            _crop(borders);
            return this;
        },
        /**
         * Add a visual cropping area to the image
         *
         * @param {object} borders Object with the top, left, right and bottom border values
         * @returns {self}
         */
        setCropBorders: function(borders) {
            if(typeof borders != 'object')  {
                throw new Error('parameter is not object');
            }
            else if(!$.isInt(borders.crop_top) || !$.isInt(borders.crop_left) || !$.isInt(borders.crop_right) || !$.isInt(borders.crop_bottom)) {
               throw new Error('Object values must all be integers');
            }
            _setCropBorders(borders);
            return this;
        },
        /**
         * Rotate the image in a clockwise or counter clockwise direction
         *
         * @param {string} direction The direction ('cw' or 'ccw') to rotate
         * @returns {self}
         */
        rotate: function(direction) {
            if(!$.inArray(direction, ['cw', 'ccw'])) {
                throw new Error('Invalid direction');
            }
            _rotate(direction);
            return this;
        },
        /**
         * Flip the image in a horizontal or vertical position
         *
         * @param {string} axis The axis ('horizontal' or 'vertical') on which the image is flipped
         * @returns {self}
         */
        flip: function(axis) {
            if(!$.inArray(axis, ['vertical', 'horizontal'])) {
                throw new Error('Invalid axis');
            }
            _flip(axis);
            return this;
        },
        /**
         * Get the image data from the image editor
         *
         * @returns {{data_url: string, left: number, top: number, width: number, height: number}}
         */
        getImage: function() {
          return {
              data_url: canvas.toDataURL(),
              left: config.dim.left,
              top: config.dim.top,
              width: config.dim.width,
              height: config.dim.height
          };
        },
        /**
         * Load a data url image in the image editor
         *
         * @param {string} data_url The data url image to load
         * @param {number} [x] The x coordinate of the image in the window
         * @param {number} [y] The y coordinate of the image in the window
         * @returns {self}
         */
        load: function(data_url, x, y) {
            if(typeof data_url != 'string') {
                throw new Error('first parameter is not a data url string');
            }
            else if(!$.isInt(x) || !$.isInt(y))  {
                throw new Error('second and third parameters must be integers');
            }
            _load(data_url, x || 0, y || 0);
            return this;
        },
        /**
         * Show or hide the image editor
         *
         * @param {string} action The toggle action: 'hide' or 'show'
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
         * Inform whether the image editor is visible or not
         *
         * @returns {boolean}
         */
        isVisible: function() {
            return wrapper.style.display == 'block';
        },
        /**
         * Reset the image to the original state
         *
         * @returns {self}
         */
        resetImage: function() {
            _resetImage();
            return this;
        },
        /**
         * Move the image the specified x and y location
         *
         * @param {number} x The x coordinate of the image in the window
         * @param {number} y The y coordinate of the image in the window
         * @returns {self}
         */
        moveTo: function(x, y) {
            _moveTo(x, y);
            return this
        },
        /**
         * Resize the image to the specified width and height
         *
         * @param {number} width The width in pixels
         * @param {number} height The height in pixels
         * @returns {self}
         */
        resize: function(width, height) {
            _resize(undefined, undefined, width, height);
            return this;
        },
        /**
         * Set the outer regions to which the image editor will clip
         *
         * @param {object} borders Object that specifies the top, left, right and bottom border to clip the editor to
         * @returns {self}
         */
        setClipping: function(borders) {
            if(!$.isInt([borders.left, borders.top, borders.bottom, borders.right])) {
                throw new Error('All borders must be integer values');
            }
            clipping = borders;
            return this;
        },
        /**
         * Fires when the backspace is pressed, preventing default back navigation
         *
         * @returns {self}
         */
        onBackSpace: function(callback) {
           backspace = callback;
            return this;
        },
        /**
         * Fires when the image editor is double clicked and returns a data url from the image, and its dimensions
         *
         * @event onDoubleClick
         * @param {string} data_url The data url of the edited image
         * @param {number} left The left corner (x coordinate) of the image
         * @param {number} top The top corner (y coordinate) of the image
         * @param {number} width The width of the image
         * @param {number} height The height of the image
         * @returns {self}
         */
        onDoubleClick: function(callback) {
            double_click = callback;
            return this;
        },
        onEnter: function(callback) {
            enter = callback;
            return this;
        },
        /**
         * Fires when the crop lines of the image editor are resized and returns the crop borders of the image
         *
         * @event onCropLinesResize
         * @param {object} crop_borders (top, left, bottom, right)
         * @returns {self}
         */
        onCropLinesResize: function(callback) {
            crop_borders = callback;
            return this;
        },
        /**
         * Fires when the image editor is updated and returns coordinates and dimensions of the image (top, left, width, height)
         *
         * @event onUpdate
         * @param {object} image_data
         * @returns {self}
         */
        onUpdate: function(callback) {
            image_updated = callback;
            return this;
        },
        /**
         * Fires when an image is loaded into the editor and returns coordinates and dimensions of the image (left, top, width, height)
         *
         * @event onLoad
         * @param {object} image_data
         * @returns {self}
         */
        onLoad: function(callback) {
            image_loaded = callback;
            return this;
        },
        /**
         * Fires when the image editor is moved and returns its coordinates
         *
         * @event onMove
         * @param {number} x The x coordinate in the window
         * @param {number} y The y coordinate in the window
         * @returns {self}
         */
        onMove: function(callback) {
            image_move = callback;
            return this;
        },
        /**
         * Fires when the image editor is resized and returns coordinates and dimensions of the image (left, top, width, height)
         *
         * @event onResize
         * @param {object} image_data The image coordinates and dimensions
         * @returns {self}
         */
        onResize: function(callback) {
            image_resize = callback;
            return this;
        } ,
        /**
         * Fires when the handles of the image editor are resized (they are helpers for the image editor) and returns coordinates and dimensions of the image (left, top, width, height)
         *
         * @event onHandleResize
         * @param {object} image_data The image coordinates and dimensions
         * @returns {self}
         */
        onHandleResize: function(callback) {
            image_helper_resize = callback;
            return this;
        }
    };

    return self;
})({});