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

        config.calendars = this.calendars;
        config.events = this.events;

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