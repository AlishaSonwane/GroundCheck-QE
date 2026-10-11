/* Copyright (c) 2026 Alisha. SPDX-License-Identifier: MIT. */
/* GroundCheck QE original offline interface logic, 2026-10-11. */
const $=id=>document.getElementById(id);
const demo=[{id:'refund-policy',prompt:'What is the refund period?',context:'Refunds are available within 30 days of purchase.',response:'Refunds are available within 30 days of purchase.',required:['30 days'],forbidden:['guaranteed']},{id:'support-hours',prompt:'When is support available?',context:'Support is available Monday to Friday, 9 to 5.',response:'Support is available every day, 24 hours.',required:['Monday to Friday'],forbidden:['every day']}];
let current=null,baseline=null,report=null;
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function render(){
  $('results').replaceChildren();$('summary').replaceChildren();
  const diff=baseline?QE.compare(current,baseline):[];
  report={application:'GroundCheck QE',mode:'offline-saved-responses',schemaVersion:2,dataset:JSON.parse($('dataset').value),createdAt:new Date().toISOString(),limitations:'Text assertions and lexical evidence cues only; no semantic hallucination verification.',results:current,comparison:diff};
  for(const [label,value] of [['Cases',current.length],['Assertion passes',current.filter(r=>r.pass).length],['Assertion failures',current.filter(r=>!r.pass).length],['Regressions',baseline?diff.filter(r=>r.status==='Regression').length:'Set baseline']]){const el=node('div',undefined,'metric');el.append(node('strong',String(value)),node('span',label));$('summary').append(el);}
  let shown=0;const activeFilter=$('result-filter').value||'all',search=$('result-search').value.toLowerCase().trim();
  for(const r of current){const status=diff.find(d=>d.id===r.id)?.status;const match=activeFilter==='all'||activeFilter==='fail'&&!r.pass||activeFilter==='regression'&&status==='Regression'||activeFilter==='numbers'&&r.missingNumbers.length>0||activeFilter==='changed'&&status==='Changed test';if(!match||search&&!`${r.id} ${r.prompt}`.toLowerCase().includes(search))continue;shown++;const el=node('article');el.append(node('h2',`${r.id} · ${r.pass?'PASS':'FAIL'}`,r.pass?'pass':'fail'),node('p',r.prompt),node('h3','Saved response'),node('pre',r.response),node('h3','Source context'),node('pre',r.context||'No context supplied'));const list=node('ul');r.checks.forEach(c=>list.append(node('li',`${c.pass?'PASS':'FAIL'} · ${c.name}`,c.pass?'pass':'fail')));el.append(list,node('p',`Evidence token coverage: ${r.coverage===null?'Unavailable':r.coverage+'%'} · ${r.review}`),node('p',`Words absent from context: ${r.unsupported.join(', ')||'None'}`),node('p',`Numbers absent from context: ${r.missingNumbers.join(', ')||'None'}`));if(baseline){const change=diff.find(d=>d.id===r.id);el.append(node('p',`Baseline comparison: ${change.status}`));if(change.previousResponse!==null&&change.previousResponse!==r.response)el.append(node('h3','Previous saved response'),node('pre',change.previousResponse));}$('results').append(el);}
  $('filter-status').textContent=`Showing ${shown} of ${current.length} cases · ${activeFilter}${search?' · search: '+search:''}.`;
  const removed=diff.filter(d=>d.status==='Removed case');if(removed.length)$('results').append(node('p','Removed baseline cases: '+removed.map(d=>d.id).join(', ')));
}
function run(){try{current=QE.evaluate(JSON.parse($('dataset').value));render();$('message').textContent='Checks complete. No network or model calls.';if(typeof refreshCases==='function')refreshCases();}catch(e){current=null;report=null;$('results').replaceChildren();$('summary').replaceChildren();$('message').textContent=e.message;}}
$('demo').onclick=()=>{$('dataset').value=JSON.stringify(demo,null,2);run();};
$('run').onclick=run;
$('baseline').onclick=()=>{if(!current)return $('message').textContent='Run valid checks first.';baseline=JSON.parse(JSON.stringify(current));render();$('message').textContent='Baseline saved for this session. Edit responses and run again.';};
$('export').onclick=()=>{if(!report)return $('message').textContent='Run valid checks first.';const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download='groundcheck-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('print').onclick=()=>{if(!report)return $('message').textContent='Run valid checks first.';window.print();};
$('result-filter').onchange=()=>{if(current)render();};
$('result-search').addEventListener('input',()=>{if(current)render();});
$('upload').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>2000000)return $('message').textContent='Use a JSON file smaller than 2 MB.';try{const text=await f.text();QE.validate(JSON.parse(text));$('dataset').value=text;run();}catch(err){$('message').textContent=err.message;}};
$('dataset').addEventListener('input',()=>{current=null;report=null;$('results').replaceChildren();$('summary').replaceChildren();$('message').textContent='Dataset changed. Run checks to update results.';});
$('baseline-upload').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>2000000)return $('message').textContent='Use a report smaller than 2 MB.';try{const parsed=JSON.parse(await f.text());const imported=QE.importBaseline(parsed);baseline=imported;if(current)render();$('message').textContent='Baseline imported and scores recomputed locally. Run your current dataset to compare.';}catch(err){$('message').textContent=err.message;}finally{e.target.value='';}};
$('clear-baseline').onclick=()=>{baseline=null;if(current)render();$('message').textContent='Baseline cleared.';};
$('export-dataset').onclick=()=>{try{const data=QE.validate(JSON.parse($('dataset').value));const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download='groundcheck-dataset.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(err){$('message').textContent=err.message;}};
$('upload').addEventListener('click',e=>{e.target.value='';});
$('demo').click();
