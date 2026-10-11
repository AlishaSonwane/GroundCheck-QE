# GroundCheck QE — free offline lab

Open `index.html` in Edge or Chrome. No installation, Python, AWS credentials, model downloads or subscription is needed. All assets are local; a Content Security Policy blocks network connections. No data is persisted automatically.

1. Load the demo or import a JSON array.
2. Run explicit required/forbidden phrase and optional exact-answer checks.
3. Set a baseline, edit saved responses, then rerun to see regressions.
4. Export the JSON report or use Print → Save as PDF.

Fields: unique string `id`, string `prompt`, `response`, `context`; optional string `expected`, arrays of non-empty strings `required`, `forbidden`.

Groundedness cues use English lexical overlap and absent numbers. They do not detect semantic contradictions, prove hallucinations or replace human evaluation. Exact-answer checks normalize punctuation and case. Prompt text is metadata: this app evaluates pre-recorded responses and never runs prompts against a model. Changed prompt/context/assertions are marked Changed test rather than compared as equivalent tests. Removing a case is reported explicitly.

This is a new independent offline extension within the downloaded project. Upstream LLM judge scorers, cloud chat and AWS deployment are not executed. Original LICENSE, NOTICE and THIRD_PARTY remain applicable to upstream code. This local lab has not been deployed or declared production-ready.

## Reuse your baseline
Export a JSON report after running your golden dataset. In another session, import it with Import baseline report. Baseline scores are recomputed from its dataset; imported verdicts are ignored. Reports use schema version 2; older reports need to be regenerated. Changed expected answers are treated as changed tests. Previous responses appear beside the current result. Export dataset saves your editable inputs separately.

Double-click Start-GroundCheck.cmd to open the offline app in your default browser. No server or installation is needed.

## Free batch evaluation on Windows
The optional batch runner uses the Node.js already installed on this PC. No package installation or model/API calls are needed.

From PowerShell, run:

```powershell
& 'C:\GenAI-Projects\GenAI-Quality-Engineering\offline-lab\Run-Free-Demo.ps1'
```

The demo creates a new reports/demo-* folder each time. Its baseline has three passing cases; the intentionally faulty candidate has two failures and two regressions. Open the candidate report.html in your browser; use Print to save a PDF. Import baseline/report.json into the browser app to reuse that baseline.

For your own saved-response dataset:

```powershell
node .\run.cjs --dataset .\samples\baseline.json --out .\reports\my-baseline
node .\run.cjs --dataset .\samples\candidate.json --baseline .\reports\my-baseline\report.json --out .\reports\my-candidate
```

Run these two commands from the offline-lab folder. Choose a new output folder each time: existing folders are never overwritten. Exit codes: 0 = assertions pass and no baseline regressions/changed/removed tests; 1 = quality gate failed; 2 = invalid input or execution error. New cases are reported and their assertions must pass. A passing gate is not a semantic factuality or hallucination guarantee.

Reports include the raw dataset and responses plus a SHA-256 fingerprint for traceability. The fingerprint identifies the input; it is not a signature or proof of authenticity. Reports stay on your PC. The reports/ folder is excluded from Git by default because user datasets may contain private information. Do not share reports containing sensitive data.

Verification: engine tests, UI wiring simulation and batch integration checks passed. Actual browser rendering and print-to-PDF remain unverified in the agent environment.

## Test-case editor and result filters
Select New case, enter a unique ID, prompt, source context and saved answer. Add required/forbidden phrases on separate lines. Enable the exact-answer checkbox only when needed. Save updates the dataset and runs local checks. Select a case to edit it. Removing a selected case changes only the in-memory dataset; an existing baseline reports the removed case. Export your dataset before refreshing to keep changes.

Use result filters and ID/prompt search to inspect failures, regressions, changed tests or absent numbers. Summary counts and JSON exports always cover all cases; print/PDF includes the currently displayed cases and a visible filter description. Phrase checks match whole normalized words, so 130 days does not satisfy a required 30 days phrase. Baseline imports recompute assertions under the current engine.

## Author and license
Author and maintainer of this original offline extension: Alisha. Copyright (c) 2026 Alisha. The original offline source files in this directory are MIT licensed; see LICENSE. This does not relicense the upstream application, its source, benchmarks or notices. The upstream project remains Apache-2.0 under the repository-root LICENSE; third-party notices remain applicable.
