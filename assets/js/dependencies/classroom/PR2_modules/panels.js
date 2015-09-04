var PR2 = PR2 || {};

PR2.panels = (function(self) {
    var ids = [];
    var zIndexes = [];
    var panels = [];
    var $ = PR2.utils;
    var drag_compensate = {x: 0, y: 0};
    var drag_element = null;

    var _maxZ = function() {
        return zIndexes.sort(function(a , b){
            return a - b;
        })[zIndexes.length-1] || 2000;
    };

    var _create = function(id, title, x, y, width) {
        var self;
        var newZ = _maxZ() + 1;
        var panel_wrapper = $.create('div', document.body, {id: "pr2_panelwrap_"+ id, class: "pr2_panel_wrapper"}, {zIndex: newZ, top: y + 'px', left: x + 'px', width: width + 'px'}),
            panel_bar  = $.create('div', panel_wrapper),
            panel_title = $.create('div', panel_bar, {class: 'pr2_panel_bar_title', html: title}),
            panel_toggle = $.create('div', panel_bar, {class: "pr2_panel_bar_toggle", "data-value" : "open"}),
            panel = $.create('div', panel_wrapper, {id: "pr2_panel_" + id}, {display: 'block'});

        var _add = function(type, block, align) {
            switch (type) {
                case 'h-spacer': $.create('div', panel, {"class" : "pr2_panel_hspacer"}); break;
                case 'header': $.create('div', panel, {class: "pr2_panel_header", html: block.label}); break;
                case 'block': _addBlock(block, align); break;
            }
        };

        var _getValue = function(id) {
            var element = $.get(panel.id + '_' + id);

            if(element != null && element.tagName.toLowerCase() == 'input') {
                return element.value;
            }
            else {
                throw new Error('This is not a textfield');
            }
        };

        var _getValues = function(ids) {
            var result = {};

            ids.forEach(function(id) {
                result[id] = _getValue(id);
            });
            return result;
        };

        var _getIntValues = function(ids) {
            var result = {};

            ids.forEach(function(id) {
                result[id] = parseInt(_getValue(id), 10);
            });
            return result;
        };

        var _setValue = function(id, value) {
            var element = $.get(panel.id + '_' + id);

            if(element != null && element.tagName.toLowerCase() == 'input') {
                if(typeof value == 'undefined') {
                    throw new Error('No value was passed as an argument');
                }
                element.value = value;
            }
            else {
                throw new Error('This is not a textfield');
            }
        };

        var _setSelect = function(id, value) {
            $.get(panel.id + '_' + id).value = value;
        };

        var _setButtonGroup = function(id, value) {
            var children = $.get(panel.id + '_' + id).children;

            for(var i = 0; i < children.length; i++) {
                if(children[i].dataset.value == value)    {
                    children[i].classList.add('pr2_panel_button_selected');
                }
                else {
                    children[i].classList.remove('pr2_panel_button_selected');
                }
            }
        };

        var _setToggleButton = function(id, value) {
            var element = $.get(panel.id + '_' + id);

            if(value == 'on') {
                element.dataset.value = 'on';
                element.style.backgroundPosition = element.dataset.on;
                element.classList.add('pr2_panel_button_selected');
            }
            else {
                element.dataset.value = 'off';
                element.style.backgroundPosition = element.dataset.off;
                element.classList.remove('pr2_panel_button_selected');
            }
        };

        var _moveTo = function(x, y) {
            panel_wrapper.style.top = y + 'px';
            panel_wrapper.style.left = x + 'px';
        };



        var _addBlock = function(block, align) {
            var new_block = $.create('div', panel, {class: 'pr2_panel_block'}, {textAlign : align || 'left'});

            Object.getOwnPropertyNames(block).forEach(function(key) {
                var item = (block[key]);

                switch (item.type) {
                    case 'label': $.create('label', new_block, {title: item.title || '', html: item.label}, {width: item.width + 'px'}); break;
                    case 'ibutton': $.create('span', new_block, {class: 'pr2_panel_ibutton ' + ('pr2_panel_' + item.class || '')  , title: item.title}, {backgroundPosition: item.style}).addEventListener('click',
                        (function() {
                            var submit = item.submit;
                            return function() {
                                submit(self, this);
                            }
                        })()); break;
                    case 'textfield':
                        $.create('input', new_block, {id: panel.id + '_' + key, type: 'text', value: item.value || "", size: item.size || 4, maxlength: item.maxlength || 4}).addEventListener('change',
                        (function(){
                            var change = item.change;
                            return function() {
                                change(self, this, this.value);
                            }
                        })()); break;
                    case 'toggle': $.create('span', new_block, {id: panel.id + '_' + key, class: 'pr2_panel_toggle', title: item.title, 'data-value': 'off', 'data-on' : item.toggleStyle, 'data-off': item.style}, {backgroundPosition: item.style}).addEventListener('click',
                        (function() {
                            var submit = item.submit;
                            return function() {
                                if(this.dataset.value == 'off') {
                                    this.dataset.value = 'on';
                                    this.style.backgroundPosition = this.dataset.on;
                                    this.classList.add('pr2_panel_button_selected');
                                }
                                else {
                                    this.dataset.value = 'off';
                                    this.style.backgroundPosition = this.dataset.off;
                                    this.classList.remove('pr2_panel_button_selected');
                                }
                                submit(this, this.dataset.value);
                            }
                        })()); break;
                    case 'button': $.create('button', new_block, {class: 'pr2_panel_button', html: item.label}).addEventListener('click',
                        (function(){
                            var submit = item.submit;
                            return function() {
                                submit(this);
                            }
                        }())); break;
                    case 'menu':
                        var select = $.create('select', new_block, {id: panel.id + '_' + key, class: 'pr2_panel_menu'});
                        select.addEventListener('change',
                        (function(){
                            var change = item.change;
                            return function() {
                                change(self, this, this.value);
                            }
                        })());
                        item.options.forEach((function(value){
                            $.create('option', select, {value: value, html: value});
                        }));
                        break;
                    case 'menu-picker':
                        var list_items, json, last_selected_value;
                        var select = $.create('select', new_block, {id: panel.id + '_' + key, class: 'pr2_panel_menu'});
                        var picker = $.create('div', new_block, {id: panel.id + '_' + key + '_picker', class: 'pr2_panel_menu_picker'});

                        select.addEventListener('change', function() {
                             picker.innerHTML = "";
                            json[this.value].forEach(function(item) {
                                $.create('span', picker, {'data-value': item.value, title: item.title, class: 'pr2_panel_menu_picker_item ' + (last_selected_value == item.value ? 'pr2_panel_menu_picker_item_selected' : '') }, {backgroundImage: 'url(' + item.icon + ')'}) ;
                            });
                        });
                        new_block.addEventListener('click',
                        (function(){
                            var click = item.click;
                            return function(e) {
                                var siblings =  e.target.parentElement.children;
                                if(e.target.classList.contains('pr2_panel_menu_picker_item')) {
                                    for(var i = 0; i < siblings.length; i++) {
                                        siblings[i].classList.remove('pr2_panel_menu_picker_item_selected');
                                    }
                                    e.target.classList.add('pr2_panel_menu_picker_item_selected');
                                    last_selected_value = e.target.dataset.value;
                                    click(self, this, e.target.dataset.value);
                                }
                            }
                        })());



                        (function() {
                            var request = new XMLHttpRequest();

                            request.onload = function() {
                                json = this.response;
                                list_items = Object.getOwnPropertyNames(this.response).sort();
                                list_items.forEach((function(value){
                                    $.create('option', select, {value: value, html: value});
                                }));
                                json[list_items[0]].forEach(function(item) {
                                $.create('span', picker, {'data-value': item.value, title: item.title, class: 'pr2_panel_menu_picker_item'}, {backgroundImage: 'url(' + item.icon + ')'}) ;
                                });
                            };
                            request.open('GET', './assets/patterns.php', true);
                            request.responseType = 'json';
                            request.send();
                        })();
                        break;
                    case 'group':
                        var group = $.create('div', new_block,  {id: panel.id + '_' + key, class: 'pr2_panel_group'});
                        group.addEventListener('click',
                            (function(){
                                var change = item.submit;
                                return function(e) {
                                    if(e.target.classList.contains("pr2_panel_group_button")) {
                                        change(self, e.target, e.target.dataset.value);
                                        var list = e.target.parentElement.children;
                                        for (var i = 0; i < list.length; i++) {
                                            list[i].classList.remove('pr2_panel_button_selected');
                                        }
                                        e.target.classList.add('pr2_panel_button_selected');
                                    }
                                }
                            })());
                        item.options.forEach((function(item){
                            $.create('span', group, {class: 'pr2_panel_group_button', 'data-value': item.value}, {backgroundPosition: item.style});
                        }));
                }
            });
        };

        var _toggle = function(action) {
            panel_wrapper.style.display = action == 'show' ? 'block' : 'none';
        };

        var _collapse = function(boolean) {
            if (boolean) {
                panel.style.display = 'none';
                panel_toggle.style.backgroundPosition = '-56px -56px';
            }
            else {
                panel.style.display = 'block';
                panel_toggle.style.backgroundPosition = '-28px -56px';
            }
        };

        ids.push(id);
        zIndexes.push(newZ);
        panels.push(panel_wrapper);

        $.subscribe(panel_toggle, {
            click: function() {
                if (panel.style.display == 'block') {
                    panel.style.display = 'none';
                    panel_toggle.style.backgroundPosition = '-56px -56px';
                }
                else {
                    panel.style.display = 'block';
                    panel_toggle.style.backgroundPosition = '-28px -56px';
                }
            }
        });

        $.subscribe(panel_bar, {
            mousedown : function(e) {
                drag_element = this.parentElement;
                drag_compensate.x = e.clientX - drag_element.offsetLeft;
                drag_compensate.y = e.clientY - drag_element.offsetTop;
                drag_element.style.zIndex = _maxZ();
                panels.forEach(function(panel){
                    if(panel != drag_element){
                        panel.style.zIndex--;
                    }
                });
            }
        });

        $.subscribe(window, {
            mousemove: function (e) {
                if (drag_element != null) {
                    drag_element.style.left =  ( e.clientX - drag_compensate.x ) + 'px';
                    if(e.clientY <= 0 || e.clientY >= window.innerHeight) {return;}
                    drag_element.style.top = (e.clientY - drag_compensate.y) + 'px';
                }
            },
            mouseup: function(){
                drag_element = null;
            }
        });

        self = {
            /**
             * Add a new block to the current panel
             *
             * @param {string} type The type of element to add (h-spacer, header or block)
             * @param {object} element An object containing information about
             * @param {string} [align=left] The alignment of the block: left, center or right
             * @returns {self}
             */
            add: function(type, element, align) {
                if(!$.inArray(type, ['h-spacer', 'header', 'block', 'menu-picker'])) {
                    throw new Error('Invalid type');
                }
                if(!$.inArray(typeof element, ['undefined', 'object'])) {
                    throw new Error('Second parameter is not an object');
                }
                _add(type, element, align);
                return this;
            },
            /**
             * Toggle the status of the current panel (hide or show)
             *
             * @param {string} action The toggle action: 'hide' or 'show'
             * @returns {self}
             */
            toggle: function(action){
                if(!$.inArray(action, ['hide', 'show'])) {
                    throw new Error('invalid value');
                }
                _toggle(action);
                return this;
            },
            /**
             * Collapse or expand the current panel
             *
             * @param {boolean} collapse True to collapse the panel, and False to expand the panel
             * @returns {self}
             */
            collapse: function(collapse) {
                if(typeof collapse != 'boolean') {
                    throw new Error('')
                }
                _collapse(collapse);
                return this;
            },
            /**
             * Inform if the current panel is collapsed or not
             *
             * @returns {boolean} True if collapsed, and False if expanded
             */
            isCollapsed: function() {
                return panel.style.display == 'none';

            },
            /**
             * Inform if the current panel is visible
             *
             * @returns {boolean} True if visible, False if not
             */
            isVisible: function() {
                return panel_wrapper.style.display != 'none';
            },
            /**
             * Moves the current panel to the specified x (left) and y (top) coordinates
             *
             * @param {number} x The x coordinate
             * @param {number} y The y coordinate
             * @returns {self}
             */
            moveTo: function(x, y) {
                if(!$.isInt([x, y])) {
                    throw new Error('Both arguments must have integer values');
                }
                _moveTo(x, y);
                return this;
            },
            /**
             * Sets the value of a button group
             *
             * @param {string} id  The id of the button group
             * @param {string} value The value to set the button group to
             * @returns {self}
             */
            setButtonGroup: function(id, value) {
                _setButtonGroup(id, value);
                return this;
            },
            /**
             * Set the status of the toggle button
             * @param {string} id The id of the toggle button
             * @param {string} value The value to set the toggle button to, either 'on' or  'off'
             * @returns {self}
             */
            setToggleButton: function(id, value)  {
                _setToggleButton(id, value);
                return this;
            },
            /**
             * Set select menu to the specified value
             *
             * @param {string} id The id of the select menu
             * @param {string} value The value to set the select menu to
             * @returns {self}
             */
            setSelect: function(id, value) {
                _setSelect(id, value);
                return this;
            },
            /**
             * Set text field to the specified value
             *
             * @param {string} id The id of the text value
             * @param {string} value The value to set the text field to
             * @returns {self}
             */
            setValue: function(id, value) {
                _setValue(id, value);
                return this;
            },
            /**
             * Get textfield value
             *
             * @param {string} id The id of the text field
             * @returns {}
             */
            getValue: function(id) {
                return _getValue(id);
            },
            /**
             * Set multiple values of textfields
             *
             * @param {object} sets Sets of id's and their corresponding values
             * @returns {self}
             */
            setValues: function(sets) {
                if(typeof sets != 'object') {
                    throw new Error('This is not an object');
                }
                Object.getOwnPropertyNames(sets).forEach(function(id)   {
                    _setValue(id, sets[id]);
                });
                return this;
            },
            /**
             * get multiple values of textfields
             *
             * @param {string[]} ids The list of id's for which the values are queried
             * @returns {object} Object containing pairs of id's and their values
             */
            getValues: function(ids) {
                if(!Array.isArray(ids)) {
                    throw new Error('Argument must be an array');
                }
                return _getValues(ids);
            },
            /**
             * Get multiple values from textfields that hold integer values
             *
             * @param {string[]} ids The list of id's for which the values are queried
             * @returns {object} Object containing pairs of id's and their integer values
             */
            getIntValues: function(ids) {
                if(!Array.isArray(ids)) {
                    throw new Error('This is not an array');
                }
                return _getIntValues(ids);
            }
        };
        return self;
    };

    self = {
        /**
         * Creates a new panel
         *
         * @param {string} id The id of the panel
         * @param {string} title The title of the panel
         * @param {number} x The x coordinate of the panel
         * @param {number} y The y coordinate of the panel
         * @param {number} width The width of the panel
         * @returns {object} panel The new panel
         */
        create: function(id, title, x, y, width) {
            if(typeof id != 'string'  || typeof title != 'string') {
                throw new Error('id and title should both be strings');
            }
            if($.inArray(id, ids)){
                throw new Error('id \''+ id + '\' is already taken');
            }
            return _create(id, title, x || 10, y || 40, width || 172);
        }
    };
    return self;

})({});
