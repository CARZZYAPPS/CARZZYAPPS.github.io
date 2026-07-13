const menuIcon = document.querySelector('.menu-icon');
const menu = document.querySelector('.menu-popup');
        
menuIcon.addEventListener('click', () => {
    menu.style.display = 'block';
});

document.querySelector('#close-menu').addEventListener('click', () => {
    menu.style.display = 'none';
});
