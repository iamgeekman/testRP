const voiceBrowser = mp.browsers.new(`https://s4.gta5star.ru`);

const emit = (eventName, ...args) => {

    let argumentsString = '';

    for (const arg of args) {
        switch (typeof arg) {
            case 'string': {
                argumentsString += `'${arg}', `;
                break;
            }
            case 'number':
            case 'boolean': {
                argumentsString += `${arg}, `;
                break;
            }
            case 'object': {
                argumentsString += `${JSON.stringify(arg)}, `;
                break;
            }
        }
    }

    voiceBrowser.execute(`typeof mp.events !== 'undefined' && mp.events.call('${eventName}', ${argumentsString})`);
};

const __CONFIG__ = {
    pushToTalkKey: 78,
    defaultDistance: 25,
    token: '',
    isTokenSecurity: true,
    prefixId: '_super_voice',
    receivingTokenEventName: 'vtoken',
    sendDataProximityInterval: 500,
    debug: false,
    smoothTransitionRate: 0.09
};

const __STORAGE__ = {
    browserReady: false,
    lastSendingProximityEvent: Date.now(),
    enabledMicrophone: false,
    mutedMicrophone: false,
    currentConnectedPlayers: new Set(),
    queueRequestPeers: new Map(),
    stateVoiceConnection: 'closed',
    streamedPlayers: new Set(),
    virtualStreamedPlayers: new Set(),
    distance: __CONFIG__.defaultDistance,
    globalPeers: new Set(),
    proximityPeers: new Set()
};

const localPlayer = mp.players.local;
const gameplayCam = mp.cameras.new('gameplay');

mp.events.add({
    'entityStreamIn': (entity) => {
        if (entity.type === 'player') {
            __STORAGE__.streamedPlayers.add(entity);
        }
    },
    'entityStreamOut': (entity) => {
        if (entity.type === 'player') {
            __STORAGE__.streamedPlayers.delete(entity);
        }

        mp.events.call('c.entityStreamOut', entity, 'streamOut');

        if (__STORAGE__.virtualStreamedPlayers.has(entity)) {
            __STORAGE__.virtualStreamedPlayers.delete(entity);
            mp.events.call('c.virtualStreamOut', entity, 'streamOut');
        }
    },
    'playerQuit': (player) => {
        mp.events.call('c.entityStreamOut', player, 'quit');
        __STORAGE__.streamedPlayers.delete(player);

        if (__STORAGE__.virtualStreamedPlayers.has(player)) {
            __STORAGE__.virtualStreamedPlayers.delete(player);
            mp.events.call('c.virtualStreamOut', player, 'quit');
        }
    },
    'render': () => { // TODO: will be remove after 0.4
        const localPlayerDimension = mp.players.local.dimension;
        const localPlayerPosition = mp.players.local.position;
        const localPlayerHandle = mp.players.local.handle;

        mp.players.forEachInStreamRange(player => {
            if (!__STORAGE__.streamedPlayers.has(player) && player.handle !== 0 && localPlayerHandle !== player.handle) {
                mp.events.call('entityStreamIn', player);
            }
        });

        __STORAGE__.streamedPlayers.forEach(_player => {
            const isInVirtualStream = __STORAGE__.virtualStreamedPlayers.has(_player);

            if (mp.players.exists(_player) && localPlayerDimension !== _player.dimension) {
                mp.events.call('c.entityStreamOut', _player, 'dimension');
                __STORAGE__.streamedPlayers.delete(_player);

                if (isInVirtualStream) {
                    __STORAGE__.virtualStreamedPlayers.delete(_player);
                    mp.events.call('c.virtualStreamOut', _player, 'dimension');
                }
                return;
            }

            const voiceDistance = clamp(3, 50, _player.getVariable('voice.distance') || __CONFIG__.defaultDistance);

            if (vdist(localPlayerPosition, _player.position) <= voiceDistance + (voiceDistance / 2)) {
                if (!isInVirtualStream) {
                    __STORAGE__.virtualStreamedPlayers.add(_player);
                    mp.events.call('c.virtualStreamIn', _player);
                }
            } else {
                if (isInVirtualStream) {
                    __STORAGE__.virtualStreamedPlayers.delete(_player);
                    mp.events.call('c.virtualStreamOut', _player, 'distance');
                }
            }
        });
    }
});

