// The bosses of the Blockie Forest. Each one waits in a boss room at the end of its level.
// When a boss is down to half its health it gets ANGRY: it moves faster and uses new attacks.

class Boss extends Enemy {
  constructor(world, type, x, feetY, w, h, hp, name) {
    // Easy mode bosses have a bit less health.
    hp = Math.round(hp * (Save.data.mode === 'easy' ? 0.8 : 1));
    super(world, type, x, feetY, w, h, hp, 25);
    this.isBoss = true;
    this.name = name;
    this.kbMul = 0.15;
    this.homeX = this.x;
    this.homeY = this.y;
    this.timer = 2;
    this.jumpT = 3;
    this.spawnT = 3;
    this.angry = false;
  }

  // Go back to the start (used if Blockie loses a life during the fight).
  resetPos() {
    this.x = this.homeX;
    this.y = this.homeY;
    this.vx = 0;
    this.vy = 0;
    this.timer = 2;
    this.knockT = 0;
  }

  update(dt) {
    const w = this.world;
    if (!w.bossActive) {
      // Wait quietly until Blockie walks into the boss room.
      this.t += dt;
      this.vx = 0;
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
      moveBody(w, this, dt);
      return;
    }
    super.update(dt);
    const L = w.arenaX, R = L + W;
    if (this.x < L) { this.x = L; if (this.vx < 0) this.vx = 0; this.dir = 1; }
    if (this.x + this.w > R) { this.x = R - this.w; if (this.vx > 0) this.vx = 0; this.dir = -1; }
    if (!this.angry && !this.dead && this.hp <= this.maxHp / 2) this.enrage();
  }

  enrage() {
    const w = this.world;
    this.angry = true;
    w.say(this.name + ' is ANGRY!');
    w.shake = 0.4;
    w.burst(this.cx, this.cy, 24, ['#ff3a2a', '#ff8a1f', '#ffe14d'], 260, 9, 0, 0.7);
    Sound.play('roar');
  }

