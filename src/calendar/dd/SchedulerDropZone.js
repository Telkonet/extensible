/**
 * Internal drop zone implementation for the calendar components. This provides base functionality
 * and is primarily for the scheduler view -- SchedulerDD adds calendar column view-specific functionality.
 * @private
 */
Ext.define('Extensible.calendar.dd.SchedulerDropZone', {
    extend: 'Ext.dd.DropZone',
    
    requires: [
        'Ext.Layer',
        'Extensible.calendar.data.EventMappings'
    ],
    
    ddGroup: 'SchedulerDD',
    eventSelector: '.ext-cal-evt',
    dateRangeFormat: '{0}-{1}',
    dateFormat: 'n/j',
    
    shims: [],
    /**
     * This is the point where we are retrieving the cell on which the event is about to be dropped.
     * @param e
     * @returns {{date: *, el: *, calIdx: *}} the object containing the current day, calendar grid cell and target
     * calendar index
     */
    getTargetFromEvent: function(e) {
        var eventCell = Ext.get(e.getTarget()),
            calendarIdx = eventCell.id.split(this.id)[1]; //empty cell

        if (calendarIdx === undefined) { //may contain already an event, probing for data upper in the dom to get the proper id
            if (eventCell.up('td') !== undefined) {
                calendarIdx = eventCell.up('td')==undefined ? undefined : eventCell.up('td').id.split(this.id)[1];
                if (calendarIdx === undefined ) {
                    calendarIdx = eventCell.up('tr').up('td').id.split(this.id)[1];
                }
            }
        }
        calendarIdx = calendarIdx === undefined ? null: calendarIdx.split('-')[0];

        return {
            date: this.view.viewStart,
            el: eventCell,
            calIdx: calendarIdx
            };
    },
    /**
     *
     * @param n The custom data associated with the drop node (this is the same value returned from getTargetFromEvent
     * for this node)
     * @param dd The drag source that was dragged over this drop zone
     * @param e The event
     * @param data An object containing arbitrary data supplied by the drag source
     * @returns {*} status The CSS class that communicates the drop status back to the source so that the underlying
     * {@link Ext.dd.StatusProxy} can be updated
     */
    onNodeOver: function(n, dd, e, data) {
        var eventDragText = (e.ctrlKey || e.altKey) ? this.copyText: this.moveText;
        var box = {};
            if (n.calIdx !== null) {
               var boxRegion = Ext.select('[id^='+this.id+n.calIdx+'-wk'+']');
               boxRegion.each(function(el,all,idx){
                    var tmp = el.getBox();
                    if (idx == 0){
                        box = tmp;
                    } else {
                        box.height += tmp.height;
                    }
               });

               this.shim(n,box);
                data.proxy.updateMsg(Ext.String.format(data.type === 'eventdrag' ? eventDragText :
                    this.createText, this.view.calendarStore.data.items[n.calIdx].data.Title));
                return this.dropAllowed;
           }
        return this.dropNotAllowed;
    },
    /**
     * This creates and sets-up the layer that is displayed over the current cell that is dragged and dropped
     * @param n
     */
    shim: function(n,box) {
        var calIdx,
            shim;

        this.DDMInstance.notifyOccluded = true;

        Ext.each(this.shims, function(shim) {
            if (shim) {
                shim.isActive = false;
            }
        });
        
        calIdx = n.calIdx;
        if (calIdx !== null) {
            shim = this.shims[calIdx];
            if (!shim) {
                shim = this.createShim(calIdx);
                this.shims[calIdx] = shim;
            }
            shim.boxInfo = box;
            shim.isActive = true;
        }
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
    /**
     *
     * @param calIdx Index of the current calendar item in the calendar store.
     * @returns {Ext.Layer} Layer element that will be set overlapped on the current drag/dropped cell
     */
   createShim: function(calIdx) {
        var owner = this.view.ownerCalendarPanel ? this.view.ownerCalendarPanel: this.view;
        var cal_owner = Ext.get(this.view.id);

        if (!this.shimCt) {
            this.shimCt = Ext.get('ext-dd-shim-ct-'+cal_owner.id);
            if (!this.shimCt) {
                this.shimCt = document.createElement('div');
                this.shimCt.id = 'ext-dd-shim-ct-'+cal_owner.id;
                owner.getEl().parent().appendChild(this.shimCt);
            }
        }
        var el = document.createElement('div');

        el.className = 'ext-dd-shim';
        el.id =  el.id+'-'+cal_owner.id+calIdx+'-';

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
    
    onContainerOver: function(dd, e, data) {
        return this.dropAllowed;
    },
    
    onCalendarDragComplete: function() {
        this.clearShims();
    },
    /**
     * Depending on the user behaviour, we can have two possibilities: dragging an event cell, or dragging an empty calendar cell
     * @param n The custom data associated with the drop node (this is the same value returned from getTargetFromEvent
     * for this node)
     * @param dd The drag source that was dragged over this drop zone
     * @param e The event
     * @param data An object containing arbitrary data supplied by the drag source
     * @returns {boolean}
     */
    onNodeDrop: function(n, dd, e, data) {
        if (n && data) {
            if (data.type === 'eventdrag') {
                var rec = this.view.getEventRecordFromEl(data.ddel);
                if (n.calIdx !== null) {
                    this.view.onEventDrop(rec, n.calIdx, (e.ctrlKey || e.altKey) ? 'copy': 'move');
                    this.onCalendarDragComplete();
                    return true;
                }
                return false;
            }
            if (data.type === 'caldrag' && n.calIdx !== null) {
                this.view.onCalendarEndDrag(n.calIdx, Ext.bind(this.onCalendarDragComplete, this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        return false;
    },
    
    onContainerDrop: function(dd, e, data) {
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

