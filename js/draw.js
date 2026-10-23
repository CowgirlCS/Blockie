// Drawing helpers: text, icons, Blockie, the monsters, the world tiles and backgrounds.
// Everything is drawn with simple rectangles so it looks blocky.

const W = 960;
const H = 540;
const FONT = '"Trebuchet MS", Verdana, Arial, sans-serif';

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Filled shape from a flat list of points: [x1, y1, x2, y2, ...]
function poly(ctx, color, pts) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fill();
}

// Big friendly text with a dark outline so it is easy to read.
function say(ctx, str, x, y, size, color = '#ffffff', align = 'center') {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size / 5);
  ctx.strokeStyle = '#2a1410';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// A random-looking number between 0 and 1 that is always the same for the same n.
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Draw a tiny picture from strings. Each letter maps to a color, '.' is empty.
function pixels(ctx, rows, x, y, s, colors) {
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const col = colors[rows[r][c]];
      if (col) box(ctx, x + c * s, y + r * s, s, s, col);
    }
  }
}

// ---------- Icons ----------

const HEART_PX = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

function drawHeart(ctx, x, y, s, full) {
  pixels(ctx, HEART_PX, x, y, s, { '#': full ? '#e8202a' : '#4a2f35' });
  if (full) box(ctx, x + s, y + s, s, s, '#ff9a9a');
}

// kind is a key of GEMS: gem, emerald, ruby or diamond.
function drawGem(ctx, x, y, s = 1, kind = 'gem') {
  const [dark, mid, light] = GEMS[kind].colors;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  poly(ctx, dark, [0, -11, 10, -3, 0, 11, -10, -3]);
  poly(ctx, mid, [0, -11, 10, -3, 0, 3, -10, -3]);
  poly(ctx, light, [0, -11, 4, -3, 0, 0, -4, -3]);
  box(ctx, -5, -6, 3, 3, '#ffffff');
  ctx.restore();
}

function drawCoin(ctx, x, y, s = 1, squash = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * squash, s);
  box(ctx, -8, -8, 16, 16, '#b37400');
  box(ctx, -6, -6, 12, 12, '#ffcc22');
  box(ctx, -2, -4, 4, 8, '#ffe98a');
  ctx.restore();
}

function drawFood(ctx, type, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (type === 'apple') {
    box(ctx, -8, -6, 16, 14, '#d81e2a');
    box(ctx, -6, -4, 4, 4, '#ff7a7a');
    box(ctx, 3, 3, 5, 5, '#a3121c');
    box(ctx, -1, -11, 3, 6, '#6b3d1a');
    box(ctx, 2, -12, 6, 4, '#3fb53a');
  } else if (type === 'bread') {
    box(ctx, -11, -5, 22, 12, '#c98a3c');
    box(ctx, -9, -8, 18, 4, '#e0a85a');
    box(ctx, -6, -6, 2, 6, '#8a5520');
    box(ctx, 0, -6, 2, 6, '#8a5520');
    box(ctx, 6, -6, 2, 6, '#8a5520');
  } else if (type === 'carrot') {
    poly(ctx, '#ff8a1f', [-6, -6, 6, -6, 0, 12]);
    box(ctx, -4, -3, 3, 2, '#c55e00');
    box(ctx, -1, 2, 3, 2, '#c55e00');
    box(ctx, -5, -12, 3, 7, '#3fb53a');
    box(ctx, 0, -14, 3, 9, '#3fb53a');
    box(ctx, 4, -11, 3, 6, '#2f9a2c');
  } else if (type === 'egg') {
    box(ctx, -6, -9, 12, 18, '#fff6e0');
    box(ctx, -8, -4, 16, 12, '#fff6e0');
    box(ctx, -4, -6, 3, 5, '#ffffff');
    box(ctx, 2, 3, 5, 4, '#e8d8b0');
  }
  ctx.restore();
}

