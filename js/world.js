// A World is one level (or bonus round) being played:
// the map, Blockie, monsters, items, the camera, and the HUD.

const FOOD = ['apple', 'bread', 'carrot', 'egg'];
const ARMOR = ['helmet', 'chest', 'shield'];
// Bedrock armor items and the piece each one is
const BEDROCK = { bedhelmet: 'helmet', bedchest: 'chest', bedshield: 'shield' };

const PICKUP_TEXT = {
  bedhelmet: 'Bedrock Helmet! Blocks 3 hits',
  bedchest: 'Bedrock Chest Plate! Blocks 3 hits',
  bedshield: 'Bedrock Shield! Hold ↓ to bounce things back',
  sword: 'Sword! Press SPACE',
  spear: 'Spear! It pokes far',
  axe: 'Battle Axe! Big hits',
  mace: 'Mace! Bonk them back',
  firewand: 'Fire Wand! SPACE shoots fire',
  helmet: 'Helmet! Blocks 1 hit',
  chest: 'Chest Plate! Blocks 1 hit',
  shield: 'Shield! Hold ↓ to block'
};

class World {
  constructor(levelIndex, mode = 'level') {
    this.levelIndex = levelIndex;
    this.mode = mode;   // 'level' or the name of a bonus round
    this.def = mode === 'level' ? LEVELS[levelIndex] : BONUS[mode];
    this.theme = THEMES[this.def.theme];

    const b = new LevelBuilder(this.def.width);
    this.def.build(b);
    b.decorate(this.theme.decor, this.theme.density, levelIndex * 17 + 3);

    this.cols = b.cols;
    this.map = b.map;
    this.decos = b.decos;
    this.items = b.items.map((i) => ({
      type: i.type, x: (i.c + 0.5) * T, y: (i.r + 0.5) * T, phase: Math.random() * 6, taken: false
    }));
    this.checkpoints = b.checkpoints.map((cp) => ({ c: cp.c, x: (cp.c + 1) * T, y: cp.r * T, on: false }));
    this.animals = b.animals.map((a) => new Animal(this, a.type, a.c1, a.c2));
    this.enemies = b.enemies.map((e) => makeEnemy(this, e));
    this.newEnemies = [];
    this.projectiles = [];   // things monsters throw at Blockie
    this.shots = [];         // Blockie's fireballs
    this.bolts = [];         // lightning flashes
    this.particles = [];
    this.popups = [];

    this.boss = null;
    this.bossActive = false;
    if (b.bossInfo) {
      this.arenaX = b.bossInfo.arenaCol * T;
      this.boss = makeBoss(this, b.bossInfo.type, b.bossInfo.bossCol);
      this.enemies.push(this.boss);
    }
    this.flag = b.flagCol === null ? null
      : { x: b.flagCol * T, y: GROUND * T, up: !this.boss, rise: this.boss ? 0 : 1 };

    const s = Save.data;
    this.maxLives = (s.mode === 'easy' ? 5 : 3) + s.upgrades.heart;
    this.lives = this.maxLives;
    this.target = this.def.target || 0;
    this.targetHit = false;
    this.points = 0;
    this.gemsGot = 0;
    this.timer = this.def.time || 0;
    this.spawnT = 0;
    this.chasers = [];
    if (this.def.chaser) {
      const h = this.def.chaser === 'dino' ? 36 : 24;
      for (let i = 0; i < 3; i++) this.chasers.push({ x: -160 - i * 70, y: GROUND * T - h, w: 44, h });
    }

    this.spawn = { x: b.spawnCol * T + 6, y: GROUND * T };
    this.player = new Player(this, this.spawn.x, this.spawn.y);

    this.time = 0;
    this.shake = 0;
    this.msg = null;
    this.needT = 0;
    this.bossBanner = 0;
    this.winning = false;
    this.winT = 0;
    this.done = null;     // becomes 'win', 'gameover' or 'bonusEnd'
    this.result = null;   // how a bonus round ended
    this.camMin = 0;
    this.camX = this.cameraTarget();

    if (mode === 'gemrain') this.say('Catch the gems!');
    if (this.def.chaser) this.say('Run! Grab the gems!');
  }

  // ---------- map ----------

  tile(c, r) {
    if (c < 0 || c >= this.cols) return TILE.STONE;   // invisible walls at the ends
    if (r < 0 || r >= ROWS) return TILE.EMPTY;
    return this.map[r * this.cols + c];
  }

  solidInColumn(c, top, bottom) {
    const r1 = Math.floor(top / T), r2 = Math.floor((bottom - 1) / T);
    for (let r = r1; r <= r2; r++) if (isSolid(this.tile(c, r))) return true;
    return false;
  }

  // ---------- points, messages and effects ----------

