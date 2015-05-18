/**
 * This is the body of Scheduler view. Scheduler view display the events of each calendar in a separate column.
 * @class Extensible.calendar.view.SchedulerBody
 * @extends Extensible.calendar.view.DayBody
 * @constructor
 * @param {Object} config The config object
 * @author Alin Miron, reea.net
 */
Ext.define('Extensible.calendar.view.SchedulerBody', {
    extend: 'Extensible.calendar.view.DayBody',
    alias: 'widget.extensible.schedulerbodyview',

    requires: [
        'Ext.XTemplate',
        'Extensible.calendar.template.SchedulerBody',
        'Extensible.calendar.dd.DayDragZone',
        'Extensible.calendar.dd.SchedulerBDropZone'
    ],

    /**
     * @cfg {String} dragZoneClass
     * Class to be used as the view's drag zone implementation.
     */
    dragZoneClass: 'Extensible.calendar.dd.DayDragZone',
    /**
     * @cfg {String} dropZoneClass
     * Class to be used as the view's drop zone implementation.
     */
    dropZoneClass: 'Extensible.calendar.dd.SchedulerBDropZone',
    dayColumnElIdDelimiter: '-day-calendar-',

    // private
    afterRender: function() {
        if(!this.tpl) {
            this.tpl = Ext.create('Extensible.calendar.template.SchedulerBody', {
                id: this.id,
                dayCount: this.dayCount,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime,
                showHourSeparator: this.showHourSeparator,
                viewStartHour: this.viewStartHour,
                viewEndHour: this.viewEndHour,
                hourIncrement: this.hourIncrement,
                calendars: this.calendarStore.data.items,
                hourHeight: this.hourHeight,
                dayColumnElIdDelimiter: this.dayColumnElIdDelimiter
            });
        }
        this.callParent(arguments);
    },

    // private
    renderItems: function() {
        var evt,
            evts,
            eventBatches = {},
            eventBatch,
            M = Extensible.calendar.data.EventMappings;

        evts = this.filterEventsToRender();

        // For scheduler view events are displayed in separate columns per calendar.
        // Therefore, we batch events per calendar and apply the layout algorithm to each batch.
        for (var i = 0; i < evts.length; i++) {
            evt = evts[i];
            eventBatch = eventBatches[evt.data[M.CalendarId.name]];
            if (typeof eventBatch !== 'object') {
                eventBatch = [];
                var batchName = evt.data[M.CalendarId.name];
                eventBatches[batchName] = eventBatch;
            }
            eventBatch.push(evt);
        }

        // Render events for each batch
        for (var batchId in eventBatches) {
            if (eventBatches.hasOwnProperty(batchId)) {
                evts = eventBatches[batchId];
                this.layoutAndRenderItems(evts);
            }
        }

        this.fireEvent('eventsrendered', this);
    },

    //private
    isOverlapping: function(evt1, evt2) {
        var ev1 = evt1.data ? evt1.data : evt1,
            ev2 = evt2.data ? evt2.data : evt2,
            M = Extensible.calendar.data.EventMappings,
            start1 = ev1[M.StartDate.name].getTime(),
            end1 = Extensible.Date.add(ev1[M.EndDate.name], {seconds: -1}).getTime(),
            start2 = ev2[M.StartDate.name].getTime(),
            end2 = Extensible.Date.add(ev2[M.EndDate.name], {seconds: -1}).getTime(),
            startDiff = Extensible.Date.diff(ev1[M.StartDate.name], ev2[M.StartDate.name], 'm');

        if (end1 < start1) {
            end1 = start1;
        }
        if (end2 < start2) {
            end2 = start2;
        }

        var evtsOverlap = Extensible.Date.rangesOverlap(start1, end1, start2, end2),
            minimumMinutes = this.minEventDisplayMinutes || 0, // applies in day/week body view only for vertical overlap
            ev1MinHeightOverlapsEv2 = minimumMinutes > 0 && (startDiff > -minimumMinutes && startDiff < minimumMinutes);

        return ((evtsOverlap  || ev1MinHeightOverlapsEv2) && (evt1.CalendarId == evt2.CalendarId));
    },

    // private
    getDayEl: function(dt,calDomId) {
        return Ext.get(this.getDayId(dt,calDomId));
    },

    // private
    getDayId: function(dt, calDomId, calendarId) {
        if (calDomId != null) {
            return calDomId;
        }

        if(Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        return this.id + this.dayColumnElIdDelimiter + calendarId + '-' + dt;
    },

    // private
    getDaySize: function(calDomId) {
        var box = {};
        try {
            if (calDomId !== undefined || calDomId !== '') {
                box =  this.el.down('[id=' + calDomId + ']').getBox();
            } else {
                box = this.el.down('.ext-cal-day-col-content').getBox();
            }
        } catch(ex) {
            return {height:0,width:0};
        }
        return {height: box.height, width: box.width};
    },

    // private
    getDayAt: function(x, y, calDomId) {
        var sel = '.ext-cal-body-ct',
            xoffset = this.el.down('.ext-cal-day-times').getWidth(),
            viewBox = this.el.getBox(),
            daySize = this.getDaySize(calDomId),
            relX = x - viewBox.x - xoffset,
            dayIndex = Math.floor(relX / daySize.x), // clicked col index
            scroll = this.el.getScroll(),
            row = this.el.down('.ext-cal-bg-row'), // first avail row, just to calc size
            rowH = row.getHeight() / this.incrementsPerHour,
            relY = y - viewBox.y - rowH + scroll.top,
            rowIndex = Math.max(0, Math.ceil(relY / rowH)),
            mins = rowIndex * (this.hourIncrement / this.incrementsPerHour),
            dt = Extensible.Date.add(this.viewStart, {days: dayIndex, minutes: mins, hours: this.viewStartHour}),
            el = this.getDayEl(dt, calDomId),
            timeX = x;

        if(el) {
            timeX = el.getLeft();
        }
        return {
            date: dt,
            el: el,
            // this is the box for the specific time block in the day that was clicked on:
            timeBox: {
                x: timeX,
                y: (rowIndex * this.hourHeight / this.incrementsPerHour) + viewBox.y - scroll.top,
                width: daySize.width,
                height: rowH
            }
        };
    },
    /**
     * Handles opening the event editor to create a new event after the user clicks on the body background.
     * @param {Date} dt Start date and time of new event.
     * @param int ad Flag indicating if new event is an all-day event or not.
     * @param el Element that was clicked.
     * @param int cal Calendar ID
     */
    onDayClick: function(dt, ad, el, cal) {
        if (this.readOnly === true) {
            return;
        }
        if (this.fireEvent('dayclick', this, Ext.Date.clone(dt), ad, el) !== false) {
            var M = Extensible.calendar.data.EventMappings,
                rec = new Extensible.calendar.data.EventModel();
            rec.data[M.StartDate.name] = dt;
            rec.data[M.EndDate.name] = Ext.Date.add(dt, Ext.Date.MINUTE, this.hourIncrement);
            rec.data[M.IsAllDay.name] = ad;
            rec.data[M.CalendarId.name] = cal;

            this.showEventEditor(rec, el);
        }
    },

    /**
     * Handles a click event anywhere inside the body area.
     * @param e
     * @param t
     */
    onClick: function(e, t) {
        // Check if drag is pending or AbstractCalendar can handle the click.
        if(this.dragPending || Extensible.calendar.view.AbstractCalendar.prototype.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }

        if(e.getTarget('.ext-cal-day-times', 3) !== null) {
            // Ignore clicks on the times-of-day gutter
            return;
        }

        // Handle click on the body background. Open event editor to create a new event.
        var el = e.getTarget('div', 6);
        var day = this.getDayAt(e.getX(), e.getY(), el.id);
        if(day && day.date && day.el && el.id) {
            var calendar = day.el.id.replace(this.id, '');
            var parts = calendar.split('-');
            this.onDayClick(day.date, false, null, parts[3]);
        }
    },

    /**
     * Called from Extensible.calendar.dd.SchedulerBDropZone if the drag/drop is made on an empty calendar cell.
     * @param start event's start date
     * @param end event's end date
     * @param calId current calendar item's Id - from the current area under the mouse's pointer
     * @param onComplete callback function that can be passed to be executed at the end of this method
     */
    onCalendarEndDrag: function(start, end, calId, onComplete) {
        // set this flag for other event handlers that might conflict while we're waiting
        this.dragPending = true;
        var boundOnComplete = Ext.bind(this.onCalendarEndDragComplete, this, [onComplete]);

        var M = Extensible.calendar.data.EventMappings,
            rec = new Extensible.calendar.data.EventModel();
            rec.data[M.StartDate.name] = start;
            rec.data[M.EndDate.name] = end;
            rec.data[M.CalendarId.name] = calId;

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
    // inherited docs
    isActiveView: function() {
        var calendarPanel = this.ownerCalendarPanel;
        return (calendarPanel && calendarPanel.getActiveView().isSchedulerView);
    }
});