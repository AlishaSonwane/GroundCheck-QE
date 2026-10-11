/* Copyright (c) 2026 Alisha. SPDX-License-Identifier: MIT. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname+'/';
class Element{
  constructor(){this.children=[];this.listeners={};this.value='';this.textContent='';}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){if(this.onclick)this.onclick();}
}
const ids=[...fs.readFileSync(root+'index.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
let downloaded=null,printed=false;
const context=vm.createContext({console,document:{getElementById:id=>{assert.ok(elements[id],`Missing UI element ${id}`);return elements[id];},createElement:()=>new Element()},Blob,URL:{createObjectURL:blob=>{downloaded=blob;return 'blob:test';},revokeObjectURL(){}},setTimeout:fn=>fn(),window:{print:()=>{printed=true;}}});
vm.runInContext(fs.readFileSync(root+'engine.js','utf8'),context);
vm.runInContext(fs.readFileSync(root+'app.js','utf8'),context);
vm.runInContext(fs.readFileSync(root+'editor.js','utf8'),context);
assert.equal(elements.results.children.length,2);
elements.baseline.click();
const dataset=JSON.parse(elements.dataset.value);
dataset[0].response='Refunds are available within 90 days of purchase.';
elements.dataset.value=JSON.stringify(dataset);elements.dataset.listeners.input();
assert.equal(elements.results.children.length,0);elements.run.click();
assert.equal(elements.summary.children[3].children[0].textContent,'1');
elements.export.click();assert.ok(downloaded);
async function finish(){
const exported=JSON.parse(await downloaded.text());assert.equal(exported.schemaVersion,2);assert.equal(exported.comparison[0].status,'Regression');
await elements['baseline-upload'].onchange({target:{files:[{size:100,text:async()=>JSON.stringify(exported)}],value:'test'}});
assert.match(elements.message.textContent,/recomputed/);
elements['clear-baseline'].click();assert.match(elements.message.textContent,/cleared/);
elements['result-filter'].value='fail';elements['result-filter'].onchange();
assert.equal(elements.results.children.length,2);
elements['result-search'].value='refund';elements['result-search'].listeners.input();
assert.equal(elements.results.children.length,1);
elements.export.click();assert.equal(JSON.parse(await downloaded.text()).results.length,2);
elements['result-filter'].value='all';elements['result-search'].value='';
elements['case-new'].click();
elements['case-id'].value='third';elements['case-prompt'].value='What is supported?';elements['case-context'].value='Local checks';elements['case-response'].value='Local checks';elements['case-required'].value='Local';
elements['case-form'].onsubmit({preventDefault(){}});
assert.equal(JSON.parse(elements.dataset.value).length,3);
assert.match(elements['editor-message'].textContent,/Saved third/);
elements['case-new'].click();elements['case-id'].value='third';elements['case-prompt'].value='duplicate';
elements['case-form'].onsubmit({preventDefault(){}});
assert.match(elements['editor-message'].textContent,/unique/);assert.equal(JSON.parse(elements.dataset.value).length,3);
elements['case-select'].value='third';elements['case-select'].onchange();
elements['case-exact'].checked=true;elements['case-exact'].onchange();elements['case-expected'].value='different';
elements['case-form'].onsubmit({preventDefault(){}});
assert.equal(JSON.parse(elements.dataset.value).find(r=>r.id==='third').expected,'different');
elements['case-exact'].checked=false;elements['case-form'].onsubmit({preventDefault(){}});
assert.equal(Object.hasOwn(JSON.parse(elements.dataset.value).find(r=>r.id==='third'),'expected'),false);
elements['case-delete'].click();assert.equal(JSON.parse(elements.dataset.value).length,2);
elements.print.click();assert.equal(printed,true);
elements.dataset.value='invalid';elements.run.click();elements.export.click();
assert.match(elements.message.textContent,/valid checks/);
console.log('UI wiring verified: baseline, regression, exports, filters, search, case creation/edit/removal, duplicate rejection and print guard. Browser rendering remains unverified.');
}finish().catch(err=>{console.error(err);process.exitCode=1;});
