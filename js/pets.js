// Pets follow Blockie around and help. Adopt them at the Pet House on the map.
//   Puppy: runs at monsters and bites them
//   Kitty: grabs coins and gems that are close by
//   Bunny: digs up presents every now and then
//   Baby Dragon: flies next to Blockie and shoots little fireballs
// Pets can't get hurt, and they jump back to Blockie if they get left behind.

class Pet {
  constructor(world, type) {
    this.world = world;
    this.type = type;
    this.flies = type === 'babydragon';
    this.w = type === 'puppy' ? 26 : 22;
    this.h = type === 'babydragon' ? 22 : 20;
    const p = world.player;
    this.x = p.x - 40;
    this.y = p.y + p.h - this.h;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.onGround = false;
    this.hitWall = false;
    this.t = 0;
    this.cool = 1;
    this.digT = 10;
    this.chomp = 0;
    this.walkT = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  // Hop back next to Blockie in a puff of sparkles.
  jumpToPlayer() {
    const p = this.world.player;
    this.x = p.cx - p.facing * 40 - this.w / 2;
    this.y = p.y + p.h - this.h - (this.flies ? 30 : 0);
    this.vx = 0;
    this.vy = 0;
    this.world.sparkle(this.cx, this.cy, '#ffffff');
  }

  // The closest monster near Blockie, or null.
  nearMonster(range) {
    const p = this.world.player;
    let best = null, bestD = range;
    for (const e of this.world.enemies) {
      if (e.dead || (e.isBoss && !this.world.bossActive)) continue;
      const d = Math.hypot(e.cx - this.cx, e.cy - this.cy);
      if (d < bestD && Math.abs(e.cx - p.cx) < 320) { best = e; bestD = d; }
    }
    return best;
  }

  update(dt) {
    const w = this.world, p = w.player;
    this.t += dt;
    this.cool -= dt;
    this.chomp -= dt;
    if (p.dead) { this.vx = 0; }
    const far = Math.hypot(p.cx - this.cx, p.cy - this.cy);
    if (!p.dead && (far > 460 || this.y > ROWS * T)) this.jumpToPlayer();

    if (this.flies) this.updateFlying(dt);
    else this.updateWalking(dt);

    if (Math.abs(this.vx) > 10) this.walkT += dt;
    if (this.type === 'bunny') this.updateDigging(dt);
  }

  updateWalking(dt) {
    const w = this.world, p = w.player;
    let tx = p.cx - p.facing * 44;
    let speed = 250 * (modOn('fast') ? 1.6 : 1);
    // The puppy runs at monsters that come close
    const target = this.type === 'puppy' && !p.dead ? this.nearMonster(200) : null;
    if (target) {
      tx = target.cx;
      speed = 300;
      if (this.cool <= 0 && overlap(this, { x: target.x - 6, y: target.y, w: target.w + 12, h: target.h })) {
        const dir = target.cx < this.cx ? -1 : 1;
        if (target.damage(1, dir, 160)) {
          w.popup('Chomp!', target.cx, target.y - 10, '#ffffff');
          Sound.play('woof');
          this.chomp = 0.3;
        }
        this.cool = 1.1;
        this.vx = -dir * 200;
      }
    }
    const dx = tx - this.cx;
    const want = Math.abs(dx) < 8 ? 0 : Math.sign(dx) * Math.min(speed, Math.abs(dx) * 5);
    this.vx += (want - this.vx) * Math.min(1, dt * 10);
    if (Math.abs(this.vx) > 15) this.dir = Math.sign(this.vx);
    else if (!target) this.dir = p.facing;

    // jump over walls, holes and up to Blockie
    if (this.onGround) {
      const ahead = w.tile(Math.floor((this.cx + Math.sign(this.vx) * 24) / T), GROUND);
      const hole = Math.abs(this.vx) > 40 && !isSolid(ahead) && !isOneWay(ahead) && this.y + this.h >= GROUND * T - 2;
      const below = p.y + p.h < this.y + this.h - 40 && Math.abs(p.cx - this.cx) < 140;
      if (this.hitWall || hole || below) {
        this.vy = -660;
        this.onGround = false;
      }
    }
    const moon = modOn('moon');
    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * (moon ? 0.45 : 1) * dt);
    moveBody(w, this, dt);
  }

  updateFlying(dt) {
    const w = this.world, p = w.player;
    const tx = p.cx - p.facing * 38 - this.w / 2;
    const ty = p.y - 34 + Math.sin(this.t * 3) * 6;
    this.x += (tx - this.x) * Math.min(1, dt * 4);
    this.y += (ty - this.y) * Math.min(1, dt * 4);
    this.vx = (tx - this.x) * 4;
    const target = p.dead ? null : this.nearMonster(420);
    this.dir = target ? (target.cx < this.cx ? -1 : 1) : p.facing;
    if (target && this.cool <= 0) {
      this.cool = 1.6;
      const sx = this.cx + this.dir * 12, sy = this.cy;
      const dx = target.cx - sx, dy = target.cy - sy;
      const len = Math.hypot(dx, dy) || 1;
      w.shots.push({
        x: sx - 6, y: sy - 6, w: 12, h: 12, vx: dx / len * 480, vy: dy / len * 480, dir: this.dir,
        el: null, dmg: 1, kb: 100, life: 1.2, spin: 0, small: true
      });
      this.chomp = 0.3;
      Sound.play('fireball');
    }
  }

