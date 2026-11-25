// Bootstrap for Wok & Ember: canvas setup, keyboard and mouse input,
// the game loop, and the ?shot= scenes the screenshots are taken from.
// The game is played with mouse clicks and keys 1-7, Space, X, P, M, R.
import { INGREDIENTS } from './dishes.js';
import { Kitchen, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './kitchen.js';
import { draw, VIEW_H, VIEW_W } from './draw.js';
import { Sfx } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = new Sfx();

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '7', 10);
const seed = Number.isFinite(seedParam) ? seedParam : 7;
const shotName = params.get('shot');
const kitchen = new Kitchen(seed);

let last = performance.now();
let shotStaged = false;
let pointer = { x: 0, y: 0 };

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = Math.round(VIEW_W * scale * window.devicePixelRatio);
  canvas.height = Math.round(VIEW_H * scale * window.devicePixelRatio);
  canvas.style.width = `${Math.round(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.round(VIEW_H * scale)}px`;
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
}

function toView(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

function binAt(p) {
  if (p.y < 632 || p.y > 748) return null;
  const bw = 140;
  const gap = 18;
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const x = 40 + i * (bw + gap);
    if (p.x >= x && p.x <= x + bw) return INGREDIENTS[i].id;
  }
  return null;
}

function ticketAt(p) {
  if (p.y < 84 || p.y > 200) return null;
  const slotW = 236;
  for (let i = 0; i < 4; i += 1) {
    const x = 220 + i * (slotW + 12);
    if (p.x >= x && p.x <= x + slotW && kitchen.orders[i]) return kitchen.orders[i].id;
  }
  return null;
}

function trashAt(p) {
  const tx = 40 + 7 * (140 + 18);
  return p.x >= tx && p.x <= tx + 96 && p.y >= 632 && p.y <= 748;
}

function wokAt(p) {
  const dx = (p.x - 640) / 180;
  const dy = (p.y - 400) / 58;
  return dx * dx + dy * dy <= 1;
}

function pressStart() {
  sfx.ensure();
  if (kitchen.screen === SCREEN_TITLE) {
    kitchen.start();
  } else if (kitchen.screen === SCREEN_OVER) {
    kitchen.reset();
    kitchen.start();
  }
}

canvas.addEventListener('pointerdown', (event) => {
  sfx.ensure();
  const p = toView(event.clientX, event.clientY);
  pointer = p;
  if (kitchen.screen !== SCREEN_PLAY) {
    pressStart();
    return;
  }
  const bin = binAt(p);
  if (bin) {
    const before = kitchen.wok.length;
    const result = kitchen.addIngredient(bin);
    if (kitchen.wok.length > before) sfx.chop();
    if (result === 8) sfx.buzz();
    return;
  }
  if (trashAt(p)) {
    kitchen.trashWok();
    return;
  }
  if (wokAt(p)) {
    if (kitchen.wokReady) {
      kitchen.plateDish();
      sfx.plated();
    }
    return;
  }
  const ticket = ticketAt(p);
  if (ticket) {
    const result = kitchen.serveTicket(ticket);
    if (result === 1) sfx.ding();
    else sfx.buzz();
  }
});

canvas.addEventListener('pointermove', (event) => {
  pointer = toView(event.clientX, event.clientY);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    sfx.ensure();
    if (kitchen.screen !== SCREEN_PLAY) {
      pressStart();
      return;
    }
    if (event.key === ' ' && kitchen.wokReady) {
      kitchen.plateDish();
      sfx.plated();
    }
    return;
  }
  if (kitchen.screen === SCREEN_OVER && (event.key === 'r' || event.key === 'R')) {
    kitchen.reset();
    kitchen.start();
    return;
  }
  if (kitchen.screen !== SCREEN_PLAY) return;
  const ing = INGREDIENTS.find((item) => item.key === event.key);
  if (ing) {
    const before = kitchen.wok.length;
    const result = kitchen.addIngredient(ing.id);
    if (kitchen.wok.length > before) sfx.chop();
    if (result === 8) sfx.buzz();
    return;
  }
  if (event.key === 'x' || event.key === 'X') kitchen.trashWok();
  if (event.key === 'm' || event.key === 'M') sfx.muted = !sfx.muted;
});

window.addEventListener('resize', fitCanvas);
fitCanvas();

if (shotName) {
  // Screenshot mode: stage the named scene once, then draw it still.
  // The frame is a real render of the game's own code at that state.
  const staged = stageShot(shotName, kitchen);
  kitchen.screen = staged.screen;
  shotStaged = true;
  draw(ctx, kitchen, 1.2);
  window.__shotReady = true;
} else {
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (kitchen.screen === SCREEN_PLAY) {
      kitchen.step(dt);
      if (kitchen.wok.length === 3 && !kitchen.wokSpoiled && !kitchen.wokReady) sfx.startSizzle();
      else sfx.stopSizzle();
    }
    draw(ctx, kitchen, now / 1000);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// Keep the linter honest about the pointer we track for hover states.
void pointer;
void shotStaged;
