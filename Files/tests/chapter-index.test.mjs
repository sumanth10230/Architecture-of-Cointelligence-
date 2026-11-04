import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/scripts/chapter-index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>({})});
test('topic cue switches only at the full-screen handoff despite overlapping scenes',()=>{
 assert.equal(exports.activeChapter([{id:'top',top:-200,bottom:800},{id:'next',top:1,bottom:2000}]),'top');
 assert.equal(exports.activeChapter([{id:'top',top:-201,bottom:799},{id:'next',top:0,bottom:1999}]),'next');
 assert.equal(exports.activeChapter([{id:'top',top:-2000,bottom:-1}]),undefined);
});
test('ordinary gallery and reduced-motion chapters use the static section threshold',()=>{
 assert.equal(exports.activeChapter([{id:'gallery',top:65,bottom:800,static:true}]),'gallery');
});
