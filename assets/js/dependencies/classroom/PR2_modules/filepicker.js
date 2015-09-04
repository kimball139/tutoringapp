PR2 = window.PR2 || {};

/**
 * A simple static class to open a file picker
 * @class filePicker
 * @static
 */

PR2.filePicker = (function(self) {
    var	$ = PR2.utils;
    var file_picker = $.create("input", document.body , {"id" : "pr2_file_picker", "type": "file", "accept" : "image/*"}, {"display" : "none"});
    var reader = new FileReader();
    var trigger_source;
    var x_clicked;
    var y_clicked;
    var file_loaded;
    var file_info = {};

    $.subscribe(file_picker, {
        change: function(e){
            var file = this.files[0];

            // reset value required for chrome to refire the event
            this.value = '';
            if (typeof file.type == 'undefined' || !file.type.match(/image.*/)) return;
            e.preventDefault();
            reader.readAsDataURL(file);
            file_info = {size: file.size, type: file.type, name: file.name };
        }
    });

    reader.onload = function() {
        file_loaded(this.result, trigger_source, file_info, x_clicked, y_clicked);
    };


    self = {
        /**
         * Trigger the opening of a file picker
         *
         * @param {string} source a string to identify whaat triggered the event
         * @param {number} x a number representing the x point of clicking
         * @param {number} y a number representing the y point of clicking
         */
        triggerImagePicker: function(source,x, y) {
            file_picker.click();
            trigger_source = source;
            x_clicked = x || -1;
            y_clicked = y || -1;
        },
        /**
         * Fired when a file is loaded from a file picker
         *
         * @event onImageLoaded
         * @param data_url {DataURl} a data url string
         * @param file_info {Object} object containing name, type and size;
         * @param source {String} a string to identify whaat triggered the event
         */
        onImageLoaded: function(callback) {
            file_loaded = callback;
        }
    };

    return self;
})({});