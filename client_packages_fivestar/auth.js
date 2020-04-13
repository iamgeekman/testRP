var cam = mp.cameras.new('default', new mp.Vector3(-95, 19, 1182), new mp.Vector3(0, 0, 0), 70);
cam.pointAtCoord(-95, 19, 0);
cam.setActive(true);
mp.game.cam.renderScriptCams(true, false, 0, true, false);

var respawn = mp.browsers["new"]('package://cef/respawn.html');
var auth = mp.browsers["new"]('package://cef/auth.html');
mp.gui.cursor.visible = true;

var lastButAuth = 0;
var lastButSlots = 0;

// events from cef
mp.events.add('signin', function (authData) {
    if (new Date().getTime() - lastButAuth < 3000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButAuth = new Date().getTime();

    authData = JSON.parse(authData);

    var username = authData['entry-login'],
        pass = authData['entry-password'];
        // check = authData['remember-me'];

    mp.events.callRemote('signin', username, pass)
});

mp.events.add('signup', function (regData) {
    if (new Date().getTime() - lastButAuth < 3000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButAuth = new Date().getTime();

    regData = JSON.parse(regData);
    var username = regData['new-user__login'],
        email = regData['new-user__email'],
        promo = regData['new-user__promo-code'],
        pass1 = regData['new-user__pw'],
        pass2 = regData['new-user__pw-repeat'];

    if (checkLgin(username) || username.length > 50) {
        mp.events.call('notify', 1, 9, 'Логин не соответствует формату или слишком длинный!', 3000);
        return;
    }

    if (pass1 != pass2 || pass1.length < 3) {
        mp.events.call('notify', 1, 9, 'Ошибка при вводе пароля!', 3000);
        return;
    }

    mp.events.callRemote('signup', username, pass1, email, promo);
});

mp.events.add('selectChar', function (slot) {
    if (new Date().getTime() - lastButSlots < 3000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButSlots = new Date().getTime();

    mp.events.callRemote('selectchar', slot);
});

mp.events.add('newChar', function (slot, name, lastname) {
    if (checkName(name) || name.length > 25) {
        mp.events.call('notify', 1, 9, 'Имя не соответствует формату или слишком длинное!', 3000);
        return;
    }

    if (checkName(lastname) || name.length > 25) {
        mp.events.call('notify', 1, 9, 'Фамилия не соответствует формату или слишком длинное!', 3000);
        return;
    }

    if (new Date().getTime() - lastButSlots < 3000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButSlots = new Date().getTime();

    mp.events.callRemote('newchar', slot, name, lastname);
});

mp.events.add('delChar', function (slot, name, lastname, pass) {
    if (checkName(name) || name.length > 25) {
        mp.events.call('notify', 1, 9, 'Имя не соответствует формату или слишком длинное!', 3000);
        return;
    }

    if (checkName(lastname) || name.length > 25) {
        mp.events.call('notify', 1, 9, 'Фамилия не соответствует формату или слишком длинное!', 3000);
        return;
    }

    if (new Date().getTime() - lastButSlots < 3000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButSlots = new Date().getTime();

    mp.events.callRemote('delchar', slot, name, lastname, pass);
});

mp.events.add('transferChar', function (slot, name, lastname, pass) {
    if (checkName(name)) {
        mp.events.call('notify', 1, 9, 'Имя не соответствует формату или слишком длинное!', 3000);
        return;
    }

    if (checkName(lastname)) {
        mp.events.call('notify', 1, 9, 'Фамилия не соответствует формату или слишком длинное!', 3000);
        return;
    }

    if (new Date().getTime() - lastButSlots < 3000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButSlots = new Date().getTime();

    mp.events.callRemote('transferchar', slot, name, lastname, pass);
});

mp.events.add('spawn', function (data) {
    if (new Date().getTime() - lastButSlots < 1000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButSlots = new Date().getTime();

    mp.events.callRemote('spawn', data);
});

mp.events.add('buyNewSlot', function (data) {
    if (new Date().getTime() - lastButSlots < 3000) {
        mp.events.call('notify', 4, 9, "Слишком быстро", 3000);
        return;
    }
    lastButSlots = new Date().getTime();

    mp.events.callRemote('donate', 8, data);
});

// events from server
mp.events.add('delCharSuccess', function (data) {
    auth.execute(`delchar(${data})`);
});

mp.events.add('unlockSlot', function (data) {
    auth.execute(`unlockSlot(${data})`);
});

mp.events.add('toslots', function (data) {
    auth.execute(`toslots('${data}')`);
});

mp.events.add('spawnShow', function (data) {
    if (data === false) {
        if (respawn != null) {
            respawn.destroy();
            respawn = null;
        }
    }
    else {
        respawn.execute(`set('${data}')`);
    }

    if (auth != null) {
        auth.destroy();
        auth = null;
    }
});

mp.events.add('ready', function () {
    global.loggedin = true;
    global.menuClose();
;
    mp.game.cam.renderScriptCams(false, true, 3000, true, true);

    mp.events.call('showHUD', true);
    mp.events.call('hideTun');
    mp.game.player.setHealthRechargeMultiplier(0);

    global.menu = mp.browsers["new"]('package://cef/menu.html');
    global.helpmenu = mp.browsers["new"]('package://cef/help.html');

    if (respawn != null) {
        respawn.destroy();
        respawn = null;
    }

    if (auth != null) {
        auth.destroy();
        auth = null;
    }
});

function checkLgin(str) {
    return !(/^[a-zA-Z1-9]*$/g.test(str));
}

function checkName(str) {
    return !(/^[a-zA-Z]*$/g.test(str));
}

mp.events.add('authNotify', (type, layout, msg, time) => {
    auth.execute(`notify(${type},${layout},'${msg}',${time})`);
});