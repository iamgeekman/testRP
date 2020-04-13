global.debounceEvent = (ms, triggerCouns, fn) => {
    let g_swapDate = Date.now();
    let g_triggersCount = 0;

    return (...args) => {
        if (++g_triggersCount > triggerCouns) {
            let currentDate = Date.now();

            if ((currentDate - g_swapDate) > ms) {
                g_swapDate = currentDate;
                g_triggersCount = 0;
            } else {
                return true; // cancel event trigger
            }
        }

        fn(...args);
    };
};

global.chatActive = false;
global.loggedin = false;
mp.gui.execute("window.location = 'package://cef/hud.html'");
if (mp.storage.data.chatcfg == undefined) {
    mp.storage.data.chatcfg = {
        timestamp: 0,
        chatsize: 0,
        fontstep: 0,
        alpha: 1
    };
    mp.storage.flush();
}
setTimeout(function () {
    mp.gui.execute(`newcfg(0,${mp.storage.data.chatcfg.timestamp}); newcfg(1,${mp.storage.data.chatcfg.chatsize}); newcfg(2,${mp.storage.data.chatcfg.fontstep}); newcfg(3,${mp.storage.data.chatcfg.alpha});`);
    mp.events.call('showHUD', false);
}, 1000);
setInterval(function () {
    var name = (localPlayer.getVariable('REMOTE_ID') == undefined) ? `Не авторизован` : `Игрок №${localPlayer.getVariable("REMOTE_ID")}`;
    mp.discord.update('gtafivestar.ru RolePlay', name);
}, 10000);

mp.events.add('chatconfig', function (a, b) {
    if (a == 0) mp.storage.data.chatcfg.timestamp = b;
    else if (a == 1) mp.storage.data.chatcfg.chatsize = b;
    else if (a == 2) mp.storage.data.chatcfg.fontstep = b;
    else mp.storage.data.chatcfg.alpha = b;
    mp.storage.flush();
});

mp.events.add('setDoorLocked', function (model, x, y, z, locked, angle) {
    mp.game.object.doorControl(model, x, y, z, locked, 0, 0, angle);
});
mp.events.add('changeChatState', function (state) {
    chatActive = state;
});
global.NativeUI = require("nativeui.js");
// // // // // // //
require('menus.js');
require('lscustoms.js');
require('character.js');
require('render.js');
require('main.js');

//require('voip.js');
require('nvoip.js');

require('phone.js');
require('checkpoints.js');
require('board.js');
require('hud.js');
require('furniture.js');
require('circle.js');
require('vehiclesync.js');
require('basicsync.js');
require('gangzones.js');
require('fly.js');
require('environment.js');
require('elections.js');
require('radiosync.js');

require('configs/tattoo.js');
require('configs/barber.js');
require('configs/clothes.js');
require('configs/natives.js');
require('configs/tuning.js');

require('fingerPointer.js')

// // // // // // //

if (mp.storage.data.friends == undefined) {
    mp.storage.data.friends = {};
    mp.storage.flush();
}

// // // // // // //
const mSP = 30;
var prevP = mp.players.local.position;
var localWeapons = {};

function distAnalyze() {
    let temp = mp.players.local.position;
    let dist = mp.game.gameplay.getDistanceBetweenCoords(prevP.x, prevP.y, prevP.z, temp.x, temp.y, temp.z, true);
    prevP = mp.players.local.position;
    if (mp.players.local.isInAnyVehicle(true)) return;
    if (dist > mSP) {
        mp.events.callRemote("acd", "fly");
    }
}
global.acheat = {
    pos: () => prevP = mp.players.local.position,
    guns: () => localWeapons = playerLocal.getAllWeapons(),
    start: () => {
        setInterval(distAnalyze, 2000);
    }
}

mp.events.add('authready', () => {
    require('auth.js');
})

mp.events.add('acpos', () => {
    global.acheat.pos();
})
// // // // // // //
const localPlayer = mp.players.local;
//mp.game.invoke(getNative("REMOVE_ALL_PED_WEAPONS"), localPlayer.handle, false);

