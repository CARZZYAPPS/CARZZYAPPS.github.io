fetch('/nav-bar.html')
    .then(response => response.text())
    .then(navbar => {
        document.body.insertAdjacentHTML('afterbegin', navbar);
        // Re-initialize menu after fetch
        initializeMenu();
    });

function initializeMenu() {
    const menuIcon = document.querySelector('.menu-icon');
    const menuOverlay = document.querySelector('.menu-overlay');

    menuIcon.addEventListener('click', () => {
        menuOverlay.style.display = 'block';
    });

    menuOverlay.addEventListener('click', () => {
        menuOverlay.style.display = 'none';
    });
}
