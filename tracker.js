
// ---------------------------
// Client-side tracker code
// ---------------------------
// Usage: include the code below in a <script> on your site, and set APPS_SCRIPT_URL
// to the deployed Web App URL (Deploy -> New deployment -> Web app). Deploy with
// "Execute as: Me" and "Who has access: Anyone, even anonymous" for anonymous logs.

(function () {
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZPIONLcpdwTL_FVWUxidjyU6DFTAB5n6cwJ_Y_wi1QFRx2j6dF2BLbCQeCe25zpqfdg/exec';

  function getOrCreateToken() {
    var token = localStorage.getItem('userToken');
    if (token) return token;

    // use a temporary token immediately, then request a proper sequential token
    token = 'ca-temp-' + Date.now();
    try { localStorage.setItem('userToken', token); } catch (e) {}

    // async request to get the next sequential token from the server
    try {
      var url = APPS_SCRIPT_URL + '?action=getNextToken';
      fetch(url, { method: 'GET', cache: 'no-store' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.token) {
            try { localStorage.setItem('userToken', data.token); } catch (e) {}
            userToken = data.token; // update outer var when ready
          }
        }).catch(function () { /* ignore */ });
    } catch (err) { /* ignore */ }

    return token;
  }

  var pageVisitStart = Date.now();
  var userToken = getOrCreateToken();
  var currentPage = window.location.pathname || (document.referrer ? new URL(document.referrer, location.href).pathname : '/');

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

    // fallback: if fromPage is empty or root, try document.referrer
    if (!fromPage || fromPage === '/') {
      try { fromPage = document.referrer ? new URL(document.referrer, location.href).pathname : fromPage; } catch (e) { /* ignore */ }
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
// Removed legacy global tracker code (was conflicting with the IIFE tracker).
