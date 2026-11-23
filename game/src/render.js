// Every pixel of the Ember Court: the felt table, the heroes, the cards and the end screens.
// Cards are legible at thumbnail size: a big cost gem, a big element glyph in colour AND shape,
// a name in plain type, and attack/health as large numerals in the bottom corners.
import { ELEMENTS, MAX_MANA, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { TYPE_CREATURE } from './cards.js';

const GOLD = '#d9a441';
const CREAM = '#f6ead0';
const INK = '#241a10';

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, startSize, font) {
  let size = startSize;
  do {
    ctx.font = `${size}px ${font}`;
    size -= 1;
  } while (ctx.measureText(text).width > maxWidth && size > 8);
  return size;
}

/** The element glyph: flame, wave, leaf or peak, drawn from shapes alone. */
export function drawGlyph(ctx, glyph, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineJoin = 'round';
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.55);
    ctx.bezierCurveTo(size * 0.5, -size * 0.1, size * 0.42, size * 0.35, size * 0.18, size * 0.5);
    ctx.bezierCurveTo(size * 0.08, size * 0.58, -size * 0.08, size * 0.58, -size * 0.18, size * 0.5);
    ctx.bezierCurveTo(-size * 0.42, size * 0.35, -size * 0.5, -size * 0.1, 0, -size * 0.55);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.1);
    ctx.bezierCurveTo(size * 0.22, size * 0.12, size * 0.16, size * 0.38, 0, size * 0.42);
    ctx.bezierCurveTo(-size * 0.16, size * 0.38, -size * 0.22, size * 0.12, 0, -size * 0.1);
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    for (let step = 0; step <= 20; step += 1) {
      const px = -size * 0.5 + (step / 20) * size;
      const py = Math.sin((step / 20) * Math.PI * 2) * size * 0.18;
      if (step === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let step = 20; step >= 0; step -= 1) {
      const px = -size * 0.5 + (step / 20) * size;
      const py = Math.sin((step / 20) * Math.PI * 2) * size * 0.18 + size * 0.22;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.bezierCurveTo(size * 0.5, -size * 0.2, size * 0.4, size * 0.4, 0, size * 0.55);
    ctx.bezierCurveTo(-size * 0.4, size * 0.4, -size * 0.5, -size * 0.2, 0, -size * 0.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.4);
    ctx.lineTo(0, size * 0.45);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.55);
    ctx.lineTo(size * 0.5, size * 0.4);
    ctx.lineTo(size * 0.2, size * 0.4);
    ctx.lineTo(0, size * 0.05);
    ctx.lineTo(-size * 0.2, size * 0.4);
    ctx.lineTo(-size * 0.5, size * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.55);
    ctx.lineTo(size * 0.16, -size * 0.25);
    ctx.lineTo(0, -size * 0.12);
    ctx.lineTo(-size * 0.16, -size * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#5b2a1e';
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 7);
  ctx.strokeStyle = 'rgba(217,164,65,0.7)';
  ctx.stroke();
  drawGlyph(ctx, 'flame', x + w / 2, y + h / 2, Math.min(w, h) * 0.45, GOLD);
}

