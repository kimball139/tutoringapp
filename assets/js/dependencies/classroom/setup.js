var user = location.hash.slice(1).split('_');
var credentials = {level: user[0], name: user[0], channel: user[1]};
var mode = user[2] || 'online';

window.onbeforeunload = function () {
    if (PR2.peer.isConnected()) {
        // try to inform the other side that the user is leaving
        PR2.peer.sendData(JSON.stringify({type: 'close-connection'}));
    }
};


(function(credentials, mode){
	// DEFINE SOME VARIABLES
	var $ = PR2.utils;
    var offset;
    var current_action;

	// CONFIGURE WHITEBOARD PROPERTY VALUES

	var line_widths = [
            {value: 1, background: 'url(/whiteboard/icons/pr2_sprite.png) -308px -56px', title: '1px'},
            {value: 2, background: 'url(/whiteboard/icons/pr2_sprite.png) -336px -56px', title: '2px'},
            {value: 5, background: 'url(/whiteboard/icons/pr2_sprite.png) -364px -56px', title: '5px'},
            {value: 7, background: 'url(/whiteboard/icons/pr2_sprite.png) -392px -56px', title: '7px'},
            {value: 10, background: 'url(/whiteboard/icons/pr2_sprite.png) -420px -56px', title: '10px'},
            {value: 15, background: 'url(/whiteboard/icons/pr2_sprite.png) -448px -56px', title: '15px'},
            {value: 20, background: 'url(/whiteboard/icons/pr2_sprite.png) -476px -56px', title: '20px'}
        ];
	var	colors = [
            {value: 'Transparent', title: 'Transparent', background: 'url(/whiteboard/icons/pr2_sprite.png) -362px -28px'},
            {value: 'Yellow', title: 'Yellow', background: 'yellow'},
            {value: 'Gold', title: 'Gold', background: 'gold'},
            {value: 'Orange', title: 'Orange', background: 'orange'},
            {value: 'Goldenrod', title: 'Goldenrod', background: 'goldenrod'},
            {value: 'Lightgreen', title: 'Lightgreen', background: 'lightgreen'},
            {value: 'Greenyellow', title: 'Greenyellow', background: 'greenyellow'},
            {value: 'Lime', title: 'Lime', background: 'lime'},
            {value: 'Green', title: 'Green', background: 'green'},
            {value: 'Darkgreen', title: 'Darkgreen', background: 'darkgreen'},
            {value: 'Orchid', title: 'Orchid', background: 'orchid'},
            {value: 'Fuchsia', title: 'Fuchsia', background: 'fuchsia'},
            {value: 'Hotpink', title: 'Hotpink', background: 'hotpink'},
            {value: 'Blueviolet', title: 'Blueviolet', background: 'blueviolet'},
            {value: 'Indigo', title: 'Indigo', background: 'indigo'},
            {value: 'Salmon', title: 'Salmon', background: 'salmon'},
            {value: 'Crimson', title: 'Crimson', background: 'crimson'},
            {value: 'Firebrick', title: 'Firebrick', background: 'firebrick'},
            {value: 'Red', title: 'Red', background: 'red'},
            {value: 'Darkred', title: 'Darkred', background: 'darkred'},
            {value: 'Cyan', title: 'Cyan', background: 'cyan'},
            {value: 'Dodgerblue', title: 'Dodgerblue', background: 'dodgerblue'},
            {value: 'Lightseagreen', title: 'Lightseagreen', background: 'lightseagreen'},
            {value: 'Blue', title: 'Blue', background: 'blue'},
            {value: 'Mediumblue', title: 'Mediumblue', background: 'mediumblue'},
            {value: 'Tan', title: 'Tan', background:  'tan'},
            {value: 'Peru', title: 'Peru', background: 'peru'},
            {value: 'Chocolate', title: 'Chocolate', background: 'chocolate'},
            {value: 'Saddlebrown', title: 'Saddlebrown', background: 'saddlebrown'},
            {value: 'Brown', title: 'Brown', background: 'brown'},
            {value: 'White', title: 'White', background: 'white'},
            {value: 'Lightgrey', title: 'Lightgrey', background: 'lightgray'},
            {value: 'Darkgray', title: 'Darkgray', background: 'darkgray'},
            {value: 'Gray', title: 'Gray', background: 'gray'},
            {value: 'Black', title: 'Black', background: 'black'}
    ];
    var canvas_backgrounds = [
		{title: "Simply white", value: "url(/whiteboard/backgrounds/simply-white.png)", background: "url(/whiteboard/backgrounds-thumbs/simply-white.png)"},
		{title: "Low contrast", value: "url(/whiteboard/backgrounds/low-contrast.png)", background: "url(/whiteboard/backgrounds-thumbs/low-contrast.png)"},
		{title: "Small blocked grid", value: "url(/whiteboard/backgrounds/block-grid-small.png)", background: "url(/whiteboard/backgrounds-thumbs/block-grid-small.png)"},
        {title: "Medium blocked grid", value: "url(/whiteboard/backgrounds/block-grid-medium.png)", background: "url(/whiteboard/backgrounds-thumbs/block-grid-medium.png)"},
        {title: "Large blocked grid", value: "url(/whiteboard/backgrounds/block-grid-large.png)", background: "url(/whiteboard/backgrounds-thumbs/block-grid-large.png)"},
		{title: "Writing paper", value: "url(/whiteboard/backgrounds/writing-paper.png)", background: "url(/whiteboard/backgrounds-thumbs/writing-paper.png)"},
		{title: "Grid of dots", value:  "url(/whiteboard/backgrounds/dots.png)", background: "url(/whiteboard/backgrounds-thumbs/dots.png)"},
		{title: "Medium inverted grid", value: "url(/whiteboard/backgrounds/block-grid-medium-invert.png)", background: "url(/whiteboard/backgrounds-thumbs/block-grid-medium-invert.png)"},
		{title: "School Board", value: "url(/whiteboard/backgrounds/school-board.png)", background: "url(/whiteboard/backgrounds-thumbs/school-board.png)"},
		{title: "School Board grid", value: "url(/whiteboard/backgrounds/school-board-grid.png)", background: "url(/whiteboard/backgrounds-thumbs/school-board-grid.png)"},
        {title: "world map", value: "url(/whiteboard/backgrounds/world-map.png) 0 0 / 100% 100%", background: "url(/whiteboard/backgrounds-thumbs/world-map.png)"},
        {title: "Music bars", value: "url(/whiteboard/backgrounds/music-bars.png)", background: "url(/whiteboard/backgrounds-thumbs/music-bars.png)"}
	];

    var shapes = {
        line: {
            title: "Draw a line",
            background: "url(/whiteboard/icons/pr2_sprite.png) -84px 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                context.beginPath();
                context.moveTo(start_x, start_y);
                context.lineTo(end_x, end_y);
                context.closePath();
                context.stroke();
            }
        },
        arrow: {
            title: "Draw an arrow",
            background: "url(/whiteboard/icons/pr2_sprite.png) -308px 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var dX = end_x - start_x, dY = end_y - start_y, RC = dY/dX, arrowLength = 12,
                    arrow1 = Math.PI * 0.12 + Math.atan(RC), arrow1X = Math.cos(arrow1), arrow1Y = Math.sin(arrow1), arrow2 =  Math.atan(RC) - Math.PI * 0.12, arrow2X = Math.cos(arrow2), arrow2Y = Math.sin(arrow2);

                if(end_x < start_x) arrowLength = -arrowLength;
                context.beginPath();
                context.moveTo(start_x,start_y);
                context.lineTo(end_x,end_y);
                context.lineTo(end_x - arrowLength * arrow1X ,end_y -  arrowLength * arrow1Y);
                context.moveTo(end_x,end_y);
                context.lineTo(end_x - arrowLength * arrow2X ,end_y -  arrowLength * arrow2Y);
                context.stroke();
            }
        },
        cosinus: {
            title: "Draw a cosinus",
            background: "url(/whiteboard/icons/pr2_sprite.png) 0 -28px",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var _end_x = end_x > start_x ? end_x : start_x,
                    _start_x = end_x > start_x ? start_x : end_x,
                    baseY = (end_y - start_y) / 2 + start_y,
                    ampY = baseY - start_y,
                    dX = _end_x - _start_x,
                    step = (Math.PI * 2) / dX;

                context.beginPath();
                for(var i = 0; i <= dX; i++) {
                    context.lineTo(i + _start_x,   -Math.cos(step * i) * ampY   + baseY);
                }
                context.stroke();
            }
        },
        sinus: {
            title: "Draw a sinus",
            background: "url(/whiteboard/icons/pr2_sprite.png) -28px -28px",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var _end_x = end_x > start_x ? end_x: start_x,
                    _start_x = end_x > start_x ? start_x: end_x,
                    baseY = (end_y - start_y) / 2 + start_y,
                    ampY = baseY - start_y,
                    dX = _end_x - _start_x,
                    step = (Math.PI * 2) / dX;

                context.beginPath();
                for(var i = 0; i <= dX; i++) {
                    context.lineTo(i + _start_x,   -Math.sin(step * i) * ampY   + baseY);
                }
                context.stroke();
            }},
        axis: {
            title: "Draw an axis",
            background: "url(/whiteboard/icons/pr2_sprite.png) -364px 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                context.beginPath();
                context.moveTo(start_x + (end_x - start_x) / 2, start_y);
                context.lineTo(start_x + (end_x - start_x) / 2, end_y);
                context.moveTo(start_x, start_y + (end_y - start_y) / 2);
                context.lineTo(end_x, start_y + (end_y - start_y) / 2);
                context.closePath();
                context.stroke();
            }
        },
        triangle: {
            title: "Draw a triangle",
            background: "url(/whiteboard/icons/pr2_sprite.png) -56px 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                context.beginPath();
                context.moveTo(start_x, start_y);
                context.lineTo(start_x, end_y);
                context.lineTo(end_x, end_y);
                context.closePath();
                context.fill();
                context.stroke();
            }
        },
        triangle2: {
            title: "Draw a triangle",
            background: "url(/whiteboard/icons/pr2_sprite.png) -336px 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                context.beginPath();
                context.moveTo(start_x + (end_x - start_x) / 2, start_y);
                context.lineTo(end_x, end_y);
                context.lineTo(start_x, end_y);
                context.closePath();
                context.fill();
                context.stroke();
            }
        },
        rectangle: {
            title: "Draw a rectangle",
            background: "url(/whiteboard/icons/pr2_sprite.png) 0 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                context.beginPath();
                context.rect(start_x, start_y, end_x - start_x, end_y - start_y);
                context.fill();
                context.stroke();
            }
        },
        circle: {
            title: "Draw a circle",
            background: "url(/whiteboard/icons/pr2_sprite.png) -28px 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var d_x = end_x - start_x, d_y = end_y - start_y, radius = Math.max(Math.abs(d_x), Math.abs(d_y)) / 2,
                    x_center = d_x >= 0 ? start_x + radius: start_x - radius,
                    y_center = d_y >= 0 ? start_y + radius: start_y - radius;

                context.beginPath();
                context.arc(x_center, y_center, radius, 0, 2 * Math.PI);
                context.fill();
                context.stroke();
            }},
        elipse: {
            title: "Draw an elipse",
            background: "url(/whiteboard/icons/pr2_sprite.png) -196px 0",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var d_x = end_x - start_x, center_x = start_x + d_x / 2,
                    d_y = end_y - start_y, center_y = start_y + d_y / 2,
                    magic = 0.551784,
                    xmagic = magic * d_x / 2,
                    ymagic = d_y * magic / 2;

                context.beginPath();
                context.moveTo(center_x, start_y);
                context.bezierCurveTo(center_x + xmagic, start_y, end_x, center_y - ymagic, end_x, center_y);
                context.bezierCurveTo(end_x, center_y + ymagic, center_x + xmagic, end_y, center_x, end_y);
                context.bezierCurveTo(center_x - xmagic, end_y, start_x, center_y + ymagic, start_x, center_y);
                context.bezierCurveTo(start_x, center_y - ymagic, center_x - xmagic, start_y, center_x, start_y);
                context.fill();
                context.stroke();
            }
        },
        star: {
            title: "Draw a star",
            background: "url(/whiteboard/icons/pr2_sprite.png) -252px 0",
            shapeFunction: function(context, start_x, start_y, end_x) {
                var points = 5,
                    outer_radius = (end_x - start_x),
                    inner_radius =  0.3 * outer_radius,
                    new_outer_RAD, half_new_outer_RAD,
                    RAD_distance = ( 2 * Math.PI / points),
                    RAD_half_PI = Math.PI /2,
                    i;
                context.moveTo(start_x, start_y);
                context.beginPath();

                for(i = 0; i <= points; i++) {
                    new_outer_RAD = (i + 1) * RAD_distance;
                    half_new_outer_RAD = new_outer_RAD - (RAD_distance / 2);
                    context.lineTo(start_x + Math.round(Math.cos(half_new_outer_RAD - RAD_half_PI) * inner_radius), start_y + Math.round(Math.sin(half_new_outer_RAD - RAD_half_PI) * inner_radius));
                    context.lineTo(start_x + Math.round(Math.cos(new_outer_RAD - RAD_half_PI) * outer_radius), start_y + Math.round(Math.sin(new_outer_RAD - RAD_half_PI) * outer_radius));
                }
                context.fill();
                context.stroke();
            }},
        roundedsquare: {
            title: "Draw a rounded square",
            background: "url(/whiteboard/icons/pr2_sprite.png) -196px -28px",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var d_x = end_x - start_x, center_x = start_x + d_x / 2,
                    d_y = end_y - start_y, center_y = start_y + d_y / 2,
                    tension = Math.floor(Math.min( Math.abs(d_x), Math.abs(d_y) ) / 5) ;

                context.beginPath();
                context.moveTo(center_x, start_y);
                context.arcTo(end_x, start_y, end_x, center_y, tension);
                context.arcTo(end_x, end_y, center_x, end_y, tension);
                context.arcTo(start_x, end_y, start_x, center_y, tension);
                context.arcTo(start_x, start_y, center_x, start_y, tension);
                context.lineTo(center_x, start_y);
                context.fill();
                context.stroke();
            }
        },
        balloon: {
            title: "Draw a balloon",
            background: "url(/whiteboard/icons/pr2_sprite.png) -224px -28px",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var d_x = end_x - start_x, center_x = start_x + d_x / 2,
                    d_y = end_y - start_y, center_y = start_y + d_y / 2,
                    tension = Math.floor(Math.min( Math.abs(d_x), Math.abs(d_y) ) / 5);

                context.beginPath();
                context.moveTo(center_x, start_y);
                context.arcTo(end_x, start_y, end_x, center_y, tension);
                context.arcTo(end_x, end_y, center_x, end_y, tension);
                context.lineTo(end_x, end_y + Math.floor(d_y /3));
                context.lineTo(center_x, end_y);
                context.arcTo(start_x, end_y, start_x, center_y, tension);
                context.arcTo(start_x, start_y, center_x, start_y, tension);
                context.lineTo(center_x, start_y);
                context.fill();
                context.stroke();
            }
        },
        connector_h: {
            title: "Draw a horizontal connector",
            background: "url(/whiteboard/icons/pr2_sprite.png) -112px -28px",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var d_x = end_x - start_x, center_x = start_x + d_x / 2;

                context.beginPath();
                context.moveTo(start_x, start_y);
                context.lineTo(center_x, start_y);
                context.lineTo(center_x, end_y);
                context.lineTo(end_x, end_y);
                context.stroke();
            }
        },
        connector_v: {
            title: "Draw a vertical connector",
            background: "url(/whiteboard/icons/pr2_sprite.png) -140px -28px",
            shapeFunction: function(context, start_x, start_y, end_x, end_y) {
                var d_y = end_y - start_y, center_y = start_y + d_y / 2;

                context.beginPath();
                context.moveTo(start_x, start_y);
                context.lineTo(start_x, center_y);
                context.lineTo(end_x, center_y);
                context.lineTo(end_x, end_y);
                context.stroke();
            }
        }
    };

    // HELPER FUNCTIONS

    // function to hide all editors and panels at once   (both parameters are arrays)
    var hide_editors_and_panels = function(editors, panels) {
        editors.forEach(function(editor) {
            editor.toggle('hide');
        });
        panels.forEach(function(panel) {
            panel.toggle('hide');
        });
    };

    // function to set the crop borders of the image editor from its panel
    var setCropBordersFromPanel = function() {
        PR2.imageEditor.setCropBorders(image_edit_panel.getIntValues(['crop_top', 'crop_left', 'crop_right', 'crop_bottom']));
    };
    // Handle the whiteboard messages from the peer object
    var handleWhiteboardMessage = function(type, value)  {
        switch (type) {
            case 'undo': PR2.whiteboard.undo(); break;
            case 'redo': PR2.whiteboard.redo(); break;
            case 'add': PR2.whiteboard.addAction(value); break;
            case 'clear': PR2.whiteboard.clear(); break;
        }
    };

    var handleWhiteboardRemotePointer = function(data) {
        remote_pointer.co.top = data.y + 40 + 'px';
        remote_pointer.style.left = data.x + 1 + 'px';
        switch (data.state) {
            case 'up':
                remote_pointer.style.backgroundImage = 'url(/whiteboard/icons/pointer.png)';
                break;
            case 'down':
                remote_pointer.style.backgroundImage = 'url(/whiteboard/icons/pointer-click.png)';
                break;
        }
    };

    // synchronize teacher and student whiteboard
    var synchronizeWhiteboardData = function(data) {
        PR2.whiteboard.clear();
        PR2.whiteboard.loadActions(data, 'replace');
        PR2.modals.info('hide');
        sendPeerData({type: 'synchronization-complete'});
    };

    // toggle helpers, and update menu item text
    var toggleWhiteboardHelpers = function() {
        var button = $.get('pr2_helper_lines');

        if(PR2.user.getRole() == 'observer') {
            return;
        }
        if(PR2.whiteboard.helpersEnabled()) {
            PR2.whiteboard.toggleHelpers('hide');
            button.textContent = 'Show Helper lines (Ctrl-H)';

        } else {
            PR2.whiteboard.toggleHelpers('show');
            button.textContent = 'Hide helper lines (Ctrl-H)';
        }
    };

    var sendFileMetaDataToPeer = function(data) {
        PR2.peer.sendData(JSON.stringify(data));
    };

    // Send the data to the other peer and send in fragments if the data is too big
    var sendPeerData = function(data) {
        var chunks = [];
        var i = 0;
        var send_string = JSON.stringify(data);
		if(mode == 'offline') return;
        if(send_string.length > 15000) {
            chunks = send_string.match(/(.{1,15000})/g);
            PR2.peer.sendWhiteboardData('s' + chunks[0]);
            for(i = 1; i <= chunks.length - 2; i++)  {
                PR2.peer.sendWhiteboardData('m' + chunks[i]);
            }
            PR2.peer.sendWhiteboardData('e' + chunks[chunks.length - 1]);
        }
        else {
            PR2.peer.sendWhiteboardData(data);
        }

    };

    // Receive peer data fragments
    var receivePeerFragments = (function() {
        var fragments = "";

        return function(type, data) {
            if(type == 's') {
                fragments = data;
            }
            else if(type == 'm') {
                fragments += data;
            }
            else if(type == 'e') {
                fragments += data;
                receivePeerData(JSON.parse(fragments));
            }
        };
    })();

    // Receive peer data
    var receivePeerData = function(data) {
        switch (data.type) {
            case 'close-connection': PR2.modals.info('show', 'Other has left'); break;
            // Change role
            case 'change-role':
                // don't allow a student to change the role of the teacher
                if(user.level == 'teacher') { return;}
                PR2.user.setRole(data.role); break;
            // Receive a whiteboard property change
            case 'receive-whiteboard-propertychange':
                PR2.whiteboard.setProperty(data.property, data.data); break;
            // Receive whiteboard action
            case 'receive-whiteboard-action':
                handleWhiteboardMessage(data.action, data.data); break;
            case 'receive-whiteboard-action-img-complete':
                handleWhiteboardMessage('add', handlePeerImageData('complete')); break;
            // Receive synchronize whiteboard data
            case 'synchronize':
                PR2.modals.info('show', 'One moment... The whiteboards are synhronized now');
                PR2.whiteboard.clear();
                synchronizeWhiteboardData(data.data); break;
            case 'synchronization-complete': PR2.modals.info('hide'); break;
            case 'point':
                handleWhiteboardRemotePointer(data);
        }
    };

    // CREATE PANELS

    // Image Editor Panel
    var image_edit_panel = PR2.panels.create('image_editor_panel', 'Edit image').add('header', {
        label: 'Rotate & flip image:'
    }).add('block',  {
            rotate_left: {type: 'ibutton', title: 'rotate with clock', style: '-392px -28px', submit: function() { PR2.imageEditor.rotate('cw');}},
            rotate_right: {type: 'ibutton', title: 'rotate against clock', style: '-420px -28px', submit: function() { PR2.imageEditor.rotate('ccw'); }},
            flip_horizontal: {type: 'ibutton', title: 'flip horizontal', style: '-448px -28px', submit: function() { PR2.imageEditor.flip('horizontal'); }},
            flip_vertical: {type: 'ibutton', title: 'flip vertical', style: '-476px -28px', submit: function() { PR2.imageEditor.flip('vertical'); }}
        }).add('h-spacer').add('header', {
            label: 'Move & resize image:'
        }).add('block',  {
            label_x: {type: 'label', label: 'x: ', title: 'x position', width: 16},
            left: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.imageEditor.moveTo(value, self.getValue('top'));
            }},
            label_y: {type: 'label', label: 'y: ', title: 'y position', width: 16},
            top: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.imageEditor.moveTo(self.getValue('left'), value);
            }}
        }).add('block',  {
            label_w: {type: 'label', label: 'w: ', title: 'width', width: 16},
            width: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.imageEditor.resize(value, self.getValue('height'));
            }},
            label_h: {type: 'label', label: 'h: ', title: 'height', width: 16},
            height: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.imageEditor.resize(self.getValue('width'), value);
            }}
        }).add('h-spacer').add('header', {
            label: 'Crop borders:'
        }).add('block',  {
            label_l: {type: 'label', label: 'l: ', width: 16},
            crop_left: {type: 'textfield', size: 4, maxlength: 4, change: function() { setCropBordersFromPanel();}},
            label_r: {type: 'label', label: 'r: ', width: 16},
            crop_right: {type: 'textfield', size: 4, maxlength: 4, change: function() { setCropBordersFromPanel();}}
        }).add('block',  {
            label_t: {type: 'label', label: 't: ', width: 16},
            crop_top: {type: 'textfield', size: 4, maxlength: 4, change: function() { setCropBordersFromPanel();}},
            label_b: {type: 'label', label: 'b: ', width: 16},
            crop_bottom: {type: 'textfield', size: 4, maxlength: 4, change: function() { setCropBordersFromPanel();}},
            crop: {type: 'ibutton', title: 'crop borders', style: '0 -56px', class: 'crop_button', submit: function(self) {
                var dim = self.getValues(['crop_left', 'crop_top', 'crop_right', 'crop_bottom']);
                PR2.imageEditor.crop({
                    left: dim.crop_left,
                    top: dim.crop_top,
                    right: dim.crop_right,
                    bottom: dim.crop_bottom
                });
            }}
        }).add('h-spacer').add('block',  {
            add: {type: 'button', label: 'add', submit: function() {
                var img = PR2.imageEditor.getImage();

                PR2.whiteboard.addImage(img.data_url, img.left - offset.left, img.top - offset.top, img.width, img.height);
                PR2.imageEditor.toggle('hide');
                image_edit_panel.toggle('hide');
            }},
            cancel: {type: 'button', label: 'cancel', submit: function() {
                PR2.imageEditor.toggle('hide');
                image_edit_panel.toggle('hide');
            }},
            reset: {type: 'button', label: 'reset', submit: function() { PR2.imageEditor.resetImage(); }}

        }, 'center').toggle('hide');

    // Whiteboard Info Panel
    var whiteboard_info_panel = PR2.panels.create('whiteboard_helper', 'Whiteboard Info')
        .add('header', {
            label: 'x and y coordinates:'
        }).add('block', {
            label_x: {type: 'label',label: 'x', title: 'x coordinate'},
            x: {type: 'textfield'},
            label_y: {type: 'label',label: 'y', title: 'y coordinate'},
            y: {type: 'textfield'}
        }).moveTo(900, 100).toggle('hide');

    // Text Editor Panel
    var text_editor_panel = PR2.panels.create('text_editor', 'Text editor')
        .add('header', {
            label: 'Set font, size and color:'
        }).add('block', {
            label_font: {type: 'label', label: 'font: ', title: 'select font', width: 34},
            select_font: {type: 'menu', options: ['Arial', 'Comic Sans MS', 'Courier', 'Georgia', 'Impact', 'Lucida Console', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'], change: function(self, element, value) {
                PR2.textEditor.setProperty('font', value);
            }},
            label_size: {type: 'label', label: 'size: ', title: 'select size', width: 34},
            select_size: {type: 'menu', options: ['8', '10', '12', '14', '16', '18', '24', '32', '40', '48', '72'], change: function(self, element, value) {
                PR2.textEditor.setProperty('size', value);
            }},
            label_color: {type: 'label', label: 'color: ', title: 'select color', width: 34},
            select_color: {type: 'menu', options: ['black', 'red', 'yellow', 'green', 'blue', 'white', 'grey', 'orange', 'purple', 'brown', 'pink'], change: function(self, element, value) {
                PR2.textEditor.setProperty('color', value);
            }}
        }).add('h-spacer')
        .add('header', {
            label: 'Set alignment and style:'
        }).add('block', {
            label_align: {type: 'label', label: 'align: ', title: 'align text', width: 32},
            align: {type: 'group', options: [{style:'-84px -56px', value: 'left'}, {style:'-112px -56px', value: 'center'}, {style:'-140px -56px', value: 'right'}], submit: function(self, element, value) {
                PR2.textEditor.setProperty('align', value);
            }}
        }).add('block', {
            label_style: {type: 'label', label: 'style: ', title: 'style text', width: 32},
            bold: {type: 'toggle', title: 'bold text', toggleStyle: '-168px -56px', style: '-168px -56px', submit: function(element, value) {
                PR2.textEditor.setProperty('bold', value == 'on');
            }},
            italic: {type: 'toggle', title: 'italic text', toggleStyle: '-196px -56px', style: '-196px -56px', submit: function(element, value) {
                PR2.textEditor.setProperty('italic', value == 'on');
            }},
            underline: {type: 'toggle', title: 'underline text', toggleStyle: '-224px -56px', style: '-224px -56px', submit: function(element, value) {
                PR2.textEditor.setProperty('underline', value == 'on');
            }}
        }).add('h-spacer')
        .add('header', {
            label: 'Move & resize text:'
        }).add('block',  {
            label_x: {type: 'label', label: 'x: ', title: 'x position', width: 16},
            left: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.textEditor.moveTo(value, self.getValue('top'));
            }},
            label_y: {type: 'label', label: 'y: ', title: 'y position', width: 16},
            top: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.textEditor.moveTo(self.getValue('left'), value);
            }}
        }).add('block',  {
            label_w: {type: 'label', label: 'w: ', title: 'width', width: 16},
            width: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.textEditor.resize(value, self.getValue('height'));
            }},
            label_h: {type: 'label', label: 'h: ', title: 'height', width: 16},
            height: {type: 'textfield', size: 4, maxlength: 4, change: function(self, element, value) {
                PR2.textEditor.resize(self.getValue('width'), value);
            }}
        }).add('h-spacer').add('block',  {
            add: {type: 'button', label: 'add', submit: function() {
                var data = PR2.textEditor.getTextData();
                PR2.whiteboard.addText(data[0], data[1], data[2] - offset.left + 2, data[3] - offset.top + 3, data[4], data[5]);
                PR2.textEditor.setText('').toggle('hide');
                text_editor_panel.toggle('hide');
            }},
            cancel: {type: 'button', label: 'cancel', submit: function() {
                PR2.textEditor.setText('').toggle('hide');
                text_editor_panel.toggle('hide');
            }}

        }, 'center').moveTo(400, 100).toggle('hide');

    // Pattern Panel

    var pattern_panel = PR2.panels.create('pattern_selector', 'Pattern Selector', 0, 0, 178)
        .add('block', {
            select_pattern: {type: 'menu-picker', source: './patterns/patterns.json', click: function(self, element, value) {
                PR2.whiteboard.setProperty('pattern', value);
            }}
        }).moveTo(1000, 100).toggle('hide');

	// Set the user credentials and return the level
	var level = PR2.user.setCredentials(credentials).getCredentials().level;
		
	// reference a remote pointer
	var remote_pointer = $.get('pr2_remote_pointer');

    // IMPORT SHAPES TO THE WHITEBOARD

    PR2.shapes.addMultiple(shapes);

	// CONFIGURE TOOLBAR

	PR2.toolbar.addToMenu('sub_menu',  {
		id: "pr2_whiteboard_functions",
		access: "always", 
		label: "Whiteboard", "items": [
		{
			// toggle helper lines
			id: "pr2_helper_lines",
			access: "creator",
			label: "Show helper lines (Ctrl-H)",
			action: function() {
                toggleWhiteboardHelpers()
            }
		},
		{
			// Delegate the whiteboard
			id: "pr2_delegate_whiteboard",
			access: level == "teacher" ? "always": "never",
			label: "Delegate control",
			action: function() {
				// switch role
				if (PR2.user.getRole() == 'creator') {
					PR2.user.setRole('observer');
                    sendPeerData({type: 'change-role', role: 'creator'});
				}
				else {
					PR2.user.setRole('creator');
                    sendPeerData({type: 'change-role', role: 'observer'});
				}
			}
		},
        {
			// Synchronize the whiteboard
			id: "pr2_synhronize_whiteboard",
			access: level == "teacher" ? "always": "never",
			label: "Synchronize",
			action: function() {
				PR2.modals.info('show', 'One moment... The whiteboards are synhronized now');
                sendPeerData({type: 'synchronize', data: PR2.whiteboard.getData()});
				// a bit of a hack to synchronize the background
                sendPeerData({type: 'receive-whiteboard-propertychange', property: 'background', data: PR2.whiteboard.getProperty('background')});
  			}
		},
        {
			// Clear the whiteboard
			id: "pr2_clear_whiteboard",
			access: level == "teacher" ? "always": "never",
			label: "Clear",
			action: function() {
				PR2.modals.confirm("Are you sure you want to clear the whiteboard?", PR2.whiteboard.clear);
			}
		},
        {
			// Save the whiteboard local
			id: "pr2_save_whiteboard_local",
			access: "always",
			label: "Save as image (local)",
			action: function() {
				PR2.whiteboard.save('local');
			}
		}]
	}).addToMenu('menu_item', {
		id: "pr2_go_fullscreen",
		label: "Go fullscreen (Ctrl-F)",
		access: "always",
		action: function() {
			PR2.fullscreen.current() == null ? PR2.fullscreen.request(): PR2.fullscreen.cancel();
		}
	}).addToMenu('menu_item', {
		id: "pr2_help_manual",
		access: "always",
		label: "Help",
		action: function() {
			PR2.modals.help('show', 'help/help.html');
		}
	}).add('actions', 'label', {title: 'Actions:'})
    .add('actions', 'button', {
		id: "pr2_point_button",
		group: "actions",
		value: "point",
		title: "Point with mouse arrow (Ctrl-1)",
        style: "-224px 0",
		action: function(value) {
			PR2.whiteboard.setProperty('action', value);
		}
	}).add('actions','button', {
        id: "pr2_text_button",
        group: "actions",
        value: "Text",
        title: "Add text (Ctrl-2)",
        style: "-280px 0",
        action: function() {
            current_action = 'text';
            PR2.toolbar.focus("pr2_text_button");
            PR2.whiteboard.setProperty('action', 'editor');
        }
    }).add('actions','button', {
        id: "pr2_image_button",
        group: "actions",
        value: "image",
        title: "Add image (Ctrl-3)",
        style: "-252px -56px",
        action: function() {
            current_action = 'image';
            PR2.toolbar.focus("pr2_image_button");
            PR2.whiteboard.setProperty('action', 'editor');
        }
    }).add('actions', 'button', {
        id: "pr2_paint_button",
        group: "actions",
        value: "paint",
        title: "Draw with pencil (Ctrl-4)",
        style: "-112px 0",
        action: function(value) {
                PR2.whiteboard.setProperty('action', value);
        }
    }).add('actions', 'button', {
        id: "pr2_shape_button",
        group: "actions",
        value: "shape",
        title: "Draw a shape (Ctrl-5)",
        style: "-140px 0",
        action: function(value) {
            PR2.whiteboard.setProperty('action', value);
        }
    }).add('actions', 'button', {
        id: "pr2_pattern_button",
        group: "actions",
        value: "pattern",
        title: "Draw a pattern (Ctrl-6)",
        style: "-280px -56px",
        action: function(value) {
            PR2.whiteboard.setProperty('action', value);
        }
    }).add('history', 'label', {title: 'History:'})
    .add('history', 'button', {
		id: "pr2_undo_button",
		value: "undo",
		title: "Undo last action (Ctrl-Z)",
        style: "-168px 0",
		enabled: false, 
        action: PR2.whiteboard.undo
	}).add('history', 'button', {
		id: "pr2_redo_button",
		value: "redo",
		title: "Redo last action",
        style: "-168px -28px",
		enabled: false,
		action: PR2.whiteboard.redo
	}).add('properties', 'label', {title: 'Properties:'})
    .add('properties', 'picker', {
		id: "pr2_select_shape_button",
		title: "Select shape",
		items: (function() {
			var shapes = PR2.shapes.getAll();
            var items = [];

            Object.getOwnPropertyNames(shapes).forEach(function(name){
                items.push({
                    value: name,
                    title: shapes[name].title,
                    background: shapes[name].background
                });
            });
			return items;
		})(),
		action: function(value) {
			PR2.whiteboard.setProperty('shape', value);
		}
	}).add('properties', 'picker', {
		id: "pr2_select_linewidth_button",
        width: 300,
		title: "Select width",
		items: line_widths,
		action: function(value) {
			PR2.whiteboard.setProperty('lineWidth', value);
		}
	}).add('properties', 'image_icon', {
		style: "-252px -28px"
	}).add('properties', 'picker', {
		id: "pr2_select_color_button",
		title: "Select line color",
		items: (function() {
            var items = [];
			colors.forEach(function(item){
				items.push({
					value: item.value.toLowerCase(),
					title: "color: " + item.value,
					background: item.background
				});
			});
			return items;
		})(),
		action: function(value) {
			PR2.whiteboard.setProperty('strokeStyle', value);
		}
	}).add('properties', 'image_icon', {
		id: "pr2_fillcolor_icon"
	}).add('properties', 'picker', {
		id: "pr2_select_fillcolor_button",
		title: "Select fill color",
        items: colors,
		action: function(value) {
			PR2.whiteboard.setProperty('fillStyle', value);
		}
	}).add('properties', 'image_icon', {
		id: "pr2_background_icon"
	}).add('properties', 'picker', {
		id: "pr2_select_bg_button",
		title: "Select background",
		items: canvas_backgrounds,
		action: function(value) {
			PR2.whiteboard.setProperty('background', value);
		},
        link: {text: 'Use custom background', action: function() { PR2.filePicker.triggerImagePicker('background')}}
	});

	// SET WHITEBOARD EVENTS AND PROPERTIES
	PR2.whiteboard.onPropertyChange(function(property, value) {
		switch (property) {
			case 'fontSize': PR2.toolbar.focus("pr2_select_fontsize", value); break;
			case 'fontFamily': PR2.toolbar.focus("pr2_select_font", value); break;
			case 'lineWidth': PR2.toolbar.focus("pr2_select_linewidth_button", value); break;
			case 'action':
                PR2.whiteboard.toggleRemotePointer(value == 'point' && PR2.user.getRole() == 'observer' ? 'show'  : 'hide');
                hide_editors_and_panels([PR2.textEditor, PR2.imageEditor], [image_edit_panel, text_editor_panel, pattern_panel]);
                if(value != 'editor') {
                    current_action = value;
                    PR2.toolbar.focus("pr2_" + value + "_button");
                }
                if(value == 'pattern' && PR2.user.getRole() == 'creator')   {
                    pattern_panel.toggle('show');
                }
				break;
			case 'shape': PR2.toolbar.focus("pr2_select_shape_button", value); break;
			case 'strokeStyle':
				(value == 'transparent') ? $.get('pr2_select_color_button').classList.add('pr2_no_color'): $.get('pr2_select_color_button').classList.remove('pr2_no_color');
				PR2.toolbar.focus("pr2_select_color_button", value); break;
			case 'fillStyle':
				(value == 'transparent') ? $.get('pr2_select_fillcolor_button').classList.add('pr2_no_color'): $.get('pr2_select_fillcolor_button').classList.remove('pr2_no_color');
				PR2.toolbar.focus("pr2_select_fillcolor_button", value); break;
			case 'background':
				// distinguish between simple values from the toolbar, or data url images added to the whiteboard background
				value.indexOf('data:image') > 0 ? PR2.toolbar.focus('pr2_select_bg_button', 'background: ' + value + '; background-size: 100% 100%'): PR2.toolbar.focus("pr2_select_bg_button", value);
				break;
		}
		if(PR2.user.getRole() == 'creator') {
            sendPeerData({type: 'receive-whiteboard-propertychange', property: property, data: value});
		}
	}).onEditorTarget(function(x, y){
        if(current_action == 'text') {
            PR2.textEditor.toggle('show').moveTo(x, y);
            text_editor_panel.toggle('show').moveTo(offset.right + 10, offset.top + 10);
        }
        else if(current_action == 'image' && !PR2.imageEditor.isVisible()) {
            PR2.filePicker.triggerImagePicker('image', x, y);
        }
    }).onPointerAction(function(x, y, state) {
        if(mode == 'online') {
            sendPeerData({type: 'point', 'x': x,  'y': y, 'state': state});
        }
    }).onFileDrop(function(file, x, y){
        if(file.type.match(/image.*/)) {
            var reader = new FileReader();

            reader.onload = function() {
                PR2.imageEditor.load(this.result, x - offset.left, y -offset.top);
            };
            reader.readAsDataURL(file);
        }
    }).onImagePaste(function(data_url){
        PR2.toolbar.focus("pr2_image_button");
        PR2.whiteboard.setProperty('action', 'editor');
        PR2.imageEditor.load(data_url, 0, 30);
    }).onAction(function(action, value) {
        switch (action) {
            case 'clear':
                PR2.toolbar.toggleButtonState("pr2_redo_button", "disable");
                PR2.toolbar.toggleButtonState("pr2_undo_button", "disable");
                break;
            case 'add':
                PR2.toolbar.toggleButtonState("pr2_undo_button", "enable");
                PR2.toolbar.toggleButtonState("pr2_redo_button", "disable");
                break;
            case 'undo':
                PR2.toolbar.toggleButtonState("pr2_redo_button", "enable");
                if(!value) { PR2.toolbar.toggleButtonState("pr2_undo_button", "disable");  }
                break;
            case 'redo':
                PR2.toolbar.toggleButtonState("pr2_undo_button", "enable");
                if(!value) { PR2.toolbar.toggleButtonState("pr2_redo_button", "disable");  }
                break;
        }

        // if creator send the action to the observer
        if(PR2.user.getRole() == 'creator') {
            sendPeerData({type: 'receive-whiteboard-action', action: action, data: value});
        }
    }).onHelperToggle(function(action){
        whiteboard_info_panel.toggle(action);
    }).onHelperMove(function(x, y){
        whiteboard_info_panel.setValues({x: x, y: y});
    }).setDimensions(900, 650).setProperties({
        lineJoin: 'round',
        lineCap: 'round',
        strokeStyle: 'black',
        fillStyle: "Transparent",
        lineWidth: 1,
        background: 'url(/whiteboard/backgrounds/block-grid-medium.png)',
        shape: 'line',
        action: 'paint',
    });

    offset = PR2.whiteboard.getOffset();

    // SET TEXT EDITOR EVENTS AND PROPERTIES
    PR2.textEditor.onMove(function(x, y) {
        text_editor_panel.setValues({
            left: x, top: y
        });
    }).onResize(function(width, height) {
        text_editor_panel.setValues({
            width: width,
            height: height
        });
    }).onDoubleClick(function(text, properties, x, y, width, height){
        if(text.length == 0) { return;}
        PR2.whiteboard.addText(text, properties, x - offset.left + 2, y - offset.top + 2, width, height);
        PR2.textEditor.toggle('hide').setText('');
        text_editor_panel.toggle('hide');
    }).onCtrlEnter(function(text, properties, x, y, width, height){
            if(text.length == 0) { return;}
            PR2.whiteboard.addText(text, properties, x - offset.left + 2, y - offset.top + 2, width, height);
            PR2.textEditor.toggle('hide').setText('');
            text_editor_panel.toggle('hide')
    }).onPropertyChange(function(property, value) {
        switch (property) {
            case 'font': text_editor_panel.setSelect('select_font', value); break;
            case 'size': text_editor_panel.setSelect('select_size', value); break;
            case 'color': text_editor_panel.setSelect('select_color', value); break;
            case 'bold': text_editor_panel.setToggleButton('bold', value == true ? 'on' : 'off'); break;
            case 'italic': text_editor_panel.setToggleButton('italic', value == true ? 'on' : 'off'); break;
            case 'underline': text_editor_panel.setToggleButton('underline', value == true ? 'on' : 'off'); break;
            case 'align': text_editor_panel.setButtonGroup('align', value); break;
        }
    }).resize(200,100).moveTo(100, 100).setProperties({
        font: 'Arial',
        size: '12',
        color: 'black',
        align: 'left',
        bold: false,
        italic: false,
        underline: false
    }).setClipping(offset);

    // SET IMAGE EDITOR EVENTS AND PROPERTIES
    PR2.imageEditor.onLoad(function(dimensions) {
        PR2.imageEditor.toggle('show');
        image_edit_panel.setValues({
            width: dimensions.width,
            height: dimensions.height,
            left: dimensions.left,
            top: dimensions.top,
            crop_left: 0,
            crop_right:0,
            crop_top: 0,
            crop_bottom: 0
        }).toggle('show').moveTo(offset.right + 10, offset.top + 10);
    }).onBackSpace(function() {
        PR2.imageEditor.toggle('hide');
        image_edit_panel.toggle('hide');
    }).onHandleResize(function(dimensions){
        image_edit_panel.setValues({
            left: dimensions.x,
            top: dimensions.y,
            width: dimensions.width,
            height: dimensions.height
        })
    }).onMove(function(x, y) {
        image_edit_panel.setValues({
            left: x,
            top: y
        });
    }).onUpdate(function(dimensions){
        image_edit_panel.setValues({
            width: dimensions.width,
            height: dimensions.height,
            left: dimensions.left,
            top: dimensions.top
        });
    }).onDoubleClick(function(data_url, x, y, left, top){
        var offset = PR2.whiteboard.getOffset();

        PR2.whiteboard.addImage(data_url, x - offset.left, y - offset.top, left, top);
        PR2.imageEditor.toggle('hide');
        image_edit_panel.toggle('hide');
    }).onEnter(function(data_url, x, y, left, top){
        var offset = PR2.whiteboard.getOffset();

        PR2.whiteboard.addImage(data_url, x - offset.left, y - offset.top, left, top);
        PR2.imageEditor.toggle('hide');
        image_edit_panel.toggle('hide');
    }).onCropLinesResize(function(dimensions){
        image_edit_panel.setValues({
            crop_left: dimensions.left,
            crop_top: dimensions.top,
            crop_right: dimensions.right,
            crop_bottom: dimensions.bottom
        });
    }).setClipping(offset);

    // SET FILEPICKER EVENTS
    PR2.filePicker.onImageLoaded(function(data_url,source, info, x, y) {
        if(source == 'image') {
            PR2.imageEditor.load(data_url, x, y);
        }
        else if(source == 'background') {
            PR2.whiteboard.setProperty('background', 'url(' + data_url + ')');
        }
    });

	 // Set FULLSCREEN CHANGE EVENT
	PR2.fullscreen.onFullscreenChange(function(fullscreenElement) {
		if(fullscreenElement == null)  {
			$.get('pr2_go_fullscreen').textContent = 'Go fullscreen (Ctrl-F)';
		}
		else {
			$.get('pr2_go_fullscreen').textContent =  'Leave fullscreen (Ctrl-F)'; 
		}
	});
	
	// Create Shortcut
    PR2.shortcuts.add({"key": 49, "action": function() { PR2.whiteboard.setProperty('action', 'point'); }});
	PR2.shortcuts.add({"key": 50, "action": function() {
        current_action = 'text';
        PR2.toolbar.focus("pr2_text_button");
        PR2.whiteboard.setProperty('action', 'editor');
    }});
    PR2.shortcuts.add({"key": 51, "action": function() {
        current_action = 'image';
        PR2.toolbar.focus("pr2_image_button");
        PR2.whiteboard.setProperty('action', 'editor');
    }});
	PR2.shortcuts.add({"key": 52, "action": function() { PR2.whiteboard.setProperty('action', 'paint'); }});
	PR2.shortcuts.add({"key": 53, "action": function() { PR2.whiteboard.setProperty('action', 'shape'); }});
    PR2.shortcuts.add({"key": 54, "action": function() { PR2.whiteboard.setProperty('action', 'pattern'); }});
	PR2.shortcuts.add({"key": 72, "action": function() { toggleWhiteboardHelpers() }});
	PR2.shortcuts.add({"key": 70, "action": function() { PR2.fullscreen.current() == null ? PR2.fullscreen.request(): PR2.fullscreen.cancel() }});
	PR2.shortcuts.add({"key": 90, "action": PR2.whiteboard.undo});
	PR2.shortcuts.add({"key": 89, "action": PR2.whiteboard.redo});

	
	
	// Resize the chat and cam fields to fit into the screen
	(function() {
		var canvas  = $.get('pr2_canvas'),
			chat_container = $.get('pr2_chat_container'),
			player_container = $.get('pr2_player_container'),
			canvas_right = canvas.width,
			max_width = 1500;

        chat_container.style.left = canvas_right + 3 + 'px';
        player_container.style.left = canvas_right + 3 + 'px';
        chat_container.style.top = canvas.height / 2 + 40 + 'px';

        // resize chat and cam fields on their right to a maximum of 'max_width'
         if (window.screen.availWidth > max_width) {
            chat_container.style.right = player_container.style.right = (window.screen.availWidth - max_width) + 'px';
         }
	})();
	
	// Set events that happen when a role of a user changes
	PR2.user.onRoleChange(function(role) {
		// set access to the whiteboard
		PR2.whiteboard.setAccess(role == 'creator');
		// set the access of the menu
		PR2.toolbar.setMenuAccess(role);
		// hide the control bar for the observer, show it for the creator
		PR2.toolbar.toggleControls(role == 'creator'? 'show': 'hide');
		// change the menu item text
		$.get('pr2_delegate_whiteboard').textContent = (role == 'creator') ? 'Delegate control': 'Take back control';

	});
	
	
	// Don't activate until there is a connection
	PR2.chatbox.toggleStatus('disable');


	// Hide the info connection screen when there is a connection
	PR2.peer.onConnection(function() {
		PR2.modals.info('hide');
		PR2.chatbox.toggleStatus('enable');
		// Set the user role
		setTimeout(function() { 
			PR2.user.setRole(level == 'teacher' ? 'creator': 'observer');
			PR2.camplayer.toggleControls('show');
		}, 50);
	}).onPeerInfo(function(type, data) {
		Socket.send({'type': type, 'data': data});
	}).onData(function(data) {
		data = JSON.parse(data);
		switch (data.type) {
			case 'receive-chat-message':
				PR2.chatbox.addMessage('remote', data.message); break;
			// Add file offer
			case 'receive-offer':
				PR2.download.receiveOffer(data.file_id, data.file_name); break;
			// Revoke a file offer
			case 'revoke-offer':
				PR2.download.revokeOffer(data.file_id); break;
			// Decline file offer decline
			case 'decline-offer':
				PR2.upload.declineOffer(data.file_id); break;
			// Accept offer
			case 'accept-offer':
				PR2.upload.acceptOffer(data.file_id); break;
			// Start file transfer, receive meta data	
			case 'start-file':
				PR2.download.receiveFileMetaData(data.file_id, data.file_name, data.file_size, data.file_type, data.chunk_count); break;
			// Receive a file chunk
			case 'receive-chunk':
				PR2.upload.informChunkReceived(); break;
			// Inform that a donload has completed
			case 'inform-download-completed':
				PR2.upload.informFileComplete(); break;
		}
	}).onWhiteboardData(function(data) {
            typeof data == 'object' ? receivePeerData(data) : receivePeerFragments(data.slice(0, 1), data.slice(1));
	});
    var handlePeerImageData = (function()  {
        var image_data = null;

        return function(state, data) {
            switch(state) {
                case 'init' :
                    image_data = {type: 'image', config: null, data: data};
                    image_data.data[4] = '';
                    break;
                case 'data':
                    image_data.data[4] += data;
                    break;
                case 'complete':
                    return image_data;
            }
        }

    })();
	
	// Start remote player when it arrives
	PR2.peer.onRemoteStream(function(stream) {
		PR2.camplayer.addRemoteStream(stream);
	});
	
	// Send stream when local stream starts
	PR2.camplayer.onStartLocalStream(function(stream){
		PR2.peer.addStream(stream);
	});
	
	// Send chat message to other peer
	PR2.chatbox.onMessageAdd(function(message) {
		PR2.peer.sendData(JSON.stringify({type: 'receive-chat-message', message: message}));
	});
	
	PR2.camplayer.onFullscreenButtonClick(function() {
		if (PR2.fullscreen.current() == null) {	
			PR2.fullscreen.request('pr2_player_container');
		}
		else {
			PR2.fullscreen.cancel();
		}
	});
	
	// Events fired when a file transfer link is clicked
	PR2.chatbox.onLinkClicked(function(action, file_id) {
		switch (action) {
			case 'revoke-offer':
				PR2.upload.revokeOffer(file_id); break;
			case 'decline-offer':
				PR2.download.declineOffer(file_id); break;
			case 'accept-offer':
				PR2.download.acceptOffer(file_id); break;
			case 'cancel-upload':
				PR2.upload.cancelFile(file_id); break;
			case 'cancel-download':
				PR2.download.cancelFile(file_id); break;
		}
	});
	
	// Add file from chat box to the upload list, note that this fires upload.onOfferCreate for each file
	PR2.chatbox.onFilesAdd(function(file_list){
		PR2.upload.addFiles(file_list);
	});
	
	// When offers are created from the upload object send them local and remote
	PR2.upload.onOfferCreate(function(file_id, file_name) {
		PR2.chatbox.addFileOffer(file_id, file_name, 'local');
		sendFileMetaDataToPeer({type: 'receive-offer', file_id: file_id, file_name: file_name});
	});
	
	// Receive a file offer and it to the chat
	PR2.download.onOfferReceive(function(file_id, file_name) {
		PR2.chatbox.addFileOffer(file_id, file_name, 'remote'); 
	});
	
	// Revoke a file offer and inform remote source
	PR2.upload.onOfferRevoke(function(file_id, file_name) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'upload-canceled');
		sendFileMetaDataToPeer({type: 'revoke-offer', file_id: file_id, file_name: file_name});
	});

	PR2.download.onOfferRevoke(function(file_id, file_name) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'download-canceled'); 
	});
	
	// Accept a file offer
	PR2.upload.onOfferAccept(function(file_id, file_name) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'upload-waiting');	
	});
	
	PR2.download.onOfferAccept(function(file_id, file_name) {
		sendFileMetaDataToPeer({type: 'accept-offer', file_id: file_id});
		PR2.chatbox.updateFileStatus(file_id, file_name, 'download-waiting');	
	});
	
	// Decline a file upload
	PR2.upload.onOfferDecline(function(file_id, file_name) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'download-canceled');
	});
	
	PR2.download.onOfferDecline(function(file_id, file_name) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'upload-canceled');
		sendFileMetaDataToPeer({type: 'decline-offer', file_id: file_id});
	});

	// Cancel a file
	PR2.upload.onFileCancel(function(file_id, file_name, source) {
		if (source == 'local') {
			PR2.chatbox.updateFileStatus(file_id, file_name, 'upload-canceled');
			sendFileMetaDataToPeer({type: 'cancel-upload', file_id: file_id, file_name: file_name});
		}
		else if (source == 'remote') {
			PR2.chatbox.updateFileStatus(file_id, file_name, 'download-canceled');
		}
	});
	
	PR2.download.onFileCancel(function(file_id, file_name, source) {
		if (source == 'local') {
			PR2.chatbox.updateFileStatus(file_id, file_name, 'upload-canceled');
			sendFileMetaDataToPeer({type: 'cancel-upload', file_id: file_id, file_name: file_name});
		}
		else if (source == 'renote') {
			PR2.chatbox.updateFileStatus(file_id, file_name, 'download-canceled');
		}
	});
	
	// Start a file upload (start with sending the file's meta data)
	PR2.upload.onFileStart(function(file_id, file_name, file_size, file_type, chunk_count) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'uploading');
		sendFileMetaDataToPeer({type: 'start-file', file_id: file_id, file_name: file_name, file_size: file_size, file_type: file_type, chunk_count:chunk_count});
	});
	
	PR2.download.onFileStart(function(file_id, file_name) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'downloading');
	});
	
	// Send file chunks to the download object
	PR2.peer.onFileData(function(file_chunk) {
		PR2.download.receiveFileChunk(file_chunk); 
	});
	
	// Send file chunks and update the progress bar
	PR2.upload.onFileProgress(function(file_id, file_chunk, file_progress) {
		PR2.chatbox.updateFileProgress(file_id, file_progress);
		PR2.peer.sendFileData(file_chunk);	
	});

	// Receiver informs senders about reception, intended for controlled file exchange
	PR2.download.onFileProgress(function(file_id, file_progress) {
		PR2.chatbox.updateFileProgress(file_id, file_progress);
		sendFileMetaDataToPeer({type: 'receive-chunk'});
	});

	// File exhchange is complete
	PR2.upload.onFileComplete(function(file_id, file_name) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'upload-completed');
	});
	
	PR2.download.onFileComplete(function(file_id, file_name, object_url) {
		PR2.chatbox.updateFileStatus(file_id, file_name, 'download-completed', object_url);
		sendFileMetaDataToPeer({type: 'inform-download-completed'});
	});
	
	
	
	// IN ONLINE MODUS OPEN A SOCKET CONNECTION
	if (mode == 'online') {
        Socket.onUsersConnect(function() {
			PR2.modals.info('show', 'You are connected to the ' + (level == 'teacher' ? 'student': 'teacher') + '. Initializing...');	
            PR2.peer.init();
            // create peer connection if user is teacher
            if(level == 'teacher') {
                PR2.peer.connect();
            }
        });
        // Send message to peer object from the socket server when information becomes available
        Socket.onMessage(function(message) {
            PR2.peer.addPeerInfo(message.type, message.data);
        });
        Socket.open(user[1], user[0]);

		// Set waiting splash screen
		PR2.modals.info('show', 'Waiting for ' + (level == 'teacher' ? 'student': 'teacher') + ' to join..');	
	}
	else if(mode == 'offline') {
		PR2.whiteboard.setAccess(true);
		PR2.user.setRole('creator');
	}

    // hide camplayer and chatbox if the available space is less than 200px
    $.subscribe(window, {
        resize: function() {
            offset = PR2.whiteboard.getOffset();
            if(window.innerWidth < offset.left + offset.right + 200) {
                PR2.camplayer.toggle('hide');
                PR2.chatbox.toggle('hide');
            }
            else {
                PR2.camplayer.toggle('show');
                PR2.chatbox.toggle('show');

            }
        }
    });

})(credentials, mode);











