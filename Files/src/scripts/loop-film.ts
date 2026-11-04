// This chapter deliberately plays normally; the hero and sheet two still scrub.
export function createLoopFilm(section: HTMLElement) {
  const video = section.querySelector<HTMLVideoElement>('video')!;
  const control = section.querySelector<HTMLButtonElement>('.chapter-playback')!;
  const notice = section.querySelector<HTMLElement>('.chapter-fallback')!;
  const retry = notice.querySelector<HTMLButtonElement>('button')!;
  const status = notice.querySelector<HTMLElement>('[role=status]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const source = matchMedia('(max-width: 800px)').matches ? video.dataset.mobile || video.dataset.desktop : video.dataset.desktop;
  let active = false, ready = false, loading = false, userPaused = false, failed = false, permitted = !saveData;
  let disposed = false, pending = false, timeout = 0;
  video.muted = true; video.loop = true; video.playsInline = true;
  function syncControl() {
    control.hidden = !ready || reduced.matches;
    control.textContent = userPaused || video.paused ? 'Play film' : 'Pause film';
    control.setAttribute('aria-pressed', String(userPaused));
  }
  function showFallback(message: string) {
    loading = false; ready = false; failed = true;
    clearTimeout(timeout); video.pause();
    section.dataset.videoState = 'fallback';
    notice.hidden = false; status.textContent = message;
    retry.hidden = reduced.matches; retry.textContent = 'Play film';
    syncControl();
  }
  function syncPlayback() {
    if (disposed) return;
    if (!active || document.hidden || reduced.matches || userPaused || !ready) {
      video.pause(); syncControl(); return;
    }
    if (pending || !video.paused) return;
    pending = true;
    video.play()?.then(() => {
      pending = false;
      if (!active || document.hidden || reduced.matches || userPaused || disposed) video.pause();
      syncControl();
    }).catch(() => {
      pending = false;
      if (!active || document.hidden || reduced.matches || disposed) return;
      userPaused = true;
      notice.hidden = false; status.textContent = 'Select Play film to start playback.';
      retry.hidden = false; retry.textContent = 'Play film'; syncControl();
    });
  }
  function load() {
    if (disposed || loading || ready || failed || reduced.matches || !source) return;
    if (!permitted) { notice.hidden = false; status.textContent = 'Data-saving mode. Film available on request.'; retry.hidden = false; return; }
    loading = true; notice.hidden = true;
    section.dataset.videoState = 'loading';
    video.src = source; video.preload = 'auto'; video.load();
    timeout = window.setTimeout(() => showFallback('Film is taking longer to load. The still image remains available.'), 20000);
  }
  function decoded() {
    if (disposed || failed || video.readyState < 2) return;
    clearTimeout(timeout); loading = false; ready = true;
    section.dataset.videoState = 'ready'; notice.hidden = true; syncPlayback();
  }
  video.addEventListener('loadeddata', decoded);
  video.addEventListener('canplay', decoded);
  video.addEventListener('error', () => showFallback('Film unavailable. Showing the still image.'));
  video.addEventListener('play', syncControl);
  video.addEventListener('pause', syncControl);
  control.addEventListener('click', () => { userPaused = !userPaused && !video.paused; notice.hidden = true; syncPlayback(); });
  retry.addEventListener('click', () => { permitted = true; failed = false; userPaused = false; notice.hidden = true; load(); syncPlayback(); });
  const approach = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) load(); }, { rootMargin: '100% 0px' });
  approach.observe(section);
  const stage = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) { active = false; syncPlayback(); }
  });
  stage.observe(section.querySelector('.chapter-stage')!);
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', () => { if (reduced.matches) notice.hidden = true; else if (active) load(); syncPlayback(); });
  window.addEventListener('pagehide', event => {
    video.pause();
    if (event.persisted) return;
    disposed = true; clearTimeout(timeout); approach.disconnect(); stage.disconnect();
  });
  window.addEventListener('pageshow', syncPlayback);
  return { setActive(value: boolean) { active = value; if (active) load(); syncPlayback(); } };
}