function drawCard(ctx, card, x, y, w, h, options = {}) {
  const element = ELEMENTS[card.element];
  const lift = options.hover ? -14 : 0;
  const yy = y + lift;
  ctx.save();
  if (options.dimmed) ctx.globalAlpha = 0.55;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = options.selected ? 22 : 10;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, x, yy, w, h, 10);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = options.selected ? '#ffd23e' : element.color;
  ctx.lineWidth = options.selected ? 4 : 2.5;
  ctx.stroke();
  // Element band with glyph and name.
  roundRect(ctx, x + 4, yy + 4, w - 8, h * 0.30, 8);
  ctx.fillStyle = element.color;
  ctx.fill();
  drawGlyph(ctx, element.glyph, x + w * 0.22, yy + h * 0.19, w * 0.30, 'rgba(255,255,255,0.95)');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const nameSize = fitText(ctx, card.name, w * 0.62, Math.max(11, w * 0.115), 'Georgia, serif');
  ctx.font = `bold ${nameSize}px Georgia, serif`;
  ctx.fillText(card.name, x + w * 0.40, yy + h * 0.13, w * 0.58);
  ctx.font = `${Math.max(9, w * 0.07)}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(element.name, x + w * 0.40, yy + h * 0.24, w * 0.58);
  // Art medallion: the element glyph large over a tinted field.
  ctx.save();
  roundRect(ctx, x + 8, yy + h * 0.34, w - 16, h * 0.34, 6);
  ctx.clip();
  ctx.fillStyle = element.light;
  ctx.fillRect(x + 8, yy + h * 0.34, w - 16, h * 0.34);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let stripe = -2; stripe < 6; stripe += 1) {
    ctx.fillRect(x + stripe * 26, yy + h * 0.34, 12, h * 0.34);
  }
  drawGlyph(ctx, element.glyph, x + w / 2, yy + h * 0.51, w * 0.42, element.dark);
  ctx.restore();
  // Rules text.
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `italic ${Math.max(9, w * 0.068)}px Georgia, serif`;
  const words = card.text.split(' ');
  let line = '';
  let lineY = yy + h * 0.74;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > w - 18 && line) {
      ctx.fillText(line, x + w / 2, lineY);
      line = word;
      lineY += Math.max(11, w * 0.08);
    } else line = test;
  }
  if (line) ctx.fillText(line, x + w / 2, lineY);
  // Cost gem, top left.
  ctx.beginPath();
  const gemX = x + 2;
  const gemY = yy + 2;
  const gemR = w * 0.17;
  ctx.moveTo(gemX + gemR, gemY);
  ctx.lineTo(gemX + gemR * 2, gemY + gemR);
  ctx.lineTo(gemX + gemR, gemY + gemR * 2);
  ctx.lineTo(gemX, gemY + gemR);
  ctx.closePath();
  ctx.fillStyle = '#2b6cb0';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(gemR * 1.05)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), gemX + gemR, gemY + gemR + 1);
  if (card.type === TYPE_CREATURE) {
    // Attack, bottom left; health, bottom right — large numerals.
    ctx.font = `bold ${Math.round(w * 0.20)}px Georgia, serif`;
    ctx.fillStyle = '#c0392b';
    ctx.textAlign = 'left';
    ctx.fillText(String(card.attack), x + 10, yy + h - 12);
    ctx.fillStyle = '#1e7a34';
    ctx.textAlign = 'right';
    ctx.fillText(String(card.health), x + w - 10, yy + h - 12);
    ctx.textAlign = 'center';
  } else {
    ctx.fillStyle = '#6b4c14';
    ctx.font = `bold ${Math.round(w * 0.09)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✦ SPELL ✦', x + w / 2, yy + h - 12);
  }
  ctx.restore();
}

function drawMana(ctx, x, y, mana, maxMana, size) {
  for (let index = 0; index < MAX_MANA; index += 1) {
    const cx = x + index * (size + 3) + size / 2;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + size / 2, y + size / 2);
    ctx.lineTo(cx, y + size);
    ctx.lineTo(cx - size / 2, y + size / 2);
    ctx.closePath();
    if (index < maxMana) {
      ctx.fillStyle = index < mana ? '#35a7ff' : '#274b63';
      ctx.fill();
      ctx.strokeStyle = '#bfe6ff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.fillStyle = CREAM;
  ctx.font = `bold ${size}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${mana}/${maxMana}`, x + MAX_MANA * (size + 3) + 6, y + size / 2);
}

