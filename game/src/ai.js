// The Warden's brain: a greedy, readable opponent. It plays what it can afford, spends its
// mana on the biggest board it can build, clears what threatens it, and goes for the hero
// whenever the trade is not plainly bad. `skill` 0 plays at random, 1 plays greedy.
import { cardById, TYPE_CREATURE } from './cards.js';
import { attack, legalAttacks, legalPlays, playCard, spellTargets } from './world.js';

/** Score a creature as an attack target: killing it is good, and so is hurting a big one. */
function targetValue(attacker, defender) {
  let value = defender.attack * 2 + defender.health;
  if (defender.health <= attacker.attack) value += 6;
  if (defender.attack >= 4) value += 2;
  return value;
}

function chooseAttack(world, side) {
  const moves = legalAttacks(world, side);
  if (moves.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    const state = side === 'player' ? world.player : world.ai;
    const attacker = state.board.find((entry) => entry.uid === move.attackerUid);
    if (!attacker) continue;
    let score = 0;
    if (move.target.kind === 'hero') {
      score = attacker.attack + 3;
      const foe = side === 'player' ? world.ai : world.player;
      if (foe.life <= attacker.attack) score += 100;
    } else {
      const foe = side === 'player' ? world.ai : world.player;
      const defender = foe.board.find((entry) => entry.uid === move.target.uid);
      if (!defender) continue;
      score = targetValue(attacker, defender);
      if (defender.health > attacker.attack && defender.attack >= attacker.health) score -= 4;
    }
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function chooseSpellTarget(world, side, handIndex) {
  const targets = spellTargets(world, side, handIndex);
  if (targets.length === 0) return null;
  const state = side === 'player' ? world.player : world.ai;
  const base = cardById(state.hand[handIndex]);
  if (base.effect === 'damage3') {
    let best = targets[0];
    let bestScore = -Infinity;
    for (const target of targets) {
      let score = 0;
      if (target.kind === 'hero') {
        const foe = side === 'player' ? world.ai : world.player;
        score = foe.life <= 3 ? 50 : 1;
      } else {
        const foe = side === 'player' ? world.ai : world.player;
        const defender = foe.board.find((entry) => entry.uid === target.uid);
        if (defender) score = defender.health <= 3 ? 10 + defender.attack : defender.attack;
      }
      if (score > bestScore) {
        bestScore = score;
        best = target;
      }
    }
    return best;
  }
  if (base.effect === 'heal6') return targets[0];
  if (base.effect === 'draw2') return targets[0];
  return targets[0];
}

/**
 * Play one whole turn for `side`: spend mana on creatures and good spells, then attack with
 * everything that can. Returns the list of moves it made, for the shot stager and the log.
 */
export function takeTurn(world, side, skill) {
  const made = [];
  for (let guard = 0; guard < 20; guard += 1) {
    if (world.over) break;
    const play = planPlay(world, side, skill);
    if (!play) break;
    const result = playCard(world, side, play.handIndex, play.target);
    if (!result.ok) break;
    made.push({ play });
  }
  for (let guard = 0; guard < 20; guard += 1) {
    if (world.over) break;
    const move = planAttack(world, side, skill);
    if (!move) break;
    const result = attack(world, side, move.attackerUid, move.target);
    if (!result.ok) break;
    made.push({ attack: move });
  }
  return made;
}

/** The next card `side` would play, or null when it should stop playing. */
export function planPlay(world, side, skill) {
  const state = side === 'player' ? world.player : world.ai;
  const plays = legalPlays(world, side);
  if (plays.length === 0) return null;
  let pick = null;
  if (skill === 0) {
    pick = plays[world.random.int(plays.length)];
  } else {
    let bestScore = -Infinity;
    for (const play of plays) {
      const base = cardById(state.hand[play.handIndex]);
      let score = base.type === TYPE_CREATURE ? base.attack * 2 + base.health : 3;
      if (base.effect === 'heal6' && state.life >= 26) score = -5;
      if (base.effect === 'draw2' && state.hand.length >= 6) score = -5;
      if (base.effect === 'damageAll2' || base.effect === 'damageAll3') {
        const foe = side === 'player' ? world.ai : world.player;
        score = foe.board.length === 0 ? -5 : foe.board.length * 3;
      }
      if (score > bestScore) {
        bestScore = score;
        pick = play;
      }
    }
    if (bestScore < 0) return null;
  }
  return { handIndex: pick.handIndex, target: chooseSpellTarget(world, side, pick.handIndex) };
}

/** The next attack `side` would make, or null when nothing can attack. */
export function planAttack(world, side, skill) {
  if (skill === 0) {
    const moves = legalAttacks(world, side);
    return moves.length ? moves[world.random.int(moves.length)] : null;
  }
  return chooseAttack(world, side);
}