// A glowing magic orb. el is a key of ELEMENTS.
function drawOrb(ctx, el, x, y, s = 1, t = 0) {
  const [main, light, dark] = ELEMENTS[el].colors;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = main;
  ctx.beginPath();
  ctx.arc(0, 0, 18 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  box(ctx, -8, -12, 16, 24, dark);
  box(ctx, -12, -8, 24, 16, dark);
  box(ctx, -7, -10, 14, 20, main);
  box(ctx, -10, -7, 20, 14, main);
  box(ctx, -7, -8, 4, 4, light);
  const sym = '#ffffff';
  if (el === 'fire') {
    poly(ctx, '#ffe14d', [-5, 7, 5, 7, 6, 1, 1, -8, 0, -2, -3, -5, -6, 1]);
  } else if (el === 'ice') {
    box(ctx, -1, -8, 2, 16, sym);
    box(ctx, -8, -1, 16, 2, sym);
    box(ctx, -5, -5, 3, 3, sym);
    box(ctx, 2, -5, 3, 3, sym);
    box(ctx, -5, 2, 3, 3, sym);
    box(ctx, 2, 2, 3, 3, sym);
  } else if (el === 'zap') {
    poly(ctx, sym, [3, -9, -5, 1, 0, 1, -3, 9, 5, -2, 0, -2]);
  } else {
    box(ctx, -7, -5, 10, 2, sym);
    box(ctx, 3, -7, 2, 3, sym);
    box(ctx, -4, -1, 11, 2, sym);
    box(ctx, -7, 3, 8, 2, sym);
    box(ctx, 1, 5, 2, 2, sym);
  }
  ctx.restore();
}

// A potion bottle. kind is a key of POTIONS.
function drawPotion(ctx, kind, x, y, s = 1) {
  const col = POTIONS[kind].color;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  box(ctx, -4, -16, 8, 4, '#8a5a2b');
  box(ctx, -3, -12, 6, 5, '#d8eef5');
  box(ctx, -9, -8, 18, 18, '#d8eef5');
  box(ctx, -11, -5, 22, 12, '#d8eef5');
  box(ctx, -7, -4, 14, 12, col);
  box(ctx, -9, -2, 18, 8, col);
  box(ctx, -7, -6, 3, 7, 'rgba(255,255,255,0.8)');
  if (kind === 'healpot') {
    pixels(ctx, ['##.##', '#####', '.###.', '..#..'], -4, -1, 1.8, { '#': '#ffffff' });
  } else if (kind === 'jumppot') {
    poly(ctx, '#ffffff', [0, -3, 5, 2, 2, 2, 2, 6, -2, 6, -2, 2, -5, 2]);
  } else if (kind === 'starpot') {
    drawStar(ctx, 1, 2, 6, '#ffffff');
  } else {
    box(ctx, -4, -2, 3, 7, '#ffffff');
    box(ctx, 2, -2, 3, 7, '#ffffff');
    box(ctx, -4, 3, 9, 3, '#ffffff');
  }
  ctx.restore();
}

// A ball of dragon breath or a fire wand shot, drawn at (0, 0).
function drawFireball(ctx, el, spin, s = 1) {
  const [main, light, dark] = ELEMENTS[el || 'fire'].colors;
  ctx.save();
  ctx.rotate(spin);
  ctx.scale(s, s);
  box(ctx, -9, -6, 18, 12, dark);
  box(ctx, -6, -9, 12, 18, dark);
  box(ctx, -7, -4, 14, 8, main);
  box(ctx, -4, -7, 8, 14, main);
  box(ctx, -3, -3, 6, 6, light);
  ctx.restore();
}

// Weapons are drawn with the handle at (0, 0), pointing up.
function drawWeapon(ctx, type) {
  switch (type) {
    case 'sword':
      box(ctx, -2, 0, 4, 8, '#7a4a22');
      box(ctx, -7, -4, 14, 4, '#f2c230');
      box(ctx, -3, -26, 6, 22, '#d9e3ea');
      box(ctx, -3, -26, 2, 22, '#ffffff');
      box(ctx, -1.5, -30, 3, 4, '#d9e3ea');
      break;
    case 'spear':
      box(ctx, -1.5, -46, 3, 54, '#8a5a2b');
      poly(ctx, '#cfd8de', [-5, -46, 5, -46, 0, -62]);
      box(ctx, -3, -48, 6, 4, '#d7262e');
      break;
    case 'axe':
      box(ctx, -2, -34, 4, 42, '#7a4a22');
      poly(ctx, '#9aa6ae', [2, -36, 18, -44, 18, -16, 2, -24]);
      poly(ctx, '#9aa6ae', [-2, -36, -14, -41, -14, -19, -2, -24]);
      box(ctx, 15, -44, 3, 28, '#e6eef2');
      box(ctx, -14, -41, 3, 22, '#e6eef2');
      break;
    case 'mace':
      box(ctx, -2, -18, 4, 26, '#6b4a2b');
      box(ctx, -8, -32, 16, 16, '#7d8a93');
      box(ctx, -8, -32, 16, 3, '#aab6be');
      box(ctx, -2, -37, 4, 5, '#5c666d');
      box(ctx, -13, -26, 5, 4, '#5c666d');
      box(ctx, 8, -26, 5, 4, '#5c666d');
      break;
    case 'firewand':
      box(ctx, -2, -24, 4, 32, '#5a3416');
      box(ctx, -2, -24, 2, 32, '#7a4a22');
      box(ctx, -4, -28, 8, 5, '#ffcc22');
      box(ctx, -5, -37, 10, 10, '#ff4a1f');
      box(ctx, -3, -35, 4, 4, '#ffe14d');
      break;
  }
}

function drawShield(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  box(ctx, 0, 0, 12, 18, '#ffcc22');
  box(ctx, 2, 2, 8, 14, '#d7262e');
  box(ctx, 5, 3, 2, 12, '#ffcc22');
  box(ctx, 3, 7, 6, 2, '#ffcc22');
  ctx.restore();
}

function drawArmorIcon(ctx, type, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (type === 'helmet') {
    box(ctx, -10, -9, 20, 17, '#e0342f');
    box(ctx, -11, -10, 22, 4, '#d5dde3');
    box(ctx, -6, -2, 14, 5, '#2a1418');
    box(ctx, -2, -16, 4, 6, '#ffcc22');
  } else if (type === 'chest' || type === 'extra') {
    const main = type === 'chest' ? '#d5dde3' : '#ffcc22';
    const shine = type === 'chest' ? '#ffffff' : '#fff3a0';
    box(ctx, -15, -10, 6, 7, main);
    box(ctx, 9, -10, 6, 7, main);
    box(ctx, -10, -10, 20, 19, main);
    box(ctx, -10, -10, 20, 3, shine);
    box(ctx, -2, -4, 4, 6, '#d7262e');
  } else if (type === 'shield') {
    drawShield(ctx, -9, -12, 1.4);
  }
  ctx.restore();
}

function drawStar(ctx, x, y, r, color) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  poly(ctx, color, pts);
}

// ---------- Blockie ----------
// x is his middle, y is where his feet touch the ground.
// o: facing, walk, air, weapon, swing (0..1 or -1), armor, blocking, spin, boost, webbed, chilled
function drawBlockie(ctx, x, y, o) {
  const a = o.armor || {};
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (o.spin) {
    ctx.translate(0, -18);
    ctx.rotate(o.spin);
    ctx.translate(0, 18);
  }
  ctx.scale(o.facing || 1, 1);

  if (o.boost) {
    box(ctx, -26, -26, 10, 3, 'rgba(255,255,255,0.7)');
    box(ctx, -30, -16, 12, 3, 'rgba(255,255,255,0.7)');
  }

  const step = o.walk ? Math.sin(o.walk * 0.07) : 0;
  const legL = o.air ? -3 : step * 3;
  const legR = o.air ? 2 : -step * 3;

  if (a.shield && !o.blocking) drawShield(ctx, -17, -30, 0.8);

  // legs and boots
  box(ctx, -8 + legL, -10, 7, 10, '#3d3d4f');
  box(ctx, 1 + legR, -10, 7, 10, '#3d3d4f');
  box(ctx, -8 + legL, -4, 8, 4, '#2a2030');
  box(ctx, 1 + legR, -4, 8, 4, '#2a2030');

  // body (red armor)
  box(ctx, -10, -24, 20, 15, '#d7262e');
  box(ctx, -10, -24, 20, 3, '#ff5a4f');
  box(ctx, -10, -12, 20, 3, '#7a1010');
  box(ctx, -2, -12, 4, 3, '#ffd23f');
  if (a.chest) {
    box(ctx, -9, -23, 18, 10, '#d5dde3');
    box(ctx, -9, -23, 18, 2, '#ffffff');
    box(ctx, -2, -20, 4, 4, '#d7262e');
  }
  if (a.extra > 0) {
    box(ctx, -12, -25, 6, 6, '#ffcc22');
    box(ctx, 6, -25, 6, 6, '#ffcc22');
  }

  // head (red helmet with a visor and friendly eyes)
  box(ctx, -10, -39, 20, 16, '#e0342f');
  box(ctx, -10, -39, 20, 3, '#ff6a5a');
  box(ctx, -3, -33, 13, 6, '#2a1418');
  box(ctx, 1, -32, 3, 3, '#ffffff');
  box(ctx, 6, -32, 3, 3, '#ffffff');
  if (a.helmet) {
    box(ctx, -11, -41, 22, 4, '#d5dde3');
    box(ctx, -5, -49, 6, 8, '#ffcc22');
    box(ctx, -9, -47, 4, 5, '#ffcc22');
  } else {
    box(ctx, -2, -43, 4, 4, '#b01818');
  }

  // arm and weapon
  const weapon = o.weapon || 'none';
  const sw = o.swing === undefined ? -1 : o.swing;
  let ang = 0.35, hx = 8, hy = -16;
  if (sw >= 0) {
    if (weapon === 'spear') { ang = Math.PI / 2; hx = 4 + Math.sin(sw * Math.PI) * 24; hy = -18; }
    else if (weapon === 'firewand') { ang = 1.35; hx = 10; hy = -20; }
    else if (weapon === 'none') { hx = 8 + Math.sin(sw * Math.PI) * 12; hy = -18; }
    else ang = -1.4 + sw * 3.3;
  } else if (weapon === 'spear') {
    ang = 0.12;
  }
  if (o.blocking) { ang = -0.5; hx = 0; }

  const len = { sword: 26, axe: 36, mace: 30 }[weapon];   // swoosh size; spear, wand and fists have none
  if (sw >= 0 && sw < 0.85 && len) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = weapon === 'axe' ? 12 : 6;
    ctx.beginPath();
    ctx.arc(hx, hy, len, -1.4 - Math.PI / 2, ang - Math.PI / 2);
    ctx.stroke();
  }
  if (weapon !== 'none') {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ang);
    drawWeapon(ctx, weapon);
    ctx.restore();
  }
  box(ctx, hx - 3, hy - 3, 7, 7, '#c9d1d8');

  if (a.shield && o.blocking) drawShield(ctx, 8, -36, 1.2);

  if (o.webbed) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -36); ctx.lineTo(14, -8);
    ctx.moveTo(14, -36); ctx.lineTo(-14, -8);
    ctx.moveTo(-14, -22); ctx.lineTo(14, -22);
    ctx.stroke();
  }
  if (o.chilled) {
    box(ctx, -12, -44, 24, 44, 'rgba(140,210,255,0.45)');
    box(ctx, -12, -44, 24, 3, 'rgba(255,255,255,0.8)');
  }
  ctx.restore();
}

