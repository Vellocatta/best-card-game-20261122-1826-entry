// A tiny seeded random source (mulberry32) so a ?seed=N game always plays the same way.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    next() {
      state = (state + 0x6d2b79f5) | 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    int(max) {
      return Math.floor(this.next() * max);
    },
    pick(list) {
      return list[this.int(list.length)];
    },
  };
}

/** Fisher-Yates shuffle, in place, driven by the seeded source. */
export function shuffle(list, random) {
  for (let index = list.length - 1; index > 0; index -= 1) {
    const other = random.int(index + 1);
    const held = list[index];
    list[index] = list[other];
    list[other] = held;
  }
  return list;
}
