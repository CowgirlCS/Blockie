// Blockie, the monsters, and the friendly elephants.

const GRAVITY = 1700;
const MAX_FALL = 900;

// How each weapon feels. reach/h/oy/back describe the hit box in front of Blockie.
const WEAPONS = {
  none:  { name: 'Fists',      dmg: 1, reach: 24, h: 20, oy: 8,   back: 0,  cool: 0.30, swing: 0.15, kb: 120 },
  sword: { name: 'Sword',      dmg: 1, reach: 42, h: 32, oy: -2,  back: 0,  cool: 0.22, swing: 0.16, kb: 180 },
  spear: { name: 'Spear',      dmg: 1, reach: 86, h: 16, oy: 10,  back: 0,  cool: 0.38, swing: 0.22, kb: 140 },
  axe:   { name: 'Battle Axe', dmg: 3, reach: 56, h: 66, oy: -26, back: 16, cool: 0.62, swing: 0.32, kb: 240 },
  mace:  { name: 'Mace',       dmg: 2, reach: 46, h: 36, oy: -2,  back: 0,  cool: 0.50, swing: 0.28, kb: 560 }
};

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Move something through the map, stopping at walls, floors and ceilings.
function moveBody(world, b, dt) {
  b.hitWall = false;
  b.x += b.vx * dt;
  if (b.vx > 0) {
    const c = Math.floor((b.x + b.w) / T);
    if (world.solidInColumn(c, b.y, b.y + b.h)) { b.x = c * T - b.w - 0.01; b.vx = 0; b.hitWall = true; }
  } else if (b.vx < 0) {
    const c = Math.floor(b.x / T);
    if (world.solidInColumn(c, b.y, b.y + b.h)) { b.x = (c + 1) * T + 0.01; b.vx = 0; b.hitWall = true; }
  }

  const oldBottom = b.y + b.h;
  b.y += b.vy * dt;
  b.onGround = false;
  const c1 = Math.floor((b.x + 1) / T);
  const c2 = Math.floor((b.x + b.w - 1) / T);
  if (b.vy >= 0) {
    const r = Math.floor((b.y + b.h) / T);
    for (let c = c1; c <= c2; c++) {
      const t = world.tile(c, r);
      if (isSolid(t) || (isOneWay(t) && oldBottom <= r * T + 1)) {
        b.y = r * T - b.h;
        b.vy = 0;
        b.onGround = true;
        break;
      }
    }
  } else {
    const r = Math.floor(b.y / T);
    for (let c = c1; c <= c2; c++) {
      if (isSolid(world.tile(c, r))) {
        b.y = (r + 1) * T;
        b.vy = 0;
        break;
      }
    }
  }
}

// ======================= Blockie =======================

class Player {
  constructor(world, x, feetY) {
    this.world = world;
    this.w = 24;
    this.h = 34;
    this.weapon = Save.data.weapon || 'none';
    this.armor = { helmet: false, chest: false, shield: false, extra: Save.data.upgrades.armor };
    this.respawn(x, feetY);
  }

