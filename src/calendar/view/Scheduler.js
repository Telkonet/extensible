/**
 * Displays a view that is grouping events by the calendar they belong. Each calendar has it's own column on the UI.
 * This class does not usually need ot be used directly as you can use a {@link Extensible.calendar.CalendarPanel CalendarPanel}
 * to manage multiple calendar views at once including the scheduler view.
 */
Ext.define('Extensible.calendar.view.Scheduler', {
    extend: 'Extensible.calendar.view.Day',
    alias: 'widget.extensible.schedulerview',
    
    requires: [
        'Extensible.calendar.view.SchedulerHeader',
        'Extensible.calendar.view.SchedulerBody'
    ],

    /**
     * @cfg {Number} minColumnWidth
     * Defines the minimum width in pixels of a column.
     * If the calculated column width (which is equal and it is calculated such that all columns together fill the
     * space available to the view) is less  than the value of parameter minColumnWidth, then the column width is set to
     * minColumnWidth and horizontal scrollbars are introduced.
     */
    minColumnWidth: 80,

    // private
    isDayView: false,
    isSchedulerView: true,
    /**
     * @cfg {Array} templateCalendars
     * Stores the calendars data structure used in templates
     * It is populated by the logic.
     */
    templateCalendars: [],

    // private
    initComponent: function() {
        this.dayCount = 1;

        //we prepare the custom data structure that will be used only for the custom template rendering
        for (var i=0; i < this.calendarStore.data.items.length; i++) {
            //  if (this.calendarStore.data.items[i].data.IsHidden == true) continue;
            this.templateCalendars.push(this.calendarStore.data.items[i].data);
        }

        this.addCls('ext-cal-schedulerview');
        this.callParent(arguments);

        this.listeners = {
                /**
                 * @event eventcopytocalendar
                 * Fires after an event has been duplicated by the user via the "copy event" command.
                 * @param {Extensible.calendar.view.AbstractCalendar} this
                 * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event that was copied (with updated calendar data)
                 *
                 */
                eventcopytocalendar: {
                    fn: function(vw, rec) {
                        this.onEventCalendarCopyOrMove(rec, 'copy');
                    },
                    scope:this
                },
                /**
                 * @event eventmovetocalendar
                 * Fires after an event element has been moved to a new calendar and its data updated.
                 * @param {Extensible.calendar.view.AbstractCalendar} this
                 * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record}
                 * for the event that was moved with updated calendar data
                 */
                eventmovetocalendar: {
                    fn: function(vw, rec) {
                        this.onEventCalendarCopyOrMove(rec, 'move');
                    },
                    scope:this
                }
        };
    },

    getItemConfig: function(cfg) {

        var header = Ext.applyIf({
            xtype: 'extensible.schedulerheaderview',
            id: this.id+'-hd',
            ownerCalendarPanel: this.ownerCalendarPanel,
            templateCalendars: this.templateCalendars
        }, cfg);

        var body = Ext.applyIf({
            xtype: 'extensible.schedulerbodyview',
            enableEventResize: this.enableEventResize,
            showHourSeparator: this.showHourSeparator,
            viewStartHour: this.viewStartHour,
            viewEndHour: this.viewEndHour,
            scrollStartHour: this.scrollStartHour,
            hourHeight: this.hourHeight,
            id: this.id+'-bd',
            ownerCalendarPanel: this.ownerCalendarPanel,
            templateCalendars: this.templateCalendars
            }, cfg);

        return [header, body];
    },

    // private
    afterRender: function() {
        this.callParent(arguments);

        this.header = Ext.getCmp(this.id + '-hd');
        this.body  = Ext.getCmp(this.id + '-bd');

        this.calendarStore.on('update',this.calendarStoreUpdated,this); //triggers refresh if a calendar is hidden from the menu
        this.header.on('eventsrendered', this.forceSize, this);
        this.body.on('eventsrendered', this.forceSize, this);
        this.on('resize', this.onResize, this); //obsolete since it also calls this.forceSize method
    },
    
    // private
    refresh: function(reloadData) {
        Extensible.log('refresh (SchedulerView)');
        if (reloadData === undefined) {
            reloadData = false;
        }
        this.header.refresh(reloadData);
        this.body.refresh(reloadData);
    },

    /**
     * This method is redrawing the body and the header section of the view. Here is also the place where we ensure that the
     * width of each calendar column is computed using minColumnWidth parameter.
     */
    forceSize: function() {
        var me = this;

        // The defer call is mainly for good ol' IE, but it doesn't hurt in
        // general to make sure that the window resize is good and done first
        // so that we can properly calculate sizes.
        Ext.defer(function() {
            var ct = me.el.up('.x-panel-body'),
                //header = me.el.down('.ext-cal-day-header'),
                header = me.el.down('#app-calendar-scheduler-hd'),
                body = me.el.down('#app-calendar-scheduler-bd'),
                headerTable = header.el.down('.ext-cal-schedulerview-allday'),
                leftGutterWidth = header.el.down('.ext-cal-gutter').getWidth(),
                rightGutterWidth = header.el.down('.ext-cal-gutter-rt').getWidth(),
                computedHeaderTableWidth = ct.getWidth() - (leftGutterWidth + rightGutterWidth),
                calendars = me.calendarStore.getCount();

            Ext.Object.each(this.calendarStore.data.items,
                function(k, v){
                    if (v.data.IsHidden == true) {
                    calendars--;
                    }
                }
            );
            var minHeaderTableWidth = headerTable? calendars * me.minColumnWidth: false;
             // TEMPORARY DISABLED - it will be refactored!
            /*if (computedHeaderTableWidth) {
                if (computedHeaderTableWidth < minHeaderTableWidth) {
                    //set columns width to each calendar column:
                    var tbh = Ext.get(headerTable).down('tr'),
						tbd = tbh.next('tr'),
                        tbb = tbd.next('tr');
					tbh.select('th').setWidth(me.minColumnWidth);
					tbd.select('div').setWidth(me.minColumnWidth);
                    tbb.select('td td').setWidth(me.minColumnWidth);

                    Ext.get(body).down('table td.ext-cal-day-col > div').select('div[id^=' + this.body.id + this.body.dayColumnElIdDelimiter + '-outer]').setWidth(me.minColumnWidth);
                    header.setWidth(minHeaderTableWidth + (leftGutterWidth + rightGutterWidth));
                    body.setWidth(minHeaderTableWidth + (leftGutterWidth + rightGutterWidth));
                    me.addCls('ext-cal-overflow-x');
                } else {
                    me.removeCls('ext-cal-overflow-x');
                    header.down('div').down('div').setWidth(header.getWidth() - (leftGutterWidth + rightGutterWidth)); //Safari needs to have specified the width in px
					header.setWidth('100%');
                    body.setWidth('100%');
                }
            }
*/
            var  bodyHeight = ct ? ct.getHeight() - header.getHeight() : false;
            if (bodyHeight) {
                if (bodyHeight < me.minBodyHeight) {
                    bodyHeight = me.minBodyHeight;
                    me.addCls('ext-cal-overflow-y');
                } else {
                    me.removeCls('ext-cal-overflow-y');
                }
                me.el.down('.ext-cal-body-ct').setHeight(bodyHeight - 1);
            }
        }, Ext.isIE ? 1 : 0, me);
    },

    // handle event move or copy between calendars
    /**
     * This is method is called by the eventmovetocalendar and eventcopytocalendar
     * @param rec Event record to be moved/copied
     * @param mode
     */
    onEventCalendarCopyOrMove: function(rec, mode) {
        var mappings = Extensible.calendar.data.EventMappings,
            time = rec.data[mappings.IsAllDay.name] ? '' : ' \\a\\t g:i a',
            action = mode === 'copy' ? 'copied' : 'moved';

            rec.commit();

        var calendarId = rec.data[mappings.CalendarId.name];
        var calendarIdx = -1;

        Ext.Object.each(this.calendarStore.data.items,
                            function(k, v){
                                if (v.data.CalendarId === calendarId) {
                                    calendarIdx = k; return false;
                                }
                            }
                        );

        var msg = 'Event ' + rec.data[mappings.Title.name] + ' was ' + action + ' to ' +
            this.calendarStore.data.items[calendarIdx].data.Title + ' calendar';
        Ext.fly('app-msg').update(msg).removeCls('x-hidden');
    },

    /**
     * @param store
     * @param record
     * @param operation
     * @param modifiedFieldNames
     * @param eOpts
     */
    calendarStoreUpdated:function(store, record, operation, modifiedFieldNames, eOpts){
        if (modifiedFieldNames !== null) {
            if (operation == "edit" && modifiedFieldNames.indexOf("IsHidden") !== -1) {
                this.header.refresh(false);
                this.body.refresh(false);
            }
        }
    }
});