  addPoints(n, x, y) {
    const pts = Math.round(n * (1 + 0.5 * Save.data.upgrades.points));
    this.points += pts;
    if (x !== undefined) this.popup('+' + pts, x, y, '#ffe14d');
    if (this.mode === 'level' && !this.targetHit && this.points >= this.target) {
      this.targetHit = true;
      const bossLeft = this.boss && !this.boss.dead;
      this.say(bossLeft ? 'Points done! Now beat the boss!' : 'Points done! Go to the flag!');
      Sound.play('checkpoint');
    }
  }

  // n = how many gems it is worth (a ruby is worth 3)
  addGem(x, y, n = 1, kind = 'gem') {
    Save.data.gems += n;
    Save.write();
    this.gemsGot += n;
    this.sparkle(x, y, GEMS[kind].colors[1]);
    this.addPoints(5 * n, x, y);
    if (n > 1) this.popup(`+${n} gems!`, x, y - 26, '#bff6ff');
  }

  // Get hearts back. In bonus rounds there are no hearts, so just say yum.
  heal(n, text = 'Yum!') {
    const p = this.player;
    if (this.lives < this.maxLives && this.mode === 'level') {
      const got = Math.min(n, this.maxLives - this.lives);
      this.lives += got;
      this.popup(`+${got} ♥`, p.cx, p.y - 30, '#ff8a8a');
    } else {
      this.popup(text, p.cx, p.y - 30, '#ffffff');
    }
  }

  popup(text, x, y, color = '#ffffff') {
    this.popups.push({ text, x, y, t: 0, color });
  }

  say(text, time = 2.5) {
    this.msg = { text, t: time };
  }

