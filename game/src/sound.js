// Sound, synthesized live with WebAudio: no audio files, no network, nothing to load.
// A soft pluck for playing a card, a thud for a hit, a chime for Surge, an arpeggio for victory.
export function createSound() {
  let context = null;
  let muted = false;
  function ensure() {
    if (!context) {
      try {
        context = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  }
  function tone(frequency, duration, type, gainValue, when = 0) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, audio.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(audio.currentTime + when);
    oscillator.stop(audio.currentTime + when + duration);
  }
  return {
    toggleMute() {
      muted = !muted;
      return muted;
    },
    play() {
      tone(520, 0.12, 'triangle', 0.12);
      tone(780, 0.1, 'triangle', 0.08, 0.05);
    },
    attack() {
      tone(160, 0.16, 'square', 0.1);
      tone(90, 0.2, 'sawtooth', 0.08, 0.02);
    },
    death() {
      tone(220, 0.3, 'sawtooth', 0.08);
      tone(110, 0.35, 'sawtooth', 0.07, 0.08);
    },
    surge() {
      tone(660, 0.1, 'sine', 0.1);
      tone(880, 0.1, 'sine', 0.1, 0.08);
      tone(1320, 0.18, 'sine', 0.1, 0.16);
    },
    win() {
      [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.25, 'triangle', 0.12, index * 0.12));
    },
    lose() {
      [392, 330, 262, 196].forEach((frequency, index) => tone(frequency, 0.3, 'triangle', 0.1, index * 0.14));
    },
    turn() {
      tone(440, 0.08, 'sine', 0.06);
    },
  };
}
