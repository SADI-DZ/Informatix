// Simple particle generation for background animation
document.addEventListener('DOMContentLoaded', () => {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        createParticle();
    }

    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random properties
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}vw`;
        particle.style.top = `${posY}vh`;
        
        // Animation
        particle.animate([
            { transform: `translate(0, 0)`, opacity: Math.random() * 0.5 },
            { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            delay: delay * 1000,
            iterations: Infinity,
            direction: 'alternate',
            easing: 'ease-in-out'
        });

        particlesContainer.appendChild(particle);
    }

    // Theme Toggle Logic
    const themeCheckbox = document.getElementById('theme-checkbox');
    const rootElement = document.documentElement;
    
    // Check local storage for theme
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        rootElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') {
            themeCheckbox.checked = true;
        }
    }

    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            rootElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            rootElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Mobile Menu Toggle Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
});
