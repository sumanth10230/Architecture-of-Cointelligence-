import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,globals={}){
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,...globals});return exports;
}
test('new taxonomy stages retain full loop films and each gets 350vh of scroll travel',()=>{
 const {chapters}=load('data/chapters.ts');
 for(const [id,overlay] of [['chapter-04','species'],['chapter-05','masterplan']]){
  const chapter=chapters.find(c=>c.id===id);assert.equal(chapter.overlay,overlay);assert.equal(chapter.scrollVh,350);assert.equal(chapter.kind,'loop');
 }
});
test('workflow artwork is available as transparent PNGs and editable vector masters',()=>{
 const {workflows}=load('data/workflows.ts');
 for(const [kind,workflow] of Object.entries(workflows)){
  const png=fs.readFileSync(new URL(`../public/images/workflows/${kind}.png`,import.meta.url));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),workflow.width*2);
  assert.equal(png.readUInt32BE(20),workflow.height*2);
  assert.equal(png[25],6,'RGBA export preserves transparency');
  const svg=fs.readFileSync(new URL(`../public/images/workflows/${kind}.svg`,import.meta.url),'utf8');
  assert.ok(svg.includes('marker-end='));assert.ok(svg.includes('Train'));assert.ok(svg.includes('Query'));
 }
});

test('cursor bubble follows the pointer and stays within viewport edges',()=>{
 const {bubblePosition}=load('scripts/model-hotspots.ts');
 const center=bubblePosition(500,500,230,1200,800);
 assert.equal(center.left,385);assert.equal(center.top,252);
 for(const [x,y] of [[0,0],[1200,800],[600,1]]){
  const p=bubblePosition(x,y,230,1200,800);
  assert.ok(p.left>=12 && p.left+230<=1188);assert.ok(p.top>=12 && p.top+230<=788);
 }
});

test('model hotspots follow photo phases and disappear during PNG studies, dips and chapter exits',()=>{
 const {modelPhase}=load('scripts/model-hotspots.ts');
 for(const p of [0,.09,.28,.5,.64,.7,.91,1])assert.equal(modelPhase(p),null);
 assert.equal(modelPhase(.16),'first');assert.equal(modelPhase(.8),'detail');
 // Reverse scroll restores exactly the appropriate model's description.
 assert.equal(modelPhase(.4),null);assert.equal(modelPhase(.2),'first');
});
test('touch toggles descriptions; leaving the model or changing phase clears them',()=>{
 const document={activeElement:null};
 const {installModelHotspots}=load('scripts/model-hotspots.ts',{document,window:{innerWidth:1200,innerHeight:800}});
 const spot=model=>({dataset:{model},hidden:true,attrs:{},events:{},style:{setProperty(){}},getBoundingClientRect(){return {left:300,top:300,width:500,height:300}},querySelector(){return {offsetWidth:230}},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(k,f){this.events[k]=f;},blur(){document.activeElement=null;this.events.blur();}});
 const first=spot('first'),detail=spot('detail');const update=installModelHotspots({querySelectorAll:()=>[first,detail]});
 update(.2);assert.equal(first.hidden,false);assert.equal(detail.hidden,true);
 first.events.pointermove({pointerType:'mouse',clientX:500,clientY:450});assert.equal(first.attrs['aria-expanded'],'true');
 first.events.pointerleave();assert.equal(first.attrs['aria-expanded'],'false');
 first.events.pointerdown({pointerType:'touch'});first.events.click();assert.equal(first.attrs['aria-expanded'],'true');first.events.click();assert.equal(first.attrs['aria-expanded'],'false');first.events.click();document.activeElement=first;update(.5);assert.equal(first.hidden,true);assert.equal(first.attrs['aria-expanded'],'false');assert.equal(document.activeElement,null);
 update(.8);detail.events.click();detail.events.keydown({key:'Escape'});assert.equal(detail.attrs['aria-expanded'],'false');
 update(0,true);assert.equal(first.hidden,false);assert.equal(detail.hidden,false);
});
