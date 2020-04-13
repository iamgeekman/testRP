global.circleEntity = null;
global.circleOpen = false;
var circleTitle = "";

function OpenCircle(title, data) {
    if (menuCheck() || circleOpen) return;
    board.execute(`circle.show("${title}",${data})`);
    circleTitle = title;
    circleOpen = true;
    menuOpen();
}
function CloseCircle(hide) {
    if(hide) board.execute("circle.hide()");
    circleOpen = false;
    menuClose();
}

// // //
mp.events.add('circleCallback', (index) => {
    if (index == -1) {
        CloseCircle(false);
    } else {
        CloseCircle(false);

        switch (circleTitle) {
            case "Машина":
                switch (index) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        if (entity == null) return;
                        mp.events.callRemote('vehicleSelected', entity, index);
                        return;
                }
                return;
            case "Игрок":
                if (entity == null) return;
                switch (index) {
                    case 0:
                        mp.events.callRemote('pSelected', entity, "Передать деньги");
                        return;
                    case 1:
                        mp.events.callRemote('pSelected', entity, "Предложить обмен");
                        return;
                    case 2:
                        if (pFraction === 0 || pFraction === 15) return;
                        OpenCircle("Фракция", pFraction);
                        return;
                    case 3:
                        //mp.gui.chat.push(">>" + entity);
                        mp.events.callRemote('passport', entity);
                        return;
                    case 4:
                        //mp.gui.chat.push(">>" + entity);
                        mp.events.callRemote('licenses', entity);
                        return;
                    case 5:
                        mp.events.callRemote('pSelected', entity, "Вылечить");
                        return;
                    case 6:
                        OpenCircle("Дом", 0);
                        return;
                    case 7:
                        mp.events.callRemote('pSelected', entity, "Пожать руку");
                        return;
                }
                return;
            case "Дом":
                switch (index) {
                    case 0:
                        mp.events.callRemote('pSelected', entity, "Продать машину");
                        return;
                    case 1:
                        mp.events.callRemote('pSelected', entity, "Продать дом");
                        return;
                    case 2:
                        mp.events.callRemote('pSelected', entity, "Заселить в дом");
                        return;
                    case 3:
                        mp.events.callRemote('pSelected', entity, "Пригласить в дом");
                        return;
                }
                return;
            case "Мебель":
                if (entity == null) return;
                switch (index) {
                    case 0:
                        mp.events.callRemote('furnSelected', entity._furnid, "Открыть инвентарь");
                        return;
                    case 1:
                        mp.events.callRemote('furnSelected', entity._furnid, "Открыть/Закрыть");
                        return;
                    case 2:
                        mp.events.callRemote('furnSelected', entity._furnid, "Переставить");
                        return;
                    case 3:
                        mp.events.callRemote('furnSelected', entity._furnid, "Убрать");
                        return;
                }
                return;
            case "Фракция":
                if (entity == null) return;
                circleEntity = entity;
                if (fractionActions[pFraction] == undefined) return;
                mp.events.callRemote('pSelected', entity, fractionActions[pFraction][index]);
                return;
            case "Категории":
                if (localplayer.isFalling()) return;
                if (index == 7) {
                    mp.events.callRemote('aSelected', -1, -1);
                    return;
                }
                switch (index) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                        aCategory = index;
                        OpenCircle("Анимации 1", index);
                        return;
                }
                return;
            case "Анимации 1":
                if (localplayer.isFalling()) return;
                if (index == 7)
                    OpenCircle("Анимации 2", aCategory);
                else
                    mp.events.callRemote('aSelected', aCategory, index);
                return;
            case "Анимации 2":
                if (localplayer.isFalling()) return;
                mp.events.callRemote('aSelected', aCategory, index + 7);
                return;
        }
    }
});

var aCategory = -1;

// // //
var pFraction = 0;
var fractionActions = [];
fractionActions[1] = ["Ограбить"];
fractionActions[2] = ["Ограбить"];
fractionActions[3] = ["Ограбить"];
fractionActions[4] = ["Ограбить"];
fractionActions[5] = ["Ограбить"];
fractionActions[6] = ["Вести за собой"];
fractionActions[7] = ["Вести за собой", "Обыскать", "Изъять оружие", "Изъять нелегал", "Сорвать маску", "Выписать штраф"];
fractionActions[8] = ["Продать аптечку", "Предложить лечение"];
fractionActions[9] = ["Вести за собой", "Обыскать", "Изъять оружие", "Изъять нелегал", "Сорвать маску"];
fractionActions[10] = ["Вести за собой", "Мешок", "Ограбить"];
fractionActions[11] = ["Вести за собой", "Мешок", "Ограбить"];
fractionActions[12] = ["Вести за собой", "Мешок", "Ограбить"];
fractionActions[13] = ["Вести за собой", "Мешок", "Ограбить"];
fractionActions[14] = ["Вести за собой"];
mp.events.add('fractionChange', (fraction) => {
    pFraction = fraction;
});