mp.events.add('browserDomReady', (browser) => {
    if (voiceBrowser === browser) {

        __STORAGE__.browserReady = true;

        if (__CONFIG__.isTokenSecurity && !__CONFIG__.token.length) {
            return false;
        }

        emit('init', `${localPlayer.remoteId}${__CONFIG__.prefixId}`, __CONFIG__.token, 'default', 1, false, false);
    }
});

mp.events.add(__CONFIG__.receivingTokenEventName, (token) => {
    __CONFIG__.token = token;

    if (__CONFIG__.isTokenSecurity && __STORAGE__.browserReady) {
        emit('init', `${localPlayer.remoteId}${__CONFIG__.prefixId}`, __CONFIG__.token, 'default', 1, false, false);
    }

});

mp.events.add('voice.requestMediaPeerResponse', (peerName, isSuccessful) => {
    if (!isSuccessful) {
        setTimeout(() => {
            try {
                const player = __STORAGE__.queueRequestPeers.get(peerName);

                if (__STORAGE__.virtualStreamedPlayers.has(player)) {
                    requestMediaPeer(player);
                    return true;
                }

                if (__STORAGE__.globalPeers.has(player)) {
                    requestMediaPeer(player, true, safeGetVoiceInfo(player, 'globalVolume'));
                    return true;
                }

            } catch (e) {
                mp.game.graphics.notify(`Voice error #0 - ${e.toString()}`);
            }
        }, 1000);
    } else {

        const player = mp.players.atRemoteId(getPlayerIdFromPeerId(peerName));

        if (__PHONE__.target === player) {
            __PHONE__.status = true;
        }

    }

    __STORAGE__.queueRequestPeers.delete(peerName);
});

const requestMediaPeer = (player, isGlobal = false, volume) => {
    const peerName = `${player.remoteId}${__CONFIG__.prefixId}`;

    if (!__STORAGE__.currentConnectedPlayers.has(player)) {
        emit('streamIn', peerName);
    }

    if (isGlobal) {
        __STORAGE__.globalPeers.add(player);
        safeSetVoiceInfo(player, 'globalVolume', volume);

        if (!__STORAGE__.virtualStreamedPlayers.has(player)) {
            safeSetVoiceInfo(player, 'stateChangeVolume', 'global');
        } else {
            safeSetVoiceInfo(player, 'stateChangeVolume', 'proximity');
        }

    } else {
        __STORAGE__.proximityPeers.add(player);
    }

    __STORAGE__.queueRequestPeers.set(peerName, player);
    __STORAGE__.currentConnectedPlayers.add(player);
};

mp.events.add('voice.changeStateConnection', (state) => {

    mp.events.callRemote('voice.changeStateConnection', state);

    if (state === 'connected') {
        __STORAGE__.virtualStreamedPlayers.forEach(player => {
            if (
                player.getVariable('voice.stateConnection') === 'connected' &&
                !__STORAGE__.currentConnectedPlayers.has(player)
            ) {
                requestMediaPeer(player);
            }
        });

        __RADIO__.queue.forEach(player => {
            const hasLocalPlayer = player === localPlayer;

            if (__PHONE__.target !== player && !hasLocalPlayer) {
                requestMediaPeer(player, true, 1);
            }

            if (!hasLocalPlayer) {
                mp.gui.chat.push(`Player connected to team ${__RADIO__.metaData.name}`);
            }

            __RADIO__.peers.add(player);
        });
    } else if (state === 'closed' || state === 'connecting') {
        __STORAGE__.currentConnectedPlayers.clear();
    }

    __STORAGE__.stateVoiceConnection = state;
});

