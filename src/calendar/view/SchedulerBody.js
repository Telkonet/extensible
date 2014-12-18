/**
 * @class Extensible.calendar.view.SchedulerBody
 * @extends Extensible.calendar.view.AbstractCalendar
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.view.SchedulerBody', {
    extend: 'Extensible.calendar.view.AbstractCalendar',
    alias: 'widget.extensible.schedulerbodyview',

    requires: [
        'Ext.XTemplate',
        'Extensible.calendar.template.SchedulerBody',
        'Extensible.calendar.data.EventMappings',
        'Extensible.calendar.dd.SchedulerBDragZone',
        'Extensible.calendar.dd.SchedulerBDropZone'
    ],

    //private
    dayColumnElIdDelimiter: '-day-col-',
    hourIncrement: 60,

    //private
    initComponent: function() {
        this.callParent(arguments);

        if(this.readOnly === true) {
            this.enableEventResize = false;
        }
        this.incrementsPerHour = this.hourIncrement / this.ddIncrement;
        this.minEventHeight = this.minEventDisplayMinutes / (this.hourIncrement / this.hourHeight);

        this.addEvents({
            /**
             * @event beforeeventresize
             * Fires after the user drags the resize handle of an event to resize it, but before the resize
             * operation is carried out. This is a cancelable event, so returning false from a handler will
             * cancel the resize operation.
             * @param {Extensible.calendar.view.SchedulerBody} this
             * @param {Extensible.calendar.data.EventModel} rec The original {@link
             * Extensible.calendar.data.EventModel record} for the event that was resized
             * @param {Object} data An object containing the new start and end dates that will be set into the
             * event record if the event is not canceled. Format of the object is: {StartDate: [date], EndDate: [date]}
             */
            beforeeventresize: true,
            /**
             * @event eventresize
             * Fires after the user has drag-dropped the resize handle of an event and the resize operation is
             * complete. If you need to cancel the resize operation you should handle the {@link #beforeeventresize}
             * event and return false from your handler function.
             * @param {Extensible.calendar.view.SchedulerBody} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event that was resized containing the updated start and end dates
             */
            eventresize: true,
            /**
             * @event dayclick
             * Fires after the user clicks within the view container and not on an event element. This is a
             * cancelable event, so returning false from a handler will cancel the click without displaying the event
             * editor view. This could be useful for validating that a user can only create events on certain days.
             * @param {Extensible.calendar.view.SchedulerBody} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks
             * within the SchedulerBodyView always return false for this param.
             * @param {Ext.Element} el The Element that was clicked on
             */
            dayclick: true
        });
    },

    //private
    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            copyText: this.ddCopyEventText,
            moveText: this.ddMoveEventText,
            resizeText: this.ddResizeEventText,
            ddIncrement: this.ddIncrement,
            ddGroup: this.ddGroup || this.id+'-SchedulerBodyDDD'
        };

        this.el.ddScrollConfig = {
            // scrolling is buggy in IE/Opera for some reason.  A larger vthresh
            // makes it at least functional if not perfect
            vthresh: Ext.isIE || Ext.isOpera ? 100 : 40,
            hthresh: -1,
            frequency: 50,
            increment: 100,
            ddGroup: this.ddGroup || this.id+'-SchedulerBodyDD'
        };

        this.dragZone = Ext.create('Extensible.calendar.dd.SchedulerBDragZone', this.el, Ext.apply({
            // disabled for now because of bugs in Ext 4 ScrollManager:
            //containerScroll: true
        }, cfg));

        this.dropZone = Ext.create('Extensible.calendar.dd.SchedulerBDropZone', this.el, cfg);
    },

    //private
    refresh: function(reloadData) {
        Extensible.log('refresh (SchedulerBodyView)');
        var top = this.el.getScroll().top;

        this.callParent(arguments);

        // skip this if the initial render scroll position has not yet been set.
        // necessary since IE/Opera must be deferred, so the first refresh will
        // override the initial position by default and always set it to 0.
        if(this.scrollReady) {
            this.scrollTo(top);
        }
    },

    /**
     * Scrolls the container to the specified vertical position. If the view is large enough that
     * there is no scroll overflow then this method will have no affect.
     * @param {Number} y The new vertical scroll position in pixels
     * @param {Boolean} defer (optional) <p>True to slightly defer the call, false to execute immediately.</p>
     *
     * <p>This method will automatically defer itself for IE and Opera (even if you pass false) otherwise
     * the scroll position will not update in those browsers. You can optionally pass true, however, to
     * force the defer in all browsers, or use your own custom conditions to determine whether this is needed.</p>
     *
     * <p>Note that this method should not generally need to be called directly as scroll position is
     * managed internally.</p>
     */
    scrollTo: function(y, defer) {
        defer = defer || (Ext.isIE || Ext.isOpera);
        if(defer) {
            Ext.defer(function() {
                this.el.scrollTo('top', y);
                this.scrollReady = true;
            }, 10, this);
        }
        else{
            this.el.scrollTo('top', y);
            this.scrollReady = true;
        }
    },

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
                calendars: this.tCalendars,
                events: this.tCEventsB,
                hourHeight: this.hourHeight,
                visibleCalendars: 0
            });
        }
        this.tpl.compile();

        this.addCls('ext-cal-body-ct');

        this.callParent(arguments);

        // default scroll position to scrollStartHour (7am by default) or min view hour if later
        var startHour = Math.max(this.scrollStartHour, this.viewStartHour),
            scrollStart = Math.max(0, startHour - this.viewStartHour);

        if(scrollStart > 0) {
            this.scrollTo(scrollStart * this.hourHeight);
        }
    },

    // private
    forceSize: Ext.emptyFn,

    // private -- called from SchedulerBDropZone
    onEventResize: function(rec, data) {
        var me = this,
            EventMappings = Extensible.calendar.data.EventMappings,
            compareFn = Extensible.Date.compare;

        if (compareFn(rec.getStartDate(), data[EventMappings.StartDate.name]) === 0 &&
            compareFn(rec.getEndDate(), data[EventMappings.EndDate.name]) === 0) {
            // no changes
            return;
        }

        if (me.fireEvent('beforeeventresize', me, rec, data) !== false) {
            if (rec.isRecurring()) {
                if (me.recurrenceOptions.editSingleOnResize) {
                    me.onRecurrenceResizeModeSelected('single', rec, data);
                }
                else {
                    this.rangeEditWin = this.rangeEditWin || Ext.WindowMgr.get('ext-cal-rangeeditwin');
                    if (!this.rangeEditWin) {
                        this.rangeEditWin = new Extensible.form.recurrence.RangeEditWindow();
                    }
                    this.rangeEditWin.prompt({
                        callback: Ext.bind(me.onRecurrenceResizeModeSelected, me, [rec, data], true),
                        scope: me
                    });
                }
            }
            else {
                me.doEventResize(rec, data);
            }
        }
    },

    // private
    onRecurrenceResizeModeSelected: function(editMode, rec, data) {
        var EventMappings = Extensible.calendar.data.EventMappings;

        if (editMode) {
            rec.data[EventMappings.REditMode.name] = editMode;
            rec.data[EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            this.doEventResize(rec, data);
        }
        // else user canceled
    },

    doEventResize: function(rec, data) {
        var EventMappings = Extensible.calendar.data.EventMappings,
            startDateName = EventMappings.StartDate.name,
            endDateName = EventMappings.EndDate.name,
            updateData = {};

        updateData[startDateName] = data[startDateName];
        updateData[endDateName] = data[endDateName];
        
        if (EventMappings.Duration) {
            updateData[EventMappings.Duration.name] = Extensible.Date.diff(data[startDateName], data[endDateName],
                Extensible.calendar.data.EventModel.resolution);
        }

        rec.set(updateData);

        this.save();

        this.fireEvent('eventupdate', this, rec);
        this.fireEvent('eventresize', this, rec);
    },

    // inherited docs
    getEventBodyMarkup: function() {
        if(!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
                '<tpl if="_isReminder">',
                    '<i class="ext-cal-ic ext-cal-ic-rem">&#160;</i>',
                '</tpl>',
                '<tpl if="_isRecurring">',
                    '<i class="ext-cal-ic ext-cal-ic-rcr">&#160;</i>',
                '</tpl>'
//                '<tpl if="spanLeft">',
//                    '<i class="ext-cal-spl">&#160;</i>',
//                '</tpl>',
//                '<tpl if="spanRight">',
//                    '<i class="ext-cal-spr">&#160;</i>',
//                '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    // inherited docs
    getEventTemplate: function() {
        if(!this.eventTpl) {
            this.eventTpl = !(Ext.isIE || Ext.isOpera) ?
                Ext.create('Ext.XTemplate',
                    '<div id="{_elId}" class="{_extraCls} ext-cal-evt ext-cal-evr" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
                        '<div class="ext-evt-bd">', this.getEventBodyMarkup(), '</div>',
                        this.enableEventResize ?
                            '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&#160;</div></div>' : '',
                    '</div>'
                )
                : Ext.create('Ext.XTemplate',
                    '<div id="{_elId}" class="ext-cal-evt {_extraCls}" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px;">',
                        '<div class="ext-cal-evb">&#160;</div>',
                        '<dl style="height: {_height}px;" class="ext-cal-evdm">',
                            '<dd class="ext-evt-bd">',
                                this.getEventBodyMarkup(),
                            '</dd>',
                            this.enableEventResize ?
                                '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&#160;</div></div>' : '',
                        '</dl>',
                        '<div class="ext-cal-evb">&#160;</div>',
                    '</div>'
                );
            this.eventTpl.compile();
        }
        return this.eventTpl;
    },

    /**
     * <p>Returns the XTemplate that is bound to the calendar's event store (it expects records of type
     * {@link Extensible.calendar.data.EventModel}) to populate the calendar views with <strong>all-day</strong> events.
     * Internally this method by default generates different markup for browsers that support CSS border radius
     * and those that don't. This method can be overridden as needed to customize the markup generated.</p>
     * <p>Note that this method calls {@link #getEventBodyMarkup} to retrieve the body markup for events separately
     * from the surrounding container markup.  This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. If you do override this method, you should make sure that your
     * overridden version also does the same.</p>
     * @return {Ext.XTemplate} The event XTemplate
     */
    getEventAllDayTemplate: function() {
        if(!this.eventAllDayTpl) {
            var tpl, body = this.getEventBodyMarkup();

            tpl = !(Ext.isIE || Ext.isOpera) ?
                Ext.create('Ext.XTemplate',
                    '<div class="{_extraCls} {spanCls} ext-cal-evt ext-cal-evr" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
                        body,
                    '</div>'
                )
                : Ext.create('Ext.XTemplate',
                    '<div class="ext-cal-evt" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
                        '<div class="{_extraCls} {spanCls} ext-cal-evo">',
                            '<div class="ext-cal-evm">',
                                '<div class="ext-cal-evi">',
                                    body,
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>'
                );
            tpl.compile();
            this.eventAllDayTpl = tpl;
        }
        return this.eventAllDayTpl;
    },

    // private
    getTemplateEventData: function(evtData) {
        var M = Extensible.calendar.data.EventMappings,
            extraClasses = [this.getEventSelectorCls(evtData[M.EventId.name])],
            data = {},
            colorCls = 'x-cal-default',
            title = evtData[M.Title.name],
            fmt = Extensible.Date.use24HourTime ? 'G:i ' : 'g:ia ',
            recurring = evtData[M.RRule.name] !== '',
            rec;

        this.getTemplateEventBox(evtData);

        if(this.calendarStore && evtData[M.CalendarId.name]) {
            rec = this.calendarStore.findRecord(Extensible.calendar.data.CalendarMappings.CalendarId.name,
                evtData[M.CalendarId.name]);

            if (rec) {
                colorCls = 'x-cal-' + rec.data[Extensible.calendar.data.CalendarMappings.ColorId.name];
            }
        }
        colorCls += (evtData._renderAsAllDay ? '-ad' : '') + (Ext.isIE || Ext.isOpera ? '-x' : '');
        extraClasses.push(colorCls);

        extraClasses.push('ext-evt-block');

        if(this.getEventClass) {
            rec = this.getEventRecord(evtData[M.EventId.name]);
            var cls = this.getEventClass(rec, !!evtData._renderAsAllDay, data, this.store);
            extraClasses.push(cls);
        }

        data._extraCls = extraClasses.join(' ');
        data._isRecurring = evtData[M.RRule.name] && evtData[M.RRule.name] !== '';
        data._isReminder = evtData[M.Reminder.name] && evtData[M.Reminder.name] !== '';
        data.Title = (evtData[M.IsAllDay.name] ? '' : Ext.Date.format(evtData[M.StartDate.name], fmt)) +
                (!title || title.length === 0 ? this.defaultEventTitleText : title);

        return Ext.applyIf(data, evtData);
    },

    // private
    getEventPositionOffsets: function() {
        return {
            top: 0,
            height: -1
        };
    },

    // private
    getTemplateEventBox: function(evtData) {
        var heightFactor = this.hourHeight / this.hourIncrement,
            start = evtData[Extensible.calendar.data.EventMappings.StartDate.name],
            end = evtData[Extensible.calendar.data.EventMappings.EndDate.name],
            startOffset = Math.max(start.getHours() - this.viewStartHour, 0),
            endOffset = Math.min(end.getHours() - this.viewStartHour, this.viewEndHour - this.viewStartHour),
            startMins = startOffset * this.hourIncrement,
            endMins = endOffset * this.hourIncrement,
            viewEndDt = Extensible.Date.add(Ext.Date.clone(end), {hours: this.viewEndHour, clearTime: true}),
            evtOffsets = this.getEventPositionOffsets();

        if(start.getHours() >= this.viewStartHour) {
            // only add the minutes if the start is visible, otherwise it offsets the event incorrectly
            startMins += start.getMinutes();
        }
        if(end <= viewEndDt) {
            // only add the minutes if the end is visible, otherwise it offsets the event incorrectly
            endMins += end.getMinutes();
        }

        evtData._left = 0;
        evtData._width = 100;
        evtData._top = startMins * heightFactor + evtOffsets.top;
        evtData._height = Math.max(((endMins - startMins) * heightFactor), this.minEventHeight) + evtOffsets.height;
    },

    // private
    renderItems: function() {
        var day = 0,
            evt,
            evts = [];
        
        for (; day < this.dayCount; day++) {
            var ev = 0,
                emptyCells = 0,
                skipped = 0,
                d = this.eventGrid[0][day],
                ct = d ? d.length : 0;

            for (; ev < ct; ev++) {
                evt = d[ev];
                if(!evt) {
                    continue;
                }
                var item = evt.data || evt.event.data,
                    M = Extensible.calendar.data.EventMappings,
                    ad = item[M.IsAllDay.name] === true,
                    span = this.isEventSpanning(evt.event || evt),
                    renderAsAllDay = ad || span;

                if(renderAsAllDay) {
                    // this event is already rendered in the header view
                    continue;
                }
                Ext.apply(item, {
                    cls: 'ext-cal-ev',
                    _positioned: true
                });
                evts.push({
                    data: this.getTemplateEventData(item),
                    date: Extensible.Date.add(this.viewStart, {days: day})
                });
            }
        }

        // overlapping event pre-processing loop
        var i = 0,
            j = 0,
            overlapCols = [],
            l = evts.length,
            prevDt,
            evt2,
            dt;
        
        for (; i<l; i++) {
            evt = evts[i].data;
            evt2 = null;
            dt = evt[Extensible.calendar.data.EventMappings.StartDate.name].getDate();

            for (j = 0; j < l; j++) {
                if (i === j) {
                    continue;
                }
                evt2 = evts[j].data;
                if(this.isOverlapping(evt, evt2)) {
                    evt._overlap = evt._overlap === undefined ? 1 : evt._overlap+1;
                    if (evt.CalendarId == evt2.CalendarId) {
                        if(i < j) {
                            overlapCols[dt] = (overlapCols[dt] === undefined ? [] : overlapCols[dt]);
                            if (evt._overcol === undefined) {
                                evt._overcol = 0;
                            }
                            evt2._overcol = evt._overcol+1;
                            overlapCols[dt][evt.CalendarId] = overlapCols[dt][evt.CalendarId] ? Math.max(overlapCols[dt][evt.CalendarId], evt2._overcol) : evt2._overcol;
                        }
                    }
                }
            }
        }

        // rendering loop
        for (i = 0; i < l; i++) {
            evt = evts[i].data;
            dt = evt[Extensible.calendar.data.EventMappings.StartDate.name].getDate();

            if(evt._overlap !== undefined) {
                var colWidth = 100 / (overlapCols[dt][evt.CalendarId] + 1),
                    evtWidth = 100 - (colWidth * evt._overlap);

                evt._width = colWidth;
                evt._left = colWidth * evt._overcol;
            }

            var markup = this.getEventTemplate().apply(evt),
                target = this.id + '-day-col-'+evt.CalendarId+'-' + Ext.Date.format(evts[i].date, 'Ymd');
            Ext.DomHelper.append(target, markup);
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

        if (end1<start1) {
            end1 = start1;
        }
        if (end2<start2) {
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
    getDayId: function(dt,calDomId) {
        if(Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        if (calDomId != undefined || calDomId != '') {
            return calDomId;
        }
        return this.id + this.dayColumnElIdDelimiter + dt;

    },

    // private
    getDaySize: function(calDomId) {
        var box = {};

        try{
            if (calDomId !== undefined || calDomId !== '') {
                box =  this.el.down('[id='+calDomId+']').getBox();
            } else {
                box = this.el.down('.ext-cal-day-col-inner').getBox();
            }
        }catch(ex){
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
            rec.data[M.EndDate.name] = Ext.Date.add(dt,Ext.Date.MINUTE, this.hourIncrement);
            rec.data[M.IsAllDay.name] = ad;
            rec.data[M.CalendarId.name] = cal;

            this.showEventEditor(rec, el);
        }
    },
    // private
    onClick: function(e, t) {
        if(this.dragPending || Extensible.calendar.view.SchedulerBody.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        if(e.getTarget('.ext-cal-day-times', 3) !== null) {
            // ignore clicks on the times-of-day gutter
            return;
        }
        var el = e.getTarget('td', 3);

        if(el) {
            if(el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var calIdDate = this.getDateFromId(el.id, this.dayElIdDelimiter); // not returning date anymore but a string like: col-{calendarId}-{date}
                var parts = calIdDate.split('-');
                this.onDayClick(Ext.Date.parseDate(parts[2], 'Ymd'), true, Ext.get(this.getDayId(parts[2],parts[1])),parts[1]);
                return;
            }
        }

        var el = e.getTarget('div', 6);
        var day = this.getDayAt(e.getX(), e.getY(), el.id);

        if(day && day.date && day.el && el.id) {
            var calendar = day.el.id.replace(this.id,'');
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