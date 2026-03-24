// Code Structure:
// 1) do an investigation roll
// 2) get the scene name, and apply scene loot modifiers
// 3) determine loot amount and types
// 4) roll a quality value for each
// 5) pass quality value to loot generation function for that type
// 6) roll loot and apply modifiers based on quality value
// 7) output to chat the results (dramatically? - delay+sounds)

// ------ Misc Reference -------
const DamageTypes = ["Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning", "Necrotic", "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder"]

// ------ Weapons -------
const SimpleWeapons = ["Club", "Dagger", "Greatclub", "Mace", "Quarterstaff", "Sickle", "Sling", "Dart", "Handaxe", "Javelin", "Light Hammer", "Spear"]
const MartialWeapon = ["Battleaxe", "Flail", "Glaive", "Greataxe", "Greatsword", "Halberd", "Lance", "Longsword", "Maul", "Morningstar", "Pike", "Rapier", "Scimitar", "Shortsword", "War Pick", "Warhammer", "Whip"]
const RangedWeapons = ["Hand Crossbow", "Heavy Crossbow", "Light Crossbow", "Longbow", "Shortbow"]
const Ammunition = ["Arrow", "Bolt", "Sling Bullet"]

// Exotic weapons with lower drop rates (blowgun ammo?)
const SpecialWeapons = ["Blowgun", "Net", "Double-Bladed Scimitar", "Trident", "Hoopak", "Yklwa"]

// Gear which holds modifiers like weapons would
const WeaponGear = ["Wraps of Unarmed Prowess", "Wand of the War Mage"]

// Weapon Modifiers
const Empowered = "Empowered"
const WeaponPrefix = ["Dancing", "Luminous", "Gambler's", "Lucky", Empowered, Empowered]
const WeaponSuffix = ["Warning", "Life Stealing", "Speed", "Terror", "Charming", "Potential", "Sapping"]
// luminous - glows and can cast daylight
// x Empowered - 1d6 x damage extra
// Gambler's - Always roll with disadvantage, but you crit if either dice would.
// Luck - Reroll any 1s (attack or damage)
// Potential - Dice Explode
// Terror - Inflict Frightened on Crit
// Charming - Inflict Charmed on Crit
// Sapping - -10 speed next round on hit
// anything not listed is as the existing item, without + bonuses
// attunement?? - none?

// ------ Armor -------
const PoorArmor = ["Padded Armor", "Leather Armor", "Hide Armor", "Studded Leather", "Chain Shirt"]
const FineArmor = ["Scale Mail", "Breastplate", , "Ring Mail", "Chain Mail"]
const GoodArmor = ["Half-Plate", "Splint Mail", "Plate Mail"]
const Shield = "Shield"

// Gear which can also hold armor type mods (but not materials)
const Robes = "Robes"

// Armor Mods (can have prefix and suffix, eg: Mithril Half-Plate of Warding)
const ArmorMaterial = ["Mithril", "Adamantine"]
const ArmorAbility = ["Warding", "Swiftness", "Assuredness", "Stability", "Shadows"]
// warding - +1 to saving throws, can reroll save once per sr
// swiftness - +10 speed, always disengaging
// assuredness - immune to charm and frightened
// stability - cannot be moved or made prone
// shadows - as the one with shadows warlock invocation

// ------ Consumables -------
// Healing
const PotionOfHealingTypes = ["", "Greater ", "Superior ", "Supreme "]

// Potions (all are "Potion of X"), and elixers (which are not Potion of X)
const CommonPotions = ["Watchful Rest",  "Advantage", "Fire Breath", "Growth"]
const CommonElixirs = ["Giant Serpent Venom", "Drow Poison", "Oil of Slipperiness", "Elixir of Health"]
const UncommonPotions = ["Aqueous Form", "Stone Giant Strength", "Invisibility", "Flying"] // Clarvoyance?
const UncommonElixirs = ["Oil of Sharpness", "Wyvern Venom", "Arcane Elixir"]
const RarePotions = ["Giant Size", "Storm Giant Strength", "Heroism", "Speed"]
const RareElixirs = ["Purple Worm Poison", "Greater Arcane Elixir"]
// GSV = same as serpent venom, but dc = 13
// Arcane Elixer - regain 1d4+1 / 2d4+2 spell slots

// ------ Misc ------
const TrinketTable = "FsuMDUalPgg3pceK"
const RareTrinketTable = "p0Od4UOcK0bbaYM6"

