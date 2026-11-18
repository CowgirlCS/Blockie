// The Pet House and the Mods menu (both open from the top of the map).

// ======================= Pet House =======================

// Adopt pets with gems, then pick which one follows Blockie.
class PetScreen {
  constructor(next) {
    this.next = next;
    this.ids = Object.keys(PETS);
    this.cursor = 0;
    this.t = 0;
    this.msg = '';
    this.msgT = 0;
  }

  update(dt) {
    this.t += dt;
    this.msgT -= dt;
    const n = this.ids.length + 2;   // the pets, "no pet", done
    if (Input.hit('left')) { this.cursor = (this.cursor + n - 1) % n; Sound.play('menu'); }
    if (Input.hit('right')) { this.cursor = (this.cursor + 1) % n; Sound.play('menu'); }
    this.cursor = menuMove(this.cursor, n);
    if (Input.hit('pause')) { Game.go(new SelectScreen(this.next)); return; }
    if (!Input.hit('enter')) return;
    const s = Save.data;
    if (this.cursor === n - 1) {
      Sound.play('select');
      Game.go(new SelectScreen(this.next));
      return;
    }
    if (this.cursor === n - 2) {
      s.pet = null;
      Save.write();
      this.tell('No pet for now');
      Sound.play('select');
      return;
    }
    const id = this.ids[this.cursor];
    if (s.pets.includes(id)) {
      s.pet = id;
      Save.write();
      this.tell(PETS[id].name + ' is coming with you!');
      Sound.play(id === 'puppy' ? 'woof' : id === 'kitty' ? 'meow' : 'select');
    } else if (s.gems >= PETS[id].cost) {
      s.gems -= PETS[id].cost;
      s.pets.push(id);
      s.pet = id;
      Save.write();
      this.tell('You adopted a ' + PETS[id].name + '!');
      Sound.play('buy');
    } else {
      this.tell('Need more gems!');
      Sound.play('nope');
    }
  }

  tell(text) {
    this.msg = text;
    this.msgT = 2.2;
  }

  draw(ctx) {
    drawScene(ctx, 'grounds', this.t * 10, this.t);
    box(ctx, 0, 0, W, H, 'rgba(40,20,10,0.35)');
    say(ctx, 'Pet House', W / 2, 44, 44, '#ff4a3d');
    const gems = String(Save.data.gems);
    say(ctx, gems, W - 30, 44, 30, '#bff6ff', 'right');
    drawGem(ctx, W - 50 - ctx.measureText(gems).width, 44, 1.3);

    const s = Save.data;
    this.ids.forEach((id, i) => {
      const x = 130 + i * 233, y = 100;
      const sel = this.cursor === i;
      if (sel) box(ctx, x - 104, y - 4, 208, 278, '#ffe14d');
      box(ctx, x - 100, y, 200, 270, '#2a1410');
      box(ctx, x - 96, y + 4, 192, 262, sel ? '#a8262e' : 'rgba(80,40,30,0.95)');
      // a little house for each pet
      poly(ctx, '#d7262e', [x - 70, y + 60, x, y + 20, x + 70, y + 60]);
      box(ctx, x - 60, y + 60, 120, 90, '#e8d8b0');
      box(ctx, x - 30, y + 90, 60, 60, '#5a3416');
      const flies = id === 'babydragon';
      const hop = sel ? Math.abs(Math.sin(this.t * 6)) * 8 : 0;
      ctx.save();
      ctx.translate(x, y + 148 - hop - (flies ? 20 : 0));
      ctx.scale(1.6, 1.6);
      drawPet(ctx, id, 0, 0, 1, this.t, { walk: sel, happy: sel && Math.sin(this.t * 3) > 0.5 });
      ctx.restore();
      say(ctx, PETS[id].name, x, y + 180, 24, '#ffffff');
      say(ctx, PETS[id].desc, x, y + 208, 16, '#ffd0c0');
      if (s.pet === id) {
        say(ctx, 'With you!', x, y + 244, 22, '#7ee08a');
      } else if (s.pets.includes(id)) {
        say(ctx, 'Enter = bring', x, y + 244, 18, '#ffffff');
      } else {
        const cost = String(PETS[id].cost);
        say(ctx, cost, x + 12, y + 244, 24, s.gems >= PETS[id].cost ? '#bff6ff' : '#ff9a9a');
        drawGem(ctx, x - 16 - ctx.measureText(cost).width / 2, y + 244, 1);
      }
    });

    ['No pet', 'Done!'].forEach((label, k) => {
      const i = this.ids.length + k;
      const x = W / 2 + (k === 0 ? -130 : 130), y = 420;
      const sel = this.cursor === i;
      box(ctx, x - 110, y - 24, 220, 48, '#2a1410');
      box(ctx, x - 107, y - 21, 214, 42, sel ? '#d7262e' : '#6a5a5a');
      say(ctx, label, x, y, 24, '#ffffff');
    });

    if (this.msgT > 0) say(ctx, this.msg, W / 2, H - 40, 28, '#ffe14d');
    else say(ctx, 'Arrows pick   Enter = adopt or bring', W / 2, H - 40, 20, '#ffffff');
  }
}

