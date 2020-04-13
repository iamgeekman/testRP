var lengine = false;
var ldoors = true;
var lspeed = 0;
var fuel = 0;
var hpveh = 100;
var inVeh = false;
var cruiseSpeed = -1;
var lastExec = ``;
var lcall = 0;
var lonline = 0;

// CRUISE CONTROL //
var cruiseLastPressed = 0;
mp.keys.bind(0x36, false, function () { // 5 key - cruise mode on/off
    if (!loggedin || global.chatActive || editing || global.menuOpened) return;
    if (!localplayer.isInAnyVehicle(true) || localplayer.vehicle.getPedInSeat(-1) != localPlayer.handle) return;

    if (new Date().getTime() - cruiseLastPressed < 300) {
        mp.events.call('openInput', 'Круиз-контроль', 'Укажите скорость в км/ч', 3, 'setCruise');
    }
    else {
        var veh = localplayer.vehicle;
        if (cruiseSpeed == -1) {
            var vspeed = veh.getSpeed();
            if (vspeed > 1) {
                veh.setMaxSpeed(vspeed);
                mp.gui.execute(`HUD.cruiseColor='#eebe00'`);
                cruiseSpeed = vspeed;
            }
        }
        else {
            cruiseSpeed = -1;
            veh.setMaxSpeed(mp.game.vehicle.getVehicleModelMaxSpeed(veh.model));
            mp.gui.execute(`HUD.cruiseColor='#ffffff'`);
        }
    }
    cruiseLastPressed = new Date().getTime();
});
mp.events.add('setCruiseSpeed', function (speed) {
    speed = parseInt(speed);
    if (speed === NaN || speed < 1) return;
    if (!localplayer.isInAnyVehicle(true) || localplayer.vehicle.getPedInSeat(-1) != localPlayer.handle) return;

    speed = speed / 3.6; // convert from kph to mps
    var veh = localplayer.vehicle;
    var maxSpeed = mp.game.vehicle.getVehicleModelMaxSpeed(veh.model);
    if (speed > maxSpeed) speed = maxSpeed;
    veh.setMaxSpeed(speed);
    mp.gui.execute(`HUD.cruiseColor='#eebe00'`);
    cruiseSpeed = speed;
});
// // // // // // //

mp.events.add('notify', (type, layout, msg, time) => {
    if (global.loggedin)
        mp.gui.execute(`notify(${type},${layout},'${msg}',${time})`);
    else
        mp.events.call('authNotify', type, layout, msg, time)
});
mp.events.add('UpdateMoney', function (temp, amount) {
    mp.gui.execute(`HUD.money=${temp}`);
});
mp.events.add('UpdateBank', function (temp, amount) {
    mp.gui.execute(`HUD.bank=${temp}`);
});

mp.events.add('setWanted', function (lvl) {
    mp.game.gameplay.setFakeWantedLevel(lvl);
});

var passports = {};
mp.events.add('newPassport', function (player, pass) {
    if (player && mp.players.exists(player))
        passports[player.name] = pass;
});

mp.events.add('newFriend', function (player, pass) {
    if (player && mp.players.exists(player)) {
        mp.storage.data.friends[player.name] = true;
        mp.storage.flush();
    }
});

var showAltTabHint = false;
mp.events.add('showAltTabHint', function () {
    showAltTabHint = true;
    setTimeout(function () { showAltTabHint = false; }, 10000);
});

const maxDistance = 20 * 20; // Дистанция, с которой будут отображаться ники
const width = 0.03; // Ширина
const height = 0.0050; // Высота
const border = 0.001; // Обвока
const muted = [255, 255, 255, 255]; // Цвета
const speak = [255, 0, 0, 255];

mp.nametags.enabled = false;

