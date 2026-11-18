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
  } else if (el === 'earth') {
    box(ctx, -6, -2, 12, 8, '#5a3a1a');
    box(ctx, -4, -5, 8, 4, '#3fb53a');
    box(ctx, -1, -8, 2, 4, '#3fb53a');
  } else if (el === 'galaxy') {
    drawStar(ctx, 0, 0, 8, '#ffcc22');
    box(ctx, 5, -8, 2, 2, sym);
    box(ctx, -7, 5, 2, 2, sym);
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
    case 'icewand':
    case 'earthwand':
    case 'zapwand':
    case 'windwand':
    case 'galaxywand': {
      const galaxy = type === 'galaxywand';
      box(ctx, -2, -24, 4, 32, galaxy ? '#2a1a5a' : '#5a3416');
      box(ctx, -2, -24, 2, 32, galaxy ? '#4a3a8a' : '#7a4a22');
      box(ctx, -4, -28, 8, 5, galaxy ? '#e0e0ff' : '#ffcc22');
      const col = WANDS[type].color;
      if (type === 'icewand') {
        poly(ctx, col, [-6, -28, 6, -28, 0, -44]);
        poly(ctx, '#ffffff', [-2, -30, 2, -30, 0, -40]);
      } else if (type === 'earthwand') {
        box(ctx, -7, -38, 14, 11, '#6a4a2a');
        box(ctx, -5, -40, 10, 14, '#8a6a3a');
        box(ctx, -3, -37, 4, 4, '#3fb53a');
      } else if (type === 'zapwand') {
        poly(ctx, col, [2, -46, -6, -35, -1, -35, -4, -27, 5, -38, 0, -38]);
      } else if (type === 'windwand') {
        box(ctx, -6, -38, 12, 10, col);
        box(ctx, -8, -35, 6, 2, '#ffffff');
        box(ctx, 1, -32, 8, 2, '#ffffff');
      } else if (galaxy) {
        drawStar(ctx, 0, -35, 9, '#ffcc22');
        drawStar(ctx, 0, -35, 4, '#ffffff');
        box(ctx, 6, -44, 2, 2, '#ffb0ff');
        box(ctx, -8, -40, 2, 2, '#7fd6ff');
      } else {
        box(ctx, -5, -37, 10, 10, col);
        box(ctx, -3, -35, 4, 4, '#ffe14d');
      }
      break;
    }
  }
}

// A round black bomb with a fuse, drawn at (0, 0).
function drawBomb(ctx, spin = 0, flash = false) {
  ctx.save();
  ctx.rotate(spin);
  box(ctx, -8, -6, 16, 14, flash ? '#ff3a2a' : '#2a2a34');
  box(ctx, -6, -8, 12, 18, flash ? '#ff3a2a' : '#2a2a34');
  box(ctx, -5, -5, 4, 4, '#6a6a7a');
  box(ctx, -2, -12, 4, 4, '#8a8a96');
  box(ctx, 1, -15, 2, 4, '#c9a46a');
  box(ctx, 2, -18, 4, 4, Math.random() < 0.5 ? '#ffe14d' : '#ff8a1f');
  ctx.restore();
}

// One of Blockie's magic shots, drawn at (0, 0).
function drawShot(ctx, s) {
  if (s.rock) {
    ctx.rotate(s.spin * 0.5);
    box(ctx, -13, -10, 26, 20, '#5a3a1a');
    box(ctx, -10, -13, 20, 26, '#5a3a1a');
    box(ctx, -9, -8, 18, 16, '#a0703a');
    box(ctx, -6, -7, 6, 5, '#e0c080');
    box(ctx, 3, 3, 4, 4, '#3fb53a');
  } else if (s.gust) {
    ctx.strokeStyle = 'rgba(230,255,240,0.9)';
    ctx.lineWidth = 5;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(0, -14 + k * 14, 10 + k * 3, s.spin + k, s.spin + k + 4);
      ctx.stroke();
    }
  } else if (s.el === 'galaxy') {
    ctx.rotate(s.spin * 0.6);
    const r = s.small ? 7 : 11;
    drawStar(ctx, 0, 0, r + 3, '#3a1a8a');
    drawStar(ctx, 0, 0, r, '#ffcc22');
    drawStar(ctx, 0, 0, r * 0.45, '#ffffff');
  } else if (s.el === 'zap' && !s.small) {
    // a crackly bolt that points where it's going
    ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.strokeStyle = '#ffe14d';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-16, 0); ctx.lineTo(-6, -6); ctx.lineTo(2, 4); ctx.lineTo(12, -3);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    drawFireball(ctx, s.el, s.spin, s.small ? 0.65 : 1);
  }
}

