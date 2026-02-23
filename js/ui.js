const PRESET_MAP = { '45s': 45, '1 min': 60, '90s': 90, '2 min': 120, '3 min': 180 };

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

function updateRestDisplay() {
  document.getElementById('rest-display').textContent = fmtSec(state.restDuration);
}

function updatePresetPills() {
  document.querySelectorAll('#rest-presets .preset-pill').forEach(p => {
    p.classList.toggle('active', PRESET_MAP[p.textContent.trim()] === state.restDuration);
  });
}

function updateRestUI() {
  updateRestDisplay();
  updatePresetPills();
}

function setRingPct(pct) {
  const circ = 565.5;
  document.getElementById('ring-fill').style.strokeDashoffset =
    circ * (1 - Math.max(0, Math.min(1, pct)));
}

function updateRingAndDigits() {
  setRingPct(state.totalTime > 0 ? state.timeLeft / state.totalTime : 0);
  document.getElementById('timer-digits').textContent = fmt(state.timeLeft);
  document.getElementById('timer-sub').textContent    = `of ${fmtSec(state.restDuration)}`;
}

function setRestPhaseUI() {
  document.getElementById('timer-screen').className  = 'screen phase-rest';
  document.getElementById('timer-phase').textContent = 'REST';
  document.getElementById('timer-hint').textContent  = 'Tap to skip rest';
  document.getElementById('timer-digits').classList.remove('urgent');
}

function setAlertPhaseUI() {
  document.getElementById('timer-screen').className   = 'screen phase-alert';
  document.getElementById('timer-phase').textContent  = 'GO';
  document.getElementById('timer-digits').textContent = 'GO';
  document.getElementById('timer-sub').textContent    = 'Tap to confirm';
  document.getElementById('timer-hint').textContent   = 'Tap when you start your set';
  document.getElementById('timer-digits').classList.remove('urgent');
  setRingPct(0);
}

function setIdlePhaseUI() {
  document.getElementById('timer-screen').className  = 'screen phase-idle';
  document.getElementById('timer-phase').textContent  = 'START TIMER';
  document.getElementById('timer-digits').textContent = '▶\uFE0E';
  document.getElementById('timer-sub').textContent   = '';
  document.getElementById('timer-hint').textContent  = 'Tap to start rest timer';
  document.getElementById('timer-digits').classList.remove('urgent');
  setRingPct(0);
}

function showTimerScreen() {
  document.getElementById('settings-screen').classList.add('hidden');
  document.getElementById('timer-screen').classList.remove('hidden');
  document.getElementById('timer-screen').className = 'screen';
}