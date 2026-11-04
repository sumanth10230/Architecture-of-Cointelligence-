import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/scripts/globe-labels.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { spherePoint, placeLabel } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const evidence = JSON.parse(fs.readFileSync(new URL('../src/data/conservation.json', import.meta.url), 'utf8'));

test('continent pins use the globe texture coordinates and lie on its surface', () => {
  const zero = spherePoint(0,0), east = spherePoint(90,0), north = spherePoint(0,90);
  assert.ok(Math.abs(zero[0]-1)<1e-9);
  assert.ok(Math.abs(east[2]+1)<1e-9);
  assert.ok(Math.abs(north[1]-1)<1e-9);
  assert.equal(evidence.regions.length,7);
  for (const region of evidence.regions) {
    assert.ok(Math.abs(Math.hypot(...spherePoint(region.lon,region.lat))-1)<1e-9);
    assert.ok(region.date && region.scope && region.source && region.detail);
    assert.equal(new URL(region.url).protocol,'https:');
  }
});
test('pin boxes stay inside desktop/phone bounds without overlapping', () => {
  for (const [width,height,labelWidth,labelHeight] of [[950,800,148,120],[390,360,126,112],[320,190,126,112]]) {
    const occupied=[];
    for (const [x,y] of [[0,0],[width,0],[width/2,height/2],[width/2,height/2],[width,height],[0,height]]) {
      const box=placeLabel(x,y,width,height,labelWidth,labelHeight,occupied);
      if (!box) continue;
      assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=width && box.y+box.height<=height);
      assert.ok(!occupied.some(other => box.x < other.x+other.width && box.x+box.width>other.x && box.y<other.y+other.height && box.y+box.height>other.y));
      occupied.push(box);
    }
    assert.ok(occupied.length>=2);
  }
  assert.equal(placeLabel(0,0,40,40,126,112,[]),null);
});
