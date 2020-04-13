let elec = null;
mp.gui.cursor.visible = false;
mp.gui.chat.show(true);

var mycands = [];
var cands = 0;

mp.events.add('addcandidate', function (Name) {
    elec.AddItem(new UIMenuItem(Name, "Кандидат"));
    elec.Open();
    mp.gui.cursor.visible = false;
    localplayer.freezePosition(true);
    mp.gui.chat.show(false);
});

mp.events.add('openelem', (firstname) => {
    elec = new Menu("ВЫБОРЫ", "Номер кандидата: ", new Point(50, 50));
    elec.AddItem(new UIMenuItem(firstname, "Кандидат"));
    elec.Close();
    elec.ItemSelect.on(item => {
		if(new Date().getTime() - global.lastCheck < 100) return; 
		global.lastCheck = new Date().getTime();
        if (item instanceof UIMenuItem) {
            mp.events.callRemote("choosedelec", item.Text);
            mp.gui.cursor.visible = false;
            localplayer.freezePosition(false);
            mp.gui.chat.show(true);
            elec.Close();
        }
    });
});