loadSettings();
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