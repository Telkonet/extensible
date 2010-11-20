Ext.ensible.LocaleSample = function(){
    return {
        init: function(){
            Ext.QuickTips.init();
            
            var localeStore = new Ext.data.ArrayStore({
                fields: ['code', 'desc'],
                data : [
                    ['en', 'English (US)'],
                    ['fr', 'French (France)'],
                    ['ro', 'Romanian']
                ]
            });
            
            var localeCombo = new Ext.form.ComboBox({
                renderTo: 'locales',
                store: localeStore,
                displayField: 'desc',
                valueField: 'code',
                typeAhead: true,
                mode: 'local',
                triggerAction: 'all',
                emptyText: 'Select a locale...',
                selectOnFocus: true,
                value: 'en',
                listeners: {
                    'select': {
                        fn: function(cbo, rec, idx){
                            this.calendar.getEl().mask('Loading '+rec.data.desc+'...');
                            this.loadLocale(rec.data.code);
                        },
                        scope: this
                    }
                }
            });
            
            this.renderUI();
        },
        
        doLoad: function(url, successFn){
            Ext.Ajax.request({
                url: url,
                disableCaching: false,
                success: successFn,
                failure: function(){
                    Ext.Msg.alert('Failure', 'Failed to load locale file.');
                    this.renderUI();
                },
                scope: this 
            });
        },
        
        loadLocale: function(code){
            this.doLoad('ext-locales/ext-lang-'+code+'.js', function(resp, opts){
                eval(resp.responseText); // apply the Ext locale overrides
                this.doLoad('../../src/locale/extensible-lang-'+code+'.js', function(resp, opts){
                    eval(resp.responseText); // apply the Extensible locale overrides
                    this.renderUI();
                });
            });
        },
        
        renderUI: function() {
            var today = new Date().clearTime();
            var eventStore = new Ext.data.JsonStore({
                id: 'eventStore',
                data: [{
                    "id":100,
                    "title":"Vacation",
                    // this event spans multiple days so it will automatically be rendered as all-day
                    "start":today.add(Date.DAY, -5).add(Date.HOUR, 10),
                    "end":today.add(Date.DAY, 5).add(Date.HOUR, 15),
                    "notes":"Have fun"
                },{
                    "id":101,
                    "title":"Lunch with Matt",
                    "start":today.add(Date.HOUR, 11).add(Date.MINUTE, 30),
                    "end":today.add(Date.HOUR, 13),
                    "loc":"Chuy's!",
                    "url":"http://chuys.com",
                    "notes":"Order the queso",
                    "rem":"15"
                },{
                    "id":102,
                    "title":"Brian's birthday",
                    "start":today.add(Date.HOUR, 15),
                    "end":today.add(Date.HOUR, 15),
                    "ad":true // explicit all-day event
                },{
                    // id, start and end dates are the only truly required data elements to render an event:
                    "id":103,
                    "start":today.add(Date.HOUR, 15),
                    "end":today.add(Date.HOUR, 15)
                }],
                proxy: new Ext.data.MemoryProxy(),
                fields: Ext.ensible.cal.EventRecord.prototype.fields.getRange(),
                sortInfo: {
                    field: Ext.ensible.cal.EventMappings.StartDate.name,
                    direction: 'ASC'
                }
            });
            
            if(this.calendar){
                Ext.destroy(this.calendar);
            }
            this.calendar = new Ext.ensible.cal.CalendarPanel({
                eventStore: eventStore,
                renderTo: 'cal',
                title: 'Localized Calendar',
                width: 800,
                height: 600
            });
        }
    }
}();

Ext.onReady(Ext.ensible.LocaleSample.init, Ext.ensible.LocaleSample);