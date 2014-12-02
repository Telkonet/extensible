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
        this.addEvents({
            /**
             * @event eventcopytocalendar
             * Fires after an event has been duplicated by the user via the "copy event" command.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event that was copied (with updated calendar data)
             *
             */
            eventcopytocalendar: true,
            /**
             * @event eventmovetocalendar
             * Fires after an event element has been moved to a new calendar and its data updated.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record}
             * for the event that was moved with updated calendar data
             */
            eventmovetocalendar: true
        });
    },
    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            copyText: this.ddCopyEventText,
            moveText: this.ddMoveEventText,
            ddGroup: this.ddGroup || this.id+'-SchedulerViewDD'
        };
        this.dragZone = Ext.create('Extensible.calendar.dd.SchedulerDragZone', this.el, cfg);
        this.dropZone = Ext.create('Extensible.calendar.dd.SchedulerDropZone', this.el, cfg);
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
		for (var i = 0; i < calendars.length; i++){
			if (calendars[i].data.IsHidden == true){ // ignore hidden calendars
				continue;
			}
			var z = 0;
			for (var j = 0; j < this.store.data.items.length; j++){
				if (this.store.data.items[j].data.CalendarId==calendars[i].data.CalendarId && this.store.data.items[j].data.IsAllDay === true) {
					var currentDate = Ext.Date.clone(this.viewStart);
					if (Ext.Date.between(currentDate,this.store.data.items[j].data.StartDate,this.store.data.items[j].data.EndDate) === true) {
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
    //
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
            calendars[i].data['eventscount'] = 0; // we need this in template to control the behaviour of the calendar column with no events

            for (var j = 0; j < events.length; j++) {
                var eventRaw = events[j].data;
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
                        calendars[i].data.eventscount++ ;
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

        //after renderItems method which uses the default rendering class, we need to be sure that
        //everything looks good. basicly it's about resizing properly the cells and rows in which the event data resides
        var eventsDomLabel = this.el.down('.ext-cal-schedulerview-allday').down('tr').next('tr'),
            eventsDomData = eventsDomLabel.next('tr'),
            eventRowHeight = 14;

        /*
         //inner header row
        if (eventsDomLabel !== null) {
             eventsDomLabel.select('td>div').each(function(div) { });
        }
        */
        //inner calendar data row of which each cell hosts a table in which reside all events of a calendar

        if (eventsDomData !== null) {
            eventsDomData.select('td tr>td').each(function(td) {
                td.applyStyles('vertical-align:top');
				if(td.down('div') !== null) {
                    td.down('div').setHeight(eventRowHeight);
                    td.setHeight(eventRowHeight-1);
                } else {
                    if (td.dom.hasAttribute('rowspan')) {
                        //td.setHeight(td.dom.getAttribute('rowspan')*eventRowHeight);
                        td.update('<div>&nbsp;</div>');
                        if (td.up('tr').up('table').select('tr > td').getCount() == 1){
                            td.down('div').setHeight((eventRowHeight*td.dom.getAttribute('rowspan'))-1);
                        }
                       td.dom.removeAttribute('rowspan');

                    }else{
                        td.update('<div>&nbsp;</div>');
                        if (td.up('tr').up('table').select('tr > td').getCount() == 1){
                            td.down('div').setHeight(eventRowHeight+10);
                        }
                    }
                }
                if (Ext.get(td).hasCls('schedulerview-empty-cell') == true) {
                    Ext.get(td).clean().setHeight(0);
                    if (td.up('tr').next('tr') != null) {
                        Ext.get(td).up('tr').setHeight(0).setVisibilityMode(Ext.Element.DISPLAY).hide();
                    }
                }
                td.up('tr').up('table').up('td').setHeight(td.up('tr').up('table').getHeight()+1);
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
    /**
     * Called from Extensible.calendar.dd.SchedulerDropZone it triggers the private method that handles the behaviour when
     * the event is dropped in the view
     * @param rec Event data record
     * @param calIdx Index of the current calendar item in the calendar store - from the current cell under the mouse's pointer
     * @param mode
     */
    onEventDrop: function(rec, calIdx, mode) {
        this[(mode || 'move') + 'Event'](rec, calIdx); // instead of moveEvent from the abstract class we reffer to our own method
    },
    /**
     * Called from Extensible.calendar.dd.SchedulerDropZone if the drag/drop is made on an empty calendar cell.
     * @param calIdx Index of the current calendar item in the calendar store - from the current cell under the mouse's pointer
     * @param onComplete callback function that can be passed to be executed at the end of this method
     */
	onCalendarEndDrag: function(calIdx, onComplete) {
		// set this flag for other event handlers that might conflict while we're waiting
		this.dragPending = true;
		var boundOnComplete = Ext.bind(this.onCalendarEndDragComplete, this, [onComplete]);

		var M = Extensible.calendar.data.EventMappings,
			rec = new Extensible.calendar.data.EventModel();

        rec.data[M.StartDate.name] = this.startDate;
        rec.data[M.EndDate.name] = this.endDate;
        rec.data[M.IsAllDay.name] = true;
        rec.data[M.CalendarId.name] = this.calendarStore.data.items[calIdx].data.CalendarId;

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
    moveEvent: function(rec, calIdx) {
        this.modifyEvent(rec, calIdx, 'move');
    },

    /**
     * This method is our custom implementation of the shiftEvent method from the AbstractCalendar class. It is used
     * for moving/copying the event on another calendar.
     * @param rec Current event record
     * @param calIdx Index of the current calendar item in the calendar store - from the current cell under the mouse's pointer
     * @param moveOrCopy
     */
    modifyEvent: function(rec, calIdx, moveOrCopy) {
        var me = this,
            newRec,
            calendarId = me.calendarStore.data.items[calIdx].data.CalendarId;

        if (moveOrCopy === 'move') {
            if (rec.data.CalendarId === calendarId) {
                // No changes, so we aren't actually moving. Copying to the same date is OK.
                return;
            }
            newRec = rec;
        } else {
            newRec = rec.clone();
        }

        if (me.fireEvent('beforeevent' + moveOrCopy, me, newRec, calendarId) !== false) {
            if (newRec.isRecurring()) {
                //if (me.recurrenceOptions.editSingleOnDrag) {
                me.onRecurrenceEditModeSelected('single', newRec, calendarId, moveOrCopy);
                //}
                // else {
                // Extensible.form.recurrence.RangeEditWindow.prompt({
                // callback: Ext.bind(me.onRecurrenceEditModeSelected, me, [newRec, newStartDate, moveOrCopy], true),
                // editModes: ['single', 'future'],
                // scope: me
                // });
                // }
            } else {
               me.doModifyEvent(newRec, calendarId, moveOrCopy);
            }
        }
    },
    onRecurrenceEditModeSelected: function(editMode, rec, calId, moveOrCopy) {
        var EventMappings = Extensible.calendar.data.EventMappings;
        if (editMode) {
            if (moveOrCopy === 'copy') {
                rec.clearRecurrence();
            }
            rec.data[EventMappings.REditMode.name] = editMode;
            rec.data[EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            this.doModifyEvent(rec, calId, moveOrCopy);
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
    doModifyEvent: function(rec, calId, moveOrCopy) {
        var EventMappings = Extensible.calendar.data.EventMappings,
            updateData = {};

        updateData[EventMappings.CalendarId.name] = calId;
        rec.set(updateData);
        if (rec.phantom) {
            this.store.add(rec);
        }
        this.save();
        this.ownerCt.fireEvent('event' + moveOrCopy + 'tocalendar', this, rec);
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
        var idxCal = -1;
        var dt = Ext.Date.format(this.startDate,'Ymd');
        if (el) {
            var parent = Ext.get(el).up('table').up('td[id^='+this.id+']');

            if (parent == null) {
                if (Ext.get(el).id.indexOf(this.id) > -1) {
                    parent = Ext.get(el);
                    el = Ext.get(el).down('div');
                }
            }

            if (parent) {
                idxCal = parent.id.split('-wk-');
                idxCal = idxCal[0].charAt(idxCal[0].length-1);
            }
            if (idxCal === -1) return false; //clicked outside usable area....

            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var parts = el.id.split(this.dayElIdDelimiter);
                    dt = parts[parts.length-1];

                // call here and will work for calendars with no events previously defined
                this.onDayClick(Ext.Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt, true)),
                    this.calendarStore.data.items[idxCal]);
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