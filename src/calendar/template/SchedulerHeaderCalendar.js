/**
 * Template used for adding calendar columns into header 
 */
Ext.define('Extensible.calendar.template.SchedulerHeaderCalendar', {
    extend: 'Ext.XTemplate',
    
    constructor: function(config) {
        
        Ext.apply(this, config);
        this.calendars = config.calendars;
        this.events = config.events;
        Extensible.calendar.template.SchedulerHeaderCalendar.superclass.constructor.call(this,
			'<table class="ext-cal-schedulerview-allday ext-cal-month-hd" cellpadding="0" cellspacing="0" style="height:100%;">',
                '<tbody>',
                    '<tr class="ext-cal-hd-day thead ext-cal-day-we">',
                        '<tpl for="calendars">',
                            '<tpl for=".">',
                                '<th class="ext-cal-hd-day">{Title}</th>',
                            '</tpl>',
                        '</tpl>',
                    '</tr>',
                    '<tr>',
                    '<tpl for="calendars">',
                        '<td id="{[this.id]}{[xindex-1]}-wk-0">',
								'<table class="ext-cal-evt-tbl ext-cal-hd-day" cellpadding="0" cellspacing="0" style="height:{[this.getRowHeight(this.events[xindex-1].length)]}%;padding:0px!important;border-top:1px solid  #c2d3fd;">',
                                '<tpl for=".">',
										'<tr style="display:none;">',
                                    '</tr>',
                                 '</tpl>',
                            '</table>',
                        '</td>',
                     '</tpl>',
                    '</tr>',
                '</tbody>',
            '</table>',{
				getRowHeight: function(ln) {
                   return 100/(ln==0?1:ln);
                }
			}
        );
    },

    applyTemplate: function(o) {
    	
        Ext.apply(this, o);
        
        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            return Extensible.calendar.template.SchedulerHeaderCalendar.superclass.applyTemplate.call(this, {
            	calendars: this.calendars,
            	events: this.events
            });
        }
        else {
            return this.applyOut({
            	calendars: this.calendars,
            	events: this.events
            }, []).join('');
        }
    }    
},
function() {
    this.createAlias('apply', 'applyTemplate');
});