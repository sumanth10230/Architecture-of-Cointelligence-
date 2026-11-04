// Editable vector masters for the two supplied Illustrator workflow references.
// Run from the project root. PNG exports have transparent backgrounds.
import fs from 'node:fs/promises';
import sharp from '../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js';
const out = 'public/images/workflows';
await fs.mkdir(out, {recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const text=(x,y,lines,size=22,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${(Array.isArray(lines)?lines:[lines]).map((s,i)=>`<tspan x="${x}" dy="${i?size*1.3:0}">${esc(s)}</tspan>`).join('')}</text>`;
const arrow=(d,label,x,y)=>`<path class="flow" d="${d}" marker-end="url(#arrow)"/>${label?text(x,y,label,20):''}`;
const circle=(x,y,r,opacity=0)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="white" fill-opacity="${opacity}"/>`;
function network(x,y,s=1){
 const p=[[0,20],[0,100],[86,-10],[86,68],[86,138],[169,84]],e=[[0,1],[0,3],[0,4],[1,2],[1,3],[2,5],[3,5],[4,5]];
 return `<g transform="translate(${x} ${y}) scale(${s})" class="line">${e.map(([a,b])=>`<path d="M${p[a]}L${p[b]}"/>`).join('')}${p.map(([a,b])=>`<circle cx="${a}" cy="${b}" r="22" fill="#111"/>`).join('')}</g>`;
}
function globe(x,y,r){
 return `<g transform="translate(${x} ${y})" class="line">${circle(0,0,r,.025)}<ellipse rx="${r*.42}" ry="${r}"/><ellipse rx="${r}" ry="${r*.35}"/><path d="M${-r} 0H${r}M0 ${-r}V${r}" opacity=".35"/><g transform="scale(${r/90})" fill="white" fill-opacity=".14"><path d="M-67 -40L-40 -66 -12 -62 1 -45 -16 -32 -9 -11 -25 5 -36 -18 -54 -20Z"/><path d="M-18 2L6 -10 29 7 23 32 9 60 -4 42Z"/><path d="M12 -58L38 -68 69 -40 78 -12 58 4 43 -12 23 -9 5 -28Z"/><path d="M51 38L70 29 78 46 62 57Z"/></g></g>`;
}
function satellite(x,y){return `<g transform="translate(${x} ${y}) rotate(-38)" class="line"><rect x="-11" y="-14" width="22" height="28" fill="white" fill-opacity=".18"/><path d="M-38 -11H-15V11H-38ZM15 -11H38V11H15ZM0 14V26M-10 25Q0 40 10 25M-17 34Q0 53 17 34"/></g>`;}
function field(x,y,w=190,h=72,variant=0){
 const id=`field-${x}-${y}`;
 const path=`M${w*.03} ${h*.7}Q${w*.12} ${h*.5} ${w*.1} ${h*.28}C${w*.2} ${-h*.05} ${w*.78} ${-h*.1} ${w*.94} ${h*.22}Q${w*1.05} ${h*.65} ${w*.88} ${h*.78}L${w*.2} ${h*.98}Q${-w*.06} ${h*1.02} ${w*.03} ${h*.7}Z`;
 return `<g transform="translate(${x} ${y})" class="line"><defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs><path d="${path}" fill="white" fill-opacity=".04"/><g clip-path="url(#${id})" stroke-opacity=".26" stroke-width=".8">${Array.from({length:23},(_,i)=>`<path d="M${i*w/21} 0Q${i*w/21+25} ${h/2} ${i*w/21-12} ${h}"/>`).join('')}${Array.from({length:10},(_,i)=>`<path d="M0 ${i*h/9}Q${w/2} ${i*h/9-20} ${w} ${i*h/9}"/>`).join('')}</g>${variant?`<ellipse cx="${w*.4}" cy="${h*.49}" rx="${w*.10}" ry="${h*.15}"/><ellipse cx="${w*.72}" cy="${h*.36}" rx="${w*.07}" ry="${h*.12}"/>`:''}</g>`;
}
// Reuse an original botanical photocard rather than invent a species photograph.
const cardData=await sharp('public/images/cards/001.webp').grayscale().png().toBuffer();
const card=(x,y,w=235)=>`<image x="${x}" y="${y}" width="${w}" height="${w*6/7}" href="data:image/png;base64,${cardData.toString('base64')}"/>`;
const wrap=(title,desc,height,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="${height}" viewBox="0 0 1500 ${height}" role="img"><title>${title}</title><desc>${desc}</desc><defs><marker id="arrow" viewBox="0 0 12 12" markerWidth="9" markerHeight="9" refX="10" refY="6" orient="auto"><path d="M2 1L8 6L2 11" fill="none" stroke="white" stroke-width="1.5"/></marker></defs><style>text{fill:#fff;font-family:Arial,Helvetica,sans-serif;font-weight:300}.line{stroke:#fff;stroke-width:1.6;fill:none}.flow{fill:none;stroke:#fff;stroke-width:2.2;stroke-dasharray:.1 7;stroke-linecap:round}</style>${body}</svg>`;
const species=wrap('Species taxonomy methodology','Climate, land use and extinction risk data train the prediction model. Planet ecological data queries the model and informs extinction risk data. Predictions produce composite plant stress levels, queried through two clustering stages to produce species photocards.',860,
 text(145,75,'IMF',30)+text(145,102,'CLIMATE CHANGE DASHBOARD',12)+text(145,139,'Climate Data')+
 text(145,210,'FAO',30)+text(145,237,['Food and Agriculture Organization','of the United Nations'],12)+text(145,287,'Land use Data')+
 text(145,360,'IUCN RED LIST',23)+text(145,398,'Extinction Risk Data')+
 `<path class="flow" d="M275 95H320V375H275"/>`+arrow('M320 247H488','Train',400,226)+
 network(535,201,.63)+text(589,337,['AI : Prediction model Weighted on','Algorithm'],19)+
 arrow('M680 247H834','Predict',754,226)+globe(930,247,74)+text(930,359,'Composite Plant Stress levels',19)+
 arrow('M1030 247H1220','Query',1125,226)+network(1270,201,.63)+text(1324,337,['AI : Unsupervised clustering using','k-means algorithm'],18)+
 arrow('M1324 400V483')+network(1270,540,.63)+text(1324,676,['AI : Unsupervised clustering using','k-means algorithm'],18)+
 arrow('M1324 717V778H1060')+card(795,510,235)+text(913,739,'Species photocards',19)+
 globe(145,615,79)+satellite(233,539)+text(145,733,'Planet Ecological Data',20)+arrow('M145 507V431')+
 arrow('M265 616H589V392','Query',402,593));
const functionPoints=[[0,0,15],[48,0,15],[96,0,15],[144,0,15],[192,0,15],[0,65,32],[60,55,13],[104,55,13],[148,55,13],[192,55,18],[80,111,26],[144,111,18]];
const masterplanOutput=await fs.readFile(`${out}/masterplan-output.png`);
const masterplanImage=`<image x="1153" y="135" width="320" height="365" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${masterplanOutput.toString('base64')}"/>`;
const master=wrap('Masterplan taxonomy methodology','Seed species and seedbank function relationships feed a graph-based algorithm and masterplan taxonomy. Context colour field datasets feed a self-organizing map. Both graph-based relationships and the self-organizing map connect to the combined spatial field.',990,
 card(40,40,235)+text(157,273,'Seed Species')+
 `<g class="line" transform="translate(55 380)">${functionPoints.map(([x,y,r],i)=>circle(x,y,r+6,.04)+circle(x,y,r,.12)+text(x,y+6,i+1,17)).join('')}</g>`+text(157,558,['Seedbank Function','Relationship'],20)+
 `<path class="flow" d="M300 170H355V459H300"/>`+text(321,146,'Train',19)+text(320,492,'Query',19)+arrow('M355 320H535')+
 network(590,274,.72)+text(651,427,'AI : Graph-based Algorithm',20)+arrow('M752 320H1140')+masterplanImage+text(1313,528,['Master Plan','Taxonomy'],22)+
 arrow('M987 320V693')+
 field(32,670,121,48)+field(185,670,121,48,1)+field(100,774,137,52)+text(166,899,['Context Colour Field','Dataset'],21)+
 arrow('M350 765H535')+network(590,719,.72)+text(651,871,'AI : Self-Organizing map',21)+arrow('M752 765H872')+
 field(913,720,295,116,1)+
 `<g transform="translate(913 870)">${Array.from({length:10},(_,i)=>`<rect x="${i*29.5}" y="0" width="29.5" height="8" fill="white" opacity="${.1+i*.09}"/>`).join('')}</g>`+
 text(913,902,['Normalized Value','0.00 to 0.25 : 829     /     0.25 to 0.50 : 1073','0.50 to 0.75 : 1007   /     0.75 to 1.00 : 751'],15,'start'));
for(const [name,svg] of [['species',species],['masterplan',master]]){
 await fs.writeFile(`${out}/${name}.svg`,svg);
 await sharp(Buffer.from(svg),{density:144}).png().toFile(`${out}/${name}.png`);
 await sharp(Buffer.from(svg)).flatten({background:'#111111'}).png().toFile(`../../work/${name}-workflow-preview.png`);
}
console.log('Created transparent PNGs and editable white-line SVG workflow masters.');