  respawn(x, feetY) {
    this.x = x;
    this.y = feetY - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.riding = null;
    this.dead = false;
    this.deadT = 0;
    this.invuln = 0;
    this.safe = 0;
    this.knockT = 0;
    this.attackT = 0;
    this.cool = 0;
    this.hitList = [];
    this.coyote = 0;
    this.jumpBuf = 0;
    this.boost = 0;
    this.webbed = 0;
    this.walkT = 0;
    this.blocking = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  armorCount() {
    const a = this.armor;
    return (a.helmet ? 1 : 0) + (a.chest ? 1 : 0) + (a.shield ? 1 : 0) + a.extra;
  }

  speed() {
    let s = 210 * (1 + 0.12 * Save.data.upgrades.speed);
    if (this.boost > 0) s *= 1.35;
    if (this.webbed > 0) s *= 0.45;
    return s;
  }

  jumpPower() {
    return (this.webbed > 0 ? 500 : 640) + 45 * Save.data.upgrades.jump;
  }

  update(dt) {
    const w = this.world;
    if (this.dead) {
      this.deadT += dt;
      this.vy += GRAVITY * 0.7 * dt;
      this.y += this.vy * dt;
      if (this.deadT > 1.4) w.afterDeath();
      return;
    }

    this.invuln -= dt;
    this.safe -= dt;
    this.boost -= dt;
    this.webbed -= dt;
    this.coyote -= dt;
    this.jumpBuf -= dt;
    this.cool -= dt;
    this.attackT -= dt;
    this.knockT -= dt;

    const frozen = w.winning;
    this.blocking = !frozen && Input.held('down') && this.armor.shield && this.attackT <= 0;

    let dir = 0;
    if (!frozen && !this.blocking) {
      if (Input.held('left')) dir -= 1;
      if (Input.held('right')) dir += 1;
    }
    if (dir !== 0) this.facing = dir;

    if (this.knockT <= 0) {
      const target = dir * this.speed();
      const accel = this.onGround ? 2400 : 1600;
      if (this.vx < target) this.vx = Math.min(target, this.vx + accel * dt);
      else if (this.vx > target) this.vx = Math.max(target, this.vx - accel * dt);
    }

    // Jumping (with a little forgiveness for pressing early or late)
    if (!frozen && Input.hit('up')) this.jumpBuf = 0.13;
    if (this.onGround) this.coyote = 0.1;
    if (this.jumpBuf > 0 && this.coyote > 0 && !this.blocking) {
      this.vy = -this.jumpPower();
      this.jumpBuf = 0;
      this.coyote = 0;
      this.onGround = false;
      this.riding = null;
      Sound.play('jump');
    }
    if (!Input.held('up') && this.vy < -260) this.vy = -260;   // let go early = smaller jump
    if (frozen && this.onGround) this.vy = -380;                // happy hops at the flag

    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);

    // Riding an elephant moves Blockie along with it
    if (this.riding) this.x += this.riding.dx;
    const oldBottom = this.y + this.h;
    moveBody(w, this, dt);
    this.riding = null;
    if (!this.onGround && this.vy >= 0) {
      for (const el of w.elephants) {
        if (this.x + this.w > el.x + 10 && this.x < el.x + el.w - 10 &&
            oldBottom <= el.y + 6 && this.y + this.h >= el.y) {
          this.y = el.y - this.h;
          this.vy = 0;
          this.onGround = true;
          this.riding = el;
          break;
        }
      }
    }

    // Attacking
    if (!frozen && Input.hit('attack') && this.cool <= 0 && !this.blocking) {
      const wp = WEAPONS[this.weapon];
      this.attackT = wp.swing;
      this.cool = wp.cool;
      this.hitList = [];
      Sound.play(this.weapon === 'none' ? 'punch' : 'swing');
    }
    if (this.attackT > 0) this.doHits();

    if (this.onGround && Math.abs(this.vx) > 10) this.walkT += Math.abs(this.vx) * dt;
    if (this.y > ROWS * T + 40) this.fallInPit();
  }

  attackBox() {
    const wp = WEAPONS[this.weapon];
    const x = this.facing > 0 ? this.x + this.w - wp.back : this.x - wp.reach;
    return { x, y: this.y + wp.oy, w: wp.reach + wp.back, h: wp.h };
  }

  doHits() {
    const wp = WEAPONS[this.weapon];
    const progress = 1 - this.attackT / wp.swing;
    if (progress < 0.15 || progress > 0.85) return;
    const hb = this.attackBox();
    const dmg = wp.dmg + Save.data.upgrades.power;
    for (const e of this.world.enemies) {
      if (e.dead || this.hitList.includes(e)) continue;
      if (overlap(hb, e)) {
        this.hitList.push(e);
        e.damage(dmg, this.facing, wp.kb);
        this.world.sparkle(e.cx, e.cy, '#ffffff');
      }
    }
    // Bones can be smashed out of the air
    for (const pr of this.world.projectiles) {
      if (pr.kind === 'bone' && !pr.gone && overlap(hb, pr)) {
        pr.gone = true;
        Sound.play('block');
        this.world.addPoints(1, pr.x, pr.y);
      }
    }
  }