const Foci = ["Sprig of Mistletoe", "Druidic Totem", "Yew Wand", "Magic Orb", "Arcane Crystal"]
const Gods = ["Bane", "Ilmater", "Mystra", "Lloth", "Torm", "Tyr", "Bahamut", "Tiamat", "Asmodeus"]
const DivineFoci = ["Amulet", "Emblem", "Reliquary"] // 2x of these because the party is only divine casters

const TrashItems = [...SimpleWeapons, ...SimpleWeapons, ...SpecialWeapons, ...PoorArmor, ...Foci, ...DivineFoci, ...DivineFoci] 


// ------ Modifiers -------
// Dictionary of scenes that have various flags
const SceneModifiers = { 
    "The Stinkyard": {"quality": -5, "amount": 5, "uncommon": 15, "rare": 99}, // many trash items
    "Fort Knight": {"quality": 3}, // the fort is well provisioned
    "Fort Knight (Night)": {"quality": 10}, // many fallen adventurers
    "Uknown Battleground": {"quality": -3, "weapon": 0, "armor": 5}, // basic arms easy, well picked otherwise
    "Potato Town": {"trinket": 5, "Weapon": 10, "Armor": 15}, // trinkets are easier to come by in town
    "Looter's Landing": {"quality": 10, "uncommon": 5, "rare": 15}, // The final circle, everyone is very well equipped
    "default": {"quality": 0, "trinket": 10, "consumable": 10, "ammo": -5, "armor": 10, "weapon": 5, "uncommon": 10, "rare": 20,}
};
const DefaultMods = SceneModifiers["default"]

// ------ Code Functions ------
// make an amount string eg: "3 Arrows", "1 Bolt"
function makeQuantity(item, amount) {
    return amount + " " + item + ((amount > 1)? "s": "")
}

// select a random item from a given array
function randomFrom(array) {
    return array[Math.floor(Math.random() * array.length)]
}

// perform a quality roll: 1 - target/quality % chance of success
function qualityRoll(quality, target) {
    return (Math.random() * quality) > target
}

// perform a quality roll for a specific loot type
function qualityTypeRoll(type, quality, mods) {
    return qualityRoll(quality, mods[type] ?? DefaultMods[type])
}

function getWeapon(quality, mods) { 
    // Max weapon bonus is +1 if quality > 11, +2 if > 20, etc
    let bonus = Math.max(Math.floor(Math.random() * (quality - 10) / 10), 0)
    let bonusStr = bonus? "+" + bonus + " " : ""

    // roll for a weapon prefix
    let prefix = ""
    if (qualityTypeRoll("uncommon", quality, mods))
        prefix = randomFrom(WeaponPrefix) + " "
    if (prefix == (Empowered + " "))
        prefix = randomFrom(DamageTypes) + " " + Empowered + " "

    // roll for a weapon suffix
    let suffix = ""
    if (qualityTypeRoll("uncommon", quality, mods))
        suffix = " of " + randomFrom(WeaponSuffix)

    // get a random weapon
    body = randomFrom([...SimpleWeapons, ...MartialWeapon, ...RangedWeapons])

    // combine and return it
    return bonusStr + prefix + body + suffix
}

function getAmmo(quality, mods) {
    let quantity = Math.max(Math.floor(Math.random() * quality / 4), 1)
    return makeQuantity(randomFrom(Ammunition), quantity)
}

function getArmor(quality, mods) {
    // Material is rare, check that first
    let material = ""
    if (qualityTypeRoll("rare", quality, mods))
        material = randomFrom(ArmorMaterial) + " "

    // Max armor bonus is +1 if quality > 15, +2 if > 25
    let bonus = Math.max(Math.floor(Math.random() * (quality - 15) / 10), 0)
    let bonusStr = bonus? "+" + bonus + " " : ""

    // Roll for an armor modifier
    let modifier = ""
    if(qualityTypeRoll("uncommon", quality, mods)) {
        // coin flip for random mod or resistance
        if (Math.random() > 0.5)
            modifier = " of " + randomFrom(DamageTypes) + " Resistance"
        else 
            modifier = " of " + randomFrom(ArmorAbility)
    }

    // Determine the armor body type
    let body = ""
    if (material != "") // Only good armor can have a material
        body = randomFrom(GoodArmor)
    else if (bonus > 0) // Dont give lower tier items with bonuses (or shields)
        body = randomFrom([...GoodArmor, Robes])
    else if (modifier != "") // Pretty much any armor can have a mod, but doulble chance to armor items
        body = randomFrom([...GoodArmor, ...FineArmor, Robes])
    else { // make them roll for good armor
        if (qualityTypeRoll("armor", quality, mods))
            body = randomFrom([...GoodArmor, Shield])
        else
            body = randomFrom([...FineArmor, Shield])
    }

    // get the whole thing
    return bonusStr + material + body + modifier
}

