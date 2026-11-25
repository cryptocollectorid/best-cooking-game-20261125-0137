// Every pixel of Wok & Ember: the warung kitchen, the order board, the
// wok, the plate and the ingredient counter. All art is drawn in code
// (no image files), so a screenshot is always a real render of the game.
import { DISH_BY_ID, INGREDIENTS, ING_BY_ID } from './dishes.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SHIFT_SECONDS } from './kitchen.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

const WOOD = '#7a4a21';
const WOOD_DARK = '#5d3413';
const CREAM = '#fff3d6';
const WALL_TOP = '#f7e2bd';
const WALL_BOTTOM = '#e9c795';
const TEAL = '#1f7a6d';
const RED = '#c0392b';
const GOLD = '#ffd94d';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -5, -10, 0, -4);
  ctx.bezierCurveTo(5, -10, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#e74c3c' : '#d8c9a8';
  ctx.fill();
  ctx.restore();
}

function flame(ctx, x, y, t, scale) {
  const flick = Math.sin(t * 9 + x) * 0.12 + Math.sin(t * 23) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (1 + flick), scale * (1 - flick));
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.bezierCurveTo(14, -8, 10, 8, 0, 12);
  ctx.bezierCurveTo(-10, 8, -14, -8, 0, -26);
  ctx.closePath();
  ctx.fillStyle = '#ff7b24';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.bezierCurveTo(7, -4, 5, 5, 0, 7);
  ctx.bezierCurveTo(-5, 5, -7, -4, 0, -14);
  ctx.closePath();
  ctx.fillStyle = '#ffd94d';
  ctx.fill();
  ctx.restore();
}

function ingredientDisc(ctx, x, y, r, ing) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = ing.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ing.dark;
  ctx.stroke();
  text(ctx, ing.name.slice(0, 2).toUpperCase(), x, y + 1, Math.round(r * 0.62), ing.dark, '900');
}

function drawWall(ctx, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, WALL_TOP);
  grad.addColorStop(0.62, WALL_BOTTOM);
  grad.addColorStop(0.62, '#8a5a2b');
  grad.addColorStop(1, '#6b4226');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Tile band under the order board.
  ctx.fillStyle = '#1f7a6d';
  ctx.fillRect(0, 196, VIEW_W, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let x = 0; x < VIEW_W; x += 64) ctx.fillRect(x, 196, 2, 14);
}

function drawTopBar(ctx, kitchen) {
  ctx.fillStyle = '#2b1d12';
  ctx.fillRect(0, 0, VIEW_W, 64);
  text(ctx, 'WOK & EMBER', 24, 24, 26, '#ffd94d', '900', 'left');
  text(ctx, '— WARUNG RUSH —', 24, 48, 12, '#f7e2bd', '700', 'left');

  const left = kitchen.shiftLeft();
  const mm = String(Math.floor(left / 60));
  const ss = String(Math.floor(left % 60)).padStart(2, '0');
  const urgent = left <= 30;
  ctx.fillStyle = urgent ? '#e74c3c' : '#1f7a6d';
  rr(ctx, 520, 10, 240, 44, 10);
  ctx.fill();
  text(ctx, `${mm}:${ss}`, 640, 33, 26, '#ffffff', '900');

  text(ctx, `SKOR ${kitchen.score}`, 800, 24, 20, '#fff3d6', '900', 'left');
  text(ctx, `KOINS ${kitchen.coins}`, 800, 48, 13, '#ffd94d', '700', 'left');
  for (let i = 0; i < 3; i += 1) heart(ctx, 1010 + i * 30, 32, 22, i < kitchen.hearts);
  if (kitchen.combo > 1) {
    ctx.fillStyle = '#ff7b24';
    rr(ctx, 1100, 12, 150, 40, 10);
    ctx.fill();
    text(ctx, `COMBO x${kitchen.combo}`, 1175, 33, 18, '#ffffff', '900');
  }
}

