const NativeUI = require("nativeui");
const Menu = NativeUI.Menu;
const UIMenuItem = NativeUI.UIMenuItem;
const UIMenuListItem = NativeUI.UIMenuListItem;
const UIMenuCheckboxItem = NativeUI.UIMenuCheckboxItem;
const UIMenuSliderItem = NativeUI.UIMenuSliderItem;
const BadgeStyle = NativeUI.BadgeStyle;
const Point = NativeUI.Point;
const ItemsCollection = NativeUI.ItemsCollection;
const Color = NativeUI.Color;
const ListItem = NativeUI.ListItem;

let elec = null;
mp.gui.cursor.visible = false;
mp.gui.chat.show(true);

var mycands = [];
var cands = 0;

mp.events.add('addcandidate', function (Name, Votes) {
    elec.AddItem(new UIMenuItem(Name, "Голосов: " + Votes));
    elec.Open();
    mp.gui.cursor.visible = false;
    localPlayer.freezePosition(true);
    mp.gui.chat.show(false);
});

mp.events.add('openelem', (firstname, firstvotes) => {
    elec = new Menu("ВЫБОРЫ", "Номер кандидата: ", new Point(50, 50));
    elec.AddItem(new UIMenuItem(firstname, "Голосов: " + firstvotes));
    elec.Close();
    elec.ItemSelect.on(item => {
        if (item instanceof UIMenuItem) {
            mp.events.callRemote("choosedelec", item.Text);
            mp.gui.cursor.visible = false;
            localPlayer.freezePosition(false);
            mp.gui.chat.show(true);
            elec.Close();
        }
    });
});