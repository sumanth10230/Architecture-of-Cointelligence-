import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile=f=>ts.transpileModule(fs.readFileSync(new URL(f,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const data={};vm.runInNewContext(compile('../src/data/methodology.ts'),{exports:data});
const layout={};vm.runInNewContext(compile('../src/scripts/diagram-layout.ts'),{exports:layout,require:()=>data});
function fixture(){
 const element=()=>({dataset:{},style:{},events:{},attrs:{},classList:{add(){},remove(){}},captured:false,
  addEventListener(k,f){(this.events[k]??=[]).push(f)},emit(k,e={}){for(const f of this.events[k]||[])f(e)},
  setAttribute(k,v){this.attrs[k]=v},setPointerCapture(){this.captured=true},hasPointerCapture(){return this.captured},releasePointerCapture(){this.captured=false}});
 const board=element(),scene=element(),chapter=element(),pause=element(),reset=element();
 board.getBoundingClientRect=()=>({left:0,top:0,width:900,height:900});
 const nodes=data.methodologyNodes.map(n=>Object.assign(element(),{dataset:{node:n.id}}));
 const domains=data.methodologyDomains.map(d=>Object.assign(element(),{dataset:{domain:d.id}}));
 const edges=data.methodologyEdges.map(()=>element());
 scene.querySelector=s=>({'.methodology-board':board,'.methodology-motion':pause,'.methodology-reset':reset})[s];
 scene.querySelectorAll=s=>({'[data-node]':nodes,'[data-domain]':domains,'[data-halo]':[],'.methodology-edge':edges})[s];
 scene.closest=()=>chapter;
 const exports={},frames=new Map();let id=0,observer;
 vm.runInNewContext(compile('../src/scripts/diagram-interaction.ts'),{exports,require:()=>layout,innerWidth:1400,innerHeight:1000,
  matchMedia:()=>({matches:false,addEventListener(){}}),document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},
  requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:i=>frames.delete(i),
  IntersectionObserver:class{constructor(f){observer=f}observe(){}},
 });
 exports.installDiagramInteraction(scene);
 const pointer=(x,y)=>({button:0,isPrimary:true,pointerId:1,clientX:x,clientY:y});
 return {nodes,domains,edges,pause,reset,frames,pointer,visible(value){observer([{isIntersecting:value}])}};
}
test('dragging a taxonomy updates connectors without activating its chapter link',()=>{
 const f=fixture(),node=f.nodes.find(n=>n.dataset.node==='species-taxonomy');
 const old=f.edges.map(e=>e.attrs.d);
 node.emit('pointerdown',f.pointer(330,330));node.emit('pointermove',f.pointer(380,410));node.emit('pointerup',f.pointer(380,410));
 assert.equal(node.captured,false);assert.notDeepEqual(f.edges.map(e=>e.attrs.d),old);
 let prevented=false,stopped=false;
 node.emit('click',{detail:1,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});
 assert.ok(prevented&&stopped);
 node.emit('pointerdown',f.pointer(380,410));node.emit('pointerup',f.pointer(380,410));
 prevented=false;node.emit('click',{detail:1,preventDefault(){prevented=true},stopImmediatePropagation(){}});assert.equal(prevented,false);
});
test('keyboard moves points, reset restores them, and pointer cancellation releases capture',()=>{
 const f=fixture(),node=f.nodes[0];let prevented=false;
 const initial=node.style.left;
 node.emit('keydown',{key:'ArrowRight',shiftKey:false,preventDefault(){prevented=true}});
 assert.ok(prevented);assert.notEqual(node.style.left,initial);
 f.reset.emit('click');assert.equal(node.style.left,initial);
 node.emit('pointerdown',f.pointer(90,90));node.emit('pointercancel',f.pointer(90,90));assert.equal(node.captured,false);
});
test('motion pauses offscreen and can be paused and resumed explicitly',()=>{
 const f=fixture();assert.equal(f.frames.size,0);
 f.visible(true);assert.equal(f.frames.size,1);
 f.pause.emit('click');assert.equal(f.frames.size,0);assert.equal(f.pause.attrs['aria-pressed'],'true');
 f.pause.emit('click');assert.equal(f.frames.size,1);
 f.visible(false);assert.equal(f.frames.size,0);
});