function drawHero(ctx, x, y, w, h, name, life, mana, maxMana, elementKey, active) {
  const element = ELEMENTS[elementKey];
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = active ? 'rgba(217,164,65,0.22)' : 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.strokeStyle = active ? GOLD : 'rgba(217,164,65,0.5)';
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.stroke();
  // Portrait medallion.
  ctx.beginPath();
  ctx.arc(x + 40, y + h / 2, 30, 0, Math.PI * 2);
  ctx.fillStyle = element.dark;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawGlyph(ctx, element.glyph, x + 40, y + h / 2, 34, element.light);
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `bold 17px Georgia, serif`;
  ctx.fillText(name, x + 80, y + 26);
  ctx.font = `bold 26px Georgia, serif`;
  ctx.fillStyle = life <= 10 ? '#ff6b5e' : '#ffffff';
  // A hero beaten below zero still shows 0 life: the end screen says the same.
  ctx.fillText(`♥ ${Math.max(0, life)}`, x + 80, y + 58);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = 'rgba(246,234,208,0.8)';
  ctx.fillText('LIFE', x + 80, y + 74);
  drawMana(ctx, x + 8, y + h - 20, mana, maxMana, 11);
}

function drawTable(ctx, world) {
  // Felt, vignette and gold rim.
  const felt = ctx.createRadialGradient(640, 400, 80, 640, 400, 760);
  felt.addColorStop(0, '#2e6b4f');
  felt.addColorStop(0.7, '#1d4a35');
  felt.addColorStop(1, '#0f2a1e');
  ctx.fillStyle = felt;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.strokeStyle = 'rgba(217,164,65,0.85)';
  ctx.lineWidth = 6;
  roundRect(ctx, 10, 10, VIEW_WIDTH - 20, VIEW_HEIGHT - 20, 24);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(217,164,65,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 22, 22, VIEW_WIDTH - 44, VIEW_HEIGHT - 44, 18);
  ctx.stroke();
  // Centre emblem.
  ctx.save();
  ctx.globalAlpha = 0.10;
  drawGlyph(ctx, 'flame', 640, 400, 220, '#ffffff');
  ctx.restore();
  ctx.fillStyle = 'rgba(246,234,208,0.75)';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— THE EMBER COURT —', 640, 398);
}

function drawBoardRow(ctx, board, y, cardW, cardH, selectedUid, hoverUid) {
  const total = board.length * (cardW + 10) - 10;
  let x = (VIEW_WIDTH - total) / 2;
  for (const creature of board) {
    drawCard(ctx, creature, x, y, cardW, cardH, {
      selected: creature.uid === selectedUid,
      hover: creature.uid === hoverUid,
    });
    x += cardW + 10;
  }
}

function drawHand(ctx, hand, selectedIndex, hoverIndex, playable) {
  const cardW = 150;
  const cardH = 210;
  const gap = 12;
  const total = hand.length * (cardW + gap) - gap;
  let x = (VIEW_WIDTH - total) / 2;
  const y = VIEW_HEIGHT - cardH - 18;
  for (let index = 0; index < hand.length; index += 1) {
    const card = hand[index];
    const isSelected = index === selectedIndex;
    const isHover = index === hoverIndex;
    drawCard(ctx, card, x, y, cardW, cardH, {
      selected: isSelected,
      hover: isHover,
      dimmed: playable && !playable[index],
    });
    if (isSelected) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('▲ SELECTED — click a target, or the board to summon', x + cardW / 2, y - 10);
    }
    x += cardW + gap;
  }
  return { x: (VIEW_WIDTH - total) / 2, y, cardW, cardH, gap };
}

function drawOpponentHand(ctx, count) {
  const w = 58;
  const h = 82;
  const gap = 8;
  const total = count * (w + gap) - gap;
  let x = (VIEW_WIDTH - total) / 2;
  for (let index = 0; index < count; index += 1) {
    drawCardBack(ctx, x, 30, w, h);
    x += w + gap;
  }
  ctx.fillStyle = 'rgba(246,234,208,0.8)';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${count} cards in the Warden's hand`, 640, 128);
}

