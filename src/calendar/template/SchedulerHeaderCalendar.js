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
        	//'<div id="{[this.id]}-wk-{[xindex-1]}" class="ext-cal-wk-ct" style="top:{[this.getRowTop(xindex, xcount)]}%; height:{[this.getRowHeight(xcount)]}%;">',	
        	'<table class="ext-cal-schedulerview-header" cellpadding="0" cellspacing="0">',
        		'<tr class="thead">',
        			'<tpl for="calendars">',
		        		'<tpl for=".">',
		        	 	 	'<td>{Title}</td>',
		        		'</tpl>',
	        		'</tpl>',
        		'</tr>',
        	'</table>',
        	'<table class="ext-cal-schedulerview-allday" cellpadding="0" cellspacing="0">',
            '<tbody>',
                '<tr>',
                	'<tpl for="events">',
                    	'<td>',
                    	'<table class="ext-cal-evt-tbl" cellpadding="0" cellspacing="0">',
                    	    '<tpl for=".">',
                    		'<tr>',
                    			'<td id="{EventId}-ev-day-{date:date("Ymd")}" class="{titleCls}"><div>{Title}</div></td>',
                    		'</tr>',
                    		'</tpl>',
                        '</table>',
                    	'</td>',
                    '</tpl>',
                '</tr>',
            '</tbody>',
            '</table>'
           // '</div>'
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