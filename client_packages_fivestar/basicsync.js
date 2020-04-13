mp.events.add('toggleInvisible', function (player, toggle) {
    try {
        if (player && mp.players.exists(player)) {
            if (toggle)
                player.setAlpha(0);
            else
                player.setAlpha(255);
        }
    } catch (e) { }
});

mp.events.add('entityStreamIn', function (entity) {
    try {
        if (entity.type !== 'player') return;

        mp.game.player.setMeleeWeaponDefenseModifier(0.25 - (0.25 * global.resistStages[global.nowResistStage]));
        mp.game.player.setWeaponDefenseModifier(1.7 - (1.7 * global.resistStages[global.nowResistStage]));

        if (entity.getVariable('INVISIBLE') != undefined && entity.getVariable('INVISIBLE'))
            entity.setAlpha(0);
        else
            entity.setAlpha(255);

    } catch (e) { }
});

// ATTACHEMNT MNGR
mp.attachmentMngr = {
    attachments: {},

    addFor: function (entity, id) {
        if (this.attachments.hasOwnProperty(id)) {
            if (entity.__attachmentObjects && !entity.__attachmentObjects.hasOwnProperty(id)) {
                let attInfo = this.attachments[id];

                let object = mp.objects.new(attInfo.model, entity.position, { dimension: entity.dimension });
                object.setCollision(false, false);

                object.attachTo(entity.handle,
                    (typeof (attInfo.boneName) === 'string') ? entity.getBoneIndexByName(attInfo.boneName) : entity.getBoneIndex(attInfo.boneName),
                    attInfo.offset.x, attInfo.offset.y, attInfo.offset.z,
                    attInfo.rotation.x, attInfo.rotation.y, attInfo.rotation.z,
                    false, false, false, false, 2, true);

                entity.__attachmentObjects[id] = object;
            }
        }
        else {
            mp.game.graphics.notify(`Static Attachments Error: ~r~Unknown Attachment Used: ~w~0x${id.toString(16)}`);
        }
    },

    removeFor: function (entity, id) {
        if (entity.__attachmentObjects && entity.__attachmentObjects.hasOwnProperty(id)) {
            let obj = entity.__attachmentObjects[id];
            delete entity.__attachmentObjects[id];

            if (mp.objects.exists(obj)) {
                obj.destroy();
            }
        }
    },

    initFor: function (entity) {
        for (let attachment of entity.__attachments) {
            mp.attachmentMngr.addFor(entity, attachment);
        }
    },

    shutdownFor: function (entity) {
        for (let attachment in entity.__attachmentObjects) {
            mp.attachmentMngr.removeFor(entity, attachment);
        }
    },

    register: function (id, model, boneName, offset, rotation) {
        if (typeof (id) === 'string') {
            id = mp.game.joaat(id);
        }

        if (typeof (model) === 'string') {
            model = mp.game.joaat(model);
        }

        if (!this.attachments.hasOwnProperty(id)) {
            if (mp.game.streaming.isModelInCdimage(model)) {
                this.attachments[id] =
                    {
                        id: id,
                        model: model,
                        offset: offset,
                        rotation: rotation,
                        boneName: boneName
                    };
            }
            else {
                mp.game.graphics.notify(`Static Attachments Error: ~r~Invalid Model (0x${model.toString(16)})`);
            }
        }
        else {
            mp.game.graphics.notify("Static Attachments Error: ~r~Duplicate Entry");
        }
    },

    unregister: function (id) {
        if (typeof (id) === 'string') {
            id = mp.game.joaat(id);
        }

        if (this.attachments.hasOwnProperty(id)) {
            this.attachments[id] = undefined;
        }
    },

    addLocal: function (attachmentName) {
        if (typeof (attachmentName) === 'string') {
            attachmentName = mp.game.joaat(attachmentName);
        }

        let entity = mp.players.local;

        if (!entity.__attachments || entity.__attachments.indexOf(attachmentName) === -1) {
            mp.events.callRemote("staticAttachments.Add", attachmentName);
        }
    },

    removeLocal: function (attachmentName) {
        if (typeof (attachmentName) === 'string') {
            attachmentName = mp.game.joaat(attachmentName);
        }

        let entity = mp.players.local;

        if (entity.__attachments && entity.__attachments.indexOf(attachmentName) !== -1) {
            mp.events.callRemote("staticAttachments.Remove", attachmentName);
        }
    },

    getAttachments: function () {
        return Object.assign({}, this.attachments);
    }
};