mp.keys.bind(0x52, false, function () { // R key
    if (!loggedin || chatActive || new Date().getTime() - global.lastCheck < 1000) return;
    var current = currentWeapon();
    if (current == -1569615261 || current == 911657153) return;
    var ammo = mp.game.invoke(getNative("GET_AMMO_IN_PED_WEAPON"), localPlayer.handle, current);

    if (mp.game.weapon.getWeaponClipSize(current) == ammo) return;
    mp.events.callRemote("playerReload", current, ammo);
    global.lastCheck = new Date().getTime();
});

mp.keys.bind(0x31, false, function () { // 1 key
    if (!loggedin || chatActive || new Date().getTime() - global.lastCheck < 1000 || global.menuOpened) return;
    mp.events.callRemote('changeweap', 1);
    global.lastCheck = new Date().getTime();
});

mp.keys.bind(0x32, false, function () { // 2 key
    if (!loggedin || chatActive || new Date().getTime() - global.lastCheck < 1000 || global.menuOpened) return;
    mp.events.callRemote('changeweap', 2);
    global.lastCheck = new Date().getTime();
});

mp.keys.bind(0x33, false, function () { // 3 key
    if (!loggedin || chatActive || new Date().getTime() - global.lastCheck < 1000 || global.menuOpened) return;
    mp.events.callRemote('changeweap', 3);
    global.lastCheck = new Date().getTime();
});

