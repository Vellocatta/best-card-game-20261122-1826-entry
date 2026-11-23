// Input: mouse clicks and keyboard, turned into the game's small action set.
// Click a hand card to select it; click a board creature or the enemy hero to aim it.
// Keyboard: 1-7 pick a hand card, Enter plays the picked card or ends the turn,
// Space ends the turn, R restarts from an end screen, M mutes.
export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

export function createInput(canvas) {
  let actions = 0;
  let clicks = [];
  let mouse = { x: 0, y: 0 };
  let selectedDigit = -1;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  canvas.addEventListener('click', (event) => {
    clicks.push(toLogical(event));
  });
  canvas.addEventListener('mousemove', (event) => {
    mouse = toLogical(event);
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'Enter') actions |= ACTION_CONFIRM;
    if (event.code === 'KeyE') actions |= ACTION_END_TURN;
    if (event.code === 'KeyR') actions |= ACTION_RESTART;
    if (event.code === 'KeyM') actions |= ACTION_MUTE;
    if (/^Digit[1-7]$/.test(event.code)) selectedDigit = Number(event.code.slice(5)) - 1;
    if (event.code === 'Space' || event.code === 'ArrowLeft' || event.code === 'ArrowRight') event.preventDefault();
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    takeDigit() {
      const taken = selectedDigit;
      selectedDigit = -1;
      return taken;
    },
    mouse() {
      return mouse;
    },
  };
}