// The castle goblin. 24 wide at s = 1.
function drawBomber(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const step = Math.sin(t * 8) * 2;
  box(ctx, -8 + step, -9, 6, 9, c('#4a3a2a'));
  box(ctx, 2 - step, -9, 6, 9, c('#4a3a2a'));
  box(ctx, -11, -22, 22, 14, c('#6a3a8a'));
  box(ctx, -11, -12, 22, 3, c('#3a1a50'));
  box(ctx, -9, -34, 18, 13, c('#6ab04a'));
  box(ctx, -14, -32, 5, 6, c('#6ab04a'));
  box(ctx, 9, -32, 5, 6, c('#6ab04a'));
  box(ctx, -2, -30, 4, 4, '#ffe14d');
  box(ctx, 4, -30, 4, 4, '#ffe14d');
  box(ctx, 0, -29, 2, 2, '#111111');
  box(ctx, 6, -29, 2, 2, '#111111');
  box(ctx, 0, -24, 8, 2, '#2a4a1a');
  box(ctx, -10, -38, 20, 5, c('#9a2a2a'));
  box(ctx, -4, -42, 8, 5, c('#9a2a2a'));
  if (o.windup) {
    box(ctx, 8, -40, 5, 14, c('#6ab04a'));
    ctx.save();
    ctx.translate(10, -46);
    drawBomb(ctx, 0);
    ctx.restore();
  } else {
    box(ctx, 9, -20, 5, 10, c('#6ab04a'));
  }
  ctx.restore();
}

// A giant castle far away in the sky. Used on the menus, the castle levels and the Castle Sky mod.
function drawBigCastle(ctx, off, t, dark) {
  const wall = dark ? '#3a3450' : '#b8bcd0';
  const shade = dark ? '#2a2440' : '#9aa0b8';
  const roof = dark ? '#6a2a5a' : '#d7262e';
  const win = dark ? '#ffcc66' : '#4a5a88';
  const cx = 480 - (off % 1400);
  for (const base of [cx, cx + 1400]) {
    if (base < -500 || base > W + 500) continue;
    const y = H - 150;
    // the big wall
    box(ctx, base - 260, y - 120, 520, 140, wall);
    for (let k = 0; k < 13; k++) box(ctx, base - 260 + k * 40, y - 136, 22, 16, wall);
    box(ctx, base - 260, y - 50, 520, 6, shade);
    // the gate
    box(ctx, base - 40, y - 70, 80, 90, '#4a2a1a');
    box(ctx, base - 30, y - 82, 60, 14, '#4a2a1a');
    for (let k = 0; k < 4; k++) box(ctx, base - 34 + k * 20, y - 66, 4, 86, '#2a1a10');
    // towers with pointy roofs and flags
    for (const [tx, tw, th] of [[-260, 70, 240], [190, 70, 240], [-110, 60, 300], [50, 60, 300], [-30, 60, 360]]) {
      const x = base + tx, top = y + 20 - th;
      box(ctx, x, top, tw, th, wall);
      box(ctx, x + tw - 10, top, 10, th, shade);
      poly(ctx, roof, [x - 10, top, x + tw + 10, top, x + tw / 2, top - 70]);
      box(ctx, x + tw / 2 - 1, top - 100, 3, 32, '#555555');
      const wave = Math.sin(t * 4 + tx) * 3;
      poly(ctx, '#ffcc22', [x + tw / 2 + 2, top - 100, x + tw / 2 + 30, top - 92 + wave, x + tw / 2 + 2, top - 84]);
      for (let k = 0; k < Math.floor(th / 70); k++) {
        box(ctx, x + tw / 2 - 7, top + 30 + k * 60, 14, 22, win);
        box(ctx, x + tw / 2 - 7, top + 30 + k * 60, 14, 6, roof);
      }
    }
  }
}

// Bedrock: dark speckled stone with a glowing blue crystal.
const BEDROCK_COLORS = { main: '#3a3a42', light: '#5a5a66', dark: '#1e1e24', gem: '#7fd6ff' };

function drawShield(ctx, x, y, s, bedrock = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (bedrock) {
    const b = BEDROCK_COLORS;
    box(ctx, -1, -1, 14, 20, b.light);
    box(ctx, 1, 1, 10, 16, b.main);
    box(ctx, 2, 3, 3, 3, b.dark);
    box(ctx, 7, 12, 3, 3, b.dark);
    box(ctx, 4, 6, 4, 5, b.gem);
    box(ctx, 4, 6, 2, 2, '#ffffff');
  } else {
    box(ctx, 0, 0, 12, 18, '#ffcc22');
    box(ctx, 2, 2, 8, 14, '#d7262e');
    box(ctx, 5, 3, 2, 12, '#ffcc22');
    box(ctx, 3, 7, 6, 2, '#ffcc22');
  }
  ctx.restore();
}