mp.events.add('entityDataChange', (player, key, oldValue) => {

    const newValue = player.getVariable(key);

    if (player.type === 'player') {

        if (key === 'voice.stateConnection') {

            if (player !== localPlayer) {
                safeSetVoiceInfo(player, 'stateConnection', newValue);

                if (
                    newValue === 'connected' &&
                    __STORAGE__.stateVoiceConnection === 'connected' &&
                    __STORAGE__.virtualStreamedPlayers.has(player)
                ) {
                    requestMediaPeer(player);
                }
            }
        } else if (key === 'voice.muted') {
            if (player === localPlayer) {
                __STORAGE__.mutedMicrophone = newValue;

                if (!newValue) {
                    disableMicrophone();
                }
            } else {
                safeSetVoiceInfo(player, 'muted', newValue);
            }
        } else if (key === 'voice.distance') {
            if (player === localPlayer) {
                __STORAGE__.distance = clamp(3, 50, newValue);
            } else {
                safeSetVoiceInfo(player, 'distance', clamp(3, 50, newValue));
            }
        }
    }

});

mp.events.add('c.virtualStreamIn', (player) => {
    if (player.type === 'player') {

        if (typeof player.voice === 'undefined') {
            player.voice = {
                enabled: false,
                muted: false,
                volume: 0,
                balance: 0,
                globalVolume: 0,
                _volume: 0,
                stateConnection: 'connected',
                distance: __CONFIG__.defaultDistance,
                stateChangeVolume: 'proximity'
            };
        }

        if (
            __STORAGE__.stateVoiceConnection === 'connected' &&
            player.getVariable('voice.stateConnection') === 'connected'
        ) {
            requestMediaPeer(player);
        }

    }
});

mp.events.add('c.virtualStreamOut', (player, type) => {
    if (player.type !== 'player') {
        return false;
    }

    if (type === 'quit') {
        if (__STORAGE__.globalPeers.has(player)) {
            __STORAGE__.globalPeers.delete(player);
        }
    }

    requestCloseMediaPeer(player);
});

const __PHONE__ = {
    target: null,
    status: false
};

mp.events.add('voice.phoneCall', (target_1, target_2, volume) => {
    if (!__PHONE__.target) {

        let target = null;

        if (target_1 === localPlayer) {
            target = target_2;
        } else if (target_2 === localPlayer) {
            target = target_1;
        }

        __PHONE__.target = target;

        if (!__RADIO__.peers.has(__PHONE__.target)) {
            requestMediaPeer(target, true, volume);
        }
    }
});

mp.events.add('voice.phoneStop', () => {
    if (__PHONE__.target) {

        const __localPlayerPosition__ = localPlayer.position;

        if (mp.players.exists(__PHONE__.target)) {
            const __targetPosition__ = __PHONE__.target.position;
            const distance = mp.game.system.vdist(__localPlayerPosition__.x, __localPlayerPosition__.y, __localPlayerPosition__.z, __targetPosition__.x, __targetPosition__.y, __targetPosition__.z);

            if (!__RADIO__.peers.has(__PHONE__.target) && distance > 25) {
                requestCloseMediaPeer(__PHONE__.target, true);
            }
        } else {
            requestCloseMediaPeer(__PHONE__.target, true);
        }

        __PHONE__.status = false;
        __PHONE__.target = null;
    }
});

const __RADIO__ = {
    peers: new Set(),
    queue: new Set(),
    metaData: {}
};

mp.events.add('voice.radioConnect', (metaData, ...players) => {

    __RADIO__.metaData = metaData;

    if (__STORAGE__.stateVoiceConnection !== 'connected') {
        for (const player of players) {
            __RADIO__.queue.add(player);
        }
        return false;
    }

    for (const player of players) {

        const hasLocalPlayer = player === localPlayer;

        if (__PHONE__.target !== player && !hasLocalPlayer) {
            requestMediaPeer(player, true, 1);
        }

        if (!hasLocalPlayer) {
            mp.gui.chat.push(`Player connected to team ${__RADIO__.metaData.name}`);
        }

        __RADIO__.peers.add(player);
    }
});

