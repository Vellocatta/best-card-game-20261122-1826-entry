// The card catalogue: every card in the Ember Court, all original names and art.
// A creature has an attack and a health; a spell has an effect and no body.
import { shuffle } from './random.js';

export const TYPE_CREATURE = 'creature';
export const TYPE_SPELL = 'spell';

export const CATALOGUE = [
  { id: 'ember-imp', name: 'Ember Imp', element: 'flame', type: TYPE_CREATURE, cost: 1, attack: 2, health: 1, text: 'A spark with teeth.' },
  { id: 'cinder-hound', name: 'Cinder Hound', element: 'flame', type: TYPE_CREATURE, cost: 2, attack: 3, health: 2, text: 'It hunts by the smell of smoke.' },
  { id: 'flame-phoenix', name: 'Flame Phoenix', element: 'flame', type: TYPE_CREATURE, cost: 5, attack: 5, health: 4, text: 'Born again from its own ash.' },
  { id: 'tide-minnow', name: 'Tide Minnow', element: 'tide', type: TYPE_CREATURE, cost: 1, attack: 1, health: 2, text: 'Small. Slippery. Everywhere.' },
  { id: 'tide-serpent', name: 'Tide Serpent', element: 'tide', type: TYPE_CREATURE, cost: 3, attack: 3, health: 3, text: 'It coils around the whole river.' },
  { id: 'coral-guardian', name: 'Coral Guardian', element: 'tide', type: TYPE_CREATURE, cost: 4, attack: 2, health: 6, text: 'A reef that learned to walk.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', element: 'thorn', type: TYPE_CREATURE, cost: 1, attack: 1, health: 2, text: 'Mind the thorns. All of them.' },
  { id: 'thorn-wolf', name: 'Thorn Wolf', element: 'thorn', type: TYPE_CREATURE, cost: 2, attack: 3, health: 2, text: 'Its howl grows briars.' },
  { id: 'briar-ancient', name: 'Briar Ancient', element: 'thorn', type: TYPE_CREATURE, cost: 6, attack: 6, health: 6, text: 'Older than the court itself.' },
  { id: 'pebble-pup', name: 'Pebble Pup', element: 'stone', type: TYPE_CREATURE, cost: 1, attack: 1, health: 3, text: 'Good boy. Very good rock.' },
  { id: 'stone-golem', name: 'Stone Golem', element: 'stone', type: TYPE_CREATURE, cost: 3, attack: 2, health: 5, text: 'It has never once hurried.' },
  { id: 'mountain-titan', name: 'Mountain Titan', element: 'stone', type: TYPE_CREATURE, cost: 6, attack: 7, health: 7, text: 'The mountain got up.' },
  { id: 'cinder-burst', name: 'Cinder Burst', element: 'flame', type: TYPE_SPELL, cost: 2, effect: 'damage3', text: 'Deal 3 damage to any target.' },
  { id: 'ember-feast', name: 'Ember Feast', element: 'flame', type: TYPE_SPELL, cost: 4, effect: 'damageHero4', text: 'Deal 4 damage to the enemy hero.' },
  { id: 'healing-rain', name: 'Healing Rain', element: 'tide', type: TYPE_SPELL, cost: 3, effect: 'heal6', text: 'Restore 6 life to your hero.' },
  { id: 'tide-surge', name: 'Tide Surge', element: 'tide', type: TYPE_SPELL, cost: 2, effect: 'draw2', text: 'Draw 2 cards.' },
  { id: 'thorn-snare', name: 'Thorn Snare', element: 'thorn', type: TYPE_SPELL, cost: 3, effect: 'damageAll2', text: 'Deal 2 damage to all enemy creatures.' },
  { id: 'quake-slam', name: 'Quake Slam', element: 'stone', type: TYPE_SPELL, cost: 4, effect: 'damageAll3', text: 'Deal 3 damage to all enemy creatures.' },
];

export function cardById(id) {
  return CATALOGUE.find((card) => card.id === id);
}

/** A fresh 24-card deck: one of each creature, two of each spell, shuffled by the seeded source. */
export function buildDeck(random) {
  const deck = [];
  for (const card of CATALOGUE) {
    const copies = card.type === TYPE_SPELL ? 2 : 1;
    for (let copy = 0; copy < copies; copy += 1) deck.push(card.id);
  }
  return shuffle(deck, random);
}

/** A live copy of a catalogue card, with its own health and summoning sickness. */
export function summonCard(id, uid) {
  const base = cardById(id);
  return {
    uid,
    id: base.id,
    name: base.name,
    element: base.element,
    type: base.type,
    cost: base.cost,
    attack: base.attack ?? 0,
    health: base.health ?? 0,
    maxHealth: base.health ?? 0,
    effect: base.effect ?? null,
    text: base.text,
    sick: true,
    surge: 0,
  };
}
