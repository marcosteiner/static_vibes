const state = {
  restDuration: 60,
  phase:        'idle',
  timeLeft:     0,
  totalTime:    0,
  ticker:       null,
  warnFired:    false,
  audioCtx:     null,
};

function saveSettings() {
  localStorage.setItem('restDuration', state.restDuration);
  localStorage.setItem('toggle-audio',   document.getElementById('toggle-audio').checked);
  localStorage.setItem('toggle-blink',   document.getElementById('toggle-blink').checked);
  localStorage.setItem('toggle-warning', document.getElementById('toggle-warning').checked);
}

function loadSettings() {
  const restDuration = localStorage.getItem('restDuration');
  if (restDuration) state.restDuration = parseInt(restDuration);

  ['toggle-audio', 'toggle-blink', 'toggle-warning'].forEach(id => {
    const saved = localStorage.getItem(id);
    if (saved !== null) document.getElementById(id).checked = saved === 'true';
  });
}