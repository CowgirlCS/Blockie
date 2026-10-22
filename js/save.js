// Saves progress in the browser (localStorage) so it survives a page refresh.

const Save = {
  KEY: 'blockie-save-v1',
  data: null,

  fresh() {
    return {
      started: false,
      mode: 'easy',            // 'easy' = 5 hearts, 'normal' = 3 hearts
      unlocked: 1,             // how many levels are open
      gems: 0,
      weapon: 'none',          // the weapon Blockie is holding
      upgrades: { power: 0, speed: 0, jump: 0, armor: 0, points: 0, heart: 0 },
      levelBest: [0, 0, 0, 0, 0],
      bonusBest: [0, 0, 0, 0],
      beaten: [false, false, false, false, false],
      muted: false
    };
  },

  load() {
    this.data = this.fresh();
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        Object.assign(this.data, saved);
        this.data.upgrades = Object.assign(this.fresh().upgrades, saved.upgrades);
      }
    } catch (e) {
      // Storage is blocked: the game still works, it just won't remember.
    }
    Sound.muted = this.data.muted;
  },

  write() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) { /* ignore */ }
  },

  reset(mode) {
    const muted = this.data.muted;
    this.data = this.fresh();
    this.data.mode = mode;
    this.data.muted = muted;
    this.data.started = true;
    this.write();
  },

  totalScore() {
    const sum = (list) => list.reduce((a, b) => a + b, 0);
    return sum(this.data.levelBest) + sum(this.data.bonusBest);
  }
};
