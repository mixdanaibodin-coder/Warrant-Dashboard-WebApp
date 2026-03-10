let chartCmd = null, chartArrest = null, chartAlleg = null;

function initOverview() {
  const ind = document.getElementById('api-indicator');
  const lb  = document.getElementById('ov-loading');

  // If data already in memory — render instantly, no API call
  if (hasData()) {
    render(getData());
    if (ind) { ind.className = 'api-badge ok'; ind.textContent = '● เชื่อมต่อสำเร็จ'; }
    return;
  }

  // First load — fetch from API
  if (lb)  lb.style.display = 'block';
  if (ind) { ind.className = 'api-badge loading'; ind.textContent = '⟳ กำลังโหลด...'; }

  fetchWarrants(
    (data) => {
      if (lb)  lb.style.display = 'none';
      if (ind) { ind.className = 'api-badge ok'; ind.textContent = '● เชื่อมต่อสำเร็จ'; }
      render(data);
    },
    () => {
      if (lb)  lb.style.display = 'none';
      if (ind) { ind.className = 'api-badge error'; ind.textContent = '⚠ API ออฟไลน์'; }
    }
  );
}

function manualRefresh() {
  const ind = document.getElementById('api-indicator');
  const lb  = document.getElementById('ov-loading');
  if (lb)  lb.style.display = 'block';
  if (ind) { ind.className = 'api-badge loading'; ind.textContent = '⟳ กำลังโหลด...'; }

  refreshWarrants(
    (data) => {
      if (lb)  lb.style.display = 'none';
      if (ind) { ind.className = 'api-badge ok'; ind.textContent = '● เชื่อมต่อสำเร็จ'; }
      render(data);
    },
    () => {
      if (lb)  lb.style.display = 'none';
      if (ind) { ind.className = 'api-badge error'; ind.textContent = '⚠ API ออฟไลน์'; }
    }
  );
}

function render(data) {
  const user = sessionStorage.getItem('wms_user') || '';
  setText('banner-username', user);
  setText('stat-total',   data.length);
  setText('stat-allow',   data.filter(w => w.command_status === 'ALLOW').length);
  setText('stat-wanted',  data.filter(w => w.warrant_type   === 'WANTED').length);
  setText('stat-not',     data.filter(w => w.arrest_status  === 'NOT').length);
  setText('banner-total', data.length);
  setText('banner-allow', data.filter(w => w.command_status === 'ALLOW').length);
  setText('banner-not',   data.filter(w => w.arrest_status  === 'NOT').length);
  renderRecentTable(data);
  renderCharts(data);
}

function renderRecentTable(data) {
  const tb = document.getElementById('overview-tbody');
  if (!tb) return;
  if (!data.length) { tb.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div>ไม่มีข้อมูล</div></td></tr>'; return; }
  tb.innerHTML = data.slice(0,6).map(w => `<tr>
    <td class="id-cell">${w.no||'—'}</td>
    <td style="font-weight:500">${w.suspect_fullname||'—'}</td>
    <td style="font-size:13px">${w.court_name||'—'}</td>
    <td style="font-size:13px">${w.allegations||'—'}</td>
    <td>${cmdBadge(w.command_status)}</td>
    <td>${arrestBadge(w.arrest_status)}</td>
    <td><button class="btn btn-outline" style="padding:5px 12px;font-size:12px" onclick="navigateTo('warrants')">ดู</button></td>
  </tr>`).join('');
}

function renderCharts(data) {
  const font = { family:"'Sarabun',sans-serif", size:12 };
  Chart.defaults.font = font;
  const cmdCounts    = countBy(data, 'command_status');
  const arrestCounts = countBy(data, 'arrest_status');
  const allegCounts  = topN(data, 'allegations', 6);

  if (chartCmd) chartCmd.destroy();
  const c1 = document.getElementById('chart-cmd');
  if (c1) chartCmd = new Chart(c1, {
    type:'doughnut',
    data:{ labels:Object.keys(cmdCounts), datasets:[{ data:Object.values(cmdCounts),
      backgroundColor:['#0e9f6e','#c27803','#e02424','#94a3b8'], borderWidth:2, borderColor:'#fff', hoverOffset:6 }]},
    options:{ cutout:'68%', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:12, font }},
        tooltip:{ callbacks:{ label:c=>` ${c.label}: ${c.parsed} รายการ` }}}}
  });

  if (chartArrest) chartArrest.destroy();
  const c2 = document.getElementById('chart-arrest');
  if (c2) chartArrest = new Chart(c2, {
    type:'bar',
    data:{ labels:Object.keys(arrestCounts).map(k=>k==='NOT'?'ยังไม่จับ':'จับแล้ว'),
      datasets:[{ data:Object.values(arrestCounts), backgroundColor:['#fde8e8','#def7ec'],
        borderColor:['#e02424','#0e9f6e'], borderWidth:2, borderRadius:8, borderSkipped:false }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:c=>` ${c.parsed.y} รายการ` }}},
      scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1, font }, grid:{ color:'#e2e8f4' }}, x:{ ticks:{ font }, grid:{ display:false }}}}
  });

  if (chartAlleg) chartAlleg.destroy();
  const c3 = document.getElementById('chart-allegations');
  if (c3) chartAlleg = new Chart(c3, {
    type:'bar',
    data:{ labels:Object.keys(allegCounts), datasets:[{ data:Object.values(allegCounts),
      backgroundColor:'rgba(26,86,219,0.15)', borderColor:'#1a56db', borderWidth:2, borderRadius:6, borderSkipped:false }]},
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:c=>` ${c.parsed.x} รายการ` }}},
      scales:{ x:{ beginAtZero:true, ticks:{ stepSize:1, font }, grid:{ color:'#e2e8f4' }},
        y:{ ticks:{ font:{...font,size:11}, callback(v){ const l=this.getLabelForValue(v); return l.length>14?l.slice(0,14)+'…':l; }}, grid:{ display:false }}},
      layout:{ padding:{ left:4 }}}
  });
}
