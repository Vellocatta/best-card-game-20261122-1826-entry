// The rules of the Ember Court: mana, drawing, playing, attacking, Surge and winning.
// The world is pure logic — no drawing, no sound — so the screenshot stager can play whole
// real games forward from a fresh world without a browser frame.
import { MAX_BOARD, MAX_HAND, MAX_MANA, START_HAND, START_LIFE, hasAdvantage } from './config.js';
import { buildDeck, summonCard, TYPE_CREATURE } from './cards.js';

export const EVENT_NONE = 0;
export const EVENT_PLAY = 1;
export const EVENT_ATTACK = 2;
export const EVENT_DEATH = 4;
export const EVENT_SURGE = 8;
export const EVENT_OVER = 16;

export const SIDE_PLAYER = 'player';
export const SIDE_AI = 'ai';

function otherSide(side) {
  return side === SIDE_PLAYER ? SIDE_AI : SIDE_PLAYER;
}

function freshSide(random) {
  return {
    life: START_LIFE,
    mana: 0,
    maxMana: 0,
    deck: buildDeck(random),
    hand: [],
    board: [],
    fatigue: 0,
  };
}

export function createWorld(random) {
  return {
    random,
    turn: 0,
    sideToMove: SIDE_PLAYER,
    player: freshSide(random),
    ai: freshSide(random),
    played: { player: [], ai: [] },
    surgeDone: { player: false, ai: false },
    over: null,
    winner: null,
    log: [],
    uidCounter: 1,
  };
}

export function resetWorld(world) {
  const fresh = createWorld(world.random);
  Object.assign(world, fresh);
  world.player.deck = buildDeck(world.random);
  world.ai.deck = buildDeck(world.random);
  for (let index = 0; index < START_HAND; index += 1) {
    drawCard(world, SIDE_PLAYER, true);
    drawCard(world, SIDE_AI, true);
  }
  startTurn(world, SIDE_PLAYER);
}

function sideState(world, side) {
  return side === SIDE_PLAYER ? world.player : world.ai;
}

function log(world, message) {
  world.log.push(message);
  if (world.log.length > 6) world.log.shift();
}

/** Draw one card; an empty deck bites back with fatigue damage that grows each time. */
export function drawCard(world, side, quiet) {
  const state = sideState(world, side);
  if (state.deck.length === 0) {
    state.fatigue += 1;
    state.life -= state.fatigue;
    if (!quiet) log(world, `${side === SIDE_PLAYER ? 'You' : 'The Warden'} take ${state.fatigue} fatigue damage.`);
    checkOver(world);
    return null;
  }
  const id = state.deck.pop();
  if (state.hand.length >= MAX_HAND) {
    if (!quiet) log(world, 'Hand full — a card burns.');
    return null;
  }
  state.hand.push(id);
  return id;
}

/** A new turn: one more mana crystal (to a max of ten), a full refill, a fresh card. */
export function startTurn(world, side) {
  const state = sideState(world, side);
  world.turn += side === SIDE_PLAYER ? 1 : 0;
  world.sideToMove = side;
  state.maxMana = Math.min(MAX_MANA, state.maxMana + 1);
  state.mana = state.maxMana;
  for (const creature of state.board) {
    creature.sick = false;
    creature.acted = false;
  }
  world.played[side] = [];
  world.surgeDone[side] = false;
  drawCard(world, side);
}

export function endTurn(world) {
  if (world.over) return;
  startTurn(world, otherSide(world.sideToMove));
}

export function effectiveAttack(creature) {
  return creature.attack;
}

function dealDamage(world, targetSide, amount, sourceElement, defenderElement) {
  const state = sideState(world, targetSide);
  let dealt = amount;
  if (sourceElement && defenderElement && hasAdvantage(sourceElement, defenderElement)) dealt += 1;
  state.life -= dealt;
  checkOver(world);
  return dealt;
}

function damageCreature(world, side, uid, amount, sourceElement) {
  const state = sideState(world, side);
  const creature = state.board.find((entry) => entry.uid === uid);
  if (!creature) return 0;
  let dealt = amount;
  if (sourceElement && hasAdvantage(sourceElement, creature.element)) dealt += 1;
  creature.health -= dealt;
  if (creature.health <= 0) {
    state.board = state.board.filter((entry) => entry.uid !== uid);
    return EVENT_DEATH;
  }
  return EVENT_NONE;
}

function checkOver(world) {
  if (world.over) return;
  if (world.player.life <= 0 && world.ai.life <= 0) {
    world.over = 'draw';
    world.winner = null;
  } else if (world.ai.life <= 0) {
    world.over = 'win';
    world.winner = SIDE_PLAYER;
  } else if (world.player.life <= 0) {
    world.over = 'loss';
    world.winner = SIDE_AI;
  }
}

/** Play the card at handIndex. Creatures need no target; spells take one (see spellTargets). */
export function playCard(world, side, handIndex, target) {
  const state = sideState(world, side);
  const foe = sideState(world, otherSide(side));
  const id = state.hand[handIndex];
  if (id === undefined) return { events: EVENT_NONE, ok: false };
  const base = summonCard(id, world.uidCounter);
  if (base.cost > state.mana) return { events: EVENT_NONE, ok: false };
  if (base.type === TYPE_CREATURE && state.board.length >= MAX_BOARD) return { events: EVENT_NONE, ok: false };

  state.hand.splice(handIndex, 1);
  state.mana -= base.cost;
  world.uidCounter += 1;
  world.played[side].push(base.element);
  let events = EVENT_PLAY;
  const who = side === SIDE_PLAYER ? 'You play' : 'The Warden plays';

  if (base.type === TYPE_CREATURE) {
    state.board.push(base);
    log(world, `${who} ${base.name} (${base.attack}/${base.health}).`);
  } else {
    log(world, `${who} ${base.name}.`);
    events |= applySpell(world, side, base, target);
  }

  // Surge: two cards of one element in a single turn rally every friendly creature +1/+1.
  const same = world.played[side].filter((element) => element === base.element).length;
  if (same >= 2 && !world.surgeDone[side]) {
    world.surgeDone[side] = true;
    for (const creature of state.board) {
      creature.attack += 1;
      creature.health += 1;
      creature.maxHealth += 1;
    }
    events |= EVENT_SURGE;
    log(world, `${side === SIDE_PLAYER ? 'Your' : "The Warden's"} ${base.element} cards SURGE +1/+1!`);
  }
  checkOver(world);
  if (world.over) events |= EVENT_OVER;
  return { events, ok: true };
}

