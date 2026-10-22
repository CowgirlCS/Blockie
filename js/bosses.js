// The five bosses of the Blockie Forest. Each one waits in a boss room at the end of its level.

class Boss extends Enemy {
  constructor(world, type, x, feetY, w, h, hp, name) {
    super(world, type, x, feetY, w, h, hp, 25);
    this.isBoss = true;
    this.name = name;
    this.kbMul = 0.15;
    this.homeX = this.x;
    this.homeY = this.y;
    this.timer = 2;
    this.jumpT = 3;
    this.spawnT = 3;
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

  defeat() {
    if (this.dead) return;
    super.defeat();
    this.world.onBossDefeated(this);
  }
}

// Level 1: a big cranky zombie farmer who stomps around.
class Grumble extends Boss {
  constructor(world, x, feetY) {
    super(world, 'grumble', x, feetY, 52, 84, 6, 'Farmer Grumble');
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    if (this.onGround) {
      if (this.timer <= 0) {
        this.vy = -620;
        this.vx = this.dir * 200;
        this.timer = 2.2 + Math.random();
      } else {
        this.vx = this.dir * 55;
      }
    }
  }

  landed() { if (this.world.bossActive) this.stomp(); }

  draw(ctx) {
    drawZombie(ctx, this.cx, this.y + this.h, this.dir, 2.3, this.t, this.flash > 0, { hat: true, angry: true, overalls: true });
  }
}

// Level 2: a giant spider that runs back and forth and drops sticky webs.
class BigSpider extends Boss {
  constructor(world, x, feetY) {
    super(world, 'bigspider', x, feetY, 130, 64, 10, 'Giant Spider');
  }

  think(dt) {
    const L = this.world.arenaX, R = L + W;
    if (this.x <= L + 10) this.dir = 1;
    if (this.x + this.w >= R - 10) this.dir = -1;
    this.vx = this.dir * 120;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 2.6;
      const px = this.world.player.cx;
      for (const k of [-1, 0, 1]) {
        this.world.projectiles.push({
          kind: 'web', x: px + k * 110 - 13 + (Math.random() - 0.5) * 30, y: -30, w: 26, h: 26,
          vx: 0, vy: 120, g: 250, life: 5, spin: 0
        });
      }
      Sound.play('web');
    }
  }

  draw(ctx) {
    drawSpider(ctx, this.cx, this.y + this.h, this.dir, 1.18, this.t, this.flash > 0);
  }
}

// Level 3: the Spider Queen hops around and calls baby spiders.
class SpiderQueen extends Boss {
  constructor(world, x, feetY) {
    super(world, 'queen', x, feetY, 96, 50, 12, 'Spider Queen');
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    this.spawnT -= dt;
    if (this.onGround) {
      this.vx = this.dir * 40;
      if (this.timer <= 0) {
        this.vy = -640;
        this.vx = this.dir * 240;
        this.timer = 2.3 + Math.random();
      }
    }
    if (this.spawnT <= 0) {
      this.spawnT = 5;
      if (this.minions() < 4) {
        for (const k of [-1, 1]) this.summon(new Spider(this.world, this.cx + k * 40, this.y + this.h, { small: true }));
        Sound.play('web');
      }
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
    super(world, 'skelking', x, feetY, 56, 90, 12, 'Skeleton King');
    this.windup = false;
  }

  think(dt) {
    this.facePlayer();
    const dist = Math.abs(this.world.player.cx - this.cx);
    this.timer -= dt;
    this.jumpT -= dt;
    if (this.onGround) {
      this.vx = dist > 320 ? this.dir * 70 : dist < 200 ? -this.dir * 70 : 0;
      if (this.jumpT <= 0) {
        this.vy = -620;
        this.jumpT = 3.5 + Math.random() * 2;
      }
    }
    this.windup = this.timer < 0.4;
    if (this.timer <= 0) {
      this.timer = 2.2;
      for (let k = 0; k < 3; k++) {
        this.world.projectiles.push({
          kind: 'bone', x: this.cx - 9, y: this.y + 10, w: 18, h: 12,
          vx: this.dir * (160 + k * 95), vy: -470 + k * 50, g: 900, life: 4, spin: 0
        });
      }
      Sound.play('throw');
    }
  }

  landed() { if (this.world.bossActive) this.stomp(); }

  draw(ctx) {
    drawSkeleton(ctx, this.cx, this.y + this.h, this.dir, 2.35, this.t, this.flash > 0, {
      crown: true, cape: true, windup: this.windup, still: Math.abs(this.vx) < 1
    });
  }
}

// Level 5: the Mob Lord stomps and summons little mobs.
class MobLord extends Boss {
  constructor(world, x, feetY) {
    super(world, 'moblord', x, feetY, 90, 90, 16, 'The Mob Lord');
  }

  think(dt) {
    this.facePlayer();
    this.timer -= dt;
    this.jumpT -= dt;
    if (this.onGround) {
      this.vx = this.dir * 55;
      if (this.jumpT <= 0) {
        this.vy = -560;
        this.vx = this.dir * 170;
        this.jumpT = 4.5 + Math.random() * 1.5;
      }
    }
    if (this.timer <= 0) {
      this.timer = 4.5;
      if (this.minions() < 6) {
        for (let k = -1; k <= 1; k++) this.summon(new Mob(this.world, this.cx + k * 40, this.y + this.h));
        Sound.play('transform');
      }
    }
  }

  landed() { if (this.world.bossActive) this.stomp(); }

  draw(ctx) {
    drawMob(ctx, this.cx, this.y + this.h, this.dir, 4.5, this.t, this.flash > 0, {
      color: '#7a3fc0', crown: true, cape: true, angry: true
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
  }
  throw new Error('Unknown boss: ' + type);
}
