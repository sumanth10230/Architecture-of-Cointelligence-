import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { virtualTime } from './card-motion';
import { createLoopFilm } from './loop-film';
import { installModelHotspots } from './model-hotspots';

gsap.registerPlugin(ScrollTrigger);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

function createChapter(section: HTMLElement) {
  const isCards = section.dataset.kind === 'cards';
  const isStudy = section.dataset.kind === 'study';
  const isLoop = section.dataset.kind === 'loop';
  const updateHotspots = isStudy ? installModelHotspots(section) : undefined;
  const workflowShade = section.querySelector<HTMLElement>('.workflow-shade');
  const workflowStudies = section.querySelector<HTMLElement>('.workflow-studies');
  const loopFilm = isLoop ? createLoopFilm(section) : undefined;
  const studyShade = isStudy ? section.querySelector<HTMLElement>('.study-shade') : null;
  const studyDetail = isStudy ? section.querySelector<HTMLElement>('.study-detail') : null;
  const studyDip = isStudy ? section.querySelector<HTMLElement>('.study-dip') : null;
  const studyPairs = isStudy ? Array.from(section.querySelectorAll<HTMLElement>('.tensile-pair')) : [];
  const biomeShade = isLoop ? section.querySelector<HTMLElement>('.biome-shade') : null;
  const biomeStudies = isLoop ? section.querySelector<HTMLElement>('.biome-studies') : null;
  const video = section.querySelector<HTMLVideoElement>('video')!;
  const copy = section.querySelector<HTMLElement>('.chapter-copy-content')!;
  const drawing = section.querySelector<SVGElement>('.chapter-drawing');
  const dissolve = section.querySelector<HTMLElement>('.scene-dissolve')!;
  const track = section.querySelector<HTMLElement>('.chapter-track span')!;
  const notice = section.querySelector<HTMLElement>('.chapter-fallback')!;
  const button = notice.querySelector<HTMLButtonElement>('button')!;
  let progress = 0;
  let duration = Number(section.dataset.duration) || 6;
  let ready = false;
  let loading = false;
  let frame = 0;
  let seekTimeout = 0;
  let loadTimeout = 0;
  let startedAt = 0;
  let slowSeeks = 0;
  let timeline: gsap.core.Timeline | undefined;
  const source = isLoop ? '' : (matchMedia('(max-width: 800px)').matches
    ? video.dataset.mobile || video.dataset.desktop : video.dataset.desktop);

  function updateProgress(value: number) {
    progress = value;
    updateHotspots?.(progress, motion.matches);
    section.dataset.progress = progress.toFixed(3);
    section.dataset.time = (isCards ? virtualTime(progress) : progress * duration).toFixed(4);
    if (isCards) section.dispatchEvent(new CustomEvent('scene-progress', { detail: { time: virtualTime(progress) } }));
    else if (isLoop) loopFilm?.setActive(progress > .08 && progress < .96);
    else seek();
  }

  function fallback(message: string) {
    ready = false;
    loading = false;
    clearTimeout(loadTimeout);
    clearTimeout(seekTimeout);
    cancelAnimationFrame(frame);
    frame = 0;
    video.pause();
    section.dataset.videoState = 'fallback';
    notice.hidden = false;
    notice.querySelector('[role=status]')!.textContent = message;
    button.hidden = motion.matches || !source;
  }

  function seek() {
    if (isLoop || !ready || frame || video.seeking || document.hidden) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      // Scrub between the black entrance and the final-frame hold.
      const target = Math.min(1, Math.max(0, (progress - .12) / .68)) * Math.max(0, duration - .04);
      if (!ready || video.seeking || Math.abs(video.currentTime - target) < .025) return;
      try {
        startedAt = performance.now();
        video.currentTime = target;
        clearTimeout(seekTimeout);
        seekTimeout = window.setTimeout(() => fallback('Film paused. Continue with the visual study.'), 4500);
      } catch { fallback('Film unavailable. Showing the visual study.'); }
    });
  }

  function loadFilm(force = false) {
    if (!source || ready || loading || motion.matches) return;
    if (saveData && !force) { fallback('Data-saving mode. Film available on request.'); return; }
    loading = true;
    notice.hidden = true;
    section.dataset.videoState = 'loading';
    video.src = source;
    video.preload = 'auto';
    video.load();
    loadTimeout = window.setTimeout(() => fallback('Film is taking longer to load. Continue with the visual study.'), 20000);
  }

  function metadataReady() {
    if (isLoop || motion.matches || !Number.isFinite(video.duration) || video.duration <= 0 || video.readyState < 2) return;
    duration = video.duration;
    ready = true;
    loading = false;
    clearTimeout(loadTimeout);
    notice.hidden = true;
    section.dataset.videoState = 'ready';
    video.pause();
    seek();
  }

  video.addEventListener('loadedmetadata', metadataReady);
  video.addEventListener('loadeddata', metadataReady);
  video.addEventListener('seeked', () => {
    clearTimeout(seekTimeout);
    if (!ready) return;
    slowSeeks = performance.now() - startedAt > 900 ? slowSeeks + 1 : 0;
    if (slowSeeks >= 3) fallback('Still-image experience enabled for smoother browsing.');
    else seek();
  });
  video.addEventListener('error', () => { if (!isLoop) fallback('Film unavailable. Showing the visual study.'); });
  button.addEventListener('click', () => {
    if (isLoop) return;
    slowSeeks = 0;
    loadFilm(true);
    video.play()?.then(() => { video.pause(); seek(); }).catch(() => {
      if (!ready) fallback('Your browser could not enable the film.');
    });
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) seek(); });

  function configureMotion() {
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
    gsap.set([copy, dissolve, track, ...(drawing ? [drawing] : []), ...(studyShade ? [studyShade, ...studyPairs] : []), ...[biomeShade, biomeStudies, studyDetail, studyDip, workflowShade, workflowStudies].filter(Boolean)], { clearProps: 'all' });
    section.classList.toggle('is-static', motion.matches);
    updateHotspots?.(progress, motion.matches);
    if (motion.matches) {
      loopFilm?.setActive(false);
      if (isCards) updateProgress(0);
      if (source) fallback('Reduced-motion experience.');
      return;
    }
    timeline = gsap.timeline({ scrollTrigger: {
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
      invalidateOnRefresh: true,
      onUpdate: self => updateProgress(self.progress),
      onRefresh: self => updateProgress(self.progress),
    }});
    timeline.fromTo(dissolve, { opacity: 1 }, { opacity: 0, duration: isCards ? .08 : .16, ease: 'sine.inOut' }, 0)
      .fromTo(copy, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: isCards ? .08 : .18, ease: 'none' }, .02)
      .to(copy, { opacity: 0, y: -20, duration: isStudy ? .09 : .15, ease: 'none' }, isStudy ? .90 : .8)
      .to(dissolve, { opacity: 1, duration: isCards ? .06 : isStudy ? .09 : .15, ease: 'sine.inOut' }, isCards ? .94 : isStudy ? .91 : .85)
      .to(track, { scaleX: 1, duration: 1, ease: 'none' }, 0);
    if (drawing) timeline.to(drawing, { rotation: 16, xPercent: -8, scale: 1.12, duration: 1, ease: 'none' }, 0);
    if (studyShade) {
      timeline.fromTo(studyShade, { opacity: 0 }, { opacity: .76, duration: .14, ease: 'sine.inOut' }, .18);
      studyPairs.forEach((pair, index) => timeline!.fromTo(pair, { autoAlpha: 0 }, { autoAlpha: 1, duration: .10, ease: 'sine.inOut' }, .27 + index * .025));
      if (studyDetail && studyDip) {
        // Photo -> paired PNG studies -> black -> full-size second prototype.
        // The shared copy stays above this internal dip throughout all three stages.
        timeline.fromTo(studyDip, { opacity: 0 }, { opacity: 1, duration: .08, ease: 'sine.inOut' }, .56)
          .set(studyDetail, { autoAlpha: 1 }, .64)
          .to(studyPairs, { autoAlpha: 0, duration: .001 }, .64)
          .to(studyDip, { opacity: 0, duration: .08, ease: 'sine.inOut' }, .65);
      }
    }
    if (biomeShade && biomeStudies) {
      // First stage: uninterrupted film. Second stage: black dip, then the study plate.
      // Both follow scroll position, independently of the looping video's clock.
      timeline.fromTo(biomeShade, { opacity: 0 }, { opacity: .92, duration: .18, ease: 'sine.inOut' }, .3)
        .fromTo(biomeStudies, { autoAlpha: 0 }, { autoAlpha: 1, duration: .18, ease: 'sine.inOut' }, .48);
    }
    if (workflowShade && workflowStudies) {
      timeline.fromTo(workflowShade, { opacity: 0 }, { opacity: .94, duration: .16, ease: 'sine.inOut' }, .30)
        .fromTo(workflowStudies, { autoAlpha: 0 }, { autoAlpha: 1, duration: .14, ease: 'sine.inOut' }, .46);
    }
    if (source && video.readyState >= 2) metadataReady();
  }

  configureMotion();
  // Only request a chapter film when approaching it, not all eight at startup.
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) loadFilm();
  }, { rootMargin: '100% 0px' });
  if (source) observer.observe(section);
  motion.addEventListener('change', () => { configureMotion(); ScrollTrigger.refresh(); if (!motion.matches && source) { observer.unobserve(section); observer.observe(section); } });
}

document.querySelectorAll<HTMLElement>('.thesis-chapter').forEach(createChapter);
window.addEventListener('load', () => ScrollTrigger.refresh());