  burst(x, y, n, colors, speed, size, g = 0, life = 0.6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g,
        size: size * (0.6 + Math.random() * 0.6),
        color: colors[Math.floor(Math.random() * colors.length)],
        life, max: life
      });
    }
  }

  poof(x, y, big) {
    this.burst(x, y, big ? 30 : 12, ['#ffffff', '#e8e8f0', '#cfd0dc'], big ? 260 : 150, big ? 14 : 9, -60, 0.6);
  }

  sparkle(x, y, color) {
    this.burst(x, y, 8, [color, '#ffffff'], 120, 5, 0, 0.45);
  }

  // A wave that runs along the ground. Jump over it! el picks its colors (null = dust).
  shockwave(x, feetY, dir, el, speed = 280) {
    this.projectiles.push({
      kind: 'shock', el, x: x - 14, y: feetY - 22, w: 28, h: 22, vx: dir * speed, vy: 0, g: 0, life: 2.5, spin: 0
    });
  }

  // A puff of wind that pushes Blockie away. It doesn't hurt.
  gust(x, y, dir) {
    this.projectiles.push({
      kind: 'gust', x: x - 17, y: y - 22, w: 34, h: 44, vx: dir * 300, vy: 0, g: 0, life: 1.5, spin: 0
    });
    Sound.play('swing');
  }

  // ---------- lives ----------

  afterDeath() {
    this.lives--;
    if (this.lives <= 0) {
      this.done = 'gameover';
      Sound.play('lose');
      return;
    }
    this.player.respawn(this.spawn.x, this.spawn.y);
    this.player.invuln = 2;
    this.projectiles = [];
    this.shots = [];
    if (this.boss && !this.boss.dead) {
      this.bossActive = false;
      this.camMin = 0;
      this.boss.resetPos();
      for (const e of this.enemies) if (e.summoned) e.dead = true;
    }
    this.camX = this.cameraTarget();
  }

  onBossDefeated(boss) {
    this.bossActive = false;
    this.camMin = 0;
    this.flag.up = true;
    this.shake = 0.5;
    for (const e of this.enemies) {
      if (e.summoned && !e.dead) { e.dead = true; this.poof(e.cx, e.cy); }
    }
    Sound.play('win');
    const need = this.target - this.points;
    this.say(need > 0 ? `You won! Get ${need} more points!` : 'You won! Go to the flag!', 3.5);
  }

  // ---------- update ----------

  update(dt) {
    this.time += dt;
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    if (this.shake > 0) this.shake -= dt;
    if (this.bossBanner > 0) this.bossBanner -= dt;
    if (this.needT > 0) this.needT -= dt;
    const p = this.player;

    for (const a of this.animals) a.update(dt);
    p.update(dt);
    if (this.done) return;

    // Start the boss fight when Blockie walks into the boss room
    if (this.boss && !this.boss.dead && !this.bossActive && !p.dead && p.x > this.arenaX + 3 * T) {
      this.bossActive = true;
      this.camMin = this.arenaX;
      this.bossBanner = 2.5;
      Sound.play('boss');
    }
    if (this.bossActive) p.x = Math.max(this.arenaX, Math.min(this.arenaX + W - p.w, p.x));

    // Only monsters near the screen move
    const viewL = this.camX - 250, viewR = this.camX + W + 250;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.isBoss || (e.x + e.w > viewL && e.x < viewR)) e.update(dt);
    }
    if (this.newEnemies.length) {
      this.enemies.push(...this.newEnemies);
      this.newEnemies = [];
    }
    this.enemies = this.enemies.filter((e) => !e.dead);

    this.updateProjectiles(dt);
    this.updateShots(dt);
    this.updateItems(dt);
    this.updateCheckpoints();
    this.updateFlag(dt);
    if (this.mode === 'gemrain') this.updateGemRain(dt);
    if (this.def.chaser) this.updateChase(dt);

    for (const pt of this.particles) {
      pt.vy += pt.g * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const pop of this.popups) pop.t += dt;
    this.popups = this.popups.filter((pop) => pop.t < 1.2);
    for (const b of this.bolts) b.t -= dt;
    this.bolts = this.bolts.filter((b) => b.t > 0);

    this.camX += (this.cameraTarget() - this.camX) * Math.min(1, dt * 7);

    if (this.winning) {
      this.winT -= dt;
      if (Math.random() < 0.3) {
        this.burst(p.cx + (Math.random() - 0.5) * 200, p.y - 100, 4, ['#d7262e', '#ffcc22', '#ffffff', '#5fe6ff'], 200, 7, 300, 1);
      }
      if (this.winT <= 0) this.done = 'win';
    }
  }

  cameraTarget() {
    const x = this.bossActive ? this.arenaX : this.player.cx - W * 0.42;
    return Math.max(this.camMin, Math.min(this.cols * T - W, x));
  }

  updateProjectiles(dt) {
    const p = this.player;
    for (const pr of this.projectiles) {
      if (pr.wait > 0) {
        // icicles and falling rocks wobble at the top for a moment first
        pr.wait -= dt;
        continue;
      }
      pr.life -= dt;
      pr.vy += pr.g * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.spin += dt * 12;
      const mx = pr.x + pr.w / 2, my = pr.y + pr.h / 2;
      const t = this.tile(Math.floor(mx / T), Math.floor(my / T));
      if (isSolid(t) || (pr.kind === 'web' && isOneWay(t))) {
        pr.gone = true;
        if (pr.kind === 'web') this.burst(mx, my, 6, ['#ffffff'], 80, 5, 0, 0.4);
        if (pr.kind === 'breath') this.burst(mx, my, 6, ELEMENTS[pr.el].colors, 100, 5, 0, 0.4);
        if (pr.kind === 'snowball' || pr.kind === 'icicle') this.burst(mx, my, 8, ['#ffffff', '#bff6ff'], 140, 6, 300, 0.5);
        if (pr.kind === 'rock') this.burst(mx, my, 10, ['#4a4a52', '#7a7a86', '#2a2a30'], 180, 8, 500, 0.6);
      }
      if (pr.kind === 'shock') {
        // a ground wave stops at the edge of a hole
        const below = this.tile(Math.floor(mx / T), Math.floor((pr.y + pr.h + 4) / T));
        if (!isSolid(below) && !isOneWay(below)) pr.gone = true;
        if (Math.random() < 0.5) {
          this.burst(mx, pr.y + pr.h, 1, pr.el ? ELEMENTS[pr.el].colors : ['#c9b48a', '#ffffff'], 80, 6, 300, 0.4);
        }
      }
      if (pr.life <= 0 || pr.y > ROWS * T) pr.gone = true;
      if (pr.gone || p.dead || !overlap(pr, p)) continue;

      const fromFront = (mx - p.cx) * p.facing > 0;
      if (p.star > 0) {
        // Star Potion: nothing can hurt Blockie
        pr.gone = true;
        this.sparkle(mx, my, '#ffe14d');
      } else if (p.blocking && fromFront && p.armor.bedrock.shield && pr.kind !== 'shock') {
        // The bedrock shield bounces things back as magic that hits monsters
        pr.gone = true;
        Sound.play('block');
        this.sparkle(mx, my, '#7fd6ff');
        this.shots.push({
          x: mx - 9, y: my - 9, w: 18, h: 18, vx: p.facing * 560, vy: 0, dir: p.facing,
          el: pr.el || (pr.kind === 'gust' ? 'wind' : null),
          dmg: 2 + Save.data.upgrades.power, kb: 200, life: 1.2, spin: 0
        });
      } else if (pr.kind === 'gust') {
        pr.gone = true;
        if (p.blocking && fromFront) {
          Sound.play('block');
        } else if (p.invuln <= 0) {
          p.vx = Math.sign(pr.vx) * 560;
          p.vy = Math.min(p.vy, -260);
          p.knockT = 0.4;
          p.onGround = false;
          this.popup('Whoosh!', p.cx, p.y - 10, '#d8ffe8');
        }
      } else if (pr.kind === 'web' || (pr.kind === 'breath' && pr.el === 'ice')) {
        if (p.blocking && fromFront) {
          Sound.play('block');
        } else if (pr.kind === 'breath') {
          p.chill();
        } else if (p.invuln <= 0) {
          p.webbed = 2;
          Sound.play('web');
          this.popup('Sticky!', p.cx, p.y - 10, '#ffffff');
        }
        pr.gone = true;
      } else if (p.hurt(pr)) {
        pr.gone = true;
      }
    }
    this.projectiles = this.projectiles.filter((pr) => !pr.gone);
  }

  // Fireballs from the fire wand
  updateShots(dt) {
    const p = this.player;
    for (const s of this.shots) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.spin += dt * 14;
      const mx = s.x + s.w / 2, my = s.y + s.h / 2;
      const colors = ELEMENTS[s.el || 'fire'].colors;
      if (Math.random() < 0.6) this.burst(mx, my, 1, colors, 40, 5, 0, 0.3);
      if (s.life <= 0 || isSolid(this.tile(Math.floor(mx / T), Math.floor(my / T)))) {
        s.gone = true;
        this.burst(mx, my, 6, colors, 100, 5, 0, 0.4);
        continue;
      }
      for (const e of this.enemies) {
        if (!e.dead && overlap(s, e)) {
          p.strike(e, s.dmg, s.dir, s.kb, s.el);
          this.burst(mx, my, 8, colors, 140, 6, 0, 0.4);
          s.gone = true;
          break;
        }
      }
      // Fireballs knock bones, webs and dragon breath out of the air
      for (const pr of this.projectiles) {
        if (s.gone || pr.gone || !overlap(s, pr)) continue;
        pr.gone = true;
        s.gone = true;
        this.burst(mx, my, 8, colors, 140, 6, 0, 0.4);
        this.addPoints(1, mx, my);
      }
    }
    this.shots = this.shots.filter((s) => !s.gone);
  }

  updateItems(dt) {
    const p = this.player;
    for (const it of this.items) {
      if (it.taken) continue;
      if (it.fall) {
        if (!it.landed) {
          it.y += it.vy * dt;
          if (it.y >= GROUND * T - 14) { it.y = GROUND * T - 14; it.landed = true; }
        } else {
          it.life -= dt;
          if (it.life <= 0) { it.taken = true; continue; }
        }
      }
      if (p.dead) continue;
      // Magnet Potion: coins and gems fly to Blockie
      if (p.magnet > 0 && (it.type === 'coin' || GEMS[it.type])) {
        const dx = p.cx - it.x, dy = p.cy - it.y;
        const d = Math.hypot(dx, dy);
        if (d < 300 && d > 1) {
          const step = Math.min(d, 480 * dt);
          it.x += dx / d * step;
          it.y += dy / d * step;
          it.landed = false;
          it.fall = false;
        }
      }
      const touching = p.x < it.x + 14 && p.x + p.w > it.x - 14 && p.y < it.y + 14 && p.y + p.h > it.y - 14;
      if (it.waitLeave) {
        if (!touching) it.waitLeave = false;
        continue;
      }
      if (touching) this.collect(it);
    }
    if (this.mode === 'gemrain') this.items = this.items.filter((it) => !it.taken);
  }

  collect(it) {
    const p = this.player;
    const type = it.type;
    if (type === 'coin') {
      it.taken = true;
      Sound.play('coin');
      this.sparkle(it.x, it.y, '#ffcc22');
      this.addPoints(1, it.x, it.y);
    } else if (GEMS[type]) {
      it.taken = true;
      Sound.play('gem');
      this.addGem(it.x, it.y, GEMS[type].value, type);
    } else if (FOOD.includes(type)) {
      it.taken = true;
      Sound.play('food');
      p.boost = 5;
      this.heal(1);
      this.addPoints(3, it.x, it.y);
    } else if (orbElement(type)) {
      const el = orbElement(type);
      it.taken = true;
      p.givePower(el);
      Sound.play('power');
      this.say(ELEMENTS[el].tip);
      this.burst(p.cx, p.cy, 16, ELEMENTS[el].colors, 220, 7, 0, 0.6);
      this.addPoints(3, it.x, it.y);
    } else if (POTIONS[type]) {
      it.taken = true;
      Sound.play('potion');
      this.say(POTIONS[type].tip);
      const time = POTIONS[type].time;
      if (type === 'healpot') this.heal(2, 'Glug glug!');
      else if (type === 'jumppot') p.superJump = time;
      else if (type === 'starpot') p.star = time;
      else if (type === 'magnetpot') p.magnet = time;
      this.burst(p.cx, p.cy, 14, [POTIONS[type].color, '#ffffff'], 200, 6, 0, 0.6);
      this.addPoints(3, it.x, it.y);
    } else if (WEAPONS[type]) {
      const old = p.weapon;
      p.weapon = type;
      Save.data.weapon = type;
      Save.write();
      Sound.play('select');
      this.say(PICKUP_TEXT[type]);
      // Drop the old weapon here so Blockie can swap back
      if (old !== 'none' && old !== type) {
        it.type = old;
        it.waitLeave = true;
      } else {
        it.taken = true;
      }
    } else if (ARMOR.includes(type) || BEDROCK[type]) {
      const bedrock = !!BEDROCK[type];
      if (p.wear(BEDROCK[type] || type, bedrock)) {
        it.taken = true;
        Sound.play('armor');
        this.say(PICKUP_TEXT[type]);
      } else {
        // already wearing a stronger bedrock piece: leave this one here
        it.waitLeave = true;
        this.say('Your bedrock one is stronger!');
      }
    }
  }

  updateCheckpoints() {
    const p = this.player;
    if (p.dead) return;
    for (const cp of this.checkpoints) {
      if (cp.on || p.x + p.w < cp.x) continue;
      cp.on = true;
      if (cp.x > this.spawn.x) this.spawn = { x: cp.x - 12, y: cp.y };
      Sound.play('checkpoint');
      this.popup('Checkpoint!', cp.x, cp.y - 120, '#ffe14d');
    }
  }

  updateFlag(dt) {
    const f = this.flag;
    const p = this.player;
    if (!f) return;
    if (f.up && f.rise < 1) f.rise = Math.min(1, f.rise + dt * 0.8);
    if (!f.up || this.winning || p.dead || this.done) return;
    if (p.x + p.w < f.x || p.x > f.x + 40) return;

    if (this.def.chaser) {
      this.result = 'escaped';
      for (let i = 0; i < 5; i++) this.addGem(p.cx, p.y);
      Sound.play('win');
      this.done = 'bonusEnd';
    } else if (this.points >= this.target) {
      this.winning = true;
      this.winT = 2.5;
      Sound.play('win');
      this.say('You did it!');
    } else if (this.needT <= 0) {
      this.say(`Get ${this.target - this.points} more points!`);
      this.needT = 2.5;
      Sound.play('nope');
    }
  }

  updateGemRain(dt) {
    this.timer -= dt;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.timer > 0.5) {
      this.spawnT = 0.28;
      const r = Math.random();
      const type = r < 0.4 ? 'gem' : r < 0.5 ? 'emerald' : r < 0.55 ? 'ruby' : r < 0.57 ? 'diamond'
        : r < 0.87 ? 'coin' : FOOD[Math.floor(Math.random() * FOOD.length)];
      this.items.push({
        type, x: 40 + Math.random() * (W - 80), y: -20, phase: Math.random() * 6,
        fall: true, vy: 90 + Math.random() * 90, life: 2.5, taken: false
      });
    }
    if (this.timer <= 0) {
      this.result = 'time';
      this.done = 'bonusEnd';
    }
  }

  updateChase(dt) {
    const p = this.player;
    this.timer -= dt;
    const speed = 150 + 90 * Math.min(1, this.time / this.def.time);
    for (const ch of this.chasers) {
      ch.x += speed * dt;
      if (!this.done && overlap({ x: ch.x + 8, y: ch.y, w: ch.w - 16, h: ch.h }, p)) {
        this.result = 'caught';
        Sound.play(this.def.chaser === 'dino' ? 'roar' : 'web');
        this.done = 'bonusEnd';
      }
    }
    if (!this.done && this.timer <= 0) {
      this.result = 'time';
      this.done = 'bonusEnd';
    }
  }

  // ---------- drawing ----------

  draw(ctx) {
    const th = this.theme;
    let sx = 0, sy = 0;
    if (this.shake > 0) {
      sx = (Math.random() - 0.5) * 10;
      sy = (Math.random() - 0.5) * 10;
    }
    const cam = Math.round(this.camX);
    drawBackdrop(ctx, th, this.camX, this.time);

    ctx.save();
    ctx.translate(-cam + sx, sy);
    const viewL = cam - 200, viewR = cam + W + 200;

    if (th.water || th.lava) {
      const wave = Math.sin(this.time * 2) * 3;
      box(ctx, cam - 20, GROUND * T + 14 + wave, W + 40, H, th.water || th.lava);
      box(ctx, cam - 20, GROUND * T + 14 + wave, W + 40, 4, th.water ? '#7fc8ff' : '#ffe14d');
    }
    for (const d of this.decos) {
      const x = d.c * T;
      if (x > viewL - 150 && x < viewR) drawDeco(ctx, d, th, this.time);
    }
    for (const cp of this.checkpoints) {
      if (cp.x > viewL && cp.x < viewR) this.drawCheckpoint(ctx, cp);
    }
    this.drawTiles(ctx, cam);
    if (this.flag) this.drawFlag(ctx);
    for (const it of this.items) {
      if (!it.taken && it.x > viewL && it.x < viewR) this.drawItem(ctx, it);
    }
    for (const a of this.animals) {
      if (a.x + a.w > viewL && a.x < viewR) a.draw(ctx);
    }
    for (const e of this.enemies) {
      if (e.x + e.w > viewL && e.x < viewR) {
        if (e.angry) e.drawAura(ctx);
        e.draw(ctx);
        if (e.frozen > 0) {
          // a block of ice
          box(ctx, e.x - 4, e.y - 6, e.w + 8, e.h + 6, 'rgba(150,220,255,0.5)');
          box(ctx, e.x - 4, e.y - 6, e.w + 8, 4, 'rgba(255,255,255,0.8)');
          box(ctx, e.x, e.y, 4, e.h * 0.6, 'rgba(255,255,255,0.6)');
        }
      }
    }
    this.player.draw(ctx);
    this.chasers.forEach((ch, i) => {
      if (this.def.chaser === 'dino') {
        drawDino(ctx, ch.x + ch.w / 2, ch.y + ch.h, 1, 0.75, this.time * 1.6 + i, false, { el: DINO_ELEMENTS[i] });
      } else {
        drawSpider(ctx, ch.x + ch.w / 2, ch.y + ch.h, 1, 0.42, this.time * 1.6, false);
      }
    });
    for (const pr of this.projectiles) this.drawProjectile(ctx, pr);
    for (const s of this.shots) {
      ctx.save();
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      drawFireball(ctx, s.el, s.spin);
      ctx.restore();
    }
    for (const b of this.bolts) this.drawBolt(ctx, b);
    for (const pt of this.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      box(ctx, pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size, pt.color);
    }
    ctx.globalAlpha = 1;
    for (const pop of this.popups) {
      ctx.globalAlpha = Math.max(0, 1 - pop.t / 1.2);
      say(ctx, pop.text, pop.x, pop.y - pop.t * 40, 20, pop.color);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (th.dark) {
      const p = this.player;
      const px = p.cx - cam, py = p.cy;
      const g = ctx.createRadialGradient(px, py, 120, px, py, 560);
      g.addColorStop(0, 'rgba(10,0,20,0)');
      g.addColorStop(1, 'rgba(10,0,20,0.6)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawTiles(ctx, cam) {
    const th = this.theme;
    const c1 = Math.max(0, Math.floor(cam / T) - 1);
    const c2 = Math.min(this.cols - 1, c1 + Math.ceil(W / T) + 2);
    for (let c = c1; c <= c2; c++) {
      if (!th.water && !th.lava && this.tile(c, GROUND) === TILE.EMPTY && this.tile(c, ROWS - 1) === TILE.EMPTY) {
        box(ctx, c * T, GROUND * T + 14, T + 0.5, H, 'rgba(25,12,30,0.55)');
      }
      for (let r = 0; r < ROWS; r++) {
        const t = this.map[r * this.cols + c];
        if (t) drawTile(ctx, th, t, c, r, !isSolid(this.tile(c, r - 1)));
      }
    }
  }

  drawCheckpoint(ctx, cp) {
    const x = cp.c * T, y = cp.y;
    box(ctx, x, y - 96, 72, 96, '#8f8f99');
    for (let i = 0; i < 4; i++) box(ctx, x + i * 20, y - 108, 12, 12, '#8f8f99');
    for (let k = 1; k < 6; k++) box(ctx, x, y - 96 + k * 16, 72, 2, '#77777f');
    box(ctx, x, y - 96, 72, 4, '#b5b5c0');
    box(ctx, x + 22, y - 46, 28, 46, '#3a2516');
    box(ctx, x + 26, y - 50, 20, 4, '#3a2516');
    box(ctx, x + 35, y - 46, 2, 46, '#5a3a22');
    box(ctx, x + 34, y - 160, 4, 52, '#5a3a1a');
    const wave = Math.sin(this.time * 5 + cp.c) * 3;
    poly(ctx, cp.on ? '#e01e1e' : '#a8a8b0', [x + 38, y - 160, x + 70, y - 151 + wave, x + 38, y - 140]);
  }

  drawFlag(ctx) {
    const f = this.flag;
    const x = f.x, yb = f.y;
    box(ctx, x - 6, yb - 12, 24, 12, '#8d8d95');
    box(ctx, x + 3, yb - 200, 6, 190, '#e8e8ee');
    box(ctx, x + 1, yb - 208, 10, 10, '#ffcc22');
    if (f.rise > 0) {
      const fy = yb - 50 - f.rise * 140;
      const wave = Math.sin(this.time * 6) * 4;
      poly(ctx, '#d7262e', [x + 9, fy, x + 74, fy + 8 + wave, x + 74, fy + 42 + wave, x + 9, fy + 46]);
      say(ctx, 'B', x + 40, fy + 24 + wave / 2, 22, '#ffffff');
    }
  }

  drawItem(ctx, it) {
    const bob = it.fall ? 0 : Math.sin(this.time * 3 + it.phase) * 3;
    const x = it.x, y = it.y + bob;
    if (it.fall && it.landed && it.life < 0.8 && Math.floor(it.life * 10) % 2 === 0) return;
    if (it.type === 'coin') {
      drawCoin(ctx, x, y, 1, 0.3 + Math.abs(Math.cos(this.time * 3 + it.phase)) * 0.7);
    } else if (GEMS[it.type]) {
      drawGem(ctx, x, y, it.type === 'gem' ? 1.1 : 1.3, it.type);
      if (it.type === 'diamond' && Math.sin(this.time * 4 + it.phase) > 0.6) drawStar(ctx, x + 8, y - 10, 6, '#ffffff');
    } else if (orbElement(it.type)) {
      drawOrb(ctx, orbElement(it.type), x, y, 1, this.time);
    } else if (POTIONS[it.type]) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(x, y, 20 + Math.sin(this.time * 5) * 2, 0, Math.PI * 2);
      ctx.fill();
      drawPotion(ctx, it.type, x, y, 1.2);
    } else if (FOOD.includes(it.type)) {
      drawFood(ctx, it.type, x, y, 1.2);
    } else if (BEDROCK[it.type]) {
      ctx.fillStyle = 'rgba(127,214,255,0.4)';
      ctx.beginPath();
      ctx.arc(x, y, 24 + Math.sin(this.time * 5) * 3, 0, Math.PI * 2);
      ctx.fill();
      drawArmorIcon(ctx, BEDROCK[it.type], x, y, 1.2, true);
    } else if (WEAPONS[it.type] || ARMOR.includes(it.type)) {
      ctx.fillStyle = 'rgba(255,230,120,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 24 + Math.sin(this.time * 5) * 3, 0, Math.PI * 2);
      ctx.fill();
      if (WEAPONS[it.type]) {
        ctx.save();
        ctx.translate(x - 4, y + 14);
        ctx.rotate(0.5);
        const s = it.type === 'spear' ? 0.55 : it.type === 'firewand' ? 0.75 : 0.85;
        ctx.scale(s, s);
        drawWeapon(ctx, it.type);
        ctx.restore();
      } else {
        drawArmorIcon(ctx, it.type, x, y, 1.2);
      }
    }
  }

  drawProjectile(ctx, pr) {
    ctx.save();
    ctx.translate(pr.x + pr.w / 2, pr.y + pr.h / 2);
    if (pr.wait > 0) ctx.translate(Math.sin(this.time * 60) * 2, 0);
    if (pr.kind === 'shock') {
      // a little wall of energy, tallest at the front
      const [main, light] = pr.el ? ELEMENTS[pr.el].colors : ['#a88a5a', '#e8d8b0'];
      ctx.scale(Math.sign(pr.vx) || 1, 1);
      const flick = Math.sin(this.time * 30) * 3;
      box(ctx, -14, -2, 8, 13, main);
      box(ctx, -6, -6 - flick, 8, 17 + flick, main);
      box(ctx, 2, -11 + flick, 10, 22 - flick, main);
      box(ctx, 4, -9 + flick, 5, 16 - flick, light);
    } else if (pr.kind === 'gust') {
      ctx.strokeStyle = 'rgba(230,255,240,0.85)';
      ctx.lineWidth = 4;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(0, -12 + k * 12, 10 + k * 2, pr.spin + k, pr.spin + k + 4);
        ctx.stroke();
      }
    } else if (pr.kind === 'snowball') {
      ctx.rotate(pr.spin * 0.5);
      box(ctx, -10, -7, 20, 14, '#e8f2ff');
      box(ctx, -7, -10, 14, 20, '#e8f2ff');
      box(ctx, -6, -7, 6, 5, '#ffffff');
      box(ctx, 3, 3, 5, 4, '#bcd0ea');
    } else if (pr.kind === 'icicle') {
      poly(ctx, '#bff6ff', [-11, -13, 11, -13, 0, 15]);
      poly(ctx, '#ffffff', [-6, -13, 0, -13, -1, 6]);
      box(ctx, -12, -15, 24, 4, '#7fd6ff');
    } else if (pr.kind === 'rock') {
      ctx.rotate(pr.spin * 0.4);
      box(ctx, -14, -11, 28, 22, '#3a3a42');
      box(ctx, -11, -14, 22, 28, '#3a3a42');
      box(ctx, -9, -9, 8, 6, '#5a5a66');
      box(ctx, 3, 3, 6, 5, '#1e1e24');
      box(ctx, -2, 5, 4, 3, '#ff7a1f');
    } else if (pr.kind === 'bone') {
      ctx.rotate(pr.spin);
      box(ctx, -8, -2, 16, 4, '#f2f0e6');
      box(ctx, -11, -4, 5, 8, '#f2f0e6');
      box(ctx, 6, -4, 5, 8, '#f2f0e6');
    } else if (pr.kind === 'breath') {
      drawFireball(ctx, pr.el, pr.spin, 1.1);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 4 + pr.spin * 0.2;
        ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13);
        ctx.lineTo(-Math.cos(a) * 13, -Math.sin(a) * 13);
      }
      ctx.moveTo(8, 0);
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // A zig-zag lightning flash between two monsters
  drawBolt(ctx, b) {
    const pts = [b.x1, b.y1];
    for (let k = 1; k < 5; k++) {
      pts.push(b.x1 + (b.x2 - b.x1) * k / 5 + (Math.random() - 0.5) * 20,
        b.y1 + (b.y2 - b.y1) * k / 5 + (Math.random() - 0.5) * 20);
    }
    pts.push(b.x2, b.y2);
    for (const [col, width] of [['#ffe14d', 7], ['#ffffff', 3]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.stroke();
    }
  }

  // Powers and potions that are working right now, each with a bar that runs down.
  drawEffects(ctx) {
    const p = this.player;
    const list = [];
    if (p.power) {
      list.push({ draw: (x, y) => drawOrb(ctx, p.power, x, y, 0.8, this.time),
        left: p.powerT / POWER_TIME, color: ELEMENTS[p.power].colors[0] });
    }
    for (const [kind, left] of [['jumppot', p.superJump], ['starpot', p.star], ['magnetpot', p.magnet]]) {
      if (left > 0) {
        list.push({ draw: (x, y) => drawPotion(ctx, kind, x, y, 0.9),
          left: left / POTIONS[kind].time, color: POTIONS[kind].color });
      }
    }
    list.forEach((f, i) => {
      const x = 37 + i * 50, y = 124;
      f.draw(x, y);
      box(ctx, x - 19, y + 20, 38, 8, '#2a1410');
      box(ctx, x - 17, y + 22, 34 * Math.max(0, f.left), 4, f.color);
    });
  }

  drawHud(ctx) {
    const p = this.player;
    if (this.mode === 'level') {
      for (let i = 0; i < this.maxLives; i++) drawHeart(ctx, 16 + i * 34, 14, 4, i < this.lives);
    }

    // equipped weapon
    box(ctx, 14, 50, 46, 46, 'rgba(40,10,10,0.55)');
    ctx.strokeStyle = '#d7262e';
    ctx.lineWidth = 3;
    ctx.strokeRect(14.5, 50.5, 45, 45);
    if (p.weapon !== 'none') {
      ctx.save();
      ctx.translate(30, 88);
      ctx.rotate(0.75);
      const s = p.weapon === 'spear' ? 0.55 : p.weapon === 'firewand' ? 0.7 : 0.8;
      ctx.scale(s, s);
      drawWeapon(ctx, p.weapon);
      ctx.restore();
    } else {
      box(ctx, 30, 66, 14, 14, '#c9d1d8');
    }

    // armor pieces (bedrock ones show how many hits they have left)
    let ax = 82;
    for (const k of ARMOR) {
      if (!p.armor[k]) continue;
      const bed = p.armor.bedrock[k];
      drawArmorIcon(ctx, k, ax, 73, 1, bed);
      if (bed) say(ctx, String(p.armor[k]), ax + 12, 86, 14, '#bff6ff');
      ax += 32;
    }
    for (let i = 0; i < p.armor.extra; i++) { drawArmorIcon(ctx, 'extra', ax, 73, 1); ax += 32; }
    this.drawEffects(ctx);

    // points and gems
    if (this.mode === 'level') {
      const done = this.points >= this.target;
      say(ctx, `★ ${this.points} / ${this.target}`, W - 16, 30, 30, done ? '#ffe14d' : '#ffffff', 'right');
    } else {
      say(ctx, `★ ${this.points}`, W - 16, 30, 30, '#ffffff', 'right');
    }
    const gems = String(Save.data.gems);
    say(ctx, gems, W - 16, 70, 26, '#bff6ff', 'right');
    const tw = ctx.measureText(gems).width;
    drawGem(ctx, W - 34 - tw, 70, 1.1);

    // boss health bar
    if (this.bossActive && this.boss && !this.boss.dead) {
      const b = this.boss;
      say(ctx, b.angry ? b.name + ' - ANGRY!' : b.name, W / 2, 24, 24, '#ff6a5a');
      box(ctx, W / 2 - 162, 40, 324, 20, '#2a1410');
      const barColor = b.angry && Math.sin(this.time * 10) > 0 ? '#ff8a1f' : '#e01e1e';
      box(ctx, W / 2 - 160, 42, 320 * Math.max(0, b.hp) / b.maxHp, 16, barColor);
      box(ctx, W / 2 - 160, 42, 320 * Math.max(0, b.hp) / b.maxHp, 4, '#ff7a6a');
    }

    // bonus round timer
    if (this.mode !== 'level') {
      say(ctx, `${Math.max(0, Math.ceil(this.timer))}`, W / 2, 40, 44, this.timer < 5 ? '#ff6a5a' : '#ffffff');
    }

    if (this.bossBanner > 0) {
      ctx.globalAlpha = Math.min(1, this.bossBanner);
      say(ctx, this.boss.name.toUpperCase() + '!', W / 2, 200, 56, '#ff3a2a');
      ctx.globalAlpha = 1;
    }
    if (this.msg) {
      ctx.globalAlpha = Math.min(1, this.msg.t * 2);
      say(ctx, this.msg.text, W / 2, 130, 32, '#ffe14d');
      ctx.globalAlpha = 1;
    }
  }
}
