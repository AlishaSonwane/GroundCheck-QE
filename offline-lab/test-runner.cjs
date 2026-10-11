/* Copyright (c) 2026 Alisha. SPDX-License-Identifier: MIT. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=__dirname;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'groundcheck-runner-'));
function invoke(args){const result=spawnSync(process.execPath,[path.join(root,'run.cjs'),...args],{encoding:'utf8'});if(result.error)throw result.error;return result;}
const baseline=path.join(dir,'baseline'),candidate=path.join(dir,'candidate');
assert.equal(invoke(['--dataset',path.join(root,'samples/baseline.json'),'--out',baseline]).status,0);
assert.equal(invoke(['--dataset',path.join(root,'samples/candidate.json'),'--baseline',path.join(baseline,'report.json'),'--out',candidate]).status,1);
const report=JSON.parse(fs.readFileSync(path.join(candidate,'report.json'),'utf8'));
assert.equal(report.summary.regressionCount,2);assert.equal(report.summary.failureCount,2);
assert.equal(report.datasetSha256.length,64);
assert.equal(invoke(['--dataset',path.join(root,'samples/baseline.json'),'--out',baseline]).status,2);
assert.equal(invoke(['--unknown','value']).status,2);
const malicious=[{id:'<script>alert(1)</script>',prompt:'<img src=x onerror=alert(1)>',context:'evidence',response:'<iframe src="https://example.com">'}];
const input=path.join(dir,'untrusted.json');fs.writeFileSync(input,JSON.stringify(malicious));
const output=path.join(dir,'escape');assert.equal(invoke(['--dataset',input,'--out',output]).status,0);
const html=fs.readFileSync(path.join(output,'report.html'),'utf8');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<iframe'));assert.ok(html.includes("default-src 'none'"));
console.log('Batch runner verified: clean baseline, two regressions, exit codes, overwrite protection, escaped report content. Test reports: '+dir);
