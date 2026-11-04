import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/scripts/card-motion.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { cardDefinition, sampleCard, virtualTime, CARD_COUNT, CAMERA_Z, CARD_WIDTH, CARD_HEIGHT, gridLayout, connectionPairs, networkOpacity, pulseProgress, cardPhase, sampleBackground, backgroundCount, backgroundPairs } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const archive = JSON.parse(fs.readFileSync(new URL('../src/data/botanical-cards.json', import.meta.url), 'utf8'));
const cards = archive.slice(0, CARD_COUNT);

test('80 actual images animate in two groups of 40; all 88 remain in the archive', () => {
  assert.equal(CARD_COUNT, 80); assert.equal(cards.length, 80); assert.equal(archive.length, 88);
  assert.equal(new Set(cards.map(c => c.id)).size, 80);
  assert.equal(new Set(cards.map(c => c.image)).size, 80);
  assert.deepEqual([0, 1].map(layer => cards.filter((_, i) => cardDefinition(i).layer === layer).length), [40, 40]);
  for (const card of archive) {
    assert.ok(fs.existsSync(new URL('../public' + card.image, import.meta.url)));
    assert.ok(fs.existsSync(new URL('../public' + card.mobileImage, import.meta.url)));
    assert.ok(Math.abs(card.aspect - 7/6) < 1e-7);
  }
});
test('initial layer is a flat, evenly spaced grid and rear layer starts hidden', () => {
  const front = Array.from({ length: 40 }, (_, i) => sampleCard(i, 0));
  assert.equal(new Set(front.map(c => c.x)).size, 8);
  assert.equal(new Set(front.map(c => c.y)).size, 5);
  assert.equal(new Set(front.map(c => c.z)).size, 1);
  for (let i = 0; i < 40; i++) {
    assert.deepEqual(sampleCard(i, 0), sampleCard(i, 1));
    assert.equal(sampleCard(i + 40, 0).opacity, 0);
    assert.equal(sampleCard(i, 0).x, sampleCard(i+40, 0).x);
    assert.equal(sampleCard(i, 0).y, sampleCard(i+40, 0).y);
  }
});
test('every card moves monotonically along Z with invariant X/Y and distinct depths', () => {
  assert.equal(new Set(Array.from({ length: 40 }, (_, i) => sampleCard(i, 2).z)).size, 40);
  for (let i = 0; i < 80; i++) {
    let previous = sampleCard(i, 0);
    for (let step = 1; step <= 120; step++) {
      const next = sampleCard(i, step/20);
      assert.equal(next.x, previous.x); assert.equal(next.y, previous.y);
      assert.ok(next.z >= previous.z); assert.ok(next.opacity >= 0 && next.opacity <= 1);
      previous = next;
    }
  }
});
test('front layer passes first; rear layer remains visible for the second passage', () => {
  for (let i = 0; i < 40; i++) {
    assert.ok(sampleCard(i, 3).z > CAMERA_Z);
    assert.ok(sampleCard(i + 40, 3).z < CAMERA_Z);
    assert.equal(sampleCard(i + 40, 3).opacity, 1);
    assert.ok(sampleCard(i + 40, 6).z > CAMERA_Z);
    assert.equal(sampleCard(i + 40, 6).opacity, 0);
  }
});
test('reverse scrubbing restores exact earlier frames, with a stable final hold', () => {
  const baseline = cards.map((_, i) => sampleCard(i, 1.75));
  for (const time of [5, 2, 0, 6, 4, 1.75]) cards.forEach((_, i) => sampleCard(i, time));
  assert.deepEqual(cards.map((_, i) => sampleCard(i, 1.75)), baseline);
  for (let i = 0; i < 80; i++) assert.deepEqual(sampleCard(i, 5.8), sampleCard(i, 6));
});

