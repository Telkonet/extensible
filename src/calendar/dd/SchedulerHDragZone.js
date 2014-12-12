/**
 * Internal drag zone implementation for the calendar components. This provides base functionality
 * and is primarily for the scheduler view (header section) -- SchedulerHeaderDD adds calendar column view-specific functionality.
 * @private
 */
Ext.define('Extensible.calendar.dd.SchedulerHDragZone', {
    extend: 'Ext.dd.DragZone',
    
    requires: [
        'Ext.util.Point',
        'Extensible.calendar.dd.StatusProxy',
        'Extensible.calendar.data.EventMappings'
    ],
    
    ddGroup: 'SchedulerHeaderDD',
    eventSelector: '.ext-cal-evt',
    eventSelectorDepth: 10,
    
    constructor: function(el, config) {
        if (!Extensible.calendar._statusProxyInstance) {
            Extensible.calendar._statusProxyInstance = Ext.create('Extensible.calendar.dd.StatusProxy');
        }
        this.proxy = Extensible.calendar._statusProxyInstance;
        this.callParent(arguments);
    },
    /**
     * Interrogating the passed mouse events to see where this event has taken place
     * @param e
     * @returns {*}
     */
    getDragData: function(e) {
        // Check whether we are dragging on an event first
        var t = e.getTarget(this.eventSelector, this.eventSelectorDepth);
        if (t) {
            var rec = this.view.getEventRecordFromEl(t);
            if (!rec) {
                // if rec is null here it usually means there was a timing issue between drag
                // start and the browser reporting it properly. Simply ignore and it will
                // resolve correctly once the browser catches up.
                return;
            }
            return {
                type: 'eventdrag',
                ddel: t,
                eventCalendar:rec.data[Extensible.calendar.data.EventMappings.CalendarId.name],
                proxy: this.proxy
            };
        }
        
        // If not dragging an event then we are dragging on the calendar to add a new event
        if (t == null){
            return {
                type: 'caldrag',
                proxy: this.proxy
            };
        }

        return null;
    },

    /**
     * Called once drag threshold has been reached to initialize the proxy element. By default, it clones the this.dragData.ddel
     * @param x The x position of the click on the dragged object
     * @param y The y position of the click on the dragged object
     * @returns {boolean} true to continue the drag, false to cancel
     */
    onInitDrag: function(x, y) {
        if (this.dragData.ddel) {
            var ghost = this.dragData.ddel.cloneNode(true),
                child = Ext.fly(ghost).down('dl');

            Ext.fly(ghost).setWidth('auto');

            if (child) {
                child.setHeight('auto');    // for IE/Opera
            }
            this.proxy.update(ghost);
            this.onStartDrag(x, y);
        } else if(this.dragData.start) {
            this.onStartDrag(x, y);
        }

        this.view.onInitDrag();
        return true;
    },
    
    afterRepair: function() {
        if (Ext.enableFx && this.dragData.ddel) {
            Ext.fly(this.dragData.ddel).highlight(this.hlColor || 'c3daf9');
        }

        this.dragging = false;
    },
    
    getRepairXY: function(e) {
        if (this.dragData.ddel) {
            return Ext.fly(this.dragData.ddel).getXY();
        }
    },
    /**
     * If an invalid drop occured, the shim layer is hidden.
     * @param e
     * @param id
     */
    afterInvalidDrop: function(e, id) {
        Ext.select('.ext-dd-shim').hide();
    },
    
    destroy: function() {
        this.callParent(arguments);
        delete Extensible.calendar._statusProxyInstance;
    }
});