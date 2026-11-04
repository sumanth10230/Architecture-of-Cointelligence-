import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compiled=file=>ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const data={};vm.runInNewContext(compiled('../src/data/methodology.ts'),{exports:data});
const api={};vm.runInNewContext(compiled('../src/scripts/diagram-layout.ts'),{exports:api,require:()=>data});

test('more evident drift remains bounded to thirty design units',()=>{
 const layout=api.createDiagramLayout();
 for(let time=0;time<240;time+=5){
  const frame=layout.sample(time);
  for(const n of data.methodologyNodes){const p=frame.points.get(n.id);assert.ok(Math.hypot(p.x-n.x,p.y-n.y)<30);}
  assert.ok(frame.routes.every(r=>!r.d.includes('NaN')));
 }
});
test('dragged data point stays placed and connected to the original directed destination',()=>{
 const layout=api.createDiagramLayout();layout.move('climate',{x:220,y:150});
 const a=layout.sample(20),b=layout.sample(100);
 assert.equal(a.points.get('climate').x,220);assert.equal(b.points.get('climate').x,220);
 const edge=b.routes.find(r=>r.from==='climate');assert.equal(edge.to,'prediction');assert.match(edge.d,/ L/);
 const target=b.points.get('prediction');assert.ok(Math.hypot(edge.end.x-target.x,edge.end.y-target.y)<23);
});
test('background domains and taxonomy centres move together; reset restores layout',()=>{
 const layout=api.createDiagramLayout();const initial=layout.sample(0,true);
 layout.move('domain:species',{x:550,y:400});const moved=layout.sample(0,true);
 assert.equal(moved.points.get('domain:species').x,550);
 assert.equal(moved.points.get('species-taxonomy').x,550);
 layout.move('species-taxonomy',{x:410,y:240});
 assert.deepEqual(layout.sample(80).points.get('domain:species'),layout.sample(80).points.get('species-taxonomy'));
 assert.notEqual(moved.points.get('species-taxonomy').x,initial.points.get('species-taxonomy').x);
 layout.reset();assert.equal(layout.sample(0,true).points.get('domain:species').x,330);
});
test('reduced motion freezes drift, clamps dragging and handles overlapping nodes without flipped arrows',()=>{
 const layout=api.createDiagramLayout();assert.deepEqual(layout.sample(0,true),layout.sample(90,true));
 layout.move('climate',{x:-1000,y:5000});const p=layout.sample(0,true).points.get('climate');assert.equal(p.x,76);assert.equal(p.y,824);
 layout.move('climate',{x:120,y:230});const edge=layout.sample(0,true).routes.find(r=>r.from==='climate');assert.equal(edge.d,'');
});

test('viewport bounds allow dragging outside the initial diagram square without breaking edges',()=>{
 const layout=api.createDiagramLayout();layout.move('climate',{x:-220,y:430},{left:-300,right:950,top:0,bottom:900});
 const frame=layout.sample(30);assert.equal(frame.points.get('climate').x,-220);assert.ok(frame.routes.every(r=>!r.d.includes('NaN')));
});
