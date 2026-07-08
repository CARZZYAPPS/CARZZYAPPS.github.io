
function getOrCreateToken() {
  let token = localStorage.getItem('userToken');
  if (!token) {
    token = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userToken', token);
  }
  return token;
}

let pageVisitStart = Date.now();
const userToken = getOrCreateToken();
const currentPage = window.location.pathname;

// Log page exit when leaving
window.addEventListener('beforeunload', function() {
  const timeSpent = Math.round((Date.now() - pageVisitStart) / 1000);
  const nextPage = ''; // Will be filled by click handlers
  logActivity(currentPage, nextPage, timeSpent);
});

// Intercept link and button clicks
document.addEventListener('click', function(e) {
  const target = e.target.closest('a, button');
  if (target) {
    let nextPage = '';
    if (target.tagName === 'A' && target.href) {
      nextPage = new URL(target.href).pathname;
    } else if (target.tagName === 'BUTTON' && target.dataset.link) {
      nextPage = target.dataset.link;
    }
    
    if (nextPage) {
      const timeSpent = Math.round((Date.now() - pageVisitStart) / 1000);
      logActivity(currentPage, nextPage, timeSpent);
      pageVisitStart = Date.now();
    }
  }
});

function logActivity(fromPage, toPage, timeSpent) {
  const appsScriptURL = 'https://script.google.com/macros/s/AKfycbwyikWC3SZVHdZwangOfPuYbE4jGM8JKRDVUIlfkov-3j4-_l7vbIfYVPT0Ir9xpzfVuA/exec'; // Replace with deployed web app URL
  
  const params = {
    action: 'logActivity',
    token: userToken,
    fromPage: fromPage,
    toPage: toPage,
    timeSpent: timeSpent
  };
  
  const queryString = new URLSearchParams(params).toString();
  fetch(appsScriptURL + '?' + queryString)
    .catch(err => console.log('Activity logged'));
}

// Reset timer when page loads
window.addEventListener('load', function() {
  pageVisitStart = Date.now();
});