// ======================= Mods =======================

// Turn fun mods on and off. They work in every level.
class ModScreen {
  constructor(next) {
    this.next = next;
    this.cursor = 0;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    const n = MODS.length + 1;
    this.cursor = menuMove(this.cursor, n);
    if (Input.hit('pause')) { Game.go(new SelectScreen(this.next)); return; }
    const toggle = Input.hit('enter') || Input.hit('left') || Input.hit('right');
    if (!toggle) return;
    if (this.cursor === MODS.length) {
      if (Input.hit('enter')) { Sound.play('select'); Game.go(new SelectScreen(this.next)); }
      return;
    }
    const id = MODS[this.cursor].id;
    Save.data.mods[id] = !Save.data.mods[id];
    Save.write();
    Sound.play(Save.data.mods[id] ? 'select' : 'menu');
  }

  draw(ctx) {
    if (modOn('disco')) ctx.filter = `hue-rotate(${Math.round(this.t * 90) % 360}deg)`;
    drawBackdrop(ctx, THEMES.grounds, this.t * 20, this.t);
    ctx.filter = 'none';
    box(ctx, 0, 0, W, H, 'rgba(20,10,30,0.45)');
    say(ctx, 'Mods', W / 2, 40, 44, '#ff4a3d');

    const top = 92, gap = 46;
    for (let i = 0; i <= MODS.length; i++) {
      const y = top + i * gap;
      const sel = i === this.cursor;
      box(ctx, 150, y - 21, 560, 42, sel ? '#d7262e' : 'rgba(40,20,20,0.75)');
      if (sel) box(ctx, 150, y - 21, 560, 4, '#ff5a4f');
      if (i === MODS.length) {
        say(ctx, 'Done!  Back to the map', 430, y, 24, '#ffffff');
        continue;
      }
      const m = MODS[i];
      const on = modOn(m.id);
      say(ctx, m.name, 172, y - 7, 22, '#ffffff', 'left');
      say(ctx, m.desc, 172, y + 12, 14, '#ffd0c0', 'left');
      // an on/off switch
      box(ctx, 610, y - 13, 80, 26, '#2a1410');
      box(ctx, 613, y - 10, 74, 20, on ? '#3fb53a' : '#6a5a5a');
      box(ctx, on ? 657 : 615, y - 10, 28, 20, '#ffffff');
      say(ctx, on ? 'ON' : 'OFF', on ? 632 : 670, y, 14, '#ffffff');
    }

    // Blockie shows off the mods that change how he looks
    const hop = modOn('moon') ? Math.abs(Math.sin(this.t * 2)) * 60 : Math.abs(Math.sin(this.t * 4)) * 12;
    drawBlockie(ctx, 830, 420 - hop, {
      facing: -1, weapon: Save.data.weapon, air: hop > 2,
      bighead: modOn('bighead'), rainbow: modOn('rainbow') ? this.t : null, boost: modOn('fast')
    });
    say(ctx, '↑ ↓ pick   Enter = on / off', W / 2, H - 22, 20, '#ffffff');
  }
}
