import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const hero = document.querySelector<HTMLElement>('.hero')!;
const video = hero.querySelector<HTMLVideoElement>('video')!;
const fallback = hero.querySelector<HTMLElement>('.film-fallback')!;
const enable = hero.querySelector<HTMLButtonElement>('.enable-film')!;
const hint = hero.querySelector<HTMLElement>('.scrub-hint')!;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
let timeline: gsap.core.Timeline | undefined;
let targetTime = 0;
let raf = 0;
let seekTimer = 0;
let loadTimer = 0;
let seekStarted = 0;
let slowSeeks = 0;
let ready = false;
let duration = 0;
let manuallyEnabled = false;

function staticMode(message: string, canRetry = true) {
  ready = false;
  clearTimeout(loadTimer);
  clearTimeout(seekTimer);
  cancelAnimationFrame(raf);
  raf = 0;
  timeline?.scrollTrigger?.kill();
  timeline?.kill();
  timeline = undefined;
  hero.classList.add('is-static');
  hero.dataset.state = 'fallback';
  video.pause();
  gsap.set('.hero-intro', { clearProps: 'all' });
  gsap.set('.hero-second', { clearProps: 'all' });
  gsap.set('.hero .scene-dissolve', { clearProps: 'all' });
  fallback.hidden = false;
  fallback.querySelector('[role=status]')!.textContent = message;
  enable.hidden = !canRetry;
  hint.textContent = 'Explore the thesis';
  ScrollTrigger.refresh();
}

// Keep only one seek in flight. Intermediate scroll events update the target;
// seeked requests the most recent target, so rapid reverse scrolling never queues frames.
function requestSeek() {
  if (!ready || video.seeking || raf || document.hidden) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    if (!ready || video.seeking || Math.abs(video.currentTime - targetTime) < 0.025) return;
    try {
      seekStarted = performance.now();
      video.currentTime = targetTime;
      clearTimeout(seekTimer);
      seekTimer = window.setTimeout(() => staticMode('Interactive film unavailable. Showing a still image.'), 4500);
    } catch {
      staticMode('Your browser could not seek the film. Showing a still image.');
    }
  });
}

video.addEventListener('seeked', () => {
  clearTimeout(seekTimer);
  if (!ready) return;
  const elapsed = performance.now() - seekStarted;
  slowSeeks = elapsed > 900 ? slowSeeks + 1 : 0;
  if (slowSeeks >= 3) {
    staticMode('Still-image experience enabled for smoother browsing.');
    return;
  }
  requestSeek();
});

function setupTimeline() {
  if (ready || reduced.matches || !Number.isFinite(video.duration) || video.duration <= 0) return;
  clearTimeout(loadTimer);
  // Do not seek to duration exactly; some decoders report an empty end frame.
  duration = Math.max(0, video.duration - 0.04);
  hero.classList.remove('is-static');
  fallback.hidden = true;
  hint.textContent = 'Scroll to explore';
  ready = true;
  hero.dataset.state = 'ready';
  video.pause();
  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true,
      invalidateOnRefresh: true,
      onUpdate: self => {
        targetTime = self.progress * duration;
        requestSeek();
        hero.querySelector('.film-progress')!.textContent = `${String(Math.round(self.progress * 100)).padStart(2, '0')} — 100`;
      },
      onRefresh: self => { targetTime = self.progress * duration; requestSeek(); },
    },
  });
  timeline.to('.hero-intro', { autoAlpha: 0, y: -24, duration: .22, ease: 'none' }, .08)
    .fromTo('.hero-second', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .22, ease: 'none' }, .39)
    .to('.hero-second', { autoAlpha: 0, y: -18, duration: .16, ease: 'none' }, .84)
    .to('.hero .scene-dissolve', { opacity: 1, duration: .14, ease: 'sine.inOut' }, .86)
    .to('.film-line span', { scaleX: 1, duration: 1, ease: 'none' }, 0);
  ScrollTrigger.refresh();
  targetTime = (timeline.scrollTrigger?.progress || 0) * duration;
  requestSeek();
}

function loadFilm() {
  if (reduced.matches) { staticMode('Reduced-motion experience: still image.', false); return; }
  if (connection?.saveData && !manuallyEnabled) { staticMode('Data-saving experience: still image.'); return; }
  hero.classList.remove('is-static');
  cancelAnimationFrame(raf);
  raf = 0;
  fallback.hidden = true;
  hero.dataset.state = 'loading';
  // Choose once to avoid reloading during mobile address-bar changes or rotation.
  video.src = (matchMedia('(max-width: 800px)').matches ? video.dataset.mobile : video.dataset.desktop)!;
  video.preload = 'auto';
  video.load();
  clearTimeout(loadTimer);
  loadTimer = window.setTimeout(() => staticMode('The film is taking longer to load. Explore the still-image version.'), 20000);
}

// Metadata is the prerequisite; loadeddata also ensures the first frame can decode.
video.addEventListener('loadedmetadata', () => {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setupTimeline();
});
video.addEventListener('loadeddata', setupTimeline);
video.addEventListener('error', () => staticMode('Film unavailable. The portfolio is ready to explore.'));
enable.addEventListener('click', () => {
  manuallyEnabled = true;
  slowSeeks = 0;
  loadFilm();
  // Some iOS/low-power browsers require an explicit gesture to unlock decoding.
  // Immediately pause after play resolves; never run a looping background movie.
  video.play()?.then(() => { video.pause(); requestSeek(); }).catch(() => {
    if (!ready) staticMode('This browser cannot enable the film. Showing a still image.');
  });
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestSeek(); });
reduced.addEventListener('change', () => {
  if (reduced.matches) staticMode('Reduced-motion experience: still image.', false);
  else loadFilm();
});
window.addEventListener('pageshow', () => { ScrollTrigger.refresh(); requestSeek(); });
// Refresh the scroll geometry after the page finishes settling, including
// browser history restores. The film remains paused throughout.
window.addEventListener('load', () => { ScrollTrigger.refresh(); requestSeek(); });
loadFilm();