// ---------- Monsters ----------
// All of these take: x = middle, y = feet, dir = facing, s = size, t = time, flash = turn white.

function drawZombie(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const bob = Math.abs(Math.sin(t * 4)) * 1.5;
  const step = Math.sin(t * 5) * 2;
  box(ctx, -8 + step, -10, 7, 10, c('#34449a'));
  box(ctx, 1 - step, -10, 7, 10, c('#34449a'));
  ctx.translate(0, -bob);
  box(ctx, -10, -24, 20, 15, c(o.overalls ? '#3b5bc0' : '#2a9d8f'));
  if (o.overalls) {
    box(ctx, -7, -24, 3, 6, c('#c0723a'));
    box(ctx, 4, -24, 3, 6, c('#c0723a'));
  }
  box(ctx, 4, -23, 15, 5, c('#6cc24a'));
  box(ctx, 2, -17, 15, 5, c('#5aa83c'));
  box(ctx, -10, -38, 20, 15, c('#6cc24a'));
  box(ctx, -10, -38, 20, 3, c('#4f9a33'));
  const blink = (t % 3.2) < 0.15;
  if (blink) {
    box(ctx, 0, -31, 4, 1.5, '#111111');
    box(ctx, 6, -31, 4, 1.5, '#111111');
  } else {
    box(ctx, 0, -33, 4, 4, '#ffffff');
    box(ctx, 6, -33, 4, 4, '#ffffff');
    box(ctx, 2, -32, 2, 2, '#111111');
    box(ctx, 8, -32, 2, 2, '#111111');
  }
  if (o.angry) {
    box(ctx, -1, -36, 5, 1.5, '#1e3a10');
    box(ctx, 6, -36, 5, 1.5, '#1e3a10');
  }
  box(ctx, 2, -27, 7, 2, '#2b4a1a');
  if (o.hat) {
    box(ctx, -15, -40, 30, 3, c('#e8c252'));
    box(ctx, -9, -47, 18, 7, c('#f2d16b'));
    box(ctx, -9, -43, 18, 2, c('#d7262e'));
  }
  ctx.restore();
}

function drawSkeleton(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const step = o.still ? 0 : Math.sin(t * 5) * 2;
  if (o.cape) box(ctx, -12, -27, 7, 23, c('#b01818'));
  box(ctx, -6 + step, -12, 3, 12, c('#e6e4da'));
  box(ctx, 3 - step, -12, 3, 12, c('#e6e4da'));
  box(ctx, -7, -14, 14, 3, c('#e6e4da'));
  box(ctx, -1, -26, 3, 12, c('#d0cec4'));
  box(ctx, -7, -25, 14, 2, c('#f2f0e6'));
  box(ctx, -7, -21, 14, 2, c('#f2f0e6'));
  box(ctx, -6, -17, 12, 2, c('#f2f0e6'));
  if (o.windup) {
    box(ctx, 0, -38, 3, 13, c('#e6e4da'));
    box(ctx, -4, -42, 11, 4, c('#ffffff'));
  } else {
    box(ctx, -9, -24, 3, 11, c('#e6e4da'));
    box(ctx, 7, -24, 3, 11, c('#e6e4da'));
  }
  box(ctx, -9, -38, 18, 13, c('#f2f0e6'));
  box(ctx, -6, -27, 12, 3, c('#d8d6cc'));
  box(ctx, -5, -35, 5, 5, '#2a2a3a');
  box(ctx, 2, -35, 5, 5, '#2a2a3a');
  box(ctx, -4, -34, 1.5, 1.5, '#ffffff');
  box(ctx, 3, -34, 1.5, 1.5, '#ffffff');
  if (o.crown) {
    box(ctx, -9, -44, 18, 6, '#ffcc22');
    box(ctx, -9, -47, 3, 3, '#ffcc22');
    box(ctx, -1.5, -47, 3, 3, '#ffcc22');
    box(ctx, 6, -47, 3, 3, '#ffcc22');
    box(ctx, -1.5, -42, 3, 3, '#d7262e');
  }
  ctx.restore();
}

// Spiders are drawn in a big 110-wide frame. Normal spiders use s = 0.38.
function drawSpider(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  ctx.strokeStyle = c(o.legs || '#24183a');
  ctx.lineWidth = 6;
  ctx.lineCap = 'square';
  for (let i = 0; i < 4; i++) {
    const lx = -36 + i * 18;
    const lift = Math.sin(t * 14 + i * 1.7) * 5;
    ctx.beginPath();
    ctx.moveTo(lx, -28);
    ctx.lineTo(lx - 10 + i * 4, -52 - lift);
    ctx.lineTo(lx - 16 + i * 8, -Math.max(0, lift));
    ctx.stroke();
  }
  const body = o.body || '#3b2a5c';
  box(ctx, -52, -50, 58, 36, c(body));
  box(ctx, -52, -50, 58, 6, c(o.bodyLight || '#54407e'));
  box(ctx, -44, -40, 38, 5, c(o.stripe || '#d7262e'));
  box(ctx, 2, -42, 38, 28, c(o.head || '#4b3874'));
  box(ctx, 9, -38, 11, 11, '#ffffff');
  box(ctx, 24, -38, 11, 11, '#ffffff');
  box(ctx, 15, -34, 4, 5, '#111111');
  box(ctx, 30, -34, 4, 5, '#111111');
  box(ctx, 16, -14, 4, 6, '#ffffff');
  box(ctx, 26, -14, 4, 6, '#ffffff');
  if (o.crown) {
    box(ctx, 6, -52, 30, 10, '#ffcc22');
    box(ctx, 6, -58, 5, 6, '#ffcc22');
    box(ctx, 18, -58, 5, 6, '#ffcc22');
    box(ctx, 31, -58, 5, 6, '#ffcc22');
    box(ctx, 19, -49, 4, 4, '#d7262e');
  }
  ctx.restore();
}

