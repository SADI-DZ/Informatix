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

    // --- Course Navigation Logic ---
    const coursData = {
        env: {
            title: 'بيئة التعامل مع الحاسوب',
            units: [
                { id: '01', title: 'تقنية المعلومات', desc: 'مفاهيم أساسية حول تكنولوجيا المعلومات والمجتمع الرقمي.', icon: '💡', tags: ['تقنية', 'معلومات', 'أساسيات'], file: 'content/1- بيئة التعامل مع الحاسوب/01_تقنية_المعلومات.md' },
                { id: '02', title: 'تجميع الحاسوب', desc: 'تعرف على المكونات المادية للحاسوب وكيفية تركيبها.', icon: '🔧', tags: ['هاردوير', 'تركيب', 'عتاد'], file: 'content/1- بيئة التعامل مع الحاسوب/02_تجميع_الحاسوب.md' },
                { id: '03', title: 'نظام التشغيل', desc: 'فهم دور نظام التشغيل وكيفية إدارته للموارد.', icon: '💻', tags: ['ويندوز', 'برمجيات', 'نظام'], file: 'content/1- بيئة التعامل مع الحاسوب/03_نظام_التشغيل.md' },
                { id: '04', title: 'لوحة التحكم', desc: 'تخصيص إعدادات النظام وإدارة الأجهزة والبرامج.', icon: '⚙️', tags: ['إعدادات', 'نظام', 'تحكم'], file: 'content/1- بيئة التعامل مع الحاسوب/04_لوحة_التحكم.md' },
                { id: '05', title: 'حماية الحاسوب', desc: 'طرق تأمين البيانات والحماية من الفيروسات والبرمجيات الضارة.', icon: '🛡️', tags: ['أمن', 'حماية', 'فيروسات'], file: 'content/1- بيئة التعامل مع الحاسوب/05_حماية_الحاسوب.md' },
                { id: '06', title: 'الشبكة المحلية', desc: 'أساسيات الشبكات المحلية وكيفية مشاركة الموارد.', icon: '🔗', tags: ['شبكات', 'إنترنت', 'تواصل'], file: 'content/1- بيئة التعامل مع الحاسوب/06_الشبكة_المحلية.md' }
            ]
        },
        programming: {
            title: 'مدخل إلى البرمجة',
            units: [
                { id: '01', title: 'المخططات الانسيابية', desc: 'تعلم كيفية تمثيل الخوارزميات بيانياً باستخدام الرموز القياسية، الشروط، والحلقات التكرارية.', icon: '📊', tags: ['خوارزمية', 'رسم', 'منطق'], file: 'content/2- مقدمة في البرمجة/01_المخططات_الانسيابية.md' },
                { id: '02', title: 'مدخل إلى الخوارزمية', desc: 'فهم منطق البرمجة وتسلسل التعليمات لحل المشكلات.', icon: '🧠', tags: ['تفكير', 'حل_مشكلات', 'برمجة'], file: 'content/2- مقدمة في البرمجة/03_مدخل_الى_الخوارزمية.md' },
                { id: '03', title: 'التعليمات الأساسية', desc: 'التعرف على المتغيرات، الثوابت، والعمليات الأساسية.', icon: '⌨️', tags: ['متغيرات', 'كود', 'تعليمات'], file: 'content/2- مقدمة في البرمجة/04_التعليمات_الأساسية.md' }
            ]
        },
        web: {
            title: 'تقنيات الويب',
            units: [
                { id: '01', title: 'المتصفح', desc: 'كيف تعمل متصفحات الويب وكيفية تصفح الإنترنت بأمان.', icon: '🌐', file: 'content/3- تقنيات الويب/01_المتصفح.md' },
                { id: '02', title: 'إنشاء صفحة ويب', desc: 'خطواتك الأولى في بناء صفحات الويب باستخدام HTML.', icon: '📝', file: 'content/3- تقنيات الويب/02_إنشاء_صفحة_ويب.md' },
                { id: '03', title: 'أدوات التواصل', desc: 'استكشاف منصات التواصل والتعاون الرقمي الحديثة.', icon: '💬', file: 'content/3- تقنيات الويب/03_استغلال_أدوات_التواصل.md' },
                { id: '04', title: 'البريد الإلكتروني', desc: 'إدارة المراسلات الرسمية واستخدام البريد الإلكتروني بفعالية.', icon: '📧', file: 'content/3- تقنيات الويب/04_البريد_الإلكتروني.md' }
            ]
        },
        office: {
            title: 'المكتبية',
            units: [
                { id: '01', title: 'معالج النصوص 1', desc: 'أساسيات تنسيق النصوص وتحرير المستندات.', icon: '📄', file: 'content/4- المكتبية/معالج_النصوص_1.md' },
                { id: '02', title: 'معالج النصوص 2', desc: 'إدراج الجداول، الصور، وتنسيق الصفحات المتقدم.', icon: '🖼️', file: 'content/4- المكتبية/معالج_النصوص_2.md' },
                { id: '03', title: 'المجدول 1', desc: 'التعرف على واجهة Excel وإجراء الحسابات البسيطة.', icon: '🔢', file: 'content/4- المكتبية/المجدول_1.md' },
                { id: '04', title: 'المجدول 2', desc: 'استخدام الدوال الرياضية والمنطقية والرسوم البيانية.', icon: '📈', file: 'content/4- المكتبية/المجدول_2.md' },
                { id: '05', title: 'العروض التقديمية 1', desc: 'تصميم شرائح فعالة لعرض الأفكار والمشاريع.', icon: '📽️', file: 'content/4- المكتبية/العروض_التقديمية_1.md' },
                { id: '06', title: 'العروض التقديمية 2', desc: 'إضافة الحركات والانتقالات والوسائط المتعددة.', icon: '✨', file: 'content/4- المكتبية/العروض_التقديمية_2.md' }
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
                    <div class="unit-card" onclick="openLesson('${unit.file}', '${unit.title}')">
                        <div class="unit-card-image">
                            <img src="${unit.image || 'assets/images/lessons/circuit-board.png'}" alt="${unit.title}">
                            <div class="badge badge-lesson">درس</div>
                            <div class="badge-icon">${unit.icon}</div>
                        </div>
                        <div class="unit-card-body">
                            <h3 class="unit-card-title">${unit.title}</h3>
                            <p class="unit-card-desc">${unit.desc}</p>
                            
                            <div class="unit-card-meta">
                                <div class="meta-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    <span>السنة الأولى ثانوي</span>
                                </div>
                                <div class="status-badge">قيد الإعداد</div>
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

    window.openLesson = async function(filePath, unitTitle) {
        viewerTitle.textContent = unitTitle;
        btnBackToField.style.display = 'block';
        viewerContent.innerHTML = '<div class="loader-container"><div class="loader"></div><p>جاري تحميل الدرس...</p></div>';

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('تعذر تحميل الملف');
            const mdText = await response.text();
            
            const renderer = new marked.Renderer();
            renderer.blockquote = (quote) => {
                if (quote.includes('[!TIP]')) {
                    return `<div class="alert alert-tip"><div class="alert-title">💡 نصيحة</div>${quote.replace('[!TIP]', '')}</div>`;
                }
                return `<blockquote>${quote}</blockquote>`;
            };

            const htmlContent = marked.parse(mdText, { renderer });
            viewerContent.innerHTML = `<div class="md-container"><div class="md-content">${htmlContent}</div></div>`;
            viewerContent.scrollTo({ top: 0, behavior: 'smooth' });
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
});

