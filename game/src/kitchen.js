// The kitchen itself: orders on the board, the wok on the stove, the
// plate, the shift timer and the score. Pure rules, no drawing and no
// sound, so the screenshot autopilot can play it forward step by step
// and a browser can run the same code live.
import { DISHES, DISH_BY_ID, dishNeeds, isWrongIngredient } from './dishes.js';
import { mulberry32, pick } from './rng.js';

export const SHIFT_SECONDS = 180;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const COMBO_WINDOW = 8;

const FIRST_ORDER_AT = 2;
const ORDER_EVERY_EARLY = 15;
const ORDER_EVERY_LATE = 10;
const PATIENCE_SECONDS = 45;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_SPOILED = 8;

let orderSerial = 0;

function newOrder(rand, now, rush) {
  orderSerial += 1;
  const dish = pick(rand, DISHES);
  const patience = PATIENCE_SECONDS * (rush ? 0.8 : 1);
  return {
    id: orderSerial,
    dishId: dish.id,
    bornAt: now,
    patience,
    deadline: now + patience,
  };
}

export class Kitchen {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.rand = mulberry32(this.seed);
    this.reset();
  }

  reset() {
    this.screen = SCREEN_TITLE;
    this.time = 0;
    this.score = 0;
    this.coins = 0;
    this.served = 0;
    this.hearts = MAX_HEARTS;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0;
    this.orders = [];
    this.nextOrderAt = FIRST_ORDER_AT;
    this.wok = []; // ingredient ids in the wok
    this.wokSpoiled = false;
    this.wokCook = 0; // 0..1 while the full recipe sizzles
    this.wokReady = false;
    this.plate = null; // dish id waiting to be served
    this.flash = null; // { kind: 'bad' | 'good', until }
    this.popups = []; // { x, y, text, color, until }
    this.steam = []; // { x, y, size, life }
    this.started = false;
    this.overReason = '';
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.screen = SCREEN_PLAY;
  }

  dishForTicket(ticket) {
    return DISH_BY_ID[ticket.dishId];
  }

  /** Dishes whose recipe still fits everything in the wok. */
  candidateDishes() {
    return DISHES.filter((dish) => this.wok.every((id) => dish.recipe.includes(id)));
  }

  /** The dish the wok is building, once its contents narrow it to one. */
  wokDish() {
    if (this.wok.length === 0) return null;
    const cands = this.candidateDishes();
    return cands.length === 1 ? cands[0] : null;
  }

  addIngredient(id) {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    if (this.wokSpoiled) return EVENT_NONE;
    if (this.wokReady) return EVENT_NONE;
    if (this.wok.length >= 3) return EVENT_NONE;
    const fits = DISHES.some(
      (dish) => !this.wok.includes(id) && [...this.wok, id].every((x) => dish.recipe.includes(x)),
    );
    if (!fits) {
      this.wokSpoiled = true;
      this.flash = { kind: 'bad', until: this.time + 0.6 };
      return EVENT_SPOILED;
    }
    this.wok.push(id);
    if (this.wok.length === 3) this.wokCook = 0.0001;
    return EVENT_NONE;
  }

  trashWok() {
    if (this.screen !== SCREEN_PLAY) return;
    this.wok = [];
    this.wokSpoiled = false;
    this.wokCook = 0;
    this.wokReady = false;
  }

  plateDish() {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    if (!this.wokReady || this.plate) return EVENT_NONE;
    const dish = this.wokDish();
    if (!dish) return EVENT_NONE;
    this.plate = dish.id;
    this.wok = [];
    this.wokCook = 0;
    this.wokReady = false;
    return EVENT_NONE;
  }

  serveTicket(ticketId) {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    const index = this.orders.findIndex((order) => order.id === ticketId);
    if (index === -1) return EVENT_NONE;
    const ticket = this.orders[index];
    if (this.plate !== ticket.dishId) {
      this.flash = { kind: 'bad', until: this.time + 0.5 };
      return EVENT_NONE;
    }
    const dish = DISH_BY_ID[ticket.dishId];
    const left = Math.max(0, ticket.deadline - this.time);
    const timeBonus = Math.round((left / ticket.patience) * 80);
    this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = COMBO_WINDOW;
    const gained = (dish.base + timeBonus) * this.combo;
    this.score += gained;
    this.coins += dish.base;
    this.served += 1;
    this.orders.splice(index, 1);
    this.plate = null;
    this.flash = { kind: 'good', until: this.time + 0.5 };
    this.popups.push({
      x: 640, y: 300, text: `+${gained}${this.combo > 1 ? `  COMBO x${this.combo}` : ''}`,
      color: '#ffd94d', until: this.time + 1.4,
    });
    return EVENT_SERVED;
  }

  step(dt) {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    this.time += dt;
    let events = EVENT_NONE;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // New orders walk in while the board has room.
    if (this.time >= this.nextOrderAt && this.orders.length < MAX_ORDERS) {
      const rush = this.time > SHIFT_SECONDS * 0.6;
      this.orders.push(newOrder(this.rand, this.time, rush));
      this.nextOrderAt = this.time + (rush ? ORDER_EVERY_LATE : ORDER_EVERY_EARLY);
    }

    // The wok sizzles once its recipe is complete.
    if (this.wok.length === 3 && !this.wokSpoiled && !this.wokReady) {
      const dish = this.wokDish();
      if (dish) {
        this.wokCook += dt / dish.cookSeconds;
        if (this.wokCook >= 1) {
          this.wokCook = 1;
          this.wokReady = true;
        }
      }
    }

    // Steam puffs while the wok cooks.
    if (this.wok.length > 0 && !this.wokSpoiled && Math.random() < 0.25) {
      this.steam.push({ x: 580 + Math.random() * 120, y: 360, size: 5 + Math.random() * 6, life: 1 });
    }
    for (const puff of this.steam) {
      puff.y -= dt * 46;
      puff.life -= dt * 0.7;
    }
    this.steam = this.steam.filter((puff) => puff.life > 0);
    this.popups = this.popups.filter((popup) => popup.until > this.time);

    // Impatient tickets walk out.
    for (let i = this.orders.length - 1; i >= 0; i -= 1) {
      if (this.time >= this.orders[i].deadline) {
        this.orders.splice(i, 1);
        this.hearts -= 1;
        this.combo = 0;
        this.comboTimer = 0;
        events |= EVENT_EXPIRED;
        if (this.hearts <= 0) {
          this.screen = SCREEN_OVER;
          this.overReason = 'Pelanggan kecewa, warung tutup lebih awal.';
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    if (this.time >= SHIFT_SECONDS) {
      this.screen = SCREEN_OVER;
      this.overReason = 'Shift selesai! Warung tutup dengan senyum.';
      events |= EVENT_OVER;
    }
    return events;
  }

  shiftLeft() {
    return Math.max(0, SHIFT_SECONDS - this.time);
  }

  nextNeeded() {
    const dish = this.wokDish();
    if (!dish) return null;
    return dishNeeds(dish, this.wok);
  }
}

/** A simple cook that plays the real rules: it always works the oldest
 * ticket first, plates a finished dish and serves it when it matches. */
export function autopilot(kitchen) {
  if (kitchen.screen !== SCREEN_PLAY) return;
  if (kitchen.plate) {
    const ticket = kitchen.orders.find((order) => order.dishId === kitchen.plate);
    if (ticket) {
      kitchen.serveTicket(ticket.id);
      return;
    }
  }
  if (kitchen.wokSpoiled) {
    kitchen.trashWok();
    return;
  }
  if (kitchen.wokReady) {
    kitchen.plateDish();
    return;
  }
  const ticket = kitchen.orders[0];
  if (!ticket) return;
  const dish = DISH_BY_ID[ticket.dishId];
  const missing = dish.recipe.filter((id) => !kitchen.wok.includes(id));
  if (missing.length > 0) {
    kitchen.addIngredient(missing[0]);
  }
}