  // The bunny digs up a present now and then.
  updateDigging(dt) {
    const w = this.world;
    if (w.player.dead || !this.onGround) return;
    this.digT -= dt;
    if (this.digT > 0) return;
    this.digT = 14 + Math.random() * 6;
    const r = Math.random();
    let type = 'coin';
    if (w.lives < w.maxLives && r < 0.3) type = FOOD[Math.floor(Math.random() * FOOD.length)];
    else if (r < 0.55) type = 'gem';
    else if (r < 0.65) type = 'emerald';
    else if (r < 0.75) type = 'bomb';
    w.items.push({ type, x: this.cx + this.dir * 20, y: this.y + this.h - 16, phase: 0, taken: false });
    w.burst(this.cx, this.y + this.h, 10, ['#9a6334', '#c98a4a'], 160, 6, 500, 0.6);
    w.popup('Dig dig!', this.cx, this.y - 16, '#ffffff');
    Sound.play('pig');
    this.chomp = 0.6;
  }

  draw(ctx) {
    drawPet(ctx, this.type, this.cx, this.y + this.h, this.dir, this.t, {
      walk: Math.abs(this.vx) > 15 && (this.onGround || this.flies), air: !this.onGround && !this.flies, happy: this.chomp > 0
    });
  }
}

// ---------- Drawing pets ----------
// x = middle, y = feet

function drawPet(ctx, type, x, y, dir, t, o = {}) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  const step = o.walk ? Math.sin(t * 16) * 2 : 0;
  switch (type) {
    case 'puppy': {
      const fur = '#c98a4a', dark = '#8a5a2b';
      box(ctx, -12 + step, -7, 4, 7, dark);
      box(ctx, -5 - step, -7, 4, 7, dark);
      box(ctx, 4 + step, -7, 4, 7, dark);
      box(ctx, 9 - step, -7, 4, 7, dark);
      box(ctx, -14, -16, 28, 10, fur);
      box(ctx, -6, -10, 12, 4, '#f0d8b0');
      const wag = Math.sin(t * 20) * 3;
      box(ctx, -19, -21 + wag, 5, 8, fur);
      box(ctx, 7, -26, 14, 13, fur);
      box(ctx, 18, -20, 7, 6, '#f0d8b0');
      box(ctx, 23, -20, 3, 3, '#222222');
      box(ctx, 5, -27, 5, 10, dark);
      box(ctx, 14, -23, 3, 3, '#222222');
      if (o.happy) box(ctx, 18, -15, 6, 4, '#ff7a9a');
      box(ctx, 7, -13, 10, 3, '#d7262e');
      box(ctx, 11, -11, 3, 3, '#ffcc22');
      break;
    }
    case 'kitty': {
      const fur = '#8a8a96', dark = '#5a5a66';
      box(ctx, -10 + step, -6, 3, 6, dark);
      box(ctx, -4 - step, -6, 3, 6, dark);
      box(ctx, 3 + step, -6, 3, 6, dark);
      box(ctx, 8 - step, -6, 3, 6, dark);
      box(ctx, -12, -14, 24, 9, fur);
      box(ctx, -8, -14, 3, 9, dark);
      box(ctx, 0, -14, 3, 9, dark);
      const sw = Math.sin(t * 4) * 3;
      box(ctx, -16, -24 + sw, 4, 12, fur);
      box(ctx, 6, -24, 13, 12, fur);
      box(ctx, 6, -28, 4, 4, fur);
      box(ctx, 15, -28, 4, 4, fur);
      box(ctx, 9, -21, 3, 3, '#7ee08a');
      box(ctx, 15, -21, 3, 3, '#7ee08a');
      box(ctx, 13, -17, 2, 2, '#ff9ab8');
      if (o.happy) box(ctx, 18, -17, 6, 1, '#ffffff');
      break;
    }
    case 'bunny': {
      const fur = '#f4f4ee', pink = '#ffb0c0';
      const hop = o.walk ? Math.abs(Math.sin(t * 10)) * 5 : 0;
      ctx.translate(0, -hop);
      box(ctx, -10, -5, 8, 5, fur);
      box(ctx, 3, -5, 8, 5, fur);
      box(ctx, -11, -16, 20, 12, fur);
      box(ctx, -14, -14, 5, 5, '#ffffff');
      box(ctx, 4, -24, 12, 11, fur);
      box(ctx, 5, -38, 4, 14, fur);
      box(ctx, 11, -37, 4, 13, fur);
      box(ctx, 6, -36, 2, 10, pink);
      box(ctx, 12, -35, 2, 9, pink);
      box(ctx, 11, -21, 3, 3, '#222222');
      box(ctx, 15, -17, 2, 2, pink);
      if (o.happy) {
        // a little shovel
        box(ctx, 16, -12, 2, 10, '#8a5a2b');
        box(ctx, 14, -4, 6, 5, '#9aa6ae');
      }
      break;
    }
    case 'babydragon':
      ctx.scale(1, 1);
      drawDragon(ctx, 0, 0, 1, 0.5, t, false, { el: 'fire', breath: o.happy });
      break;
  }
  ctx.restore();
}
