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
        if (!e.target.closest('.navbar') && navLinks) navLinks.classList.remove('active');
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
    const coursData = {
        env: {
            title: 'بيئة التعامل مع الحاسوب',
            units: [
                { id: '01', title: 'تقنية المعلومات', desc: 'مفهوم تقنية المعلومات (IT) وأهميتها في حياتنا اليومية ومجالات استخدامها.',tags: ['تقنية', 'معلومات', 'أساسيات'], file: 'content/1- بيئة التعامل مع الحاسوب/01_تقنية_المعلومات.md', bg: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a4e 30%, #2d1b69 70%, #1a1a4e 100%)', image: 'assets/images/lessons/IT.avif' },
                { id: '02', title: 'تجميع الحاسوب', desc: 'تالتعرف على المكونات المادية (Hardware) وكيفية تجميعها لعمل حاسوب متكامل.', tags: ['هاردوير', 'تركيب', 'عتاد'], file: 'content/1- بيئة التعامل مع الحاسوب/02_تجميع_الحاسوب.md', bg: 'linear-gradient(135deg, #0d1117 0%, #1a2332 30%, #2d3748 70%, #1a2332 100%)', image: 'assets/images/lessons/PC.avif' },
                { id: '03', title: 'نظام التشغيل', desc: 'مفهوم نظام التشغيل، أنواعه، ودوره الأساسي كحلقة وصل بين المستخدم والعتاد.', tags: ['ويندوز', 'برمجيات', 'نظام'], file: 'content/1- بيئة التعامل مع الحاسوب/03_نظام_التشغيل.md', bg: 'linear-gradient(135deg, #0a1628 0%, #1a365d 30%, #2a4365 70%, #1a365d 100%)', image: 'assets/images/lessons/OS.avif' },
                { id: '04', title: 'لوحة التحكم', desc: 'تخصيص إعدادات النظام وإدارة الأجهزة والبرامج.', tags: ['إعدادات', 'نظام', 'تحكم'], file: 'content/1- بيئة التعامل مع الحاسوب/04_لوحة_التحكم.md', bg: 'linear-gradient(135deg, #111827 0%, #1f2937 30%, #374151 70%, #1f2937 100%)', image: 'assets/images/lessons/PC.avif' },
                { id: '05', title: 'حماية الحاسوب', desc: 'طرق تأمين البيانات والحماية من الفيروسات والبرمجيات الضارة.', tags: ['أمن', 'حماية', 'فيروسات'], file: 'content/1- بيئة التعامل مع الحاسوب/05_حماية_الحاسوب.md', bg: 'linear-gradient(135deg, #0a1a0f 0%, #1a3a2a 30%, #22543d 70%, #1a3a2a 100%)', image: 'assets/images/lessons/Security.avif' },
                { id: '06', title: 'الشبكة المحلية', desc: 'أساسيات الشبكات المحلية وكيفية مشاركة الموارد.', tags: ['شبكات', 'إنترنت', 'تواصل'], file: 'content/1- بيئة التعامل مع الحاسوب/06_الشبكة_المحلية.md', bg: 'linear-gradient(135deg, #0f1419 0%, #1a2a3a 30%, #1a365d 70%, #1a2a3a 100%)', image: 'assets/images/lessons/Network.avif' }
            ]
        },
        programming: {
            title: 'مدخل إلى البرمجة',
            units: [
                { id: '01', title: 'المخططات الانسيابية', desc: 'تعلم كيفية تمثيل الخوارزميات باستخدام الأشكال الهندسية لتبسيط فهم تسلسل العمليات.', tags: ['خوارزمية', 'رسم', 'منطق', 'تكرار'], file: 'content/2- مقدمة في البرمجة/01_المخططات_الانسيابية.md', image: 'assets/images/lessons/Flowchart_thumb.jpg' },
                { id: '02', title: 'مدخل إلى الخوارزمية', desc: 'مفهوم الخوارزمية، خصائصها، وكيفية التفكير المنطقي المتسلسل لحل المشكلات.', tags: ['تفكير', 'حل_مشكلات', 'برمجة'], file: 'content/2- مقدمة في البرمجة/03_مدخل_الى_الخوارزمية.md', image: 'assets/images/lessons/Algo1.avif' },
                { id: '03', title: 'التعليمات الأساسية', desc: 'التعرف على المتغيرات، الثوابت، والعمليات الأساسية.', tags: ['متغيرات', 'كود', 'تعليمات'], file: 'content/2- مقدمة في البرمجة/04_التعليمات_الأساسية.md', image: 'assets/images/lessons/Algo2.avif' }
            ]
        },
        web: {
            title: 'تقنيات الويب',
            units: [
                { id: '01', title: 'المتصفح', desc: 'كيف تعمل متصفحات الويب وكيفية تصفح الإنترنت بأمان.', tags: ['متصفح', 'إنترنت', 'أمان'], file: 'content/3- تقنيات الويب/01_المتصفح.md', image: 'assets/images/lessons/browser_thumb.jpg'},
                { id: '02', title: 'أدوات التواصل', desc: 'استكشاف منصات التواصل الرقمي الحديثة.', tags: ['تواصل', 'تعاون', 'منصات'], file: 'content/3- تقنيات الويب/03_استغلال_أدوات_التواصل.md', image: 'assets/images/lessons/SM.avif' },
                { id: '03', title: 'البريد الإلكتروني', desc: 'إدارة المراسلات الرسمية واستخدام البريد الإلكتروني بفعالية.', tags: ['بريد_إلكتروني', 'مراسلات', 'فعالية'], file: 'content/3- تقنيات الويب/04_البريد_الإلكتروني.md', image: 'assets/images/lessons/email.avif' },
                { id: '04', title: 'إنشاء صفحة ويب', desc: 'خطواتك الأولى في بناء صفحات الويب باستخدام HTML.', tags: ['HTML', 'صفحة_ويب', 'تصميم'], file: 'content/3- تقنيات الويب/02_إنشاء_صفحة_ويب.md', image: 'assets/images/lessons/HTML.avif' }
            ]
        },
        office: {
            title: 'المكتبية',
            units: [
                { id: '01', title: 'معالج النصوص 1 (الأنماط والمقاطع)', desc: 'أتنسيق المستندات المتقدم باستخدام الأنماط (Styles) وتقسيم المستند إلى مقاطع (Sections).', file: 'content/4- المكتبية/معالج_النصوص_1.md', image: 'assets/images/lessons/word.svg'},
                { id: '02', title: 'معالج النصوص 2 (دمج المراسلات)', desc: 'استخدام خاصية دمج المراسلات (Mail Merge) لإنشاء رسائل وشهادات متعددة آلياً.', file: 'content/4- المكتبية/معالج_النصوص_2.md', image: 'assets/images/lessons/word.svg' },
                { id: '03', title: 'المجدول 1 (الصيغ والدوال)', desc: 'إجراء العمليات الحسابية في Excel باستخدام الصيغ الرياضية والدوال الجاهزة (Functions).', file: 'content/4- المكتبية/المجدول_1.md', image: 'assets/images/lessons/excel.svg' },
                { id: '04', title: 'المجدول 2 (فرز البيانات)', desc: 'اكيفية ترتيب البيانات وفرزها (Sorting & Filtering) لتسهيل استخراج المعلومات.', file: 'content/4- المكتبية/المجدول_2.md', image: 'assets/images/lessons/excel.svg' },
                { id: '05', title: 'االعروض التقديمية 1 (أساسيات PowerPoint)', desc: 'إعداد شرائح العرض، إدراج النصوص والصور، واختيار التصميم المناسب.', file: 'content/4- المكتبية/العروض_التقديمية_1.md', image: 'assets/images/lessons/ppt.svg' },
                { id: '06', title: 'العروض التقديمية 2 (الحركات والارتباط التشعبي)', desc: 'إإضافة حركات انتقالية ومخصصة، واستخدام الارتباط التشعبي لإنشاء عروض تفاعلية.', file: 'content/4- المكتبية/العروض_التقديمية_2.md', image: 'assets/images/lessons/ppt.svg' }
            ]
        }
    };

    const courseViewer = document.getElementById('course-viewer');
    const viewerContent = document.getElementById('viewer-content');
    const viewerCategory = document.getElementById('viewer-category');
    const viewerTitle = document.getElementById('viewer-title');
    const btnBackToHome = document.getElementById('btn-back-to-home');
    const btnBackToField = document.getElementById('btn-back-to-field');

    let currentFieldId = null;

    function showUnits(fieldId) {
        const data = coursData[fieldId];
        if (!data) return;

        currentFieldId = fieldId;
        viewerCategory.textContent = data.title;
        viewerTitle.textContent = 'اختر الوحدة';
        btnBackToField.style.display = 'none';

        viewerContent.innerHTML = `
            <div class="units-grid">
                ${data.units.map(unit => `
                    <div class="unit-card" onclick="openLesson('${unit.file}', '${unit.title}', '${fieldId}')">
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

        courseViewer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function getLessonContent(filePath) {
        if (window.LESSON_CONTENT && window.LESSON_CONTENT[filePath]) {
            return window.LESSON_CONTENT[filePath];
        }
        return null;
    }

    window.openLesson = async function(filePath, unitTitle, fieldId) {
        viewerTitle.textContent = unitTitle;
        btnBackToField.style.display = 'block';
        viewerContent.innerHTML = '<div class="loader-container"><div class="loader"></div><p>جاري تحميل الدرس...</p></div>';

        try {
            localStorage.setItem('informatix_last_lesson', JSON.stringify({
                fieldId: fieldId || currentFieldId,
                title: unitTitle,
                file: filePath
            }));
        } catch (e) { /* ignore */ }

        let mdText = getLessonContent(filePath);

        if (!mdText) {
            try {
                const response = await fetch(encodeURI(filePath));
                if (!response.ok) throw new Error('تعذر تحميل الملف');
                mdText = await response.text();
            } catch (fetchErr) {
                viewerContent.innerHTML = `<div class="error-msg">❌ خطأ: تعذر تحميل الدرس. يرجى التأكد من تشغيل الموقع عبر خادم ويب (http://) وليس مباشرة (file://)</div>`;
                return;
            }
        }

         try {
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

            viewerContent.innerHTML = `<div class="md-container"><div class="md-content">${htmlContent}</div></div>`;
            viewerContent.scrollTo({ top: 0, behavior: 'smooth' });
            
            const progressFill = document.getElementById('reading-progress-fill');
            if (progressFill) progressFill.style.width = '0%';
        } catch (err) {
            viewerContent.innerHTML = `<div class="error-msg">❌ خطأ: ${err.message}</div>`;
        }
    };

    if (btnBackToHome) {
        btnBackToHome.addEventListener('click', () => {
            courseViewer.classList.remove('active');
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
                        openLesson(data.file, data.title, data.fieldId);
                    }, 300);
                }
            });

            document.getElementById('btn-dismiss-continue')?.addEventListener('click', () => {
                banner.remove();
                localStorage.removeItem('informatix_last_lesson');
            });
        } catch (e) { /* ignore */ }
    })();
});