var givenWeapon = -1569615261;
const currentWeapon = () => mp.game.invoke(getNative("GET_SELECTED_PED_WEAPON"), localPlayer.handle);
mp.events.add('wgive', (weaponHash, ammo, isReload, equipNow) => {
    weaponHash = parseInt(weaponHash);
    ammo = parseInt(ammo);
    ammo = ammo >= 9999 ? 9999 : ammo;
    givenWeapon = weaponHash;
    ammo += mp.game.invoke(getNative("GET_AMMO_IN_PED_WEAPON"), localPlayer.handle, weaponHash);
    mp.game.invoke(getNative("SET_PED_AMMO"), localPlayer.handle, weaponHash, 0);
    mp.gui.execute(`HUD.ammo=${ammo};`);
    // GIVE_WEAPON_TO_PED //
    mp.game.invoke(getNative("GIVE_WEAPON_TO_PED"), localPlayer.handle, weaponHash, ammo, false, equipNow);

    if (isReload) {
        mp.game.invoke(getNative("MAKE_PED_RELOAD"), localPlayer.handle);
    }
});
mp.events.add('takeOffWeapon', (weaponHash) => {
    try {
        weaponHash = parseInt(weaponHash);
        var ammo = mp.game.invoke(getNative("GET_AMMO_IN_PED_WEAPON"), localPlayer.handle, weaponHash);
        mp.events.callRemote('playerTakeoffWeapon', weaponHash, ammo);
        mp.game.invoke(getNative("SET_PED_AMMO"), localPlayer.handle, weaponHash, 0);
        mp.game.invoke(getNative("REMOVE_WEAPON_FROM_PED"), localPlayer.handle, weaponHash);
        givenWeapon = -1569615261;
        mp.gui.execute(`HUD.ammo=0;`);
    } catch (e) { }
});
mp.events.add('serverTakeOffWeapon', (weaponHash) => {
    try {
        weaponHash = parseInt(weaponHash);
        var ammo = mp.game.invoke(getNative("GET_AMMO_IN_PED_WEAPON"), localPlayer.handle, weaponHash);
        mp.events.callRemote('takeoffWeapon', weaponHash, ammo);
        mp.game.invoke(getNative("SET_PED_AMMO"), localPlayer.handle, weaponHash, 0);
        mp.game.invoke(getNative("REMOVE_WEAPON_FROM_PED"), localPlayer.handle, weaponHash);
        givenWeapon = -1569615261;
        mp.gui.execute(`HUD.ammo=0;`);
    } catch (e) { }
});
var checkTimer = setInterval(function () {
    var current = currentWeapon();
    if (localplayer.isInAnyVehicle(true)) {
        var vehicle = localPlayer.vehicle;
        if (vehicle == null) return;

        if (vehicle.getClass() == 15) {
            if (vehicle.getPedInSeat(-1) == localPlayer.handle || vehicle.getPedInSeat(0) == localPlayer.handle) return;
        }
        else {
            if (canUseInCar.indexOf(current) == -1) return;
        }
    }

    if (currentWeapon() != givenWeapon) {
        mp.game.invoke(getNative("GIVE_WEAPON_TO_PED"), localPlayer.handle, givenWeapon, 1, false, true);
        mp.game.invoke(getNative("SET_PED_AMMO"), localPlayer.handle, givenWeapon, 0);
        localPlayer.taskReloadWeapon(false);
        localPlayer.taskSwapWeapon(false);
        mp.gui.execute(`HUD.ammo=0;`);
    }
}, 100);
var canUseInCar = [
    453432689,
    1593441988,
    -1716589765,
    -1076751822,
    -771403250,
    137902532,
    -598887786,
    -1045183535,
    584646201,
    1198879012,
    324215364,
    -619010992,
    -1121678507,
];
mp.events.add('playerWeaponShot', (targetPosition, targetEntity) => {
    var current = currentWeapon();
    var ammo = mp.game.invoke(getNative("GET_AMMO_IN_PED_WEAPON"), localPlayer.handle, current);
    mp.gui.execute(`HUD.ammo=${ammo};`);

    if (ammo <= 0) {
        localPlayer.taskSwapWeapon(false);
        mp.gui.execute(`HUD.ammo=0;`);
    }
});
mp.events.add('render', () => {
    try {
        mp.game.controls.disableControlAction(2, 45, true); // reload control
        //localPlayer.setCanSwitchWeapon(false);

        //     weapon switch controls       //
        mp.game.controls.disableControlAction(2, 12, true);
        mp.game.controls.disableControlAction(2, 13, true);
        mp.game.controls.disableControlAction(2, 14, true);
        mp.game.controls.disableControlAction(2, 15, true);
        mp.game.controls.disableControlAction(2, 16, true);
        mp.game.controls.disableControlAction(2, 17, true);

        mp.game.controls.disableControlAction(2, 37, true);
        mp.game.controls.disableControlAction(2, 99, true);
        mp.game.controls.disableControlAction(2, 100, true);

        mp.game.controls.disableControlAction(2, 157, true);
        mp.game.controls.disableControlAction(2, 158, true);
        mp.game.controls.disableControlAction(2, 159, true);
        mp.game.controls.disableControlAction(2, 160, true);
        mp.game.controls.disableControlAction(2, 161, true);
        mp.game.controls.disableControlAction(2, 162, true);
        mp.game.controls.disableControlAction(2, 163, true);
        mp.game.controls.disableControlAction(2, 164, true);
        mp.game.controls.disableControlAction(2, 165, true);

        mp.game.controls.disableControlAction(2, 261, true);
        mp.game.controls.disableControlAction(2, 262, true);
        //      weapon switch controls       //

        if (currentWeapon() != -1569615261) { // heavy attack controls
            mp.game.controls.disableControlAction(2, 140, true);
            mp.game.controls.disableControlAction(2, 141, true);
            mp.game.controls.disableControlAction(2, 143, true);
            mp.game.controls.disableControlAction(2, 263, true);
        }
    } catch (e) { }
});
mp.events.add("playerDeath", function (player, reason, killer) {
    givenWeapon = -1569615261;
});
mp.events.add("removeAllWeapons", function () {
    givenWeapon = -1569615261;
});

mp.events.add('svem', (pm, tm) => {
    var vehc = mp.players.local.vehicle;
    vehc.setEnginePowerMultiplier(pm);
    vehc.setEngineTorqueMultiplier(tm);
});

mp.game.player.setMeleeWeaponDefenseModifier(0.25);
mp.game.player.setWeaponDefenseModifier(1.7);
global.nowResistStage = 0;
global.resistStages = {
    0: 0.0,
    1: 0.15,
    2: 0.25,
    3: 0.35,
};
mp.events.add("setResistStage", function (stage) {
    nowResistStage = stage;
    mp.game.player.setMeleeWeaponDefenseModifier(0.25 - (0.25 * resistStages[stage]));
    mp.game.player.setWeaponDefenseModifier(1.7 - (1.7 * resistStages[stage]));
});

/////////////
// let g_swapDate = Date.now();
// let g_triggersCount = 0;

// mp._events.add("cefTrigger", (eventName) => {
//     if (++g_triggersCount > 5) {
//         let currentDate = Date.now();

//         if ((currentDate - g_swapDate) > 1000) {
//             g_swapDate = currentDate;
//             g_triggersCount = 0;
//         }
//         else {
//             return true; // cancel event trigger
//         }
//     }
// });