// Mobs are little blocky creatures, 20 wide at s = 1.
function drawMob(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const color = o.color || '#8a4fd0';
  if (o.cape) {
    const wave = Math.sin(t * 4) * 1;
    box(ctx, -13, -19, 5, 16 + wave, c('#b01818'));
  }
  box(ctx, -8, -4, 6, 4, c('#3a1a40'));
  box(ctx, 2, -4, 6, 4, c('#3a1a40'));
  box(ctx, -10, -20, 20, 17, c(color));
  box(ctx, -10, -20, 20, 3, c('rgba(255,255,255,0.35)'));
  box(ctx, -9, -24, 3, 4, c('#fff3c0'));
  box(ctx, 6, -24, 3, 4, c('#fff3c0'));
  box(ctx, -1, -16, 5, 6, '#ffffff');
  box(ctx, 5, -16, 4, 6, '#ffffff');
  box(ctx, 1, -14, 2, 3, '#111111');
  box(ctx, 6, -14, 2, 3, '#111111');
  if (o.angry) {
    box(ctx, -2, -18, 5, 1.2, '#2a0a30');
    box(ctx, 5, -18, 5, 1.2, '#2a0a30');
  }
  box(ctx, 1, -8, 6, 2, '#3a1030');
  if (o.crown) {
    box(ctx, -7, -27, 14, 4, '#ffcc22');
    box(ctx, -7, -29, 2, 2, '#ffcc22');
    box(ctx, -1, -29, 2, 2, '#ffcc22');
    box(ctx, 5, -29, 2, 2, '#ffcc22');
    box(ctx, -1, -26, 2, 2, '#d7262e');
  }
  ctx.restore();
}

// Dragons fly. At s = 1 they are about 52 wide. o.el picks the colors: 'fire' or 'ice'.
function drawDragon(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  const ice = o.el === 'ice';
  const body = ice ? '#4aa8ff' : '#d7262e';
  const dark = ice ? '#2a6ac0' : '#9a1414';
  const belly = ice ? '#e0f6ff' : '#ffcc22';
  const wing = ice ? '#9ad8ff' : '#ff7a3a';
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const flap = Math.sin(t * 9);
  poly(ctx, c(dark), [-10, -26, 4, -26, -6, -46 - flap * 10, -24, -40 - flap * 12]);
  box(ctx, -28, -20, 12, 6, c(body));
  box(ctx, -34, -24, 8, 6, c(body));
  poly(ctx, c(belly), [-42, -30, -33, -25, -34, -16]);
  box(ctx, -12, -10, 6, 9, c(dark));
  box(ctx, 4, -10, 6, 9, c(dark));
  box(ctx, -18, -28, 32, 19, c(body));
  box(ctx, -12, -15, 22, 6, c(belly));
  for (let k = 0; k < 3; k++) box(ctx, -14 + k * 8, -32, 4, 4, c(belly));
  box(ctx, 8, -36, 10, 14, c(body));
  box(ctx, 12, -44, 20, 14, c(body));
  box(ctx, 28, -40, 9, 10, c(body));
  box(ctx, 34, -39, 2, 2, '#2a0a0a');
  box(ctx, 15, -50, 3, 6, c(belly));
  box(ctx, 22, -50, 3, 6, c(belly));
  box(ctx, 19, -42, 6, 6, '#ffffff');
  box(ctx, 22, -41, 3, 4, '#111111');
  if (o.breath) {
    box(ctx, 30, -32, 8, 3, '#2a0a0a');
    box(ctx, 37, -35, 6, 6, ice ? '#ffffff' : '#ffe14d');
  } else {
    box(ctx, 26, -32, 10, 2, c(dark));
  }
  poly(ctx, c(wing), [-6, -26, 8, -26, 2, -50 - flap * 12, -18, -44 - flap * 14]);
  ctx.restore();
}

// ---------- Friendly animals ----------
// All take: x = middle, y = feet, dir = facing, t = time, happy = just said hi.

// Four legs that take turns lifting. legs: list of [x, which pair].
function animalLegs(ctx, legs, w, h, step, color, hoof) {
  for (const [lx, k] of legs) {
    const up = Math.max(0, step * k);
    box(ctx, lx, -h, w, h - up, color);
    if (hoof) box(ctx, lx, -3 - up, w, 3, hoof);
  }
}

function drawSheep(ctx, x, y, dir, t, happy) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  animalLegs(ctx, [[-16, 1], [-8, -1], [6, 1], [13, -1]], 5, 11, Math.sin(t * 6) * 2, '#3a3a40');
  box(ctx, -21, -28, 38, 18, '#f4f4ee');
  box(ctx, -18, -34, 12, 8, '#f4f4ee');
  box(ctx, -4, -34, 14, 8, '#f4f4ee');
  box(ctx, -23, -24, 4, 10, '#f4f4ee');
  box(ctx, -16, -33, 24, 3, '#ffffff');
  box(ctx, -12, -20, 6, 4, '#e2e2da');
  box(ctx, 2, -16, 6, 4, '#e2e2da');
  box(ctx, 13, -30, 12, 15, '#3a3a40');
  box(ctx, 10, -29, 5, 4, '#2a2a30');
  box(ctx, 12, -33, 10, 5, '#f4f4ee');
  if (happy) box(ctx, 18, -25, 5, 1.5, '#ffffff');
  else box(ctx, 19, -26, 3, 3, '#ffffff');
  box(ctx, 21, -19, 3, 1.5, '#ff9ab8');
  ctx.restore();
}

function drawPig(ctx, x, y, dir, t, happy) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  const pink = '#ff9ab8', dark = '#e07a98';
  animalLegs(ctx, [[-17, 1], [-9, -1], [6, 1], [13, -1]], 5, 9, Math.sin(t * 7) * 2, dark);
  box(ctx, -20, -27, 37, 19, pink);
  box(ctx, -20, -27, 37, 3, '#ffc0d4');
  box(ctx, -24, -24, 4, 3, dark);
  box(ctx, -26, -28, 3, 4, dark);
  box(ctx, 11, -30, 14, 17, pink);
  box(ctx, 12, -34, 5, 5, dark);
  box(ctx, 23, -24, 7, 8, '#ff7aa0');
  box(ctx, 25, -22, 1.5, 3, '#a03050');
  box(ctx, 28, -22, 1.5, 3, '#a03050');
  if (happy) box(ctx, 16, -27, 5, 1.5, '#222222');
  else box(ctx, 17, -28, 3, 3, '#222222');
  ctx.restore();
}

