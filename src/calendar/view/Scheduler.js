/**
 * Scheduler view displays events for each calendar in their own column. It currently support a time span of one day.
 * This class does not usually need ot be used directly as you can use a {@link Extensible.calendar.CalendarPanel
 * CalendarPanel} to manage multiple calendar views at once including the scheduler view.
 * @author Alin Miron, reea.net
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

    initComponent: function() {
        this.addCls('ext-cal-schedulerview');
        this.callParent(arguments);
    },

    getItemConfig: function(cfg) {
        var header = Ext.applyIf({
            xtype: 'extensible.schedulerheaderview',
            id: this.id+'-hd'
        }, cfg);

        var body = Ext.applyIf({
            xtype: 'extensible.schedulerbodyview',
            enableEventResize: this.enableEventResize,
            showHourSeparator: this.showHourSeparator,
            viewStartHour: this.viewStartHour,
            viewEndHour: this.viewEndHour,
            scrollStartHour: this.scrollStartHour,
            hourHeight: this.hourHeight,
            id: this.id+'-bd'
            }, cfg);

        return [header, body];
    }
});