// Menus and in-between screens: title, level select, play, shop, win, game over, ending.
// Each screen has update(dt) and draw(ctx). Game.go(screen) switches screens.

function menuMove(cursor, n) {
  if (Input.hit('up')) { Sound.play('menu'); return (cursor + n - 1) % n; }
  if (Input.hit('down')) { Sound.play('menu'); return (cursor + 1) % n; }
  return cursor;
}

function drawMenu(ctx, labels, cursor, x, y, gap = 58) {
  labels.forEach((label, i) => {
    const yy = y + i * gap;
    if (i === cursor) {
      box(ctx, x - 200, yy - 25, 400, 50, '#2a1410');
      box(ctx, x - 197, yy - 22, 394, 44, '#d7262e');
      box(ctx, x - 197, yy - 22, 394, 5, '#ff5a4f');
      say(ctx, '▶', x - 170, yy, 24, '#ffe14d');
    }
    say(ctx, label, x, yy, 30, i === cursor ? '#ffffff' : '#fff1e0');
  });
}

// Sky, hills and a strip of ground along the bottom.
function drawScene(ctx, themeName, scroll, t) {
  const th = THEMES[themeName];
  drawBackdrop(ctx, th, scroll, t);
  ctx.save();
  ctx.translate(-Math.round(scroll), 0);
  const c1 = Math.floor(scroll / T);
  for (let c = c1; c <= c1 + Math.ceil(W / T) + 1; c++) {
    drawTile(ctx, th, th.groundTile, c, 13, true);
    drawTile(ctx, th, th.groundTile, c, 14, false);
  }
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, '#2a1410');
  box(ctx, x + 4, y + 4, w - 8, h - 8, 'rgba(60,20,16,0.88)');
  box(ctx, x + 4, y + 4, w - 8, 6, '#d7262e');
}

// Falling confetti that needs no memory: positions come from the time.
function drawConfetti(ctx, t) {
  const colors = ['#d7262e', '#ffcc22', '#ffffff', '#5fe6ff', '#7ee08a'];
  for (let k = 0; k < 70; k++) {
    const speed = 60 + hash(k + 7) * 90;
    const x = (hash(k) * W + Math.sin(t * 2 + k) * 20 + W) % W;
    const y = (hash(k + 3) * H + t * speed) % (H + 20) - 10;
    box(ctx, x, y, 6, 9, colors[k % colors.length]);
  }
}

function blinkText(ctx, text, y, t) {
  if (Math.floor(t * 2) % 2 === 0) say(ctx, text, W / 2, y, 26, '#ffe14d');
}

// ======================= Title =======================

class TitleScreen {
  constructor() {
    this.t = 0;
    this.cursor = 0;
    this.confirm = -1;   // -1 = not asking, 0 = Yes, 1 = No
  }

  options() {
    const list = [];
    if (Save.data.started) list.push('continue');
    list.push('new');
    list.push('mode');
    return list;
  }

  label(id) {
    if (id === 'continue') return 'Continue';
    if (id === 'new') return Save.data.started ? 'New Game' : 'Start';
    return Save.data.mode === 'easy' ? '◀ Easy: 5 hearts ▶' : '◀ Normal: 3 hearts ▶';
  }

  update(dt) {
    this.t += dt;
    if (this.confirm >= 0) {
      if (Input.hit('left') || Input.hit('right') || Input.hit('up') || Input.hit('down')) {
        this.confirm = 1 - this.confirm;
        Sound.play('menu');
      }
      if (Input.hit('pause')) this.confirm = -1;
      if (Input.hit('enter')) {
        Sound.play('select');
        if (this.confirm === 0) {
          Save.reset(Save.data.mode);
          Game.go(new SelectScreen(0));
        } else {
          this.confirm = -1;
        }
      }
      return;
    }

    const opts = this.options();
    this.cursor = menuMove(this.cursor, opts.length);
    const id = opts[this.cursor];
    if (id === 'mode' && (Input.hit('left') || Input.hit('right') || Input.hit('enter'))) {
      Save.data.mode = Save.data.mode === 'easy' ? 'normal' : 'easy';
      if (Save.data.started) Save.write();
      Sound.play('menu');
      return;
    }
    if (Input.hit('enter')) {
      Sound.play('select');
      if (id === 'continue') {
        Game.go(new SelectScreen(Math.min(Save.data.unlocked, 5) - 1));
      } else if (Save.data.started) {
        this.confirm = 1;
      } else {
        Save.reset(Save.data.mode);
        Game.go(new SelectScreen(0));
      }
    }
  }

