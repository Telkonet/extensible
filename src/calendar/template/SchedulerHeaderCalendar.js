/**
 * This is the template that is used to build the scheduler header view having each calendar as a column containing
 * all it's "AllDay" events
 * @param config
 */
Ext.define('Extensible.calendar.template.SchedulerHeaderCalendar', {
    extend: 'Ext.XTemplate',
    /**
     * @cfg {String} headerCurrentDayFormat
     * The date format used for the date in the header that is shown for first calendar column visible (defaults to 'M j, Y').
     */
    headerCurrentDayFormat: 'M j, Y',

    constructor: function(config) {
        Ext.apply(this, config);
        this.calendars = config.calendars;

        Extensible.calendar.template.SchedulerHeaderCalendar.superclass.constructor.call(this,
			'<table class="ext-cal-bg-tbl" cellpadding="0" cellspacing="0">',
                '<tbody>',
                    '<tr class="ext-cal-bg-tbl-hd">',
                        '<tpl for="calendars">',
                            '<tpl if="values.data.IsHidden &#61;&#61; 0">',
                                '<td></td>',
                            '<tpl else>',
                                '<td style="display:none;"> </td>',
                            '</tpl>',
                        '</tpl>',
                    '</tr>',
                    '<tr class="ext-cal-bg-tbl-bd">',
                        '<tpl for="calendars">',
                            '<tpl if="values.data.IsHidden &#61;&#61; 0">',
                                '<td id="{[this.id]}{[this.columnElIdDelimiter]}{[values.data.CalendarId]}-wk-0-bg-day-{[Ext.Date.format(this.viewStart,\'Ymd\')]}" class="{[this.cellCls]}">',
                                 '&#160;',
                                '</td>',
                            '<tpl else>',
                                '<td style="display:none;"></td>',
                            '</tpl>',
                        '</tpl>',
                    '</tr>',
                '</tbody>',
            '</table>',
            '<table class="ext-cal-schedulerview-allday ext-cal-hd-days-tbl" cellpadding="0" cellspacing="0">',
                '<tbody>',
                    '<tr class="ext-cal-hd-day thead">',
                        '<tpl for="calendars">',
                            '<tpl for=".">',
                                '<tpl if="values.data.IsHidden &#61;&#61; 0">',
                                    '<th class="ext-cal-hd-day" title="{data.Title}">{data.Title}</th>',
                                '<tpl else>',
                                    '<td style="display:none;"></td>',
                               '</tpl>',
                            '</tpl>',
                        '</tpl>',
                    '</tr>',
                    '<tr>',
                        '{% var xxindex = 1; %}',
                        '<tpl for="calendars">',
                            '<tpl for=".">',
                                '<tpl if="values.data.IsHidden &#61;&#61; 0">',
                                 '<td id="{[this.id]}{[this.columnElIdDelimiter]}{[values.data.CalendarId]}-wk-0-empty-day-{[Ext.Date.format(this.viewStart,\'Ymd\')]}" class="ext-cal-hd-daytext {[this.titleCls]}">',
                                    '<div id="{[this.id]}{[this.columnElIdDelimiter]}{[values.data.CalendarId]}">',
                                        '{[xxindex==1 ? Ext.Date.format(this.viewStart, this.headerCurrentDayFormat) :"&nbsp;"]}',
                                    '</div>',
                                 '</td>',
                        '{% xxindex++; %}',
                                '<tpl else>',
                                    '<td style="display:none;"></td>',
                                '</tpl>',
                            '</tpl>',
                        '</tpl>',
                    '</tr>',
                    '<tr>',
                    '<tpl for="calendars">',
                        '<tpl if="values.data.IsHidden &#61;&#61; 0">',
                            '<td id="{[this.id]}{[this.columnElIdDelimiter]}{[values.data.CalendarId]}-wk-0">',
                                '<table class="ext-cal-evt-tbl ext-cal-hd-day ext-cal-dayview" cellpadding="0" cellspacing="0">',
                                    '<tpl for=".">',
                                        '<tr style="display:none;">',
                                            '<td class="ext-cal-ev" id="{[this.id]}{[this.columnElIdDelimiter]}{[values.data.CalendarId]}-empty-0-day-{[Ext.Date.format(this.viewStart,\'Ymd\')]}">&nbsp;</td>',
                                        '</tr>',
                                     '</tpl>',
                                '</table>',
                            '</td>',
                        '<tpl else>',
                            '<td style="display:none;"></td>',
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
        (prevMonth ? ' ext-cal-dtitle-prev' : '') +
        (nextMonth ? ' ext-cal-dtitle-next' : ''),

        this.cellCls = 'ext-cal-day ' + (isToday ? ' ' + this.todayCls : '') +
        (prevMonth ? ' ' + this.prevMonthCls : '') +
        (nextMonth ? ' ' + this.nextMonthCls : '') +
        (isWeekend && this.weekendCls ? ' ' + this.weekendCls : '');

        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            return Extensible.calendar.template.SchedulerHeaderCalendar.superclass.applyTemplate.call(this, {
            	calendars: this.calendars
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