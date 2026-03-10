// ── Clock ──────────────────────────────────────────────────
function startClock() {
  const tick = () => setText('clock', new Date().toLocaleString('th-TH', { hour12: false }));
  tick(); setInterval(tick, 1000);
}

// ── Nav highlight ──────────────────────────────────────────
function highlightNav(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === page);
  });
}

// ── Badges ─────────────────────────────────────────────────
function cmdBadge(s) {
  const m = { ALLOW: ['badge-allow','อนุมัติ'], PENDING: ['badge-pending','รอดำเนินการ'], DENY: ['badge-deny','ปฏิเสธ'] };
  const [cls, label] = m[s] || ['badge-not', s || '—'];
  return `<span class="badge ${cls}">${label}</span>`;
}
function arrestBadge(s) {
  return s === 'ARRESTED' ? `<span class="badge badge-arrested">จับแล้ว</span>` : `<span class="badge badge-not">ยังไม่จับ</span>`;
}
function typeBadge(s) {
  return s ? `<span class="badge badge-wanted">${s}</span>` : '—';
}

// ── Utilities ──────────────────────────────────────────────
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function safeJSON(w)      { return JSON.stringify(w).replace(/'/g, "&#39;"); }

function countBy(arr, key) {
  return arr.reduce((a, w) => { const v = w[key]||'UNKNOWN'; a[v]=(a[v]||0)+1; return a; }, {});
}
function topN(arr, key, n) {
  return Object.fromEntries(Object.entries(countBy(arr,key)).sort((a,b)=>b[1]-a[1]).slice(0,n));
}
