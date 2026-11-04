import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/scripts/globe-layer-state.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
const context={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,context);
const {toggledLayer,blendLayers,layersSettled}=context;
test('each optional layer replaces the active one and unchecking restores species',()=>{
 let selected=toggledLayer('species','land'); assert.equal(selected,'land');
 selected=toggledLayer(selected,'climate'); assert.equal(selected,'climate');
 selected=toggledLayer(selected,'climate'); assert.equal(selected,'species');
 assert.equal(toggledLayer('land','land'),'species');
});
test('crossfade remains continuous when interrupted or reversed',()=>{
 const first=blendLayers([1,0,0],'land',.05);
 assert.ok(first[0]>0 && first[0]<1 && first[1]>0);
 const second=blendLayers(first,'climate',.016);
 assert.ok(second[0]>0 && second[1]>0 && second[2]>0);
 assert.ok(Math.abs(second.reduce((a,b)=>a+b,0)-1)<1e-10);
 const back=blendLayers(second,'species',.016);
 assert.ok(back[0]>second[0]); assert.ok(Math.abs(back[0]-second[0])<.1);
});
test('a paused globe can finish its crossfade and stop scheduling frames',()=>{
 let weights=[1,0,0]; assert.equal(layersSettled(weights,'land'),false);
 for(let frame=0;frame<180;frame++) weights=blendLayers(weights,'land',1/60);
 assert.equal(layersSettled(weights,'land'),true); assert.deepEqual([...weights],[0,1,0]);
});
test('reduced motion switches immediately, and elapsed time is frame-rate independent',()=>{
 assert.deepEqual([...blendLayers([.5,.5,0],'climate',0,true)],[0,0,1]);
 const one=blendLayers([1,0,0],'land',.1);
 let many=[1,0,0];for(let i=0;i<10;i++)many=blendLayers(many,'land',.01);
 assert.ok(one.every((v,i)=>Math.abs(v-many[i])<1e-10));
});
