// assets/js/header.js

document.addEventListener('DOMContentLoaded', () => {
    // This script handles the navigation link's "active" state.

    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const aboutModalElement = document.getElementById('aboutModal');

    // Function to set the active link
    const setActiveLink = (clickedLink) => {
        navLinks.forEach(link => link.classList.remove('active'));
        if (clickedLink) {
            clickedLink.classList.add('active');
        }
    };

    // Add click listeners to all nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            setActiveLink(this);
        });
    });

    // When the "About" modal is closed, this ensures the "Home" link becomes active again.
    if (aboutModalElement) {
        aboutModalElement.addEventListener('hidden.bs.modal', () => {
            const homeLink = document.querySelector('.navbar-nav .nav-link[href="#"]');
            setActiveLink(homeLink);
        });
    }
});
