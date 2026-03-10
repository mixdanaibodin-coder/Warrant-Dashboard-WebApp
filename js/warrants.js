let filteredWarrants = [];
let currentPage      = 1;
let sortKey          = '';
let sortDir          = 1;
const perPage        = 10;

function initWarrants() {
  // Data already in memory — just render
  if (hasData()) { applyAndRender(getData()); return; }

  // First time — fetch
  fetchWarrants(
    (data) => applyAndRender(data),
    ()     => renderTable()
  );
}

function applyAndRender(data) {
  filteredWarrants = [...data];
  currentPage = 1;
  // Re-apply current filters (in case user had them set before navigating away)
  filterTable();
}

function filterTable() {
  const data = getData() || [];
  const q    = (document.getElementById('search-box')?.value || '').toLowerCase();
  const cmd  = document.getElementById('cmd-filter')?.value    || '';
  const arr  = document.getElementById('arrest-filter')?.value || '';
  const typ  = document.getElementById('type-filter')?.value   || '';

  filteredWarrants = data.filter(w =>
    (!q || [w.no, w.suspect_fullname, w.suspect_idcard, w.allegations, w.court_name]
      .some(v => (v||'').toLowerCase().includes(q))) &&
    (!cmd || w.command_status === cmd) &&
    (!arr || w.arrest_status  === arr) &&
    (!typ || w.warrant_type   === typ)
  );
  currentPage = 1;
  renderTable();
}

function sortTable(key) {
  if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
  filteredWarrants.sort((a,b) => String(a[key]||'').localeCompare(String(b[key]||''),'th') * sortDir);
  renderTable();
}

function renderTable() {
  const tb = document.getElementById('warrants-tbody');
  const s  = (currentPage-1) * perPage;
  const pg = filteredWarrants.slice(s, s+perPage);

  setText('warrant-count', filteredWarrants.length + ' รายการ');

  if (!pg.length) {
    tb.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🔍</div>ไม่พบข้อมูลที่ตรงกัน</div></td></tr>`;
    renderPagination(); return;
  }

  tb.innerHTML = pg.map(w => `<tr>
    <td class="id-cell">${w.no||'—'}</td>
    <td style="font-weight:500;color:var(--text)">${w.suspect_fullname||'—'}</td>
    <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">${w.suspect_idcard||'—'}</td>
    <td style="font-size:13px">${w.court_name||'—'}</td>
    <td style="font-size:13px">${w.allegations||'—'}</td>
    <td>${cmdBadge(w.command_status)}</td>
    <td>${arrestBadge(w.arrest_status)}</td>
    <td>${typeBadge(w.warrant_type)}</td>
    <td><button class="btn btn-outline" style="padding:5px 12px;font-size:12px"
        onclick='openModal(${safeJSON(w)})'>รายละเอียด</button></td>
  </tr>`).join('');
  renderPagination();
}

function renderPagination() {
  const pages = Math.ceil(filteredWarrants.length / perPage) || 1;
  const s = Math.min((currentPage-1)*perPage+1, filteredWarrants.length);
  const e = Math.min(currentPage*perPage, filteredWarrants.length);
  setText('page-info', `${s}–${e} จาก ${filteredWarrants.length} รายการ`);

  const btns = document.getElementById('page-btns');
  btns.innerHTML = '';
  const add = (label, pg, active) => {
    const b = document.createElement('button');
    b.className   = 'page-btn' + (active?' active':'');
    b.textContent = label;
    if (!active) b.onclick = () => { currentPage = pg; renderTable(); };
    btns.appendChild(b);
  };
  if (currentPage > 1) add('‹', currentPage-1, false);
  for (let i=Math.max(1,currentPage-2); i<=Math.min(pages,currentPage+2); i++) add(i,i,i===currentPage);
  if (currentPage < pages) add('›', currentPage+1, false);
}

function exportCSV() {
  if (!filteredWarrants.length) return;
  const cols = ['no','suspect_fullname','suspect_idcard','court_name','black_case_no','red_case_no','allegations','command_status','arrest_status','warrant_type'];
  const csv  = '\uFEFF' + [cols.join(','), ...filteredWarrants.map(w =>
    cols.map(c => `"${(w[c]||'').toString().replace(/"/g,'""')}"`).join(',')
  )].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),
    download: 'warrants.csv'
  });
  a.click();
}

function openModal(w) {
  if (typeof w === 'string') w = JSON.parse(w.replace(/&#39;/g,"'"));
  const labels = { no:'เลขหมาย', suspect_fullname:'ชื่อ-สกุล', suspect_idcard:'เลขบัตร / Passport',
    court_name:'ศาล', black_case_no:'เลขคดีดำ', red_case_no:'เลขคดีแดง',
    allegations:'ข้อหา', command_status:'สถานะคำสั่ง', arrest_status:'สถานะการจับกุม', warrant_type:'ประเภทหมาย' };
  document.getElementById('modal-body').innerHTML = '<div class="detail-section">' +
    Object.entries(labels).map(([k,label]) => `<div class="detail-row">
      <span class="detail-key">${label}</span>
      <span class="detail-val">${k==='command_status'?cmdBadge(w[k]):k==='arrest_status'?arrestBadge(w[k]):k==='warrant_type'?typeBadge(w[k]):(w[k]||'—')}</span>
    </div>`).join('') + '</div>';
  document.getElementById('modal').classList.add('open');
}

function closeModal() { document.getElementById('modal').classList.remove('open'); }
