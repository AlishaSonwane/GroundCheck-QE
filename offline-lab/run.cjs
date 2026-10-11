/* Copyright (c) 2026 Alisha. SPDX-License-Identifier: MIT. */
/* GroundCheck QE original offline batch runner, 2026-10-11. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const qe = require('./engine.js');
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(file){
  if(fs.statSync(file).size>2000000)throw Error('Input files must be smaller than 2 MB.');
  return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
}
function run(args){
  if(args.includes('--help')){console.log('node run.cjs --dataset <JSON> [--baseline <report JSON>] [--out <new folder>]');return 0;}
  const options={};
  for(let i=0;i<args.length;i+=2){const flag=args[i];if(!['--dataset','--baseline','--out'].includes(flag)||!args[i+1]||args[i+1].startsWith('--')||options[flag])throw Error('Invalid arguments. Use --help.');options[flag]=args[i+1];}
  if(!options['--dataset'])throw Error('Provide --dataset <JSON file>.');
  const dataset=qe.validate(read(path.resolve(options['--dataset'])));
  const results=qe.evaluate(dataset);
  const baseline=options['--baseline']?qe.importBaseline(read(path.resolve(options['--baseline']))):null;
  const comparison=baseline?qe.compare(results,baseline):[];
  const failureCount=results.filter(r=>!r.pass).length;
  const regressionCount=comparison.filter(r=>r.status==='Regression').length;
  const changedCount=comparison.filter(r=>r.status==='Changed test'||r.status==='Removed case').length;
  // A changed/removed test needs review: never silently report a clean regression gate.
  const gate=failureCount||regressionCount||changedCount?'FAIL':'PASS';
  const report={application:'GroundCheck QE',mode:'offline-saved-responses',schemaVersion:2,createdAt:new Date().toISOString(),datasetSha256:crypto.createHash('sha256').update(JSON.stringify(dataset)).digest('hex'),limitations:'Text assertions and lexical evidence cues only; no semantic hallucination verification. This run uses saved responses, not live prompt generation.',dataset,results,comparison,summary:{cases:results.length,failureCount,regressionCount,changedOrRemovedCount:changedCount,gate}};
  const output=path.resolve(options['--out']||path.join(__dirname,'reports',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(3).toString('hex')));
  if(fs.existsSync(output))throw Error('Output folder already exists. Choose a new folder to preserve earlier reports.');
  const cards=results.map(r=>{const change=comparison.find(c=>c.id===r.id);return `<article><h2>${escape(r.id)} — ${r.pass?'PASS':'FAIL'}</h2><p>${escape(r.prompt)}</p><h3>Saved response</h3><pre>${escape(r.response)}</pre><h3>Source context</h3><pre>${escape(r.context||'No context supplied')}</pre><ul>${r.checks.map(c=>`<li>${c.pass?'PASS':'FAIL'}: ${escape(c.name)}</li>`).join('')}</ul><p>Lexical evidence coverage: ${r.coverage===null?'Unavailable':r.coverage+'%'}; ${escape(r.review)}</p><p>Words absent from context: ${escape(r.unsupported.join(', ')||'None')}</p><p>Numbers absent from context: ${escape(r.missingNumbers.join(', ')||'None')}</p>${change?`<p>Baseline: ${escape(change.status)}</p><h3>Previous response</h3><pre>${escape(change.previousResponse??'New case')}</pre>`:''}</article>`;}).join('');
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>GroundCheck QE report</title><style>body{font:16px/1.6 system-ui;max-width:980px;margin:40px auto;padding:20px;color:#172b3c}article{border:1px solid #ccc;padding:20px;margin:20px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5f8;padding:12px}h1{color:#164f58}@media print{article{break-inside:avoid}}</style></head><body><h1>GroundCheck QE · Offline Report</h1><p>${escape(report.createdAt)} · Gate: <strong>${gate}</strong> · ${results.length} cases · ${failureCount} failed · ${regressionCount} regressions · ${changedCount} changed/removed tests</p><p>${escape(report.limitations)}</p><p>Dataset SHA-256: ${report.datasetSha256}</p>${cards}<h2>Removed cases</h2><p>${escape(comparison.filter(c=>c.status==='Removed case').map(c=>c.id).join(', ')||'None')}</p></body></html>`;
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(output,'report.html'),html);
  console.log(`${gate}: ${results.length} cases, ${failureCount} failed, ${regressionCount} regressions, ${changedCount} changed/removed tests. Reports: ${output}`);
  return gate==='PASS'?0:1;
}
if(require.main===module){try{process.exitCode=run(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=2;}}
module.exports={run};
