/**
 * Template used for adding calendar columns into header 
 */
Ext.define('Extensible.calendar.template.SchedulerHeaderCalendar', {
    extend: 'Ext.XTemplate',

    /**
     * This is the template that is used to build the scheduler header view having each calendar as a column containing
     * all it's "AllDay" events
     * @param config
     */
    constructor: function(config) {
        Ext.apply(this, config);
        this.calendars = config.calendars;
        this.events = config.events;

        Extensible.calendar.template.SchedulerHeaderCalendar.superclass.constructor.call(this,
			'<table class="ext-cal-bg-tbl" cellpadding="0" cellspacing="0">',
                '<tbody>',
                    '<tr>',
                        '<tpl for="calendars">',
                            '<td style="height:22px;"></td>',
                        '</tpl>',
                    '</tr>',
                    '<tr>',
                        '<tpl for="calendars">',
                            '<tpl if="IsHidden &#61;&#61; 0">',
                                '<td id="{[this.id]}{[xindex-1]}-week-hd-day-0" class="{[this.cellCls]}">',
                                 '&#160;',
                                '</td>',
                            '</tpl>',
                        '</tpl>',
                    '</tr>',
                '</tbody>',
            '</table>',
            '<table class="ext-cal-schedulerview-allday ext-cal-hd-days-tbl" cellpadding="0" cellspacing="0" >',
                    '<tbody>',
                        '<tr class="ext-cal-hd-day thead">',
                            '<tpl for="calendars">',
                                '<tpl for=".">',
                                    '<tpl if="IsHidden &#61;&#61; 0">',
                                        '<th style="height:16px;" class="ext-cal-hd-day">{Title}</th>',
                                    '</tpl>',
                                '</tpl>',
                            '</tpl>',
                        '</tr>',
                        '<tr>',
                            '{% var xxindex = 1; %}',
                            '<tpl for="calendars">',
                                   //'<td></td>',
                                '<tpl exec="values.cindex = xindex;"></tpl>',
                                '<tpl for=".">',
                                    '<tpl if="IsHidden &#61;&#61; 0">',
                                     '<td style="height:20px;" id="{[this.id]}{[values.cindex-1]}-wk--0" class="{[this.titleCls]}">',
                                        '<div id="{[this.id]}{[values.cindex-1]}-empty-{[xcount-1]}-day-{[Ext.Date.format(this.viewStart,\'Ymd\')]}">',
                                            '{[xxindex==1 ? Ext.Date.format(this.viewStart,\'M j, Y\'):"&nbsp;"]}',
                                        '</div>',
                                     '</td>',
                            '{% xxindex++; %}',
                                    '</tpl>',
                                '</tpl>',
                            '</tpl>',
                        '</tr>',
                        '<tr>',
                        '<tpl for="calendars">',
                            '<tpl if="IsHidden &#61;&#61; 0">',
                                '<td id="{[this.id]}{[xindex-1]}-wk-0">',
                                    '<table class="ext-cal-evt-tbl ext-cal-hd-day ext-cal-dayview" cellpadding="0" cellspacing="0" style="height:100%;padding:0px!important;">',
                                        '<tpl for=".">',
                                            '<tpl if="eventscount  &#61;&#61; 0">',
                                                '<tr style="height:100%;">',
                                                    '<td class="schedulerview-empty-cell" id="{[this.id]}{[xindex-1]}-empty-{[xcount-1]}-day-{[Ext.Date.format(this.viewStart,\'Ymd\')]}">&nbsp;</td>',
                                                '</tr>',
                                            '<tpl else>',
                                                '<tr style="display:none;">',
                                                '</tr>',
                                            '</tpl>',
                                         '</tpl>',
                                    '</table>',
                                '</td>',
                            '</tpl>',
                         '</tpl>',
                        '</tr>',
                    '</tbody>',
                '</table>'
            );
    },

    applyTemplate: function(o) {
    	
        Ext.apply(this, o);

       var today = Extensible.Date.today(),
            dt = Ext.Date.clone(this.viewStart),
            thisMonth = this.startDate.getMonth();

        var isToday = dt.getTime() === today.getTime(),
        prevMonth = (dt.getMonth() < thisMonth) && this.weekCount === -1,
        nextMonth = (dt.getMonth() > thisMonth) && this.weekCount === -1,
        isWeekend = dt.getDay() % 6 === 0;

        this.titleCls = 'ext-cal-dtitle ' + (isToday ? ' ext-cal-dtitle-today' : '') +
        //(w === 0 ? ' ext-cal-dtitle-first' : '') +
        (prevMonth ? ' ext-cal-dtitle-prev' : '') +
        (nextMonth ? ' ext-cal-dtitle-next' : ''),

        this.cellCls = 'ext-cal-day ' + (isToday ? ' ' + this.todayCls : '') +
        //(d === 0 ? ' ext-cal-day-first' : '') +
        (prevMonth ? ' ' + this.prevMonthCls : '') +
        (nextMonth ? ' ' + this.nextMonthCls : '') +
        (isWeekend && this.weekendCls ? ' ' + this.weekendCls : '');

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