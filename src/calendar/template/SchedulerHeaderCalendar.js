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
        	'<table class="ext-cal-schedulerview-header" cellpadding="0" cellspacing="0">',
        		'<tr class="thead">',
        			'<tpl for="calendars">',
		        		'<tpl for=".">',
		        	 	 	'<td>{Title}</td>',
		        		'</tpl>',
	        		'</tpl>',
        		'</tr>',
        	'</table>'
        	/*'<table class="ext-cal-schedulerview-allday" cellpadding="0" cellspacing="0">',
            '<tbody>',
                '<tr>',
                	'<tpl for="events">',
                    '<tpl for=".">',
                    	'<td>',
                    	'<table class="ext-cal-evt-tbl" cellpadding="0" cellspacing="0">',
                    		'<tr>',
                    			'<td id="{[this.id]}-ev-day-{date:date("Ymd")}" class="{titleCls}"><div>{title}</div></td>',
                    		'</tr>',
                        '</table>',
                    	'<td>',
                    '</tpl>',
                    '</tpl>',
                '</tr>',
            '</tbody>',
            '</table>'*/
        );
    },

    applyTemplate: function(o) {
    	
        Ext.apply(this, o);
        
        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            return Extensible.calendar.template.SchedulerHeaderCalendar.superclass.applyTemplate.call(this, {
            	calendars: this.calendars,
            	events: this.events,
            });
        }
        else {
            return this.applyOut({
            	calendars: this.calendars
            }, []).join('');
        }
    }    
},
function() {
    this.createAlias('apply', 'applyTemplate');
});