mp.events.add('voice.radioDisconnect', (metaData, ...players) => {
    if (!players.length) {
        for (const player of __RADIO__.peers) {
            if (__PHONE__.target !== player && player !== localPlayer) {
                requestCloseMediaPeer(player, true);
            }
        }

        mp.gui.chat.push(`Team ${__RADIO__.metaData.name} has removed`);

        __RADIO__.metaData = {};
        return false;
    }

    for (const player of players) {
        const hasLocalPlayer = player === localPlayer
        if (__PHONE__.target !== player && !hasLocalPlayer) {
            requestCloseMediaPeer(player, true);
        }

        if (!hasLocalPlayer) {
            mp.gui.chat.push(`Player has disconnected from team ${__RADIO__.metaData.name}`);
        }

        __RADIO__.peers.delete(player);
    }
});

const requestCloseMediaPeer = (player, isGlobal = false) => {

    if (!isGlobal && __STORAGE__.proximityPeers.has(player)) {
        if (__STORAGE__.proximityPeers.has(player)) {
            __STORAGE__.proximityPeers.delete(player);
        }
    }

    if (!isGlobal && __STORAGE__.globalPeers.has(player)) {
        return false;
    }

    if (__STORAGE__.globalPeers.has(player)) {
        __STORAGE__.globalPeers.delete(player);
    }

    if (isGlobal && __STORAGE__.proximityPeers.has(player)) {
        return false;
    }

    if (__STORAGE__.proximityPeers.has(player)) {
        __STORAGE__.proximityPeers.delete(player);
    }

    if (__STORAGE__.currentConnectedPlayers.has(player)) {
        __STORAGE__.currentConnectedPlayers.delete(player);
    }

    const peerName = `${player.remoteId}${__CONFIG__.prefixId}`;

    if (__STORAGE__.queueRequestPeers.has(peerName)) {
        __STORAGE__.queueRequestPeers.delete(peerName);
    }

    emit('streamOut', peerName);
};

const generateBalance = (x1, y1, x2, y2, nx, ny) => {

    let x = x2 - x1;
    let y = y2 - y1;

    const s = Math.sqrt(x * x + y * y);

    x = x / s;
    y = y / s;

    const kek = x * ny - nx * y;
    const kuk = (x * nx + y * ny);
    const kukuk = kuk * kuk;

    if (kek > 0) {
        return Math.sqrt(1 - kukuk);
    } else if (kek < 0) {
        return -Math.sqrt(1 - kukuk);
    }
};

const clamp = (min, max, value) => {
    return Math.min(Math.max(min, value), max);
};

mp.events.add('vdebug', () => {
    __CONFIG__.debug = !__CONFIG__.debug;
})