function drawCow(ctx, x, y, dir, t, happy) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  const white = '#f6f6f2', spot = '#2a2a2a';
  animalLegs(ctx, [[-31, 1], [-20, -1], [12, 1], [23, -1]], 7, 16, Math.sin(t * 4) * 3, white, spot);
  box(ctx, -38, -46, 3, 22, white);
  box(ctx, -39, -26, 5, 5, spot);
  box(ctx, -35, -50, 63, 35, white);
  box(ctx, -35, -50, 63, 3, '#ffffff');
  box(ctx, -27, -45, 15, 12, spot);
  box(ctx, -4, -32, 13, 11, spot);
  box(ctx, 12, -47, 10, 8, spot);
  box(ctx, -6, -18, 12, 4, '#ffb0c0');
  box(ctx, 24, -58, 19, 24, white);
  box(ctx, 34, -42, 13, 11, '#ffb0c0');
  box(ctx, 38, -38, 2, 2, '#a05060');
  box(ctx, 43, -38, 2, 2, '#a05060');
  box(ctx, 25, -62, 3, 5, '#e8dcb0');
  box(ctx, 37, -62, 3, 5, '#e8dcb0');
  box(ctx, 20, -54, 5, 4, spot);
  if (happy) box(ctx, 33, -50, 6, 1.5, '#222222');
  else box(ctx, 34, -51, 4, 4, '#222222');
  ctx.restore();
}

function drawHorse(ctx, x, y, dir, t, happy) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  const coat = '#b0703a', dark = '#7a4a22', mane = '#3a2010';
  animalLegs(ctx, [[-27, 1], [10, 1]], 7, 30, Math.sin(t * 9) * 5, dark, '#2a2020');
  animalLegs(ctx, [[-17, -1], [20, -1]], 7, 30, Math.sin(t * 9) * 5, coat, '#2a2020');
  box(ctx, -38, -50, 6, 26, mane);
  box(ctx, -32, -52, 60, 24, coat);
  box(ctx, -32, -52, 60, 3, '#c88a50');
  box(ctx, -14, -56, 24, 8, '#d7262e');
  box(ctx, -14, -56, 24, 2, '#ff5a4f');
  box(ctx, -4, -48, 4, 12, '#ffcc22');
  box(ctx, 18, -72, 13, 26, coat);
  box(ctx, 20, -80, 24, 14, coat);
  box(ctx, 36, -74, 10, 9, dark);
  box(ctx, 42, -71, 2, 2, '#1a1010');
  box(ctx, 20, -86, 4, 6, coat);
  box(ctx, 14, -80, 6, 30, mane);
  if (happy) box(ctx, 28, -77, 5, 1.5, '#1a1010');
  else box(ctx, 29, -78, 3, 3, '#1a1010');
  ctx.restore();
}

// peck = head down, looking for seeds
function drawChicken(ctx, x, y, dir, t, happy, peck) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  const step = peck ? 0 : Math.sin(t * 14) * 1.5;
  box(ctx, -4 + step, -6, 2, 6, '#ffa020');
  box(ctx, 2 - step, -6, 2, 6, '#ffa020');
  box(ctx, -12, -22, 5, 8, '#ffffff');
  box(ctx, -10, -18, 17, 12, '#ffffff');
  box(ctx, -7, -15, 9, 6, '#e6e6e6');
  const hy = peck ? 8 : 0;
  box(ctx, 3, -25 + hy, 8, 9, '#ffffff');
  box(ctx, 4, -28 + hy, 5, 3, '#e8202a');
  box(ctx, 11, -22 + hy, 4, 2, '#ffa020');
  box(ctx, 9, -18 + hy, 2, 3, '#e8202a');
  if (happy) box(ctx, 6, -22 + hy, 3, 1, '#222222');
  else box(ctx, 7, -23 + hy, 2, 2, '#222222');
  ctx.restore();
}

function drawElephant(ctx, x, y, dir, t, happy) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  const body = '#9aa7bd', dark = '#7d8aa3', light = '#b2bdd0';
  const step = Math.sin(t * 4) * 3;
  const up1 = Math.max(0, step), up2 = Math.max(0, -step);
  box(ctx, -40, -20, 14, 20 - up1, dark);
  box(ctx, -18, -20, 14, 20 - up2, body);
  box(ctx, 8, -20, 14, 20 - up2, dark);
  box(ctx, 24, -20, 14, 20 - up1, body);
  box(ctx, -52, -48, 8, 4, dark);
  box(ctx, -54, -46, 4, 14, dark);
  box(ctx, -46, -54, 82, 36, body);
  box(ctx, -46, -24, 82, 6, dark);
  // red blanket to sit on
  box(ctx, -32, -58, 50, 24, '#d7262e');
  box(ctx, -32, -58, 50, 3, '#ff5a4f');
  box(ctx, -32, -38, 50, 4, '#ffcc22');
  // head, ear, face
  box(ctx, 26, -62, 30, 32, light);
  box(ctx, 16, -60, 18, 30, body);
  box(ctx, 19, -56, 12, 22, '#f0a8bc');
  if (happy) {
    box(ctx, 42, -50, 7, 2, '#222222');
  } else {
    box(ctx, 44, -52, 5, 6, '#222222');
    box(ctx, 45, -51, 2, 2, '#ffffff');
  }
  box(ctx, 46, -42, 6, 3, '#f5a0b5');
  box(ctx, 50, -34, 10, 4, '#ffffff');
  const sw = Math.sin(t * 3) * 3;
  if (happy) {
    box(ctx, 50, -40, 9, 10, light);
    box(ctx, 56, -50, 8, 12, light);
    box(ctx, 60, -62, 8, 14, light);
  } else {
    box(ctx, 50, -32, 9, 12, light);
    box(ctx, 52 + sw * 0.5, -22, 8, 12, light);
    box(ctx, 54 + sw, -12, 7, 10, light);
  }
  ctx.restore();
}

// ---------- BLOCKIE logo ----------

const LOGO_FONT = {
  B: ['####.', '#...#', '####.', '#...#', '####.'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  K: ['#...#', '#..#.', '###..', '#..#.', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  E: ['#####', '#....', '####.', '#....', '#####']
};

function drawLogo(ctx, cx, y, s, t) {
  const word = 'BLOCKIE';
  let total = 0;
  for (const ch of word) total += LOGO_FONT[ch][0].length * s + s;
  total -= s;
  // two passes: shadows first, then the red blocks on top
  for (let pass = 0; pass < 2; pass++) {
    let x = cx - total / 2;
    for (let i = 0; i < word.length; i++) {
      const rows = LOGO_FONT[word[i]];
      const dy = Math.sin(t * 3 + i * 0.7) * 5;
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          if (rows[r][c] !== '#') continue;
          const px = x + c * s, py = y + r * s + dy;
          if (pass === 0) {
            box(ctx, px + 5, py + 6, s, s, '#3a0606');
          } else {
            box(ctx, px, py, s, s, '#e01e1e');
            box(ctx, px, py, s, s / 5, '#ff7a6a');
            box(ctx, px, py + s - s / 5, s, s / 5, '#a01010');
            box(ctx, px + s - s / 6, py, s / 6, s, '#b81414');
          }
        }
      }
      x += rows[0].length * s + s;
    }
  }
}

