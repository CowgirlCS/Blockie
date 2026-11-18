// Gems, potions and elemental powers: what they look like and what they do.

// Gems are worth more the rarer they are. colors: dark, middle, light.
const GEMS = {
  gem:     { value: 1, colors: ['#1279a0', '#3fd0f5', '#a8f4ff'] },
  emerald: { value: 2, colors: ['#137a3a', '#3fdc6a', '#b0ffc8'] },
  ruby:    { value: 3, colors: ['#9a0c24', '#ff3b5c', '#ffb0c0'] },
  diamond: { value: 5, colors: ['#8aa8c0', '#eaf8ff', '#ffffff'] }
};

// Potions. time is how many seconds the magic lasts (0 = right away).
const POTIONS = {
  healpot:   { color: '#ff3b5c', time: 0,  tip: 'Heart Potion! +2 hearts' },
  jumppot:   { color: '#4aa8ff', time: 15, tip: 'Jump Potion! Super jumps!' },
  starpot:   { color: '#ffcc22', time: 8,  tip: 'Star Potion! Nothing can hurt you!' },
  magnetpot: { color: '#b05aff', time: 15, tip: 'Magnet Potion! Gems fly to you!' }
};

// Elemental powers come from glowing orbs (fireorb, iceorb, zaporb, windorb).
// colors: main, light, dark.
const POWER_TIME = 25;
const ELEMENTS = {
  fire: { name: 'Fire Power',      tip: 'Fire Power! Hits burn extra hard',   colors: ['#ff5a1f', '#ffe14d', '#c02010'] },
  ice:  { name: 'Ice Power',       tip: 'Ice Power! Hits freeze monsters',    colors: ['#7fd6ff', '#ffffff', '#2a7ad0'] },
  zap:  { name: 'Lightning Power', tip: 'Lightning! Hits zap other monsters', colors: ['#ffe14d', '#ffffff', '#d09000'] },
  wind: { name: 'Wind Power',      tip: 'Wind Power! Press ↑ again in the air', colors: ['#a8f0d0', '#ffffff', '#3faa80'] },
  earth:  { name: 'Earth Power',   tip: 'Earth Power! Hits knock monsters far',  colors: ['#a0703a', '#e0c080', '#5a3a1a'] },
  galaxy: { name: 'Galaxy Power',  tip: 'Galaxy Power! Hits make shooting stars', colors: ['#b05aff', '#ffb0ff', '#3a1a8a'] }
};

// The magic wands. Each one shoots its own kind of magic with SPACE.
// el: the element of the shot (the fire wand uses your power, or plain fire).
const WANDS = {
  firewand:   { el: null,     tip: 'Fire Wand! SPACE shoots fire',               color: '#ff4a1f' },
  icewand:    { el: 'ice',    tip: 'Ice Wand! Freeze monsters solid',            color: '#7fd6ff' },
  earthwand:  { el: 'earth',  tip: 'Earth Wand! Throws big rocks that bonk',     color: '#a0703a' },
  zapwand:    { el: 'zap',    tip: 'Lightning Wand! Zaps jump between monsters', color: '#ffe14d' },
  windwand:   { el: 'wind',   tip: 'Air Wand! Blows right through monsters',     color: '#a8f0d0' },
  galaxywand: { el: 'galaxy', tip: 'Galaxy Wand! Stars chase the monsters',      color: '#b05aff' }
};

// Pets follow Blockie and help out. Adopt them at the Pet House on the map.
const PETS = {
  puppy:      { name: 'Puppy',       desc: 'Bites monsters',          cost: 10 },
  kitty:      { name: 'Kitty',       desc: 'Grabs coins and gems',    cost: 15 },
  bunny:      { name: 'Bunny',       desc: 'Digs up presents',        cost: 20 },
  babydragon: { name: 'Baby Dragon', desc: 'Shoots fire at monsters', cost: 35 }
};

// Mods change how the game works. Turn them on and off in the Mods menu on the map.
const MODS = [
  { id: 'moon',     name: 'Moon Jump',       desc: 'Float like on the moon' },
  { id: 'bighead',  name: 'Big Head',        desc: 'Blockie gets a giant head' },
  { id: 'rainbow',  name: 'Rainbow Blockie', desc: 'All the colors!' },
  { id: 'bombs',    name: 'Endless Bombs',   desc: 'Never run out of bombs' },
  { id: 'fast',     name: 'Super Speed',     desc: 'Zoom zoom!' },
  { id: 'disco',    name: 'Disco Sky',       desc: 'The sky changes colors' },
  { id: 'confetti', name: 'Party Monsters',  desc: 'Monsters pop into confetti' },
  { id: 'castle',   name: 'Castle Sky',      desc: 'A big castle behind every level' }
];

function modOn(id) {
  return !!(Save.data && Save.data.mods && Save.data.mods[id]);
}

// Bombs: Blockie starts every level with some. Press B (or X) to throw one.
const BOMB_START = 3;

// 'fireorb' -> 'fire', anything else -> null
function orbElement(type) {
  const el = type.endsWith('orb') ? type.slice(0, -3) : null;
  return ELEMENTS[el] ? el : null;
}
