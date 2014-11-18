/**
 * Internal drop zone implementation for the calendar components. This provides base functionality
 * and is primarily for the month view -- DayViewDD adds day/week view-specific functionality.
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
    
    getTargetFromEvent: function(e) {
        var eventCell = Ext.get(e.getTarget()),
            calendarIdx = eventCell.id.split(this.id)[1];

        calendarIdx = calendarIdx === undefined ? null: calendarIdx.split('-')[0];

        return {
            date: this.view.viewStart,
            el: eventCell,
            calIdx: calendarIdx
            };
    },
    
    onNodeOver: function(n, dd, e, data) {
        var eventDragText = (e.ctrlKey || e.altKey) ? this.copyText: this.moveText;
           if (n.calIdx !== null) {
                this.shim(n,data);
                data.proxy.updateMsg(Ext.String.format(data.type === 'eventdrag' ? eventDragText :
                    this.createText, this.view.calendarStore.data.items[n.calIdx].data.Title));
                return this.dropAllowed;
           }
        return this.dropNotAllowed;
    },
    
    shim: function(e,data) {
        var box,
            calIdx,
            shim;

        this.DDMInstance.notifyOccluded = true;

        Ext.each(this.shims, function(shim) {
            if (shim) {
                shim.isActive = false;
            }
        });
        
        calIdx = e.calIdx;
        if (calIdx !== null) {
            shim = this.shims[calIdx];
            if (!shim) {
                shim = this.createShim(calIdx);
                this.shims[calIdx] = shim;
            }
            shim.boxInfo = e.el.getBox();
            shim.isActive = true;
        }
        Ext.each(this.shims, function(shim) {
            if (shim) {
                if (shim.isActive) {
                    shim.show();
                    shim.setBox(shim.boxInfo);
                    //Ext.get(shim).applyStyles('z-index:0');
                } else if (shim.isVisible()) {
                    shim.hide();
                }
            }
        });
    },
    
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

