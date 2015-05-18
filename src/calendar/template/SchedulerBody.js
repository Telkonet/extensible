/**
 * @class Extensible.calendar.template.SchedulerBody
 * @extends Ext.XTemplate
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.template.SchedulerBody', {
    extend: 'Ext.XTemplate',
    
    // private
    constructor: function(config) {
        
        Ext.apply(this, config);

        Extensible.calendar.template.SchedulerBody.superclass.constructor.call(this,
            '<table class="ext-cal-bg-tbl" cellspacing="0" cellpadding="0" style="height:{dayHeight}px;">',
                '<tbody>',
                    '<tr height="1">',
                        '<td class="ext-cal-gutter"></td>',
                        '<td colspan="{dayCount}">',
                            '<div class="ext-cal-bg-rows">',
                                '<div class="ext-cal-bg-rows-inner">',
                                    '<tpl for="times">',
                                        '<div class="ext-cal-bg-row ext-row-{[xindex]}" style="height:{parent.hourHeight}px;">',
                                            '<div class="ext-cal-bg-row-div {parent.hourSeparatorCls}" style="height:{parent.hourSeparatorHeight}px;"></div>',
                                        '</div>',
                                    '</tpl>',
                                '</div>',
                            '</div>',
                        '</td>',
                    '</tr>',
                    '<tr>',
                        '<td class="ext-cal-day-times">',
                            '<tpl for="times">',
                                '<div class="ext-cal-bg-row" style="height:{parent.hourHeight}px;">',
                                    '<div class="ext-cal-day-time-inner"  style="height:{parent.hourHeight-1}px;">{.}</div>',
                                '</div>',
                            '</tpl>',
                        '</td>',
                        '<tpl for="days">',
                            '<td class="ext-cal-day-col">',
                                '<div class="ext-cal-day-col-content">',
                                '<tpl exec="values.dayHeight = parent.dayHeight; values.calWidth = (100 / this.visibleCalendars) + \'%\';"></tpl>',
                                '<tpl for="parent.calendars">', //calendar object
                                    '<tpl exec="values.day = parent;"></tpl>',
                                    '<tpl if="values.data.IsHidden &#61;&#61; 0">',
                                      '<div id="{[this.id]}{[this.dayColumnElIdDelimiter]}{[values.data.CalendarId]}-outer-{[Ext.Date.format(values.day,\'Ymd\')]}" class="ext-cal-day-col-inner" ' +
                                        'style="height:{[values.day.dayHeight]}px;width:{[values.day.calWidth]};">',
                                            '<div id="{[this.id]}{[this.dayColumnElIdDelimiter]}{[values.data.CalendarId]}-{[Ext.Date.format(values.day,\'Ymd\')]}" class="ext-cal-day-col-gutter" ' +
                                            'style="height:{[values.day.dayHeight]}px;">',
                                        '</div>',
                                      '</div>',
                                    '</tpl>',
                                '</tpl>',
                                '</div>',
                            '</td>',
                        '</tpl>',
                    '</tr>',
                '</tbody>',
            '</table>'
        );
    },

    // private
    applyTemplate: function(o) {
        this.today = Extensible.Date.today();
        this.dayCount = this.dayCount || 1;

        var i = 0, days = [],
            dt = Ext.Date.clone(o.viewStart);
            
        for (; i<this.dayCount; i++) {
            days[i] = Extensible.Date.add(dt, {days: i});
        }

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

        var tl =this.calendars.length;
        Ext.each(this.calendars, function(c) {
            if (c.data.IsHidden == true) {
                tl--;
            }
        });
        this.visibleCalendars = tl;

        templateConfig = {
            days: days,
            dayCount: days.length,
            times: times,
            hourHeight: this.hourHeight,
            hourSeparatorCls: this.showHourSeparator ? '' : 'no-sep', // the class suppresses the default separator
            dayHeight: dayHeight,
            hourSeparatorHeight: (this.hourHeight / 2),
            calendars: this.calendars
        };
         
        if (Ext.getVersion().isLessThan('4.1')) {
            return Extensible.calendar.template.SchedulerBody.superclass.applyTemplate.call(this, templateConfig);
        }
        else {
            return this.applyOut(templateConfig, []).join('');
        }
    }
},
function() {
    this.createAlias('apply', 'applyTemplate');
});