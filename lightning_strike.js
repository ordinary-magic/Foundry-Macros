// Code to simulate a lightning strike in foundry by summoning a temporary light and playing a sound.
// Loosely based off of https://github.com/JamesBrandts/FoundryVTT/blob/main/Lightning.js
// Macro deisgned for and tested in version 12.343

// Sound effect to play, should be a path in your user data (you have to provide these).
const SOUND_EFFECTS = [
    "gm screen/Sound Effects/Thunder1.mp3",
    "gm screen/Sound Effects/Thunder2.mp3",
    "gm screen/Sound Effects/Thunder4.mp3",
    "gm screen/Sound Effects/Thunder5.mp3",
] 

const COLOR = "#FFFFFF"; // The color of the lightning (in case you want to tint it)

// Get a random integer from [start, start+n]
function getRandomInt(start, n) {
    return Math.floor(Math.random() * n ) + start;
}

// Get a random sound effect from the list
function getRandomSoundEffect() {
    return SOUND_EFFECTS[Math.floor(Math.random() * SOUND_EFFECTS.length)];
}

// Make a single lightning strike somewhere in the scene
async function makeLightningStrike() {
    // SceneX is the start of the un-padded scene, and width-height are its dimensions.
    // The x and y we set in the light are relative to the entire scene, but we dont want strikes in the padding.
    let dim = canvas.scene.dimensions
    let posX = getRandomInt(dim.sceneX, dim.sceneWidth);
    let posY = getRandomInt(dim.sceneY, dim.sceneHeight);

    // Make a light
    let lightData = {
        "x": posX,
        "y": posY,
        "rotation": 0,
        "walls": true,
        "vision": false,
        "config": {
            "dim": 30000,
            "bright": 30,
            "angle": 360,
            "alpha": 0.5,
            "darkness": {
                "min": 0,
                "max": 1
            },
            "attenuation": 0.5,
            "coloration": 1,
            "gradual": false,
            "luminosity": 0.1,
            "saturation": 0,
            "contrast": 0,
            "shadows": 0,
            "color": COLOR,
            "animation": {
                "type": "torch",
                "intensity": 10,
                "speed": 10,
                "reverse": false,
            },
        },
        "hidden": false,
        "flags": {}
    };
    let luz = await canvas.scene.createEmbeddedDocuments('AmbientLight',[lightData]);

    // Wait for 200ms, then remove the light
    await new Promise(resolve => setTimeout(resolve,500)); // each strike visible for 0.5 seconds
    canvas.scene.deleteEmbeddedDocuments('AmbientLight',[luz[0]._id]);

    // Play the sound effect if it exists (on despawn, not spawn, to simulate thunder's delay)
    if (SOUND_EFFECTS)
        foundry.audio.AudioHelper.play({src: getRandomSoundEffect(), volume: 1, loop: false}, true);
}

// Make multiple lightning strikes, with a random delay between them
async function makeLightningStrikes(amount, minDelay, maxDelay) {
    while (amount > 0) {
        await new Promise(resolve => setTimeout(resolve, getRandomInt(minDelay, maxDelay - minDelay)));
        makeLightningStrike();
        amount -= 1;
    }
}

// Increase the scene's darkness to the specified value, and run lightning until the scene is light again.
async function startLightningStorm(darkness, minDelay, maxDelay) {
    // Intensify the darkness to the threshold level
    if (canvas.scene.environment.darknessLevel < darkness)
        await canvas.scene.update({ "environment.darknessLevel": darkness },{ animateDarkness: true });

    // Make lightning strikes until it is no longer dark enough
    while (canvas.scene.environment.darknessLevel >= darkness) {
        makeLightningStrike(); // strike right away, since we have to wait for the darkness anyway
        await new Promise(resolve => setTimeout(resolve, getRandomInt(minDelay, maxDelay - minDelay)));
    }
}

// Example of how to end an in-progress lightning storm
function endStorm() {
    canvas.scene.environment.darknessLevel = 0;
}

// Run a handful of strikes (for testing)
//makeLightningStrikes(5, 1000, 5000);

// Start a storm
startLightningStorm(0.35, 5000, 60000); // every 5-60s