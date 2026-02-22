// ── STATE ─────────────────────────────────────────────────────────────────
let restDuration = 60;
let phase        = 'idle'; // idle | rest | alert
let timeLeft     = 0;
let totalTime    = 0;
let setsDone     = 0;
let ticker       = null;
let warnFired    = false;
let audioCtx     = null;

// ── AUDIO ─────────────────────────────────────────────────────────────────
const TONE_FREQS = {
  go:      [440, 660],
  warning: [330],
  done:    [660, 550, 440],
};

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
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

// ── BLINK ─────────────────────────────────────────────────────────────────
function startBlink() {
  if (!document.getElementById('toggle-blink').checked) return;
  document.getElementById('blink-overlay').classList.add('active');
}

function stopBlink() {
  document.getElementById('blink-overlay').classList.remove('active');
}

function clearFlash(el) {
  el.style.display    = '';
  el.style.animation  = '';
  el.style.background = '';
}

function fadeFlash(el) {
  el.style.opacity = '0';
  setTimeout(() => clearFlash(el), 300);
}

function flashOnce(color) {
  const el = document.getElementById('blink-overlay');
  el.style.background = color || '#ffffff';
  el.style.animation  = 'none';
  el.style.display    = 'block';
  el.style.opacity    = '0.3';
  setTimeout(() => fadeFlash(el), 200);
}

// ── SETTINGS ──────────────────────────────────────────────────────────────
const PRESET_MAP = { '30s': 30, '1 min': 60, '90s': 90, '2 min': 120, '3 min': 180 };

function adjustRest(delta) {
  restDuration = Math.max(15, Math.min(600, restDuration + delta));
  updateRestUI();
}

function setRest(s) {
  restDuration = s;
  updateRestUI();
}

function updateRestDisplay() {
  document.getElementById('rest-display').textContent = fmtSec(restDuration);
}

function updatePresetPills() {
  document.querySelectorAll('#rest-presets .preset-pill').forEach(p => {
    p.classList.toggle('active', PRESET_MAP[p.textContent.trim()] === restDuration);
  });
}

function updateRestUI() {
  updateRestDisplay();
  updatePresetPills();
}

// ── SESSION ───────────────────────────────────────────────────────────────
function showTimerScreen() {
  document.getElementById('settings-screen').classList.add('hidden');
  document.getElementById('timer-screen').classList.remove('hidden');
  document.getElementById('timer-screen').className = 'screen';
}

function startSession() {
  try { getAudioCtx(); } catch(e) {}
  setsDone = 0;
  phase    = 'idle';
  stopBlink();
  clearInterval(ticker);
  showTimerScreen();
  renderDots();
  showIdle();
}

// ── TAP HANDLER ───────────────────────────────────────────────────────────
function acknowledgeSet() {
  stopBlink();
  setsDone++;
  phase = 'idle';
  renderDots();
  clearInterval(ticker);
  showIdle();
}

function handleTap() {
  try { resumeAudio(); } catch(e) {}
  if (phase === 'idle')       startRest();
  else if (phase === 'rest')  endRest();
  else if (phase === 'alert') acknowledgeSet();
}

// ── REST ──────────────────────────────────────────────────────────────────
function setRestPhaseUI() {
  document.getElementById('timer-screen').className  = 'screen phase-rest';
  document.getElementById('timer-phase').textContent = 'REST';
  document.getElementById('timer-hint').textContent  = 'Tap to skip rest';
  document.getElementById('timer-digits').classList.remove('urgent');
}

function maybeWarn() {
  if (timeLeft > 10 || warnFired) return;
  warnFired = true;
  if (!document.getElementById('toggle-warning').checked) return;
  flashOnce('#ff9500');
  playTone('warning');
}

function tickRest(startAt, startLeft) {
  timeLeft = Math.max(0, startLeft - (Date.now() - startAt) / 1000);
  maybeWarn();
  document.getElementById('timer-digits').classList.toggle('urgent', timeLeft <= 5);
  updateRingAndDigits();
  if (timeLeft <= 0) { clearInterval(ticker); endRest(); }
}

function startRest() {
  clearInterval(ticker);
  phase = 'rest'; timeLeft = restDuration; totalTime = restDuration; warnFired = false;
  setRestPhaseUI();
  const startAt   = Date.now();
  const startLeft = restDuration;
  ticker = setInterval(() => tickRest(startAt, startLeft), 80);
}

// ── ALERT ─────────────────────────────────────────────────────────────────
function setAlertPhaseUI() {
  document.getElementById('timer-screen').className  = 'screen phase-alert';
  document.getElementById('timer-phase').textContent = 'GO';
  document.getElementById('timer-digits').textContent = 'GO';
  document.getElementById('timer-sub').textContent   = 'Tap to confirm';
  document.getElementById('timer-hint').textContent  = 'Tap when you start your set';
  document.getElementById('timer-digits').classList.remove('urgent');
  setRingPct(0);
}

function endRest() {
  clearInterval(ticker);
  phase = 'alert'; timeLeft = 0;
  setAlertPhaseUI();
  startBlink();
  playTone('go');
}

// ── IDLE ──────────────────────────────────────────────────────────────────
function setIdlePhaseUI() {
  document.getElementById('timer-screen').className  = 'screen phase-idle';
  document.getElementById('timer-phase').textContent = 'START';
  document.getElementById('timer-digits').innerHTML  = '&#9654;';
  document.getElementById('timer-sub').textContent   = '';
  document.getElementById('timer-hint').textContent  = 'Tap to start rest timer';
  document.getElementById('timer-digits').classList.remove('urgent');
  setRingPct(0);
}

function showIdle() {
  clearInterval(ticker);
  stopBlink();
  setIdlePhaseUI();
}

// ── RING ──────────────────────────────────────────────────────────────────
function setRingPct(pct) {
  const circ = 565.5;
  document.getElementById('ring-fill').style.strokeDashoffset =
    circ * (1 - Math.max(0, Math.min(1, pct)));
}

function updateRingAndDigits() {
  setRingPct(totalTime > 0 ? timeLeft / totalTime : 0);
  document.getElementById('timer-digits').textContent = fmt(timeLeft);
  document.getElementById('timer-sub').textContent    = `of ${fmtSec(restDuration)}`;
}

// ── DOTS ──────────────────────────────────────────────────────────────────
function buildDotsHTML() {
  const max = Math.min(setsDone, 12);
  let html  = '';
  for (let i = 0; i < max; i++) html += '<div class="set-dot done"></div>';
  if (setsDone > 12) html += `<span class="overflow-count">+${setsDone - 12}</span>`;
  return html;
}

function renderDots() {
  const el = document.getElementById('sets-dots');
  el.innerHTML = setsDone === 0 ? '' : buildDotsHTML();
}

// ── NAVIGATION ────────────────────────────────────────────────────────────
function goSettings() {
  clearInterval(ticker);
  stopBlink();
  phase = 'idle';
  document.getElementById('timer-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
}

function resetAll() {
  clearInterval(ticker);
  stopBlink();
  setsDone = 0; phase = 'idle';
  renderDots();
  showIdle();
}

// ── FORMAT ────────────────────────────────────────────────────────────────
function fmt(secs) {
  const s = Math.ceil(secs);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${(s % 60).toString().padStart(2, '0')}` : `${s}`;
}

function fmtSec(s) {
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

// ── INIT ──────────────────────────────────────────────────────────────────
updateRestUI();

(async () => {
  try {
    if (!('wakeLock' in navigator)) return;
    let wl = await navigator.wakeLock.request('screen');
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') wl = await navigator.wakeLock.request('screen');
    });
  } catch(e) {}
})();
