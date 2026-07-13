function initializeMenu() {
    const menuIcon = document.querySelector('.menu-icon');
    const menu = document.querySelector('.menu-popup');
    
    if (menuIcon && menu) {
        menuIcon.addEventListener('click', () => {
            menu.style.display = 'block';
        });

        const closeMenu = document.querySelector('#close-menu');
        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                menu.style.display = 'none';
            });
        }
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMenu());
} else {
    initializeMenu();
}
