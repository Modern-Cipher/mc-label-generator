// assets/js/social-links.js

document.addEventListener('DOMContentLoaded', () => {
    const socialLinks = {
        'facebook-link': 'https://www.facebook.com/moderncipher/',
        'tiktok-link': 'https://www.tiktok.com/@modern_cipher',
        'messenger-link': 'https://m.me/moderncipher',
        'telegram-link': 'https://t.me/modern_cipher',
        'viber-link': 'viber://add?number=639764244902',
        'gmail-link': 'mailto:mdctechservices@gmail.com',
        'website-link': 'https://modern-cipher.github.io/services/'
    };

    const handleLinkClick = (id, url) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (event) => {
                event.preventDefault();
                if (url.startsWith('mailto:') || url.startsWith('viber:')) {
                    window.location.href = url;
                } else {
                    window.open(url, '_blank');
                }
            });
        }
    };

    for (const id in socialLinks) {
        handleLinkClick(id, socialLinks[id]);
    }

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
