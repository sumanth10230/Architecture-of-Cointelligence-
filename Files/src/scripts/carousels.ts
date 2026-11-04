export function installCarousels() {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach(root => {
    if(root.dataset.ready)return;
    root.dataset.ready='true';
    const track=root.querySelector<HTMLElement>('.carousel-track')!;
    const controls=root.querySelector<HTMLElement>('.carousel-footer')!;
    const slides=[...root.querySelectorAll<HTMLElement>('.carousel-slide')];
    const previous=root.querySelector<HTMLButtonElement>('[data-previous]')!;
    const next=root.querySelector<HTMLButtonElement>('[data-next]')!;
    const count=root.querySelector<HTMLElement>('[data-slide-count]')!;
    let index=0;
    const automatic=root.dataset.auto==='true';
    const interval=Math.max(1000,Number(root.dataset.interval)||3000);
    const toggle=root.querySelector<HTMLButtonElement>('[data-autoplay]');
    const motion=automatic ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    let timer=0,visible=false,hovered=false,focused=false,userPaused=false;
    function schedule(){
      if(!automatic)return;
      const running=visible&&!hovered&&!focused&&!userPaused&&!motion!.matches&&!document.hidden&&!document.body.classList.contains('modal-open');
      count.setAttribute('aria-live',running?'off':'polite');
      if(toggle){toggle.hidden=motion!.matches;toggle.textContent=userPaused?'▶':'Ⅱ';toggle.setAttribute('aria-label',userPaused?'Resume slideshow':'Pause slideshow');toggle.setAttribute('aria-pressed',String(userPaused));}
      // Unchanged observer notifications must not keep restarting the countdown.
      if(!running){clearTimeout(timer);timer=0;}
      else if(!timer)timer=window.setTimeout(()=>{timer=0;go((index+1)%slides.length);schedule();},interval);
    }
    function manual(to:number){userPaused=true;go(to);schedule();}
    function go(to:number){
      index=Math.max(0,Math.min(slides.length-1,to));
      track.style.transform=`translateX(${-index*100}%)`;
      slides.forEach((slide,i)=>{slide.inert=i!==index;slide.setAttribute('aria-hidden',String(i!==index));});
      previous.disabled=index===0;next.disabled=index===slides.length-1;
      count.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
    }
    previous.addEventListener('click',()=>manual(index-1));next.addEventListener('click',()=>manual(index+1));
    root.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();manual(index+(event.key==='ArrowRight'?1:-1));}
      if(event.key==='Home'||event.key==='End'){event.preventDefault();manual(event.key==='Home'?0:slides.length-1);}
    });
    let start:{x:number;y:number;id:number}|undefined;
    const viewport=root.querySelector<HTMLElement>('.carousel-viewport')!;
    viewport.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0)return;
      start={x:event.clientX,y:event.clientY,id:event.pointerId};viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener('pointerup',event=>{
      if(!start||event.pointerId!==start.id)return;
      const dx=event.clientX-start.x,dy=event.clientY-start.y;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)manual(index+(dx<0?1:-1));
      start=undefined;if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
    });
    viewport.addEventListener('pointercancel',()=>{start=undefined;});
    viewport.addEventListener('lostpointercapture',()=>{start=undefined;});
    viewport.addEventListener('dragstart',event=>event.preventDefault());
    if(automatic){
      const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.25);schedule();},{threshold:[0,.25]});observer.observe(root);
      controls.addEventListener('mouseenter',()=>{hovered=true;schedule();});controls.addEventListener('mouseleave',()=>{hovered=false;schedule();});
      root.addEventListener('focusin',()=>{focused=true;schedule();});root.addEventListener('focusout',event=>{focused=root.contains(event.relatedTarget as Node);schedule();});
      toggle?.addEventListener('click',()=>{userPaused=!userPaused;if(!userPaused){focused=false;hovered=false;}schedule();});
      motion!.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);
      new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
      window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=0;});window.addEventListener('pageshow',schedule);
    }
    go(0);schedule();
  });
}
