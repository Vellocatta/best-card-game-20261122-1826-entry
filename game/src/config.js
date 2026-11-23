// Ember Court — constants: table size, rules numbers and the four elements.
// Each element is told apart by colour AND by shape, never by text alone.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;
export const STEP = 1 / 60;
export const START_LIFE = 30;
export const MAX_MANA = 10;
export const MAX_HAND = 7;
export const MAX_BOARD = 5;
export const START_HAND = 3;
export const BEST_KEY = 'ember-court-best';

export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e8491d', dark: '#8f1d05', light: '#ffb199', glyph: 'flame', beats: 'thorn' },
  tide: { name: 'Tide', color: '#1d7fe8', dark: '#0a3d75', light: '#a8d2ff', glyph: 'wave', beats: 'flame' },
  thorn: { name: 'Thorn', color: '#3fae4a', dark: '#14591d', light: '#b5e8b0', glyph: 'leaf', beats: 'stone' },
  stone: { name: 'Stone', color: '#b98a3e', dark: '#6b4c14', light: '#f2d492', glyph: 'peak', beats: 'tide' },
};
export const ELEMENT_ORDER = ['flame', 'tide', 'thorn', 'stone'];

/** The advantage cycle: flame scorches thorn, thorn cracks stone, stone dams tide, tide drowns flame. */
export function hasAdvantage(attackerElement, defenderElement) {
  return ELEMENTS[attackerElement].beats === defenderElement;
}

/** Screen names the renderer and the loop agree on. */
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';
