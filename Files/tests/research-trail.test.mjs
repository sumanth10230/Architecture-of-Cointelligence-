import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture(reduced=false){
 const el=()=>({dataset:{},events:{},attrs:{},addEventListener(k,f){this.events[k]=f},emit(k,e={}){this.events[k]?.(e)},setAttribute(k,v){this.attrs[k]=v}});
 const root=el(),button=el(),doc=el(),motion=el();let intersect,mutate;
 motion.matches=reduced;root.querySelector=()=>button;root.contains=target=>target===button;doc.querySelectorAll=()=>[root];doc.hidden=false;doc.modal=false;doc.body={classList:{contains:()=>doc.modal}};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/scripts/research-trail.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,document:doc,matchMedia:()=>motion,
 IntersectionObserver:class{constructor(cb){intersect=cb}observe(){}},MutationObserver:class{constructor(cb){mutate=cb}observe(){}}});
 exports.installResearchTrail();return {root,button,doc,motion,visible(value){intersect([{isIntersecting:value}])},modal(value){doc.modal=value;mutate()}};
}
test('image trail runs only onscreen and pauses for hidden tabs, dialogs and user inspection',()=>{
 const f=fixture();assert.equal(f.root.dataset.running,'false');f.visible(true);assert.equal(f.root.dataset.running,'true');
 f.root.emit('mouseenter');assert.equal(f.root.dataset.running,'false');f.root.emit('mouseleave');assert.equal(f.root.dataset.running,'true');
 f.root.emit('focusin');assert.equal(f.root.dataset.running,'false');f.root.emit('focusout',{relatedTarget:null});assert.equal(f.root.dataset.running,'true');
 f.modal(true);assert.equal(f.root.dataset.running,'false');f.modal(false);assert.equal(f.root.dataset.running,'true');
 f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.root.dataset.running,'false');f.doc.hidden=false;f.doc.emit('visibilitychange');assert.equal(f.root.dataset.running,'true');
 f.visible(false);assert.equal(f.root.dataset.running,'false');
});
test('explicit trail pause persists across viewport changes; reduced motion keeps a static strip',()=>{
 const f=fixture();f.visible(true);f.button.emit('click');f.visible(false);f.visible(true);assert.equal(f.root.dataset.running,'false');assert.equal(f.button.textContent,'Resume image trail');
 f.button.emit('click');assert.equal(f.root.dataset.running,'true');f.motion.matches=true;f.motion.emit('change');assert.equal(f.root.dataset.running,'false');assert.equal(f.root.dataset.reduced,'true');assert.equal(f.button.hidden,true);
 const reduced=fixture(true);reduced.visible(true);assert.equal(reduced.root.dataset.running,'false');
});
