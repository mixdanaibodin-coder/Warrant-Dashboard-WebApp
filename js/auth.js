function doLogin() {
  const u   = document.getElementById('username').value.trim();
  const p   = document.getElementById('password').value;
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');

  err.style.display = 'none';
  btn.textContent   = 'กำลังตรวจสอบ...';
  btn.disabled      = true;

  setTimeout(() => {
    if (CREDS[u] === p) {
      sessionStorage.setItem('wms_user', u);
      showDashboard(u);
    } else {
      err.style.display = 'block';
      btn.textContent   = 'เข้าสู่ระบบ →';
      btn.disabled      = false;
    }
  }, 600);
}

function doLogout() {
  sessionStorage.removeItem('wms_user');
  clearData(); stopAutoRefresh();
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login').style.display     = 'flex';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

function showDashboard(user) {
  document.getElementById('login').style.display     = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  setText('topbar-username', user);
  setText('avatar-letter', user[0].toUpperCase());
  navigateTo('overview');
  startAutoRefresh((data) => {
    // When auto-refresh fires, re-render whatever view is currently active
    const active = ['overview','warrants','upload'].find(v =>
      document.getElementById('view-'+v)?.style.display !== 'none'
    );
    if (active === 'overview') render(data);
    if (active === 'warrants') applyAndRender(data);
  });
}

// Bind enter key on login inputs
document.addEventListener('DOMContentLoaded', () => {
  ['username','password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); });
  });

  // Auto-login if session still active
  const user = sessionStorage.getItem('wms_user');
  if (user) showDashboard(user);
});
