export function modelPhase(progress: number): 'first' | 'detail' | null {
  if (progress >= .12 && progress < .27) return 'first';
  if (progress >= .73 && progress < .90) return 'detail';
  return null;
}

export function bubblePosition(x:number,y:number,size:number,width:number,height:number) {
  const clamp=(value:number,max:number)=>Math.max(12,Math.min(value,max-size-12));
  return {left:clamp(x-size/2,width),top:clamp(y-size-18,height)};
}

export function installModelHotspots(section: HTMLElement) {
  const spots=Array.from(section.querySelectorAll<HTMLButtonElement>('.model-hotspot'));
  for (const spot of spots) {
    let touch=false;
    const close=()=>spot.setAttribute('aria-expanded','false');
    const position=(x?:number,y?:number)=>{
      const rect=spot.getBoundingClientRect();
      const bubble=spot.querySelector<HTMLElement>('.model-tooltip');
      const size=bubble?.offsetWidth || 230;
      const point=bubblePosition(x ?? rect.left+rect.width/2,y ?? rect.top+rect.height/2,size,window.innerWidth,window.innerHeight);
      spot.style.setProperty('--bubble-left',`${point.left-rect.left}px`);
      spot.style.setProperty('--bubble-top',`${point.top-rect.top}px`);
    };
    const follow=(event:PointerEvent)=>{
      if(event.pointerType==='touch')return;
      position(event.clientX,event.clientY);
      spot.setAttribute('aria-expanded','true');
    };
    spot.addEventListener('pointerdown',event=>{touch=event.pointerType==='touch';});
    spot.addEventListener('pointerenter',follow);
    spot.addEventListener('pointermove',follow);
    spot.addEventListener('focus',()=>{if(!touch){position();spot.setAttribute('aria-expanded','true');}});
    spot.addEventListener('click',()=>{
      position();
      spot.setAttribute('aria-expanded',String(touch ? spot.getAttribute('aria-expanded')!=='true' : true));
    });
    spot.addEventListener('pointerleave',()=>{if(!touch)close();});
    spot.addEventListener('blur',()=>{touch=false;close();});
    spot.addEventListener('keydown',event=>{if(event.key==='Escape'){close();spot.blur();}});
  }
  return (progress:number,reduced=false)=>{
    const phase=modelPhase(progress);
    for(const spot of spots){
      const active=reduced || spot.dataset.model===phase;
      spot.hidden=!active;
      if(!active){
        spot.setAttribute('aria-expanded','false');
        if(document.activeElement===spot)spot.blur();
      }
    }
  };
}
