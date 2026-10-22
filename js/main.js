// Starts the game: sets up the canvas, keyboard, saved progress, and the game loop.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const Game = {
  screen: null,
  go(screen) { this.screen = screen; }
};

// Keep the 16:9 game as big as the window allows, and sharp on any screen.
let view = 1;
function fitCanvas() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = Math.floor(W * scale) + 'px';
  canvas.style.height = Math.floor(H * scale) + 'px';
  canvas.width = Math.round(W * scale * dpr);
  canvas.height = Math.round(H * scale * dpr);
  view = canvas.width / W;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

Input.init();
Save.load();
Game.go(new TitleScreen());

// Pause if the window loses focus.
window.addEventListener('blur', () => {
  if (Game.screen instanceof PlayScreen) Game.screen.pause();
});

// The game always moves in steps of 1/60 of a second, so it runs the same on every computer.
const STEP = 1 / 60;
let last = performance.now();
let acc = 0;

function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    Game.screen.update(STEP);
    Input.clear();
    acc -= STEP;
  }
  ctx.setTransform(view, 0, 0, view, 0, 0);
  Game.screen.draw(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
