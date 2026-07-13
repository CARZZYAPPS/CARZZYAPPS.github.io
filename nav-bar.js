fetch('/nav-bar.html')
    .then(response => response.text())
    .then(navbar => {
        document.body.insertAdjacentHTML('afterbegin', navbar);
        // Re-initialize menu after fetch
        initializeMenu();
    });

function initializeMenu() {
    const menuIcon = document.querySelector('.menu-icon');
    const menu = document.querySelector('.menu-popup');
    
    menuIcon.addEventListener('click', () => {
        menu.style.display = 'block';
    });

    document.querySelector('#close-menu').addEventListener('click', () => {
        menu.style.display = 'none';
    });
}