// ---------- World themes ----------

const BASE_THEME = {
  sky: ['#6ccaff', '#d4f3ff'],
  far: '#9bd88a', near: '#62b94a',
  farShape: null, nearShape: 'trees',
  grass: '#5cc23c', grassLight: '#86e05c', grassDark: '#3e9a2a',
  dirt: '#9a6334', dirtDark: '#7a4c26',
  stone: '#9b9ea4', stoneDark: '#7b7e84',
  brick: '#a3a3ad', brickDark: '#7f7f8a', brickLight: '#c4c4cc',
  rock: '#4a4060', rockDark: '#352d47',
  groundTile: 1,
  decor: ['flower', 'grass'], density: 0.3
};

const THEMES = {
  meadow: Object.assign({}, BASE_THEME, {
    sun: true, clouds: true,
    decor: ['flower', 'grass', 'grass', 'bush', 'tree', 'flower'], density: 0.35
  }),
  mushroom: Object.assign({}, BASE_THEME, {
    sky: ['#8be0c4', '#f0ffe0'], far: '#7cc79a', near: '#3f9e62',
    farShape: 'shrooms', nearShape: null, clouds: true,
    grass: '#4cbf5a', grassLight: '#7ee08a', grassDark: '#2f8f44',
    dirt: '#7d5a3c', dirtDark: '#5e422b',
    decor: ['tallgrass', 'tallgrass', 'smallshroom', 'flower', 'grass', 'smallshroom'], density: 0.4
  }),
  cave: Object.assign({}, BASE_THEME, {
    sky: ['#140e24', '#33264d'], far: '#2a2040', near: '#3a2d58',
    farShape: 'rocks', nearShape: null, dark: true,
    grass: '#6b5a9a', grassLight: '#8f7cc4', grassDark: '#4c3f74',
    dirt: '#3f3555', dirtDark: '#2e263f',
    stone: '#5c5470', stoneDark: '#463f58',
    decor: ['glowshroom', 'rocks', 'glowshroom', 'bigtree'], density: 0.28
  }),
  ruins: Object.assign({}, BASE_THEME, {
    sky: ['#5b4a9a', '#ffb070'], far: '#7a6a9a', near: '#5d5a6e',
    farShape: null, nearShape: 'ruins', moon: true,
    grass: '#6aa24a', grassLight: '#8fc46a', grassDark: '#4a7a34',
    dirt: '#6e5a48', dirtDark: '#54443a',
    stone: '#a09ea8', stoneDark: '#7c7a88',
    decor: ['grave', 'grave', 'grass', 'pillar', 'deadbush', 'grass'], density: 0.35
  }),
  castle: Object.assign({}, BASE_THEME, {
    sky: ['#4aa8ff', '#cfeaff'], far: '#8fb0d0', near: '#9a9aa6',
    farShape: 'castle', nearShape: 'wall', clouds: true, sun: true,
    water: '#2a7de1', groundTile: 4,
    decor: ['torch', 'grass', 'barrel', 'banner', 'torch'], density: 0.3
  }),
  bonus: Object.assign({}, BASE_THEME, {
    sky: ['#ff9ad5', '#ffe6a8'], far: '#ffc0e0', near: '#9be08a',
    rainbow: true, clouds: true, nearShape: null,
    decor: ['flower', 'flower', 'grass'], density: 0.5
  })
};