/** What a spell may aim at: 'hero' (either side) or one enemy creature by uid. */
export function spellTargets(world, side, handIndex) {
  const state = sideState(world, side);
  const id = state.hand[handIndex];
  if (id === undefined) return [];
  const base = summonCard(id, 0);
  if (base.type === TYPE_CREATURE) return [];
  const foe = sideState(world, otherSide(side));
  switch (base.effect) {
    case 'damage3':
      return [{ kind: 'hero', side: otherSide(side) }, ...foe.board.map((c) => ({ kind: 'creature', side: otherSide(side), uid: c.uid }))];
    case 'damageHero4':
      return [{ kind: 'hero', side: otherSide(side) }];
    case 'heal6':
    case 'draw2':
      return [{ kind: 'self', side }];
    case 'damageAll2':
    case 'damageAll3':
      return [{ kind: 'all', side: otherSide(side) }];
    default:
      return [];
  }
}

function applySpell(world, side, spell, target) {
  const foeSide = otherSide(side);
  const foe = sideState(world, foeSide);
  let events = EVENT_NONE;
  switch (spell.effect) {
    case 'damage3': {
      if (target && target.kind === 'hero') dealDamage(world, foeSide, 3, spell.element, null);
      else if (target && target.kind === 'creature') events |= damageCreature(world, foeSide, target.uid, 3, spell.element);
      break;
    }
    case 'damageHero4':
      dealDamage(world, foeSide, 4, spell.element, null);
      break;
    case 'heal6': {
      const state = sideState(world, side);
      state.life = Math.min(START_LIFE, state.life + 6);
      break;
    }
    case 'draw2':
      drawCard(world, side);
      drawCard(world, side);
      break;
    case 'damageAll2':
      for (const creature of [...foe.board]) events |= damageCreature(world, foeSide, creature.uid, 2, spell.element);
      break;
    case 'damageAll3':
      for (const creature of [...foe.board]) events |= damageCreature(world, foeSide, creature.uid, 3, spell.element);
      break;
    default:
      break;
  }
  checkOver(world);
  if (world.over) events |= EVENT_OVER;
  return events;
}

/** One creature strikes: the enemy hero, or one enemy creature (which strikes back). */
export function attack(world, side, attackerUid, target) {
  const state = sideState(world, side);
  const foe = sideState(world, otherSide(side));
  const attacker = state.board.find((entry) => entry.uid === attackerUid);
  if (!attacker || attacker.sick || attacker.acted || world.over) return { events: EVENT_NONE, ok: false };
  attacker.acted = true;
  let events = EVENT_ATTACK;
  const who = side === SIDE_PLAYER ? 'Your' : "The Warden's";
  if (target.kind === 'hero') {
    const dealt = dealDamage(world, otherSide(side), attacker.attack, attacker.element, null);
    log(world, `${who} ${attacker.name} hits the hero for ${dealt}.`);
  } else {
    const defender = foe.board.find((entry) => entry.uid === target.uid);
    if (!defender) return { events: EVENT_NONE, ok: false };
    const dealt = attacker.attack + (hasAdvantage(attacker.element, defender.element) ? 1 : 0);
    defender.health -= dealt;
    log(world, `${who} ${attacker.name} hits ${defender.name} for ${dealt}${hasAdvantage(attacker.element, defender.element) ? ' (advantage!)' : ''}.`);
    if (defender.health <= 0) {
      foe.board = foe.board.filter((entry) => entry.uid !== target.uid);
      events |= EVENT_DEATH;
    } else {
      // A living defender strikes back.
      attacker.health -= defender.attack;
      if (attacker.health <= 0) {
        state.board = state.board.filter((entry) => entry.uid !== attackerUid);
        events |= EVENT_DEATH;
      }
    }
  }
  checkOver(world);
  if (world.over) events |= EVENT_OVER;
  return { events, ok: true };
}

/** Every creature of `side` that can act, and what each may hit. */
export function legalAttacks(world, side) {
  const state = sideState(world, side);
  const foe = sideState(world, otherSide(side));
  const moves = [];
  for (const attacker of state.board) {
    if (attacker.sick || attacker.acted) continue;
    moves.push({ attackerUid: attacker.uid, target: { kind: 'hero', side: otherSide(side) } });
    for (const defender of foe.board) moves.push({ attackerUid: attacker.uid, target: { kind: 'creature', side: otherSide(side), uid: defender.uid } });
  }
  return moves;
}

/** Every hand card `side` can afford right now, with its targets. */
export function legalPlays(world, side) {
  const state = sideState(world, side);
  const moves = [];
  for (let index = 0; index < state.hand.length; index += 1) {
    const base = summonCard(state.hand[index], 0);
    if (base.cost > state.mana) continue;
    if (base.type === TYPE_CREATURE && state.board.length >= MAX_BOARD) continue;
    moves.push({ handIndex: index, targets: spellTargets(world, side, index) });
  }
  return moves;
}
