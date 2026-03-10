let uploadedData = [];

function initUpload() { /* nothing to load */ }

function dragOver(e)   { e.preventDefault(); document.getElementById('upload-zone').classList.add('drag-over'); }
function dragLeave()   { document.getElementById('upload-zone').classList.remove('drag-over'); }
function dropFile(e)   { e.preventDefault(); dragLeave(); processFile(e.dataTransfer.files[0]); }
function handleFile(e) { processFile(e.target.files[0]); }

function processFile(file) {
  if (!file) return;
  const progress = document.getElementById('upload-progress');
  const fill     = document.getElementById('progress-fill');
  const pct      = document.getElementById('progress-pct');
  const result   = document.getElementById('upload-result');
  const preview  = document.getElementById('preview-panel');
  const txt      = document.getElementById('progress-text');

  result.className = 'upload-result'; result.style.display = 'none';
  preview.style.display = 'none';
  progress.style.display = 'block'; fill.style.width = '0%'; pct.textContent = '0%';
  txt.textContent = 'กำลังอ่านไฟล์: ' + file.name;

  let p = 0;
  const tick = setInterval(() => { p = Math.min(p+15,85); fill.style.width=p+'%'; pct.textContent=p+'%'; }, 80);

  const reader = new FileReader();
  reader.onload = e => {
    clearInterval(tick); fill.style.width = '100%'; pct.textContent = '100%';
    try {
      const wb   = XLSX.read(e.target.result, { type:'binary' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval:'' });
      if (!json.length) throw new Error('ไม่พบข้อมูลในไฟล์');
      uploadedData = json;
      setTimeout(() => {
        progress.style.display = 'none';
        result.textContent = `✓ โหลดสำเร็จ ${json.length} แถว จาก "${file.name}"`;
        result.className = 'upload-result success';
        const cols = Object.keys(json[0]);
        document.getElementById('preview-thead').innerHTML = '<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
        document.getElementById('preview-tbody').innerHTML = json.slice(0,10).map(r =>
          '<tr>'+cols.map(c=>`<td style="font-family:var(--mono);font-size:12px">${r[c]}</td>`).join('')+'</tr>'
        ).join('');
        preview.style.display = 'block';
      }, 200);
    } catch (err) {
      clearInterval(tick); progress.style.display = 'none';
      result.textContent = '⚠ ข้อผิดพลาด: ' + err.message;
      result.className = 'upload-result error';
    }
  };
  reader.readAsBinaryString(file);
}

function applyUpload() {
  if (!uploadedData.length) return;
  // Merge into in-memory data
  const current = getData() || [];
  uploadedData.forEach(r => {
    const key = r.no || r.NO || r['เลขหมาย'] || '';
    if (!key) { current.push(r); return; }
    const idx = current.findIndex(w => w.no === key);
    if (idx >= 0) current[idx] = { ...current[idx], ...r };
    else current.push(r);
  });
  setData(current);
  document.getElementById('upload-result').textContent = `✓ นำเข้า ${uploadedData.length} รายการสำเร็จ`;
  setTimeout(() => navigateTo('overview'), 700);
}
