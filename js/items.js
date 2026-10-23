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
  wind: { name: 'Wind Power',      tip: 'Wind Power! Press ↑ again in the air', colors: ['#a8f0d0', '#ffffff', '#3faa80'] }
};

// 'fireorb' -> 'fire', anything else -> null
function orbElement(type) {
  const el = type.endsWith('orb') ? type.slice(0, -3) : null;
  return ELEMENTS[el] ? el : null;
}
