const TONE_FREQS = {
  go:      [440, 660],
  warning: [330],
  done:    [440, 660, 0, 0, 440, 660, 0, 0, 440, 660],
};

function getAudioCtx() {
  if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return state.audioCtx;
}

function resumeAudio() {
  const c = getAudioCtx();
  if (c.state === 'suspended') c.resume();
  return c;
}

function scheduleTone(c, freq, delay) {
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t = c.currentTime + delay;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.start(t);
  osc.stop(t + 0.45);
}

function playTone(type) {
  if (!document.getElementById('toggle-audio').checked) return;
  try {
    const c = resumeAudio();
    (TONE_FREQS[type] || TONE_FREQS.done).forEach((freq, i) => scheduleTone(c, freq, i * 0.22));
  } catch(e) {}
}