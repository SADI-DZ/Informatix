document.addEventListener('DOMContentLoaded', () => {
    // Initialize particles animation
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 25;

        for (let i = 0; i < particleCount; i++) {
            createParticle();
        }

        function createParticle() {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const size = Math.random() * 5 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}vw`;
            particle.style.top = `${posY}vh`;
            particle.style.willChange = 'transform, opacity';
            
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
    }

    // Theme toggle functionality
    const themeCheckbox = document.getElementById('theme-checkbox');
    const rootElement = document.documentElement;
    
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

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.style.padding = window.scrollY > 50 ? '0.8rem 5%' : '1.5rem 5%';
        navbar.style.transition = 'padding 0.3s ease';
    });

    // Active section tracking
    const sections = document.querySelectorAll('main, #modules');
    const navLinksItems = document.querySelectorAll('.nav-links a');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinksItems.forEach(link => link.classList.remove('active'));
                let queryId = entry.target.id ? `#${entry.target.id}` : '#';
                const activeLink = document.querySelector(`.nav-links a[href="${queryId}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { threshold: 0.5 });
    sections.forEach(s => observer.observe(s));
    
    // Scroll reveal effects
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => revealObserver.observe(el));

    // Close menu on Escape or outside click
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks) navLinks.classList.remove('active');
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar') && navLinks) navLinks.classList.remove('active');
    });

    // Typewriter effect for subtitle
    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                subtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 20);
            }
        }
        setTimeout(typeWriter, 1000);
    }
});
