import { syncSceneGates } from './scene-transitions';
export type ChapterBounds = { id: string; top: number; bottom: number; static?: boolean };
// Overlapping sticky scenes switch only when the incoming scene fills the viewport.
export function activeChapter(bounds: ChapterBounds[]) {
  return bounds.filter(b => b.top <= (b.static ? 72 : 0) && b.bottom > (b.static ? 72 : 0)).at(-1)?.id;
}

export function installChapterIndex() {
  const nav = document.querySelector<HTMLElement>('.chapter-index');
  if (!nav) return;
  const menu = nav.querySelector<HTMLDetailsElement>('details')!;
  const summary = menu.querySelector<HTMLElement>('summary')!;
  const count = nav.querySelector<HTMLElement>('[data-current-number]')!;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('[data-chapter-jump]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1))!).filter(Boolean);
  const title = nav.querySelector<HTMLElement>('[data-current-title]')!;
  function update() {
    const bounds = sections.map(section => { const rect=section.getBoundingClientRect(); return { id: section.id, top:rect.top, bottom:rect.bottom, static: section.classList.contains('is-static') }; });
    const id = activeChapter(bounds);
    const section = sections.find(s => s.id === id);
    const rect = section?.getBoundingClientRect();
    const progress = rect ? Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height-innerHeight))) : 0;
    const pale = section && ['cards','methodology'].includes(section.dataset.kind || '') && (section.classList.contains('is-static') || (progress > .08 && progress < .94));
    const lightInk = Boolean(section && (id === 'top' ? progress > .9 : !pale));
    nav!.dataset.tone = lightInk ? 'light' : 'dark';
    links.forEach(link => {
      if (link.hash === '#'+id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    const active = links.find(link => link.hash === '#'+id);
    count.textContent = active?.dataset.number || '—';
    title.textContent = active?.querySelector('.chapter-index-title')?.textContent || 'Explore chapters';
    summary.setAttribute('aria-label', active ? 'Chapters, current: '+active.querySelector('.chapter-index-title')!.textContent : 'Open chapter navigation');
  }
  links.forEach(link => link.addEventListener('click', event => {
    if(event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    const target=document.getElementById(link.hash.slice(1));if(!target)return;
    event.preventDefault();
    menu.open=false;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offset=target.id==='top' || reduced || target.classList.contains('is-static') ? 0 : Math.max(0,target.offsetHeight-innerHeight)*.2;
    history.pushState(null,'',link.hash);
    window.scrollTo({top:scrollY+target.getBoundingClientRect().top+offset,behavior:'instant'});
    syncSceneGates();update();
    const heading=target.querySelector<HTMLElement>('h1,h2');
    heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
  }));
  menu.addEventListener('keydown',event=>{
    if(event.key==='Escape' && menu.open){menu.open=false;summary.focus();}
  });
  document.addEventListener('pointerdown',event=>{
    if(menu.open && !nav.contains(event.target as Node))menu.open=false;
  });
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  window.addEventListener('pageshow',update);
  window.addEventListener('load',update);
  update();
}
