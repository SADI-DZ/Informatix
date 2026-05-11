// Typing effect for lab subtitle
(function() {
    const typingEl = document.getElementById('lab-typing');
    let typingTimeout = null;
    let typingTextIdx = 0;
    let typingCharIdx = 0;
    let typingIsDeleting = false;
    const typingTexts = [
        'بيئة تفاعلية لتجربة المفاهيم البرمجية',
        'حيث تلتقي النظرية بالتطبيق',
        'مختبر رقمي لاستكشاف عالم المعلوماتية'
    ];

    function typeLoop() {
        const labHero = document.querySelector('.lab-hero');
        if (!typingEl || labHero && labHero.style.display === 'none') return;
        const current = typingTexts[typingTextIdx];
        if (!typingIsDeleting) {
            typingEl.textContent = current.substring(0, typingCharIdx + 1);
            typingCharIdx++;
            if (typingCharIdx === current.length) {
                typingIsDeleting = true;
                typingTimeout = setTimeout(typeLoop, 2000);
            } else {
                typingTimeout = setTimeout(typeLoop, 50);
            }
        } else {
            typingEl.textContent = current.substring(0, typingCharIdx);
            typingCharIdx--;
            if (typingCharIdx < 0) {
                typingIsDeleting = false;
                typingTextIdx = (typingTextIdx + 1) % typingTexts.length;
                typingTimeout = setTimeout(typeLoop, 500);
            } else {
                typingTimeout = setTimeout(typeLoop, 30);
            }
        }
    }

    function stopTypingEffect() {
        if (typingTimeout) { clearTimeout(typingTimeout); typingTimeout = null; }
    }

    // Expose for other modules (workshop nav)
    window.stopTypingEffect = stopTypingEffect;
    window._typingEl = typingEl;
    window._typeLoop = typeLoop;

    // Auto-start
    document.addEventListener('DOMContentLoaded', () => {
        if (typingEl) typeLoop();
    });
})();
