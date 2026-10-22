// The five levels of the Blockie Forest, plus the bonus rounds.
//
// Levels are built with simple helper calls. The map is 15 tiles tall:
// row 0 is the top of the screen and row 14 is the bottom.
// Normal ground starts at row 12. Columns count from the left, starting at 0.
//
// Handy numbers: Blockie can jump about 3 tiles up and 4 tiles across.

const T = 36;        // size of one tile in pixels
const ROWS = 15;
const GROUND = 12;

const TILE = { EMPTY: 0, DIRT: 1, STONE: 2, PLANK: 3, BRICK: 4, MUSH: 5, ROCK: 6 };

function isSolid(t) {
  return t === TILE.DIRT || t === TILE.STONE || t === TILE.BRICK || t === TILE.ROCK;
}

// Platforms you can jump up through from below.
function isOneWay(t) {
  return t === TILE.PLANK || t === TILE.MUSH;
}

class LevelBuilder {
  constructor(cols) {
    this.cols = cols;
    this.map = new Uint8Array(cols * ROWS);
    this.items = [];
    this.enemies = [];
    this.decos = [];
    this.checkpoints = [];
    this.elephants = [];
    this.bossInfo = null;
    this.flagCol = null;
    this.spawnCol = 2;
  }

  set(c, r, t) {
    if (c >= 0 && c < this.cols && r >= 0 && r < ROWS) this.map[r * this.cols + c] = t;
  }

  get(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= ROWS) return TILE.EMPTY;
    return this.map[r * this.cols + c];
  }

  // Solid ground from column c1 to column c2.
  ground(c1, c2, t = TILE.DIRT) {
    for (let c = c1; c <= c2; c++) for (let r = GROUND; r < ROWS; r++) this.set(c, r, t);
  }

  // Rock along the top of the screen, for caves.
  ceiling(c1, c2, depth = 2) {
    for (let c = c1; c <= c2; c++) for (let r = 0; r < depth; r++) this.set(c, r, TILE.ROCK);
  }

  // A solid block. (c, r) is its top-left tile.
  block(c, r, w = 1, h = 1, t = TILE.STONE) {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) this.set(c + i, r + j, t);
  }

  // A thin platform you can jump up through.
  plat(c, r, w, t = TILE.PLANK) {
    for (let i = 0; i < w; i++) this.set(c + i, r, t);
  }

  // A giant mushroom: a red cap to stand on with a stem below it.
  mushroom(c, r, w) {
    this.decos.push({ type: 'stem', c: c + (w - 1) / 2, r: r + 1 });
    this.plat(c, r, w, TILE.MUSH);
  }

  // Items float in the middle of tile (c, r). Default is just above the ground.
  item(type, c, r = GROUND - 1) {
    this.items.push({ type, c, r });
  }

  coins(c, r, n, type = 'coin') {
    for (let i = 0; i < n; i++) this.item(type, c + i, r);
  }

  // Enemies stand on top of row r (the ground, unless you say otherwise).
  enemy(type, c, opts = {}) {
    this.enemies.push({ type, c, r: opts.r === undefined ? GROUND : opts.r, opts });
  }

  // A group of small mob creatures that run together.
  mob(c, n) {
    for (let i = 0; i < n; i++) this.enemy('mob', c + i * 0.8);
  }

  // A castle gate checkpoint (2 tiles wide).
  checkpoint(c) {
    this.checkpoints.push({ c, r: GROUND });
  }

  // A friendly elephant that walks between columns c1 and c2.
  elephant(c1, c2) {
    this.elephants.push({ c1, c2 });
  }

  deco(type, c, r = GROUND, extra = {}) {
    this.decos.push(Object.assign({ type, c, r }, extra));
  }

  sign(c, text) {
    this.deco('sign', c, GROUND, { text });
  }

  // A farm: a red barn, then fences and crops.
  farm(c1, c2) {
    this.deco('barn', c1);
    for (let c = c1 + 5; c <= c2; c++) this.deco('fence', c);
    for (let c = c1 + 5; c <= c2; c++) this.deco(c % 5 === 0 ? 'hay' : 'crop', c);
  }

  // The boss room starts at arenaCol (one screen wide). The boss stands at bossCol.
  boss(type, arenaCol, bossCol) {
    this.bossInfo = { type, arenaCol, bossCol };
  }

  flag(c) { this.flagCol = c; }
  spawn(c) { this.spawnCol = c; }

  // Sprinkle small decorations (flowers, grass, trees...) on empty ground.
  decorate(list, density, seed) {
    const used = new Set(this.decos.map((d) => Math.floor(d.c)));
    for (const cp of this.checkpoints) { used.add(cp.c); used.add(cp.c + 1); }
    for (let c = 1; c < this.cols - 1; c++) {
      if (used.has(c) || used.has(c - 1)) continue;
      if (!isSolid(this.get(c, GROUND)) || this.get(c, GROUND - 1) !== TILE.EMPTY) continue;
      if (hash(c * 3.7 + seed) > density) continue;
      const type = list[Math.floor(hash(c * 9.1 + seed) * list.length)];
      this.decos.unshift({ type, c, r: GROUND });
      used.add(c);
    }
  }
}