  draw(ctx) {
    drawScene(ctx, 'meadow', this.t * 40, this.t);
    drawLogo(ctx, W / 2, 50, 18, this.t);
    drawBlockie(ctx, 190, 468, { facing: 1, walk: this.t * 200, weapon: 'sword', armor: { shield: true } });
    drawElephant(ctx, 780, 468, -1, this.t, false);
    drawZombie(ctx, 640, 468, -1, 1, this.t, false);

    const opts = this.options();
    drawMenu(ctx, opts.map((id) => this.label(id)), this.cursor, W / 2, 250);
    say(ctx, 'Arrows to move   Enter to pick', W / 2, H - 22, 18, '#ffffff');

    if (this.confirm >= 0) {
      box(ctx, 0, 0, W, H, 'rgba(0,0,0,0.5)');
      drawPanel(ctx, W / 2 - 260, 150, 520, 230);
      say(ctx, 'Start over?', W / 2, 200, 38, '#ffffff');
      say(ctx, 'Your saved stuff will go away.', W / 2, 245, 20, '#ffd0c0');
      ['Yes', 'No'].forEach((label, i) => {
        const x = W / 2 + (i === 0 ? -90 : 90);
        if (this.confirm === i) box(ctx, x - 60, 300, 120, 50, '#d7262e');
        say(ctx, label, x, 325, 30, '#ffffff');
      });
    }
  }
}

// ======================= Level select =======================

class SelectScreen {
  constructor(cursor = 0) {
    this.cursor = Math.max(0, Math.min(4, cursor));
    this.row = 0;   // 0 = level signs, 1 = castle shop button
    this.t = 0;
    this.bx = this.signX(this.cursor);
  }

  signX(i) { return 120 + i * 180; }

  update(dt) {
    this.t += dt;
    if (Input.hit('pause')) { Game.go(new TitleScreen()); return; }
    if (Input.hit('up') && this.row === 0) { this.row = 1; Sound.play('menu'); }
    if (Input.hit('down') && this.row === 1) { this.row = 0; Sound.play('menu'); }
    if (this.row === 0) {
      if (Input.hit('left') && this.cursor > 0) { this.cursor--; Sound.play('menu'); }
      if (Input.hit('right') && this.cursor < 4) { this.cursor++; Sound.play('menu'); }
    }
    const target = this.signX(this.cursor);
    this.walking = Math.abs(target - this.bx) > 2;
    this.facing = target < this.bx ? -1 : 1;
    this.bx += Math.sign(target - this.bx) * Math.min(Math.abs(target - this.bx), 500 * dt);

    if (Input.hit('enter')) {
      if (this.row === 1) {
        Sound.play('select');
        Game.go(new ShopScreen(this.cursor));
      } else if (this.cursor < Save.data.unlocked) {
        Sound.play('select');
        Game.go(new IntroScreen(this.cursor));
      } else {
        Sound.play('nope');
      }
    }
  }