  // Something touched Blockie. Returns true if it "used up" the hit.
  hurt(src) {
    const w = this.world;
    if (this.dead || this.invuln > 0 || this.safe > 0 || w.winning) return false;
    const away = src.x + src.w / 2 < this.cx ? 1 : -1;   // push away from the danger
    const fromFront = away === -this.facing;

    if (this.blocking && fromFront) {
      Sound.play('block');
      w.sparkle(this.cx + this.facing * 14, this.cy, '#ffe14d');
      this.safe = 0.35;
      this.vx = away * 120;
      this.knockT = 0.1;
      if (src.knockBack) src.knockBack(-away, 300);
      return true;
    }

    if (this.armorCount() > 0) {
      const a = this.armor;
      let piece;
      if (a.extra > 0) { a.extra--; piece = 'Gold armor'; }
      else if (a.chest) { a.chest = false; piece = 'Chest plate'; }
      else if (a.helmet) { a.helmet = false; piece = 'Helmet'; }
      else { a.shield = false; piece = 'Shield'; }
      Sound.play('armor');
      w.popup(piece + ' broke!', this.cx, this.y - 10, '#d5dde3');
      w.burst(this.cx, this.cy, 10, ['#d5dde3', '#ffffff', '#ffcc22'], 180, 6, 500, 0.6);
      this.invuln = 1.5;
      this.vx = away * 260;
      this.vy = -320;
      this.knockT = 0.25;
      return true;
    }

    this.die();
    return true;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.deadT = 0;
    this.vy = -520;
    this.vx = 0;
    this.riding = null;
    this.attackT = 0;
    Sound.play('hurt');
    this.world.popup('Oops!', this.cx, this.y - 10);
    this.world.shake = 0.25;
  }

  fallInPit() {
    if (this.dead) return;
    if (this.world.theme.water) {
      Sound.play('splash');
      this.world.burst(this.cx, GROUND * T + 20, 14, ['#7fc8ff', '#ffffff'], 220, 7, 600, 0.7);
    }
    this.die();
    this.vy = 0;
    this.deadT = 0.6;
  }

  draw(ctx) {
    if (!this.dead && this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return;
    const wp = WEAPONS[this.weapon];
    drawBlockie(ctx, this.cx, this.y + this.h, {
      facing: this.facing,
      walk: this.onGround ? this.walkT : 0,
      air: !this.onGround,
      weapon: this.weapon,
      swing: this.attackT > 0 ? 1 - this.attackT / wp.swing : -1,
      armor: this.armor,
      blocking: this.blocking,
      spin: this.dead ? this.deadT * 9 : 0,
      boost: this.boost > 0,
      webbed: this.webbed > 0
    });
  }
}

// ======================= Monsters =======================

class Enemy {
  // x is the middle of the enemy, feetY is where its feet are.
  constructor(world, type, x, feetY, w, h, hp, points) {
    this.world = world;
    this.type = type;
    this.w = w;
    this.h = h;
    this.x = x - w / 2;
    this.y = feetY - h;
    this.vx = 0;
    this.vy = 0;
    this.dir = -1;
    this.hp = hp;
    this.maxHp = hp;
    this.points = points;
    this.flash = 0;
    this.knockT = 0;
    this.iframe = 0;
    this.t = Math.random() * 10;
    this.onGround = false;
    this.hitWall = false;
    this.dead = false;
    this.kbMul = 1;
    this.falls = true;
    this.summoned = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(dt) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.iframe > 0) this.iframe -= dt;
    if (this.knockT > 0) {
      this.knockT -= dt;
      this.vx *= Math.pow(0.03, dt);
    } else {
      this.think(dt);
    }
    if (this.falls) {
      const wasInAir = !this.onGround;
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
      moveBody(this.world, this, dt);
      if (wasInAir && this.onGround) this.landed();
    }
    if (this.y > ROWS * T + 80) { this.defeat(); return; }
    this.touchPlayer();
  }