function drawLog(ctx, world) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 300, 330, 680, 62, 10);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  const lines = world.log.slice(-2);
  lines.forEach((line, index) => {
    ctx.fillText(line, 640, 356 + index * 20);
  });
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillStyle = GOLD;
  ctx.fillText(`TURN ${Math.max(1, world.turn)} — ${world.sideToMove === 'player' ? 'YOUR MOVE' : 'THE WARDEN IS THINKING…'}`, 640, 322);
}

function drawEndTurn(ctx, enabled) {
  roundRect(ctx, 1090, 330, 160, 56, 12);
  ctx.fillStyle = enabled ? GOLD : '#6b5a3a';
  ctx.fill();
  ctx.strokeStyle = '#fff2cf';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN ⏎', 1170, 359);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(246,234,208,0.75)';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('Flame › Thorn › Stone › Tide › Flame', 1170, 404);
}

function drawBanner(ctx, banner) {
  if (!banner) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, banner.life * 2);
  ctx.fillStyle = 'rgba(20,12,4,0.72)';
  ctx.fillRect(0, 330, VIEW_WIDTH, 64);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(banner.text, 640, 362);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawFloats(ctx, floats) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px Georgia, serif';
  for (const item of floats) {
    ctx.globalAlpha = Math.max(0, item.life);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y - (1 - item.life) * 40);
  }
  ctx.restore();
}

