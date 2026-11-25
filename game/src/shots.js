// The four screenshot scenes behind ?shot=kitchen|orders|assembly|serve.
// Each one plays the real rules forward from a seeded kitchen with the
// autopilot, so every frame is what a real game looks like and the same
// seed always gives the same frame.
import { autopilot, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './kitchen.js';

const STEP = 1 / 60;

function runFor(kitchen, seconds, drive) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (drive) autopilot(kitchen);
    const events = kitchen.step(STEP);
    if (events & 4) break; // EVENT_OVER
  }
}

export function stageShot(name, kitchen) {
  kitchen.reset();
  if (name === 'orders') {
    kitchen.start();
    // Cook and serve for a while first (the scoreboard comes alive),
    // then let the tickets pile up again on their own: a busy board,
    // none expired yet, and the wok already cooking the next dish.
    runFor(kitchen, 45, true);
    runFor(kitchen, 33, false);
    let guard = 0;
    while (kitchen.wok.length < 2 && guard < 60 * 20) {
      autopilot(kitchen);
      kitchen.step(STEP);
      guard += 1;
      if (kitchen.screen === SCREEN_OVER) break;
    }
    return { screen: kitchen.screen === SCREEN_OVER ? SCREEN_OVER : SCREEN_PLAY, best: kitchen.score };
  }
  if (name === 'assembly') {
    kitchen.start();
    runFor(kitchen, 6, true);
    // Stop the moment the wok holds two ingredients of the next dish:
    // a dish visibly mid-assembly, with the ticket still waiting.
    let guard = 0;
    while (kitchen.wok.length < 2 && guard < 60 * 20) {
      autopilot(kitchen);
      kitchen.step(STEP);
      guard += 1;
      if (kitchen.screen === SCREEN_OVER) break;
    }
    return { screen: SCREEN_PLAY, best: kitchen.score };
  }
  if (name === 'serve') {
    kitchen.start();
    let guard = 0;
    while (!kitchen.plate && guard < 60 * 90) {
      autopilot(kitchen);
      kitchen.step(STEP);
      guard += 1;
      if (kitchen.screen === SCREEN_OVER) break;
    }
    return { screen: SCREEN_PLAY, best: kitchen.score };
  }
  // Default: kitchen — the title screen over a lived-in kitchen: start
  // it, let two tickets walk in, then put the title card back on top.
  kitchen.start();
  runFor(kitchen, 18, false);
  kitchen.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE, best: 0 };
}
