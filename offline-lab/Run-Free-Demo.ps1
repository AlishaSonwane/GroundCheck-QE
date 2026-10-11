# Copyright (c) 2026 Alisha. SPDX-License-Identifier: MIT.
# GroundCheck QE original offline Windows demo, 2026-10-11.
$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required for this optional batch demo. The browser app does not need it.' }
$demoRoot = Join-Path $PSScriptRoot ('reports\demo-' + [Guid]::NewGuid().ToString('N').Substring(0,8))
$baselineOutput = Join-Path $demoRoot 'baseline'
$candidateOutput = Join-Path $demoRoot 'candidate'
& node (Join-Path $PSScriptRoot 'run.cjs') --dataset (Join-Path $PSScriptRoot 'samples\baseline.json') --out $baselineOutput
if ($LASTEXITCODE -ne 0) { throw 'Baseline run failed.' }
& node (Join-Path $PSScriptRoot 'run.cjs') --dataset (Join-Path $PSScriptRoot 'samples\candidate.json') --baseline (Join-Path $baselineOutput 'report.json') --out $candidateOutput
if ($LASTEXITCODE -ne 1) { throw 'Expected the faulty candidate to fail the quality gate.' }
Write-Host 'Demo complete: the intentionally faulty candidate has two regressions.'
Write-Host (Join-Path $candidateOutput 'report.html')