mp.events.add('render', () => {

    if (__CONFIG__.debug) {
        drawText(`~r~DEBUG INFO~n~~w~global peers: ${__STORAGE__.globalPeers.size}~n~connected peers: ${__STORAGE__.currentConnectedPlayers.size}~n~streamed peers: ${__STORAGE__.streamedPlayers.size}~n~virtual peers: ${__STORAGE__.virtualStreamedPlayers.size}~n~Proximity peers: ${__STORAGE__.proximityPeers.size}~n~Phone call: ${(__PHONE__.target && mp.players.exists(__PHONE__.target)) && __PHONE__.target.name}`, [0.99, 0.5], {
            align: 2
        });
    }

    try {
        const localPlayerPos = localPlayer.position;

        if (__STORAGE__.browserReady) {

            const camRot = gameplayCam.getRot(2);
            const nx = -Math.sin(camRot.z * Math.PI / 180);
            const ny = Math.cos(camRot.z * Math.PI / 180);

            const currentTime = Date.now();

            if (currentTime >= __STORAGE__.lastSendingProximityEvent + __CONFIG__.sendDataProximityInterval) {

                const playersVolume = [];

                __STORAGE__.virtualStreamedPlayers.forEach((player) => {
                    if (player === localPlayer || typeof player.voice === 'undefined') {
                        return false;
                    }

                    let __playerBalance__ = 0;
                    let __playerVolume__ = 0;

                    const __playerPosition__ = player.position;
                    const distanceToPlayer = mp.game.system.vdist(localPlayerPos.x, localPlayerPos.y, localPlayerPos.z, __playerPosition__.x, __playerPosition__.y, __playerPosition__.z);

                    const voiceDistance = clamp(3, 50, player.getVariable('voice.distance') || __CONFIG__.defaultDistance);

                    if (
                        (__STORAGE__.globalPeers.has(player) && distanceToPlayer <= (voiceDistance / 2)) ||
                        (!__STORAGE__.globalPeers.has(player) && distanceToPlayer <= 50)
                    ) {
                        const calcVoiceDistance = voiceDistance * voiceDistance;
                        const calcDublDist = distanceToPlayer * distanceToPlayer;

                        __playerVolume__ = clamp(0, 1, -(calcDublDist - calcVoiceDistance) / (calcDublDist * calcDublDist + calcVoiceDistance));

                        const calcBalance = generateBalance(localPlayerPos.x, localPlayerPos.y, __playerPosition__.x, __playerPosition__.y, nx, ny);

                        __playerBalance__ = clamp(-1, 1, calcBalance);
                    }

                    if (__STORAGE__.globalPeers.has(player) && distanceToPlayer <= (voiceDistance / 2)) {
                        safeSetVoiceInfo(player, 'stateChangeVolume', 'proximity');

                        safeSetVoiceInfo(player, 'volume', __playerVolume__);
                        safeSetVoiceInfo(player, 'balance', __playerBalance__);

                    } else {
                        safeSetVoiceInfo(player, 'stateChangeVolume', 'global');
                    }

                    playersVolume.push({ name: `${player.remoteId}${__CONFIG__.prefixId}`, volume: __playerVolume__, balance: __playerBalance__ });
                });

                __STORAGE__.globalPeers.forEach(player => {
                    if (player === localPlayer || typeof player.voice === 'undefined' || safeGetVoiceInfo(player, 'stateChangeVolume') === 'proximity') {
                        return false;
                    }

                    let globalVolume = safeGetVoiceInfo(player, 'globalVolume');
                    let __volume__ = globalVolume;

                    playersVolume.push({ name: `${player.remoteId}${__CONFIG__.prefixId}`, volume: __volume__, balance: 0 });
                });

                emit('changeVolumeConsumers', playersVolume);

                __STORAGE__.lastSendingProximityEvent = currentTime;
            }
        }
    } catch (e) {
        mp.game.graphics.notify(`Voice error #1 - ${e.toString()}`)
    }
});

mp.events.add('voice.toggleMicrophone', (peerName, isEnabled) => {
    const playerId = getPlayerIdFromPeerId(peerName);
    const player = mp.players.atRemoteId(playerId);

    if (player && mp.players.exists(player)) {
        if (player !== localPlayer) {
            safeSetVoiceInfo(player, 'enabled', isEnabled);
        }
    }
});

mp.events.add('voice.changeMicrophoneActivationKey', (newActivationKey) => {
    mp.keys.unbind(__CONFIG__.pushToTalkKey, true, enableMicrophone);
    mp.keys.unbind(__CONFIG__.pushToTalkKey, false, disableMicrophone);

    __CONFIG__.pushToTalkKey = newActivationKey;

    mp.keys.bind(__CONFIG__.pushToTalkKey, true, enableMicrophone);
    mp.keys.bind(__CONFIG__.pushToTalkKey, false, disableMicrophone);
});

const enableMicrophone = () => {
    if (global.chatActive) return;

    if (
        __STORAGE__.browserReady &&
        !__STORAGE__.mutedMicrophone &&
        !__STORAGE__.enabledMicrophone
    ) {
        __STORAGE__.enabledMicrophone = true;
        emit('unmuteMic');
    }
}

