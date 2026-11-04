import { createDiagramLayout, type Point } from './diagram-layout';

export function installDiagramInteraction(scene: HTMLElement) {
  const board = scene.querySelector<HTMLElement>('.methodology-board')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const layout = createDiagramLayout();
  const nodes = [...scene.querySelectorAll<HTMLElement>('[data-node]')];
  const domains = [...scene.querySelectorAll<SVGCircleElement>('[data-domain]')];
  const halos = [...scene.querySelectorAll<SVGCircleElement>('[data-halo]')];
  const edges = [...scene.querySelectorAll<SVGPathElement>('.methodology-edge')];
  const pause = scene.querySelector<HTMLButtonElement>('.methodology-motion')!;
  const reset = scene.querySelector<HTMLButtonElement>('.methodology-reset')!;
  const chapter = scene.closest<HTMLElement>('.thesis-chapter')!;
  let seconds = 0, previous = 0, frame = 0, visible = false, paused = false;
  let current = layout.sample(0, motion.matches);
  let drag: { element: HTMLElement | SVGCircleElement; id: string; pointer: number; start: Point; origin: Point; moved: boolean } | undefined;
  function render() {
    current = layout.sample(seconds, motion.matches);
    nodes.forEach(n => { const p=current.points.get(n.dataset.node!)!; n.style.left=p.x/9+'%'; n.style.top=p.y/9+'%'; });
    domains.forEach(d => { const p=current.points.get('domain:'+d.dataset.domain)!; d.setAttribute('cx',String(p.x));d.setAttribute('cy',String(p.y)); });
    halos.forEach(h => { const p=current.points.get(h.dataset.halo!)!;h.setAttribute('cx',String(p.x));h.setAttribute('cy',String(p.y)); });
    current.routes.forEach((r,i) => edges[i].setAttribute('d',r.d));
  }
  const canAnimate = () => visible && !paused && !motion.matches && !document.hidden && !drag;
  function tick(now: number) {
    frame=0;
    if (!canAnimate()) { previous=0;return; }
    if (previous) seconds+=Math.min((now-previous)/1000,.05);
    previous=now;
    render();frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;previous=0;
    pause.textContent=paused ? 'Resume motion' : 'Pause motion';
    pause.setAttribute('aria-pressed',String(paused));pause.hidden=motion.matches;
    render();if(canAnimate()) frame=requestAnimationFrame(tick);
  }
  function point(event: PointerEvent): Point {
    const rect=board.getBoundingClientRect();
    return {x:(event.clientX-rect.left)/rect.width*900,y:(event.clientY-rect.top)/rect.height*900};
  }
  function dragBounds() {
    const rect=board.getBoundingClientRect();
    // Bounds follow the full visible sheet, not the initial square drawing area.
    return { left:(60-rect.left)/rect.width*900, right:(innerWidth-65-rect.left)/rect.width*900, top:(115-rect.top)/rect.height*900, bottom:(innerHeight-155-rect.top)/rect.height*900 };
  }
  const movers: [HTMLElement | SVGCircleElement,string][] = [
    ...nodes.map(n => [n,n.dataset.node!] as [HTMLElement,string]),
    ...domains.map(d => [d,'domain:'+d.dataset.domain] as [SVGCircleElement,string]),
  ];
  movers.forEach(([element,id]) => {
    let suppressClick=false;
    element.addEventListener('pointerdown', (event: Event) => {
      const e=event as PointerEvent;
      if (e.button!==0 || !e.isPrimary || drag) return;
      suppressClick=false;
      drag={element,id,pointer:e.pointerId,start:point(e),origin:current.points.get(id)!,moved:false};
      element.setPointerCapture(e.pointerId);sync();
    });
    element.addEventListener('pointermove', (event: Event) => {
      const e=event as PointerEvent;
      if(!drag || drag.element!==element || drag.pointer!==e.pointerId)return;
      const p=point(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;
      if(Math.hypot(dx,dy)<5 && !drag.moved)return;
      drag.moved=true;scene.classList.add('is-dragging');
      layout.move(id,{x:drag.origin.x+dx,y:drag.origin.y+dy},dragBounds());render();
    });
    function end(event: Event) {
      const e=event as PointerEvent;
      if(!drag || drag.element!==element || drag.pointer!==e.pointerId)return;
      suppressClick=drag.moved;drag=undefined;scene.classList.remove('is-dragging');
      if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);
      sync();
    }
    element.addEventListener('pointerup',end);
    element.addEventListener('pointercancel',end);
    element.addEventListener('lostpointercapture',end);
    // A drag must never activate the taxonomy's chapter link.
    element.addEventListener('click',event=>{
      if(suppressClick && (event as MouseEvent).detail!==0){event.preventDefault();event.stopImmediatePropagation();}
      suppressClick=false;
    },true);
    element.addEventListener('dragstart',event=>event.preventDefault());
    element.addEventListener('keydown',(event: Event)=>{
      const e=event as KeyboardEvent;
      const direction:Record<string,Point>={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}};
      const v=direction[e.key];if(!v)return;
      e.preventDefault();const p=current.points.get(id)!,step=e.shiftKey?24:8;
      layout.move(id,{x:p.x+v.x*step,y:p.y+v.y*step},dragBounds());render();
    });
  });
  pause.addEventListener('click',()=>{paused=!paused;sync();});
  reset.addEventListener('click',()=>{layout.reset();seconds=0;sync();});
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);sync();});
  observer.observe(chapter);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',sync);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;previous=0;});
  window.addEventListener('pageshow',sync);
  sync();
}
