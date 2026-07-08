(function () {
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNmtqr-hRckMsO3qYXNJmDubHmU136Q9djx_CiubkRrobxLUJYEOJ2u2c_w6-Z0o04_w/exec';

  function getOrCreateToken() {
    var token = localStorage.getItem('userToken');
    if (!token) {
      token = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      try {
        localStorage.setItem('userToken', token);
      } catch (err) {
        // localStorage may be blocked; fall back to in-memory token
      }
    }
    return token;
  }

  var pageVisitStart = Date.now();
  var userToken = getOrCreateToken();
  var currentPage = window.location.pathname;

  window.addEventListener('load', function () {
    pageVisitStart = Date.now();
  });

  window.addEventListener('beforeunload', function () {
    var timeSpent = Math.round((Date.now() - pageVisitStart) / 1000);
    logActivity(currentPage, '', timeSpent, true);
  });

  document.addEventListener('click', function (e) {
    var el = e.target;
    if (typeof el.closest === 'function') el = el.closest('a, button');
    if (!el) return;

    var nextPage = '';
    if (el.tagName === 'A' && el.href) {
      try { nextPage = new URL(el.href, location.href).pathname; } catch (err) { nextPage = el.getAttribute('href') || ''; }
    } else if (el.tagName === 'BUTTON' && el.dataset && el.dataset.link) {
      nextPage = el.dataset.link;
    }

    if (nextPage) {
      var timeSpent = Math.round((Date.now() - pageVisitStart) / 1000);
      logActivity(currentPage, nextPage, timeSpent, false);
      pageVisitStart = Date.now();
      currentPage = nextPage;
    }
  });

  function logActivity(fromPage, toPage, timeSpent, isUnload) {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('REPLACE_WITH') !== -1) {
      console.warn('APPS_SCRIPT_URL not set - set it to your deployed Web App URL');
      return;
    }

    var payload = {
      action: 'logActivity',
      token: userToken,
      fromPage: fromPage || '',
      toPage: toPage || '',
      timeSpent: (timeSpent || 0)
    };

    // Prefer sendBeacon on unload and for reliability
    if (isUnload && navigator && navigator.sendBeacon) {
      try {
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(APPS_SCRIPT_URL, blob);
        return;
      } catch (err) {
        // fall through to fetch
      }
    }

    // Use fetch with keepalive if available
    try {
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: 'cors'
      }).catch(function () { /* swallow errors */ });
    } catch (err) { /* ignore */ }
  }

  // expose for debugging
  window.__trackThat = { logActivity: logActivity };
})();
