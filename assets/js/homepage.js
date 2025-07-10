// assets/js/homepage.js

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    const setActiveLink = (clickedLink) => {
        navLinks.forEach(link => link.classList.remove('active'));
        if (clickedLink) {
            clickedLink.classList.add('active');
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            if (!this.getAttribute('data-bs-toggle')) {
                 setActiveLink(this);
            }
        });
    });
});
