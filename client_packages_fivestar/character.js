var fathers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 42, 43, 44];
var mothers = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 45];

global.hairIDList = [
    // male
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    // female
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
];

var validTorsoIDs = [
    // male
    [0, 0, 2, 14, 14, 5, 14, 14, 8, 0, 14, 15, 12],
    // female
    [0, 5, 2, 3, 4, 4, 5, 5, 5, 0]
];

var outClothes = 1;
var pants = 0;
var shoes = 1;

var gender = true;
var father = 0;
var mother = 21;
var similarity = 0.5;
var skin = 0.5;

var features = [];
for (var i = 0; i < 20; i++) features[i] = 0.0;

var hair = 0;
var hairColor = 0;
var eyeColor = 0;

var appearance = [];
for (var i = 0; i < 11; i++) appearance[i] = 255;


function updateCharacterParents() {
    localplayer.setHeadBlendData(
        mother,
        father,
        0,

        mother,
        father,
        0,

        similarity,
        skin,
        0.0,

        true
    );
}

function updateCharacterHairAndColors() {
    let currentGender = (gender) ? 0 : 1;
    // hair
    localplayer.setComponentVariation(2, hairIDList[currentGender][hair], 0, 0);
    localplayer.setHairColor(hairColor, 0);

    // appearance colors
    localplayer.setHeadOverlayColor(2, 1, hairColor, 100); // eyebrow
    localplayer.setHeadOverlayColor(1, 1, hairColor, 100); // beard
    localplayer.setHeadOverlayColor(10, 1, hairColor, 100); // chesthair

    // eye color
    localplayer.setEyeColor(eyeColor);
}

function updateAppearance() {
    for (var i = 0; i < 11; i++) {
        localplayer.setHeadOverlay(i, appearance[i], 100, 0, 0);
    }
}

function updateClothes() {
    localplayer.setComponentVariation(11, outClothes, 1, 0);
    localplayer.setComponentVariation(4, pants, 1, 0);
    localplayer.setComponentVariation(6, shoes, 1, 0);
    localplayer.setComponentVariation(8, 15, 0, 0);
    let currentGender = (gender) ? 0 : 1;
    localplayer.setComponentVariation(3, validTorsoIDs[currentGender][outClothes], 0, 0);
}

mp.events.add('characterGender', (param) => {
    gender = (param == "Male") ? true : false;
    if (gender) {
        localplayer.model = mp.game.joaat('mp_m_freemode_01');

        outClothes = 1;
        pants = 0;
        shoes = 1;
    }
    else {
        localplayer.model = mp.game.joaat('mp_f_freemode_01');

        outClothes = 5;
        pants = 0;
        shoes = 3;
    }

    appearance[1] = 255;

    updateCharacterParents();
    updateAppearance();
    updateCharacterHairAndColors();
    updateClothes();
    for (var i = 0; i < 20; i++) localplayer.setFaceFeature(i, features[i]);
});
mp.events.add('editorList', (param, value) => {
    var hairParam = (gender) ? "hairM" : "hairF";
    var browParam = (gender) ? "eyebrowsM" : "eyebrowsF";
    var lvl = parseFloat(value);
    //mp.gui.chat.push(lvl);
    switch (param) {
        case "similar":
            similarity = lvl;
            updateCharacterParents();
            return;
        case "skin":
            skin = lvl;
            updateCharacterParents();
            return;
        case "noseWidth": localplayer.setFaceFeature(0, lvl); features[0] = lvl; return;
        case "noseHeight": localplayer.setFaceFeature(1, lvl); features[1] = lvl; return;
        case "noseTipLength": localplayer.setFaceFeature(2, lvl); features[2] = lvl; return;
        case "noseDepth": localplayer.setFaceFeature(3, lvl); features[3] = lvl; return;
        case "noseTipHeight": localplayer.setFaceFeature(4, lvl); features[4] = lvl; return;
        case "noseBroke": localplayer.setFaceFeature(5, lvl); features[5] = lvl; return;
        case "eyebrowHeight": localplayer.setFaceFeature(6, lvl); features[6] = lvl; return;
        case "eyebrowDepth": localplayer.setFaceFeature(7, lvl); features[7] = lvl; return;
        case "cheekboneHeight": localplayer.setFaceFeature(8, lvl); features[8] = lvl; return;
        case "cheekboneWidth": localplayer.setFaceFeature(9, lvl); features[9] = lvl; return;
        case "cheekDepth": localplayer.setFaceFeature(10, lvl); features[10] = lvl; return;
        case "eyeScale": localplayer.setFaceFeature(11, lvl); features[11] = lvl; return;
        case "lipThickness": localplayer.setFaceFeature(12, lvl); features[12] = lvl; return;
        case "jawWidth": localplayer.setFaceFeature(13, lvl); features[13] = lvl; return;
        case "jawShape": localplayer.setFaceFeature(14, lvl); features[14] = lvl; return;
        case "chinHeight": localplayer.setFaceFeature(15, lvl); features[15] = lvl; return;
        case "chinDepth": localplayer.setFaceFeature(16, lvl); features[16] = lvl; return;
        case "chinWidth": localplayer.setFaceFeature(17, lvl); features[17] = lvl; return;
        case "chinIndent": localplayer.setFaceFeature(18, lvl); features[18] = lvl; return;
        case "neck": localplayer.setFaceFeature(19, lvl); features[19] = lvl; return;
        case "father":
            father = fathers[value];
            updateCharacterParents();
            return;
        case "mother":
            mother = mothers[value];
            updateCharacterParents();
            return;
        case `${hairParam}`:
            hair = value;
            updateCharacterHairAndColors();
            return;
        case `${browParam}`:
            appearance[2] = value;
            updateAppearance();
            return;
        case "beard":
            var overlay = (value == 0) ? 255 : value - 1;
            appearance[1] = overlay;
            updateAppearance();
            return;
        case "hairColor":
            hairColor = value;
            updateCharacterHairAndColors();
            return;
        case "eyeColor":
            eyeColor = value;
            updateCharacterHairAndColors();
            return;
    }
});