const disableMicrophone = () => {
    if (
        __STORAGE__.browserReady &&
        !__STORAGE__.mutedMicrophone &&
        __STORAGE__.enabledMicrophone
    ) {
        __STORAGE__.enabledMicrophone = false;
        emit('muteMic');
    }
}

mp.keys.bind(__CONFIG__.pushToTalkKey, true, enableMicrophone);
mp.keys.bind(__CONFIG__.pushToTalkKey, false, disableMicrophone);
mp.keys.bind(0x72, false, () => { // F3
    if (__STORAGE__.browserReady) {
        emit('restartIce');
    }
});

const scalable = (dist, maxDist) => {
    return Math.max(0.1, 1 - (dist / maxDist));
}

const drawSprite = (dist, name, scale, heading, colour, x, y, layer) => {
    const graphics = mp.game.graphics
        , resolution = graphics.getScreenActiveResolution(0, 0)
        , textureResolution = graphics.getTextureResolution(dist, name)
        , SCALE = [(scale[0] * textureResolution.x) / resolution.x, (scale[1] * textureResolution.y) / resolution.y]

    if (graphics.hasStreamedTextureDictLoaded(dist) === 1) {
        if (typeof layer === 'number') {
            graphics.set2dLayer(layer);
        }

        graphics.drawSprite(dist, name, x, y, SCALE[0], SCALE[1], heading, colour[0], colour[1], colour[2], colour[3]);
    } else {
        graphics.requestStreamedTextureDict(dist, true);
    }
}

mp.events.add('render', () => {

    const __localPlayerPosition__ = localPlayer.position;

    __STORAGE__.streamedPlayers.forEach(player => {
        if (player === localPlayer || typeof player.voice === 'undefined') {
            return false;
        }

        const __playerPosition__ = player.position;

        const distance = mp.game.system.vdist(__localPlayerPosition__.x, __localPlayerPosition__.y, __localPlayerPosition__.z, __playerPosition__.x, __playerPosition__.y, __playerPosition__.z);
        if (distance <= 25 && !player.isOccluded() && !player.isDead() && player.getVariable('INVISIBLE') != true) {

            const headPosition = player.getBoneCoords(12844, 0, 0, 0);
            const headPosition2d = mp.game.graphics.world3dToScreen2d(headPosition.x, headPosition.y, headPosition.z + 1);

            if (!headPosition2d) {
                return false;
            }

            const scale = scalable(distance, 25);

            const scaleSprite = 0.7 * scale;

            const voiceDistance = clamp(3, 50, safeGetVoiceInfo(player, 'distance') || __CONFIG__.defaultDistance);

            const isConnected = safeGetVoiceInfo(player, 'stateConnection') === 'connected';
            const isMuted = !!safeGetVoiceInfo(player, 'muted');

            const sprite = !isMuted ?
                isConnected ?
                    safeGetVoiceInfo(player, 'enabled') ?
                        voiceDistance < 10 ?
                            'leaderboard_audio_1'
                            :
                            voiceDistance <= 20 ?
                                'leaderboard_audio_2'
                                :
                                voiceDistance > 20 ?
                                    'leaderboard_audio_3'
                                    :
                                    ''
                        :
                        'leaderboard_audio_inactive'
                    : 'leaderboard_audio_mute'
                : 'leaderboard_audio_mute';

            const spriteColor = isConnected ? [255, 255, 255, 255] : [244, 80, 66, 255];

            drawSprite("mpleaderboard", sprite, [scaleSprite, scaleSprite], 0, spriteColor, headPosition2d.x, headPosition2d.y + 0.038 * scale);
        }

    });
});

