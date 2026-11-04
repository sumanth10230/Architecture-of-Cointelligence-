import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture(auto=false,reduced=false,interval=3000){
 const el=()=>({dataset:{},style:{},attrs:{},events:{},addEventListener(k,f){this.events[k]=f},emit(k,e={}){this.events[k]?.(e)},setAttribute(k,v){this.attrs[k]=v},setPointerCapture(){this.capture=true},hasPointerCapture(){return this.capture},releasePointerCapture(){this.capture=false}});
 const root=el(),track=el(),controls=el(),viewport=el(),previous=el(),next=el(),count=el(),slides=[el(),el(),el()];
 root.querySelector=s=>({'.carousel-track':track,'.carousel-footer':controls,'.carousel-viewport':viewport,'[data-previous]':previous,'[data-next]':next,'[data-slide-count]':count})[s];root.querySelectorAll=()=>slides;
 const toggle=el(),doc=el(),win=el(),media=el(),timers=new Map();let sequence=0,observe,mutate;
 root.dataset.auto=auto?'true':undefined;root.dataset.interval=String(interval);root.contains=target=>target===toggle;
 const query=root.querySelector;root.querySelector=s=>s==='[data-autoplay]'?toggle:query(s);
 media.matches=reduced;doc.hidden=false;doc.modal=false;doc.body={classList:{contains:()=>doc.modal}};doc.querySelectorAll=()=>[root];
 win.setTimeout=(f,ms)=>{assert.equal(ms,interval);timers.set(++sequence,f);return sequence;};
 const clearTimeout=id=>timers.delete(id);
 const IntersectionObserver=class{constructor(cb){observe=cb}observe(){}};
 const MutationObserver=class{constructor(cb){mutate=cb}observe(){}};
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/scripts/carousels.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,document:doc,window:win,matchMedia:()=>media,clearTimeout,IntersectionObserver,MutationObserver});exports.installCarousels();
 return {root,track,controls,viewport,previous,next,count,slides,toggle,doc,media,timers,
 visible(value){observe([{isIntersecting:value,intersectionRatio:value?1:0}])},
 tick(){const [id,fn]=timers.entries().next().value;timers.delete(id);fn()},
 modal(value){doc.modal=value;mutate()}};
}
test('arrows advance exactly one slide, announce the count and stop at each end',()=>{
 const f=fixture();assert.equal(f.previous.disabled,true);f.next.emit('click');assert.equal(f.track.style.transform,'translateX(-100%)');assert.equal(f.count.textContent,'02 / 03');assert.equal(f.slides[0].inert,true);assert.equal(f.slides[1].inert,false);
 f.next.emit('click');assert.equal(f.next.disabled,true);f.next.emit('click');assert.equal(f.count.textContent,'03 / 03');f.previous.emit('click');assert.equal(f.count.textContent,'02 / 03');
});
test('keyboard arrows, Home and End work without an automatic slideshow',()=>{
 const f=fixture();let prevented=false;const key=k=>f.root.emit('keydown',{key:k,preventDefault(){prevented=true}});
 key('End');assert.equal(f.count.textContent,'03 / 03');key('Home');assert.equal(f.count.textContent,'01 / 03');key('ArrowRight');assert.equal(f.count.textContent,'02 / 03');assert.ok(prevented);
});
test('horizontal swipes change slides; vertical gestures and cancellation do not',()=>{
 const f=fixture();const pointer=(x,y)=>({isPrimary:true,button:0,pointerId:1,clientX:x,clientY:y});
 f.viewport.emit('pointerdown',pointer(200,100));f.viewport.emit('pointerup',pointer(100,110));assert.equal(f.count.textContent,'02 / 03');assert.equal(f.viewport.capture,false);
 f.viewport.emit('pointerdown',pointer(200,100));f.viewport.emit('pointerup',pointer(140,250));assert.equal(f.count.textContent,'02 / 03');
 f.viewport.emit('pointerdown',pointer(200,100));f.viewport.emit('pointercancel');f.viewport.emit('pointerup',pointer(100,110));assert.equal(f.count.textContent,'02 / 03');
});

test('visible covers advance every three seconds, wrap, and stop outside the viewport',()=>{
 const f=fixture(true);assert.equal(f.timers.size,0);f.visible(true);assert.equal(f.timers.size,1);
 f.tick();assert.equal(f.count.textContent,'02 / 03');f.tick();f.tick();assert.equal(f.count.textContent,'01 / 03');
 f.visible(false);assert.equal(f.timers.size,0);f.visible(true);assert.equal(f.timers.size,1);
 f.modal(true);assert.equal(f.timers.size,0);f.modal(false);assert.equal(f.timers.size,1);
 f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.timers.size,0);
});
test('control hover, keyboard focus and manual navigation pause automatic covers; Resume restarts',()=>{
 const f=fixture(true);f.visible(true);f.controls.emit('mouseenter');assert.equal(f.timers.size,0);
 f.controls.emit('mouseleave');assert.equal(f.timers.size,1);f.root.emit('focusin');assert.equal(f.timers.size,0);
 f.root.emit('focusout',{relatedTarget:null});assert.equal(f.timers.size,1);
 f.next.emit('click');assert.equal(f.timers.size,0);assert.equal(f.toggle.attrs['aria-label'],'Resume slideshow');
 f.toggle.emit('click');assert.equal(f.timers.size,1);f.tick();assert.equal(f.count.textContent,'03 / 03');
 f.toggle.emit('click');assert.equal(f.timers.size,0);
});
test('reduced motion disables automatic changes while retaining manual navigation',()=>{
 const f=fixture(true,true);f.visible(true);assert.equal(f.timers.size,0);assert.equal(f.toggle.hidden,true);
 f.next.emit('click');assert.equal(f.count.textContent,'02 / 03');assert.equal(f.timers.size,0);
});

test('render slideshow uses a 2.5-second interval and can be paused for manual viewing',()=>{
 const f=fixture(true,false,2500);f.visible(true);f.tick();assert.equal(f.count.textContent,'02 / 03');
 f.toggle.emit('click');assert.equal(f.timers.size,0);f.next.emit('click');assert.equal(f.count.textContent,'03 / 03');assert.equal(f.timers.size,0);
 f.toggle.emit('click');f.tick();assert.equal(f.count.textContent,'01 / 03');
});


test('resting the pointer over a study photograph does not stop autoplay',()=>{
 const f=fixture(true);f.visible(true);f.root.emit('mouseenter');f.viewport.emit('mouseenter');
 assert.equal(f.timers.size,1);f.tick();assert.equal(f.count.textContent,'02 / 03');
 f.controls.emit('mouseenter');assert.equal(f.timers.size,0);
 f.controls.emit('mouseleave');assert.equal(f.timers.size,1);
});
test('repeated visibility and unrelated class notifications preserve the active countdown',()=>{
 const f=fixture(true);f.visible(true);const timer=[...f.timers.keys()][0];
 f.visible(true);f.modal(false);assert.equal([...f.timers.keys()][0],timer);
 f.tick();assert.equal(f.count.textContent,'02 / 03');assert.equal(f.timers.size,1);
});