  think(dt) {}
  landed() {}

  touchPlayer() {
    const p = this.world.player;
    if (p.dead) return;
    const m = 4;   // a little forgiveness around the edges
    if (p.x < this.x + this.w - m && p.x + p.w > this.x + m &&
        p.y < this.y + this.h - m && p.y + p.h > this.y + m) {
      p.hurt(this);
    }
  }

  // Walk back and forth, turning around at walls and ledges.
  patrol(speed) {
    if (this.hitWall) {
      this.dir *= -1;
    } else if (this.onGround) {
      const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
      const below = this.world.tile(Math.floor(fx / T), Math.floor((this.y + this.h + 4) / T));
      if (!isSolid(below) && !isOneWay(below)) this.dir *= -1;
    }
    this.vx = this.dir * speed;
  }

  damage(dmg, dir, kb) {
    if (this.dead || this.iframe > 0) return false;
    this.hp -= dmg;
    this.flash = 0.15;
    if (this.isBoss) {
      this.iframe = 0.4;
      this.world.shake = 0.15;
    }
    this.knockBack(dir, kb);
    if (this.hp <= 0) this.defeat();
    else Sound.play('hit');
    return true;
  }

  knockBack(dir, kb) {
    this.vx = dir * kb * this.kbMul;
    this.knockT = this.isBoss ? 0.12 : 0.25;
    if (this.onGround && this.falls) this.vy = -Math.min(320, kb * 0.6) * this.kbMul;
  }

  defeat() {
    if (this.dead) return;
    this.dead = true;
    this.world.poof(this.cx, this.cy, this.isBoss);
    this.world.addPoints(this.points, this.cx, this.y);
    Sound.play('defeat');
  }

  draw(ctx) {}
}

class Zombie extends Enemy {
  constructor(world, x, feetY) {
    super(world, 'zombie', x, feetY, 24, 36, 2, 5);
  }
  think() { this.patrol(34); }
  draw(ctx) {
    drawZombie(ctx, this.cx, this.y + this.h, this.dir, 1, this.t, this.flash > 0);
  }
}

class Skeleton extends Enemy {
  constructor(world, x, feetY) {
    super(world, 'skeleton', x, feetY, 24, 38, 2, 8);
    this.throwT = 1 + Math.random() * 2;
    this.windup = 0;
  }

  think(dt) {
    const p = this.world.player;
    const dx = p.cx - this.cx;
    this.throwT -= dt;
    if (this.windup > 0) {
      this.vx = 0;
      this.windup -= dt;
      if (this.windup <= 0) {
        this.world.projectiles.push({
          kind: 'bone', x: this.cx - 8, y: this.y + 6, w: 16, h: 10,
          vx: this.dir * 250, vy: -90, g: 220, life: 3, spin: 0
        });
        Sound.play('throw');
      }
      return;
    }
    if (this.throwT <= 0 && !p.dead && Math.abs(dx) < 520 && Math.abs(p.cy - this.cy) < 150) {
      this.dir = dx < 0 ? -1 : 1;
      this.windup = 0.5;
      this.throwT = 2.4 + Math.random() * 1.2;
      return;
    }
    this.patrol(28);
  }

  draw(ctx) {
    drawSkeleton(ctx, this.cx, this.y + this.h, this.dir, 1, this.t, this.flash > 0, { windup: this.windup > 0 });
  }
}

class Spider extends Enemy {
  constructor(world, x, feetY, opts = {}) {
    const small = !!opts.small;
    super(world, 'spider', x, feetY, small ? 28 : 52, small ? 15 : 27, small ? 1 : 2, small ? 3 : 8);
    this.scale = small ? 0.27 : 0.48;
    this.speed = small ? 120 : 100;
    this.hanging = !!opts.drop;
    if (this.hanging) {
      this.falls = false;
      this.homeY = (opts.hang || 3) * T;
      this.y = this.homeY;
    }
  }

