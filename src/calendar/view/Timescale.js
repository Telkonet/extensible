/**
 * @class Extensible.calendar.view.Timescale
 * @extends Extensible.calendar.view.AbstractCalendar
 * <p>This is the timescale header on the left side  of the scheduler view.
 * Normally you should not need to use this class directly -- instead you should use {@link
 * Extensible.calendar.view.Scheduler SchedulerView}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.view.Timescale', {
    extend: 'Ext.Component',
    alias: 'widget.extensible.timescaleview',

    requires: [
        'Ext.XTemplate',
        'Extensible.calendar.template.Timescale'
    ],

    //private
    hourIncrement: 60,

    //private
    refresh: function(reloadData) {
        Extensible.log('refresh (TimescaleView)');
        var top = this.el.getScroll().top;

        this.callParent(arguments);

        // skip this if the initial render scroll position has not yet been set.
        // necessary since IE/Opera must be deferred, so the first refresh will
        // override the initial position by default and always set it to 0.
        if(this.scrollReady) {
            this.scrollTo(top);
        }
    },

    /**
     * Scrolls the container to the specified vertical position. If the view is large enough that
     * there is no scroll overflow then this method will have no affect.
     * @param {Number} y The new vertical scroll position in pixels
     * @param {Boolean} defer (optional) <p>True to slightly defer the call, false to execute immediately.</p>
     *
     * <p>This method will automatically defer itself for IE and Opera (even if you pass false) otherwise
     * the scroll position will not update in those browsers. You can optionally pass true, however, to
     * force the defer in all browsers, or use your own custom conditions to determine whether this is needed.</p>
     *
     * <p>Note that this method should not generally need to be called directly as scroll position is
     * managed internally.</p>
     */
    scrollTo: function(y, defer) {
        defer = defer || (Ext.isIE || Ext.isOpera);
        if(defer) {
            Ext.defer(function() {
                this.el.setTop(100-y + 'px');
                this.scrollReady = true;
            }, 10, this);
        }
        else{
            // this.timescaleContentEl.scrollTo('top', y);
            //this.el.setY(190-y);
            this.el.setTop(100-y + 'px');
            this.scrollReady = true;
        }
    },

    // private
    renderTemplate: function() {

        // alert('Render Template called');
        if (this.tpl) {
            this.tpl.overwrite(this.el, this.getTemplateParams());
        }
    },

    // private
    getTemplateParams: function() {
        return {
            viewStart: this.viewStart,
            viewEnd: this.viewEnd,
            startDate: this.startDate,
            dayCount: this.dayCount,
            weekCount: this.weekCount,
            weekendCls: this.weekendCls,
            prevMonthCls: this.prevMonthCls,
            nextMonthCls: this.nextMonthCls,
            todayCls: this.todayCls
        };
    },


    // private
    afterRender: function() {
        if(!this.tpl) {
            this.tpl = Ext.create('Extensible.calendar.template.Timescale', {
                id: this.id,
                dayCount: this.dayCount,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime,
                showHourSeparator: this.showHourSeparator,
                viewStartHour: this.viewStartHour,
                viewEndHour: this.viewEndHour,
                hourIncrement: this.hourIncrement,
                hourHeight: this.hourHeight
            });
        }
        this.tpl.compile();

        // this.addCls('ext-cal-body-ct');
        this.addCls('ext-cal-timescale');

        this.callParent(arguments);

        this.renderTemplate();

        this.timescaleContentEl = Ext.get('timescale-content');

        // default scroll position to scrollStartHour (7am by default) or min view hour if later
        var startHour = Math.max(this.scrollStartHour, this.viewStartHour),
            scrollStart = Math.max(0, startHour - this.viewStartHour);

        if(scrollStart > 0) {
            this.scrollTo(scrollStart * this.hourHeight);
        }
    }

});