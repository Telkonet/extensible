/**
 * @class Extensible.calendar.view.DayBody
 * @extends Extensible.calendar.view.AbstractCalendar
 * <p>This is the scrolling container within the day and week views where non-all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link
 * Extensible.calendar.view.Day DayView} which aggregates this class and the {@link
 * Extensible.calendar.view.DayHeader DayHeaderView} into the single unified view
 * presented by {@link Extensible.calendar.CalendarPanel CalendarPanel}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.view.SchedulerBody', {
    extend: 'Extensible.calendar.view.DayBody',
    alias: 'widget.extensible.schedulerbodyview',

    requires: [
        'Ext.XTemplate'
    ],


    //private
    initComponent: function() {
        this.callParent(arguments);

        this.addEvents({
            /**
             * @event scrollx
             * Fires after the user scrolled the scheduler view horizontally.
             * @param {Extensible.calendar.view.SchedulerBody} this
             * @param {Extensible.calendar.data.EventModel} rec The original {@link
             * Extensible.calendar.data.EventModel record} for the event that was resized
             * @param {Object} data An object containing the new start and end dates that will be set into the
             * event record if the event is not canceled. Format of the object is: {StartDate: [date], EndDate: [date]}
             */
            scrollx: true,
            /**
             * @event scrolly
             * Fires after the user scrolled the scheduler view vertically.
             * @param {Extensible.calendar.view.SchedulerBody} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event that was resized containing the updated start and end dates
             */
            scrolly: true
        });

    },

    onScroll: function(e, t, eOpts) {
        var i = 1;

        this.fireEvent('scrolly', e, t, eOpts);
    },


    // private
    afterRender: function() {
        var el = this.getEl();
        el.on('scroll', this.onScroll, this);

        this.callParent(arguments);
    }


});