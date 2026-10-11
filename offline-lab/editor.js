/* Copyright (c) 2026 Alisha. SPDX-License-Identifier: MIT. */
/* GroundCheck QE original offline test-case editor, 2026-10-11. */
let editingId=null;
const fields=['id','prompt','context','response','required','forbidden','expected'];
function loadCase(row){
  editingId=row?.id??null;
  for(const field of fields){const value=row?.[field];$('case-'+field).value=Array.isArray(value)?value.join('\n'):(value??'');}
  $('case-exact').checked=row?.expected!==undefined;
  $('case-expected').disabled=!$('case-exact').checked;
  $('case-select').value=editingId??'';
  $('editor-message').textContent=editingId?'Editing '+editingId:'Creating a new case.';
}
function refreshCases(){
  try{
    const rows=QE.validate(JSON.parse($('dataset').value));
    $('case-select').replaceChildren();const blank=node('option','New case');blank.value='';$('case-select').append(blank);
    for(const row of rows){const option=node('option',row.id);option.value=row.id;$('case-select').append(option);}
    if(editingId&&!rows.some(r=>r.id===editingId))loadCase(null);else $('case-select').value=editingId??'';
  }catch(err){$('editor-message').textContent='Fix the dataset JSON before editing cases: '+err.message;}
}
$('case-select').onchange=()=>{try{const data=QE.validate(JSON.parse($('dataset').value));loadCase(data.find(r=>r.id===$('case-select').value)||null);}catch(err){$('editor-message').textContent=err.message;}};
$('case-new').onclick=()=>loadCase(null);
$('case-exact').onchange=()=>{$('case-expected').disabled=!$('case-exact').checked;};
$('case-form').onsubmit=e=>{
  e.preventDefault();
  try{
    const rows=QE.validate(JSON.parse($('dataset').value));
    const index=editingId===null?-1:rows.findIndex(r=>r.id===editingId);
    if(editingId!==null&&index===-1)throw Error('The selected case no longer exists. Select New case to add it.');
    const row={...(index>=0?rows[index]:{}),id:$('case-id').value.trim(),prompt:$('case-prompt').value,context:$('case-context').value,response:$('case-response').value,required:$('case-required').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),forbidden:$('case-forbidden').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)};
    if(!row.prompt.trim())throw Error('Enter a prompt for this case.');
    if($('case-exact').checked)row.expected=$('case-expected').value;else delete row.expected;
    if(index>=0)rows[index]=row;else rows.push(row);
    QE.validate(rows);$('dataset').value=JSON.stringify(rows,null,2);editingId=row.id;run();loadCase(row);$('editor-message').textContent='Saved '+row.id+'. Export dataset to keep your changes.';
  }catch(err){$('editor-message').textContent=err.message;}
};
$('case-delete').onclick=()=>{
  try{
    if(editingId===null)throw Error('Select an existing case first.');
    const rows=QE.validate(JSON.parse($('dataset').value));
    if(!rows.some(r=>r.id===editingId))throw Error('Select an existing case first.');
    const remaining=rows.filter(r=>r.id!==editingId);
    if(!remaining.length)throw Error('Keep at least one case in the dataset.');
    const removed=editingId;$('dataset').value=JSON.stringify(remaining,null,2);loadCase(null);run();$('editor-message').textContent='Removed '+removed+' from this session. An existing baseline will show the removed case.';
  }catch(err){$('editor-message').textContent=err.message;}
};
refreshCases();loadCase(null);
