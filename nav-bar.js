fetch ("/nav-bar.html")
.then(response => response.text())
.then(navbar => document.body.insertAdjacentHTML('afterbegin', navbar));
