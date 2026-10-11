/* Copyright (c) 2026 Alisha. SPDX-License-Identifier: MIT. */
/* GroundCheck QE original offline evaluation module, 2026-10-11. */
(function(root){
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  const containsPhrase=(text,phrase)=>(' '+text+' ').includes(' '+normalize(phrase)+' ');
  const words = s => normalize(s).split(' ').filter(w=>w.length>3);
  function validate(data){
    if(!Array.isArray(data)||!data.length)throw Error('Upload a non-empty JSON array.');
    const ids=new Set();
    data.forEach((r,i)=>{
      if(!r||typeof r!=='object'||Array.isArray(r))throw Error(`Row ${i+1}: expected an object.`);
      if(typeof r.id!=='string'||!r.id.trim()||ids.has(r.id))throw Error(`Row ${i+1}: id must be unique and non-empty.`);
      ids.add(r.id);
      for(const key of ['prompt','response','context'])if(typeof r[key]!=='string')throw Error(`${r.id}: ${key} must be text.`);
      if(r.expected!==undefined&&typeof r.expected!=='string')throw Error(`${r.id}: expected must be text.`);
      for(const key of ['required','forbidden'])if(r[key]!==undefined&&(!Array.isArray(r[key])||r[key].some(s=>typeof s!=='string'||!normalize(s))))throw Error(`${r.id}: ${key} must contain non-empty strings.`);
    });return data;
  }
  function evaluate(data){return validate(data).map(r=>{
    const response=normalize(r.response), context=normalize(r.context);
    const checks=[{name:'Non-empty response',pass:!!response}];
    for(const phrase of r.required||[])checks.push({name:`Required: ${phrase}`,pass:containsPhrase(response,phrase)});
    for(const phrase of r.forbidden||[])checks.push({name:`Forbidden: ${phrase}`,pass:!containsPhrase(response,phrase)});
    if(r.expected!==undefined)checks.push({name:'Exact expected answer',pass:response===normalize(r.expected)});
    const tokens=[...new Set(words(r.response))], evidence=new Set(words(r.context));
    const unsupported=tokens.filter(w=>!evidence.has(w));
    const numbers=r.response.match(/\b\d+(?:\.\d+)?\b/g)||[];
    const missingNumbers=numbers.filter(n=>!(r.context.match(/\b\d+(?:\.\d+)?\b/g)||[]).includes(n));
    return {test:{prompt:r.prompt,context:r.context,expected:r.expected,required:r.required||[],forbidden:r.forbidden||[]},id:r.id,prompt:r.prompt,response:r.response,context:r.context,checks,pass:checks.every(c=>c.pass),coverage:context&&tokens.length?Math.round(100*(tokens.length-unsupported.length)/tokens.length):null,unsupported,missingNumbers,review:!context?'No context':missingNumbers.length?'Check numbers':'Manual review needed'};
  });}
  function compare(current,baseline){
    const before=new Map(baseline.map(r=>[r.id,r]));
    return current.map(r=>{const b=before.get(r.id);return {id:r.id,previousResponse:b?b.response:null,currentResponse:r.response,status:!b?'New case':JSON.stringify(b.checks.map(c=>c.name))!==JSON.stringify(r.checks.map(c=>c.name))||b.prompt!==r.prompt||b.context!==r.context||JSON.stringify(b.test)!==JSON.stringify(r.test)?'Changed test':b.pass&&!r.pass?'Regression':!b.pass&&r.pass?'Improved':'Unchanged'};}).concat(baseline.filter(b=>!current.some(r=>r.id===b.id)).map(b=>({id:b.id,status:'Removed case'})));
  }
  function importBaseline(data){
    if(!data||data.application!=='GroundCheck QE'||data.mode!=='offline-saved-responses'||data.schemaVersion!==2||!Array.isArray(data.dataset))throw Error('Use a schema v2 GroundCheck QE JSON report as the baseline.');
    // Recompute from raw data: never trust supplied scores or check verdicts.
    return evaluate(data.dataset);
  }
  const api={validate,evaluate,compare,importBaseline};if(typeof module!=='undefined')module.exports=api;else root.QE=api;
})(globalThis);
