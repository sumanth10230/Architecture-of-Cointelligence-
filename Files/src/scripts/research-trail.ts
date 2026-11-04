export function installResearchTrail() {
  document.querySelectorAll<HTMLElement>('[data-research-trail]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready='true';
    const button=root.querySelector<HTMLButtonElement>('[data-trail-pause]')!;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let visible=false,paused=false,hovered=false,focused=false;
    function update(){
      root.dataset.reduced=String(motion.matches);
      root.dataset.running=String(visible&&!paused&&!hovered&&!focused&&!motion.matches&&!document.hidden&&!document.body.classList.contains('modal-open'));
      button.hidden=motion.matches;
      button.textContent=paused?'Resume image trail':'Pause image trail';
      button.setAttribute('aria-pressed',String(paused));
    }
    button.addEventListener('click',()=>{paused=!paused;if(!paused){hovered=false;focused=false;}update();});
    root.addEventListener('mouseenter',()=>{hovered=true;update();});
    root.addEventListener('mouseleave',()=>{hovered=false;update();});
    root.addEventListener('focusin',()=>{focused=true;update();});
    root.addEventListener('focusout',event=>{focused=root.contains(event.relatedTarget as Node);update();});
    new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);update();}).observe(root);
    motion.addEventListener('change',update);
    document.addEventListener('visibilitychange',update);
    new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
    update();
  });
}
