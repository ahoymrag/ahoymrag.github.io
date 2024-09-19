function toggleMenu() {
        const menu = document.querySelector('.menu');
        const hamburger = document.querySelector('.hamburger');
        const closeButton = document.querySelector('.close-btn');
        menu.classList.toggle('active');
        hamburger.style.display = menu.classList.contains('active') ? 'none' : 'block';
        closeButton.style.display = menu.classList.contains('active') ? 'block' : 'none';
    }