  draw(ctx) {
    drawScene(ctx, 'meadow', 0, this.t);
    say(ctx, 'The Blockie Forest', W / 2, 40, 42, '#ff4a3d');

    // gems and total points
    const gems = String(Save.data.gems);
    say(ctx, gems, W - 16, 36, 26, '#bff6ff', 'right');
    drawGem(ctx, W - 34 - ctx.measureText(gems).width, 36, 1.1);
    say(ctx, `★ ${Save.totalScore()}`, 16, 36, 26, '#ffe14d', 'left');

    // castle shop button
    const shopSel = this.row === 1;
    box(ctx, W / 2 - 130, 76, 260, 48, '#2a1410');
    box(ctx, W / 2 - 127, 79, 254, 42, shopSel ? '#d7262e' : '#6a5a5a');
    say(ctx, 'Castle Shop', W / 2, 100, 26, '#ffffff');

    // the five level signs
    for (let i = 0; i < 5; i++) {
      const x = this.signX(i);
      const open = i < Save.data.unlocked;
      const sel = this.row === 0 && i === this.cursor;
      const lift = sel ? Math.sin(this.t * 5) * 3 - 4 : 0;
      box(ctx, x - 6, 290, 12, 178, '#7a4a22');
      const by = 160 + lift;
      if (sel) box(ctx, x - 82, by - 6, 164, 132, '#ffe14d');
      box(ctx, x - 76, by, 152, 120, '#5a3416');
      box(ctx, x - 70, by + 6, 140, 108, open ? '#c08a4a' : '#8a8484');
      say(ctx, String(i + 1), x, by + 34, 40, open ? '#ffffff' : '#cfcfcf');
      const lines = LEVELS[i].signName.split('\n');
      say(ctx, lines[0], x, by + 72, 18, open ? '#ffffff' : '#cfcfcf');
      say(ctx, lines[1], x, by + 94, 18, open ? '#ffffff' : '#cfcfcf');
      if (!open) {
        // a little padlock
        box(ctx, x + 30, by + 14, 30, 24, '#5a5a66');
        box(ctx, x + 36, by + 2, 18, 14, '#5a5a66');
        box(ctx, x + 40, by + 6, 10, 10, '#8a8484');
        box(ctx, x + 43, by + 22, 4, 8, '#2a2a30');
      }
      if (Save.data.beaten[i]) drawStar(ctx, x + 58, by + 6, 16, '#ffcc22');
      if (sel && Save.data.levelBest[i] > 0) {
        say(ctx, `Best: ${Save.data.levelBest[i]}`, x, by - 22, 18, '#ffe14d');
      }
    }

    drawBlockie(ctx, this.bx + 30, 468, {
      facing: this.walking ? this.facing : 1,
      walk: this.walking ? this.t * 300 : 0,
      weapon: Save.data.weapon
    });

    say(ctx, '← → pick   ↑ shop   Enter = go', W / 2, H - 22, 20, '#ffffff');
  }
}

// ======================= Level intro =======================

class IntroScreen {
  constructor(i) {
    this.i = i;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (Input.hit('pause')) { Game.go(new SelectScreen(this.i)); return; }
    if (Input.hit('enter')) {
      Sound.play('select');
      Game.go(new PlayScreen(this.i, 'level'));
    }
  }

  draw(ctx) {
    const lv = LEVELS[this.i];
    drawScene(ctx, lv.theme, this.t * 30, this.t);
    drawPanel(ctx, W / 2 - 320, 70, 640, 370);
    say(ctx, `Level ${this.i + 1}`, W / 2, 115, 30, '#ffe14d');
    say(ctx, lv.name, W / 2, 170, 50, '#ff4a3d');
    say(ctx, `Get ${lv.target} points`, W / 2, 235, 30, '#ffffff');
    say(ctx, `and beat ${lv.bossName}!`, W / 2, 275, 30, '#ffffff');
    if (this.i === 0) {
      say(ctx, '← → walk    ↑ jump    SPACE swing', W / 2, 335, 22, '#bff6ff');
    } else {
      say(ctx, `Hearts: ${(Save.data.mode === 'easy' ? 5 : 3) + Save.data.upgrades.heart}`, W / 2, 335, 22, '#ff9a9a');
    }
    blinkText(ctx, 'Press Enter to start!', 400, this.t);
  }
}

// ======================= Playing =======================

class PlayScreen {
  constructor(levelIndex, mode = 'level') {
    this.levelIndex = levelIndex;
    this.mode = mode;
    this.world = new World(levelIndex, mode);
    this.paused = false;
    this.cursor = 0;
  }

  pause() {
    if (!this.paused && !this.world.done) {
      this.paused = true;
      this.cursor = 0;
    }
  }

  toggleSound() {
    Sound.muted = !Sound.muted;
    Save.data.muted = Sound.muted;
    Save.write();
    Sound.play('select');
  }

  update(dt) {
    if (this.paused) {
      this.cursor = menuMove(this.cursor, 4);
      if (Input.hit('pause')) { this.paused = false; return; }
      if (this.cursor === 2 && (Input.hit('left') || Input.hit('right'))) this.toggleSound();
      if (Input.hit('enter')) {
        Sound.play('select');
        if (this.cursor === 0) this.paused = false;
        else if (this.cursor === 1) Game.go(new PlayScreen(this.levelIndex, this.mode));
        else if (this.cursor === 2) this.toggleSound();
        else Game.go(new SelectScreen(this.levelIndex));
      }
      return;
    }
    if (Input.hit('pause')) {
      this.pause();
      Sound.play('menu');
      return;
    }

    const w = this.world;
    w.update(dt);
    if (w.done === 'win') Game.go(new LevelWinScreen(w));
    else if (w.done === 'gameover') Game.go(new GameOverScreen(this.levelIndex));
    else if (w.done === 'bonusEnd') Game.go(new BonusEndScreen(w));
  }