const drawText = (text, position, options) => {
    options = { ...{ align: 1, font: 4, scale: 0.3, outline: true, shadow: true, color: [255, 255, 255, 255] }, ...options };

    const ui = mp.game.ui;
    const font = options.font;
    const scale = options.scale;
    const outline = options.outline;
    const shadow = options.shadow;
    const color = options.color;
    const wordWrap = options.wordWrap;
    const align = options.align;
    ui.setTextEntry("CELL_EMAIL_BCON");
    for (let i = 0; i < text.length; i += 99) {
        const subStringText = text.substr(i, Math.min(99, text.length - i));
        mp.game.ui.addTextComponentSubstringPlayerName(subStringText);
    }

    ui.setTextFont(font);
    ui.setTextScale(scale, scale);
    ui.setTextColour(color[0], color[1], color[2], color[3]);

    if (shadow) {
        mp.game.invoke('0x1CA3E9EAC9D93E5E');
        ui.setTextDropshadow(2, 0, 0, 0, 255);
    }

    if (outline) {
        mp.game.invoke('0x2513DFB0FB8400FE');
    }

    switch (align) {
        case 1: {
            ui.setTextCentre(true);
            break;
        }
        case 2: {
            ui.setTextRightJustify(true);
            ui.setTextWrap(0.0, position[0] || 0);
            break;
        }
    }

    if (wordWrap) {
        ui.setTextWrap(0.0, (position[0] || 0) + wordWrap);
    }

    ui.drawText(position[0] || 0, position[1] || 0);
}

const specialKey = {
    [78]: `N`
}

var keyPrev = '';
var distancePrev = 0;
var micPrevState = false;
var connPrevState = 'closed';
mp.events.add('render', () => {

    let micState = isMutedMicrophone() ? false : isEnabledMicrophone() ? true : false;
    if (micState != micPrevState) {
        mp.gui.execute(`HUD.mic=${micState}`);
        micPrevState = micState;
    }

	/*let distance = getDistance();
	if(distancePrev != distance){
		mp.gui.execute(`distSet(${distance})`);
		distancePrev = distance;
	}*/

	/*let connState = getStateConnection();
	if(connPrevState != connState){
		mp.gui.execute(`connSet('${connState}')`);
		connPrevState = connState;
	}*/

	/*let key = typeof specialKey[__CONFIG__.pushToTalkKey] !== 'undefined' ? specialKey[__CONFIG__.pushToTalkKey]: String.fromCharCode(__CONFIG__.pushToTalkKey);
	if(keyPrev != key){
		mp.gui.execute(`keySet('${key}')`);
		keyPrev = key;
	}*/

});

const vdist = (v1, v2) => {
    const diffY = v1.y - v2.y;
    const diffX = v1.x - v2.x;
    const diffZ = v1.z - v2.z;

    return Math.sqrt((diffY * diffY) + (diffX * diffX) + (diffZ * diffZ));
}

const getStateConnection = () => __STORAGE__.stateVoiceConnection;
const isEnabledMicrophone = () => __STORAGE__.enabledMicrophone;
const isMutedMicrophone = () => __STORAGE__.mutedMicrophone;
const getDistance = () => __STORAGE__.distance;

const safeSetVoiceInfo = (player, key, value) => {
    if (typeof player.voice === 'undefined') {
        player.voice = {
            enabled: false,
            muted: false,
            volume: 0,
            balance: 0,
            globalVolume: 0,
            _volume: 0,
            stateConnection: 'connected',
            distance: __CONFIG__.defaultDistance,
            stateChangeVolume: 'proximity'
        };
    }

    player.voice[key] = value;
};

const safeGetVoiceInfo = (player, key) => {
    if (typeof player.voice === 'undefined') {
        player.voice = {
            enabled: false,
            muted: false,
            volume: 0,
            balance: 0,
            globalVolume: 0,
            _volume: 0,
            stateConnection: 'connected',
            distance: __CONFIG__.defaultDistance,
            stateChangeVolume: 'proximity'
        };
    }

    return player.voice[key];
};

const getPlayerIdFromPeerId = (peerId) => parseInt(peerId.replace(__CONFIG__.prefixId, ''));