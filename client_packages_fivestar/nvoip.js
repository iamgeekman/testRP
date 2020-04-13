const Use3d = true;
const UseAutoVolume = false;

const MaxRange = 10.0;

let lastUpdateEnabledVoice = Date.now();

const enableMicrophone = () => {
    if (global.chatActive || !global.loggedin) return;

    if (localPlayer.getVariable('voice.muted') == true) return;

    if (mp.voiceChat.muted) {
        lastUpdateEnabledVoice = Date.now();
        mp.voiceChat.muted = false;
        mp.gui.execute(`HUD.mic=${true}`);
        localPlayer.playFacialAnim("mic_chatter", "mp_facial");
    }
}

const disableMicrophone = () => {
    if (!global.loggedin) return;
    if (!mp.voiceChat.muted) {
        mp.voiceChat.muted = true;
        mp.gui.execute(`HUD.mic=${false}`);
        localPlayer.playFacialAnim("mood_normal_1", "facials@gen_male@variations@normal");
    }
}

mp.keys.bind(78, true, enableMicrophone);
mp.keys.bind(78, false, disableMicrophone);

mp.game.streaming.requestAnimDict("mp_facial");
mp.game.streaming.requestAnimDict("facials@gen_male@variations@normal");

let g_voiceMgr =
    {
        listeners: [],

        add: function (player, notify) {
            if (notify) mp.events.callRemote("add_voice_listener", player);
            this.listeners.push(player);

            player.voice3d = true;
            player.voiceVolume = 0.0;
            player.isListening = true;
        },

        remove: function (player, notify) {
            let idx = this.listeners.indexOf(player);

            if (idx !== -1)
                this.listeners.splice(idx, 1);

            player.isListening = false;

            if (notify) {
                mp.events.callRemote("remove_voice_listener", player);
            }
        }
    };

mp.events.add("playerQuit", (player) => {
    if (player.isListening) {
        g_voiceMgr.remove(player, false);
    }
});

let PHONE = {
    target: null,
    status: false
};

mp.events.add('voice.mute', () => {
    disableMicrophone();
})
mp.events.add('voice.phoneCall', (target) => {
    if (!PHONE.target) {
        PHONE.target = target;
        PHONE.status = true;
        mp.events.callRemote("add_voice_listener", target);
        target.voiceVolume = 1.0;
        target.voice3d = false;
        g_voiceMgr.remove(target, false);
    }
});
mp.events.add("voice.phoneStop", () => {
    if (PHONE.target) {
        if (mp.players.exists(PHONE.target)) {
            let localPos = localPlayer.position;
            const playerPos = PHONE.target.position;
            let dist = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, localPos.x, localPos.y, localPos.z);

            if (dist > MaxRange) {
                mp.events.callRemote("remove_voice_listener", PHONE.target);
            } else {
                g_voiceMgr.add(PHONE.target, false);
            }
        } else {
            mp.events.callRemote("remove_voice_listener", PHONE.target);
        }

        PHONE.target = null;
        PHONE.status = false;
    }
});

mp.events.add('v_reload', () => {
    g_voiceMgr.listeners.forEach((player) => {
        mp.events.callRemote("add_voice_listener", player);
    });
});

mp.events.add('v_checklisten', (player) => {
    mp.gui.chat.push(`isListening: ${player.isListening} | voiceActivity: ${player.isVoiceActive}`);
});

mp.events.add('playerStartTalking', (player) => {
    if (PHONE.target != player) player.voice3d = true;
    player.playFacialAnim("mic_chatter", "mp_facial");
});
mp.events.add('playerStopTalking', (player) => {
    player.playFacialAnim("mood_normal_1", "facials@gen_male@variations@normal");
});

setInterval(() => {
    let localPlayer = mp.players.local;
    let localPos = localPlayer.position;

    mp.players.forEachInStreamRange(player => {
        if (player != localPlayer) {
            if (!player.isListening && (!PHONE.target || PHONE.target != player)) {
                const playerPos = player.position;
                let dist = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, localPos.x, localPos.y, localPos.z);

                if (dist <= MaxRange) {
                    g_voiceMgr.add(player, true);
                }
            }
        }
    });

    g_voiceMgr.listeners.forEach((player) => {
        if (player.handle !== 0) {
            const playerPos = player.position;
            let dist = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, localPos.x, localPos.y, localPos.z);

            if (dist > MaxRange) {
                g_voiceMgr.remove(player, true);
            }
            else if (!UseAutoVolume) {
                player.voiceVolume = 1 - (dist / MaxRange);
            }
        }
        else {
            g_voiceMgr.remove(player, true);
        }
    });
}, 100);


// thanks to kemperrr
const scalable = (dist, maxDist) => Math.max(0.1, 1 - (dist / maxDist));
const clamp = (min, max, value) => Math.min(Math.max(min, value), max);

let nextFrameActive = false;

mp.events.add('render', () => {
    if (!mp.voiceChat.muted && Date.now() - lastUpdateEnabledVoice >= 2000) {
        mp.voiceChat.muted = true;
        nextFrameActive = true;
        lastUpdateEnabledVoice = Date.now();
    }

    if (nextFrameActive) {
        mp.voiceChat.muted = false;
        nextFrameActive = false;
    }

    mp.players.forEachInStreamRange(player => {
        if (player !== localPlayer) {
            const __playerPosition__ = player.position;
            const __localPlayerPosition__ = localPlayer.position;

            const distance = mp.game.system.vdist(__localPlayerPosition__.x, __localPlayerPosition__.y, __localPlayerPosition__.z, __playerPosition__.x, __playerPosition__.y, __playerPosition__.z);
            if (distance <= 25 && !player.isOccluded() && !player.isDead() && player.getVariable('INVISIBLE') != true) {

                const headPosition = player.getBoneCoords(12844, 0, 0, 0);
                const headPosition2d = mp.game.graphics.world3dToScreen2d(headPosition.x, headPosition.y, headPosition.z + 0.4);

                if (!headPosition2d) {
                    return false;
                }

                const scale = scalable(distance, 25);
                const scaleSprite = 0.7 * scale;

                const isMuted = false;
                const sprite = (!isMuted) ? 'leaderboard_audio_3' : 'leaderboard_audio_mute';

                const spriteColor = [255, 255, 255, 255];

                if (player.isVoiceActive) {
                    drawSprite("mpleaderboard", sprite, [scaleSprite, scaleSprite], 0, spriteColor, headPosition2d.x, headPosition2d.y + 0.038 * scale);
                }
            }
        }
    });
});

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
};



mp.events.add("v_reload", () => {
    mp.voiceChat.cleanupAndReload(true, true, true);
});

mp.events.add("v_reload2", () => {
    mp.voiceChat.cleanupAndReload(false, false, true);
});

mp.events.add("v_reload3", () => {
    mp.voiceChat.cleanupAndReload(true, false, false);
});

let lastVoiceFixTime = new Date().getTime();
let voiceFixTimer = setInterval(function () {
    if ((new Date().getTime() - lastVoiceFixTime) > (5 * 60 * 1000)) {
        if (mp.voiceChat.muted) {
            mp.voiceChat.cleanupAndReload(false, false, true);
            lastVoiceFixTime = new Date().getTime();
        }
    }
}, 30 * 1000);