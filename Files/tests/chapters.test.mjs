import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function fixture({ reduced = false, globe = false, loop = false, study = false, workflow = false } = {}) {
  const events = new Map(), frames = new Map(), timers = new Map();
  let id = 0, trigger, approach; const loopActive=[], tweens=[], pairs=[{},{},{},{}], shade={}, biomeShade={}, biomeStudies={}, detail={}, dip={}, workflowShade={}, workflowStudies={};
  const status = { textContent: '' };
  const button = { hidden: false, addEventListener: (n, f) => events.set('button:' + n, f) };
  const notice = { hidden: true, querySelector: s => s === 'button' ? button : status };
  const video = { dataset: { desktop: globe ? '' : '/film.mp4' }, duration: NaN, readyState: 0, currentTime: 0, seeking: false, paused: true, src: '', pause() { this.paused = true; }, load() {}, addEventListener: (n, f) => events.set(n, f) };
  const section = { dataset: { duration: '3', kind: loop ? 'loop' : study ? 'study' : undefined }, classList: { toggle() {} }, querySelector: s => s === 'video' ? video : s === '.chapter-fallback' ? notice : s === '.chapter-drawing' ? null : s === '.study-detail' ? detail : s === '.study-dip' ? dip : s === '.study-shade' ? shade : s === '.biome-shade' ? biomeShade : s === '.biome-studies' ? biomeStudies : s === '.workflow-shade' ? (workflow ? workflowShade : null) : s === '.workflow-studies' ? (workflow ? workflowStudies : null) : {}, querySelectorAll: () => pairs };
  const timeline = { fromTo(target,from,to,at) { tweens.push({target,from,to,at});return this; }, to(target,to,at) { tweens.push({target,to,at});return this; }, set(target,to,at) { tweens.push({target,to,at});return this; }, kill() {}, scrollTrigger: { kill() {} } };
  const context = { installModelHotspots: () => () => {}, createLoopFilm: () => ({setActive(value){loopActive.push(value)}}),
    gsap: { registerPlugin() {}, set() {}, timeline(o) { trigger = o.scrollTrigger; return timeline; } },
    ScrollTrigger: { refresh() {} }, matchMedia: () => ({ matches: reduced, addEventListener() {} }), navigator: {},
    document: { hidden: false, addEventListener() {}, querySelectorAll: () => [section] },
    window: { addEventListener() {}, setTimeout: f => { timers.set(++id, f); return id; } },
    performance: { now: () => 100 }, clearTimeout: n => timers.delete(n),
    requestAnimationFrame: f => { frames.set(++id, f); return id; }, cancelAnimationFrame: n => frames.delete(n),
    IntersectionObserver: class { constructor(f) { approach = f; } observe() {} unobserve() {} },
  };
  const code = fs.readFileSync(new URL('../src/scripts/chapters.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText, context);
  const flush = () => { while (frames.size) { const [n, f] = frames.entries().next().value; frames.delete(n); f(); } };
  return { video, events, section, notice, loopActive, tweens, pairs, shade, biomeShade, biomeStudies, detail, dip, workflowShade, workflowStudies, trigger: () => trigger, approach: () => approach([{ isIntersecting: true }]), flush, ready() { video.readyState = 2; video.duration = 3; events.get('loadedmetadata')(); flush(); } };
}

test('film loads on approach; metadata and decoded data gate seeks', () => {
  const f = fixture(); assert.equal(f.video.src, ''); f.approach(); assert.equal(f.video.src, '/film.mp4');
  f.trigger().onUpdate({ progress: .46 }); f.flush(); assert.equal(f.video.currentTime, 0);
  f.ready(); assert.ok(Math.abs(f.video.currentTime - 1.48) < .001); assert.equal(f.video.paused, true);
});
test('three-second film holds its last frame before fading and reverses with scroll', () => {
  const f = fixture(); f.ready(); f.trigger().onUpdate({ progress: .85 }); f.flush(); assert.equal(f.video.currentTime, 2.96);
  f.trigger().onUpdate({ progress: .29 }); f.flush(); assert.ok(Math.abs(f.video.currentTime - .74) < .001);
  f.trigger().onUpdate({ progress: .05 }); f.flush(); assert.equal(f.video.currentTime, 0);
});
test('rapid scroll during a seek resolves to the latest target', () => {
  const f = fixture(); f.ready(); f.video.seeking = true;
  f.trigger().onUpdate({ progress: .8 }); f.trigger().onUpdate({ progress: .29 }); f.flush(); assert.equal(f.video.currentTime, 0);
  f.video.seeking = false; f.events.get('seeked')(); f.flush(); assert.ok(Math.abs(f.video.currentTime - .74) < .001);
});
test('globe sheet has transitions but never requests a video', () => {
  const f = fixture({ globe: true }); f.approach(); assert.equal(f.video.src, ''); assert.ok(f.trigger());
});
test('reduced motion skips the extended film timeline and network request', () => {
  const f = fixture({ reduced: true }); f.approach(); assert.equal(f.video.src, ''); assert.equal(f.trigger(), undefined);
});
test('media failure exposes the poster fallback and retry', () => {
  const f = fixture(); f.ready(); f.events.get('error')(); assert.equal(f.section.dataset.videoState, 'fallback'); assert.equal(f.notice.hidden, false);
});

test('loop chapter never gets scrubbed by the generic film controller', () => {
 const f=fixture({loop:true});f.video.currentTime=1.23;f.ready();f.trigger().onUpdate({progress:.5});f.flush();
 assert.equal(f.video.currentTime,1.23);assert.equal(f.loopActive.at(-1),true);
 f.trigger().onUpdate({progress:1});assert.equal(f.loopActive.at(-1),false);
});
test('study first shows the photograph, then darkens and reveals four pairs reversibly', () => {
 const f=fixture({study:true,globe:true});
 const shade=f.tweens.find(t=>t.target===f.shade);assert.equal(shade.from.opacity,0);assert.equal(shade.to.opacity,.76);
 const pairs=f.tweens.filter(t=>f.pairs.includes(t.target));assert.equal(pairs.length,4);
 for(const pair of pairs){assert.ok(pair.at>shade.at);assert.equal(pair.from.autoAlpha,0);assert.equal(pair.to.autoAlpha,1);assert.ok(pair.at+pair.to.duration<.8)}
 assert.equal(f.trigger().scrub,true);
});


test('loop study waits for the second stage and dark dip before revealing the reference panel', () => {
 const f=fixture({loop:true});
 const shade=f.tweens.find(t=>t.target===f.biomeShade);
 const panel=f.tweens.find(t=>t.target===f.biomeStudies);
 assert.equal(shade.from.opacity,0);assert.equal(shade.to.opacity,.92);
 assert.ok(shade.at>=.3);assert.ok(panel.at>=shade.at+shade.to.duration);
 assert.equal(panel.from.autoAlpha,0);assert.equal(panel.to.autoAlpha,1);
 assert.ok(panel.at+panel.to.duration<.8);assert.equal(f.trigger().scrub,true);
 f.video.currentTime=7.2;f.trigger().onUpdate({progress:.7});f.flush();
 assert.equal(f.video.currentTime,7.2);assert.equal(f.loopActive.at(-1),true);
 f.trigger().onUpdate({progress:.15});f.flush();assert.equal(f.video.currentTime,7.2);
});


test('chapter fades share full black at the boundary and study reveals have a reading hold', () => {
 const f=fixture({study:true,globe:true});
 const entrance=f.tweens.find(t=>t.from?.opacity===1 && t.to.opacity===0);
 const exit=f.tweens.find(t=>t.target===entrance.target && !t.from);
 assert.equal(entrance.at,0);assert.equal(exit.to.opacity,1);
 assert.ok(Math.abs(exit.at+exit.to.duration-1)<.0001);
 assert.equal(entrance.to.ease,'sine.inOut');assert.equal(exit.to.ease,'sine.inOut');
 const complete=Math.max(...f.tweens.filter(t=>f.pairs.includes(t.target)).map(t=>t.at+t.to.duration));
 assert.ok(exit.at-complete>=.2, 'all four pairs stay visible for at least a fifth of the passage');
});


test('architectural system swaps to the third image only at full black, preserving shared copy', () => {
 const f=fixture({study:true,globe:true});
 const dip=f.tweens.filter(t=>t.target===f.dip);
 assert.equal(dip.length,2);assert.equal(dip[0].to.opacity,1);assert.equal(dip[1].to.opacity,0);
 const image=f.tweens.find(t=>t.target===f.detail);
 assert.equal(image.to.autoAlpha,1);assert.ok(image.at>=dip[0].at+dip[0].to.duration-.0001);
 assert.ok(dip[1].at>=image.at);
 const exit=f.tweens.find(t=>!t.from && t.to.opacity===1 && t.target!==f.dip);
 assert.ok(exit.at-(dip[1].at+dip[1].to.duration)>.15);
});


test('taxonomy diagram follows the darkening stage and preserves independent video playback', () => {
 const f=fixture({loop:true,workflow:true});
 const shade=f.tweens.find(t=>t.target===f.workflowShade),diagram=f.tweens.find(t=>t.target===f.workflowStudies);
 assert.equal(shade.to.opacity,.94);assert.ok(diagram.at>=shade.at+shade.to.duration-.0001);
 assert.equal(diagram.from.autoAlpha,0);assert.equal(diagram.to.autoAlpha,1);
 assert.ok(.8-(diagram.at+diagram.to.duration)>=.19,'diagram has a reading hold before exit');
 f.video.currentTime=4.2;f.trigger().onUpdate({progress:.72});f.flush();assert.equal(f.video.currentTime,4.2);
 f.trigger().onUpdate({progress:.2});f.flush();assert.equal(f.video.currentTime,4.2);
});