  think(dt) {
    const p = this.world.player;
    const dx = p.cx - this.cx;
    if (this.hanging) {
      this.vx = 0;
      this.y = this.homeY + Math.sin(this.t * 2) * 6;
      if (!p.dead && Math.abs(dx) < 150 && p.y > this.y) this.drop();
      return;
    }
    if (!p.dead && Math.abs(dx) < 280 && Math.abs(p.cy - this.cy) < 70) this.dir = dx < 0 ? -1 : 1;
    this.patrol(this.speed);
  }

  drop() {
    this.hanging = false;
    this.falls = true;
    this.vy = 0;
    Sound.play('web');
  }

  damage(dmg, dir, kb) {
    if (this.hanging) this.drop();
    return super.damage(dmg, dir, kb);
  }

  draw(ctx) {
    if (this.hanging) box(ctx, this.cx - 1, 0, 2, this.y + 4, 'rgba(255,255,255,0.7)');
    drawSpider(ctx, this.cx, this.y + this.h, this.dir, this.scale, this.t, this.flash > 0);
  }
}

class Mob extends Enemy {
  constructor(world, x, feetY, opts = {}) {
    super(world, 'mob', x, feetY, 20, 20, 1, 3);
    this.hopT = Math.random() * 0.5;
    this.color = opts.color || ['#8a4fd0', '#e07b2a', '#2fa5d0', '#d04f8a'][Math.floor(Math.random() * 4)];
  }

  think(dt) {
    if (!this.onGround) return;
    this.vx = 0;
    this.hopT -= dt;
    if (this.hopT > 0) return;
    const p = this.world.player;
    const dx = p.cx - this.cx;
    const near = !p.dead && Math.abs(dx) < 420;
    let dir = near ? (dx < 0 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
    // don't hop into a hole
    const ahead = this.world.tile(Math.floor((this.cx + dir * 50) / T), Math.floor((this.y + this.h + 4) / T));
    if (!isSolid(ahead) && !isOneWay(ahead)) dir = -dir;
    this.dir = dir;
    this.vx = dir * (near ? 130 : 60);
    this.vy = -260 - Math.random() * 120;
    this.hopT = 0.15 + Math.random() * 0.25;
  }

  draw(ctx) {
    drawMob(ctx, this.cx, this.y + this.h, this.dir, 1, this.t, this.flash > 0, { color: this.color });
  }
}

// A crate that turns into a big robot when Blockie gets close.
class Robot extends Enemy {
  constructor(world, x, feetY) {
    super(world, 'robot', x, feetY, 40, 40, 4, 12);
    this.state = 'box';
    this.st = 0;
  }

  think(dt) {
    const p = this.world.player;
    if (this.state === 'box') {
      this.vx = 0;
      if (!p.dead && Math.abs(p.cx - this.cx) < 270) this.startTransform();
    } else if (this.state === 'transform') {
      this.vx = 0;
      this.st += dt;
      this.setHeight(40 + 16 * Math.min(1, this.st / 0.8));
      if (this.st >= 0.8) this.state = 'robot';
    } else {
      this.dir = p.cx < this.cx ? -1 : 1;
      const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
      const below = this.world.tile(Math.floor(fx / T), Math.floor((this.y + this.h + 4) / T));
      const ledge = this.onGround && !isSolid(below) && !isOneWay(below);
      this.vx = ledge ? 0 : this.dir * 60;
      if (this.hitWall && this.onGround) this.vy = -520;
    }
  }

  startTransform() {
    if (this.state !== 'box') return;
    this.state = 'transform';
    this.st = 0;
    Sound.play('transform');
  }

  setHeight(h) {
    const bottom = this.y + this.h;
    this.h = h;
    this.y = bottom - h;
  }

  damage(dmg, dir, kb) {
    this.startTransform();
    return super.damage(dmg, dir, kb);
  }