  draw(ctx) {
    this.world.draw(ctx);
    this.world.drawHud(ctx);
    if (this.paused) {
      box(ctx, 0, 0, W, H, 'rgba(20,5,5,0.6)');
      say(ctx, 'Paused', W / 2, 110, 56, '#ff4a3d');
      const labels = ['Keep Playing', 'Restart Level', 'Sound: ' + (Sound.muted ? 'Off' : 'On'), 'Quit to Map'];
      drawMenu(ctx, labels, this.cursor, W / 2, 210);
    }
  }
}

// ======================= Game over =======================

class GameOverScreen {
  constructor(i) {
    this.i = i;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.t < 0.6) return;
    if (Input.hit('enter')) { Sound.play('select'); Game.go(new PlayScreen(this.i, 'level')); }
    if (Input.hit('pause')) Game.go(new SelectScreen(this.i));
  }

  draw(ctx) {
    drawScene(ctx, LEVELS[this.i].theme, 0, this.t);
    box(ctx, 0, 0, W, H, 'rgba(40,0,0,0.45)');
    say(ctx, 'Oh no!', W / 2, 130, 72, '#ff4a3d');
    say(ctx, 'Try again! You can do it!', W / 2, 210, 32, '#ffffff');
    drawBlockie(ctx, W / 2, 468, { facing: 1, spin: Math.PI / 2, weapon: Save.data.weapon });
    for (let k = 0; k < 3; k++) {
      const a = this.t * 3 + k * 2.1;
      drawStar(ctx, W / 2 + 20 + Math.cos(a) * 30, 430 + Math.sin(a) * 10, 8, '#ffe14d');
    }
    blinkText(ctx, 'Enter = Try again', 300, this.t);
    say(ctx, 'Esc = Map', W / 2, 345, 20, '#ffffff');
  }
}

// ======================= Level complete =======================

class LevelWinScreen {
  constructor(world) {
    this.world = world;
    this.i = world.levelIndex;
    this.t = 0;
    const s = Save.data;
    s.levelBest[this.i] = Math.max(s.levelBest[this.i], world.points);
    s.beaten[this.i] = true;
    s.unlocked = Math.max(s.unlocked, Math.min(5, this.i + 2));
    Save.write();
  }

  update(dt) {
    this.t += dt;
    if (this.t > 0.6 && Input.hit('enter')) {
      Sound.play('select');
      if (this.i === 4) Game.go(new EndingScreen());
      else Game.go(new BonusIntroScreen(this.i));
    }
  }

  draw(ctx) {
    drawScene(ctx, LEVELS[this.i].theme, this.t * 20, this.t);
    drawConfetti(ctx, this.t);
    drawPanel(ctx, W / 2 - 300, 70, 600, 320);
    say(ctx, 'Level Complete!', W / 2, 125, 52, '#ffe14d');
    say(ctx, LEVELS[this.i].name, W / 2, 180, 26, '#ff8a7a');
    say(ctx, `Points: ${this.world.points}`, W / 2, 240, 34, '#ffffff');
    say(ctx, `Gems found: ${this.world.gemsGot}`, W / 2, 290, 30, '#bff6ff');
    blinkText(ctx, 'Press Enter', 350, this.t);
    const hop = Math.abs(Math.sin(this.t * 5)) * 30;
    drawBlockie(ctx, W / 2, 468 - hop, { facing: 1, weapon: Save.data.weapon, air: hop > 2 });
  }
}

// ======================= Bonus rounds =======================

class BonusIntroScreen {
  constructor(i) {
    this.i = i;
    this.mode = LEVELS[i].bonus;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (Input.hit('enter')) {
      Sound.play('select');
      Game.go(new PlayScreen(this.i, this.mode));
    }
  }

  draw(ctx) {
    const def = BONUS[this.mode];
    drawScene(ctx, def.theme, this.t * 30, this.t);
    drawPanel(ctx, W / 2 - 320, 90, 640, 320);
    say(ctx, 'BONUS ROUND!', W / 2, 145, 54, '#ffe14d');
    say(ctx, def.name, W / 2, 210, 40, '#ff4a3d');
    say(ctx, def.tip, W / 2, 265, 24, '#ffffff');
    say(ctx, `${def.time} seconds`, W / 2, 310, 22, '#bff6ff');
    blinkText(ctx, 'Press Enter to start!', 365, this.t);
  }
}

