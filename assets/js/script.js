"use strict";
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particles animation
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 25;

        if (particlesContainer) {
            for (let i = 0; i < particleCount; i++) {
                createParticle();
            }
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

            if (particlesContainer) particlesContainer.appendChild(particle);
        }
    }

    // Theme logic handled by theme-manager.js

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
        if (navbar) {
            navbar.style.padding = window.scrollY > 50 ? '0.8rem 5%' : '1.5rem 5%';
            navbar.style.transition = 'padding 0.3s ease';
        }
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

    const courseViewer = document.getElementById('course-viewer');
    const viewerContent = document.getElementById('viewer-content');
    const viewerCategory = document.getElementById('viewer-category');
    const viewerTitle = document.getElementById('viewer-title');
    const btnBackToHome = document.getElementById('btn-back-to-home');
    const btnBackToField = document.getElementById('btn-back-to-field');

    // Close menu or viewer on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (navLinks) navLinks.classList.remove('active');
            if (courseViewer && courseViewer.classList.contains('active')) {
                courseViewer.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (navLinks && !e.target.closest('.navbar') && !e.target.closest('#mobile-menu-btn')) {
            navLinks.classList.remove('active');
        }
    });

    // Typewriter effect for subtitle (once per visitor)
    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        const hasVisitedBefore = localStorage.getItem('informatix_visited');
        if (hasVisitedBefore) {
            subtitle.textContent = text;
        } else {
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
            localStorage.setItem('informatix_visited', 'true');
        }
    }

    // --- Course Navigation Logic ---
    let coursData = {};
    let currentFieldId = null;

    // Load course data from JSON
    async function loadCourseData() {
        try {
            const response = await fetch('assets/data/courses.json');
            if (!response.ok) throw new Error('فشل تحميل بيانات الدروس');
            coursData = await response.json();
            console.log('informatix: تم تحميل بيانات الدروس بنجاح');
        } catch (err) {
            console.error('informatix: فشل تحميل البيانات:', err);
            if (viewerContent) {
                viewerContent.innerHTML = `<div class="error-msg">❌ خطأ: تعذر تحميل بيانات الدروس. يرجى التأكد من تشغيل الموقع عبر خادم ويب (http://) وليس مباشرة (file://)</div>`;
            }
        }
    }

    loadCourseData();

    function showUnits(fieldId) {
        const data = coursData[fieldId];
        if (!data) return;

        currentFieldId = fieldId;
        if (viewerCategory) viewerCategory.textContent = data.title;
        if (viewerTitle) viewerTitle.textContent = 'اختر الوحدة';
        if (btnBackToField) btnBackToField.style.display = 'none';

        if (viewerContent) {
            viewerContent.innerHTML = `
                <div class="units-grid">
                    ${data.units.map(unit => `
                        <div class="unit-card" onclick="openLesson('${esc(unit.file)}', '${esc(unit.title)}', '${esc(fieldId)}')">
                            <div class="unit-card-image" style="background: ${unit.bg || 'var(--card-bg)'}">
                                ${unit.image ? `<img src="${unit.image}" alt="${unit.title}" class="unit-card-img" loading="lazy">` : ''}
                                <div class="badge badge-lesson">درس</div>
                            </div>
                            <div class="unit-card-body">
                                <h3 class="unit-card-title">${unit.title}</h3>
                                <p class="unit-card-desc">${unit.desc}</p>
                                
                                <div class="unit-card-meta">
                                    <div class="meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                        <span>السنة الأولى ثانوي</span>
                                    </div>
                                </div>

                                <div class="unit-card-tags">
                                    ${(unit.tags || ['معلوماتية', 'تقنية', 'مفاهيم']).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                                </div>
                            </div>
                            <div class="unit-card-footer">
                                <button class="btn-view-content">
                                    عرض المحتوى
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (courseViewer) courseViewer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function esc(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function getLessonContent(filePath) {
        if (window.LESSON_CONTENT && window.LESSON_CONTENT[filePath]) {
            return window.LESSON_CONTENT[filePath];
        }
        return null;
    }

    window.openLesson = async function(filePath, unitTitle, fieldId) {
        if (viewerTitle) viewerTitle.textContent = unitTitle;
        if (btnBackToField) btnBackToField.style.display = 'block';
        if (viewerContent) viewerContent.innerHTML = '<div class="loader-container"><div class="loader"></div><p>جاري تحميل الدرس...</p></div>';

        try {
            localStorage.setItem('informatix_last_lesson', JSON.stringify({
                fieldId: fieldId || currentFieldId,
                title: unitTitle,
                file: filePath
            }));
        } catch (e) { console.warn('informatix: فشل حفظ آخر درس', e); }

        let mdText = getLessonContent(filePath);

        if (!mdText) {
            try {
                const response = await fetch(encodeURI(filePath));
                if (!response.ok) throw new Error('تعذر تحميل الملف');
                mdText = await response.text();
            } catch (fetchErr) {
                if (viewerContent) viewerContent.innerHTML = `<div class="error-msg">❌ خطأ: تعذر تحميل الدرس. يرجى التأكد من تشغيل الموقع عبر خادم ويب (http://) وليس مباشرة (file://)</div>`;
                return;
            }
        }

         try {
            if (typeof marked === 'undefined') {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'assets/js/lib/marked.min.js';
                    s.onload = resolve; s.onerror = () => reject(new Error('فشل تحميل مكتبة المحتوى'));
                    document.head.appendChild(s);
                });
            }
            let htmlContent = marked.parse(mdText);
            
            htmlContent = htmlContent.replace(
                /<blockquote>([\s\S]*?)<\/blockquote>/gi, 
                (match, content) => {
                    const inner = content.trim();
                    if (inner.includes('[!TIP]')) {
                        return `<div class="alert alert-tip"><div class="alert-title">💡 نصيحة</div>${inner.replace('[!TIP]', '')}</div>`;
                    }
                    if (inner.includes('[!WARNING]') || inner.includes('[!CAUTION]')) {
                        return `<div class="alert alert-warning"><div class="alert-title">⚠️ تنبيه</div>${inner.replace('[!WARNING]', '').replace('[!CAUTION]', '')}</div>`;
                    }
                    if (inner.includes('[!NOTE]')) {
                        return `<div class="alert alert-note"><div class="alert-title">📝 ملاحظة</div>${inner.replace('[!NOTE]', '')}</div>`;
                    }
                    if (inner.includes('[!INFO]')) {
                        return `<div class="alert alert-info"><div class="alert-title">ℹ️ معلومات</div>${inner.replace('[!INFO]', '')}</div>`;
                    }
                    return match;
                }
            );

            if (viewerContent) {
                viewerContent.innerHTML = `<div class="md-container"><div class="md-content">${htmlContent}</div></div>`;
                viewerContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            const progressFill = document.getElementById('reading-progress-fill');
            if (progressFill) progressFill.style.width = '0%';
        } catch (err) {
            if (viewerContent) viewerContent.innerHTML = `<div class="error-msg">❌ خطأ: ${esc(err.message)}</div>`;
        }
    };

    if (btnBackToHome) {
        btnBackToHome.addEventListener('click', () => {
            if (courseViewer) courseViewer.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (btnBackToField) {
        btnBackToField.addEventListener('click', () => {
            showUnits(currentFieldId);
        });
    }

    // Attach events to field buttons
    document.querySelectorAll('.lessons-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const fieldId = btn.getAttribute('data-field');
            showUnits(fieldId);
        });
    });

    // Reading progress tracking
    if (viewerContent) {
        viewerContent.addEventListener('scroll', () => {
            const progressFill = document.getElementById('reading-progress-fill');
            if (!progressFill) return;
            const scrollTop = viewerContent.scrollTop;
            const scrollHeight = viewerContent.scrollHeight - viewerContent.clientHeight;
            if (scrollHeight > 0) {
                const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
                progressFill.style.width = progress + '%';
            }
        });
    }

    // Continue learning banner
    (function showContinueBanner() {
        try {
            const saved = localStorage.getItem('informatix_last_lesson');
            if (!saved) return;
            const data = JSON.parse(saved);
            if (!data || !data.title) return;

            const statsSection = document.querySelector('.stats-overview');
            if (!statsSection) return;

            const banner = document.createElement('div');
            banner.className = 'continue-banner';
            banner.innerHTML = `
                <div class="continue-info">
                    <span style="font-size:1.5rem">📖</span>
                    <div>
                        <div class="continue-label">آخر درس:</div>
                        <div class="continue-title">${data.title}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:0.8rem">
                    <button class="btn-continue" id="btn-continue-lesson">متابعة التعلم</button>
                    <button class="btn-dismiss" id="btn-dismiss-continue" aria-label="تجاهل">&times;</button>
                </div>
            `;

            statsSection.parentNode.insertBefore(banner, statsSection.nextSibling);

            document.getElementById('btn-continue-lesson')?.addEventListener('click', () => {
                const fieldId = data.fieldId;
                const fieldBtn = document.querySelector(`.lessons-btn[data-field="${fieldId}"]`);
                if (fieldBtn) {
                    showUnits(fieldId);
                    // Wait for units to render, then open the lesson
                    setTimeout(() => {
                        window.openLesson(data.file, data.title, data.fieldId).catch(e => console.warn('informatix: فشل فتح الدرس', e));
                    }, 500); // Give more time for data to load
                }
            });

            document.getElementById('btn-dismiss-continue')?.addEventListener('click', () => {
                banner.remove();
                localStorage.removeItem('informatix_last_lesson');
            });
        } catch (e) { console.warn('informatix: فشل استعادة آخر درس', e); }
    })();
});