function drawTicket(ctx, ticket, x, y, w, h, kitchen, t) {
  const dish = DISH_BY_ID[ticket.dishId];
  const left = Math.max(0, ticket.deadline - kitchen.time);
  const frac = left / ticket.patience;
  ctx.fillStyle = '#fffdf5';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = frac < 0.3 ? '#e74c3c' : '#8a5a2b';
  ctx.stroke();
  if (frac < 0.3 && Math.sin(t * 8) > 0) {
    ctx.fillStyle = 'rgba(231,76,60,0.12)';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
  }
  text(ctx, dish.name.toUpperCase(), x + w / 2, y + 20, 17, '#2b1d12', '900');
  for (let i = 0; i < dish.recipe.length; i += 1) {
    const ing = ING_BY_ID[dish.recipe[i]];
    ingredientDisc(ctx, x + 34 + i * 52, y + 56, 20, ing);
  }
  // Patience bar.
  ctx.fillStyle = '#e5d5b3';
  rr(ctx, x + 14, y + 84, w - 28, 10, 5);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#27ae60' : frac > 0.25 ? '#f39c12' : '#e74c3c';
  rr(ctx, x + 14, y + 84, (w - 28) * frac, 10, 5);
  ctx.fill();
  text(ctx, `${Math.ceil(left)} dtk  ·  ${dish.base} koin`, x + w / 2, y + 110, 13, '#7a5a33', '700');
}

function drawBoard(ctx, kitchen, t) {
  ctx.fillStyle = WOOD;
  rr(ctx, 24, 76, VIEW_W - 48, 132, 12);
  ctx.fill();
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, 24, 76, VIEW_W - 48, 132, 12);
  ctx.stroke();
  text(ctx, 'PESANAN', 44, 96, 15, '#ffd94d', '900', 'left');
  text(ctx, 'klik tiketnya untuk menyajikan', 44, 116, 11, '#f7e2bd', '400', 'left');
  const slotW = 236;
  for (let i = 0; i < 4; i += 1) {
    const x = 220 + i * (slotW + 12);
    const ticket = kitchen.orders[i];
    if (ticket) drawTicket(ctx, ticket, x, 84, slotW, 116, kitchen, t);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      rr(ctx, x, 84, slotW, 116, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'menunggu pelanggan…', x + slotW / 2, 142, 13, 'rgba(255,255,255,0.55)', '400');
    }
  }
}