function drawArmorIcon(ctx, type, x, y, s = 1, bedrock = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const b = BEDROCK_COLORS;
  if (bedrock && type === 'helmet') {
    box(ctx, -11, -10, 22, 18, b.main);
    box(ctx, -11, -10, 22, 3, b.light);
    box(ctx, -6, -2, 14, 5, b.dark);
    box(ctx, -8, -6, 3, 3, b.dark);
    box(ctx, -2, -16, 4, 6, b.gem);
  } else if (bedrock && type === 'chest') {
    box(ctx, -15, -10, 6, 7, b.main);
    box(ctx, 9, -10, 6, 7, b.main);
    box(ctx, -10, -10, 20, 19, b.main);
    box(ctx, -10, -10, 20, 3, b.light);
    box(ctx, -8, 2, 4, 3, b.dark);
    box(ctx, 4, -5, 3, 3, b.dark);
    box(ctx, -3, -5, 6, 6, b.gem);
  } else if (bedrock && type === 'shield') {
    drawShield(ctx, -9, -12, 1.4, true);
  } else if (type === 'helmet') {
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
  const bed = a.bedrock || {};
  const B = BEDROCK_COLORS;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (o.spin) {
    ctx.translate(0, -18);
    ctx.rotate(o.spin);
    ctx.translate(0, 18);
  }
  ctx.scale(o.facing || 1, 1);
  // Rainbow Blockie mod: the colors keep changing
  if (o.rainbow !== null && o.rainbow !== undefined) ctx.filter = `hue-rotate(${Math.round(o.rainbow * 240) % 360}deg)`;

  if (o.boost) {
    box(ctx, -26, -26, 10, 3, 'rgba(255,255,255,0.7)');
    box(ctx, -30, -16, 12, 3, 'rgba(255,255,255,0.7)');
  }

  const step = o.walk ? Math.sin(o.walk * 0.07) : 0;
  const legL = o.air ? -3 : step * 3;
  const legR = o.air ? 2 : -step * 3;

  if (a.shield && !o.blocking) drawShield(ctx, -17, -30, 0.8, bed.shield);

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
  if (a.chest && bed.chest) {
    box(ctx, -11, -24, 22, 12, B.main);
    box(ctx, -11, -24, 22, 2, B.light);
    box(ctx, -8, -16, 3, 3, B.dark);
    box(ctx, 5, -21, 3, 3, B.dark);
    box(ctx, -2, -21, 5, 5, B.gem);
  } else if (a.chest) {
    box(ctx, -9, -23, 18, 10, '#d5dde3');
    box(ctx, -9, -23, 18, 2, '#ffffff');
    box(ctx, -2, -20, 4, 4, '#d7262e');
  }
  if (a.extra > 0) {
    box(ctx, -12, -25, 6, 6, '#ffcc22');
    box(ctx, 6, -25, 6, 6, '#ffcc22');
  }

  // head (red helmet with a visor and friendly eyes)
  ctx.save();
  if (o.bighead) {
    // Big Head mod: grow the head from the neck
    ctx.translate(0, -24);
    ctx.scale(1.8, 1.8);
    ctx.translate(0, 24);
  }
  box(ctx, -10, -39, 20, 16, '#e0342f');
  box(ctx, -10, -39, 20, 3, '#ff6a5a');
  box(ctx, -3, -33, 13, 6, '#2a1418');
  box(ctx, 1, -32, 3, 3, '#ffffff');
  box(ctx, 6, -32, 3, 3, '#ffffff');
  if (a.helmet && bed.helmet) {
    box(ctx, -11, -43, 22, 8, B.main);
    box(ctx, -11, -43, 22, 2, B.light);
    box(ctx, -12, -37, 4, 12, B.main);
    box(ctx, -6, -40, 3, 3, B.dark);
    box(ctx, 4, -41, 4, 3, B.dark);
    box(ctx, -2, -50, 5, 7, B.gem);
    box(ctx, -2, -50, 2, 2, '#ffffff');
  } else if (a.helmet) {
    box(ctx, -11, -41, 22, 4, '#d5dde3');
    box(ctx, -5, -49, 6, 8, '#ffcc22');
    box(ctx, -9, -47, 4, 5, '#ffcc22');
  } else {
    box(ctx, -2, -43, 4, 4, '#b01818');
  }
  ctx.restore();

  // arm and weapon
  const weapon = o.weapon || 'none';
  const sw = o.swing === undefined ? -1 : o.swing;
  let ang = 0.35, hx = 8, hy = -16;
  if (sw >= 0) {
    if (weapon === 'spear') { ang = Math.PI / 2; hx = 4 + Math.sin(sw * Math.PI) * 24; hy = -18; }
    else if (WANDS[weapon]) { ang = 1.35; hx = 10; hy = -20; }
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

  if (a.shield && o.blocking) drawShield(ctx, 8, -36, 1.2, bed.shield);

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

// body, dark, belly, wing
const DRAGON_COLORS = {
  fire:   ['#d7262e', '#9a1414', '#ffcc22', '#ff7a3a'],
  ice:    ['#4aa8ff', '#2a6ac0', '#e0f6ff', '#9ad8ff'],
  zap:    ['#f0c020', '#a07a00', '#fff3a0', '#5a4aff'],
  wind:   ['#4cc08a', '#2a7a54', '#d8ffe8', '#a8f0d0'],
  earth:  ['#a0703a', '#5a3a1a', '#e0c080', '#3fb53a'],
  galaxy: ['#6a3ac0', '#3a1a8a', '#ffb0ff', '#b05aff']
};

// Dragons fly. At s = 1 they are about 52 wide. o.el picks the colors.
function drawDragon(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  const ice = o.el === 'ice';
  const k = DRAGON_COLORS[o.el] || DRAGON_COLORS.fire;
  const body = k[0], dark = k[1], belly = k[2], wing = k[3];
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

// Dinos walk on two legs. At s = 1 the body is about 48 wide. o.el picks the colors.
const DINO_COLORS = {
  fire: { body: '#e0502a', dark: '#9a2a14', belly: '#ffcc22', spike: '#ffe14d' },
  ice:  { body: '#4aa8ff', dark: '#2a6ac0', belly: '#e0f6ff', spike: '#ffffff' },
  zap:  { body: '#f0c020', dark: '#a07a00', belly: '#fff3a0', spike: '#5a4aff' },
  wind: { body: '#4cc08a', dark: '#2a7a54', belly: '#d8ffe8', spike: '#ffffff' }
};

function drawDino(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  const k = DINO_COLORS[o.el || 'fire'];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const step = o.still ? 0 : Math.sin(t * 7) * 3;
  const sway = Math.sin(t * 3) * 2;
  // tail
  box(ctx, -40, -30 + sway, 12, 6, c(k.body));
  box(ctx, -30, -34 + sway / 2, 14, 10, c(k.body));
  // legs
  box(ctx, -14 + step, -12, 10, 12, c(k.dark));
  box(ctx, 4 - step, -12, 10, 12, c(k.dark));
  box(ctx, -14 + step, -3, 13, 3, c(k.dark));
  box(ctx, 4 - step, -3, 13, 3, c(k.dark));
  // body and back spikes
  box(ctx, -18, -38, 34, 28, c(k.body));
  box(ctx, -6, -28, 20, 16, c(k.belly));
  for (let i = 0; i < 4; i++) box(ctx, -16 + i * 8, -42, 5, 4, c(k.spike));
  // tiny arms
  box(ctx, 14, -28, 7, 3, c(k.dark));
  box(ctx, 18, -28, 3, 6, c(k.dark));
  // neck and head
  box(ctx, 6, -46, 14, 14, c(k.body));
  const jaw = o.roar ? 6 : 0;
  box(ctx, 8, -56, 30, 14, c(k.body));
  if (o.roar) {
    box(ctx, 14, -42, 22, jaw, '#5a0a0a');
    box(ctx, 34, -43, 6, 6, k.spike);
  }
  box(ctx, 12, -42 + jaw, 24, 6, c(k.body));
  box(ctx, 26, -42, 3, 3, '#ffffff');
  box(ctx, 32, -42, 3, 3, '#ffffff');
  box(ctx, 22, -54, 6, 6, '#ffffff');
  box(ctx, 25, -53, 3, 4, '#111111');
  box(ctx, 35, -54, 2, 2, '#2a0a0a');
  box(ctx, 10, -60, 4, 4, c(k.spike));
  box(ctx, 17, -60, 4, 4, c(k.spike));
  if (o.crown) {
    box(ctx, 9, -64, 22, 6, '#ffcc22');
    box(ctx, 9, -68, 4, 4, '#ffcc22');
    box(ctx, 18, -68, 4, 4, '#ffcc22');
    box(ctx, 27, -68, 4, 4, '#ffcc22');
    box(ctx, 18, -63, 4, 3, '#d7262e');
  }
  ctx.restore();
}

// The Big Yeti: a furry snow monster about 52 wide at s = 1.
function drawYeti(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  const fur = '#f2f6ff', shade = '#c8d6ea';
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const step = o.still ? 0 : Math.sin(t * 5) * 2;
  box(ctx, -15 + step, -12, 11, 12, c(shade));
  box(ctx, 4 - step, -12, 11, 12, c(shade));
  box(ctx, -16 + step, -4, 13, 4, c('#8aa8c8'));
  box(ctx, 3 - step, -4, 13, 4, c('#8aa8c8'));
  box(ctx, -20, -42, 40, 32, c(fur));
  box(ctx, -20, -14, 40, 4, c(shade));
  box(ctx, -12, -36, 24, 20, c('#dfe8f6'));
  box(ctx, -26, -40, 8, 26, c(shade));
  if (o.windup) {
    box(ctx, 18, -62, 8, 22, c(shade));
    box(ctx, 15, -72, 14, 12, '#ffffff');
  } else {
    box(ctx, 18, -40, 8, 26, c(shade));
  }
  box(ctx, -14, -58, 28, 18, c(fur));
  box(ctx, -8, -55, 20, 13, c('#7aa8e0'));
  box(ctx, -4, -53, 5, 5, '#ffffff');
  box(ctx, 6, -53, 5, 5, '#ffffff');
  box(ctx, -2, -52, 3, 3, '#111111');
  box(ctx, 8, -52, 3, 3, '#111111');
  if (o.angry) {
    box(ctx, -5, -56, 7, 2, '#1a2a4a');
    box(ctx, 5, -56, 7, 2, '#1a2a4a');
  }
  box(ctx, -1, -46, 11, 3, '#1a2a4a');
  box(ctx, 0, -46, 2, 2, '#ffffff');
  box(ctx, 7, -46, 2, 2, '#ffffff');
  box(ctx, -16, -64, 4, 8, c('#c8b890'));
  box(ctx, 12, -64, 4, 8, c('#c8b890'));
  ctx.restore();
}

// The Bedrock Golem: a walking pile of bedrock with lava glowing inside. 48 wide at s = 1.
function drawGolem(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  const B = BEDROCK_COLORS;
  const glow = Math.sin(t * 4) > 0 ? '#ffe14d' : '#ff8a1f';
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const step = o.still ? 0 : Math.sin(t * 4) * 2;
  box(ctx, -18 + step, -16, 14, 16, c(B.main));
  box(ctx, 4 - step, -16, 14, 16, c(B.main));
  box(ctx, -24, -48, 48, 34, c(B.main));
  box(ctx, -24, -48, 48, 4, c(B.light));
  box(ctx, -20, -40, 5, 5, c(B.dark));
  box(ctx, 12, -26, 6, 5, c(B.dark));
  box(ctx, -12, -22, 4, 4, c(B.dark));
  // lava cracks and a glowing heart
  box(ctx, -14, -42, 3, 14, '#ff5a1f');
  box(ctx, 14, -44, 3, 10, '#ff5a1f');
  box(ctx, -6, -36, 12, 12, '#ff5a1f');
  box(ctx, -3, -33, 6, 6, glow);
  // arms: up high when getting ready to attack
  if (o.windup) {
    box(ctx, -34, -78, 12, 32, c(B.main));
    box(ctx, 22, -78, 12, 32, c(B.main));
    box(ctx, -36, -88, 16, 12, c(B.light));
    box(ctx, 20, -88, 16, 12, c(B.light));
  } else {
    box(ctx, -34, -46, 12, 30, c(B.main));
    box(ctx, 22, -46, 12, 30, c(B.main));
    box(ctx, -36, -20, 16, 12, c(B.light));
    box(ctx, 20, -20, 16, 12, c(B.light));
  }
  box(ctx, -12, -62, 24, 16, c(B.main));
  box(ctx, -12, -62, 24, 3, c(B.light));
  box(ctx, -7, -56, 5, 4, o.angry ? '#ff3a2a' : '#ffe14d');
  box(ctx, 3, -56, 5, 4, o.angry ? '#ff3a2a' : '#ffe14d');
  box(ctx, -1, -66, 6, 5, B.gem);
  ctx.restore();
}

// The Storm King: a cloud giant with a lightning crown. 32 wide at s = 1.
function drawStormKing(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const puff = Math.sin(t * 4) * 1.5;
  // a storm cloud instead of legs
  if (o.flying) {
    box(ctx, -20, -12 - puff, 40, 12, c('#6a7488'));
    box(ctx, -14, -18, 28, 8, c('#8a94a8'));
    if (Math.sin(t * 13) > 0.6) poly(ctx, '#ffe14d', [-4, -4, 2, -4, -2, 6, 4, 6, -6, 18, -2, 8, -6, 8]);
  } else {
    box(ctx, -10, -12, 8, 12, c('#4a4a6a'));
    box(ctx, 2, -12, 8, 12, c('#4a4a6a'));
  }
  // robe and cape
  box(ctx, -18, -40, 6, 28, c('#2a3a8a'));
  box(ctx, -14, -42, 28, 30, c('#3a5ac0'));
  box(ctx, -14, -42, 28, 4, c('#6a8ae0'));
  box(ctx, -3, -40, 6, 28, c('#ffe14d'));
  box(ctx, -14, -24, 28, 3, c('#ffe14d'));
  // arm holding a lightning staff
  const up = o.windup ? -14 : 0;
  box(ctx, 12, -40 + up, 6, 16, c('#3a5ac0'));
  box(ctx, 17, -60 + up, 3, 40, '#9aa6ae');
  poly(ctx, '#ffe14d', [18, -76 + up, 12, -64 + up, 17, -64 + up, 14, -56 + up, 24, -68 + up, 19, -68 + up]);
  // head with a big cloud beard
  box(ctx, -9, -56, 18, 14, c('#ffd8b0'));
  box(ctx, -12, -48, 24, 12, c('#e8eef8'));
  box(ctx, -8, -38, 16, 6, c('#e8eef8'));
  box(ctx, -4, -53, 3, 3, o.angry ? '#ff3a2a' : '#2a6ad0');
  box(ctx, 4, -53, 3, 3, o.angry ? '#ff3a2a' : '#2a6ad0');
  if (o.angry) {
    box(ctx, -6, -56, 6, 2, '#2a2a3a');
    box(ctx, 3, -56, 6, 2, '#2a2a3a');
  }
  // crown with lightning points
  box(ctx, -10, -62, 20, 6, '#ffcc22');
  poly(ctx, '#ffe14d', [-10, -62, -6, -72, -4, -62]);
  poly(ctx, '#ffe14d', [-2, -62, 1, -76, 4, -62]);
  poly(ctx, '#ffe14d', [5, -62, 9, -72, 10, -62]);
  box(ctx, -1, -60, 3, 3, '#7fd6ff');
  ctx.restore();
}

// The Galaxy Wizard: a tall wizard in a starry robe. 28 wide at s = 1.
function drawWizard(ctx, x, y, dir, s, t, flash, o = {}) {
  const c = (col) => (flash ? '#ffffff' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * s, s);
  const step = o.still ? 0 : Math.sin(t * 6) * 2;
  box(ctx, -8 + step, -4, 7, 4, c('#2a1a4a'));
  box(ctx, 2 - step, -4, 7, 4, c('#2a1a4a'));
  // robe with stars
  poly(ctx, c('#3a1a8a'), [-14, -4, 14, -4, 9, -38, -9, -38]);
  box(ctx, -9, -38, 18, 4, c('#5a3ac0'));
  for (const [sx, sy] of [[-6, -12], [5, -20], [-3, -28], [7, -8]]) {
    drawStar(ctx, sx, sy, 2.5 + Math.abs(Math.sin(t * 3 + sx)) * 1.2, '#ffcc22');
  }
  // arm and star staff
  const up = o.windup ? -10 : 0;
  box(ctx, 8, -36 + up, 6, 14, c('#3a1a8a'));
  box(ctx, 13, -54 + up, 3, 52, '#8a5a2b');
  const glow = 6 + Math.sin(t * 8) * 1.5;
  ctx.fillStyle = 'rgba(255,176,255,0.45)';
  ctx.beginPath();
  ctx.arc(14.5, -58 + up, glow + 4, 0, Math.PI * 2);
  ctx.fill();
  drawStar(ctx, 14.5, -58 + up, glow, '#ffe14d');
  // face and beard
  box(ctx, -6, -48, 12, 10, c('#ffd8b0'));
  box(ctx, -7, -42, 14, 14, c('#f0f0ff'));
  box(ctx, -4, -30, 8, 4, c('#f0f0ff'));
  box(ctx, -3, -46, 2, 2, o.angry ? '#ff3a2a' : '#5a2a9a');
  box(ctx, 3, -46, 2, 2, o.angry ? '#ff3a2a' : '#5a2a9a');
  // the tall hat
  box(ctx, -11, -50, 22, 4, c('#5a3ac0'));
  poly(ctx, c('#3a1a8a'), [-8, -50, 8, -50, 3, -72, -6, -80]);
  drawStar(ctx, -1, -60, 3, '#ffcc22');
  box(ctx, -8, -82, 4, 4, '#ffcc22');
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
  jungle: Object.assign({}, BASE_THEME, {
    sky: ['#ffb36a', '#fff0b0'], far: '#8a6a5a', near: '#3f8a3a',
    farShape: 'volcano', nearShape: 'palms', sun: true,
    grass: '#4caf38', grassLight: '#7ed65a', grassDark: '#2f7a24',
    dirt: '#8a5a34', dirtDark: '#6a4224',
    decor: ['fern', 'fern', 'palm', 'dinoegg', 'grass', 'fossil'], density: 0.38
  }),
  snow: Object.assign({}, BASE_THEME, {
    sky: ['#8ab8e8', '#eef6ff'], far: '#c8daf0', near: '#a8c0dc',
    farShape: 'peaks', nearShape: 'pines', snow: true, clouds: true,
    grass: '#f4f8ff', grassLight: '#ffffff', grassDark: '#c8d8ea',
    dirt: '#7a6a5a', dirtDark: '#5e5044',
    stone: '#b8c8dc', stoneDark: '#94a8c0',
    decor: ['pine', 'pine', 'snowman', 'icerock', 'grass'], density: 0.32
  }),
  deep: Object.assign({}, BASE_THEME, {
    sky: ['#120a0a', '#3a1a10'], far: '#2a1a1a', near: '#3a2a2a',
    farShape: 'crystals', nearShape: null, dark: true,
    lava: '#ff5a1f', groundTile: 6,
    rock: '#3a3a42', rockDark: '#1e1e24',
    stone: '#4a4a52', stoneDark: '#2e2e36',
    decor: ['crystal', 'lavarock', 'crystal', 'rocks'], density: 0.3
  }),
  // The menus: green grass in front of a giant castle
  grounds: Object.assign({}, BASE_THEME, {
    sun: true, clouds: true, bigCastle: true, nearShape: 'trees', far: '#a8d898',
    decor: ['flower', 'grass'], density: 0.3
  }),
  // Level 9: a stormy castle up in the clouds
  storm: Object.assign({}, BASE_THEME, {
    sky: ['#3a4a6a', '#8a9ab8'], far: '#6a7a98', near: '#5a6a88',
    farShape: 'castle', nearShape: 'wall', clouds: true, storm: true, bigCastle: true,
    groundTile: 4, brick: '#8a8aa0', brickDark: '#6a6a80', brickLight: '#aaaabf',
    decor: ['torch', 'banner', 'barrel', 'torch'], density: 0.3
  }),
  // Level 10: a castle with lava instead of water
  lavakeep: Object.assign({}, BASE_THEME, {
    sky: ['#4a1a1a', '#ff8a4a'], far: '#6a3030', near: '#5a3a3a',
    farShape: 'volcano', nearShape: 'wall', lava: '#ff5a1f', bigCastle: true,
    groundTile: 4, brick: '#7a5a5a', brickDark: '#5a3a3a', brickLight: '#9a7a70',
    decor: ['torch', 'lavarock', 'banner', 'crystal'], density: 0.3
  }),
  // Level 11: a tower out in space
  galaxy: Object.assign({}, BASE_THEME, {
    sky: ['#0a0420', '#3a1a6a'], far: '#2a1a5a', near: '#3a2a6a',
    farShape: 'crystals', nearShape: null, stars: true, planet: true, bigCastle: true,
    groundTile: 4, brick: '#5a4a8a', brickDark: '#3a2a6a', brickLight: '#8a7ac0',
    stone: '#6a5aa0', stoneDark: '#4a3a80',
    decor: ['crystal', 'torch', 'crystal', 'banner'], density: 0.3
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
  if (th.stars) {
    for (let k = 0; k < 90; k++) {
      const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + k * 1.7));
      const sx = ((hash(k) * W - camX * 0.03) % W + W) % W;
      box(ctx, sx, hash(k + 40) * 380, k % 7 === 0 ? 4 : 2, k % 7 === 0 ? 4 : 2, `rgba(255,255,255,${a})`);
    }
  }
  if (th.planet) {
    box(ctx, 720, 50, 110, 110, '#b05aff');
    box(ctx, 730, 60, 40, 30, '#d08aff');
    box(ctx, 780, 120, 30, 20, '#8a3ad0');
    box(ctx, 680, 100, 190, 10, 'rgba(255,200,120,0.8)');
  }
  if (th.storm && Math.sin(t * 0.9) > 0.985) {
    // a flash of lightning far away
    box(ctx, 0, 0, W, H, 'rgba(255,255,230,0.35)');
  }
  hillLayer(ctx, th.far, camX * 0.15, 230, 120, 60, 1.3, th.farShape);
  if (th.bigCastle || modOn('castle')) drawBigCastle(ctx, camX * 0.1, t, th.dark || th.stars || th.storm);
  if (th.snow) {
    // snowflakes drifting down
    for (let k = 0; k < 50; k++) {
      const fx = (hash(k) * W + Math.sin(t + k) * 20 - camX * 0.3) % W;
      const fy = (hash(k + 9) * H + t * (30 + hash(k + 4) * 40)) % H;
      box(ctx, fx < 0 ? fx + W : fx, fy, 4, 4, 'rgba(255,255,255,0.85)');
    }
  }
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
    case 'volcano':
      poly(ctx, color, [x - 90, y, x - 22, y - 130, x + 22, y - 130, x + 90, y]);
      box(ctx, x - 22, y - 134, 44, 6, '#ff5a1f');
      box(ctx, x - 10, y - 154, 20, 16, 'rgba(120,110,110,0.5)');
      box(ctx, x - 4, y - 176, 26, 18, 'rgba(120,110,110,0.35)');
      break;
    case 'palms':
      box(ctx, x - 3, y - 70, 6, 70, '#7a5a32');
      box(ctx, x - 30, y - 76, 60, 8, '#2f7a24');
      box(ctx, x - 20, y - 84, 40, 8, '#3f9a32');
      box(ctx, x - 36, y - 68, 10, 10, '#2f7a24');
      box(ctx, x + 26, y - 68, 10, 10, '#2f7a24');
      break;
    case 'peaks':
      poly(ctx, color, [x - 80, y, x, y - 150 - hash(k) * 50, x + 80, y]);
      poly(ctx, '#ffffff', [x - 24, y - 105 - hash(k) * 35, x, y - 150 - hash(k) * 50, x + 24, y - 105 - hash(k) * 35]);
      break;
    case 'pines':
      box(ctx, x - 4, y - 16, 8, 16, '#6a5040');
      poly(ctx, '#5a8a6a', [x - 26, y - 14, x, y - 90, x + 26, y - 14]);
      poly(ctx, '#ffffff', [x - 10, y - 60, x, y - 90, x + 10, y - 60]);
      break;
    case 'crystals':
      poly(ctx, '#4a7aa8', [x - 14, y, x - 4, y - 70 - hash(k) * 40, x + 8, y]);
      poly(ctx, '#7fd6ff', [x - 6, y, x - 4, y - 70 - hash(k) * 40, x, y]);
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
    case 'fern':
      box(ctx, x + 16, y - 18, 3, 18, '#2f7a24');
      box(ctx, x + 4, y - 22, 14, 4, '#3f9a32');
      box(ctx, x + 18, y - 26, 14, 4, '#3f9a32');
      box(ctx, x + 6, y - 12, 12, 4, '#4caf38');
      box(ctx, x + 18, y - 16, 12, 4, '#4caf38');
      break;
    case 'palm':
      box(ctx, x + 14, y - 110, 9, 110, '#8a6a3a');
      for (let k = 0; k < 5; k++) box(ctx, x + 14, y - 100 + k * 22, 9, 3, '#6a4a22');
      box(ctx, x - 22, y - 118, 80, 10, '#3f9a32');
      box(ctx, x - 8, y - 128, 52, 10, '#4caf38');
      box(ctx, x - 30, y - 108, 14, 14, '#3f9a32');
      box(ctx, x + 52, y - 108, 14, 14, '#3f9a32');
      box(ctx, x + 10, y - 108, 8, 8, '#6a4a22');
      box(ctx, x + 20, y - 106, 8, 8, '#6a4a22');
      break;
    case 'dinoegg':
      box(ctx, x + 2, y - 8, 32, 8, '#c9a227');
      box(ctx, x + 10, y - 28, 16, 24, '#f6efd8');
      box(ctx, x + 7, y - 22, 22, 14, '#f6efd8');
      box(ctx, x + 12, y - 22, 4, 4, '#4cc08a');
      box(ctx, x + 20, y - 14, 5, 4, '#4cc08a');
      break;
    case 'fossil':
      box(ctx, x + 4, y - 6, 28, 4, '#f2f0e6');
      for (let k = 0; k < 4; k++) box(ctx, x + 8 + k * 6, y - 14, 3, 8, '#f2f0e6');
      box(ctx, x + 26, y - 12, 8, 8, '#f2f0e6');
      break;
    case 'pine':
      box(ctx, x + 14, y - 20, 8, 20, '#6a5040');
      poly(ctx, '#2f6a4a', [x - 10, y - 18, x + 18, y - 70, x + 46, y - 18]);
      poly(ctx, '#3a7a5a', [x - 4, y - 44, x + 18, y - 96, x + 40, y - 44]);
      poly(ctx, '#ffffff', [x + 8, y - 78, x + 18, y - 96, x + 28, y - 78]);
      box(ctx, x - 6, y - 22, 14, 4, '#ffffff');
      box(ctx, x + 30, y - 22, 14, 4, '#ffffff');
      break;
    case 'snowman':
      box(ctx, x + 6, y - 24, 24, 24, '#ffffff');
      box(ctx, x + 10, y - 42, 16, 18, '#ffffff');
      box(ctx, x + 13, y - 36, 3, 3, '#111111');
      box(ctx, x + 20, y - 36, 3, 3, '#111111');
      box(ctx, x + 22, y - 32, 8, 3, '#ff8a1f');
      box(ctx, x + 9, y - 26, 18, 4, '#d7262e');
      box(ctx, x + 10, y - 50, 16, 8, '#2a2a30');
      box(ctx, x + 6, y - 43, 24, 2, '#2a2a30');
      break;
    case 'icerock':
      box(ctx, x + 4, y - 18, 26, 18, '#bff6ff');
      box(ctx, x + 10, y - 26, 14, 10, '#d8faff');
      box(ctx, x + 8, y - 16, 4, 10, '#ffffff');
      break;
    case 'crystal': {
      const glow = 0.22 + Math.sin(t * 2 + d.c) * 0.08;
      ctx.fillStyle = `rgba(127,214,255,${glow})`;
      ctx.beginPath();
      ctx.arc(x + 18, y - 16, 24, 0, Math.PI * 2);
      ctx.fill();
      poly(ctx, '#4a9ad0', [x + 8, y, x + 12, y - 30, x + 18, y]);
      poly(ctx, '#7fd6ff', [x + 14, y, x + 20, y - 40, x + 26, y]);
      poly(ctx, '#bff6ff', [x + 22, y, x + 28, y - 22, x + 32, y]);
      break;
    }
    case 'lavarock': {
      const f = Math.sin(t * 3 + d.c) > 0 ? '#ffe14d' : '#ff8a1f';
      box(ctx, x + 4, y - 16, 28, 16, '#2e2e36');
      box(ctx, x + 10, y - 22, 16, 8, '#3a3a42');
      box(ctx, x + 12, y - 12, 4, 6, '#ff5a1f');
      box(ctx, x + 20, y - 8, 6, 3, f);
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
