/**
 * @class Extensible.calendar.view.SchedulerHeader
 * @extends Extensible.calendar.view.DayHeader
 * <p>This is the header area container within the day and week views where all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link Extensible.calendar.view.Scheduler}
 * which aggregates this class and the {@link Extensible.calendar.view.SchedulerBody} into the single unified view
 * presented by {@link Extensible.calendar.CalendarPanel CalendarPanel}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.view.SchedulerHeader', {
    extend: 'Extensible.calendar.view.DayHeader',
    alias: 'widget.extensible.schedulerheaderview',
    
    requires: [
        'Extensible.calendar.template.SchedulerHeader',
        'Extensible.calendar.dd.DragZone',
        'Extensible.calendar.dd.SchedulerHDropZone'
    ],
    
    // private configs
    weekCount: 1,
    dayCount: 1,
    allDayOnly: true,
    monitorResize: false,
    isHeaderView: true,
    eventRowHeight: 16,
    columnElIdDelimiter: '-calendar-',
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

    initComponent:function(){
        this.callParent(arguments);
    },

    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            copyText: this.ddCopyEventText,
            moveText: this.ddMoveEventText,
            ddGroup: this.ddGroup || this.id + '-SchedulerHeaderDD'
        };
        this.dragZone = Ext.create('Extensible.calendar.dd.DragZone', this.el, cfg);
        this.dropZone = Ext.create('Extensible.calendar.dd.SchedulerHDropZone', this.el, cfg);
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
                minColumnWidth: this.minColumnWidth,
                columnElIdDelimiter: this.columnElIdDelimiter
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
    
		var maxEvtCountPerCalendar = []; // counting max events per calendar and only for current day.
		for (var i = 0; i < calendars.length; i++) {
			if (calendars[i].data.IsHidden == true) { // ignore hidden calendars
				continue;
			}
			var z = 0;
			for (var j = 0; j < this.store.data.items.length; j++) {
				if (this.store.data.items[j].data.CalendarId == calendars[i].data.CalendarId && this.store.data.items[j].data.IsAllDay === true) {
                    var currentDate = Ext.Date.clone(this.viewStart);
                    if (Ext.Date.between(currentDate, this.store.data.items[j].data.StartDate, this.store.data.items[j].data.EndDate) === true) {
						z++;
					}
				}
			}			
			maxEvtCountPerCalendar.push(z);
		}

        var max = (this.maxEventsPerDay + 1) || 999;


        maxEvtCount = Ext.Array.max(maxEvtCountPerCalendar);

        this.evtMaxCount[weekIndex] = this.evtMaxCount[weekIndex] || 0;
        if (maxEvtCount && this.evtMaxCount[weekIndex] < maxEvtCount) {
            this.evtMaxCount[weekIndex] = Math.min(max, maxEvtCount); 
        }
    },

    //private
    getEventBodyMarkup: function() {
        if(!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
                '<tpl if="_isReminder">',
                '<i class="ext-cal-ic ext-cal-ic-rem">&#160;</i>',
                '</tpl>',
                '<tpl if="_isRecurring">',
                '<i class="ext-cal-ic ext-cal-ic-rcr">&#160;</i>',
                '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    // private
    refresh: function(reloadData) {
        Extensible.log('refresh (SchedulerHeaderView)');
        this.callParent(arguments);
        this.recalcHeaderBox();
    },

    /**
     * Since all other views are using the same renderer  Extensible.calendar.util.WeekEventRenderer, in order to use
     * mostly the same logic, we call it with a custom data structure that contains all calendar and their associated events
     */
    renderItems: function(){
        var evtGrid = this.allDayOnly ? this.allDayGrid : this.eventGrid, //all events from all calendars
            calendars =  this.calendarStore.data.items,
            events = this.store.data.items,
            calEvts = [];
		
        for (var i = 0; i < calendars.length; i++) {
            calEvts[0] = [];

            for (var j = 0; j < events.length; j++) {
                calEvts[0][0] = [];
			}
			//first level is week, second level is days... in our case is 1 week 1 day.
			//loop through all events in the Ext object... keep only the current calendar's ones
			if (evtGrid[0][0] !== undefined) {
				for (var k = 0; k < evtGrid[0][0].length; k++) {
					var evtCalId = 0;
					if (evtGrid[0][0][k].hasOwnProperty('event')) {
						evtCalId = evtGrid[0][0][k].event.data.CalendarId;
					} else {
						evtCalId = evtGrid[0][0][k].data.CalendarId;					
					}
					if (calendars[i].data.CalendarId == evtCalId) {
						calEvts[0][0].push(evtGrid[0][0][k]);
					}
				}
		    }

            Extensible.calendar.util.WeekEventRenderer.render({
                eventGrid: calEvts,
                viewStart: this.viewStart,
                tpl: this.getEventTemplate(),
                maxEventsPerDay: this.maxEventsPerDay,
                viewId: this.id + this.columnElIdDelimiter + calendars[i].data.CalendarId,
                templateDataFn: Ext.bind(this.getTemplateEventData, this),
                evtMaxCount: this.evtMaxCount, //adds the empty row
                weekCount: this.weekCount,
                dayCount: this.dayCount,
                getMoreText: Ext.bind(this.getMoreText, this)
            });
        }

        //after renderItems method which uses the default rendering class, we need to be sure that
        //everything looks good. basically it's about fixing height of the last event cell(row)...
        var eventsDOMContainers = this.el.down('.ext-cal-schedulerview-allday').select('table'),
            me = this;
            eventsDOMContainers.each(function(el) {

            var last_event_cell = el.select('td:last');
                last_event_cell = (last_event_cell !== undefined ? last_event_cell.elements[0] : undefined);
                if (last_event_cell === undefined) return;
                if (last_event_cell.hasAttribute('rowspan')) {
                    Ext.get(last_event_cell).setHeight((last_event_cell.getAttribute('rowspan') * me.eventRowHeight)+2);
                } else {
                    Ext.get(last_event_cell).setHeight(me.eventRowHeight+1);
                    Ext.get(last_event_cell).parent().show();
                }
            });
       this.fireEvent('eventsrendered', this);
    },
	
    // private
    recalcHeaderBox: function() {
        var tbl = this.el.down('.ext-cal-schedulerview-allday'),
            h = tbl.getHeight();
        // These should be auto-height, but since that does not work reliably
        // across browser / doc type, we have to size them manually
        this.el.setHeight(h + 7);
        this.el.down('.ext-cal-hd-ad-inner').setHeight(h + 5);
        this.el.down('.ext-cal-bg-tbl').setHeight(h + 5);
    },

    //private
    /**
     * Called from Extensible.calendar.dd.SchedulerHDropZone it triggers the private method that handles the behaviour
     * when the event is dropped in the view
     * @param rec Event data record
     * @param calendarId Id of the current calendar item in the calendar store - from the current cell under the mouse's pointer
     * @param mode
     */
    onEventDrop: function(rec, calendarId, mode) {
        // instead of moveEvent from the abstract class we reffer to our own method
        this[(mode || 'move') + 'Event'](rec, calendarId);
    },

    /**
     * Called from Extensible.calendar.dd.SchedulerHDropZone if the drag/drop is made on an empty calendar cell.
     * @param calendarId Id of the current calendar item in the calendar store - from the current cell under the mouse's pointer
     * @param onComplete callback function that can be passed to be executed at the end of this method
     */
	onCalendarEndDrag: function(calendarId, onComplete) {
		// set this flag for other event handlers that might conflict while we're waiting
		this.dragPending = true;
		var boundOnComplete = Ext.bind(this.onCalendarEndDragComplete, this, [onComplete]);

		var M = Extensible.calendar.data.EventMappings,
			rec = new Extensible.calendar.data.EventModel();

            rec.data[M.StartDate.name] = this.startDate;
            rec.data[M.EndDate.name] = this.endDate;
            rec.data[M.IsAllDay.name] = true;
            rec.data[M.CalendarId.name] = calendarId;

		if (this.fireEvent('rangeselect', this, rec, boundOnComplete) !== false) {
			this.showEventEditor(rec, null);

			if (this.editWin) {
				this.editWin.on('hide', boundOnComplete, this, {single:true});
			} else {
				boundOnComplete();
			}
		}
		else {
			// client code canceled the selection so clean up immediately
			this.onCalendarEndDragComplete(boundOnComplete);
		}
	},

    /**
     * Create a copy of the event with new CalendarId preserving the other data of the event.
     * @param {Object} rec The original event {@link Extensible.calendar.data.EventModel record}
     * @param {Object} calendarId The new calendar Id that represents the position of the calendar record in the calendar
     * store from which we take the CalendarId
     */
    copyEvent: function(rec, calendarId) {
        this.modifyEvent(rec, calendarId, 'copy');
    },

    /**
     * Move the event by setting a new CalendarId preserving the other data of the event.
     * @param {Object} rec The original event {@link Extensible.calendar.data.EventModel record}
     * @param {Object} calendarId The new calendar Id that represents the position of the calendar record in the calendar
     * store from which we take the CalendarId
     */
    moveEvent: function(rec, calendarId) {
        this.modifyEvent(rec, calendarId, 'move');
    },

    /**
     * This method is our custom implementation of the shiftEvent method from the AbstractCalendar class. It is used
     * for moving/copying the event on another calendar.
     * @param rec Current event record
     * @param calendarId Id of the current calendar item in the calendar store - from the current cell under the mouse's pointer
     * @param moveOrCopy
     */
    modifyEvent: function(rec, calendarId, moveOrCopy) {
        var me = this,
            newRec;

        if (moveOrCopy === 'move') {
            if (rec.data.CalendarId === calendarId) {
                // No changes, so we aren't actually moving. Copying to the same calendar is OK.
                return;
            }
            newRec = rec;
        } else {
            newRec = rec.clone();
        }
        if (me.fireEvent('beforeevent' + moveOrCopy, me, newRec, Ext.Date.clone(this.startDate), calendarId) !== false) {
            if (newRec.isRecurring()) {
                //if (me.recurrenceOptions.editSingleOnDrag) {
                me.onRecurrenceEditModeSelected('single', newRec, calendarId, moveOrCopy);
                //}
                // else {
                // Extensible.form.recurrence.RangeEditWindow.prompt({
                // callback: Ext.bind(me.onRecurrenceEditModeSelected, me, [newRec, calendarId, moveOrCopy], true),
                // editModes: ['single', 'future'],
                // scope: me
                // });
                // }
            }
            else {
              me.doModifyEvent(rec, calendarId, moveOrCopy);
            }
        }
    },

    onRecurrenceEditModeSelected: function(editMode, rec, calendarId, moveOrCopy) {
        var EventMappings = Extensible.calendar.data.EventMappings;
        if (editMode) {
            if (moveOrCopy === 'copy') {
                rec.clearRecurrence();
            }
            rec.data[EventMappings.REditMode.name] = editMode;
            rec.data[EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            this.doModifyEvent(rec, calendarId, moveOrCopy);
        }
        // else user canceled
    },
    /**
     * This method is our custom implementation of the doShiftEvent method from the AbstractCalendar class.
     * It's preparing the store for saving the event data changes
     * @param rec
     * @param calId
     * @param moveOrCopy
     */
    doModifyEvent: function(rec, calendarId, moveOrCopy) {
        var EventMappings = Extensible.calendar.data.EventMappings,
            updateData = {};

        updateData[EventMappings.CalendarId.name] = calendarId;
        rec.set(updateData);
        if (rec.phantom) {
            this.store.add(rec);
        }
        this.save();
        this.fireEvent('event' + moveOrCopy, this, rec, calendarId);
    },

    /**
     * Handles what's happening when the user clicks on an event inside the calendar; the name of the method
     * is correct since it is inherited from superclass.
     * The event edit window display method is invoked with the current event data passed as parameter
     * @param dt
     * @param ad
     * @param el
     * @param cal
     */
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

    /**
     * This method is preparing the handling of the user's click on an event
     * @param e
     * @param t
     */
    onClick: function(e, t) {
        var el = e.getTarget('td', 3);
        var idCalendar = -1;
        var dt = Ext.Date.format(this.startDate,'Ymd');
        if (el) {
            idCalendar = el.id.split('calendar')[2];
            if (idCalendar === undefined && Ext.get(el).up('table').up('td') !== null){
                idCalendar = Ext.get(el).up('table').up('td').id.split('calendar')[2];
            }
            idCalendar = (idCalendar === undefined ? -1: idCalendar.split('-')[1]);
            if (idCalendar === -1 || el == null) return false; //clicked outside usable area....

            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var parts = el.id.split(this.dayElIdDelimiter);
                dt = parts[parts.length - 1];

                this.onDayClick(Ext.Date.parseDate(dt, 'Ymd'), true, el,
                    this.calendarStore.findRecord('CalendarId',idCalendar));
                return;
            }
        }
        this.callParent(arguments);
    },

    // inherited docs
    isActiveView: function() {
        var calendarPanel = this.ownerCalendarPanel;
        return (calendarPanel && calendarPanel.getActiveView().isSchedulerView);
    }
});