import { syncSceneGates } from './scene-transitions';
const header = document.querySelector<HTMLElement>('.site-header')!;
const hero = document.querySelector<HTMLElement>('.hero')!;
const chapterSections = [...document.querySelectorAll<HTMLElement>('.thesis-chapter, .render-gallery')];
const rail = document.querySelector<HTMLElement>('.social-rail');
function updateHeader() {
  const activeChapter = chapterSections.filter(section => {
    const rect = section.getBoundingClientRect();
    return rect.top <= 70 && rect.bottom > 70;
  }).at(-1);
  const onChapter = Boolean(activeChapter);
  const finale = activeChapter?.dataset.kind === 'finale';
  header.classList.toggle('on-finale', finale);
  rail?.classList.toggle('on-finale', finale);
  const progress = Number(activeChapter?.dataset.progress || 0);
  const lightScene = ['cards', 'methodology'].includes(activeChapter?.dataset.kind || '') && (activeChapter?.classList.contains('is-static') || (progress > .065 && progress < .975));
  const heroRect = hero.getBoundingClientRect();
  const heroTravel = heroRect.height - innerHeight;
  const inHeroDissolve = !hero.classList.contains('is-static') && heroTravel > 0 && -heroRect.top / heroTravel > .9 && heroRect.bottom > 70;
  header.classList.toggle('scrolled', heroRect.bottom < 100 && !onChapter);
  header.classList.toggle('on-film', (onChapter && !lightScene) || inHeroDissolve);
  rail?.classList.toggle('on-film', (onChapter && !lightScene) || inHeroDissolve);
  header.classList.toggle('on-light-scene', Boolean(lightScene));
  rail?.classList.toggle('on-light-scene', Boolean(lightScene));
}
addEventListener('scroll', updateHeader, { passive: true });
addEventListener('resize', updateHeader);
chapterSections.forEach(section => section.addEventListener('scene-progress', updateHeader));
updateHeader();
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      header.querySelectorAll('nav a').forEach(a => {
        if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
  }
}, { rootMargin: '-15% 0px -55% 0px' });
document.querySelectorAll('main>section').forEach(section => sectionObserver.observe(section));
// Chapter links land just after the opening dissolve, so a deliberate jump
// shows the title immediately. Normal scrolling keeps the full transition.
document.querySelectorAll<HTMLAnchorElement>('a[href^="#chapter-"]:not([data-chapter-jump])').forEach(link => {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = document.querySelector<HTMLElement>(link.hash);
    if (!target) return;
    event.preventDefault();
    const offset = target.classList.contains('is-static') ? 0 : (target.offsetHeight - innerHeight) * .2;
    history.pushState(null, '', link.hash);
    window.scrollTo({ top: scrollY + target.getBoundingClientRect().top + offset, behavior: 'instant' });
    syncSceneGates();
    if (link.classList.contains('methodology-taxonomy')) {
      const heading = target.querySelector<HTMLElement>('h2');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    }
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-dialog]').forEach(button => {
  const dialog = document.getElementById(button.dataset.dialog!) as HTMLDialogElement;
  button.addEventListener('click', () => { dialog.showModal(); dialog.scrollTop=0; document.body.classList.add('modal-open'); });
  dialog.querySelector('.dialog-close')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const box = dialog.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); button.focus({ preventScroll: true }); });
});
