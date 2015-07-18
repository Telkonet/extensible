/**
 * Extensible core utilities and functions.
 */
Ext.define('Extensible', {
    
    singleton: true,
    
    /**
     * The version of the Extensible framework
     * @type String
     */
    version: '1.6.0-rc.1',
    /**
     * The version of the framework, broken out into its numeric parts. This returns an
     * object that contains the following integer properties: major, minor and patch.
     * @type Object
     */
    versionDetails: {
        major: 1,
        minor: 6,
        patch: 0
    },
    /**
     * The minimum version of Ext required to work with this version of Extensible, currently
     * 4.0.1. Note that the 4.0.0 Ext JS release is not compatible.
     * @type String
     */
    extVersion: '4.0.1',

    hasBorderRadius: Ext.supports.CSS3BorderRadius,

    log: function(s) {
        //console.log(s);
    },

    getScrollWidth: function() {
        return Ext.getScrollbarSize ? Ext.getScrollbarSize().width : Ext.getScrollBarWidth();
    },

    constructor: function() {
        // Have to make sure the body is ready since we are modifying it below
        Ext.onReady(function() {
            if (this.getScrollWidth() < 3) {
                // OSX Lion introduced dynamic scrollbars that do not take up space in the
                // body. Since certain aspects of the layout are calculated and rely on
                // scrollbar width, we add this class if needed so that we can apply
                // static style rules rather than recalculate sizes on each resize.
                // We check for less than 3 because the Ext scrollbar measurement gets
                // slightly padded (not sure the reason), so it's never returned as 0.
                Ext.getBody().addCls('x-no-scrollbar');
            }
            if (Ext.isWindows) {
                // There are a few Extensible-specific CSS fixes required only on Windows
                Ext.getBody().addCls('x-win');
            }
            if (Ext.getVersion('extjs').isLessThan('4.1')) {
                // Unfortunately some styling changed in 4.1 that requires version-specific
                // CSS differences to handle properly across versions. Ugh.
                Ext.getBody().addCls('x-4-0');
            }
        }, this);
    },

   /**
    * @class Extensible.Date
    * @extends Object
    * Contains utility date functions used by the calendar components.
    * @singleton
    */
    Date: {
        /**
         * Determines whether times used throughout all Extensible components should be displayed as
         * 12 hour times with am/pm (default) or 24 hour / military format. Note that some locale files
         * may override this value by default.
         * @type Boolean
         * @property use24HourTime
         */
        use24HourTime: false,
        
        /**
         * Returns the time duration between two dates in the specified units. For finding the number of
         * calendar days (ignoring time) between two dates use {@link Extensible.Date.diffDays diffDays} instead.
         * @param {Date} start The start date
         * @param {Date} end The end date
         * @param {String} unit (optional) The time unit to return. Valid values are 'millis' (the default),
         * 'seconds', 'minutes' or 'hours'.
         * @return {Number} The time difference between the dates in the units specified by the unit param,
         * rounded to the nearest even unit via Math.round().
         */
        diff: function(start, end, unit) {
            var denom = 1,
                diff = end.getTime() - start.getTime();
            
            if (unit === 's' || unit === 'seconds') {
                denom = 1000;
            }
            else if (unit === 'm' || unit === 'minutes') {
                denom = 1000*60;
            }
            else if (unit === 'h' || unit === 'hours') {
                denom = 1000*60*60;
            }
            return Math.round(diff / denom);
        },
        
        /**
         * Calculates the number of calendar days between two dates, ignoring time values.
         * A time span that starts at 11pm (23:00) on Monday and ends at 1am (01:00) on Wednesday is
         * only 26 total hours, but it spans 3 calendar days, so this function would return 2. For the
         * exact time difference, use {@link Extensible.Date.diff diff} instead.
         * 
         * NOTE that the dates passed into this function are expected to be in local time matching the
         * system timezone. This does not work with timezone-relative or UTC dates as the exact date
         * boundaries can shift with timezone shifts, affecting the output. If you need precise control
         * over the difference, use {@link Extensible.Date.diff diff} instead.
         * 
         * @param {Date} start The start date
         * @param {Date} end The end date
         * @return {Number} The number of calendar days difference between the dates
         */
        diffDays: function(start, end) {
            // All calculations are in milliseconds
            var day = 1000 * 60 * 60 * 24,
                clear = Ext.Date.clearTime,
                timezoneOffset = (start.getTimezoneOffset() - end.getTimezoneOffset()) * 60 * 1000,
                diff = clear(end, true).getTime() - clear(start, true).getTime() + timezoneOffset,
                days = Math.round(diff / day);
            
            return days;
        },
        
        /**
         * Copies the time value from one date object into another without altering the target's
         * date value. This function returns a new Date instance without modifying either original value.
         * @param {Date} fromDt The original date from which to copy the time
         * @param {Date} toDt The target date to copy the time to
         * @return {Date} The new date/time value
         */
        copyTime: function(fromDt, toDt) {
            var dt = Ext.Date.clone(toDt);
            
            dt.setHours(
                fromDt.getHours(),
                fromDt.getMinutes(),
                fromDt.getSeconds(),
                fromDt.getMilliseconds());
            
            return dt;
        },
        
        /**
         * Compares two dates and returns a value indicating how they relate to each other.
         * @param {Date} dt1 The first date
         * @param {Date} dt2 The second date
         * @param {Boolean} precise (optional) If true, the milliseconds component is included in the comparison,
         * else it is ignored (the default).
         * @return {Number} The number of milliseconds difference between the two dates. If the dates are equal
         * this will be 0.  If the first date is earlier the return value will be positive, and if the second date
         * is earlier the value will be negative.
         */
        compare: function(dt1, dt2, precise) {
            var d1 = dt1, d2 = dt2;
            
            if (precise !== true) {
                d1 = Ext.Date.clone(dt1);
                d1.setMilliseconds(0);
                d2 = Ext.Date.clone(dt2);
                d2.setMilliseconds(0);
            }
            return d2.getTime() - d1.getTime();
        },

        // helper fn
        maxOrMin: function(max) {
            var dt = max ? 0: Number.MAX_VALUE,
                i = 0,
                args = arguments[1],
                ln = args.length;
            
            for (; i < ln; i++) {
                dt = Math[max ? 'max': 'min'](dt, args[i].getTime());
            }
            return new Date(dt);
        },
        
        /**
         * Returns the maximum date value passed into the function. Any number of date
         * objects can be passed as separate params.
         * @param {Date} dt1 The first date
         * @param {Date} dt2 The second date
         * @param {Date} dtN (optional) The Nth date, etc.
         * @return {Date} A new date instance with the latest date value that was passed to the function
         */
		max: function() {
            return this.maxOrMin.apply(this, [true, arguments]);
        },
        
        /**
         * Returns the minimum date value passed into the function. Any number of date
         * objects can be passed as separate params.
         * @param {Date} dt1 The first date
         * @param {Date} dt2 The second date
         * @param {Date} dtN (optional) The Nth date, etc.
         * @return {Date} A new date instance with the earliest date value that was passed to the function
         */
		min: function() {
            return this.maxOrMin.apply(this, [false, arguments]);
        },
        
        isInRange: function(dt, rangeStart, rangeEnd) {
            return  (dt >= rangeStart && dt <= rangeEnd);
        },
        
        /**
         * Returns true if two date ranges overlap (either one starts or ends within the other, or one completely
         * overlaps the start and end of the other), else false if they do not.
         * @param {Date} start1 The start date of range 1
         * @param {Date} end1   The end date of range 1
         * @param {Date} start2 The start date of range 2
         * @param {Date} end2   The end date of range 2
         * @return {Booelan} True if the ranges overlap, else false
         */
        rangesOverlap: function(start1, end1, start2, end2) {
            var startsInRange = (start1 >= start2 && start1 <= end2),
                endsInRange = (end1 >= start2 && end1 <= end2),
                spansRange = (start1 <= start2 && end1 >= end2);
            
            return (startsInRange || endsInRange || spansRange);
        },
        
        /**
         * Returns true if the specified date is a Saturday or Sunday, else false.
         * @param {Date} dt The date to test
         * @return {Boolean} True if the date is a weekend day, else false
         */
        isWeekend: function(dt) {
            return dt.getDay() % 6 === 0;
        },
        
        /**
         * Returns true if the specified date falls on a Monday through Friday, else false.
         * @param {Date} dt The date to test
         * @return {Boolean} True if the date is a week day, else false
         */
        isWeekday: function(dt) {
            return dt.getDay() % 6 !== 0;
        },
        
        /**
         * Returns true if the specified date's time component equals 00:00, ignoring
         * seconds and milliseconds.
         * @param {Object} dt The date to test
         * @return {Boolean} True if the time is midnight, else false
         */
        isMidnight: function(dt) {
            return dt.getHours() === 0 && dt.getMinutes() === 0;
        },
        
        /**
         * Returns true if the specified date is the current browser-local date, else false.
         * @param {Object} dt The date to test
         * @return {Boolean} True if the date is today, else false
         */
        isToday: function(dt) {
            return this.diffDays(dt, this.today()) === 0;
        },
        
        /**
         * Convenience method to get the current browser-local date with no time value.
         * @return {Date} The current date, with time 00:00
         */
        today: function() {
            return Ext.Date.clearTime(new Date());
        },
        
        /**
         * Add time to the specified date and returns a new Date instance as the result (does not
         * alter the original date object). Time can be specified in any combination of milliseconds
         * to years, and the function automatically takes leap years and daylight savings into account.
         * Some syntax examples:
         *		var now = new Date();
         *		// Add 24 hours to the current date/time:
         *		var tomorrow = Extensible.Date.add(now, { days: 1 });
         *		// More complex, returning a date only with no time value:
         *		var futureDate = Extensible.Date.add(now, {
         *			weeks: 1,
         *			days: 5,
         *			minutes: 30,
         *			clearTime: true
         *		});
         * 
         * @param {Date} dt The starting date to which to add time
         * @param {Object} o A config object that can contain one or more of the following
         * properties, each with an integer value:
         *
         *	* millis
         *	* seconds
         *	* minutes
         *	* hours
         *	* days
         *	* weeks
         *	* months
         *	* years
         * 
         * You can also optionally include the property "clearTime: true" which will perform all of the
         * date addition first, then clear the time value of the final date before returning it.
         * @return {Date} A new date instance containing the resulting date/time value
         */
        add: function(dt, o) {
            if (!o) {
                return dt;
            }
            var ExtDate = Ext.Date,
                dateAdd = ExtDate.add,
                newDt = ExtDate.clone(dt);
            
            if (o.years) {
                newDt = dateAdd(newDt, ExtDate.YEAR, o.years);
            }
            if (o.months) {
                newDt = dateAdd(newDt, ExtDate.MONTH, o.months);
            }
            if (o.weeks) {
                o.days = (o.days || 0) + (o.weeks * 7);
            }
            if (o.days) {
                newDt = dateAdd(newDt, ExtDate.DAY, o.days);
            }
            if (o.hours) {
                newDt = dateAdd(newDt, ExtDate.HOUR, o.hours);
            }
            if (o.minutes) {
                newDt = dateAdd(newDt, ExtDate.MINUTE, o.minutes);
            }
            if (o.seconds) {
                newDt = dateAdd(newDt, ExtDate.SECOND, o.seconds);
            }
            if (o.millis) {
                newDt = dateAdd(newDt, ExtDate.MILLI, o.millis);
            }
             
            return o.clearTime ? ExtDate.clearTime(newDt): newDt;
        },
        
        clearTime: function(dt, clone) {
            return Ext.Date.clearTime(dt, clone);
        }
    }
});


