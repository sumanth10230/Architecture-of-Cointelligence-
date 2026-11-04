import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function data(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText, { exports });
  return exports;
}

test('methodology follows cards; two taxonomy loops follow it with balanced scroll travel', () => {
  const { chapters } = data('../src/data/chapters.ts');
  assert.equal(chapters.length, 10);
  assert.equal(new Set(chapters.map(c => c.id)).size, 10);
  assert.equal(chapters[2].kind, 'cards');assert.equal(chapters[3].kind, 'methodology');
  assert.match(chapters[4].video, /species-desktop/);assert.match(chapters[5].video, /masterplan-desktop/);
  for (const chapter of chapters) { assert.equal(chapter.duration, 3);assert.equal(chapter.scrollVh, chapter.kind === 'study' ? 430 : chapter.kind === 'finale' ? 150 : (chapter.kind === 'cards' || Boolean(chapter.overlay)) ? 350 : 225); }
  assert.equal(chapters[4].kind, 'loop');assert.equal(chapters[5].kind, 'loop');
  assert.equal(chapters.filter(c => c.overlay === 'biomes').length, 1);
  assert.equal(chapters.find(c => c.overlay === 'biomes').id, 'chapter-07');
});

test('all methodology inputs feed the central system, and architectural feedback closes the loop', () => {
  const { methodologyNodes: nodes, methodologyEdges: edges, methodologyHub: hub } = data('../src/data/methodology.ts');
  const ids = new Set([...nodes.map(n => n.id),hub.id]);
  for (const [a,b] of edges) { assert.ok(ids.has(a));assert.ok(ids.has(b));assert.notEqual(a,b); }
  const reaches = (start,end,seen=new Set()) => {
    if(start===end)return true;if(seen.has(start))return false;seen.add(start);
    return edges.filter(([a])=>a===start).some(([,b])=>reaches(b,end,seen));
  };
  for(const node of nodes) assert.ok(reaches(node.id,hub.id), `${node.id} must feed intelligence`);
  assert.ok(reaches(hub.id,'architecture-taxonomy'));assert.ok(reaches('architecture-taxonomy',hub.id));
});

function interactionFixture() {
  const element = () => ({ events:{}, dataset:{}, classList:{ values:new Set(), toggle(k,v){v?this.values.add(k):this.values.delete(k)} }, addEventListener(k,f){this.events[k]=f}, setAttribute(k,v){this[k]=v} });
  const board=element(),hub=element(),node=element(),edge=element(),scene=element();
  hub.getBoundingClientRect=()=>({left:100,top:100,width:100,height:100});
  node.dataset={node:'species',description:'Species data description'};node.innerText='Plant species\ndata';
  edge.dataset={from:'species',to:'prediction'};
  const title={},body={};
  scene.querySelector=s=>({'.methodology-board':board,'.methodology-hub':hub,'.methodology-detail strong':title,'.methodology-detail p':body})[s];
  scene.querySelectorAll=s=>s==='.methodology-node'?[node]:[edge];
  const code=fs.readFileSync(new URL('../src/scripts/methodology.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
  vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,{document:{querySelectorAll:()=>[scene]},systemDescription:'System overview'});
  return {board,hub,node,edge,scene,title,body};
}

test('prototype responds to proximity, keyboard focus, touch toggle and Escape', () => {
  const f=interactionFixture();
  f.board.events.pointermove({pointerType:'mouse',clientX:210,clientY:150});assert.equal(f.hub['aria-expanded'],'true');
  f.board.events.pointerleave();assert.equal(f.hub['aria-expanded'],'false');
  f.hub.events.focus();assert.equal(f.hub['aria-expanded'],'true');
  f.scene.events.keydown({key:'Escape'});assert.equal(f.hub['aria-expanded'],'false');
  f.hub.events.click();assert.equal(f.hub['aria-expanded'],'true');
  f.hub.events.click();assert.equal(f.hub['aria-expanded'],'false');
  f.node.events.focus();assert.equal(f.body.textContent,'Species data description');
  assert.ok(f.edge.classList.values.has('is-active'));
});


test('taxonomy centres have supplied previews and chapter links; taxonomy chapters have subtitles', () => {
 const { methodologyNodes: nodes, methodologyDomains: domains, prototypeImage }=data('../src/data/methodology.ts');
 const { chapters }=data('../src/data/chapters.ts');
 const centres=nodes.filter(n=>n.domain);assert.equal(centres.length,3);
 for(const centre of centres){
  const domain=domains.find(d=>d.id===centre.domain);assert.equal(centre.x,domain.x);assert.equal(centre.y,domain.y);
  const chapter=chapters.find(c=>'#'+c.id===centre.href);assert.ok(chapter);assert.ok(chapter.subtitle);
  assert.ok(fs.existsSync(new URL('../public'+centre.image,import.meta.url)));
 }
 assert.ok(prototypeImage.endsWith('/prototype.webp'));
 assert.match(chapters.find(c=>c.id==='chapter-06').title,/Architectural/);
 for(const id of ['climate','land','species','materials','context']){
  const n=nodes.find(n=>n.id===id);
  for(const d of domains)assert.ok(Math.hypot(n.x-d.x,n.y-d.y)>d.radius,`${id} outside ${d.id}`);
 }
});

test('connections avoid unrelated taxonomy centres and the architectural intelligence hub', () => {
 const { methodologyRoutes, methodologyNodes: nodes, methodologyHub: hub }=data('../src/data/methodology.ts');
 for(const route of methodologyRoutes()){
  assert.match(route.d, /^M[-\d.,]+ L[-\d.,]+$/); // Only straight segments; no curves.
  for(const n of [...nodes.filter(n=>n.domain),hub]){
   if(n.id===route.from||n.id===route.to)continue;
   const radius=n.id===hub.id?88:65;
   for(let i=0;i<=100;i++){
    const t=i/100,u=1-t,a=route.start,b=route.end,c=route.control;
    const x=c?u*u*a.x+2*u*t*c.x+t*t*b.x:u*a.x+t*b.x;
    const y=c?u*u*a.y+2*u*t*c.y+t*t*b.y:u*a.y+t*b.y;
    assert.ok(Math.hypot(x-n.x,y-n.y)>radius+4,`${route.from} -> ${route.to} crosses ${n.id}`);
   }
  }
 }
});


test('architecture taxonomy link lands on the new film after Surface, followed by the full-screen render', () => {
 const {chapters}=data('../src/data/chapters.ts');
 const {methodologyNodes:nodes}=data('../src/data/methodology.ts');
 const node=nodes.find(n=>n.id==='architecture-taxonomy');
 const at=chapters.findIndex(c=>'#'+c.id===node.href);
 assert.equal(chapters[at-1].overlay,'biomes');assert.equal(chapters[at].kind,'loop');
 assert.match(chapters[at].video,/architecture-desktop/);assert.equal(chapters[at+1].kind,'finale');
 const system=chapters.find(c=>c.kind==='study');assert.match(system.title,/system/i);assert.equal(system.scrollVh,430);
 for(const url of [system.detailImage,chapters[at].video,chapters[at].mobileVideo,chapters[at+1].poster,chapters[at+1].mobilePoster])assert.ok(fs.existsSync(new URL('../public'+url,import.meta.url)));
});