  // A red glow behind an angry boss.
  drawAura(ctx) {
    ctx.fillStyle = `rgba(255,60,30,${0.22 + Math.sin(this.t * 8) * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(this.cx, this.cy, this.w * 0.75, this.h * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  facePlayer() {
    this.dir = this.world.player.cx < this.cx ? -1 : 1;
  }

  minions() {
    const all = this.world.enemies.concat(this.world.newEnemies);
    return all.filter((e) => e.summoned && !e.dead).length;
  }

  summon(enemy) {
    enemy.summoned = true;
    this.world.newEnemies.push(enemy);
    this.world.poof(enemy.cx, enemy.cy);
  }

  stomp() {
    this.world.shake = 0.3;
    Sound.play('stomp');
    this.world.burst(this.cx, this.y + this.h, 12, ['#c9b48a', '#ffffff'], 200, 8, 200, 0.5);
  }

  // Waves that run along the ground both ways. Jump over them!
  shock(speed = 280, el = null) {
    for (const d of [-1, 1]) this.world.shockwave(this.cx + d * this.w / 2, this.y + this.h, d, el, speed);
  }

  // Things that hang at the top of the screen for a moment, then fall near Blockie.
  dropFromSky(kind, n) {
    const L = this.world.arenaX;
    const px = this.world.player.cx;
    for (let i = 0; i < n; i++) {
      const x = Math.max(L + 20, Math.min(L + W - 40, px + (i - (n - 1) / 2) * 110 + (Math.random() - 0.5) * 40));
      this.world.projectiles.push({
        kind, x: x - 12, y: 20, w: 24, h: 26, vx: 0, vy: 0, g: 900, life: 4, spin: 0, wait: 0.7 + i * 0.12
      });
    }
  }

  defeat() {
    if (this.dead) return;
    super.defeat();
    this.world.onBossDefeated(this);
  }
}

// Level 1: a big cranky zombie farmer who stomps around.
class Grumble extends Boss {
  constructor(world, x, feetY) {
    super(world, 'grumble', x, feetY, 52, 84, 10, 'Farmer Grumble');
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    if (this.onGround) {
      if (this.timer <= 0) {
        this.vy = -620;
        this.vx = this.dir * (this.angry ? 260 : 200);
        this.timer = (this.angry ? 1.5 : 2.2) + Math.random();
      } else {
        this.vx = this.dir * (this.angry ? 85 : 55);
      }
    }
  }

  landed() {
    if (!this.world.bossActive) return;
    this.stomp();
    if (this.angry) this.shock(240);
  }

  draw(ctx) {
    drawZombie(ctx, this.cx, this.y + this.h, this.dir, 2.3, this.t, this.flash > 0, { hat: true, angry: true, overalls: true });
  }
}

// Level 2: a giant spider that runs back and forth and drops sticky webs.
class BigSpider extends Boss {
  constructor(world, x, feetY) {
    super(world, 'bigspider', x, feetY, 130, 64, 14, 'Giant Spider');
  }

  think(dt) {
    const L = this.world.arenaX, R = L + W;
    if (this.x <= L + 10) this.dir = 1;
    if (this.x + this.w >= R - 10) this.dir = -1;
    this.vx = this.dir * (this.angry ? 170 : 120);
    this.timer -= dt;
    this.spawnT -= dt;
    if (this.timer <= 0) {
      this.timer = this.angry ? 1.9 : 2.6;
      const px = this.world.player.cx;
      const spots = this.angry ? [-2, -1, 0, 1, 2] : [-1, 0, 1];
      for (const k of spots) {
        this.world.projectiles.push({
          kind: 'web', x: px + k * 110 - 13 + (Math.random() - 0.5) * 30, y: -30, w: 26, h: 26,
          vx: 0, vy: 120, g: 250, life: 5, spin: 0
        });
      }
      Sound.play('web');
    }
    if (this.angry && this.spawnT <= 0) {
      this.spawnT = 6;
      if (this.minions() < 4) {
        for (const k of [-1, 1]) this.summon(new Spider(this.world, this.cx + k * 50, this.y + this.h, { small: true }));
      }
    }
  }

  draw(ctx) {
    drawSpider(ctx, this.cx, this.y + this.h, this.dir, 1.18, this.t, this.flash > 0);
  }
}

// Level 3: the Spider Queen hops around and calls baby spiders.
class SpiderQueen extends Boss {
  constructor(world, x, feetY) {
    super(world, 'queen', x, feetY, 96, 50, 18, 'Spider Queen');
    this.spitT = 2;
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    this.spawnT -= dt;
    this.spitT -= dt;
    if (this.onGround) {
      this.vx = this.dir * (this.angry ? 70 : 40);
      if (this.timer <= 0) {
        this.vy = -640;
        this.vx = this.dir * 240;
        this.timer = (this.angry ? 1.6 : 2.3) + Math.random();
      }
    }
    if (this.spawnT <= 0) {
      this.spawnT = this.angry ? 3.5 : 5;
      if (this.minions() < (this.angry ? 6 : 4)) {
        for (const k of [-1, 1]) this.summon(new Spider(this.world, this.cx + k * 40, this.y + this.h, { small: true }));
        Sound.play('web');
      }
    }
    // Angry: spit sticky webs straight at Blockie
    if (this.angry && this.spitT <= 0) {
      this.spitT = 2.5;
      this.world.projectiles.push({
        kind: 'web', x: this.cx + this.dir * 40 - 13, y: this.y + 6, w: 26, h: 26,
        vx: this.dir * 280, vy: 0, g: 0, life: 3, spin: 0
      });
      Sound.play('web');
    }
  }

  landed() { if (this.world.bossActive) this.stomp(); }

  draw(ctx) {
    drawSpider(ctx, this.cx, this.y + this.h, this.dir, 0.88, this.t, this.flash > 0, {
      crown: true, body: '#6a2c91', bodyLight: '#8a4cb1', head: '#7a3ca1', stripe: '#ffcc22', legs: '#3a1a50'
    });
  }
}

// Level 4: the Skeleton King throws bones in big arcs and jumps.
class SkeletonKing extends Boss {
  constructor(world, x, feetY) {
    super(world, 'skelking', x, feetY, 56, 90, 18, 'Skeleton King');
    this.windup = false;
    this.spawnT = 5;
  }

  think(dt) {
    this.facePlayer();
    const dist = Math.abs(this.world.player.cx - this.cx);
    this.timer -= dt;
    this.jumpT -= dt;
    this.spawnT -= dt;
    if (this.onGround) {
      this.vx = dist > 320 ? this.dir * 70 : dist < 200 ? -this.dir * 70 : 0;
      if (this.jumpT <= 0) {
        this.vy = -620;
        this.jumpT = (this.angry ? 2.5 : 3.5) + Math.random() * 2;
      }
    }
    this.windup = this.timer < 0.4;
    if (this.timer <= 0) {
      this.timer = this.angry ? 1.6 : 2.2;
      const n = this.angry ? 5 : 3;
      for (let k = 0; k < n; k++) {
        this.world.projectiles.push({
          kind: 'bone', x: this.cx - 9, y: this.y + 10, w: 18, h: 12,
          vx: this.dir * (160 + k * (this.angry ? 60 : 95)), vy: -470 + k * 50, g: 900, life: 4, spin: 0
        });
      }
      Sound.play('throw');
    }
    if (this.angry && this.spawnT <= 0) {
      this.spawnT = 7;
      if (this.minions() < 2) this.summon(new Skeleton(this.world, this.cx - this.dir * 80, this.y + this.h));
    }
  }

  landed() {
    if (!this.world.bossActive) return;
    this.stomp();
    if (this.angry) this.shock(260);
  }

  draw(ctx) {
    drawSkeleton(ctx, this.cx, this.y + this.h, this.dir, 2.35, this.t, this.flash > 0, {
      crown: true, cape: true, windup: this.windup, still: Math.abs(this.vx) < 1
    });
  }
}

// Level 5: the Mob Lord stomps and summons little mobs.
class MobLord extends Boss {
  constructor(world, x, feetY) {
    super(world, 'moblord', x, feetY, 90, 90, 24, 'The Mob Lord');
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    this.jumpT -= dt;
    if (this.onGround) {
      this.vx = this.dir * (this.angry ? 80 : 55);
      if (this.jumpT <= 0) {
        this.vy = -560;
        this.vx = this.dir * 170;
        this.jumpT = (this.angry ? 3 : 4.5) + Math.random() * 1.5;
      }
    }
    if (this.timer <= 0) {
      this.timer = this.angry ? 3.2 : 4.5;
      if (this.minions() < 6) {
        for (let k = -1; k <= 1; k++) this.summon(new Mob(this.world, this.cx + k * 40, this.y + this.h));
        Sound.play('transform');
      }
    }
  }

  landed() {
    if (!this.world.bossActive) return;
    this.stomp();
    if (this.angry) this.shock(280);
  }

  draw(ctx) {
    drawMob(ctx, this.cx, this.y + this.h, this.dir, 4.5, this.t, this.flash > 0, {
      color: '#7a3fc0', crown: true, cape: true, angry: true
    });
  }
}

// Level 6: Rex the Dino King. Every attack uses the next element: fire, ice, lightning, wind.
// Now and then he roars and charges across the room.
class DinoKing extends Boss {
  constructor(world, x, feetY) {
    super(world, 'dinoking', x, feetY, 92, 96, 26, 'Rex the Dino King');
    this.elIndex = 0;
    this.windup = 0;
    this.move = null;
    this.chargeT = 0;
    this.chargeCool = 6;
    this.spawnT = 4;
  }

  get el() { return DINO_ELEMENTS[this.elIndex]; }

  think(dt) {
    const w = this.world;
    this.timer -= dt;
    this.spawnT -= dt;
    this.chargeCool -= dt;
    if (this.chargeT > 0) {
      this.chargeT -= dt;
      this.vx = this.dir * (this.angry ? 340 : 280);
      const L = w.arenaX, R = L + W;
      if ((this.dir < 0 && this.x <= L + 2) || (this.dir > 0 && this.x + this.w >= R - 2)) this.chargeT = 0;
      if (this.chargeT <= 0) this.stomp();
      return;
    }
    if (this.windup > 0) {
      this.vx = 0;
      this.windup -= dt;
      if (this.windup <= 0) this.attack();
      return;
    }
    this.facePlayer();
    if (this.onGround) this.vx = this.dir * (this.angry ? 70 : 45);
    if (this.chargeCool <= 0 && this.onGround) {
      this.chargeCool = this.angry ? 5 : 7;
      this.windup = 0.9;
      this.move = 'charge';
      Sound.play('roar');
    } else if (this.timer <= 0) {
      this.timer = this.angry ? 1.8 : 2.6;
      this.windup = 0.6;
      this.move = 'breath';
      Sound.play('roar');
    }
    if (this.angry && this.spawnT <= 0) {
      this.spawnT = 7;
      if (this.minions() < 3) {
        for (const k of [-1, 1]) {
          const el = DINO_ELEMENTS[Math.floor(Math.random() * 4)];
          this.summon(new Dino(w, this.cx + k * 70, this.y + this.h, { el, baby: true }));
        }
      }
    }
  }

  attack() {
    const w = this.world, p = w.player;
    if (this.move === 'charge') {
      this.chargeT = 1;
      return;
    }
    const el = this.el;
    if (el === 'fire' || el === 'ice') {
      const sx = this.cx + this.dir * 60, sy = this.y + 16;
      const base = Math.atan2(p.cy - sy, p.cx - sx);
      const spread = this.angry ? [-0.3, -0.1, 0.1, 0.3] : [-0.22, 0, 0.22];
      for (const a of spread) {
        w.projectiles.push({
          kind: 'breath', el, x: sx - 11, y: sy - 11, w: 22, h: 22,
          vx: Math.cos(base + a) * 270, vy: Math.sin(base + a) * 270, g: 0, life: 4, spin: 0
        });
      }
      Sound.play('fireball');
    } else if (el === 'zap') {
      this.stomp();
      this.shock(this.angry ? 340 : 290, 'zap');
      Sound.play('zap');
    } else {
      w.gust(this.cx + this.dir * 50, this.y + this.h - 24, this.dir);
      w.gust(this.cx + this.dir * 50, this.y + 30, this.dir);
      if (this.onGround) {
        this.vy = -560;
        this.vx = this.dir * 160;
      }
    }
    this.elIndex = (this.elIndex + 1) % DINO_ELEMENTS.length;
  }

  landed() { if (this.world.bossActive) this.stomp(); }

  draw(ctx) {
    drawDino(ctx, this.cx, this.y + this.h, this.dir, 1.9, this.t, this.flash > 0, {
      el: this.el, roar: this.windup > 0, crown: true, still: Math.abs(this.vx) < 1
    });
  }
}

// Level 7: the Big Yeti throws snowballs. When he lands, icicles fall from the sky.
class Yeti extends Boss {
  constructor(world, x, feetY) {
    super(world, 'yeti', x, feetY, 80, 112, 28, 'The Big Yeti');
    this.spawnT = 5;
    this.windup = false;
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    this.jumpT -= dt;
    this.spawnT -= dt;
    if (this.onGround) {
      this.vx = this.dir * (this.angry ? 75 : 50);
      if (this.jumpT <= 0) {
        this.vy = -600;
        this.vx = this.dir * 180;
        this.jumpT = (this.angry ? 2.6 : 3.8) + Math.random();
      }
    }
    this.windup = this.timer < 0.4;
    if (this.timer <= 0) {
      this.timer = this.angry ? 1.7 : 2.4;
      const n = this.angry ? 4 : 3;
      for (let k = 0; k < n; k++) {
        this.world.projectiles.push({
          kind: 'snowball', x: this.cx - 10, y: this.y + 10, w: 20, h: 20,
          vx: this.dir * (150 + k * 85), vy: -480 + k * 40, g: 900, life: 4, spin: 0
        });
      }
      Sound.play('throw');
    }
    if (this.angry && this.spawnT <= 0) {
      this.spawnT = 8;
      if (this.minions() < 2) {
        for (const k of [-1, 1]) this.summon(new Dino(this.world, this.cx + k * 60, this.y + this.h, { el: 'ice', baby: true }));
      }
    }
  }

  landed() {
    if (!this.world.bossActive) return;
    this.stomp();
    this.dropFromSky('icicle', this.angry ? 5 : 3);
    if (this.angry) this.shock(260, 'ice');
  }

  draw(ctx) {
    drawYeti(ctx, this.cx, this.y + this.h, this.dir, 2, this.t, this.flash > 0, {
      windup: this.windup, still: Math.abs(this.vx) < 1, angry: this.angry
    });
  }
}

// Level 8: the Bedrock Golem. Super tough! It throws boulders, slams the ground
// and makes rocks rain down, one after the other.
class Golem extends Boss {
  constructor(world, x, feetY) {
    super(world, 'golem', x, feetY, 96, 120, 34, 'The Bedrock Golem');
    this.kbMul = 0.05;
    this.windup = 0;
    this.moveN = 0;
    this.move = null;
    this.waveT = 0;
    this.spawnT = 6;
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    this.spawnT -= dt;
    if (this.waveT > 0) {
      // the second wave of an angry slam
      this.waveT -= dt;
      if (this.waveT <= 0) { this.stomp(); this.shock(360, 'fire'); }
    }
    if (this.windup > 0) {
      this.vx = 0;
      this.windup -= dt;
      if (this.windup <= 0) this.attack();
      return;
    }
    if (this.onGround) this.vx = this.dir * (this.angry ? 60 : 40);
    if (this.timer <= 0) {
      this.timer = this.angry ? 1.9 : 2.8;
      this.windup = 0.7;
      this.move = ['throw', 'slam', 'rain'][this.moveN++ % 3];
      Sound.play('roar');
    }
    if (this.angry && this.spawnT <= 0) {
      this.spawnT = 9;
      if (this.minions() < 2) {
        for (const k of [-1, 1]) this.summon(new Dino(this.world, this.cx + k * 70, this.y + this.h, { el: 'fire', baby: true }));
      }
    }
  }

  attack() {
    const w = this.world, p = w.player;
    if (this.move === 'throw') {
      const n = this.angry ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const vx = Math.max(-520, Math.min(520, (p.cx - this.cx) / 1.15)) + k * this.dir * 120;
        w.projectiles.push({
          kind: 'rock', x: this.cx - 14, y: this.y, w: 28, h: 28, vx, vy: -620, g: 1000, life: 4, spin: 0
        });
      }
      Sound.play('throw');
    } else if (this.move === 'slam') {
      this.stomp();
      this.shock(300, 'fire');
      if (this.angry) this.waveT = 0.55;
    } else {
      this.stomp();
      this.dropFromSky('rock', this.angry ? 6 : 4);
    }
  }

  draw(ctx) {
    drawGolem(ctx, this.cx, this.y + this.h, this.dir, 2, this.t, this.flash > 0, {
      windup: this.windup > 0, still: Math.abs(this.vx) < 1, angry: this.angry
    });
  }
}

function makeBoss(world, type, col) {
  const x = (col + 0.5) * T;
  const y = GROUND * T;
  switch (type) {
    case 'grumble': return new Grumble(world, x, y);
    case 'bigspider': return new BigSpider(world, x, y);
    case 'queen': return new SpiderQueen(world, x, y);
    case 'skelking': return new SkeletonKing(world, x, y);
    case 'moblord': return new MobLord(world, x, y);
    case 'dinoking': return new DinoKing(world, x, y);
    case 'yeti': return new Yeti(world, x, y);
    case 'golem': return new Golem(world, x, y);
  }
  throw new Error('Unknown boss: ' + type);
}
