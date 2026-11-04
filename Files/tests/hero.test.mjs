import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real controller with a deterministic media/scroll environment.
// Browser playback quality still needs testing on the intended physical device.
function fixture({ reduced = false, saveData = false } = {}) {
  const events = new Map();
  const timers = new Map();
  const frames = new Map();
  let id = 0;
  let trigger;
  const status = { textContent: '' };
  const hint = { textContent: '' };
  const enable = { hidden: false, addEventListener: (name, fn) => events.set(`button:${name}`, fn) };
  const fallback = { hidden: true, querySelector: () => status };
  const video = { dataset: { mobile: '/mobile.mp4', desktop: '/hero.mp4' }, src: '', paused: true, duration: NaN, readyState: 0, currentTime: 0, seeking: false, pause() { this.paused = true; }, load() {}, play() { return Promise.resolve(); }, addEventListener: (name, fn) => events.set(name, fn) };
  const hero = { dataset: {}, classList: { add() {}, remove() {} }, querySelector: s => ({video, '.film-fallback':fallback,'.enable-film':enable,'.scrub-hint':hint,'.film-progress':status})[s] };
  const mq = { matches: reduced, addEventListener: (_name, fn) => events.set('motion', fn) };
  const timeline = { to() { return this; }, fromTo() { return this; }, kill() {}, scrollTrigger: { progress: 0, kill() {} } };
  const gsap = { registerPlugin() {}, set() {}, timeline(options) { trigger = options.scrollTrigger; return timeline; } };
  const context = { gsap, ScrollTrigger: { refresh() {} }, navigator:{connection:{saveData}}, document:{querySelector:()=>hero,hidden:false,addEventListener(){}}, HTMLMediaElement:{HAVE_CURRENT_DATA:2}, matchMedia:()=>({matches:false}), performance:{now:()=>100}, requestAnimationFrame:fn=>{frames.set(++id,fn);return id;}, cancelAnimationFrame:n=>frames.delete(n), clearTimeout:n=>timers.delete(n), window:{matchMedia:()=>mq,addEventListener(){},setTimeout:fn=>{timers.set(++id,fn);return id;}} };
  const source = fs.readFileSync(new URL('../src/scripts/hero.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm,'');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,context);
  return {video,hero,events,timers,status,enable,trigger:()=>trigger,flush:()=>{while(frames.size){const [key,fn]=frames.entries().next().value;frames.delete(key);fn();}},ready(){video.duration=6;video.readyState=2;events.get('loadedmetadata')();}};
}

test('metadata gates initialization; scroll controls forward and reverse time while paused',()=>{
 const f=fixture();assert.equal(f.trigger(),undefined);f.ready();f.flush();assert.ok(f.trigger());
 f.trigger().onUpdate({progress:.75});f.flush();assert.ok(Math.abs(f.video.currentTime-4.47)<.001);assert.equal(f.video.paused,true);
 f.events.get('seeked')();f.trigger().onUpdate({progress:.25});f.flush();assert.ok(Math.abs(f.video.currentTime-1.49)<.001);
});
test('seeking retains the newest target and never queues obsolete seeks',()=>{
 const f=fixture();f.ready();f.flush();f.video.seeking=true;
 f.trigger().onUpdate({progress:.9});f.trigger().onUpdate({progress:.2});f.flush();assert.equal(f.video.currentTime,0);
 f.video.seeking=false;f.events.get('seeked')();f.flush();assert.ok(Math.abs(f.video.currentTime-1.192)<.001);
});
test('reduced motion does not load video or create a scroll timeline',()=>{
 const f=fixture({reduced:true});assert.equal(f.video.src,'');assert.equal(f.trigger(),undefined);assert.equal(f.hero.dataset.state,'fallback');assert.equal(f.enable.hidden,true);
});
test('save data defers film loading until an explicit opt-in',()=>{
 const f=fixture({saveData:true});assert.equal(f.video.src,'');assert.equal(f.hero.dataset.state,'fallback');f.events.get('button:click')();assert.equal(f.video.src,'/hero.mp4');
});
test('media failures leave a still-image experience',()=>{
 const f=fixture();f.events.get('error')();assert.equal(f.hero.dataset.state,'fallback');assert.match(f.status.textContent,/Film unavailable/);
});
test('loading timeout leaves the rest of the portfolio accessible',()=>{
 const f=fixture();[...f.timers.values()][0]();assert.equal(f.hero.dataset.state,'fallback');assert.match(f.status.textContent,/longer to load/);
});

// Regression: canceling a queued frame must also release the pending-frame ID.
test('film retry recovers after a pending seek was cancelled by fallback',()=>{
 const f=fixture();f.ready();f.flush();f.trigger().onUpdate({progress:.8});
 f.events.get('error')();f.events.get('button:click')();f.ready();f.flush();
 f.trigger().onUpdate({progress:.4});f.flush();assert.ok(Math.abs(f.video.currentTime-2.384)<.001);
});