mp.events.add("entityStreamIn", (entity) => {
    if (!entity || entity.type !== "player") return;
    //mp.gui.chat.push(`entity ${entity.remoteId} stream in`);
    setTimeout(function () {
        if (entity && mp.players.exists(entity)) {
            let data = entity.getVariable('attachmentsData');

            if (data && data.length > 0) {
                let atts = data.split('|').map(att => parseInt(att, 16));
                entity.__attachments = atts;
            }
            else {
                entity.__attachments = [];
            }

            entity.__attachmentObjects = {};
            mp.attachmentMngr.initFor(entity);
        }
    }, 1000);
});

mp.events.add("c.entityStreamOut", (entity) => {
    //mp.gui.chat.push(`entity ${entity.remoteId} stream out`);
    if (entity.__attachmentObjects) {
        mp.attachmentMngr.shutdownFor(entity);
    }
});

mp.events.add("dimensionChange", () => {
    if (localPlayer.__attachmentObjects) {
        mp.attachmentMngr.shutdownFor(localPlayer);
        mp.attachmentMngr.initFor(localPlayer);
    }
});

mp.events.add("teleportTrigger", () => {
    //mp.gui.chat.push('teleportTrigger');

    setTimeout(function () {
        if (localPlayer.__attachmentObjects) {
            mp.attachmentMngr.shutdownFor(localPlayer);
            mp.attachmentMngr.initFor(localPlayer);
        }
    }, 1000);
});

mp.events.addDataHandler("attachmentsData", (entity, data) => {
    let newAttachments = (data.length > 0) ? data.split('|').map(att => parseInt(att, 16)) : [];

    if (entity.handle !== 0) {
        let oldAttachments = entity.__attachments;

        if (!oldAttachments) {
            oldAttachments = [];
            entity.__attachmentObjects = {};
        }

        // process outdated first
        for (let attachment of oldAttachments) {
            if (newAttachments.indexOf(attachment) === -1) {
                mp.attachmentMngr.removeFor(entity, attachment);
            }
        }

        // then new attachments
        for (let attachment of newAttachments) {
            if (oldAttachments.indexOf(attachment) === -1) {
                mp.attachmentMngr.addFor(entity, attachment);
            }
        }
    }

    entity.__attachments = newAttachments;
});

function InitAttachmentsOnJoin() {
    mp.players.forEach(_player => {
        let data = _player.getVariable("attachmentsData");

        if (data && data.length > 0) {
            let atts = data.split('|').map(att => parseInt(att, 16));
            _player.__attachments = atts;
            _player.__attachmentObjects = {};
        }
    });
}

InitAttachmentsOnJoin();

// REGISTER WEAPONS ATTACHMENTS
const PistolAttachmentPos = new mp.Vector3(0.02, 0.06, 0.1);
const PistolAttachmentRot = new mp.Vector3(-100.0, 0.0, 0.0);

const SMGAttachmentPos = new mp.Vector3(0.08, 0.03, -0.1);
const SMGAttachmentRot = new mp.Vector3(-80.77, 0.0, 0.0);

const ShotgunAttachmentPos = new mp.Vector3(-0.1, -0.15, 0.11);
const ShotgunAttachmentRot = new mp.Vector3(-180.0, 0.0, 0.0);

const RifleAttachmentPos = new mp.Vector3(-0.1, -0.15, -0.13);
const RifleAttachmentRot = new mp.Vector3(0.0, 0.0, 3.5);

