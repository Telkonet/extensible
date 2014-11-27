/**
 * @class Extensible.calendar.template.SchedulerHeader
 * @extends Ext.XTemplate
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.template.SchedulerHeader', {
    extend: 'Ext.XTemplate',

    requires: ['Extensible.calendar.template.SchedulerHeaderCalendar'],

    /**
     * In the constructor we prepare the data structures we need and also the main template which will include itself a sub-template
     * @param config
     */
    constructor: function(config) {
        Ext.apply(this, config);
        // prepare calendars & events
        var calendars_array = [];
        var events_array = [];

        for (var i=0; i < this.calendars.length; i++) {
         //   if (this.calendars[i].data.IsHidden == true) continue;
        	var calendar_events = [];
            this.calendars[i].data['eventscount'] = 0;// is computed inside the view's renderItems method but IE fails to see that it's updated outside

            for (var j=0; j < this.events.length; j++) {
            	var event = this.events[j].data;
            	if (event.CalendarId == this.calendars[i].data.CalendarId && event.IsAllDay == true) {
                    var currentDate = new Date();
                    if (Ext.Date.between(currentDate, this.events[j].data.StartDate, this.events[j].data.EndDate) === true) {
                        calendar_events.push(event);
                    }
                }
            }
            calendars_array.push(this.calendars[i].data);
            events_array.push(calendar_events);
        }

        config.calendars = calendars_array;
        config.events = events_array;

        this.headerCalendarTpl = Ext.create('Extensible.calendar.template.SchedulerHeaderCalendar', config);
        this.headerCalendarTpl.compile();
               
        Extensible.calendar.template.SchedulerHeader.superclass.constructor.call(this,
            '<div class="ext-cal-hd-ct" >',
                '<table class="ext-cal-hd-days-tbl ext-cal-hd-days-tbl ext-cal-schedulerview-header" cellspacing="0" cellpadding="0" style="width:auto;">',
                    '<tbody>',
                        '<tr>',
                            '<td class="ext-cal-gutter"></td>',
                            '<td class="ext-cal-hd-days-td">',
                            '<div class="ext-cal-hd-ad-inner">{headerCalendarTpl}</div></td>',
                            '<td class="ext-cal-gutter-rt"></td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            '</div>'
        );
    },
    
    // private
    applyTemplate: function(o) {
        
        var templateConfig = {
                headerCalendarTpl: this.headerCalendarTpl.apply(o)
        };
         
        if (Ext.getVersion().isLessThan('4.1')) {
            return Extensible.calendar.template.SchedulerHeader.superclass.applyTemplate.call(this, templateConfig);
        } else {
            return this.applyOut(templateConfig, []).join('');
        }
    }
},
function() {
    this.createAlias('apply', 'applyTemplate');
});