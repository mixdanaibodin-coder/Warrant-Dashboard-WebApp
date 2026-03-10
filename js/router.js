// ── View router ────────────────────────────────────────────
// Swaps content divs — no page navigation, data stays in memory.

const VIEWS = ['overview', 'warrants', 'upload'];

function navigateTo(view) {
  // Show/hide views
  VIEWS.forEach(v => {
    document.getElementById('view-' + v).style.display = v === view ? 'block' : 'none';
  });
  highlightNav(view);

  // Scroll to top on navigation
  document.querySelector('.main').scrollTop = 0;

  // Init the view
  if      (view === 'overview') initOverview();
  else if (view === 'warrants') initWarrants();
  else if (view === 'upload')   initUpload();
}

function quickFilter(field, val) {
  navigateTo('warrants');
  // Reset all filters then apply the one we want
  setTimeout(() => {
    document.getElementById('cmd-filter').value    = '';
    document.getElementById('arrest-filter').value = '';
    document.getElementById('type-filter').value   = '';
    if (field === 'cmd')    document.getElementById('cmd-filter').value    = val;
    if (field === 'arrest') document.getElementById('arrest-filter').value = val;
    if (field === 'type')   document.getElementById('type-filter').value   = val;
    filterTable();
  }, 0);
}