/* =========================================================
 * @private
 * Ext overrides required by Extensible components
 * =========================================================
 */
Ext.require([
    'Ext.picker.Color',
    'Ext.form.Basic',
    'Ext.data.proxy.Memory'
]);

Extensible.applyOverrides = function() {

    var extVersion = Ext.getVersion('extjs');
    
    // This was fixed in Ext 4.0.5:
    if (Ext.layout.container.AbstractCard) {
        Ext.layout.container.AbstractCard.override({
            renderChildren: function () {
                // added check to honor deferredRender when rendering children
                if (!this.deferredRender) {
                    this.getActiveItem();
                    this.callParent();
                }
            }
        });
    }

    Ext.form.field.Time.override({
       isEqual: function(date1, date2){
           // check we have 2 date objects
           if ((date1 instanceof Date) && (date2 instanceof Date)) {
               return (date1.getTime() === date2.getTime());
           }
           // one or both isn't a date, only equal if both are false
           return !(date1 || date2);
       }
    });
    
    // This was fixed in Ext 4.0.4?
    Ext.Component.override({
        getId: function() {
            var me = this,
                xtype;
            
            if (!me.id) {
                xtype = me.getXType();
                xtype = xtype ? xtype.replace(/[\.,\s]/g, '-'): 'ext-comp';
                me.id = xtype + '-' + me.getAutoId();
            }
            return me.id;
        }
    });
    
    if (Ext.picker && Ext.picker.Color) {
        Ext.picker.Color.override({
            constructor: function() {
                // use an existing renderTpl if specified
                this.renderTpl = this.renderTpl || Ext.create('Ext.XTemplate', '<tpl for="colors"><a href="#" ' +
                    'class="color-{.}" hidefocus="on"><em><span style="background:#{.}" ' +
                    'unselectable="on">&#160;</span></em></a></tpl>');
    
                this.callParent(arguments);
            }
        });
    }
    
    if (extVersion.isLessThan('4.1')) {
        if (Ext.data && Ext.data.reader && Ext.data.reader.Reader) {
            Ext.data.reader.Reader.override({
                extractData: function(root) {
                    var me = this,
                        values  = [],
                        records = [],
                        Model   = me.model,
                        i       = 0,
                        length  = root.length,
                        node, id, record;

                    if (!root.length && Ext.isObject(root)) {
                        root = [root];
                        length = 1;
                    }

                    for (; i < length; i++) {
                        node   = root[i];
                        values = me.extractValues(node);

                        // Assuming that the idProperty is intended to use the id mapping, if
                        // available, getId() should read from the mapped values not the raw values.
                        // Using the non-mapped id causes updates later to silently fail since
                        // the updated data is replaced by id.
                        //id = me.getId(node);
                        id = me.getId(values);

                        record = new Model(values, id, node);
                        records.push(record);

                        if (me.implicitIncludes) {
                            me.readAssociated(record, node);
                        }
                    }

                    return records;
                }
            });
        }
    }
    
    if (Ext.form && Ext.form.Basic) {
        Ext.form.Basic.override({
            reset: function() {
                var me = this;
                // This causes field events to be ignored. This is a problem for the
                // DateTimeField since it relies on handling the all-day checkbox state
                // changes to refresh its layout. In general, this batching is really not
                // needed -- it was an artifact of pre-4.0 performance issues and can be removed.
                //me.batchLayouts(function() {
                    me.getFields().each(function(f) {
                        f.reset();
                    });
                //});
                return me;
            }
        });
    }

    // Currently MemoryProxy really only functions for read-only data. Since we want
    // to simulate CRUD transactions we have to at the very least allow them to be
    // marked as completed and successful, otherwise they will never filter back to the
    // UI components correctly.
    if (Ext.data && Ext.data.proxy && Ext.data.proxy.Memory) {
        Ext.data.proxy.Memory.override({
            updateOperation: function(operation, callback, scope) {
                Ext.each(operation.getRecords(), function(rec) {
                    // Synchronize record data (after update/create mapped fields are not updated)
                    Ext.iterate(Extensible.calendar.data.EventMappings, function (key, value) {
                        if (key != Extensible.calendar.data.EventMappings.EventId.name && rec.get(value.name)) {
                            rec.set(value.mapping, rec.get(value.name));
                        }
                    });

                    rec.commit();
                });

                operation.setCompleted(true);
                operation.setSuccessful(true);

                Ext.callback(callback, scope || this, [operation]);
            },
            create: function() {
                this.updateOperation.apply(this, arguments);
            },
            update: function() {
                this.updateOperation.apply(this, arguments);
            },
            erase: function() {
                this.updateOperation.apply(this, arguments);
            }
        });
    }
    
    // In Ext 4.0.x, CheckboxGroup's resetOriginalValue uses a defer hack that was removed
    // in 4.1. Unfortunately that defer hack causes a runtime error in certain situations
    // and is not really needed, so we'll replace any 4.0.x version with the new fixed version.
    if (extVersion.isLessThan('4.1') && Ext.form && Ext.form.CheckboxGroup) {
        Ext.form.CheckboxGroup.override({
            resetOriginalValue: function() {
                var me = this;
                
                me.eachBox(function(box) {
                    box.resetOriginalValue();
                });
                me.originalValue = me.getValue();
                me.checkDirty();
            }
        });
    }

    Ext.override(Ext.picker.Date, {
        selectedUpdate: function(date){
            var me        = this,
                t         = date.getTime(),
                cells     = me.cells,
                cls       = me.selectedCls,
                cellItems = cells.elements,
                c,
                cLen      = cellItems.length,
                cell,
                hdates    = me.highlightDates ? ';' + me.highlightDates.join(';') + ';' : false;

            cells.removeCls(cls);

            for (c = 0; c < cLen; c++) {
                cell = Ext.fly(cellItems[c]);

                if (cell.dom.firstChild.dateValue == t) {
                    me.fireEvent('highlightitem', me, cell);
                    cell.addCls(cls);

                    if(me.isVisible() && !me.doCancelFocus){
                        Ext.fly(cell.dom.firstChild).focus(50);
                    }

                    break;
                }
            }

            // Highlight dates displayed in view
            var current,
                cells = me.cells.elements;

            for(var i = 0; i < cells.length; ++i) {
                cells[i].className = cells[i].className.replace(' x-datepicker-highlight', '');

                if (hdates){
                    current = new Date(cells[i].title);
                    if (hdates.indexOf(';' + Ext.Date.format(current, 'Y-m-d') + ';') != -1) {
                        cells[i].className += ' x-datepicker-highlight';
                    }
                }
            }
        },
        fullUpdate: function(date){
            var me = this,
                cells = me.cells.elements,
                textNodes = me.textNodes,
                disabledCls = me.disabledCellCls,
                eDate = Ext.Date,
                i = 0,
                extraDays = 0,
                visible = me.isVisible(),
                sel = +eDate.clearTime(date, true),
                today = +eDate.clearTime(new Date()),
                min = me.minDate ? eDate.clearTime(me.minDate, true) : Number.NEGATIVE_INFINITY,
                max = me.maxDate ? eDate.clearTime(me.maxDate, true) : Number.POSITIVE_INFINITY,
                ddMatch = me.disabledDatesRE,
                ddText = me.disabledDatesText,
                ddays = me.disabledDays ? me.disabledDays.join('') : false,
                ddaysText = me.disabledDaysText,
                format = me.format,
                days = eDate.getDaysInMonth(date),
                firstOfMonth = eDate.getFirstDateOfMonth(date),
                startingPos = firstOfMonth.getDay() - me.startDay,
                previousMonth = eDate.add(date, eDate.MONTH, -1),
                longDayFormat = me.longDayFormat,
                disabled,
                prevStart,
                current,
                disableToday,
                tempDate,
                setCellClass,
                html,
                cls,
                formatValue,
                value,
                hdates = me.highlightDates ? ';' + me.highlightDates.join(';') + ';' : false;

            if (startingPos < 0) {
                startingPos += 7;
            }

            days += startingPos;
            prevStart = eDate.getDaysInMonth(previousMonth) - startingPos;
            current = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), prevStart, me.initHour);

            if (me.showToday) {
                tempDate = eDate.clearTime(new Date());
                disableToday = (tempDate < min || tempDate > max ||
                (ddMatch && format && ddMatch.test(eDate.dateFormat(tempDate, format))) ||
                (ddays && ddays.indexOf(tempDate.getDay()) != -1));

                if (!me.disabled) {
                    me.todayBtn.setDisabled(disableToday);
                    me.todayKeyListener.setDisabled(disableToday);
                }
            }

            setCellClass = function(cell, cls){
                cell.className = cell.className.replace('x-datepicker-highlight','');
                disabled = false;
                value = +eDate.clearTime(current, true);
                cell.title = eDate.format(current, longDayFormat);
                // store dateValue number as an expando
                cell.firstChild.dateValue = value;
                if(value == today){
                    cls += ' ' + me.todayCls;
                    cell.title = me.todayText;
                }
                if(value == sel){
                    cls += ' ' + me.selectedCls;
                    me.fireEvent('highlightitem', me, cell);
                    if (visible && me.floating) {
                        Ext.fly(cell.firstChild).focus(50);
                    }
                }
                // disabling, once the cell is disabled we can short circuit
                // the other more expensive checks
                if(value < min) {
                    cls += ' ' + disabledCls;
                    cell.title = me.minText;
                    disabled = true;
                }
                if (!disabled && value > max) {
                    cls += ' ' + disabledCls;
                    cell.title = me.maxText;
                    disabled = true;
                }
                if (!disabled && ddays) {
                    if(ddays.indexOf(current.getDay()) !== -1){
                        cell.title = ddaysText;
                        cls += ' ' + disabledCls;
                        disabled = true;
                    }
                }
                if(!disabled && ddMatch && format){
                    formatValue = eDate.dateFormat(current, format);
                    if(ddMatch.test(formatValue)){
                        cell.title = ddText.replace('%0', formatValue);
                        cls += ' ' + disabledCls;
                    }
                }
                if (hdates){
                    if (hdates.indexOf(';' + eDate.format(current, 'Y-m-d') + ';') != -1) {
                        cls += ' x-datepicker-highlight';
                    }
                }

                cell.className = cls + ' ' + me.cellCls;
            };

            for(; i < me.numDays; ++i) {
                if (i < startingPos) {
                    html = (++prevStart);
                    cls = me.prevCls;
                } else if (i >= days) {
                    html = (++extraDays);
                    cls = me.nextCls;
                } else {
                    html = i - startingPos + 1;
                    cls = me.activeCls;
                }
                textNodes[i].innerHTML = html;
                current.setDate(current.getDate() + 1);
                setCellClass(cells[i], cls);
            }

            me.monthBtn.setText(Ext.Date.format(date, me.monthYearFormat));
        }
    });

};

Ext.onReady(Extensible.applyOverrides);