function drawStove(ctx, kitchen, t) {
  // Stove body: a wooden counter with a dark front panel and knobs.
  ctx.fillStyle = '#8a5a2b';
  rr(ctx, 380, 330, 520, 190, 14);
  ctx.fill();
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(380, 330, 520, 16);
  ctx.fillStyle = '#5d3413';
  rr(ctx, 400, 470, 480, 36, 8);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(460 + i * 60, 488, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd94d';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2b1d12';
    ctx.stroke();
  }

  // Burner glow and flames, visible below the wok's rim.
  if (kitchen.wok.length > 0 && !kitchen.wokSpoiled) {
    ctx.beginPath();
    ctx.ellipse(640, 470, 130, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,123,36,0.55)';
    ctx.fill();
    flame(ctx, 540, 468, t, 0.9);
    flame(ctx, 640, 472, t + 2, 1.1);
    flame(ctx, 740, 468, t + 4, 0.9);
  }

  // The wok: a wide steel pan with a warm interior.
  ctx.beginPath();
  ctx.ellipse(640, 400, 180, 58, 0, 0, Math.PI);
  ctx.fillStyle = '#20242c';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(640, 400, 180, 58, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#3a4048';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(640, 400, 158, 46, 0, 0, Math.PI * 2);
  ctx.fillStyle = kitchen.wokSpoiled ? '#17130f' : '#4b5563';
  ctx.fill();

  // Ingredients sizzling inside the wok.
  kitchen.wok.forEach((id, i) => {
    const ing = ING_BY_ID[id];
    const angle = -0.6 + i * 0.6;
    ingredientDisc(ctx, 640 + Math.sin(angle) * 82, 400 + Math.cos(angle) * 15, 27, ing);
  });
  if (kitchen.wokSpoiled) {
    text(ctx, 'GOSONG! Tekan X / klik tong sampah', 640, 360, 15, '#ff8a7a', '900');
  }

  // Steam.
  for (const puff of kitchen.steam) {
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.size * puff.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.22 * puff.life})`;
    ctx.fill();
  }

  // Wok status on a dark pill so it reads on the light wall.
  ctx.fillStyle = '#2b1d12';
  rr(ctx, 470, 222, 340, 44, 12);
  ctx.fill();
  if (kitchen.wokReady) {
    ctx.fillStyle = GOLD;
    rr(ctx, 470, 222, 340, 44, 12);
    ctx.fill();
    text(ctx, 'SIAP! Tekan SPASI', 640, 245, 19, '#2b1d12', '900');
  } else if (kitchen.wok.length === 3 && !kitchen.wokSpoiled) {
    const pct = Math.round(kitchen.wokCook * 100);
    ctx.fillStyle = '#e5d5b3';
    rr(ctx, 536, 252, 168, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#e67e22';
    rr(ctx, 536, 252, 168 * kitchen.wokCook, 8, 4);
    ctx.fill();
    text(ctx, `MEMASAK ${pct}%`, 640, 240, 15, '#fff3d6', '900');
  } else if (kitchen.wok.length > 0) {
    text(ctx, 'Tambah bahan sesuai resep…', 640, 245, 15, '#fff3d6', '700');
  } else {
    text(ctx, 'Wajan kosong — klik bahan di bawah', 640, 245, 15, '#fff3d6', '700');
  }

  // Shelves with jars on the left.
  ctx.fillStyle = WOOD;
  ctx.fillRect(60, 300, 280, 12);
  ctx.fillRect(60, 420, 280, 12);
  const jarColors = ['#e74c3c', '#f2c14e', '#27ae60', '#6b4226'];
  for (let i = 0; i < 4; i += 1) {
    const jx = 90 + i * 66;
    ctx.fillStyle = jarColors[i];
    rr(ctx, jx, 252, 40, 48, 8);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(jx + 8, 262, 24, 14);
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(jx, 244, 40, 8);
    // Second shelf: smaller jars and a teapot.
    ctx.fillStyle = jarColors[(i + 2) % 4];
    rr(ctx, jx, 380, 40, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(jx + 8, 390, 24, 12);
  }
  ctx.fillStyle = '#2b1d12';
  rr(ctx, 60, 440, 280, 34, 8);
  ctx.fill();
  text(ctx, 'BUMBU & SAUS', 200, 452, 13, '#ffd94d', '900');
  text(ctx, 'Api besar, rasa juara.', 200, 468, 11, '#f7e2bd', '400');
}

function drawPlateStation(ctx, kitchen, t) {
  ctx.fillStyle = '#fffdf5';
  rr(ctx, 940, 230, 300, 300, 14);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a5a2b';
  ctx.stroke();
  text(ctx, 'PIRING SAJI', 1090, 258, 16, '#2b1d12', '900');
  // The plate.
  ctx.beginPath();
  ctx.arc(1090, 380, 96, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#cbb98a';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1090, 380, 70, 0, Math.PI * 2);
  ctx.strokeStyle = '#e5d5b3';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (kitchen.plate) {
    const dish = DISH_BY_ID[kitchen.plate];
    ctx.beginPath();
    ctx.arc(1090, 380, 62, 0, Math.PI * 2);
    ctx.fillStyle = dish.plate;
    ctx.fill();
    dish.recipe.forEach((id, i) => {
      const ing = ING_BY_ID[id];
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      ingredientDisc(ctx, 1090 + Math.cos(angle) * 30, 380 + Math.sin(angle) * 24, 17, ing);
    });
    text(ctx, dish.name.toUpperCase(), 1090, 500, 17, '#2b1d12', '900');
    const bob = Math.sin(t * 4) * 3;
    ctx.fillStyle = '#27ae60';
    rr(ctx, 990, 462 + bob, 200, 30, 8);
    ctx.fill();
    text(ctx, 'SIAP DIANTAR →', 1090, 478 + bob, 15, '#ffffff', '900');
  } else {
    text(ctx, '— piring kosong —', 1090, 380, 15, '#b09a6d', '400');
    text(ctx, 'Masak sampai matang,', 1090, 492, 14, '#7a5a33', '400');
    text(ctx, 'lalu tekan SPASI.', 1090, 512, 14, '#7a5a33', '400');
  }
}

function drawBins(ctx, kitchen) {
  ctx.fillStyle = '#2b1d12';
  ctx.fillRect(0, 560, VIEW_W, 240);
  text(ctx, 'BAHAN DI COUNTER  —  klik atau tekan 1–7', 40, 590, 15, '#ffd94d', '900', 'left');
  text(ctx, 'Resep ada di tiket. Bahan salah = wajan gosong!', 40, 612, 12, '#d8c9a8', '400', 'left');
  const bw = 140;
  const gap = 18;
  INGREDIENTS.forEach((ing, i) => {
    const x = 40 + i * (bw + gap);
    const y = 632;
    ctx.fillStyle = '#fffdf5';
    rr(ctx, x, y, bw, 116, 12);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, x, y, bw, 26, 12);
    ctx.fill();
    text(ctx, ing.key, x + 16, y + 14, 14, '#ffd94d', '900');
    text(ctx, ing.name.toUpperCase(), x + bw / 2 + 8, y + 14, 14, '#fff3d6', '900');
    ingredientDisc(ctx, x + bw / 2, y + 66, 30, ing);
    text(ctx, ing.name, x + bw / 2, y + 106, 12, '#7a5a33', '400');
  });
  // Trash can.
  const tx = 40 + 7 * (bw + gap);
  ctx.fillStyle = '#3d2c1c';
  rr(ctx, tx, 632, 96, 116, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  rr(ctx, tx + 28, 668, 40, 44, 6);
  ctx.fill();
  ctx.fillStyle = '#3d2c1c';
  ctx.fillRect(tx + 24, 660, 48, 8);
  text(ctx, 'BUANG (X)', tx + 48, 726, 12, '#ffd94d', '900');
}

function drawPopups(ctx, kitchen) {
  for (const popup of kitchen.popups) {
    const age = 1 - (popup.until - kitchen.time) / 1.4;
    ctx.globalAlpha = Math.max(0, 1 - age);
    text(ctx, popup.text, popup.x, popup.y - age * 40, 30, popup.color, '900');
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, kitchen, t) {
  ctx.fillStyle = 'rgba(43,29,18,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff3d6';
  rr(ctx, 290, 180, 700, 340, 20);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#8a5a2b';
  ctx.stroke();
  text(ctx, 'WOK & EMBER', 640, 250, 58, '#b5502a', '900');
  text(ctx, '— WARUNG RUSH —', 640, 300, 22, '#1f7a6d', '900');
  text(ctx, 'Masak pesanan secepat kilat sebelum pelanggan kabur.', 640, 348, 17, '#2b1d12', '400');
  text(ctx, 'Klik bahan (1–7) → masak di wajan → piring (Spasi)', 640, 378, 17, '#2b1d12', '400');
  text(ctx, '→ klik tiketnya untuk menyajikan. Shift 3 menit!', 640, 404, 17, '#2b1d12', '400');
  const pulse = 0.7 + Math.sin(t * 3) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#c0392b';
  rr(ctx, 480, 440, 320, 52, 12);
  ctx.fill();
  text(ctx, 'KLIK / ENTER UNTUK MULAI', 640, 467, 19, '#ffffff', '900');
  ctx.globalAlpha = 1;
}

function drawOver(ctx, kitchen) {
  ctx.fillStyle = 'rgba(43,29,18,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff3d6';
  rr(ctx, 340, 170, 600, 380, 20);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#8a5a2b';
  ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 230, 44, '#b5502a', '900');
  text(ctx, kitchen.overReason, 640, 276, 16, '#2b1d12', '400');
  text(ctx, `SKOR  ${kitchen.score}`, 640, 330, 30, '#1f7a6d', '900');
  text(ctx, `Hidangan disajikan: ${kitchen.served}   ·   Koin: ${kitchen.coins}   ·   Combo terbaik: x${kitchen.bestCombo}`, 640, 372, 16, '#2b1d12', '700');
  text(ctx, 'Tekan R atau klik untuk main lagi', 640, 430, 17, '#c0392b', '900');
  text(ctx, 'Terima kasih sudah mampir ke warung kami!', 640, 492, 14, '#7a5a33', '400');
}

export function draw(ctx, kitchen, t) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawWall(ctx, t);
  drawTopBar(ctx, kitchen);
  drawBoard(ctx, kitchen, t);
  drawStove(ctx, kitchen, t);
  drawPlateStation(ctx, kitchen, t);
  drawBins(ctx, kitchen);
  drawPopups(ctx, kitchen);
  if (kitchen.flash && kitchen.flash.until > kitchen.time) {
    ctx.fillStyle = kitchen.flash.kind === 'bad' ? 'rgba(231,76,60,0.18)' : 'rgba(39,174,96,0.14)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (kitchen.screen === SCREEN_TITLE) drawTitle(ctx, kitchen, t);
  if (kitchen.screen === SCREEN_OVER) drawOver(ctx, kitchen);
}