const weaponAttachmentData = {
    // Pistols
    "W_PI_PISTOL": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_pistolmk2": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "W_PI_COMBATPISTOL": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "W_PI_APPISTOL": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_stungun": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "W_PI_PISTOL50": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_sns_pistol": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_sns_pistolmk2": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_heavypistol": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_vintage_pistol": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_revolver": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_revolvermk2": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_wep1_gun": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },
    "w_pi_raygun": { Slot: "RIGHT_THIGH", AttachBone: 51826, AttachPosition: PistolAttachmentPos, AttachRotation: PistolAttachmentRot },

    // Submachine Guns
    "w_sb_microsmg": { Slot: "LEFT_THIGH", AttachBone: 58271, AttachPosition: SMGAttachmentPos, AttachRotation: SMGAttachmentRot },
    "w_sb_smg": { Slot: "LEFT_THIGH", AttachBone: 58271, AttachPosition: SMGAttachmentPos, AttachRotation: SMGAttachmentRot },
    "w_sb_smgmk2": { Slot: "LEFT_THIGH", AttachBone: 58271, AttachPosition: SMGAttachmentPos, AttachRotation: SMGAttachmentRot },
    "w_sb_assaultsmg": { Slot: "LEFT_THIGH", AttachBone: 58271, AttachPosition: SMGAttachmentPos, AttachRotation: SMGAttachmentRot },
    "W_SB_PDW": { Slot: "LEFT_THIGH", AttachBone: 58271, AttachPosition: SMGAttachmentPos, AttachRotation: SMGAttachmentRot },
    "w_sb_compactsmg": { Slot: "LEFT_THIGH", AttachBone: 58271, AttachPosition: SMGAttachmentPos, AttachRotation: SMGAttachmentRot },
    "w_sb_minismg": { Slot: "LEFT_THIGH", AttachBone: 58271, AttachPosition: SMGAttachmentPos, AttachRotation: SMGAttachmentRot },

    // Shotguns
    "w_sg_pumpshotgun": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sg_pumpshotgunmk2": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sg_sawnoff": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sg_assaultshotgun": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sg_bullpupshotgun": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sg_heavyshotgun": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sg_doublebarrel": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_ar_musket": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },

    // Sniper Rifles
    "w_sr_sniperrifle": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sr_heavysniper": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sr_marksmanrifle": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sr_heavysnipermk2": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },
    "w_sr_marksmanriflemk2": { Slot: "LEFT_BACK", AttachBone: 24818, AttachPosition: ShotgunAttachmentPos, AttachRotation: ShotgunAttachmentRot },

    // Rifles
    "W_AR_ASSAULTRIFLE": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_assaultriflemk2": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_carbinerifle": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_carbineriflemk2": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_specialcarbine": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_specialcarbinemk2": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_sr_marksmanrifle": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_sr_marksmanriflemk2": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_bullpuprifle": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_bullpupriflemk2": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_advancedrifle": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
    "w_ar_assaultrifle_smg": { Slot: "RIGHT_BACK", AttachBone: 24818, AttachPosition: RifleAttachmentPos, AttachRotation: RifleAttachmentRot },
};
for (let weapon in weaponAttachmentData) {
    let hash = mp.game.joaat(weapon);

    mp.attachmentMngr.register(hash, weapon, weaponAttachmentData[weapon].AttachBone, weaponAttachmentData[weapon].AttachPosition, weaponAttachmentData[weapon].AttachRotation)
}

mp.attachmentMngr.register("prop_vodka_bottle", "prop_vodka_bottle", 57005, new mp.Vector3(0.15, -0.23, -0.1), new mp.Vector3(-80, 0, 0));
mp.attachmentMngr.register("prop_cs_beer_bot_02", "prop_cs_beer_bot_02", 57005, new mp.Vector3(0.12, -0.02, -0.03), new mp.Vector3(-80, 0, 0));
mp.attachmentMngr.register("prop_wine_red", "prop_wine_red", 57005, new mp.Vector3(0.15, -0.23, -0.1), new mp.Vector3(-80, 0, 0));
mp.attachmentMngr.register("p_whiskey_bottle_s", "p_whiskey_bottle_s", 57005, new mp.Vector3(0.15, 0.03, -0.06), new mp.Vector3(-80, 0, 0));
mp.attachmentMngr.register("prop_wine_white", "prop_wine_white", 57005, new mp.Vector3(0.15, -0.25, -0.1), new mp.Vector3(-80, 0, 0));
mp.attachmentMngr.register("prop_bottle_cognac", "prop_bottle_cognac", 57005, new mp.Vector3(0.15, -0.18, -0.10), new mp.Vector3(-80, 0, 0));

mp.attachmentMngr.register("prop_amb_phone", "prop_amb_phone", 6286, new mp.Vector3(0.06, 0.01, -0.02), new mp.Vector3(80, -10, 110));
mp.attachmentMngr.register("prop_drug_package_02", "prop_drug_package_02", 60309, new mp.Vector3(0.03, 0, 0.02), new mp.Vector3(0, 0, 50));
mp.attachmentMngr.register("prop_money_bag_01", "prop_money_bag_01", 18905, new mp.Vector3(0.55, 0.02, 0), new mp.Vector3(0, -90, 0));
mp.attachmentMngr.register("p_cs_cuffs_02_s", "p_cs_cuffs_02_s", 6286, new mp.Vector3(-0.02, 0.063, 0.0), new mp.Vector3(75.0, 0.0, 76.0));
mp.attachmentMngr.register("ng_proc_cigarette01a", "ng_proc_cigarette01a", 6286, new mp.Vector3(0.1, 0.02, -0.02), new mp.Vector3(75.0, 0.0, 255.0));