const scalable = (dist, maxDist) => {
    return Math.max(0.1, 1 - (dist / maxDist));
}
mp.events.add('sendRPMessage', (type, msg, players) => {

    var chatcolor = ``;

    players.forEach((id) => {
        var player = mp.players.atRemoteId(id);
        if (mp.players.exists(player)) {

            if (type === "chat" || type === "s") {
                let localPos = localPlayer.position;
                let playerPos = player.position;
                let dist = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, localPos.x, localPos.y, localPos.z);
                var color = (dist < 2) ? "FFFFFF" :
                    (dist < 4) ? "F7F9F9" :
                        (dist < 6) ? "DEE0E0" :
                            (dist < 8) ? "C5C7C7" : "ACAEAE";

                chatcolor = color;
            }

            var name = (player === localPlayer || localPlayer.getVariable('IS_ADMIN') == true || passports[player.name] != undefined || mp.storage.data.friends[player.name] != undefined) ? `${player.name.replace("_", " ")} (${player.getVariable('REMOTE_ID')})` : `Игрок (${id})`;
            msg = msg.replace("{name}", name);
        }
    });

    if (type === "chat" || type === "s")
        msg = `!{#${chatcolor}}${msg}`;

    mp.gui.chat.push(msg);
});

var showNames = false;
mp.keys.bind(0x35, false, () => {
    if (!loggedin || global.chatActive || editing || global.menuOpened) return;
    showNames = !showNames;
});
mp.events.add('render', (nametags) => {
    if (!global.loggedin) return;

    const graphics = mp.game.graphics;
    const screenRes = graphics.getScreenResolution(0, 0);

    if (localPlayer.getVariable('IS_ADMIN') == true) {
        mp.players.forEach(
            (player, id) => {
                if (mp.game.player.isFreeAimingAtEntity(player.handle))
                    graphics.drawText(player.name + ` (${player.getVariable('REMOTE_ID')})`, [0.5, 0.8], {
                        font: 4,
                        color: [255, 255, 255, 235],
                        scale: [0.5, 0.5],
                        outline: true
                    });
            }
        );
    }

    if (mp.players.length != lonline) {
        lonline = mp.players.length;
        mp.gui.execute(`WaterMark.online=${lonline}`);
    }

    if (showNames) {
        nametags.forEach(nametag => {
            let [player, x, y, distance] = nametag;

            if (distance <= maxDistance && player.getVariable('INVISIBLE') != true) {
                const pos = player.getBoneCoords(12844, 0.5, 0, 0);

                var passportText = '';
                if (passports[player.name] != undefined) passportText = ` | ${passports[player.name]}`;
                var text = (localPlayer.getVariable('IS_ADMIN') === true || mp.storage.data.friends[player.name] != undefined || passports[player.name] != undefined) ? `\n${player.name} (${player.getVariable('REMOTE_ID')}${passportText})`
                        : `ID: ${player.getVariable('REMOTE_ID')}`;

                if (localPlayer.getVariable('fraction') != null && player.getVariable('fraction') != null && localPlayer.getVariable('fraction') === player.getVariable('fraction'))
                    text = `\n${player.name} (${player.getVariable('REMOTE_ID')}${passportText})`;

                var color = (player.getVariable('REDNAME') === true) ? [255, 0, 0, 255] : [255, 255, 255, 255];
                graphics.drawText(text, [pos.x, pos.y, pos.z], {
                    font: 4,
                    color: color,
                    scale: [0.35, 0.35],
                    outline: true
                });

                if (mp.game.player.isFreeAimingAtEntity(player.handle)) {
                    let y2 = y + 0.042;
                    let health = player.getHealth();
                    health = (health <= 100) ? (health / 100) : ((health - 100) / 100);

                    let armour = player.getArmour() / 100;
                    if (armour > 0) {
                        graphics.drawRect(x, y2, width + border * 2, height + border * 2, 0, 0, 0, 200);
                        graphics.drawRect(x, y2, width, height, 150, 150, 150, 255);
                        graphics.drawRect(x - width / 2 * (1 - health), y2, width * health, height, 255, 255, 255, 200);

                        y -= 0.007;
                        y2 -= 0.007;

                        graphics.drawRect(x, y2, width + border * 2, height + border * 2, 0, 0, 0, 200);
                        graphics.drawRect(x, y2, width, height, 41, 66, 78, 255);
                        graphics.drawRect(x - width / 2 * (1 - armour), y2, width * armour, height, 48, 108, 135, 200);
                    }
                    else {
                        graphics.drawRect(x, y2, width + border * 2, height + border * 2, 0, 0, 0, 200);
                        graphics.drawRect(x, y2, width, height, 150, 150, 150, 255);
                        graphics.drawRect(x - width / 2 * (1 - health), y2, width * health, height, 255, 255, 255, 200);
                    }
                }
            }
        })
    }

    mp.game.ui.hideHudComponentThisFrame(22);
    mp.game.ui.hideHudComponentThisFrame(19);
    mp.game.ui.hideHudComponentThisFrame(20);
    mp.game.ui.hideHudComponentThisFrame(3);
    mp.game.ui.hideHudComponentThisFrame(2);

    if (localplayer.isInAnyVehicle(false)) {
        if (!inVeh) mp.gui.execute(`HUD.inVeh=1`);
        inVeh = true;

        var veh = localplayer.vehicle;

        if (veh.getVariable('FUELTANK') !== undefined) {
            let fueltank = veh.getVariable('FUELTANK');
            graphics.drawText(`Загружено: ${fueltank}/1000л`, [0.93, 0.80], {
                font: 0,
                color: [255, 255, 255, 185],
                scale: [0.4, 0.4],
                outline: true
            });
        }

        if (veh.getVariable('PETROL') !== undefined && veh.getVariable('MAXPETROL') !== undefined) {
            let petrol = veh.getVariable('PETROL');
            let maxpetrol = veh.getVariable('MAXPETROL');

            if (fuel != petrol && petrol >= 0) {
                mp.gui.execute(`HUD.fuel=${petrol}`);
                fuel = petrol;
                
                if (petrol <= (maxpetrol * 0.2)) ifuel = 0;
                else if (petrol <= (maxpetrol * 0.6)) ifuel = 1;
                else ifuel = 2;
                mp.gui.execute(`HUD.ifuel=${ifuel}`);
            }
        }

        var engine = veh.getIsEngineRunning();
        if (engine != null && engine !== lengine) {
            if (engine == true) mp.gui.execute(`HUD.engine=1`);
            else mp.gui.execute(`HUD.engine=0`);

            lengine = engine;
        }

        if (veh.getVariable('LOCKED') !== undefined) {
            var locked = veh.getVariable('LOCKED');
            if (ldoors !== locked) {
                if (locked == true) mp.gui.execute(`HUD.doors=0`);
                else mp.gui.execute(`HUD.doors=1`)

                ldoors = locked;
            }
        }

        var hp = veh.getHealth() / 10;
        hp = hp.toFixed();
        if (hp !== hpveh) {
            mp.gui.execute(`HUD.hp=${hp}`);
            hpveh = hp;
        }

        if (new Date().getTime() - lcall > 350) {
            let speed = (veh.getSpeed() * 3.6).toFixed();
            mp.gui.execute(`HUD.speed=${speed}`);
            lcall = new Date().getTime();

            if (cruiseSpeed != -1) // kostyl'
                veh.setMaxSpeed(cruiseSpeed);
        }
    } else {
        if (inVeh) mp.gui.execute(`HUD.inVeh=0`);
        inVeh = false;
    }
});

function two(num) { return ("0" + num).slice(-2); } 

global.showhud = true;
var showHint = true;
mp.keys.bind(0x74, false, function () {
    if (global.menuOpened || editing) return;

    if (global.showhud && showHint) {
        showHint = false;
        mp.gui.execute(`hidehelp(${!showHint})`);
    }
    else if (global.showhud) {
        global.showhud = !global.showhud;
        mp.events.call('showHUD', global.showhud);
    }
    else {
        showHint = true;
        mp.gui.execute(`hidehelp(${!showHint})`);
        global.showhud = !global.showhud;
        mp.events.call('showHUD', global.showhud);
    }
});
mp.events.add('showHUD', (show) => {
    global.showhud = show;
    if (!show) mp.gui.execute(`hidehelp(${!showhud})`);
    else if (show && showHint) mp.gui.execute(`hidehelp(${!showhud})`);
    mp.gui.execute(`hidehud(${!showhud})`);
    mp.game.ui.displayAreaName(showhud);
    mp.game.ui.displayRadar(showhud);
    mp.game.ui.displayHud(showhud);
    mp.gui.chat.show(showhud);
})