function getHealing(quality, mods) {
    let type = Math.max(Math.floor(Math.random() * quality / 10), 0)
    return "Potion of " + PotionOfHealingTypes[type] + "Healing"
}

function getResistancePotion(quality, mods) {
    if (qualityTypeRoll("rare", quality, mods))
        return "Potion of Invulnerability"
    else
        return "Potion of " + randomFrom(DamageTypes) + " Resistance"
}

function getPotion(quality, mods) {
    // Roll for rare, then uncommon, then fallback to common
    let potion =  ""
    if (qualityTypeRoll("rare", quality, mods))
        potion = randomFrom([...RarePotions, ...RareElixirs])
    else if (qualityTypeRoll("uncommon", quality, mods))
        potion = randomFrom([...UncommonPotions, ...UncommonElixirs])
    else
        potion = randomFrom([...CommonPotions, ...CommonElixirs])

    // apply the "Potion of" title
    if ([...RarePotions, ...UncommonPotions, ...CommonPotions].includes(potion))
        potion = "Potion of " + potion
    
    return potion
}

function getScroll(quality, mods) {
    // Random level 0+, max drop lvl scales w quality / 5 -- use external generator
    let level = Math.floor(Math.max((Math.random() * quality) / 5, 0))
    return "Level " + level + " Spell Scroll"
}

function getConsumable(quality, mods) {
    // 40% healing, 20% each resistance potion, other potion, spell scroll
    let choices = [getHealing, getHealing, getPotion, getResistancePotion, getScroll]
    return randomFrom(choices)(quality, mods)
}

async function getTrinket(quality, mods) {
    // Roll to see if we should award a rare trinket instead
    if (qualityTypeRoll("rare", quality, mods))
        return getRare()

    // Silently draw an item from the table without replacing it
    let roll = await game.tables.get(TrinketTable).draw({displayChat:false})
    return roll.results[0].text
}

async function getRare() {
    let roll = await game.tables.get(RareTrinketTable).draw({displayChat:false})
    return roll.results[0].text
}

function getTrashItem(quality, mods) {
    let item = randomFrom(TrashItems)

    // dedicate divine foci to a god 
    if (DivineFoci.includes(item))
        item = item + " of " + randomFrom(Gods)
    return item
}

// Determine the Loot Distribution
function* getLootTypes(quality, mods) {
    let n = 10 + (mods["amount"] ?? 0)
    
    // quality roll helper function to reduce the amount on success
    function tryQualityRoll(type, quality, mods) {
        if (qualityTypeRoll(type, quality, mods)) {
            n -= 1
            return true
        }
        return false
    }

    // check if we shoould include various types of drops (related to the quality of the roll)
    if (tryQualityRoll("trinket", quality, mods)) yield getTrinket
    if (tryQualityRoll("trinket", quality, mods)) yield getTrinket
    if (tryQualityRoll("consumable", quality, mods)) yield getConsumable
    if (tryQualityRoll("consumable", quality, mods)) yield getConsumable
    if (tryQualityRoll("ammo", quality, mods)) yield getAmmo
    if (tryQualityRoll("armor", quality, mods)) yield getArmor
    if (tryQualityRoll("weapon", quality, mods)) yield getWeapon
    
    // "Lucky" bonus rolls
    if (tryQualityRoll("trinket", 15, mods)) yield getTrinket
    if (tryQualityRoll("consumable", 15, mods)) yield getConsumable
    if (tryQualityRoll("armor", 15, mods)) yield getArmor
    if (tryQualityRoll("weapon", 10, mods)) yield getWeapon

    // Fill the remaining slots with filler
    for(;n>0;n--)
        yield getTrashItem
}

// Add a new item to the loot list
async function addLoot(chat, loot) {
    await new Promise(res => setTimeout(res, 500));
    let new_line = `<li><b>${loot}</b></li>`
    let new_content = chat.content.split('</ul>')[0] + new_line + '</ul>'
    await chat.update({content: new_content})
}

// Main Function
async function rollLoot() {
    let name = token.name
    let quality = (await actor.rollSkill('inv', {flavor: `<b>${name}</b> searched the area!`})).total;
    let mods = SceneModifiers[canvas.scene.name] ?? DefaultMods
    quality += mods["quality"] ?? 0

    let chat = await ChatMessage.create({
        user: token._id,
        content: `<b>${name}</b> found the following items:<ul></ul>`
    });

    for (const roll of getLootTypes(quality, mods))
        await addLoot(chat, await roll(quality, mods))
}

await rollLoot();