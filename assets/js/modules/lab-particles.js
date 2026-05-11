// Particles animation + theme listener + scroll-to-top
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        // Particles animation
        const particleAnimations = [];
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const container = document.getElementById('lab-particles');
            if (container) {
                const colors = ['#00f2fe', '#4facfe', '#a78bfa', '#10b981', '#f59e0b'];
                for (let i = 0; i < 18; i++) {
                    const p = document.createElement('div');
                    p.className = 'lab-particle';
                    const size = Math.random() * 4 + 1;
                    const x = Math.random() * 100;
                    const y = Math.random() * 100;
                    p.style.cssText = `position:fixed;width:${size}px;height:${size}px;left:${x}vw;top:${y}vh;background:${colors[i%5]};pointer-events:none;z-index:0;border-radius:50%;opacity:0;will-change:transform,opacity;`;
                    const anim = p.animate([
                        { transform: 'translate(0,0) scale(0)', opacity: 0 },
                        { transform: `translate(${Math.random()*80-40}px,${Math.random()*80-40}px) scale(1)`, opacity: Math.random() * 0.6 + 0.2 },
                        { transform: `translate(${Math.random()*120-60}px,${Math.random()*120-60}px) scale(0)`, opacity: 0 }
                    ], {
                        duration: Math.random() * 8000 + 6000,
                        delay: Math.random() * 5000,
                        iterations: Infinity,
                        easing: 'ease-in-out'
                    });
                    particleAnimations.push(anim);
                    container.appendChild(p);
                }
                document.addEventListener('visibilitychange', () => {
                    particleAnimations.forEach(a => document.hidden ? a.pause() : a.play());
                });
            }
        }

        // Theme logic handled by theme-manager.js
        window.addEventListener('informatix-theme-changed', (e) => {
            if (typeof nsInitialized !== 'undefined' && nsInitialized && typeof nsRender === 'function') {
                nsRender();
            }
        });

        // Scroll-to-top button
        const topBtn = document.getElementById('scroll-to-top');
        const contentArea = document.querySelector('.content-area');
        if (topBtn && contentArea) {
            contentArea.addEventListener('scroll', () => {
                topBtn.style.display = contentArea.scrollTop > 400 ? 'flex' : 'none';
            });
            topBtn.addEventListener('click', () => contentArea.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    });
})();
