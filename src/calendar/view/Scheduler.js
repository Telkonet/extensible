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