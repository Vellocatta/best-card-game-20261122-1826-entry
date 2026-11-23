// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between four screens:
// title, play, win and loss. The Warden takes its turn one move at a time, so the player
// can watch it play.
//
// ?seed=N fixes the deal. ?shot=start|play|win|loss (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, STEP, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { createRandom } from './random.js';
import { createWorld, endTurn, EVENT_ATTACK, EVENT_DEATH, EVENT_OVER, EVENT_SURGE, attack, playCard, resetWorld, spellTargets } from './world.js';
import { ACTION_CONFIRM, ACTION_END_TURN, ACTION_MUTE, ACTION_RESTART, createInput } from './input.js';
import { planAttack, planPlay } from './ai.js';
import { createRenderer, AI_BOARD_Y, AI_HERO_RECT, END_TURN_RECT, PLAYER_BOARD_Y, PLAYER_HERO_RECT, boardRects, handRects } from './render.js';
import { summonCard, TYPE_CREATURE } from './cards.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

const AI_MOVE_DELAY = 0.65;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT);
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;
  canvas.style.width = `${Math.floor(VIEW_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_HEIGHT * scale)}px`;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw({
      world,
      screen: scene.screen,
      best: scene.best,
      handCards: world.player.hand.map((id) => summonCard(id, 0)),
      selectedHand: -1,
      hoverHand: -1,
      playable: null,
      selectedAttacker: null,
      hoverBoardUid: null,
      banner: null,
      floats: [],
      shake: 0,
      mouse: null,
      targetFrom: null,
    });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let selectedHand = -1;
  let selectedAttacker = null;
  let hoverHand = -1;
  let hoverBoardUid = null;
  let floats = [];
  let banner = null;
  let shake = 0;
  let aiTimer = 0;
  let aiPhase = 'idle';

  function announce(message) {
    status.textContent = message;
  }

  function showBanner(text, seconds = 1.4) {
    banner = { text, life: seconds };
  }

  function addFloat(x, y, text, color) {
    floats.push({ x, y, text, color, life: 1 });
  }

  function heroCenter(rect) {
    return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
  }

  function boardCenter(uid) {
    for (const [board, y] of [[world.ai.board, AI_BOARD_Y], [world.player.board, PLAYER_BOARD_Y]]) {
      const rect = boardRects(board, y).find((entry) => entry.uid === uid);
      if (rect) return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    }
    return { x: 640, y: 400 };
  }

  function soundFor(events) {
    if (events & EVENT_SURGE) sound.surge();
    else if (events & EVENT_DEATH) sound.death();
    else if (events & EVENT_ATTACK) sound.attack();
    else if (events & EVENT_OVER) { /* the end screen plays its own tune */ }
    else sound.play();
  }

  function checkEnd() {
    if (!world.over) return;
    screen = world.over === 'win' ? SCREEN_WIN : SCREEN_LOSS;
    if (world.over === 'win') {
      sound.win();
      if (world.player.life > best) {
        best = world.player.life;
        saveBest(best);
      }
      announce(`Victory! You win with ${world.player.life} life left.`);
    } else {
      sound.lose();
      announce('Defeat. The Warden keeps the court.');
    }
    aiPhase = 'idle';
    selectedHand = -1;
    selectedAttacker = null;
  }

  function startGame() {
    resetWorld(world);
    screen = SCREEN_PLAY;
    selectedHand = -1;
    selectedAttacker = null;
    aiPhase = 'idle';
    showBanner('YOUR TURN — PLAY A CARD', 1.6);
    sound.turn();
    announce('Playing. Your turn: play a card, attack, then end your turn.');
  }

  function beginAiTurn() {
    aiPhase = 'play';
    aiTimer = 0.5;
  }

  function stepAi(delta) {
    aiTimer -= delta;
    if (aiTimer > 0 || world.over) return;
    if (aiPhase === 'play') {
      const play = planPlay(world, 'ai', 1);
      if (play) {
        const before = world.ai.life;
        const result = playCard(world, 'ai', play.handIndex, play.target);
        soundFor(result.events);
        if (result.events & EVENT_SURGE) showBanner('THE WARDEN SURGES +1/+1!', 1.4);
        aiTimer = AI_MOVE_DELAY;
        checkEnd();
        return;
      }
      aiPhase = 'attack';
      aiTimer = 0.4;
      return;
    }
    if (aiPhase === 'attack') {
      const move = planAttack(world, 'ai', 1);
      if (move) {
        const targetPos = move.target.kind === 'hero' ? heroCenter(PLAYER_HERO_RECT) : boardCenter(move.target.uid);
        const result = attack(world, 'ai', move.attackerUid, move.target);
        soundFor(result.events);
        if (move.target.kind === 'hero') {
          shake = 10;
          addFloat(targetPos.x, targetPos.y, 'HIT!', '#ff6b5e');
        }
        aiTimer = AI_MOVE_DELAY;
        checkEnd();
        return;
      }
      aiPhase = 'idle';
      endTurn(world);
      showBanner('YOUR TURN', 1.2);
      sound.turn();
      announce('Your turn.');
    }
  }

  function playableFlags() {
    return world.player.hand.map((id) => {
      const card = summonCard(id, 0);
      if (card.cost > world.player.mana) return false;
      if (card.type === TYPE_CREATURE && world.player.board.length >= 5) return false;
      return true;
    });
  }

  function inside(rect, point) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function handleClick(point) {
    if (screen === SCREEN_TITLE) {
      startGame();
      return;
    }
    if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      startGame();
      return;
    }
    if (world.sideToMove !== 'player' || world.over || aiPhase !== 'idle') return;
    // End turn button.
    if (inside(END_TURN_RECT, point)) {
      selectedHand = -1;
      selectedAttacker = null;
      endTurn(world);
      beginAiTurn();
      announce('The Warden takes its turn.');
      return;
    }
    // A hand card is selected: aim it.
    if (selectedHand >= 0) {
      const id = world.player.hand[selectedHand];
      const card = summonCard(id, 0);
      if (card.type === TYPE_CREATURE) {
        if (inside({ x: 300, y: PLAYER_BOARD_Y - 20, w: 680, h: 210 }, point)) {
          const result = playCard(world, 'player', selectedHand, null);
          soundFor(result.events);
          if (result.events & EVENT_SURGE) showBanner('SURGE! YOUR CREATURES +1/+1', 1.4);
          selectedHand = -1;
          checkEnd();
        } else selectedHand = -1;
        return;
      }
      const targets = spellTargets(world, 'player', selectedHand);
      const target = targets.find((entry) => {
        if (entry.kind === 'hero') return inside(AI_HERO_RECT, point);
        if (entry.kind === 'creature') {
          const rect = boardRects(world.ai.board, AI_BOARD_Y).find((item) => item.uid === entry.uid);
          return rect && inside(rect, point);
        }
        return entry.kind === 'self' || entry.kind === 'all';
      });
      if (target) {
        const result = playCard(world, 'player', selectedHand, target);
        soundFor(result.events);
        if (result.events & EVENT_SURGE) showBanner('SURGE! YOUR CREATURES +1/+1', 1.4);
        if (target.kind === 'hero') {
          shake = 8;
          addFloat(heroCenter(AI_HERO_RECT).x, heroCenter(AI_HERO_RECT).y, 'HIT!', '#ff6b5e');
        }
        selectedHand = -1;
        checkEnd();
      } else selectedHand = -1;
      return;
    }
    // An attacker is selected: aim it.
    if (selectedAttacker !== null) {
      const attacker = world.player.board.find((entry) => entry.uid === selectedAttacker);
      if (!attacker) {
        selectedAttacker = null;
        return;
      }
      if (inside(AI_HERO_RECT, point)) {
        const result = attack(world, 'player', selectedAttacker, { kind: 'hero', side: 'ai' });
        if (result.ok) {
          soundFor(result.events);
          shake = 8;
          addFloat(heroCenter(AI_HERO_RECT).x, heroCenter(AI_HERO_RECT).y, `-${attacker.attack}`, '#ff6b5e');
        }
        selectedAttacker = null;
        checkEnd();
        return;
      }
      const rect = boardRects(world.ai.board, AI_BOARD_Y).find((item) => inside(item, point));
      if (rect) {
        const result = attack(world, 'player', selectedAttacker, { kind: 'creature', side: 'ai', uid: rect.uid });
        if (result.ok) soundFor(result.events);
        selectedAttacker = null;
        checkEnd();
        return;
      }
      selectedAttacker = null;
      return;
    }
    // Nothing selected: pick a hand card or a ready attacker.
    const handHits = handRects(world.player.hand.length);
    for (let index = 0; index < handHits.length; index += 1) {
      if (inside(handHits[index], point)) {
        if (playableFlags()[index]) {
          selectedHand = index;
          sound.play();
        }
        return;
      }
    }
    const ownRects = boardRects(world.player.board, PLAYER_BOARD_Y);
    for (const rect of ownRects) {
      if (inside(rect, point)) {
        const creature = world.player.board.find((entry) => entry.uid === rect.uid);
        if (creature && !creature.sick && !creature.acted) {
          selectedAttacker = rect.uid;
          sound.play();
        }
        return;
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_WIN || screen === SCREEN_LOSS)) startGame();
    if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) startGame();
    else if (actions & ACTION_CONFIRM && (screen === SCREEN_WIN || screen === SCREEN_LOSS)) startGame();
    const digit = input.takeDigit();
    if (digit >= 0 && screen === SCREEN_PLAY && world.sideToMove === 'player') {
      if (digit < world.player.hand.length && playableFlags()[digit]) selectedHand = digit;
    }
    if ((actions & ACTION_CONFIRM || actions & ACTION_END_TURN) && screen === SCREEN_PLAY
      && world.sideToMove === 'player' && aiPhase === 'idle') {
      if (selectedHand >= 0) {
        // Enter plays the picked card at its default target (board for creatures).
        const id = world.player.hand[selectedHand];
        const card = summonCard(id, 0);
        if (card.type === TYPE_CREATURE) {
          const result = playCard(world, 'player', selectedHand, null);
          soundFor(result.events);
          selectedHand = -1;
          checkEnd();
        }
      } else if (actions & (ACTION_CONFIRM | ACTION_END_TURN)) {
        endTurn(world);
        beginAiTurn();
      }
    }
  }

  function updateHover() {
    const mouse = input.mouse();
    hoverHand = -1;
    hoverBoardUid = null;
    if (screen !== SCREEN_PLAY) return;
    const handHits = handRects(world.player.hand.length);
    for (let index = 0; index < handHits.length; index += 1) {
      if (inside(handHits[index], mouse)) hoverHand = index;
    }
    for (const [board, y] of [[world.ai.board, AI_BOARD_Y], [world.player.board, PLAYER_BOARD_Y]]) {
      for (const rect of boardRects(board, y)) {
        if (inside(rect, mouse)) hoverBoardUid = rect.uid;
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const delta = STEP;
    handleActions();
    for (const click of input.takeClicks()) handleClick(click);
    updateHover();
    if (screen === SCREEN_PLAY && world.sideToMove === 'ai' && aiPhase !== 'idle') stepAi(delta);
    if (banner) {
      banner.life -= delta;
      if (banner.life <= 0) banner = null;
    }
    for (const item of floats) item.life -= delta * 0.8;
    floats = floats.filter((item) => item.life > 0);
    if (shake > 0) shake = Math.max(0, shake - delta * 30);
    const mouse = input.mouse();
    let targetFrom = null;
    if (selectedHand >= 0) {
      const rects = handRects(world.player.hand.length);
      const rect = rects[selectedHand];
      if (rect) targetFrom = { x: rect.x + rect.w / 2, y: rect.y };
    } else if (selectedAttacker !== null) {
      const pos = boardCenter(selectedAttacker);
      targetFrom = pos;
    }
    renderer.draw({
      world,
      screen,
      best,
      handCards: world.player.hand.map((id) => summonCard(id, 0)),
      selectedHand,
      hoverHand,
      playable: world.sideToMove === 'player' ? playableFlags() : null,
      selectedAttacker,
      hoverBoardUid,
      banner,
      floats,
      shake,
      mouse,
      targetFrom,
    });
  }

  announce('Ember Court. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
