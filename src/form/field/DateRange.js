/**
 * A combination field that includes start and end dates and times, as well as an optional all-day checkbox.
 */
Ext.define('Extensible.form.field.DateRange', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.extensible.daterangefield',
    
    requires: [
        'Ext.form.field.Date',
        'Ext.form.field.Time',
        'Ext.form.Label',
        'Ext.form.field.Checkbox'
    ],
    
    /**
     * @cfg {String} toText
     * The text to display in between the date/time fields (defaults to 'to')
     */
    toText: 'to',
    /**
     * @cfg {String} allDayText
     * The text to display as the label for the all day checkbox (defaults to 'All day')
     */
    allDayText: 'All day',
    /**
     * @cfg {String/Boolean} singleLine
     * <tt>true</tt> to render the fields all on one line, <tt>false</tt> to break the start
     * date/time and end date/time into two stacked rows of fields to preserve horizontal space
     * (defaults to <tt>true</tt>).
     */
    singleLine: true,
    /*
     * @cfg {Number} singleLineMinWidth -- not currently used
     * If {@link singleLine} is set to 'auto' it will use this value to determine whether to render the field on one
     * line or two. This value is the approximate minimum width required to render the field on a single line, so if
     * the field's container is narrower than this value it will automatically be rendered on two lines.
     */
    //singleLineMinWidth: 490,
    /**
     * @cfg {String} dateFormat
     * The date display format used by the date fields (defaults to 'n/j/Y')
     */
    dateFormat: 'n/j/Y',
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,

    /**
     * @cfg {Ext.Date | null} startDate
     * Store the initial start date
     */
    startDate: null,

    /**
     * @cfg {String} singleLine
     * Alternative formats for date pickers
     */
    alternativeDateFormats: 'm/d/Y|n/j/Y|n/j/y|m/j/y|n/d/y|m/j/Y|n/d/Y|m-d-y|n-j-y|m-d-Y|n-j-Y|m/d|m-d|md|mdy|mdY|d|j|Y-m-d|n-j|n/j',

    /**
     * @cfg {String} singleLine
     * Alternative formats for time pickers
     */
    alternativeTimeFormats: 'g:ia|g:iA|g:i a|g:i A|h:i|g:i|H:i|ga|ha|gA|h a|g a|g A|gi|hi|gia|hia|g|H|gi a|hi a|giA|hiA|gi A|hi A|g.i a|g.i A|G.i|Gi|h.i|hi',

    fieldLayout: {
        type: 'hbox',
        defaultMargins: { top: 0, right: 5, bottom: 0, left: 0 }
    },
    
    initComponent: function() {
        var me = this;
        /**
         * @cfg {String} timeFormat
         * The time display format used by the time fields. By default the DateRange uses the
         * {@link Extensible.Date.use24HourTime} setting and sets the format to 'g:i A' for 12-hour time (e.g., 1:30 PM)
         * or 'G:i' for 24-hour time (e.g., 13:30). This can also be overridden by a static format string if desired.
         */
        me.timeFormat = me.timeFormat || (Extensible.Date.use24HourTime ? 'G:i' : 'g:i A');
        
        me.addCls('ext-dt-range');

        if (me.singleLine) {
            me.layout = me.fieldLayout;
            me.items = me.getFieldConfigs();
        }
        else {
            me.items = [{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getStartDateConfig(),
                    me.getStartTimeConfig(),
                    me.getDateSeparatorConfig()
                ]
            },{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getEndDateConfig(),
                    me.getEndTimeConfig(),
                    me.getAllDayConfig()
                ]
            }];
        }
        
        me.callParent(arguments);
        me.initRefs();
    },

    initRefs: function() {
        var me = this;
        me.startDate = me.down('#' + me.id + '-start-date');
        me.startTime = me.down('#' + me.id + '-start-time');
        me.endTime = me.down('#' + me.id + '-end-time');
        me.endDate = me.down('#' + me.id + '-end-date');
        me.allDay = me.down('#' + me.id + '-allday');
        me.toLabel = me.down('#' + me.id + '-to-label');
    },
    
    getFieldConfigs: function() {
        var me = this;
        return [
            me.getStartDateConfig(),
            me.getStartTimeConfig(),
            me.getDateSeparatorConfig(),
            me.getEndTimeConfig(),
            me.getEndDateConfig(),
            me.getAllDayConfig()
        ];
    },
    
    getLayoutItems: function(singleLine) {
        var me = this;
        return singleLine ? me.items.items : [[
            me.startDate, me.startTime, me.toLabel
        ],[
            me.endDate, me.endTime, me.allDay
        ]];
    },
    
    getStartDateConfig: function() {
        return {
            xtype: 'datefield',
            id: this.id + '-start-date',
            format: this.dateFormat,
            altFormats: this.alternativeDateFormats,
            // OVERRIDE: Save space
            // width: 100,
            width: 94,
            startDay: this.startDay,
            validator: function(value){
                var me = this.up();

                if (me.endDate){
                    // start date has been changed; change also the min value of end date & time fields
                    me.endDate.setMinValue(this.getValue());
                    me.endDate.validate();
                }

                return true;
            },
            listeners: {
                change: {
                    fn: function(el, newValue, oldValue) {
                        this.onFieldChange('date', 'start', newValue, oldValue);
                    },
                    scope: this
                }
            }
        };
    },
    
    getStartTimeConfig: function() {
        return {
            xtype: 'timefield',
            id: this.id + '-start-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            // OVERRIDE: Save space
            // width: 90,
            width: 80,
            format: this.timeFormat,
            altFormats: this.alternativeTimeFormats,
            listeners: {
                change: {
                    fn: function(el, newValue, oldValue) {
                        this.onFieldChange('time', 'start', newValue, oldValue);
                    },
                    scope: this
                }
            }
        };
    },
    
    getEndDateConfig: function() {
        return {
            xtype: 'datefield',
            id: this.id + '-end-date',
            format: this.dateFormat,
            altFormats: this.alternativeDateFormats,
            hideLabel: true,
            // OVERRIDE: Save space
            // width: 100,
            width: 94,
            startDay: this.startDay,
            //minValue: new Date(), // disable the past days
            validateOnChange: true,
            validateOnBlur: true,
            validator: function(value){
                var me = this.up();

                if (me.startDate){
                    // disable past dates in end date picker
                    this.setMinValue(me.startDate.getValue());
                    // validate the end time field: the current value might become invalid
                    me.endTime.validate();
                }

                return true;
            },
            listeners: {
                change: {
                    fn: function(el, newValue, oldValue) {
                        this.onFieldChange('date', 'end', newValue, oldValue);
                    },
                    scope: this
                }
            }
        };
    },
    
    getEndTimeConfig: function() {
        return {
            xtype: 'timefield',
            id: this.id + '-end-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            // OVERRIDE: Save space
            // width: 100,
            width: 80,
            format: this.timeFormat,
            altFormats: this.alternativeTimeFormats,
            validateOnChange: true,
            validateOnBlur: true,
            validator: function(value){
                var me = this.up();

                if (me.startDate && me.endDate){
                    var startDate = me.startDate.getValue(),
                        endDate = me.endDate.getValue();

                    if ((startDate instanceof Date) && (endDate instanceof Date)){
                        if (me.areEqual(startDate, endDate)){
                            this.setMinValue(me.startTime.getValue());
                        } else {
                            this.setMinValue(null);
                        }
                    }
                }

                return true;
            },
            listeners: {
                change: {
                    fn: function(el, newValue, oldValue) {
                        this.onFieldChange('time', 'end', newValue, oldValue);
                    },
                    scope: this
                },
                expand: {
                    fn:  function(field) {
                        var item = this.findRecordByDisplay(this.getRawValue());
                        if (item){
                            this.select(item);
                        }
                    }
                }
            }
        };
    },
    
    getAllDayConfig: function() {
        return {
            xtype: 'checkbox',
            id: this.id + '-allday',
            hidden: this.showTimes === false || this.showAllDay === false,
            boxLabel: this.allDayText,
            margins: { top: 2, right: 5, bottom: 0, left: 0 },
            handler: this.onAllDayChange,
            scope: this
        };
    },
    
    onAllDayChange: function(chk, checked) {
        this.startTime.setVisible(!checked);
        this.endTime.setVisible(!checked);
    },
    
    getDateSeparatorConfig: function() {
        return {
            xtype: 'label',
            id: this.id + '-to-label',
            text: this.toText,
            margins: { top: 4, right: 5, bottom: 0, left: 0 }
        };
    },
    
    isSingleLine: function() {
        var me = this;
        
        if (me.calculatedSingleLine === undefined) {
            if(me.singleLine === 'auto') {
                var ownerCtEl = me.ownerCt.getEl(),
                    w = me.ownerCt.getWidth() - ownerCtEl.getPadding('lr'),
                    el = ownerCtEl.down('.x-panel-body');
                    
                if(el) {
                    w -= el.getPadding('lr');
                }
                
                el = ownerCtEl.down('.x-form-item-label');
                
                if(el) {
                    w -= el.getWidth() - el.getPadding('lr');
                }
                me.calculatedSingleLine = w <= me.singleLineMinWidth ? false : true;
            }
            else {
                me.calculatedSingleLine = me.singleLine !== undefined ? me.singleLine : true;
            }
        }
        return me.calculatedSingleLine;
    },
    
    onFieldChange: function(type, startend, newValue, oldValue) {
        this.checkDates(type, startend, newValue, oldValue);
        this.fireEvent('change', this, this.getValue());
    },
        
    checkDates: function(type, startend, newValue, oldValue) {
        var me = this,
            typeCap = type === 'date' ? 'Date' : 'Time',
            startField = this['start' + typeCap],
            endField = this['end' + typeCap],
            startValue = me.getDT('start'),
            endValue = me.getDT('end');

        if(type === 'date') {
            //me.checkDates('time', startend);

            if (startend === 'start'){
                var diffDays;

                if (endValue && newValue && oldValue){
                    diffDays = this.dateDiffInDays(newValue, oldValue);

                    endValue.setDate(endValue.getDate() + diffDays);
                    this['endDate'].setValue(endValue);
                }
            }
        }
        else if (type == 'time'){
            if (startend == 'start'){
                var diffMinutes;

                if (newValue && oldValue){
                    diffMinutes = this.timeDiffInMinutes(newValue, oldValue);

                    // Add(or remove) minutes to current end date; Update both end date & time fields
                    var newDate = new Date(endValue.getTime() + diffMinutes * 60000);
                    this['endTime'].setValue(newDate);
                    this['endDate'].setValue(newDate);

                    this['endDate'].validate();
                    this['endTime'].validate();

                }
            }
        }
    },
    
    /**
     * Returns an array containing the following values in order:
     * 
     *	* **<tt>DateTime</tt>**
     *		* The start date/time
     *	* **<tt>DateTime</tt>**
     *		* The end date/time
     *	* **<tt>Boolean</tt>**
     *		* True if the dates are all-day, false if the time values should be used
     * @return {Array} The array of return values
     */
    getValue: function() {
        return [
            this.getDT('start'),
            this.getDT('end'),
            this.allDay.getValue()
        ];
    },

    // getValue helper
    getDT: function(startend) {
        var time = this[startend+'Time'].getValue(),
            dt = this[startend+'Date'].getValue();
            
        if(Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, this[startend + 'Date'].format);
        }
        else{
            return null;
        }
        
        if(time && time !== '') {
            time = Ext.Date.format(time, this[startend+'Time'].format);
            var val = Ext.Date.parseDate(dt + ' ' + time, this[startend+'Date'].format + ' ' + this[startend+'Time'].format);
            return val;
            //return Ext.Date.parseDate(dt+' '+time, this[startend+'Date'].format+' '+this[startend+'Time'].format);
        }
        return Ext.Date.parseDate(dt, this[startend+'Date'].format);
        
    },
    
    /**
     * Sets the values to use in the date range.
     * @param {Array/Date/Object} v The value(s) to set into the field. Valid types are as follows:
     * 
     *	* **<tt>Array</tt>**
     *		* An array containing, in order, a start date, end date, and all-day flag. This array should exactly match the return type as specified by {@link #getValue}.
     *	* **<tt>DateTime</tt>**
     *		* A single Date object, which will be used for both the start and end dates in the range. The all-day flag will be defaulted to false.
     *	* **<tt>Object</tt>**
     *		* An object containing properties for StartDate, EndDate and IsAllDay as defined in {@link Extensible.calendar.data.EventMappings}.
     */
    setValue: function(v) {
        if(!v) {
            return;
        }
        var me = this,
            eventMappings = Extensible.calendar.data.EventMappings,
            startDateName = eventMappings.StartDate.name;
            
        if(Ext.isArray(v)) {
            me.setDT(v[0], 'start');
            me.setDT(v[1], 'end');
            me.allDay.setValue(!!v[2]);
        }
        else if(Ext.isDate(v)) {
            me.setDT(v, 'start');
            me.setDT(v, 'end');
            me.allDay.setValue(false);
        }
        else if(v[startDateName]) { //object
            me.setDT(v[startDateName], 'start');
            if(!me.setDT(v[eventMappings.EndDate.name], 'end')) {
                me.setDT(v[startDateName], 'end');
            }
            me.allDay.setValue(!!v[eventMappings.IsAllDay.name]);
        }
    },
    
    // setValue helper
    setDT: function(dt, startend) {
        if(dt && Ext.isDate(dt)) {
            this[startend + 'Date'].setValue(dt);
            this[startend + 'Time'].setValue(Ext.Date.format(dt, this[startend + 'Time'].format));
            return true;
        }
    },
    
    /**
     * @protected 
     */
    isDirty: function() {
        var dirty = false;
        if(this.rendered && !this.disabled) {
            this.items.each(function(item) {
                if (item.isDirty()) {
                    dirty = true;
                    return false;
                }
            });
        }
        return dirty;
    },
    
    /**
     * @protected 
     */
    reset: function() {
        this.delegateFn('reset');
    },
    
    delegateFn: function(fn) {
        this.items.each(function(item) {
            if (item[fn]) {
                item[fn]();
            }
        });
    },
    
    beforeDestroy: function() {
        Ext.destroy(this.fieldCt);
        this.callParent(arguments);
    },

    dateDiffInDays: function (a, b) {
        if ((a instanceof Date) && (b instanceof Date)) {
            var msPerDay = 1000 * 60 * 60 * 24,
                utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()),
                utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

            return Math.ceil((utc1 - utc2) / msPerDay);
        }
        return null;
    },

    timeDiffInMinutes: function(a, b){
        var msPerMinute = 1000 * 60,
            diff = a.getTime() - b.getTime(); // this is a time in milliseconds

        return Math.ceil(diff / msPerMinute);
    },

    areEqual: function(a, b){
        if (!a || !b) return null;

        if (!(a instanceof Date)) {
            a = new Date(a);
        }

        if (!(b instanceof Date)) {
            b = new Date(b);
        }

        return (a.getFullYear() == b.getFullYear() && a.getMonth() == b.getMonth() && a.getDate() == b.getDate());
    },

    /**
     * @method getRawValue
     * @hide
     */
    getRawValue: Ext.emptyFn,
    /**
     * @method setRawValue
     * @hide
     */
    setRawValue: Ext.emptyFn
});