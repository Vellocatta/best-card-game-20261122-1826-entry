// The screenshot scenes behind ?shot=start|play|win|loss. Each one plays the real rules
// forward from a fresh world, so the frame is what a short game really looks like and the
// same seed always gives the same frame. The win scene's pilot plays greedy; the loss
// scene's pilot never plays a card and never attacks, so the Warden wins.
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './config.js';
import { endTurn, resetWorld } from './world.js';
import { takeTurn } from './ai.js';

const MAX_TURNS = 60;

/** Play whole turns, alternating the two pilots, until the game ends or the turn cap hits. */
function playForward(world, playerSkill, aiSkill) {
  for (let turn = 0; turn < MAX_TURNS && !world.over; turn += 1) {
    if (world.sideToMove === 'player') takeTurn(world, 'player', playerSkill);
    else takeTurn(world, 'ai', aiSkill);
    if (world.over) break;
    endTurn(world);
  }
}

/**
 * Set `world` to the named scene (start, play, win or loss; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  resetWorld(world);
  if (name === 'play') {
    // A fixed number of turns: a real mid-game board, rich on both sides, never an end screen.
    for (let turn = 0; turn < 11 && !world.over; turn += 1) {
      if (world.sideToMove === 'player') takeTurn(world, 'player', 1);
      else takeTurn(world, 'ai', 1);
      if (world.over) break;
      endTurn(world);
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    playForward(world, 1, 0);
    return { screen: world.over === 'win' ? SCREEN_WIN : SCREEN_PLAY, best: Math.max(0, world.player.life) };
  }
  if (name === 'loss') {
    // The passive pilot: end every turn without playing or attacking.
    for (let turn = 0; turn < MAX_TURNS && !world.over; turn += 1) {
      if (world.sideToMove === 'ai') takeTurn(world, 'ai', 1);
      if (world.over) break;
      endTurn(world);
    }
    return { screen: world.over === 'loss' ? SCREEN_LOSS : SCREEN_PLAY, best: 0 };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