  draw(ctx) {
    const c = (col) => (this.flash > 0 ? '#ffffff' : col);
    ctx.save();
    ctx.translate(Math.round(this.cx), Math.round(this.y + this.h));
    if (this.state === 'box' || (this.state === 'transform' && this.st < 0.3)) {
      const shake = this.state === 'transform' ? Math.sin(this.st * 80) * 2 : 0;
      ctx.translate(shake, 0);
      box(ctx, -20, -40, 40, 40, c('#5a6a7a'));
      box(ctx, -20, -40, 40, 4, c('#7a8a9a'));
      box(ctx, -20, -26, 40, 5, c('#d7262e'));
      box(ctx, -20, -12, 40, 5, c('#2b56c4'));
      box(ctx, -4, -36, 8, 6, Math.sin(this.t * 6) > 0 ? '#ffe14d' : '#7a6a20');
    } else {
      const f = this.state === 'robot' ? 1 : Math.min(1, (this.st - 0.3) / 0.5);
      ctx.scale(this.dir, 1);
      const step = this.state === 'robot' ? Math.sin(this.t * 6) * 3 : 0;
      const legH = 16 * f;
      box(ctx, -14 + step, -legH, 10, legH, c('#2a3a7a'));
      box(ctx, 4 - step, -legH, 10, legH, c('#2a3a7a'));
      const top = -legH - 28;
      box(ctx, -24, top + 2, 7, 20 * f, c('#2b56c4'));
      box(ctx, 17, top + 2, 7, 20 * f, c('#2b56c4'));
      box(ctx, -18, top, 36, 28, c('#d32f2f'));
      box(ctx, -18, top, 36, 4, c('#ff6a5a'));
      box(ctx, -14, top + 6, 12, 8, c('#7fd6ff'));
      box(ctx, 2, top + 6, 12, 8, c('#7fd6ff'));
      box(ctx, -6, top + 18, 12, 7, c('#9aa6ae'));
      const hh = 14 * f;
      box(ctx, -9, top - hh, 18, hh, c('#2b56c4'));
      box(ctx, -6, top - hh + 4 * f, 12, 4 * f, '#ffe14d');
      box(ctx, -1, top - hh - 5 * f, 2, 5 * f, c('#9aa6ae'));
    }
    ctx.restore();
  }
}

function makeEnemy(world, e) {
  const x = (e.c + 0.5) * T;
  const y = e.r * T;
  switch (e.type) {
    case 'zombie': return new Zombie(world, x, y);
    case 'skeleton': return new Skeleton(world, x, y);
    case 'spider': return new Spider(world, x, y, e.opts);
    case 'mob': return new Mob(world, x, y, e.opts);
    case 'robot': return new Robot(world, x, y);
  }
  throw new Error('Unknown enemy: ' + e.type);
}

// ======================= Elephants =======================

class Elephant {
  constructor(world, c1, c2) {
    this.world = world;
    this.w = 96;
    this.h = 58;
    this.minX = c1 * T;
    this.maxX = (c2 + 1) * T - this.w;
    this.x = this.minX + (this.maxX - this.minX) * 0.3;
    this.y = GROUND * T - this.h;
    this.dir = 1;
    this.dx = 0;
    this.t = Math.random() * 5;
    this.happy = 0;
    this.gave = false;
  }

  update(dt) {
    this.t += dt;
    this.happy -= dt;
    const old = this.x;
    this.x += this.dir * 30 * dt;
    if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
    if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
    this.dx = this.x - old;

    // Say hi to Blockie and give him a gem
    const p = this.world.player;
    if (!this.gave && !p.dead && p.x < this.x + this.w && p.x + p.w > this.x &&
        p.y + p.h >= this.y - 2 && p.y < this.y + this.h) {
      this.gave = true;
      this.happy = 2.5;
      Sound.play('elephant');
      this.world.addGem(this.x + this.w / 2, this.y - 10);
      this.world.popup('Toot toot!', this.x + this.w / 2, this.y - 40, '#ffb3d1');
      this.world.burst(this.x + this.w / 2, this.y, 10, ['#ff8ab0', '#ffc0d8'], 140, 7, -40, 1);
    }
  }

  draw(ctx) {
    drawElephant(ctx, this.x + this.w / 2, this.y + this.h, this.dir, this.t, this.happy > 0);
  }
}
