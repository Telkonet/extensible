/**
 * The base Model class used by Extensible
 */
Ext.define('Extensible.data.Model', {
    extend: 'Ext.data.Model',
    
    requires: [
        'Ext.util.MixedCollection'
    ],

    // *Must* be defined by subclasses
    mappingClass: null,
    
    // Should be defined by subclasses, or will default to the default Model id property
    mappingIdProperty: null,
    
    inheritableStatics: {
        /**
         * Reconfigures the default model definition based on the current
         * {@link #mappingClass Mappings} class.
         * @method reconfigure
         * @static
         * @return {Function} The updated constructor function
         */
        reconfigure: function() {
            var proto = this.prototype,
                mappings = Ext.ClassManager.get(proto.mappingClass || ''),
                idProperty = proto.mappingIdProperty,
                prop,
                newFields = [],
                i = 0,
                len = 0,
                ordinal,
                field,
                name;
            
            if (!mappings) {
                throw 'The mappingClass for ' + this.$className + ' is undefined or invalid';
            }
            // TODO: Add this as a compile-time warning:
            //if (!idProperty) {
                // idProperty should usually be defined at this point, so make sure it's not missing
            //}
            
            // It is critical that the id property mapping is updated in case it changed, since it
            // is used elsewhere in the data package to match records on CRUD actions:
            proto.idProperty = idProperty || proto.idProperty || 'id';

            // Generate an array of fields.
            for (prop in mappings) {
                if(mappings.hasOwnProperty(prop)) {
                    newFields.push(mappings[prop]);
                }
            }

            // Remove old fields and set new fields.
            // This should be as simple as calling replaceFields()
            // this.replaceFields(fields, true);
            // But, replaceFields() is not working properly. This was also reported by other users. See
            // http://www.sencha.com/forum/showthread.php?297283
            //
            // For now, the following hack is used to work around the problem with replaceFields. This logic was
            // copied from Ext.data.Model.replaceFields() and slightly adjusted.
            proto.fields.length = 0;
            proto.fieldsMap = {};
            proto.fieldOrdinals = {};

            // Add new fields
            for (i = 0, len = newFields ? newFields.length : 0; i < len; i++) {
                name = (field = newFields[i]).name;

                if (!(name in proto.fieldOrdinals)) {
                    proto.fieldOrdinals[name] = ordinal = proto.fields.length; // 0-based
                    proto.fields.push(field = Ext.data.field.Field.create(field));

                    proto.fieldsMap[name] = field;
                    field.ordinal = ordinal;
                    field.definedBy = field.owner = this; // Ext.data.NodeInterface
                }
            }
            return this;
        }
    },
    
    /**
     * Returns a new instance of this Model with the `data` property deep-copied from the
     * original record. By default the {@link #idProperty} value will be deleted to avoid returning
     * the cloned record with a duplicate id, but you can optionally preserve the id by passing `true`.
     *
     * The behavior is different than the default {@link Ext.data.Model#copy} (which preserves the
     * existing id by default and performs a shallow copy of the data) and is better-suited
     * to the typical default desired behavior when duplicating a record.
     *
     * @param {Boolean} [preserveId=false] True to preserve the record's data {@link idProperty id},
     * false to delete it in the returned clone
     * @return {Extensible.data.Model} The cloned record
     */
    clone: function(preserveId) {
        var copy = Ext.create(this.$className),
            dataProp = 'data';
        
        copy[dataProp] = Ext.Object.merge({}, this[dataProp]);
        
        if (preserveId !== true) {
           copy[dataProp][this.idProperty] = null;
           copy[dataProp]['id'] = null;
        }

        return copy;
    }
});