function drawTitle(ctx, best) {
  const glow = ctx.createRadialGradient(640, 300, 40, 640, 300, 520);
  glow.addColorStop(0, 'rgba(232,73,29,0.35)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawGlyph(ctx, 'flame', 640, 190, 150, '#e8491d');
  drawGlyph(ctx, 'flame', 640, 190, 80, '#ffd23e');
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 92px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBER COURT', 640, 330);
  ctx.fillStyle = CREAM;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('A duel of elemental cards — outwit the Cinder Warden', 640, 372);
  // Fanned sample cards.
  const sample = [
    { name: 'Flame Phoenix', element: 'flame', type: TYPE_CREATURE, cost: 5, attack: 5, health: 4, text: 'Born again from its own ash.' },
    { name: 'Tide Serpent', element: 'tide', type: TYPE_CREATURE, cost: 3, attack: 3, health: 3, text: 'It coils around the whole river.' },
    { name: 'Briar Ancient', element: 'thorn', type: TYPE_CREATURE, cost: 6, attack: 6, health: 6, text: 'Older than the court itself.' },
  ];
  sample.forEach((card, index) => {
    ctx.save();
    ctx.translate(640 + (index - 1) * 190, 560);
    ctx.rotate((index - 1) * 0.08);
    drawCard(ctx, card, -75, -105, 150, 210, {});
    ctx.restore();
  });
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('CLICK OR PRESS SPACE TO BEGIN', 640, 730);
  ctx.fillStyle = 'rgba(246,234,208,0.85)';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Play cards with mana · creatures attack on the next turn · two cards of one element SURGE +1/+1', 640, 762);
  if (best > 0) {
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(`Best winning life left: ${best}`, 640, 48);
  }
}

function drawEnd(ctx, screen, world) {
  const win = screen === SCREEN_WIN;
  ctx.fillStyle = win ? 'rgba(20,16,2,0.82)' : 'rgba(6,8,20,0.86)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (win) {
    ctx.save();
    ctx.translate(640, 330);
    for (let ray = 0; ray < 12; ray += 1) {
      ctx.rotate(Math.PI / 6);
      ctx.fillStyle = 'rgba(255,210,62,0.12)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(560, -40);
      ctx.lineTo(560, 40);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    drawGlyph(ctx, 'flame', 640, 330, 170, '#ffd23e');
  } else {
    drawGlyph(ctx, 'wave', 640, 330, 170, '#1d7fe8');
  }
  ctx.fillStyle = win ? '#ffd23e' : '#8fb8ff';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(win ? 'VICTORY' : 'DEFEAT', 640, 520);
  ctx.fillStyle = CREAM;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText(
    win ? 'The Ember Court is yours — the Warden bows.' : 'The Warden keeps the court… this time.',
    640, 566,
  );
  const you = world.player.life;
  const foe = world.ai.life;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Final life — You ${Math.max(0, you)} · Warden ${Math.max(0, foe)} · Turn ${Math.max(1, world.turn)}`, 640, 612);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', 640, 660);
}

/** Rectangles the input layer hit-tests against; the same maths the painter uses. */
export function handRects(count) {
  const cardW = 150;
  const cardH = 210;
  const gap = 12;
  const total = count * (cardW + gap) - gap;
  const startX = (VIEW_WIDTH - total) / 2;
  const rects = [];
  for (let index = 0; index < count; index += 1) {
    rects.push({ x: startX + index * (cardW + gap), y: VIEW_HEIGHT - cardH - 18, w: cardW, h: cardH });
  }
  return rects;
}

export function boardRects(board, y) {
  const cardW = 120;
  const cardH = 168;
  const gap = 10;
  const total = board.length * (cardW + gap) - gap;
  const startX = (VIEW_WIDTH - total) / 2;
  return board.map((creature, index) => ({
    uid: creature.uid,
    x: startX + index * (cardW + gap),
    y,
    w: cardW,
    h: cardH,
  }));
}

export const AI_BOARD_Y = 132;
export const PLAYER_BOARD_Y = 392;
export const AI_HERO_RECT = { x: 24, y: 16, w: 250, h: 104 };
export const PLAYER_HERO_RECT = { x: 24, y: 680, w: 250, h: 104 };
export const END_TURN_RECT = { x: 1090, y: 330, w: 160, h: 56 };

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(view) {
      const { world, screen } = view;
      ctx.save();
      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      if (view.shake > 0) {
        ctx.translate((Math.random() - 0.5) * view.shake, (Math.random() - 0.5) * view.shake);
      }
      drawTable(ctx, world);
      if (screen === SCREEN_TITLE) {
        drawTitle(ctx, view.best);
      } else if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
        // Keep the table behind the end screen so the final board stays visible at the edges.
        drawHero(ctx, 24, 16, 250, 104, 'CINDER WARDEN', world.ai.life, world.ai.mana, world.ai.maxMana, 'flame', false);
        drawHero(ctx, 24, 680, 250, 104, 'YOU — THE DUELIST', world.player.life, world.player.mana, world.player.maxMana, 'tide', false);
        drawBoardRow(ctx, world.ai.board, 132, 120, 168, null, null);
        drawBoardRow(ctx, world.player.board, 392, 120, 168, null, null);
        drawEnd(ctx, screen, world);
      } else {
        drawOpponentHand(ctx, world.ai.hand.length);
        drawHero(ctx, 24, 16, 250, 104, 'CINDER WARDEN', world.ai.life, world.ai.mana, world.ai.maxMana, 'flame', world.sideToMove === 'ai');
        drawHero(ctx, 24, 680, 250, 104, 'YOU — THE DUELIST', world.player.life, world.player.mana, world.player.maxMana, 'tide', world.sideToMove === 'player');
        drawBoardRow(ctx, world.ai.board, 132, 120, 168, view.selectedAttacker, view.hoverBoardUid);
        drawBoardRow(ctx, world.player.board, 392, 120, 168, view.selectedAttacker, view.hoverBoardUid);
        drawLog(ctx, world);
        drawEndTurn(ctx, world.sideToMove === 'player' && !world.over);
        if (world.player.hand.length > 0) {
          drawHand(ctx, view.handCards, view.selectedHand, view.hoverHand, view.playable);
        }
        // Targeting line from the selected card or attacker to the cursor.
        if (view.targetFrom && view.mouse) {
          ctx.save();
          ctx.strokeStyle = '#ffd23e';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.moveTo(view.targetFrom.x, view.targetFrom.y);
          ctx.lineTo(view.mouse.x, view.mouse.y);
          ctx.stroke();
          ctx.restore();
        }
        drawBanner(ctx, view.banner);
        drawFloats(ctx, view.floats);
      }
      ctx.restore();
    },
  };
}