function drawBackdrop(ctx, th, camX, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (th.sun) {
    box(ctx, 800, 44, 64, 64, '#fff3a0');
    box(ctx, 808, 52, 48, 48, '#ffe14d');
  }
  if (th.moon) {
    box(ctx, 780, 60, 60, 60, '#fff6d8');
    box(ctx, 792, 74, 10, 10, '#e8dcb0');
    box(ctx, 816, 94, 8, 8, '#e8dcb0');
    for (let k = 0; k < 30; k++) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + k));
      box(ctx, hash(k) * W, hash(k + 50) * 200, 3, 3, `rgba(255,255,255,${a})`);
    }
  }
  if (th.rainbow) {
    const colors = ['#ff4a4a', '#ff9a3a', '#ffe14d', '#5cd65c', '#4aa8ff', '#9a6aff'];
    ctx.lineWidth = 16;
    colors.forEach((col, i) => {
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(W / 2, H, 420 - i * 16, Math.PI, 0);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  if (th.clouds) {
    for (let i = 0; i < 7; i++) {
      const span = W + 260;
      let cx = (i * 260 - camX * 0.08 - t * 10) % span;
      if (cx < 0) cx += span;
      cx -= 130;
      const cy = 40 + hash(i) * 120;
      box(ctx, cx, cy, 96, 24, 'rgba(255,255,255,0.9)');
      box(ctx, cx + 20, cy - 16, 52, 18, 'rgba(255,255,255,0.9)');
    }
  }
  if (th.dark) {
    // cave roof far away
    const off = camX * 0.15;
    const bw = 40;
    const start = Math.floor(off / bw);
    for (let i = 0; i <= W / bw + 1; i++) {
      const k = start + i;
      const h = 60 + Math.round(hash(k * 0.9) * 5) * 14;
      box(ctx, k * bw - off, 0, bw + 1, h, th.far);
    }
  }
  hillLayer(ctx, th.far, camX * 0.15, 230, 120, 60, 1.3, th.farShape);
  hillLayer(ctx, th.near, camX * 0.35, th.nearShape === 'wall' ? 190 : 140, th.nearShape === 'wall' ? 0 : 90, 40, 7.1, th.nearShape);
}

function hillLayer(ctx, color, off, base, vary, bw, seed, shape) {
  const start = Math.floor(off / bw);
  const n = Math.ceil(W / bw) + 2;
  for (let i = 0; i < n; i++) {
    const k = start + i;
    const x = k * bw - off;
    const v = (hash(k * 0.71 + seed) + (hash((k + 1) * 0.71 + seed) + hash((k - 1) * 0.71 + seed)) * 0.5) / 2;
    const h = base + Math.round(v * vary / 12) * 12;
    if (shape && hash(k * 1.9 + seed) < 0.22) drawFeature(ctx, shape, x + bw / 2, H - h, color, k);
    box(ctx, x, H - h, bw + 1, h, color);
    if (shape === 'wall' && k % 2 === 0) box(ctx, x, H - h - 16, bw / 2 + 1, 16, color);
  }
}

function drawFeature(ctx, shape, x, y, color, k) {
  switch (shape) {
    case 'trees':
      box(ctx, x - 5, y - 30, 10, 30, '#4f8a3a');
      box(ctx, x - 26, y - 76, 52, 48, '#4f9a3a');
      box(ctx, x - 16, y - 92, 32, 18, '#4f9a3a');
      break;
    case 'shrooms':
      box(ctx, x - 8, y - 110, 16, 110, '#e8d8b8');
      box(ctx, x - 44, y - 134, 88, 28, '#e0505a');
      box(ctx, x - 30, y - 148, 60, 16, '#e0505a');
      box(ctx, x - 20, y - 126, 12, 10, '#fff0f0');
      box(ctx, x + 14, y - 140, 10, 8, '#fff0f0');
      break;
    case 'castle':
      box(ctx, x - 22, y - 120, 44, 120, color);
      for (let j = 0; j < 3; j++) box(ctx, x - 22 + j * 17, y - 134, 10, 14, color);
      box(ctx, x - 5, y - 96, 10, 16, '#6a86a8');
      poly(ctx, '#d7262e', [x, y - 170, x + 24, y - 160, x, y - 150]);
      box(ctx, x - 1, y - 170, 2, 36, '#555555');
      break;
    case 'ruins':
      box(ctx, x - 12, y - 60 - hash(k) * 50, 24, 120, color);
      box(ctx, x - 16, y - 64 - hash(k) * 50, 32, 8, color);
      break;
    case 'rocks':
      poly(ctx, color, [x - 30, y, x, y - 90 - hash(k) * 60, x + 30, y]);
      break;
  }
}

// ---------- Tiles ----------

function drawTile(ctx, th, t, c, r, top) {
  const x = c * T, y = r * T, s = T + 0.5;
  const h1 = hash(c * 13.1 + r * 7.7), h2 = hash(c * 3.3 + r * 11.9);
  switch (t) {
    case TILE.DIRT:
      box(ctx, x, y, s, s, th.dirt);
      box(ctx, x + 4 + h1 * 20, y + 12 + h2 * 16, 6, 6, th.dirtDark);
      box(ctx, x + 22 - h2 * 14, y + 4 + h1 * 20, 5, 5, th.dirtDark);
      if (top) {
        box(ctx, x, y, s, 10, th.grass);
        box(ctx, x, y, s, 3, th.grassLight);
        box(ctx, x + 3 + h1 * 10, y + 10, 6, 5, th.grass);
        box(ctx, x + 20 + h2 * 8, y + 10, 5, 4, th.grass);
        box(ctx, x + h2 * 28, y + 6, 5, 3, th.grassDark);
      }
      break;
    case TILE.STONE:
      box(ctx, x, y, s, s, th.stone);
      box(ctx, x + 3, y + 3, 14 + h1 * 6, 10, th.stoneDark);
      box(ctx, x + 18, y + 16, 15, 9 + h2 * 6, th.stoneDark);
      box(ctx, x + 4, y + 22, 8, 8, th.stoneDark);
      box(ctx, x, y, s, 3, 'rgba(255,255,255,0.25)');
      box(ctx, x, y + T - 3, s, 3, 'rgba(0,0,0,0.18)');
      break;
    case TILE.BRICK: {
      box(ctx, x, y, s, s, th.brick);
      box(ctx, x, y + 17, s, 2, th.brickDark);
      box(ctx, x, y + 34, s, 2, th.brickDark);
      const off = r % 2 ? 0 : 18;
      box(ctx, x + off, y, 2, 17, th.brickDark);
      box(ctx, x + (off + 18) % 36, y + 19, 2, 15, th.brickDark);
      if (top) box(ctx, x, y, s, 4, th.brickLight);
      break;
    }
    case TILE.ROCK:
      box(ctx, x, y, s, s, th.rock);
      box(ctx, x + 5 + h1 * 18, y + 6 + h2 * 18, 8, 7, th.rockDark);
      box(ctx, x + 20 - h2 * 10, y + 20 - h1 * 10, 6, 6, th.rockDark);
      break;
    case TILE.PLANK:
      box(ctx, x, y, s, 12, '#b5793a');
      box(ctx, x, y, s, 3, '#d99a55');
      box(ctx, x, y + 10, s, 2, '#7a4f24');
      box(ctx, x + 16, y + 3, 2, 7, '#8a5a2b');
      break;
    case TILE.MUSH:
      box(ctx, x, y, s, 16, '#d7262e');
      box(ctx, x, y, s, 4, '#ff5a50');
      box(ctx, x, y + 16, s, 5, '#f3e2c0');
      box(ctx, x + 5 + h1 * 8, y + 5, 7, 6, '#ffffff');
      box(ctx, x + 22 + h2 * 6, y + 7, 5, 5, '#ffffff');
      break;
  }
}

// ---------- Background decorations (no collision) ----------

function drawDeco(ctx, d, th, t) {
  const x = d.c * T, y = d.r * T;
  const h1 = hash(d.c * 5.3);
  switch (d.type) {
    case 'tree':
      box(ctx, x + 12, y - 70, 12, 70, '#7a4a22');
      box(ctx, x + 16, y - 70, 3, 70, '#946030');
      box(ctx, x - 18, y - 124, 72, 58, '#3faa3a');
      box(ctx, x - 6, y - 142, 48, 20, '#3faa3a');
      box(ctx, x - 10, y - 116, 14, 12, '#2f8a2c');
      box(ctx, x + 26, y - 100, 14, 12, '#2f8a2c');
      box(ctx, x + 8, y - 136, 12, 8, '#5ccc4c');
      break;
    case 'bigtree':
      box(ctx, x + 4, y - 300, 28, 300, '#3a2a1e');
      box(ctx, x + 10, y - 300, 5, 300, '#4a3828');
      box(ctx, x - 10, y - 20, 56, 20, '#3a2a1e');
      box(ctx, x - 40, y - 330, 116, 70, '#2c3d2a');
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 32, y - 200); ctx.lineTo(x + 70, y - 240);
      ctx.moveTo(x + 32, y - 220); ctx.lineTo(x + 70, y - 200);
      ctx.moveTo(x + 40, y - 205); ctx.lineTo(x + 58, y - 228);
      ctx.stroke();
      break;
    case 'bush':
      box(ctx, x + 2, y - 20, 32, 20, '#3e9a2a');
      box(ctx, x + 8, y - 28, 20, 10, '#4caf38');
      box(ctx, x + 12, y - 16, 4, 4, '#e83a3a');
      break;
    case 'flower': {
      const col = ['#ff4a4a', '#ffe14d', '#ffffff', '#ff8ad0'][Math.floor(h1 * 4)];
      box(ctx, x + 16, y - 14, 3, 14, '#2f8f2a');
      box(ctx, x + 12, y - 21, 11, 8, col);
      box(ctx, x + 16, y - 19, 3, 3, '#ffb000');
      break;
    }
    case 'grass':
      box(ctx, x + 6, y - 8, 3, 8, th.grassDark);
      box(ctx, x + 12, y - 12, 3, 12, th.grassDark);
      box(ctx, x + 18, y - 7, 3, 7, th.grassDark);
      break;
    case 'tallgrass':
      box(ctx, x + 4, y - 22, 4, 22, '#3a9a4a');
      box(ctx, x + 12, y - 30, 4, 30, '#4ab85a');
      box(ctx, x + 20, y - 18, 4, 18, '#3a9a4a');
      box(ctx, x + 27, y - 26, 4, 26, '#4ab85a');
      break;
    case 'smallshroom':
      box(ctx, x + 14, y - 14, 8, 14, '#f3e2c0');
      box(ctx, x + 6, y - 24, 24, 11, '#d7262e');
      box(ctx, x + 10, y - 22, 4, 4, '#ffffff');
      box(ctx, x + 21, y - 20, 4, 4, '#ffffff');
      break;
    case 'stem':
      box(ctx, x + T / 2 - 11, y, 22, H, '#f3e2c0');
      box(ctx, x + T / 2 - 5, y, 4, H, '#e2ceaa');
      break;
    case 'barn':
      box(ctx, x, y - 120, 176, 120, '#c62828');
      for (let i = 0; i < 176; i += 22) box(ctx, x + i, y - 120, 3, 120, '#a51e1e');
      poly(ctx, '#7a1a1a', [x - 10, y - 116, x + 88, y - 176, x + 186, y - 116]);
      box(ctx, x + 60, y - 70, 56, 70, '#ffffff');
      box(ctx, x + 66, y - 64, 44, 64, '#a51e1e');
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 66, y - 64); ctx.lineTo(x + 110, y);
      ctx.moveTo(x + 110, y - 64); ctx.lineTo(x + 66, y);
      ctx.stroke();
      box(ctx, x + 74, y - 116, 28, 24, '#ffffff');
      box(ctx, x + 78, y - 112, 20, 18, '#3a1a10');
      break;
    case 'fence':
      box(ctx, x, y - 26, T + 1, 5, '#b07a40');
      box(ctx, x, y - 14, T + 1, 5, '#b07a40');
      box(ctx, x + 2, y - 32, 6, 32, '#9a6630');
      break;
    case 'crop':
      if (h1 < 0.5) {
        for (let i = 0; i < 3; i++) {
          box(ctx, x + 6 + i * 10, y - 26, 3, 26, '#c9a227');
          box(ctx, x + 4 + i * 10, y - 32, 7, 9, '#f0c84a');
        }
      } else {
        for (let i = 0; i < 2; i++) {
          box(ctx, x + 8 + i * 14, y - 14, 4, 14, '#3fb53a');
          box(ctx, x + 4 + i * 14, y - 18, 12, 5, '#3fb53a');
          box(ctx, x + 7 + i * 14, y - 3, 6, 3, '#ff8a1f');
        }
      }
      break;
    case 'hay':
      box(ctx, x + 2, y - 28, 34, 28, '#e8c252');
      box(ctx, x + 2, y - 28, 34, 4, '#f6dc7a');
      box(ctx, x + 2, y - 18, 34, 3, '#c9a227');
      box(ctx, x + 2, y - 8, 34, 3, '#c9a227');
      break;
    case 'web':
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.1 + i * 0.2);
        ctx.moveTo(x + 18, y);
        ctx.lineTo(x + 18 + Math.cos(a) * 60, y + Math.sin(a) * 60);
      }
      for (let rr = 15; rr <= 60; rr += 15) ctx.arc(x + 18, y, rr, 0.3, Math.PI - 0.3);
      ctx.stroke();
      break;
    case 'glowshroom': {
      const glow = 0.25 + Math.sin(t * 2 + d.c) * 0.1;
      ctx.fillStyle = `rgba(120,255,240,${glow})`;
      ctx.beginPath();
      ctx.arc(x + 18, y - 14, 22, 0, Math.PI * 2);
      ctx.fill();
      box(ctx, x + 15, y - 12, 6, 12, '#d8f0ff');
      box(ctx, x + 8, y - 20, 20, 9, '#5ef0e0');
      box(ctx, x + 12, y - 18, 3, 3, '#ffffff');
      break;
    }
    case 'rocks':
      box(ctx, x + 4, y - 12, 18, 12, '#5c5470');
      box(ctx, x + 18, y - 8, 14, 8, '#6c6484');
      break;
    case 'grave':
      box(ctx, x + 8, y - 30, 22, 30, '#8a8a96');
      box(ctx, x + 11, y - 35, 16, 5, '#8a8a96');
      box(ctx, x + 12, y - 24, 14, 3, '#6a6a76');
      box(ctx, x + 12, y - 18, 10, 3, '#6a6a76');
      box(ctx, x + 4, y - 6, 4, 6, '#ffe14d');
      break;
    case 'pillar': {
      const ph = 50 + h1 * 60;
      box(ctx, x + 6, y - ph, 26, ph, '#b0aeb8');
      box(ctx, x + 12, y - ph, 3, ph, '#9a98a4');
      box(ctx, x + 22, y - ph, 3, ph, '#9a98a4');
      box(ctx, x + 2, y - 8, 34, 8, '#9a98a4');
      break;
    }
    case 'deadbush':
      box(ctx, x + 16, y - 20, 3, 20, '#6a4a2a');
      box(ctx, x + 8, y - 16, 10, 3, '#6a4a2a');
      box(ctx, x + 18, y - 12, 10, 3, '#6a4a2a');
      break;
    case 'torch': {
      const f = Math.sin(t * 12 + d.c) * 2;
      box(ctx, x + 16, y - 34, 4, 34, '#6b4a2b');
      box(ctx, x + 12, y - 46 - f, 12, 12 + f, '#ff8a1f');
      box(ctx, x + 15, y - 42 - f, 6, 7 + f, '#ffe14d');
      break;
    }
    case 'barrel':
      box(ctx, x + 6, y - 30, 24, 30, '#8a5a2b');
      box(ctx, x + 6, y - 26, 24, 3, '#555555');
      box(ctx, x + 6, y - 8, 24, 3, '#555555');
      break;
    case 'banner': {
      const wave = Math.sin(t * 3 + d.c) * 2;
      box(ctx, x + 16, y - 110, 4, 110, '#5a3a1a');
      box(ctx, x + 20, y - 104, 26, 40 + wave, '#d7262e');
      box(ctx, x + 20, y - 104, 26, 4, '#ffcc22');
      box(ctx, x + 29, y - 90, 8, 8, '#ffcc22');
      break;
    }
    case 'sign': {
      ctx.font = `bold 16px ${FONT}`;
      const tw = ctx.measureText(d.text).width;
      const bw = tw + 24;
      const bx = x + 18 - bw / 2;
      box(ctx, x + 15, y - 40, 6, 40, '#7a4a22');
      box(ctx, bx, y - 72, bw, 34, '#7a4a22');
      box(ctx, bx + 3, y - 69, bw - 6, 28, '#c08a4a');
      say(ctx, d.text, x + 18, y - 55, 16, '#ffffff');
      break;
    }
  }
}