var characterSaved = false;
mp.events.add('characterSave', () => {
    let currentGender = (gender) ? 0 : 1;

    var appearance_values = [];
    for (var i = 0; i < 11; i++) appearance_values.push({ Value: appearance[i], Opacity: 100 });

    var hair_or_colors = [];
    hair_or_colors.push(hairIDList[currentGender][hair]);
    hair_or_colors.push(hairColor);
    hair_or_colors.push(0);
    hair_or_colors.push(hairColor);
    hair_or_colors.push(hairColor);
    hair_or_colors.push(eyeColor);
    hair_or_colors.push(0);
    hair_or_colors.push(0);
    hair_or_colors.push(hairColor);

    if (characterSaved) return;
    characterSaved = true;

    mp.events.callRemote("SaveCharacter", currentGender, father, mother, similarity, skin, JSON.stringify(features), JSON.stringify(appearance_values), JSON.stringify(hair_or_colors));
});

var editorBrowser = null;

mp.events.add('CreatorCamera', () => {
    localplayer.freezePosition(true);
    localplayer.setRotation(0.0, 0.0, -185.0, 2, true);

    bodyCamStart = new mp.Vector3(402.8664, -996.4108, -99.00027);
    var camValues = { Angle: localplayer.getRotation(2).z + 90, Dist: 0.6, Height: 0.6 };
    var pos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height), camValues.Angle, camValues.Dist);
    bodyCam = mp.cameras.new('default', pos, new mp.Vector3(0, 0, 0), 50);
    bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height);
    bodyCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 500, true, false);

    updateCharacterParents();
    for (var i = 0; i < 20; i++) localplayer.setFaceFeature(i, 0.0);
    updateCharacterHairAndColors();
    updateAppearance();
    updateClothes();

    localplayer.taskPlayAnim("amb@world_human_guard_patrol@male@base", "base", 8.0, 1, -1, 1, 0.0, false, false, false);

    characterSaved = false;
    editorBrowser = mp.browsers.new('package://cef/character.html');

    global.menuOpen();
    mp.events.call('camMenu', true);
});

mp.events.add('DestroyCamera', () => {
    if (bodyCam == null) return;
    bodyCam.setActive(false);
    bodyCam.destroy();
    mp.game.cam.renderScriptCams(false, false, 3000, true, true);

    global.menuClose();
    bodyCam = null;

    editorBrowser.destroy();
    editorBrowser = null;

    localplayer.stopAnim("amb@world_human_guard_patrol@male@base", "base", 0.0)
    localplayer.freezePosition(false);

    mp.events.call('camMenu', false);
    mp.events.call('showHUD', true);
    mp.events.call('showAltTabHint');

    if (global.menu == null)
    {
        global.loggedin = true;
        global.menu = mp.browsers["new"]('package://cef/menu.html');
        global.helpmenu = mp.browsers["new"]('package://cef/help.html');
    }
});

mp.events.add('entityStreamIn', (entity) => {
    if (entity.type !== 'player') return;

    if (entity.getVariable('PROP_0') != undefined) {
        let prop = entity.getVariable('PROP_0');
        entity.setPropIndex(0, prop[0], prop[1], true);
    }

    if (entity.getVariable('PROP_1') != undefined) {
        let prop = entity.getVariable('PROP_1');
        entity.setPropIndex(1, prop[0], prop[1], true);
    }

    if (entity.getVariable('PROP_6') != undefined) {
        let prop = entity.getVariable('PROP_6');
        entity.setPropIndex(6, prop[0], prop[1], true);
    }

    if (entity.getVariable('PROP_7') != undefined) {
        let prop = entity.getVariable('PROP_7');
        entity.setPropIndex(7, prop[0], prop[1], true);
    }
});