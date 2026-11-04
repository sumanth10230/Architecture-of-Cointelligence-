import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture({ reduced=false, saveData=false, blocked=false }={}) {
  const events=new Map(), observers=[], timers=new Map(); let timerId=0;
  const status={textContent:''};
  const control={hidden:true,textContent:'',setAttribute(){},addEventListener:(e,f)=>events.set('control:'+e,f)};
  const retry={hidden:true,textContent:'',addEventListener:(e,f)=>events.set('retry:'+e,f)};
  const notice={hidden:true,querySelector:s=>s==='button'?retry:status};
  const video={dataset:{desktop:'/desktop.mp4',mobile:'/mobile.mp4'},src:'',readyState:0,currentTime:4.2,paused:true,loads:0,plays:0,
    load(){this.loads++},pause(){this.paused=true},play(){this.plays++;if(blocked)return Promise.reject(new Error('blocked'));this.paused=false;return Promise.resolve()},
    addEventListener:(e,f)=>events.set('video:'+e,f)};
  const section={dataset:{},querySelector:s=>s==='video'?video:s==='.chapter-playback'?control:s==='.chapter-fallback'?notice:{}};
  const document={hidden:false,addEventListener:(e,f)=>events.set('document:'+e,f)};
  const motion={matches:reduced,addEventListener:(e,f)=>events.set('motion:'+e,f)};
  const context={document,navigator:{connection:{saveData}},matchMedia:q=>q.includes('reduced')?motion:{matches:false},
    window:{setTimeout:f=>{timers.set(++timerId,f);return timerId},addEventListener:(e,f)=>events.set('window:'+e,f)},
    clearTimeout:i=>timers.delete(i),IntersectionObserver:class{constructor(f){observers.push(f)}observe(){}disconnect(){}}};
  const source=fs.readFileSync(new URL('../src/scripts/loop-film.ts',import.meta.url),'utf8').replace('export function','function');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,context);
  const film=context.createLoopFilm(section);
  return {film,video,events,document,motion,section,notice,control,retry,timers,approach:()=>observers[0]([{isIntersecting:true}]),
    ready(){video.readyState=2;events.get('video:loadeddata')()},unblock(){blocked=false}};
}
const tick=async()=>{await Promise.resolve();await Promise.resolve()};
test('loop plays while active without seeking, pauses offscreen and in hidden tabs',async()=>{
  const f=fixture();f.approach();assert.equal(f.video.src,'/desktop.mp4');f.ready();assert.equal(f.video.paused,true);
  f.film.setActive(true);await tick();assert.equal(f.video.paused,false);assert.equal(f.video.loop,true);assert.equal(f.video.muted,true);
  assert.equal(f.video.currentTime,4.2);
  f.document.hidden=true;f.events.get('document:visibilitychange')();assert.equal(f.video.paused,true);
  f.document.hidden=false;f.events.get('document:visibilitychange')();await tick();assert.equal(f.video.paused,false);
  f.film.setActive(false);assert.equal(f.video.paused,true);assert.equal(f.video.currentTime,4.2);
});
test('user pause survives later scroll updates, with explicit resume',async()=>{
  const f=fixture();f.film.setActive(true);f.ready();await tick();
  f.events.get('control:click')();assert.equal(f.video.paused,true);
  f.film.setActive(false);f.film.setActive(true);await tick();assert.equal(f.video.paused,true);
  f.events.get('control:click')();await tick();assert.equal(f.video.paused,false);
});
test('blocked autoplay provides a user-gesture retry',async()=>{
  const f=fixture({blocked:true});f.film.setActive(true);f.ready();await tick();
  assert.equal(f.video.paused,true);assert.equal(f.notice.hidden,false);assert.equal(f.retry.hidden,false);
  f.unblock();f.events.get('retry:click')();await tick();assert.equal(f.video.paused,false);
});
test('Save-Data waits for consent and reduced motion never auto-loads',async()=>{
  const f=fixture({saveData:true});f.film.setActive(true);assert.equal(f.video.loads,0);assert.equal(f.notice.hidden,false);
  f.events.get('retry:click')();assert.equal(f.video.loads,1);f.ready();await tick();assert.equal(f.video.paused,false);
  const r=fixture({reduced:true});r.approach();r.film.setActive(true);assert.equal(r.video.loads,0);assert.equal(r.video.plays,0);
});
test('late playback resolution cannot restart video after leaving the sheet',async()=>{
  const f=fixture();f.film.setActive(true);f.ready();f.film.setActive(false);await tick();assert.equal(f.video.paused,true);
  f.events.get('video:error')();assert.equal(f.section.dataset.videoState,'fallback');assert.equal(f.notice.hidden,false);
});