test('complete responsive grids cover the viewport in both directions', () => {
  for (const aspect of [16/9, 4/3, 1, 390/844, 844/390, 2560/1080]) {
    const layout = gridLayout(aspect);
    assert.equal(layout.columns * layout.rows, 40);
    const front = Array.from({ length: 40 }, (_, i) => sampleCard(i, 0, layout));
    assert.equal(new Set(front.map(c => `${c.x},${c.y}`)).size, 40);
    const xCoverage = (Math.max(...front.map(c => c.x)) + CARD_WIDTH / 2) / (layout.viewHeight * aspect / 2);
    const yCoverage = (Math.max(...front.map(c => c.y)) + CARD_HEIGHT / 2) / (layout.viewHeight / 2);
    assert.ok(xCoverage > .9 && xCoverage <= 1, `${aspect}: horizontal coverage ${xCoverage}`);
    assert.ok(yCoverage > .9 && yCoverage <= 1, `${aspect}: vertical coverage ${yCoverage}`);
  }
  assert.equal(gridLayout(390/844).columns, 4);
  assert.equal(gridLayout(16/9).columns, 8);
});
test('rear layer is already distributed across sixteen depth units when revealed', () => {
  for (const t of [0, 1.5, 2, 3, 4]) {
    const depths = Array.from({ length: 40 }, (_, i) => sampleCard(i+40, t).z);
    assert.equal(new Set(depths).size, 40);
    assert.ok(Math.abs(Math.max(...depths) - Math.min(...depths) - 16) < 1e-9);
  }
});
test('connections cover all nodes without duplicates and appear only after depth begins', () => {
  for (const aspect of [16/9, 390/844]) {
    const pairs = connectionPairs(gridLayout(aspect));
    assert.equal(new Set(pairs.flat()).size, 80);
    assert.equal(new Set(pairs.map(pair => [...pair].sort((a,b)=>a-b).join(':'))).size, pairs.length);
    for (const [a,b] of pairs) assert.ok(a !== b && a >= 0 && b >= 0 && a < 80 && b < 80);
    assert.ok(pairs.some(([a,b]) => a < 40 && b >= 40));
  }
  assert.equal(networkOpacity(0), 0); assert.equal(networkOpacity(1), 0);
  assert.ok(networkOpacity(1.5) > 0); assert.equal(networkOpacity(2), 1);
});
test('data packets advance along each wire and precisely reverse with virtual time', () => {
  for (let edge = 0; edge < 200; edge++) {
    const before = pulseProgress(edge, 2.2);
    assert.ok(before >= 0 && before < 1);
    const after = pulseProgress(edge, 2.25);
    assert.ok(Math.abs(((after-before+1)%1) - .035) < 1e-12);
    pulseProgress(edge, 5);
    assert.equal(pulseProgress(edge, 2.2), before);
  }
});
test('entrance and exit are outside the three-second virtual timeline', () => {
  assert.equal(virtualTime(0), 0); assert.equal(virtualTime(.1), 0);
  assert.ok(Math.abs(virtualTime(.52) - 1.5) < 1e-12); assert.equal(virtualTime(.94), 3);
  assert.equal(virtualTime(1), 3); assert.equal(virtualTime(-1), 0);
});

test('background stays genuinely distant with fixed sizes, small projected cards and no flat reveal', () => {
  for (const compact of [false, true]) {
    const count = backgroundCount(compact);
    assert.equal(count, compact ? 80 : 160);
    const layout = gridLayout(compact ? 390/844 : 16/9);
    const images = new Set();
    for (let i = 0; i < count; i++) {
      const initial = sampleBackground(i, 0, layout, compact);
      images.add(initial.image);
      assert.equal(initial.opacity, 0);
      for (const time of [1.5, 2, 3, 4, 5, 5.75, 6]) {
        const state = sampleBackground(i, time, layout, compact);
        assert.equal(state.x, initial.x); assert.equal(state.y, initial.y);
        assert.equal(state.scale, initial.scale);
        assert.ok(CAMERA_Z-state.z > 59, 'background cannot approach the foreground camera');
        assert.ok(state.scale * CAMERA_Z / (CAMERA_Z-state.z) < 1, 'smaller than the initial grid cards');
        assert.ok(state.opacity >= 0 && state.opacity <= 1);
        assert.ok(state.image >= 0 && state.image < 88);
      }
      assert.equal(sampleBackground(i, 6, layout, compact).opacity, 0);
      const baseline = sampleBackground(i, 2.7, layout, compact);
      sampleBackground(i, 5, layout, compact);
      assert.deepEqual(sampleBackground(i, 2.7, layout, compact), baseline);
    }
    assert.equal(images.size, Math.min(count,88));
  }
});

test('background repeats connected forty-plus-forty webs, including cross-depth edges', () => {
  for (const compact of [false,true]) {
    const count=backgroundCount(compact), layout=gridLayout(compact ? 390/844 : 16/9);
    const pairs=backgroundPairs(count,layout,compact), foreground=connectionPairs(layout);
    const edges=new Set(pairs.map(([a,b])=>`${a}:${b}`));
    assert.equal(edges.size,pairs.length);
    assert.equal(new Set(pairs.flat()).size,count);
    for(let replica=0;replica<count/80;replica++) {
      const offset=80+replica*80;
      for(const [a,b] of foreground) assert.ok(edges.has(`${offset+a}:${offset+b}`));
    }
    for(const [a,b] of pairs) assert.ok(a>=80 && b>=80 && a<count+80 && b<count+80 && a!==b);
    // A branched volume, not chains limited to two connections per node.
    assert.ok(pairs.filter(([a,b])=>a===105 || b===105).length>2);
  }
});

test('three seconds traverses the complete original foreground choreography', () => {
  assert.equal(cardPhase(0),0); assert.equal(cardPhase(1.5),3); assert.equal(cardPhase(3),6);
  assert.equal(cardPhase(10),6); assert.equal(cardPhase(-1),0);
  for(let i=0;i<80;i++) assert.equal(sampleCard(i,cardPhase(3)).opacity,0);
});
