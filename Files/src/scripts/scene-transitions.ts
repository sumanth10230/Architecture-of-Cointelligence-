// Hide an approaching sticky scene until it fills the viewport. The previous
// scene reaches black at exactly this handoff; no black rectangle slides in.
export function syncSceneGates() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states = [...document.querySelectorAll<HTMLElement>('.thesis-chapter')].map(section => ({
    section,
    stage: section.querySelector<HTMLElement>('.chapter-stage')!,
    enabled: !reduced && !section.previousElementSibling?.classList.contains('is-static'),
    waiting: section.getBoundingClientRect().top > 0,
  }));
  for (const { section, stage, enabled, waiting } of states) {
    section.classList.toggle('has-scene-gate', enabled);
    section.classList.toggle('scene-waiting', enabled && waiting);
    stage.inert = enabled && waiting;
  }
}

export function installSceneGates() {
  syncSceneGates();
  window.addEventListener('scroll', syncSceneGates, { passive: true });
  window.addEventListener('resize', syncSceneGates);
  window.addEventListener('pageshow', syncSceneGates);
  window.addEventListener('load', syncSceneGates);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncSceneGates);
  const hero = document.querySelector('.hero');
  if (hero) new MutationObserver(syncSceneGates).observe(hero, { attributes: true, attributeFilter: ['class'] });
}
