/**
 * Internal drop zone implementation for the calendar components. This provides base functionality
 * and is primarily for the scheduler view (header section) -- SchedulerHeaderDD adds calendar column view-specific functionality.
 * @private
 * @author Alin Miron, reea.net
 */
Ext.define('Extensible.calendar.dd.SchedulerHDropZone', {
    extend: 'Extensible.calendar.dd.DropZone',

    requires: [
        'Ext.Layer',
        'Extensible.calendar.data.EventMappings'
    ],

    shims: [],

    /**
     * This is the point where we are retrieving the cell on which the event is about to be dropped.
     * @param e
     * @returns {{date: *, el: *, calendarId: *}} the object containing the current day, calendar grid cell and target
     * calendar index
     */
    getTargetFromEvent: function(e) {
        var eventCell = Ext.get(e.getTarget()),
            calendarId = eventCell.id.split(this.view.columnElIdDelimiter)[2]; //empty cell
        try {
            if (calendarId === undefined) {
                calendarId = eventCell.up('table').up('td').id.split(this.view.columnElIdDelimiter)[2];
            }
        }
        catch(ex) {
        }
        calendarId = (calendarId === undefined ? null: calendarId.split('-')[0]);

        return {
            date: this.view.viewStart,
            el: eventCell,
            calendarId: calendarId
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
            if (n.calendarId !== null) {
               //we use the background table
               var boxRegion = Ext.select('[id^=' + this.id + this.view.columnElIdDelimiter + n.calendarId + '-wk]:first');
                box = Ext.get(boxRegion.elements[0]).getBox();
            this.shim(n, box);
            data.proxy.updateMsg(Ext.String.format(data.type === 'eventdrag' ? eventDragText :
               this.createText, this.view.calendarStore.findRecord('CalendarId',n.calendarId).data.Title));
            return this.dropAllowed;
           }
    },

    /**
     * This creates and sets-up the layer that is displayed over the current cell that is dragged and dropped
     * @param n
     */
    shim: function(n, box) {
        var shim;

        this.DDMInstance.notifyOccluded = true;

        Ext.each(this.shims, function(shim) {
            if (shim) {
                shim.isActive = false;
                shim.hide();
            }
        });

        shim = this.createShim(n.calendarId);
        this.shims[0] = shim;
        shim.boxInfo = box;
        shim.isActive = true;
        shim.show();
        shim.setBox(shim.boxInfo);
   },

   /**
    *
    * @param calendarId Index of the current calendar item in the calendar store.
    * @returns {Ext.Layer} Layer element that will be set overlapped on the current drag/dropped cell
    */
   createShim: function(calendarId) {
        var owner = this.view.ownerCalendarPanel ? this.view.ownerCalendarPanel: this.view;
        var cal_owner = this.view.id + this.view.columnElIdDelimiter;

        if (!this.shimCt) {
            this.shimCt = Ext.get('ext-dd-shim-ct-' + cal_owner);
            if (!this.shimCt) {
                this.shimCt = document.createElement('div');
                this.shimCt.id = 'ext-dd-shim-ct-' + cal_owner;
                owner.getEl().parent().appendChild(this.shimCt);
            }
        }
        var el = document.createElement('div');

        el.className = 'ext-dd-shim';
        el.id =  el.id + cal_owner + calendarId + '-';

        this.shimCt.appendChild(el);

        return Ext.create('Ext.Layer', {
            shadow: false, 
            useDisplay: true,
            constrain: false
        }, el);
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
                if (n.calendarId !== null) {
                    this.view.onEventDrop(rec, n.calendarId, (e.ctrlKey || e.altKey) ? 'copy': 'move');
                    this.onCalendarDragComplete();
                    return true;
                }
                return false;
            }
            if (data.type === 'caldrag' && n.calendarId !== null) {
                this.view.onCalendarEndDrag(n.calendarId, Ext.bind(this.onCalendarDragComplete, this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        return false;
    }
});