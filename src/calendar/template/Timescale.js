/**
 * @class Extensible.calendar.template.Timescale
 * @extends Ext.XTemplate
 * <p>This is the template used to render the scrolling time scale in
 * {@link Extensible.calendar.view.Scheduler SchedulerView}.</p>
 * <p>Note that this template would not normally be used directly. Instead you would use the
 * {@link Extensible.calendar.view.Scheduler SchedulerView} that internally creates an instance of this template.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.template.Timescale', {
        extend: 'Ext.XTemplate',

        // private
        constructor: function(config) {

            Ext.apply(this, config);

            Extensible.calendar.template.Timescale.superclass.constructor.call(this,
                '<div id="timescale-content" class="ext-cal-day-times">',
                    '<tpl for="times">',
                        '<div class="ext-cal-bg-row" style="height:{parent.hourHeight}px;">',
                            '<div class="ext-cal-day-time-inner"  style="height:{parent.hourHeight-1}px;">{.}</div>',
                        '</div>',
                    '</tpl>',
                '</div>'
            );
        },

        // private
        applyTemplate: function(o) {

            //alert('this.viewStartHour: ' + this.viewStartHour);
            //alert('this.viewEndHour: ' + this.viewEndHour);


            this.today = Extensible.Date.today();
            this.dayCount = this.dayCount || 1;

            var i = 0,
                days = [];
                // ,dt = Ext.Date.clone(o.viewStart);

            /*
            for (; i<this.dayCount; i++) {
                days[i] = Extensible.Date.add(dt, {days: i});
            }
            */

            var times = [],
                start = this.viewStartHour,
                end = this.viewEndHour,
                mins = this.hourIncrement,
                dayHeight = this.hourHeight * (end - start),
                fmt = Extensible.Date.use24HourTime ? 'G:i' : 'ga',
                templateConfig;

            // use a fixed DST-safe date so times don't get skipped on DST boundaries
            dt = Extensible.Date.add(new Date('5/26/1972'), {hours: start});

            for (i=start; i<end; i++) {
                times.push(Ext.Date.format(dt, fmt));
                dt = Extensible.Date.add(dt, {minutes: mins});
            }

            templateConfig = {
                days: days,
                dayCount: days.length,
                times: times,
                hourHeight: this.hourHeight,
                hourSeparatorCls: this.showHourSeparator ? '' : 'no-sep', // the class suppresses the default separator
                dayHeight: dayHeight,
                hourSeparatorHeight: (this.hourHeight / 2)
            };

            if (Ext.getVersion().isLessThan('4.1')) {
                return Extensible.calendar.template.Timescale.superclass.applyTemplate.call(this, templateConfig);
            }
            else {
                return this.applyOut(templateConfig, []).join('');
            }
        }
    },
    function() {
        this.createAlias('apply', 'applyTemplate');
    });