const LEVELS = [
  // ---------------- Level 1 ----------------
  {
    name: 'Blockie Meadow',
    signName: 'Blockie\nMeadow',
    target: 50,
    theme: 'meadow',
    bonus: 'gemrain',
    bossName: 'Farmer Grumble',
    width: 176,
    build(b) {
      b.ground(0, 35);
      b.sign(3, '→ Walk');
      b.item('sword', 7);
      b.sign(10, 'SPACE = Swing');
      b.deco('tree', 13);
      b.coins(15, 10, 3);
      b.sign(19, '↑ = Jump');
      b.plat(21, 9, 4);
      b.item('gem', 22, 8);
      b.item('gem', 23, 8);
      b.enemy('zombie', 28);
      b.deco('tree', 31);
      b.item('apple', 33);

      // a little gap at 36-37
      b.ground(38, 66);
      b.checkpoint(40);
      b.farm(44, 60);
      b.elephant(46, 58);
      b.coins(49, 8, 3);
      b.item('apple', 52);
      b.item('bread', 57);
      b.enemy('zombie', 63);

      // gap at 67-68
      b.ground(69, 102);
      b.block(72, 11);
      b.block(73, 10, 1, 2);
      b.block(74, 9, 1, 3);
      b.item('gem', 74, 8);
      b.plat(77, 8, 4);
      b.coins(77, 7, 4);
      b.enemy('zombie', 80);
      b.deco('tree', 84);
      b.enemy('zombie', 88);
      b.checkpoint(91);
      b.coins(95, 10, 4);
      b.enemy('zombie', 99);

      // gap at 103-105
      b.ground(106, 175);
      b.farm(108, 126);
      b.elephant(110, 124);
      b.item('carrot', 114);
      b.plat(118, 9, 4);
      b.item('gem', 119, 8);
      b.item('gem', 120, 8);
      b.enemy('zombie', 128);
      b.enemy('zombie', 132);
      b.checkpoint(136);
      b.item('apple', 139);
      b.boss('grumble', 141, 160);
      b.flag(171);
    }
  },

  // ---------------- Level 2 ----------------
  {
    name: 'Mushroom Woods',
    signName: 'Mushroom\nWoods',
    target: 75,
    theme: 'mushroom',
    bonus: 'gemrain',
    bossName: 'Giant Spider',
    width: 176,
    build(b) {
      b.ground(0, 30);
      b.item('spear', 6);
      b.sign(9, 'Spear: long poke!');
      b.mushroom(13, 9, 3);
      b.coins(13, 8, 3);
      b.enemy('zombie', 18);
      b.mushroom(21, 9, 3);
      b.mushroom(25, 7, 3);
      b.item('gem', 26, 6);
      b.enemy('skeleton', 29);

      // gap at 31-33
      b.ground(34, 62);
      b.checkpoint(35);
      b.mob(42, 3);
      b.mushroom(46, 9, 4);
      b.coins(46, 8, 4);
      b.item('bread', 51);
      b.mushroom(53, 9, 3);
      b.mushroom(56, 7, 3);
      b.item('gem', 57, 6);
      b.item('gem', 58, 6);
      b.enemy('skeleton', 61);

      // gap at 63-65 with a mushroom to hop on
      b.mushroom(63, 10, 3);
      b.ground(66, 100);
      b.enemy('zombie', 70);
      b.mob(75, 4);
      b.checkpoint(81);
      b.item('axe', 86);
      b.sign(88, 'Battle Axe: big hits!');
      b.mushroom(91, 9, 3);
      b.mushroom(95, 7, 3);
      b.coins(95, 6, 3, 'gem');
      b.enemy('skeleton', 99);

      // gap at 101-102
      b.ground(103, 175);
      b.enemy('zombie', 107);
      b.mushroom(110, 9, 3);
      b.item('apple', 111, 8);
      b.enemy('skeleton', 116);
      b.mob(120, 4);
      b.coins(125, 10, 4);
      b.checkpoint(130);
      b.enemy('zombie', 135);
      b.item('carrot', 138);
      b.boss('bigspider', 141, 158);
      b.flag(171);
    }
  },

  // ---------------- Level 3 ----------------
  {
    name: 'Spider Hollow',
    signName: 'Spider\nHollow',
    target: 100,
    theme: 'cave',
    bonus: 'chase',
    bossName: 'Spider Queen',
    width: 176,
    build(b) {
      b.ceiling(0, 175, 2);
      b.ground(0, 30);
      b.item('mace', 6);
      b.sign(9, 'Mace: BONK!');
      b.deco('web', 12, 2);
      b.enemy('spider', 15);
      b.plat(18, 9, 4);
      b.coins(18, 8, 4);
      b.enemy('spider', 23, { drop: true });
      b.deco('bigtree', 25);
      b.item('apple', 28);

      // gap at 31-33
      b.ground(34, 64);
      b.checkpoint(35);
      b.mob(40, 4);
      b.item('shield', 46);
      b.sign(48, 'Hold ↓ to block');
      b.enemy('spider', 53, { drop: true });
      b.plat(55, 9, 3);
      b.plat(59, 7, 3);
      b.coins(59, 6, 3, 'gem');
      b.deco('web', 60, 2);
      b.enemy('spider', 62);

      // gap at 65-67
      b.ground(68, 104);
      b.enemy('spider', 72);
      b.mob(77, 4);
      b.checkpoint(83);
      b.item('chest', 88);
      b.enemy('spider', 93, { drop: true });
      b.enemy('spider', 97, { drop: true });
      b.plat(99, 9, 3);
      b.coins(99, 8, 3);
      b.deco('bigtree', 102);

      // gap at 105-106
      b.ground(107, 175);
      b.mob(112, 5);
      b.item('bread', 117);
      b.enemy('spider', 121);
      b.plat(124, 9, 4);
      b.item('gem', 125, 8);
      b.item('gem', 126, 8);
      b.enemy('spider', 129, { drop: true });
      b.deco('web', 131, 2);
      b.checkpoint(134);
      b.item('apple', 138);
      b.boss('queen', 141, 158);
      b.flag(171);
    }
  },

  // ---------------- Level 4 ----------------
  {
    name: 'Skeleton Ruins',
    signName: 'Skeleton\nRuins',
    target: 125,
    theme: 'ruins',
    bonus: 'gemrain',
    bossName: 'Skeleton King',
    width: 176,
    build(b) {
      b.ground(0, 28);
      b.coins(5, 10, 4);
      b.enemy('skeleton', 12);
      b.block(15, 10, 2, 2);
      b.coins(15, 9, 2);
      b.block(17, 9, 2, 3);
      b.item('gem', 17, 8);
      b.item('gem', 18, 8);
      b.enemy('zombie', 24);

      // gap at 29-31
      b.ground(32, 66);
      b.checkpoint(33);
      b.coins(36, 10, 3);
      b.enemy('skeleton', 40);
      b.plat(43, 9, 4);
      b.coins(43, 8, 4);
      b.enemy('zombie', 48);
      b.enemy('zombie', 52);
      b.item('apple', 55);
      b.coins(57, 10, 2, 'gem');
      b.item('helmet', 60);
      b.enemy('skeleton', 64);

      // gap at 67-69 with a stepping stone
      b.block(68, 10);
      b.ground(70, 104);
      b.block(74, 11);
      b.block(75, 10, 1, 2);
      b.block(76, 9, 2, 3);
      b.coins(75, 8, 3);
      b.coins(78, 10, 3);
      b.enemy('skeleton', 81);
      b.checkpoint(84);
      b.enemy('zombie', 89);
      b.coins(91, 10, 3, 'gem');
      b.enemy('skeleton', 95);
      b.plat(97, 9, 3);
      b.item('gem', 98, 8);
      b.item('bread', 101);
      b.enemy('zombie', 102);

      // gap at 105-107
      b.ground(108, 175);
      b.enemy('skeleton', 112);
      b.coins(114, 10, 3);
      b.enemy('zombie', 117);
      b.block(120, 10, 2, 2);
      b.item('gem', 120, 9);
      b.item('gem', 121, 9);
      b.coins(123, 10, 2, 'gem');
      b.enemy('skeleton', 126);
      b.coins(129, 10, 4);
      b.checkpoint(135);
      b.item('carrot', 138);
      b.boss('skelking', 141, 158);
      b.flag(171);
    }
  },

  // ---------------- Level 5 ----------------
  {
    name: 'Castle of the Forest',
    signName: 'Forest\nCastle',
    target: 150,
    theme: 'castle',
    bonus: null,
    bossName: 'The Mob Lord',
    width: 214,
    build(b) {
      const BR = TILE.BRICK;
      b.ground(0, 26, BR);
      b.item('axe', 5);
      b.enemy('zombie', 12);
      b.coins(14, 10, 3);
      b.enemy('robot', 21);

      // moat at 27-29
      b.ground(30, 60, BR);
      b.checkpoint(31);
      b.mob(38, 5);
      b.block(44, 10, 2, 2, BR);
      b.block(46, 8, 2, 4, BR);
      b.item('gem', 46, 7);
      b.item('gem', 47, 7);
      b.item('helmet', 51);
      b.enemy('skeleton', 54);
      b.enemy('spider', 58);

      // moat at 61-63
      b.ground(64, 100, BR);
      b.enemy('robot', 68);
      b.item('spear', 71);
      b.item('apple', 73);
      b.enemy('robot', 77);
      b.checkpoint(80);
      b.mob(84, 6);
      b.item('shield', 89);
      b.plat(91, 9, 4);
      b.coins(91, 8, 4);
      b.enemy('skeleton', 97);

      // moat at 101-103
      b.ground(104, 140, BR);
      b.enemy('spider', 108, { drop: true });
      b.item('mace', 110);
      b.enemy('robot', 114);
      b.mob(118, 5);
      b.block(122, 10, 2, 2, BR);
      b.block(124, 8, 2, 4, BR);
      b.item('chest', 125, 7);
      b.item('gem', 124, 7);
      b.enemy('zombie', 130);
      b.enemy('skeleton', 135);
      b.item('bread', 138);

      // moat at 141-143
      b.ground(144, 213, BR);
      b.checkpoint(145);
      b.item('sword', 149);
      b.enemy('robot', 153);
      b.mob(158, 6);
      b.enemy('skeleton', 164);
      b.coins(166, 10, 4, 'gem');
      b.checkpoint(172);
      b.item('apple', 175);
      b.boss('moblord', 178, 196);
      b.flag(209);
    }
  }
];

const BONUS = {
  gemrain: {
    name: 'Gem Rain',
    tip: 'Catch the falling gems!',
    theme: 'bonus',
    width: 27,
    time: 20,
    build(b) {
      b.ground(0, 26);
      b.spawn(12);
    }
  },
  chase: {
    name: 'Spider Chase',
    tip: 'Run and grab gems! Spiders are coming!',
    theme: 'cave',
    width: 150,
    time: 25,
    build(b) {
      b.ceiling(0, 149, 2);
      b.ground(0, 149);
      b.spawn(6);
      for (let i = 0; i < 12; i++) {
        const c = 14 + i * 10;
        if (i % 3 === 0) {
          b.block(c, 11);
          b.item('gem', c - 1, 9);
          b.item('gem', c, 8);
          b.item('gem', c + 1, 9);
        } else if (i % 3 === 1) {
          b.plat(c, 9, 4);
          b.coins(c, 8, 4, 'gem');
          b.coins(c, 11, 4);
        } else {
          b.block(c, 10, 1, 2);
          b.item('gem', c, 8);
          b.coins(c + 2, 11, 3);
        }
      }
      b.item('apple', 40);
      b.item('apple', 90);
      b.flag(144);
    }
  }
};