class BonusEndScreen {
  constructor(world) {
    this.world = world;
    this.i = world.levelIndex;
    this.t = 0;
    const s = Save.data;
    s.bonusBest[this.i] = Math.max(s.bonusBest[this.i], world.points);
    Save.write();
  }

  update(dt) {
    this.t += dt;
    if (this.t > 0.6 && Input.hit('enter')) {
      Sound.play('select');
      Game.go(new ShopScreen(this.i + 1));
    }
  }

  draw(ctx) {
    const w = this.world;
    drawScene(ctx, w.def.theme, this.t * 20, this.t);
    drawPanel(ctx, W / 2 - 300, 90, 600, 300);
    const title = w.result === 'caught' ? 'The spiders got you!'
      : w.result === 'escaped' ? 'You escaped! +5 gems!' : "Time's up!";
    say(ctx, title, W / 2, 145, 40, '#ffe14d');
    say(ctx, `You got ${w.gemsGot} gems!`, W / 2, 215, 36, '#bff6ff');
    say(ctx, `Points: ${w.points}`, W / 2, 270, 28, '#ffffff');
    blinkText(ctx, 'Enter = Go to the Castle', 340, this.t);
  }
}

// ======================= Castle shop =======================

const SHOP = [
  { id: 'power', name: 'Strong Weapon', desc: 'Hit harder', costs: [10, 20, 35] },
  { id: 'speed', name: 'Fast Boots', desc: 'Run faster', costs: [8, 16, 28] },
  { id: 'jump', name: 'Jump Boots', desc: 'Jump higher', costs: [8, 16, 28] },
  { id: 'armor', name: 'Gold Armor', desc: 'Blocks 1 hit every level', costs: [15, 30] },
  { id: 'points', name: 'Point Star', desc: 'More points', costs: [20, 40] },
  { id: 'heart', name: 'Extra Heart', desc: '+1 heart', costs: [25, 50] }
];

function drawShopIcon(ctx, id, x, y) {
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'power':
      ctx.save();
      ctx.translate(-4, 14);
      ctx.rotate(0.6);
      ctx.scale(0.8, 0.8);
      drawWeapon(ctx, 'sword');
      ctx.restore();
      drawStar(ctx, 12, -12, 7, '#ffe14d');
      break;
    case 'speed':
    case 'jump':
      box(ctx, -8, -12, 11, 16, '#d7262e');
      box(ctx, -8, 2, 20, 7, '#d7262e');
      box(ctx, -8, 7, 20, 3, '#5a1010');
      if (id === 'speed') {
        box(ctx, -22, -6, 10, 3, '#ffffff');
        box(ctx, -20, 0, 8, 3, '#ffffff');
      } else {
        poly(ctx, '#ffe14d', [14, -20, 22, -8, 6, -8]);
        box(ctx, 11, -8, 6, 10, '#ffe14d');
      }
      break;
    case 'armor':
      drawArmorIcon(ctx, 'extra', 0, 0, 1.3);
      break;
    case 'points':
      drawStar(ctx, 0, 0, 16, '#ffcc22');
      break;
    case 'heart':
      drawHeart(ctx, -14, -12, 4, true);
      break;
  }
  ctx.restore();
}

class ShopScreen {
  constructor(next) {
    this.next = Math.min(4, next);
    this.cursor = 0;
    this.t = 0;
    this.msg = '';
    this.msgT = 0;
  }

  update(dt) {
    this.t += dt;
    this.msgT -= dt;
    this.cursor = menuMove(this.cursor, SHOP.length + 1);
    if (Input.hit('pause')) { Game.go(new SelectScreen(this.next)); return; }
    if (!Input.hit('enter')) return;
    if (this.cursor === SHOP.length) {
      Sound.play('select');
      Game.go(new SelectScreen(this.next));
      return;
    }
    const item = SHOP[this.cursor];
    const s = Save.data;
    const lvl = s.upgrades[item.id];
    if (lvl >= item.costs.length) {
      this.tell('You have them all!');
      Sound.play('nope');
    } else if (s.gems < item.costs[lvl]) {
      this.tell('Need more gems!');
      Sound.play('nope');
    } else {
      s.gems -= item.costs[lvl];
      s.upgrades[item.id]++;
      Save.write();
      this.tell('Got it!');
      Sound.play('buy');
    }
  }

  tell(text) {
    this.msg = text;
    this.msgT = 2;
  }

