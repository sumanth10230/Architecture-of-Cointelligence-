import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function fixture() {
  let top = 500, reduced = false, staticHero = false;
  const classes = new Set(), stage = {};
  const section = {
    classList: { toggle(name, value) { value ? classes.add(name) : classes.delete(name); } },
    previousElementSibling: { classList: { contains() { return staticHero; } } },
    querySelector() { return stage; }, getBoundingClientRect() { return { top }; },
  };
  const exports = {}, events = {}, media = { get matches() { return reduced; }, addEventListener(name, fn) { events['media:' + name] = fn; } };
  const source = fs.readFileSync(new URL('../src/scripts/scene-transitions.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, {
    exports, matchMedia: () => media,
    document: { querySelectorAll: () => [section], querySelector: () => null },
    window: { addEventListener(name, fn) { events[name] = fn; } },
  });
  exports.installSceneGates();
  return { classes, stage, events, at(value) { top=value; exports.syncSceneGates(); }, reduce(value) { reduced=value; events['media:change'](); }, fallback() { staticHero=true; exports.syncSceneGates(); } };
}

test('incoming chapter cannot paint or capture focus while sliding into the viewport', () => {
  const f=fixture();
  assert.ok(f.classes.has('has-scene-gate'));assert.ok(f.classes.has('scene-waiting'));assert.equal(f.stage.inert,true);
  f.at(.1);assert.ok(f.classes.has('scene-waiting'));
  f.at(0);assert.equal(f.classes.has('scene-waiting'),false);assert.equal(f.stage.inert,false);
});

test('forward jumps, restored scroll and reverse boundary crossings restore the correct scene', () => {
  const f=fixture();f.at(-4000);assert.equal(f.stage.inert,false);
  f.events.pageshow();assert.equal(f.stage.inert,false);
  f.at(-1);assert.equal(f.stage.inert,false);
  f.at(1);assert.equal(f.stage.inert,true);
  f.events.resize();assert.equal(f.stage.inert,true);
  f.at(0);assert.equal(f.stage.inert,false);
});

test('reduced motion and a static hero retain ordinary accessible document flow', () => {
  const f=fixture();f.reduce(true);assert.equal(f.stage.inert,false);assert.equal(f.classes.has('has-scene-gate'),false);
  f.reduce(false);assert.equal(f.stage.inert,true);
  f.fallback();assert.equal(f.stage.inert,false);assert.equal(f.classes.has('scene-waiting'),false);
});
