/**
 * @class Extensible.calendar.template.SchedulerHeader
 * @extends Ext.XTemplate
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.template.SchedulerHeader', {
    extend: 'Ext.XTemplate',

    requires: ['Extensible.calendar.template.SchedulerHeaderCalendar'],
    
    // private
    constructor: function(config) {
        
        Ext.apply(this, config);
        
        
        // prepare calendars 
        var calendars_array = [];
        for(var i=0; i<this.calendars.length; i++){
        	calendars_array.push(this.calendars[i].data);
        }
        config.calendars = calendars_array;
        
        // prepare events
        var events_array = [];
        for(var i=0; i<this.events.length; i++){
        	
        	var obj = this.events[i].data;
        	
        	if(!events_array[obj.CalendarId])
        		events_array[obj.CalendarId] = [];
        	
        	events_array[obj.CalendarId].push(obj);
        }       
        config.events = calendars_array;
       
        this.headerCalendarTpl = Ext.create('Extensible.calendar.template.SchedulerHeaderCalendar', config);
        this.headerCalendarTpl.compile();
               
        Extensible.calendar.template.SchedulerHeader.superclass.constructor.call(this,
            '<div class="ext-cal-hd-ct">',
                '<table class="ext-cal-hd-days-tbl" cellspacing="0" cellpadding="0">',
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
        }
        else {
            return this.applyOut(templateConfig, []).join('');
        }
    }
},
function() {
    this.createAlias('apply', 'applyTemplate');
});