/**
 * @class Extensible.calendar.view.Scheduler
 * @extends Extensible.calendar.view.Day
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.view.Scheduler', {
    extend: 'Extensible.calendar.view.Day',
    alias: 'widget.extensible.schedulerview',

    requires: [
        'Extensible.calendar.view.SchedulerBody',
        'Extensible.calendar.view.Timescale'
    ],


    /**
     * @cfg {Number} dayCount
     * The number of days to display in the view. Selected 5 just for testing.
     */
    dayCount: 5,

    isSchedulerView: true,

    layout: {
        type: 'hbox',
        pack: 'start',
        align: 'stretch'
    },

    getItemConfig: function(cfg) {

        var filler = {
            xtype: 'component',
            html: 'filler',
            height: 100,
            style: {
                'z-index': 100,
                'background-color': '#FFFFFF'
            }
        };

        var timeScale = Ext.applyIf({
            xtype: 'extensible.timescaleview',
            enableEventResize: this.enableEventResize,
            showHourSeparator: this.showHourSeparator,
            viewStartHour: this.viewStartHour,
            viewEndHour: this.viewEndHour,
            scrollStartHour: this.scrollStartHour,
            hourHeight: this.hourHeight,
            id: this.id+'-ts',
            flex: 1,
            ownerCalendarPanel: this.ownerCalendarPanel
        }, cfg);

        var leftCol = {
            xtype: 'container',
            layout: {
                type: 'vbox',
                align : 'stretch',
                pack  : 'start'
            },
            width: 60,
            items: [filler, timeScale]
        };

        var header = Ext.applyIf({
            xtype: 'extensible.dayheaderview',
            id: this.id+'-hd',
            ownerCalendarPanel: this.ownerCalendarPanel,
            height:100
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
            flex: 1
        }, cfg);

        var rightCol = {
            xtype: 'container',
            layout: {
                type: 'vbox',
                align : 'stretch',
                pack  : 'start'
            },
            flex: 1,
            items: [header, body]
        };

        return [leftCol, rightCol];
    },



    /**
     * Handles vertical scroll events from the body view.
     * @param e
     * @param t
     * @param eOpts
     */
    onScrollY: function(e, t, eOpts) {
        var i = 1;

        // Update scroll position of time scale
        this.timescale.scrollTo(t.scrollTop);
    },


    // private
    afterRender: function() {
        this.callParent(arguments);

        this.header = Ext.getCmp(this.id + '-hd');
        this.body = Ext.getCmp(this.id + '-bd');
        this.timescale = Ext.getCmp(this.id + '-ts' );
        this.timescaleContentEl = Ext.get('timescale-content');

        this.body.on('eventsrendered', this.forceSize, this);
        this.body.on('scrolly', this.onScrollY, this);
        this.on('resize', this.onResize, this);
    },


});