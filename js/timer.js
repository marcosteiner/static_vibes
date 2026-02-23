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

function adjustRest(delta) {
  state.restDuration = Math.max(15, Math.min(600, state.restDuration + delta));
  saveSettings();
  updateRestUI();
}

function setRest(s) {
  state.restDuration = s;
  saveSettings();
  updateRestUI();
}

function maybeWarn() {
  if (state.timeLeft > 10 || state.warnFired) return;
  state.warnFired = true;
  if (!document.getElementById('toggle-warning').checked) return;
  flashOnce('#ff9500');
  playTone('warning');
}

function tickRest(startAt, startLeft) {
  state.timeLeft = Math.max(0, startLeft - (Date.now() - startAt) / 1000);
  maybeWarn();
  document.getElementById('timer-digits').classList.toggle('urgent', state.timeLeft <= 5);
  updateRingAndDigits();
  if (state.timeLeft <= 0) { clearInterval(state.ticker); endRest(); }
}

function startRest() {
  clearInterval(state.ticker);
  state.phase = 'rest'; state.timeLeft = state.restDuration;
  state.totalTime = state.restDuration; state.warnFired = false;
  setRestPhaseUI();
  const startAt   = Date.now();
  const startLeft = state.restDuration;
  state.ticker = setInterval(() => tickRest(startAt, startLeft), 80);
}

function endRest() {
  clearInterval(state.ticker);
  state.phase = 'alert'; state.timeLeft = 0;
  setAlertPhaseUI();
  startBlink();
  playTone('done');
}

function showIdle() {
  clearInterval(state.ticker);
  stopBlink();
  setIdlePhaseUI();
}

function acknowledgeSet() {
  stopBlink();
  state.phase = 'idle';
  clearInterval(state.ticker);
  showIdle();
}

function handleTap() {
  try { resumeAudio(); } catch(e) {}
  if (state.phase === 'idle')       startRest();
  else if (state.phase === 'rest')  endRest();
  else if (state.phase === 'alert') acknowledgeSet();
}

function startSession() {
  try { getAudioCtx(); } catch(e) {}
  state.phase    = 'idle';
  stopBlink();
  clearInterval(state.ticker);
  showTimerScreen();
  showIdle();
}

function goSettings() {
  clearInterval(state.ticker);
  stopBlink();
  state.phase = 'idle';
  document.getElementById('timer-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
}

function resetAll() {
  clearInterval(state.ticker);
  stopBlink();
  state.phase    = 'idle';
  state.timeLeft = 0;
  state.totalTime = 0;
  showIdle();
}