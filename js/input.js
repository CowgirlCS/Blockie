// Keyboard input. Only arrows, Space, Enter, P and Esc are used.

const Input = {
  down: {},      // keys being held right now
  pressed: {},   // keys pressed since the last game step

  codes: {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Space: 'attack',
    Enter: 'enter',
    NumpadEnter: 'enter',
    KeyP: 'pause',
    Escape: 'pause'
  },

  init() {
    window.addEventListener('keydown', (e) => {
      const key = this.codes[e.code];
      if (!key) return;
      e.preventDefault();
      if (!this.down[key]) this.pressed[key] = true;
      this.down[key] = true;
      Sound.unlock();
    });
    window.addEventListener('keyup', (e) => {
      const key = this.codes[e.code];
      if (!key) return;
      e.preventDefault();
      this.down[key] = false;
    });
    window.addEventListener('blur', () => { this.down = {}; });
  },

  held(key) { return !!this.down[key]; },
  hit(key) { return !!this.pressed[key]; },
  clear() { this.pressed = {}; }
};
