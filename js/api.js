// ─────────────────────────────────────────────────────────
// Single in-memory store. Fetched once per session.
// No sessionStorage, no localStorage — 40k records fit fine in RAM.
// ─────────────────────────────────────────────────────────
let _cache = null;

function getData()       { return _cache; }
function setData(data)   { _cache = data; }
function clearData()     { _cache = null; }
function hasData()       { return _cache !== null; }

// Fetch from API and store in memory. Calls onSuccess(data) or onError().
async function loadFromAPI(onSuccess, onError) {
  try {
    const r    = await fetch(API_URL, { method: 'GET', headers: { 'Accept': 'application/json' }, mode: 'cors' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j    = await r.json();
    const data = Array.isArray(j) ? j : (j.data || j.warrants || j.result || []);
    setData(data);
    if (onSuccess) onSuccess(data);
  } catch (e) {
    console.warn('[WMS] API error:', e.message);
    if (onError) onError();
  }
}

// Use cache if available, fetch if not.
async function fetchWarrants(onSuccess, onError) {
  if (hasData()) { onSuccess(getData()); return; }
  await loadFromAPI(onSuccess, onError);
}

// Force re-fetch regardless of cache.
async function refreshWarrants(onSuccess, onError) {
  clearData();
  await loadFromAPI(onSuccess, onError);
}

// ── Auto-refresh every 5 minutes ───────────────────────────
const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes
let _autoRefreshTimer    = null;
let _nextRefreshAt       = null;
let _onAutoRefresh       = null;

function startAutoRefresh(onRefresh) {
  _onAutoRefresh = onRefresh;
  scheduleNext();
}

function scheduleNext() {
  clearTimeout(_autoRefreshTimer);
  _nextRefreshAt = Date.now() + AUTO_REFRESH_MS;
  _autoRefreshTimer = setTimeout(async () => {
    console.log('[WMS] Auto-refreshing...');
    await refreshWarrants(
      (data) => { if (_onAutoRefresh) _onAutoRefresh(data); scheduleNext(); },
      ()     => { scheduleNext(); }
    );
  }, AUTO_REFRESH_MS);
}

function stopAutoRefresh() {
  clearTimeout(_autoRefreshTimer);
  _autoRefreshTimer = null;
  _nextRefreshAt    = null;
}

// Returns seconds until next auto-refresh
function secondsUntilRefresh() {
  if (!_nextRefreshAt) return null;
  return Math.max(0, Math.round((_nextRefreshAt - Date.now()) / 1000));
}
