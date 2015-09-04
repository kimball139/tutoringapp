/**
 * A static class to get, remove and add shape objects to  a collection. Note that a shape object constist of the following:
 * the key is the name of the shape by convention, the value is another object which contains: the following keys:title, style and shapeFunction
 * @class shapes
 * @static
*/
PR2.shapes = (function(self) {	
	var collection = {};
    var _add_shape_handler = function(shape){};
    var _remove_shape_handler = function(shape){};

	var _add = function(shape_object) {
		var shape = Object.keys(shape_object)[0];
		collection[shape] = shape_object[shape];
		_add_shape_handler([shape]);
	};

	var _addMultiple = function(add_collection){
		var shapes = [];

        Object.getOwnPropertyNames(add_collection).forEach(function(key) {
            collection[key] = add_collection[key];
            shapes.push(key);
        });
		_add_shape_handler(shapes);
	};

	var _get = function(shape) {
		var obj = collection[shape];
		if (typeof collection[shape] == 'undefined') { throw new Error('This shape does not exist'); }
		obj.name = shape;
		return obj ;
	};

	var _getAll = function() {
        var all = {};

        Object.getOwnPropertyNames(collection).forEach(function(item) {
                all[item] = collection[item];
        });
		return all;
	};
	var _remove = function(shape) {
		if (typeof collection[shape] == 'undefined') { throw new Error('This shape does not exist'); }
		delete collection[shape];
		_remove_shape_handler([shape]);
	};

	self = {
		/**
		 * Add a shape to the Shape object
		 * @param {object} shape_object the object with information about the shape.
         * @returns {self}
		 */
		add : function(shape_object) {
            if(typeof shape_object != 'object') {
                throw new Error('parameter must be an object');
            }
            else if(collection.hasOwnProperty(Object.keys(shape_object)[0])) {
                throw new Error('shape is already added');
            }
			_add(shape_object);
            return this;
		},
		/**
		 * Add a collection (which is an object itself) of shapes to the internal shape collection
		 *
		 * @param {object} shape_object_collection An object collection of shape objects
		 */
		addMultiple : function(shape_object_collection) {
			_addMultiple(shape_object_collection);
		},
		/**
		 * Get a shape object from the collection
		 *
		 * @param {string} shape the name (key) that represents the shape to be retrieved
		 * @returns {object} an object with the information about a shape
		 */
		get : function(shape) {
			return _get(shape);
		},
		/**
		 * Get all the shapes from the collection
		 *
		 * @return {object} an object with a collection of shape objects
		 */
		getAll : function() {
			return _getAll();
		},
		/**
		 * Remove a shape from the collection
		 *
		 * @param {string[]} shape An array that contains the name of the shape to be removed
		 */
		remove : function(shape) {			
			_remove(shape);
            return this;
		},
		/**
		 * Fired when a shape is added
		 * @event onAdd
		 * @param {string[]} shapes An array that contains the names of the shapes that where added
		 */
		onAdd : function(callback) {
			if (typeof callback != 'function') {
				throw new Error('This is not a function');
			}
			_add_shape_handler = callback;
            return this;
		},
		/**
		 * Fired when a shape is removed
		 * @event onRemove
		 * @param {string} shape The name of the shape that was removed
		 */
		onRemove : function(callback) {
			if (typeof callback != 'function') {
				throw new Error('This is not a function');
			}
			_remove_shape_handler = callback;
		}			
	};
	
	return self;

})({});