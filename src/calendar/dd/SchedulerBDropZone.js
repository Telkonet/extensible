/**
 * Internal drop zone implementation for the calendar day and week views.
 * @private
 */
Ext.define('Extensible.calendar.dd.SchedulerBDropZone', {
    extend: 'Extensible.calendar.dd.DropZone',

    ddGroup: 'SchedulerBodyDD',
    dateRangeFormat: '{0}-{1}',
    dateFormat: 'n/j',
    shims:[],
    /**
     * This is the point where we are retrieving the cell on which the event is about to be dropped.
     * @param e
     * @returns {{date: *, el: *, calIdx: *}} the object containing the current day, calendar grid cell and target
     * calendar index
     */
    getTargetFromEvent: function(e) {
        var evtTarget = e.getTarget('div',6);
        var calDomId = evtTarget.id;
        try {
            if (calDomId.search(this.view.id) == -1) { //the shim is under the active drop zone
                calDomId = Ext.get(evtTarget).up('div').id;
            }
            calDomId = calDomId.replace('ext-dd-shim-','');
            var dragOffset = this.dragOffset || 0,
                y = e.getPageY() - dragOffset,
                d = this.view.getDayAt(e.getPageX(), y, calDomId);
            var calendarId = this.getCalendarIdFromDomElId(calDomId);
            if (d.el && calendarId) {
                d.calendarId = calendarId;
                return d;
            } else {
                return null;
            }
        } catch(ex) {
            return null;
        }
    },
    getCalendarIdFromDomElId:function(domElement) {
        var calendar = domElement.replace(this.view.id, '');
        var parts = calendar.split(this.view.dayColumnElIdDelimiter);
        if (parts.length == 1) return null;
        parts = parts[1].split('-');
        return parts[0];
    },
    onNodeOver: function(n, dd, e, data) {
        var dt,
            box,
            diff,
            curr,
            text = this.createText,
            timeFormat = Extensible.Date.use24HourTime ? 'G:i' : 'g:ia';
        if(data.type === 'caldrag') {
            if(!this.dragStartMarker) {
                // Since the container can scroll, this gets a little tricky.
                // There is no el in the DOM that we can measure by default since
                // the box is simply calculated from the original drag start (as opposed
                // to dragging or resizing the event where the orig event box is present).
                // To work around this we add a placeholder el into the DOM and give it
                // the original starting time's box so that we can grab its updated
                // box measurements as the underlying container scrolls up or down.
                // This placeholder is removed in onNodeDrop.

                this.dragStartMarker = n.el.parent().createChild({
                    //style: 'position:absolute;'
                });
                // use the original dayInfo values from the drag start
                this.dragStartMarker.setBox(data.dayInfo.timeBox);
                this.dragCreateDt = data.dayInfo.date;
            }
            var endDt;
            box = this.dragStartMarker.getBox();
            box.x= n.el.getX();
            box.width = n.el.getWidth();
            box.height = Math.ceil(Math.abs(e.getY() - box.y) / n.timeBox.height) * n.timeBox.height;
            
            if(e.getY() < box.y) {
                box.height += n.timeBox.height;
                box.y = box.y - box.height + n.timeBox.height;
                endDt = Extensible.Date.add(this.dragCreateDt, {minutes: this.ddIncrement});
            }
            else{
                n.date = Extensible.Date.add(n.date, {minutes: this.ddIncrement});
            }
            this.shim(this.dragCreateDt, box, n.calendarId);
            
            diff = Extensible.Date.diff(this.dragCreateDt, n.date);
            curr = Extensible.Date.add(this.dragCreateDt, {millis: diff});
                
            this.dragStartDate = Extensible.Date.min(this.dragCreateDt, curr);
            this.dragEndDate = endDt || Extensible.Date.max(this.dragCreateDt, curr);
                
            dt = Ext.String.format(this.dateRangeFormat,
                Ext.Date.format(this.dragStartDate, timeFormat),
                Ext.Date.format(this.dragEndDate, timeFormat));
        }
        else{
            var evtEl = Ext.get(data.ddel),
                dayCol = evtEl.parent();

            box = evtEl.getBox();
            box.width = dayCol.getWidth();
            if(data.type === 'eventdrag') {

                if(this.dragOffset === undefined) {
                    // on fast drags there is a lag between the original drag start xy position and
                    // that first detected within the drop zone's getTargetFromEvent method (which is
                    // where n.timeBox comes from). to avoid a bad offset we calculate the
                    // timeBox based on the initial drag xy, not the current target xy.
                    var initialTimeBox = this.view.getDayAt(data.xy[0], data.xy[1], dayCol.id).timeBox;
                    this.dragOffset = initialTimeBox.y - box.y;
                } else {
                    box.y = n.timeBox.y;
                }
                dt = Ext.Date.format(n.date, (this.dateFormat + ' ' + timeFormat));
                box.x = n.el.getLeft();
                this.shim(n.date, box, n.calendarId);
                text = (e.ctrlKey || e.altKey) ? this.copyText : this.moveText;
            }
            if(data.type === 'eventresize') {
                if(!this.resizeDt) {
                    this.resizeDt = n.date;
                }
                box.x = dayCol.getLeft();
                box.height = Math.ceil(Math.abs(e.getY() - box.y) / n.timeBox.height) * n.timeBox.height;
                if(e.getY() < box.y) {
                    box.y -= box.height;
                }
                else{
                    n.date = Extensible.Date.add(n.date, {minutes: this.ddIncrement});
                }
                this.shim(this.resizeDt, box, n.calendarId);
                
                diff = Extensible.Date.diff(this.resizeDt, n.date);
                curr = Extensible.Date.add(this.resizeDt, {millis: diff});
                
                var start = Extensible.Date.min(data.eventStart, curr),
                    end = Extensible.Date.max(data.eventStart, curr),
                    startDateName = Extensible.calendar.data.EventMappings.StartDate.name,
                    endDateName = Extensible.calendar.data.EventMappings.EndDate.name;
                    
                data.resizeDates = {};
                data.resizeDates[startDateName] = start;
                data.resizeDates[endDateName] = end;

                dt = Ext.String.format(this.dateRangeFormat,
                    Ext.Date.format(start, timeFormat),
                    Ext.Date.format(end, timeFormat));
                    
                text = this.resizeText;
            }
        }
        
        data.proxy.updateMsg(Ext.String.format(text, dt));
        return this.dropAllowed;
    },
    
    shim: function(dt, box, calendarId) {
        this.DDMInstance.notifyOccluded = true;

        Ext.each(this.shims, function(shim) {
            if(shim) {
                shim.isActive = false;
                shim.hide();
            }
        });

        var shim = this.shims[calendarId];
        if(!shim) {
            shim = this.createShim(calendarId);
            this.shims[calendarId] = shim;
        }
        shim.boxInfo = box;
        shim.isActive = true;
        Ext.each(this.shims, function(shim) {
            if (shim) {
                if (shim.isActive) {
                    shim.show();
                    shim.setBox(shim.boxInfo);
                } else if (shim.isVisible()) {
                    shim.hide();
                }
            }
        });

    },
    createShim: function(calId) {
       var owner_parent = this.view.ownerCalendarPanel ? this.view.ownerCalendarPanel: this.view;
        var owner = Ext.query('*[id^='+ this.view.id + this.view.dayColumnElIdDelimiter + calId + '-outer]');
            owner = Ext.get(owner[0]);

        if (!this.shimCt) {
            this.shimCt = Ext.get('ext-dd-shim-ct');
            if (!this.shimCt) {
                this.shimCt = document.createElement('div');
                this.shimCt.id = 'ext-dd-shim-ct';
               owner_parent.getEl().parent().appendChild(this.shimCt);
            }
        }

        var el = document.createElement('div');
        el.className = 'ext-dd-shim';
        el.id ='ext-dd-shim-'+owner.id;
        this.shimCt.appendChild(el);

        return Ext.create('Ext.Layer', {
            shadow: false,
            useDisplay: true,
            constrain: false
        }, el);
    },
    clearShims: function() {
        Ext.each(this.shims, function(shim) {
            if (shim) {
                shim.hide();
            }
        });
        this.DDMInstance.notifyOccluded = false;
    },
    onCalendarDragComplete: function() {
        this.clearShims();
    },
    onNodeDrop: function(n, dd, e, data) {
        if(n && data) {
            var rec;

            if(data.type === 'eventdrag') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                var oldCalId = rec.data.CalendarId;
                var oldStartDate = rec.data.StartDate;
                if (rec.data.CalendarId != n.calendarId) {
                    rec.data.CalendarId = n.calendarId;
                    if (Ext.Date.isEqual(rec.data.StartDate, n.date)) {
                        rec.data.StartDate = Ext.Date.add(n.date, Ext.Date.SECOND, 59);
                        rec.data.EndDate = Ext.Date.subtract(rec.data.EndDate, Ext.Date.SECOND, 59);
                    }
                }
                this.view.onEventDrop(rec, n.date, (e.ctrlKey || e.altKey) ? 'copy' : 'move');
                //since we may have "n" calendar columns, we must ensure that the default Ctrl+Drag mechanism is overridden
                //the default mechanism is cloning the current record and is moving it to the new position;
                // but because of the calendar colums, both the events are moved so we have to move back one of them to the original position
                if ((e.ctrlKey || e.altKey) && oldCalId !== n.calendarId) {
                    rec.data.CalendarId = oldCalId;
                    rec.data.StartDate = Ext.Date.add(oldStartDate, Ext.Date.SECOND, 59);
                    this.view.onEventDrop(rec, oldStartDate, 'move');
                }
                this.onCalendarDragComplete();
                delete this.dragOffset;
                return true;
            }
            if(data.type === 'eventresize') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                this.view.onEventResize(rec, data.resizeDates);
                this.onCalendarDragComplete();
                delete this.resizeDt;
                return true;
            }
            if(data.type === 'caldrag') {
                Ext.destroy(this.dragStartMarker);
                delete this.dragStartMarker;
                delete this.dragCreateDt;
                this.view.onCalendarEndDrag(this.dragStartDate, this.dragEndDate, n.calendarId,
                    Ext.bind(this.onCalendarDragComplete, this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        this.onCalendarDragComplete();
        return false;
    },
    destroy: function() {
        Ext.each(this.shims, function(shim) {
            if (shim) {
                Ext.destroy(shim);
            }
        });

        Ext.removeNode(this.shimCt);
        delete this.shimCt;
        this.shims.length = 0;
    }
});
