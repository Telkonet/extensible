/**
 * @class Extensible.calendar.view.SchedulerHeader
 * @extends Extensible.calendar.view.Month
 * <p>This is the header area container within the day and week views where all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link Extensible.calendar.view.Day DayView}
 * which aggregates this class and the {@link Extensible.calendar.view.DayBody DayBodyView} into the single unified view
 * presented by {@link Extensible.calendar.CalendarPanel CalendarPanel}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.view.SchedulerHeader', {
    extend: 'Extensible.calendar.view.Month',
    alias: 'widget.extensible.schedulerheaderview',
    
    requires: [
        'Extensible.calendar.template.SchedulerHeader',
        'Extensible.calendar.dd.SchedulerDragZone',
        'Extensible.calendar.dd.SchedulerDropZone'
    ],
    
    // private configs
    weekCount: 1,
    dayCount: 1,
    allDayOnly: true,
    monitorResize: false,
    isHeaderView: true,

    // The event is declared in MonthView but we're just overriding the docs:
    /**
     * @event dayclick
     * Fires after the user clicks within the view container and not on an event element. This is a cancelable event, so
     * returning false from a handler will cancel the click without displaying the event editor view. This could be useful
     * for validating that a user can only create events on certain days.
     * @param {Extensible.calendar.view.SchedulerHeader} this
     * @param {Date} dt The date/time that was clicked on
     * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the
     * SchedulerHeaderView always return true for this param.
     * @param {Ext.Element} el The Element that was clicked on
     */
    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            copyText: this.ddCopyEventText,
            moveText: this.ddMoveEventText,
            ddGroup: this.ddGroup || this.id+'-SchedulerViewDD'
        };
      //  this.dragZone = Ext.create('Extensible.calendar.dd.SchedulerDragZone', this.el, cfg);
      //  this.dropZone = Ext.create('Extensible.calendar.dd.SchedulerDropZone', this.el, cfg);
    },

    onDestroy: function() {
        Ext.destroy(this.ddSelector);
        Ext.destroy(this.dragZone);
        Ext.destroy(this.dropZone);

        this.callParent(arguments);
    },
    // private
    afterRender: function() {
    	
        if(!this.tpl) {
            this.tpl = Ext.create('Extensible.calendar.template.SchedulerHeader', {
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime,
                calendars: this.calendarStore.data.items,
                events: this.store.data.items,
                minColumnWidth:this.minColumnWidth
            });
        }
        this.tpl.compile();
        this.addCls('ext-cal-day-header');
        this.callParent(arguments);
    },
    
    // private
    forceSize: Ext.emptyFn,
	//private
	setMaxEventsForDay: function(weekIndex, dayIndex) {
	    // If calculating the max event count for the day/week view header, use the allDayGrid
        // so that only all-day events displayed in that area get counted, otherwise count all events.
        var maxEventsForDay = this[this.isHeaderView ? 'allDayGrid' : 'eventGrid'][weekIndex][dayIndex] || [];
		var maxEvtCount = maxEventsForDay.length;
		var calendars =  this.calendarStore.data.items;
    
		var maxEvtCountPerCalendar =[]; // counting max events per calendar and only for current day.
		for (var i=0; i<calendars.length; i++){
			if (calendars[i].data.IsHidden==true){ // ignore hidden calendars
				continue;
			}
			var z=0;
			for (var j=0;j<this.store.data.items.length;j++){
				if(this.store.data.items[j].data.CalendarId==calendars[i].data.CalendarId && this.store.data.items[j].data.IsAllDay==true ){
					var currentDate = Ext.Date.clone(this.viewStart);
					if (Ext.Date.between(currentDate,this.store.data.items[j].data.StartDate,this.store.data.items[j].data.EndDate )===true){
						z++;
					}
				}
			}			
			maxEvtCountPerCalendar.push(z);
		}
		
        var max = (this.maxEventsPerDay + 1) || 999;
        maxEvtCount = Ext.Array.max(maxEvtCountPerCalendar)+1;

        this.evtMaxCount[weekIndex] = this.evtMaxCount[weekIndex] || 0;
        if (maxEvtCount && this.evtMaxCount[weekIndex] < maxEvtCount) {
            this.evtMaxCount[weekIndex] = Math.min(max, maxEvtCount); 
        }
    },
    // private
    refresh: function(reloadData) {
        Extensible.log('refresh (SchedulerHeaderView)');
        this.callParent(arguments);
        this.recalcHeaderBox();
        this.el.down('.ext-cal-schedulerview-allday').select('tr>td').each(function(td){
            td.up('tr').applyStyles('height:'+(td.getHeight())+'px;');
            td.dom.removeAttribute('rowspan');
        });
    },
    renderItems: function(){

      //var calendars = this.calendarStore.data.items; //all calendars
       var evtGrid = this.allDayOnly ? this.allDayGrid : this.eventGrid; //all events from all calendars
        var calendars =  this.calendarStore.data.items;
        var events = this.store.data.items;
        var calEvts = [];
		
        for (var i = 0; i<calendars.length; i++){
            calEvts[0] = [];
            for (var j = 0; j<events.length; j++){
                var eventRaw =events[j].data;
                calEvts[0][0]=[];
			}
			//first level is week, second level is days... in our case is 1 week 1 day.
			//loop through all events in the Ext object... keep only the current calendar's ones
			if (evtGrid[0][0]!==undefined){
				for (var k=0; k<evtGrid[0][0].length;k++){
					var evtCalId = 0;
					if (evtGrid[0][0][k].hasOwnProperty('event')){
						evtCalId = evtGrid[0][0][k].event.data.CalendarId;
					}else{
						evtCalId = evtGrid[0][0][k].data.CalendarId;					
					}
					if (calendars[i].data.CalendarId == evtCalId){
						calEvts[0][0].push(evtGrid[0][0][k]);
					}
				}
		    }

            Extensible.calendar.util.WeekEventRenderer.render({
                eventGrid: calEvts,
                viewStart: this.viewStart,
                tpl: this.getEventTemplate(),
                maxEventsPerDay: this.maxEventsPerDay,
                viewId: this.id+i,
                templateDataFn: Ext.bind(this.getTemplateEventData, this),
                evtMaxCount: this.evtMaxCount, //adds the empty row
                weekCount: this.weekCount,
                dayCount: this.dayCount,
                getMoreText: Ext.bind(this.getMoreText, this)
            });
        }
    this.fireEvent('eventsrendered', this);
    },
	
    // private
    recalcHeaderBox: function() {
        var tbl = this.el.down('.ext-cal-schedulerview-allday'),
            h = tbl.getHeight();
        this.el.setHeight(h+5);
        // These should be auto-height, but since that does not work reliably
        // across browser / doc type, we have to size them manually
        this.el.down('.ext-cal-hd-ad-inner').setHeight(h+5);
       //this.el.down('.ext-cal-bg-tbl').setHeight(h+5);
    },
    
    // private
    moveNext: function() {
        return this.moveDays(this.dayCount, false);
    },

    // private
    movePrev: function() {
        return this.moveDays(-this.dayCount, false);
    },

    //private
    onEventDrop: function(rec, dt, mode) {
        this[(mode || 'move') + 'Event'](rec, dt); // instead of moveEvent from the abstract class we reffer to our own method
    },

    //private
    onDayClick: function(dt, ad, el, cal) {
        if (this.readOnly === true) {
            return;
        }
        if (this.fireEvent('dayclick', this, Ext.Date.clone(dt), ad, el) !== false) {
            var M = Extensible.calendar.data.EventMappings,
            rec = new Extensible.calendar.data.EventModel();
            rec.data[M.StartDate.name] = dt;
            rec.data[M.IsAllDay.name] = ad;
            rec.data[M.CalendarId.name] = cal;
            this.showEventEditor(rec, el);
        }
    },
    // private
    onClick: function(e, t) {
        var el = e.getTarget('td', 3);
        var idxCal = 0;
        if (el) {
            var parent = Ext.get(el).up('table').up('td');
            if (parent){
                idxCal = parent.id.split('-wk-');
                idxCal = idxCal[0].charAt(idxCal[0].length-1);
            }

            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var parts = el.id.split(this.dayElIdDelimiter),
                    dt = parts[parts.length-1];
                this.onDayClick(Ext.Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt, true)), this.calendarStore.data.items[idxCal]);
                return;
            }
        }
        this.callParent(arguments);
    },
	
    // inherited docs
    isActiveView: function() {
        var calendarPanel = this.ownerCalendarPanel;
        return (calendarPanel && calendarPanel.getActiveView().isDayView);
    }
});