  draw(ctx) {
    // castle walls
    box(ctx, 0, 0, W, H, '#5a5a66');
    for (let r = 0; r < H / 30; r++) {
      box(ctx, 0, r * 30, W, 2, '#4a4a55');
      for (let c = 0; c < W / 60 + 1; c++) box(ctx, c * 60 + (r % 2) * 30, r * 30, 2, 30, '#4a4a55');
    }
    for (const bx of [40, W - 86]) {
      box(ctx, bx, 0, 46, 260, '#d7262e');
      box(ctx, bx, 0, 46, 8, '#ffcc22');
      poly(ctx, '#d7262e', [bx, 260, bx + 46, 260, bx + 23, 290]);
      drawStar(ctx, bx + 23, 120, 14, '#ffcc22');
      const f = Math.sin(this.t * 12 + bx) * 2;
      box(ctx, bx + 20, 340, 6, 40, '#6b4a2b');
      box(ctx, bx + 16, 326 - f, 14, 14 + f, '#ff8a1f');
      box(ctx, bx + 19, 330 - f, 8, 8 + f, '#ffe14d');
    }

    say(ctx, 'Castle Shop', W / 2, 44, 44, '#ff4a3d');
    const gems = String(Save.data.gems);
    say(ctx, gems, W - 110, 44, 30, '#bff6ff', 'right');
    drawGem(ctx, W - 130 - ctx.measureText(gems).width, 44, 1.3);

    const top = 112;
    const gap = 54;
    for (let i = 0; i <= SHOP.length; i++) {
      const y = top + i * gap;
      const sel = i === this.cursor;
      box(ctx, 130, y - 24, 700, 48, sel ? '#d7262e' : 'rgba(40,20,20,0.7)');
      if (sel) box(ctx, 130, y - 24, 700, 4, '#ff5a4f');
      if (i === SHOP.length) {
        say(ctx, 'Done!  Back to the map', W / 2, y, 26, '#ffffff');
        continue;
      }
      const item = SHOP[i];
      const lvl = Save.data.upgrades[item.id];
      drawShopIcon(ctx, item.id, 172, y);
      say(ctx, item.name, 210, y - 8, 24, '#ffffff', 'left');
      say(ctx, item.desc, 210, y + 13, 16, '#ffd0c0', 'left');
      for (let k = 0; k < item.costs.length; k++) {
        box(ctx, 540 + k * 22, y - 8, 16, 16, '#2a1410');
        box(ctx, 542 + k * 22, y - 6, 12, 12, k < lvl ? '#ffcc22' : '#6a5a5a');
      }
      if (lvl >= item.costs.length) {
        say(ctx, 'MAX', 800, y, 24, '#ffe14d', 'right');
      } else {
        const cost = item.costs[lvl];
        say(ctx, String(cost), 800, y, 26, Save.data.gems >= cost ? '#bff6ff' : '#ff9a9a', 'right');
        drawGem(ctx, 800 - 18 - ctx.measureText(String(cost)).width, y, 1);
      }
    }
    if (this.msgT > 0) say(ctx, this.msg, W / 2, H - 46, 28, '#ffe14d');
    else say(ctx, '↑ ↓ pick   Enter = buy', W / 2, H - 46, 20, '#ffffff');
  }
}

// ======================= The end =======================

class EndingScreen {
  constructor() {
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.t > 1 && Input.hit('enter')) {
      Sound.play('select');
      Game.go(new SelectScreen(4));
    }
  }

  draw(ctx) {
    drawScene(ctx, 'castle', this.t * 20, this.t);
    drawConfetti(ctx, this.t);
    drawLogo(ctx, W / 2, 30, 12, this.t);
    drawPanel(ctx, W / 2 - 340, 120, 680, 230);
    say(ctx, 'You saved the', W / 2, 165, 40, '#ffffff');
    say(ctx, 'Blockie Forest!', W / 2, 215, 52, '#ffe14d');
    say(ctx, `Total points: ${Save.totalScore()}`, W / 2, 280, 32, '#bff6ff');
    blinkText(ctx, 'Press Enter', 325, this.t);
    const hop = Math.abs(Math.sin(this.t * 5)) * 30;
    drawBlockie(ctx, W / 2 - 60, 468 - hop, { facing: 1, weapon: Save.data.weapon, air: hop > 2, armor: { helmet: true, chest: true, shield: true } });
    drawElephant(ctx, W / 2 + 120, 468, -1, this.t, true);
  }
}
