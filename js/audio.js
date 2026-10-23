// Sound effects: simple beeps and boops made with the Web Audio API.
// No sound files are needed, so the game works offline.

const Sound = {
  ctx: null,
  muted: false,

  // Browsers only allow sound after the player presses a key.
  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  // One beep. opt: type, vol, to (slide to this pitch), delay
  tone(freq, dur, opt = {}) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + (opt.delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = opt.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (opt.to) osc.frequency.exponentialRampToValueAtTime(opt.to, t0 + dur);
    gain.gain.setValueAtTime(opt.vol || 0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  // A short "shhh" sound, for swooshes and splashes.
  noise(dur, opt = {}) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + (opt.delay || 0);
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = opt.freq || 1000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(opt.vol || 0.15, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t0);
  },

  play(name) {
    if (this.muted || !this.ctx) return;
    switch (name) {
      case 'jump': this.tone(280, 0.15, { to: 560, vol: 0.06 }); break;
      case 'coin': this.tone(880, 0.06, { vol: 0.06 }); this.tone(1320, 0.1, { delay: 0.06, vol: 0.06 }); break;
      case 'gem':
        this.tone(660, 0.08, { type: 'triangle', vol: 0.12 });
        this.tone(990, 0.08, { type: 'triangle', vol: 0.12, delay: 0.07 });
        this.tone(1320, 0.14, { type: 'triangle', vol: 0.12, delay: 0.14 });
        break;
      case 'food': this.tone(220, 0.06, { vol: 0.1 }); this.tone(180, 0.08, { vol: 0.1, delay: 0.1 }); this.tone(660, 0.12, { type: 'triangle', delay: 0.2 }); break;
      case 'hurt': this.tone(700, 0.5, { type: 'sawtooth', to: 120, vol: 0.07 }); this.tone(300, 0.3, { type: 'sine', to: 600, vol: 0.1, delay: 0.45 }); break;
      case 'armor': this.noise(0.15, { freq: 3500, vol: 0.2 }); this.tone(1200, 0.15, { type: 'triangle', to: 600, vol: 0.1 }); break;
      case 'swing': this.noise(0.12, { freq: 1600, vol: 0.18 }); break;
      case 'punch': this.noise(0.06, { freq: 600, vol: 0.18 }); break;
      case 'hit': this.tone(240, 0.1, { to: 110, vol: 0.12 }); this.noise(0.05, { freq: 800 }); break;
      case 'defeat': this.tone(400, 0.12, { type: 'triangle', to: 900, vol: 0.12 }); this.tone(1000, 0.12, { type: 'triangle', delay: 0.1, vol: 0.1 }); break;
      case 'checkpoint': [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', vol: 0.12, delay: i * 0.1 })); break;
      case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.13, delay: i * 0.13 })); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', vol: 0.13, delay: i * 0.25 })); break;
      case 'menu': this.tone(600, 0.05, { vol: 0.05 }); break;
      case 'select': this.tone(800, 0.07, { vol: 0.06 }); this.tone(1200, 0.1, { delay: 0.06, vol: 0.06 }); break;
      case 'elephant': this.tone(260, 0.4, { type: 'sawtooth', to: 520, vol: 0.06 }); this.tone(520, 0.3, { type: 'sawtooth', to: 400, vol: 0.06, delay: 0.38 }); break;
      case 'boss': this.tone(110, 0.6, { type: 'sawtooth', to: 55, vol: 0.12 }); this.tone(165, 0.6, { type: 'square', to: 82, vol: 0.05, delay: 0.1 }); break;
      case 'block': this.tone(1500, 0.08, { type: 'triangle', vol: 0.12 }); this.noise(0.05, { freq: 4000, vol: 0.1 }); break;
      case 'throw': this.tone(500, 0.12, { type: 'triangle', to: 250, vol: 0.08 }); break;
      case 'transform': [200, 300, 400, 600, 800].forEach((f, i) => this.tone(f, 0.08, { vol: 0.05, delay: i * 0.08 })); break;
      case 'buy': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.1, { type: 'triangle', vol: 0.12, delay: i * 0.07 })); break;
      case 'nope': this.tone(160, 0.12, { vol: 0.08 }); this.tone(130, 0.18, { vol: 0.08, delay: 0.12 }); break;
      case 'web': this.tone(500, 0.25, { type: 'sine', to: 200, vol: 0.12 }); break;
      case 'stomp': this.tone(90, 0.25, { type: 'sawtooth', to: 40, vol: 0.15 }); this.noise(0.2, { freq: 200, vol: 0.25 }); break;
      case 'splash': this.noise(0.4, { freq: 900, vol: 0.25 }); break;
      case 'fireball': this.noise(0.18, { freq: 700, vol: 0.18 }); this.tone(300, 0.15, { type: 'sawtooth', to: 120, vol: 0.05 }); break;
      case 'roar': this.tone(160, 0.45, { type: 'sawtooth', to: 70, vol: 0.07 }); this.noise(0.35, { freq: 400, vol: 0.1 }); break;
      case 'zap': this.tone(1800, 0.12, { to: 300, vol: 0.06 }); this.noise(0.1, { freq: 5000, vol: 0.12 }); break;
      case 'freeze': [1600, 2000, 2400].forEach((f, i) => this.tone(f, 0.1, { type: 'triangle', vol: 0.08, delay: i * 0.05 })); break;
      case 'power': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', vol: 0.12, delay: i * 0.06 })); break;
      case 'potion': [300, 400, 500].forEach((f, i) => this.tone(f, 0.1, { type: 'sine', to: f * 2, vol: 0.15, delay: i * 0.08 })); break;
      case 'sheep': [500, 460, 500, 460, 480].forEach((f, i) => this.tone(f, 0.07, { type: 'sawtooth', vol: 0.05, delay: i * 0.06 })); break;
      case 'pig': this.tone(180, 0.1, { to: 140, vol: 0.08 }); this.tone(200, 0.12, { to: 150, vol: 0.08, delay: 0.15 }); break;
      case 'cow': this.tone(200, 0.7, { type: 'sawtooth', to: 140, vol: 0.07 }); break;
      case 'horse': [900, 1000, 850, 950, 700, 800, 500].forEach((f, i) => this.tone(f, 0.06, { type: 'sawtooth', vol: 0.04, delay: i * 0.05 })); break;
      case 'chicken': this.tone(900, 0.05, { vol: 0.05 }); this.tone(1000, 0.05, { vol: 0.05, delay: 0.08 }); this.tone(1400, 0.12, { type: 'triangle', to: 900, vol: 0.06, delay: 0.16 }); break;
    }
  }
};
