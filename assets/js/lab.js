document.addEventListener('DOMContentLoaded', () => {

    // Particles animation — عدد مخفّض لأداء أفضل على الأجهزة الضعيفة
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
            // إيقاف الحركة عند إخفاء الصفحة لتوفير الموارد
            document.addEventListener('visibilitychange', () => {
                particleAnimations.forEach(a => document.hidden ? a.pause() : a.play());
            });
        }
    }

    // Theme toggle
    const themeCheckbox = document.getElementById('theme-checkbox');
    const body = document.body;
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        html.setAttribute('data-theme', 'light');
        if (themeCheckbox) themeCheckbox.checked = true;
    }

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', () => {
            body.classList.toggle('light-mode');
            if (themeCheckbox.checked) {
                html.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                html.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Scroll-to-top button
    const topBtn = document.getElementById('scroll-to-top');
    const contentArea = document.querySelector('.content-area');
    if (topBtn && contentArea) {
        contentArea.addEventListener('scroll', () => {
            topBtn.style.display = contentArea.scrollTop > 400 ? 'flex' : 'none';
        });
        topBtn.addEventListener('click', () => contentArea.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // --- New Workshop Navigation Logic ---
    const workshopsData = {
        env: [
            { id: 'installer', title: 'محاكي التثبيت', desc: 'تجربة تثبيت نظام تشغيل وهمي خطوة بخطوة وتجربة مراحل الإعداد.', icon: '💻', category: 'بيئة التعامل مع الحاسوب' },
            { id: 'network', title: 'إنشاء الشبكات', desc: 'تصميم وبناء شبكة حاسوبية تفاعلية وربط الأجهزة ببعضها البعض.', icon: '🔗', category: 'بيئة التعامل مع الحاسوب' }
        ],
        programming: [
            { id: 'flowchart', title: 'مصمم المخططات', desc: 'تحويل الخوارزميات المنطقية إلى مخططات انسيابية مرئية تفاعلية.', icon: '📊', category: 'مقدمة في البرمجة' },
            { id: 'code-editor', title: 'محرر الأكواد', desc: 'كتابة وتنفيذ الكود الزائف (Pseudo-code) واختبار المنطق البرمجي.', icon: '⌨️', category: 'مقدمة في البرمجة' }
        ],
        web: [
            { id: 'web-editor', title: 'محرر الويب', desc: 'بناء صفحات ويب حقيقية باستخدام HTML ومعاينتها بشكل مباشر.', icon: '🌐', category: 'تقنيات الويب' }
        ]
    };

    const labHero = document.querySelector('.lab-hero');
    const labStationsSection = document.getElementById('lab-stations');
    const workshopSelection = document.getElementById('workshop-selection');
    const workshopGrid = document.getElementById('workshop-grid');
    const categoryTitle = document.getElementById('selection-category-title');
    const btnBackToHero = document.getElementById('btn-back-to-hero');
    
    const wsFullscreen = document.getElementById('workshop-fullscreen');
    const fsContentArea = document.getElementById('fullscreen-content-area');
    const fsCategory = document.getElementById('fs-category');
    const fsTitle = document.getElementById('fs-title');
    const btnCloseWorkshop = document.getElementById('btn-close-workshop');

    const sidebarItems = document.querySelectorAll('.sidebar-nav li');

    let currentWorkshopParent = null;
    let currentWorkshopElement = null;

    function showWorkshopSelection(categoryId) {
        const data = workshopsData[categoryId];
        if (!data) return;

        // تحديث العناوين
        const categories = { env: 'بيئة التعامل مع الحاسوب', programming: 'مقدمة في البرمجة', web: 'تقنيات الويب' };
        categoryTitle.textContent = categories[categoryId];

        // توليد البطاقات
        workshopGrid.innerHTML = '';
        data.forEach(ws => {
            const card = document.createElement('div');
            card.className = 'workshop-card';
            card.innerHTML = `
                <div class="workshop-icon">${ws.icon}</div>
                <h3>${ws.title}</h3>
                <p>${ws.desc}</p>
            `;
            card.addEventListener('click', () => openWorkshopFullscreen(ws, categoryId));
            workshopGrid.appendChild(card);
        });

        // تبديل الواجهات
        if (labHero) labHero.style.display = 'none';
        if (labStationsSection) labStationsSection.style.display = 'none';
        workshopSelection.style.display = 'block';

        // التمرير للأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openWorkshopFullscreen(ws, categoryId) {
        fsCategory.textContent = ws.category;
        fsTitle.textContent = ws.title;

        // إيجاد محتوى الورشة الأصلي
        let targetId = '';
        if (ws.id === 'installer') targetId = 'subtab-installer';
        if (ws.id === 'network') targetId = 'subtab-network';
        if (ws.id === 'flowchart') targetId = 'subtab-flowchart';
        if (ws.id === 'code-editor') targetId = 'subtab-code-editor';
        if (ws.id === 'web-editor') targetId = 'station-web'; // محطة الويب كاملة

        const originalContent = document.getElementById(targetId);
        if (originalContent) {
            // حفظ المكان الأصلي لنقله لاحقاً
            currentWorkshopParent = originalContent.parentElement;
            currentWorkshopElement = originalContent;
            
            // نقل المحتوى للنافذة الكاملة
            fsContentArea.appendChild(originalContent);
            
            // التأكد من أن المحتوى ظاهر (في حال كان في تبويب غير نشط)
            originalContent.style.display = 'block';
            originalContent.classList.add('active');
            
            // تفعيل النافذة الكاملة
            wsFullscreen.classList.add('active');
            document.body.style.overflow = 'hidden'; // منع التمرير في الخلفية
            
            // تحديث محاكي الويب إذا كان هو المختار
            if (ws.id === 'web-editor') {
                 // تأخير بسيط لضمان تحميل الـ iframe بعد النقل
                setTimeout(() => {
                    const htmlEditor = document.getElementById('html-editor-textarea');
                    if (htmlEditor) {
                        const event = new Event('input');
                        htmlEditor.dispatchEvent(event);
                    }
                }, 100);
            }
        }
    }

    function closeWorkshop() {
        if (currentWorkshopElement && currentWorkshopParent) {
            // إعادة المحتوى لمكانه الأصلي
            currentWorkshopParent.appendChild(currentWorkshopElement);
            
            // استعادة الحالة الأصلية للعرض (إذا لم تكن هي النشطة برمجياً)
            // ملاحظة: النظام القديم يعتمد على .active للتبويبات
            if (!currentWorkshopElement.id.startsWith('station-')) {
                // إذا كان تبويب، نتركه كما هو أو نعيده لحالته
            }
        }

        wsFullscreen.classList.remove('active');
        document.body.style.overflow = '';
        currentWorkshopElement = null;
        currentWorkshopParent = null;
    }

    if (btnBackToHero) {
        btnBackToHero.addEventListener('click', () => {
            workshopSelection.style.display = 'none';
            if (labHero) {
                labHero.style.display = 'flex';
                // إعادة تشغيل الأنيميشن إذا لزم الأمر
                labHero.classList.remove('fadeIn');
                void labHero.offsetWidth; // Force reflow
                labHero.classList.add('fadeIn');
            }
            if (labStationsSection) labStationsSection.style.display = 'none';
            
            // إزالة النشاط من القائمة الجانبية
            sidebarItems.forEach(item => item.classList.remove('active'));
        });
    }

    if (btnCloseWorkshop) {
        btnCloseWorkshop.addEventListener('click', closeWorkshop);
    }

    // تعديل وظيفة تنشيط المحطة لتعمل مع النظام الجديد
    function activateStation(id) {
        // بدلاً من فتح الأكورديون، نفتح واجهة اختيار الورشات
        showWorkshopSelection(id);
        
        // تحديث القائمة الجانبية
        sidebarItems.forEach(item => {
            item.classList.toggle('active', item.dataset.station === id);
        });
    }

    // الانتقال بين المحطات من القائمة الجانبية
    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.dataset.station) {
                activateStation(item.dataset.station);
            }
        });
    });

    // تنشيط من خلال البطاقات الرئيسية أيضاً
    const stationCards = document.querySelectorAll('.station-card');
    stationCards.forEach(card => {
        const header = card.querySelector('.station-header');
        if (header) {
            header.addEventListener('click', () => {
                const id = card.id.replace('station-', '');
                activateStation(id);
            });
        }
    });

    const stationToggles = document.querySelectorAll('.station-toggle');
    stationToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            activateStation(btn.dataset.station);
        });
    });

    const stationDots = document.querySelectorAll('.station-dot');
    stationDots.forEach(dot => {
        dot.addEventListener('click', () => activateStation(dot.dataset.station));
    });

    // إخفاء الأكورديون الأصلي لأنه لم يعد مطلوباً في التصميم الجديد
    // لكن نتركه في الـ HTML كـ "مخزن" للمحتوى
    if (labStationsSection) {
        // labStationsSection.style.display = 'none'; 
    }

    // Installer simulator setup
    const installSteps = [
        { icon: '💾', title: 'التحضير', text: 'تحميل ملفات التثبيت...' },
        { icon: '⚙️', title: 'الإقلاع', text: 'الإقلاع من وسيط التثبيت...' },
        { icon: '📋', title: 'الترخيص', text: 'الموافقة على شروط الترخيص...' },
        { icon: '💿', title: 'التهيئة', text: 'تهيئة القرص الصلب...' },
        { icon: '📂', title: 'نسخ الملفات', text: 'نسخ ملفات النظام...' },
        { icon: '🔧', title: 'الإعدادات', text: 'تطبيق إعدادات المستخدم...' },
        { icon: '🚀', title: 'اكتمال التثبيت', text: 'تم تثبيت النظام بنجاح!' }
    ];

    let installStep = -1;

    const installStepsEl = document.getElementById('installer-steps');
    const installContent = document.getElementById('installer-content');
    const installProgress = document.getElementById('installer-progress');
    const installPrev = document.getElementById('installer-prev');
    const installNext = document.getElementById('installer-next');
    const installReset = document.getElementById('installer-reset');

    function renderInstallSteps() {
        if (!installStepsEl) return;
        installStepsEl.innerHTML = '';
        installSteps.forEach((step, i) => {
            const div = document.createElement('div');
            div.className = `installer-step${i === installStep ? ' active' : ''}${i < installStep ? ' done' : ''}`;
            div.innerHTML = `<span class="step-dot"></span> ${step.title}`;
            installStepsEl.appendChild(div);
        });
    }

    function updateInstaller() {
        renderInstallSteps();
        if (!installContent) return;
        
        if (installStep < 0) {
            installContent.innerHTML = `
                <div class="installer-icon">💻</div>
                <h3 class="installer-title">مرحباً بك في مثبت النظام</h3>
                <p class="installer-text">انقر "بدء التثبيت" لمحاكاة عملية تثبيت نظام التشغيل</p>
            `;
            if (installProgress) installProgress.style.width = '0%';
            if (installPrev) installPrev.disabled = true;
            if (installNext) {
                installNext.textContent = 'بدء التثبيت';
                installNext.style.display = '';
            }
            if (installReset) installReset.style.display = 'none';
            return;
        }
        if (installStep >= installSteps.length) {
            installContent.innerHTML = `
                <div class="installer-icon" style="font-size:4rem">✅</div>
                <h3 class="installer-title" style="color:#10b981">اكتمل التثبيت بنجاح!</h3>
                <p class="installer-text">تم تثبيت نظام التشغيل. يرجى إعادة تشغيل الحاسوب.</p>
            `;
            if (installProgress) installProgress.style.width = '100%';
            if (installPrev) installPrev.disabled = true;
            if (installNext) installNext.style.display = 'none';
            if (installReset) installReset.style.display = '';
            return;
        }
        const step = installSteps[installStep];
        installContent.innerHTML = `
            <div class="installer-icon" style="font-size:4rem">${step.icon}</div>
            <h3 class="installer-title">${step.title}</h3>
            <p class="installer-text">${step.text}</p>
        `;
        const progress = Math.round(((installStep + 1) / installSteps.length) * 100);
        if (installProgress) installProgress.style.width = progress + '%';
        if (installPrev) installPrev.disabled = installStep <= 0;
        if (installNext) {
            installNext.textContent = installStep < installSteps.length - 1 ? 'التالي' : 'إنهاء';
            installNext.style.display = '';
        }
        if (installReset) installReset.style.display = 'none';
    }

    if (installNext) {
        installNext.addEventListener('click', () => {
            if (installStep < 0) { installStep = 0; }
            else if (installStep < installSteps.length) { installStep++; }
            updateInstaller();
        });
    }
    if (installPrev) {
        installPrev.addEventListener('click', () => {
            if (installStep > 0) installStep--;
            updateInstaller();
        });
    }
    if (installReset) {
        installReset.addEventListener('click', () => {
            installStep = -1;
            updateInstaller();
        });
    }

    // Network simulator
    const netCanvas = document.getElementById('network-canvas');
    const netDeviceCount = document.getElementById('net-device-count');
    const netLinkCount = document.getElementById('net-link-count');
    const netClear = document.getElementById('net-clear');
    const netLinkModeBtn = document.getElementById('net-link-mode');

    let netDevices = [];
    let netLinks = [];
    let dragDevice = null;
    let dragOffset = { x: 0, y: 0 };
    let isLinking = false;
    let linkStart = null;
    let selectedDevice = null;

    const deviceIcons = { pc: '💻', server: '🖥️', switch: '🔀', router: '📡' };
    const deviceColors = { pc: '#4facfe', server: '#10b981', switch: '#f59e0b', router: '#a78bfa' };

    function updateLinkModeUI() {
        if (netLinkModeBtn) {
            netLinkModeBtn.classList.toggle('active', isLinking);
            netLinkModeBtn.style.background = isLinking ? 'var(--blue-primary)' : '';
            netLinkModeBtn.style.color = isLinking ? '#fff' : '';
        }
        if (netCanvas) {
            netCanvas.style.cursor = isLinking ? 'crosshair' : '';
        }
    }

    function renderNet() {
        if (!netCanvas) return;
        netCanvas.innerHTML = '';

        // رسم الوصلات
        netLinks.forEach(link => {
            const from = netDevices[link.from];
            const to = netDevices[link.to];
            if (!from || !to) return;
            const line = document.createElement('div');
            line.className = 'net-link';
            const x1 = from.x + 30, y1 = from.y + 20;
            const x2 = to.x + 30, y2 = to.y + 20;
            const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            line.style.cssText = `position:absolute;left:${x1}px;top:${y1}px;width:${length}px;height:2px;transform-origin:0 0;transform:rotate(${angle}deg);background:linear-gradient(90deg,var(--blue-primary),#10b981);z-index:1;pointer-events:none;`;
            netCanvas.appendChild(line);
        });

        // رسم الأجهزة
        netDevices.forEach((dev, idx) => {
            const el = document.createElement('div');
            const isSelected = selectedDevice === idx;
            const isLinkSource = isLinking && linkStart === idx;
            el.className = `net-device${isSelected ? ' selected' : ''}${isLinkSource ? ' link-source' : ''}`;
            el.dataset.index = idx;
            el.style.cssText = `position:absolute;left:${dev.x}px;top:${dev.y}px;border:2px solid ${isLinkSource ? '#fff' : deviceColors[dev.type]};background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;display:flex;flex-direction:column;align-items:center;cursor:${isLinking ? 'crosshair' : 'grab'};z-index:2;transition:border-color 0.2s;`;
            el.innerHTML = `<span style="font-size:1.5rem">${deviceIcons[dev.type]}</span><span class="net-device-label">${dev.name}</span>`;

            // بدء السحب (ماوس + لمس)
            function startDrag(clientX, clientY) {
                if (isLinking) return;
                dragDevice = idx;
                dragOffset.x = clientX - dev.x;
                dragOffset.y = clientY - dev.y;
            }
            el.addEventListener('mousedown', (e) => { e.stopPropagation(); startDrag(e.clientX, e.clientY); });
            el.addEventListener('touchstart', (e) => {
                e.preventDefault(); e.stopPropagation();
                const t = e.touches[0];
                startDrag(t.clientX, t.clientY);
            }, { passive: false });

            // النقر للتحديد أو الربط
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isLinking) {
                    if (linkStart === null) {
                        linkStart = idx;
                    } else if (linkStart !== idx) {
                        addLink(linkStart, idx);
                        linkStart = null;
                        isLinking = false;
                        updateLinkModeUI();
                    }
                    renderNet();
                    return;
                }
                selectedDevice = selectedDevice === idx ? null : idx;
                renderNet();
            });
            netCanvas.appendChild(el);
        });

        if (netDeviceCount) netDeviceCount.textContent = netDevices.length;
        if (netLinkCount) netLinkCount.textContent = netLinks.length;
    }

    function addLink(from, to) {
        if (from === to) return;
        const exists = netLinks.some(l => (l.from === from && l.to === to) || (l.from === to && l.to === from));
        if (!exists) netLinks.push({ from, to });
    }

    // أحداث السحب العامة (ماوس + لمس)
    function onDragMove(clientX, clientY) {
        if (dragDevice === null || !netCanvas) return;
        const rect = netCanvas.getBoundingClientRect();
        netDevices[dragDevice].x = Math.max(0, Math.min(clientX - rect.left - dragOffset.x, netCanvas.clientWidth - 70));
        netDevices[dragDevice].y = Math.max(0, Math.min(clientY - rect.top - dragOffset.y, netCanvas.clientHeight - 50));
        renderNet();
    }
    function onDragEnd() { dragDevice = null; }

    if (netCanvas) {
        document.addEventListener('mousemove', (e) => onDragMove(e.clientX, e.clientY));
        document.addEventListener('touchmove', (e) => {
            if (dragDevice === null) return;
            e.preventDefault();
            onDragMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchend', onDragEnd);

        netCanvas.addEventListener('click', (e) => {
            if (e.target === netCanvas) {
                selectedDevice = null;
                if (isLinking) { isLinking = false; linkStart = null; updateLinkModeUI(); }
                renderNet();
            }
        });
    }

    // زر وضع الربط
    if (netLinkModeBtn) {
        netLinkModeBtn.addEventListener('click', () => {
            isLinking = !isLinking;
            linkStart = null;
            updateLinkModeUI();
            renderNet();
        });
    }

    // إضافة الأجهزة
    document.querySelectorAll('.net-device-btn[data-device]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!netCanvas) return;
            const type = btn.dataset.device;
            const count = netDevices.filter(d => d.type === type).length;
            const names = {pc: 'حاسوب', server: 'خادم', switch: 'مبدل', router: 'موجه'};
            const x = 20 + Math.random() * (netCanvas.clientWidth - 100);
            const y = 20 + Math.random() * (netCanvas.clientHeight - 80);
            netDevices.push({ type, name: `${names[type]} ${count + 1}`, x, y });
            renderNet();
        });
    });

    if (netClear) {
        netClear.addEventListener('click', () => {
            netDevices = []; netLinks = [];
            selectedDevice = null; isLinking = false; linkStart = null;
            updateLinkModeUI();
            renderNet();
        });
    }

    // Flowchart designer setup
    const flowData = {
        max: {
            steps: [
                { icon: 'terminal', text: 'بداية' },
                { icon: 'io', text: 'أدخل العددين A, B' },
                { icon: 'process', text: 'Max ← A' },
                { icon: 'decision', text: 'هل B > Max؟' },
                { icon: 'process', text: 'Max ← B' },
                { icon: 'io', text: 'أظهر Max' },
                { icon: 'terminal', text: 'نهاية' }
            ],
            code: `بداية\n  اقرأ A, B\n  Max ← A\n  إذا B > Max:\n      Max ← B\n  اطبع Max\nنهاية`
        },
        fact: {
            steps: [
                { icon: 'terminal', text: 'بداية' },
                { icon: 'io', text: 'أدخل N' },
                { icon: 'process', text: 'F ← 1, I ← 1' },
                { icon: 'decision', text: 'I ≤ N؟' },
                { icon: 'process', text: 'F ← F × I' },
                { icon: 'process', text: 'I ← I + 1' },
                { icon: 'io', text: 'أظهر F' },
                { icon: 'terminal', text: 'نهاية' }
            ],
            code: `بداية\n  اقرأ N\n  F ← 1, I ← 1\n  طالما I ≤ N:\n      F ← F × I\n      I ← I + 1\n  اطبع F\nنهاية`
        },
        prime: {
            steps: [
                { icon: 'terminal', text: 'بداية' },
                { icon: 'io', text: 'أدخل N' },
                { icon: 'process', text: 'P ← "أولي", I ← 2' },
                { icon: 'decision', text: 'I < N؟' },
                { icon: 'decision', text: 'N % I = 0؟' },
                { icon: 'process', text: 'P ← "غير أولي"' },
                { icon: 'process', text: 'I ← I + 1' },
                { icon: 'io', text: 'أظهر P' },
                { icon: 'terminal', text: 'نهاية' }
            ],
            code: `بداية\n  اقرأ N\n  P ← "أولي"\n  I ← 2\n  طالما I < N:\n      إذا N % I = 0:\n          P ← "غير أولي"\n      I ← I + 1\n  اطبع P\nنهاية`
        }
    };

    let curAlgo = 'max';
    let curStep = 0;

    const algoPills = document.querySelectorAll('.algo-pill');
    const flowTrack = document.getElementById('flowchart-steps');
    const flowPrev = document.getElementById('flowchart-prev');
    const flowNext = document.getElementById('flowchart-next');
    const flowInd = document.getElementById('flowchart-step-indicator');
    const flowCode = document.getElementById('flowchart-code-display');

    function renderFlow() {
        if (!flowTrack) return;
        const data = flowData[curAlgo];
        if (!data) return;
        flowTrack.innerHTML = '';
        data.steps.forEach((step, i) => {
            if (i > curStep) return;

            if (i > 0) {
                const arrow = document.createElement('div');
                arrow.className = 'fc-line';
                flowTrack.appendChild(arrow);
            }

            const div = document.createElement('div');
            div.className = `fc-node fc-${step.icon}${i === curStep ? ' active' : ''}`;
            div.innerHTML = step.icon === 'io' ? `<span class="unskew">${step.text}</span>` : step.text;
            flowTrack.appendChild(div);
        });

        // تمييز السطر النشط في لوحة الكود
        if (flowCode) {
            const lines = data.code.split('\n');
            flowCode.innerHTML = lines.map((line, i) =>
                `<span class="${i === curStep ? 'code-line-active' : ''}">${line}</span>`
            ).join('\n');
        }

        if (flowInd) flowInd.textContent = `${curStep + 1} / ${data.steps.length}`;
        if (flowPrev) flowPrev.disabled = curStep <= 0;
        if (flowNext) flowNext.disabled = curStep >= data.steps.length - 1;
    }

    if (flowNext) flowNext.addEventListener('click', () => {
        if (curStep < flowData[curAlgo].steps.length - 1) { curStep++; renderFlow(); }
    });
    if (flowPrev) flowPrev.addEventListener('click', () => {
        if (curStep > 0) { curStep--; renderFlow(); }
    });

    algoPills.forEach(btn => {
        btn.addEventListener('click', () => {
            algoPills.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            curAlgo = btn.dataset.algo;
            curStep = 0;
            renderFlow();
        });
    });

    if (algoPills.length) renderFlow();

    // --- محرر الأكواد — مفسّر كود زائف حقيقي ---
    const codeEditorArea = document.getElementById('code-editor-textarea');
    const codeRunBtn = document.getElementById('code-run-btn');
    const codeOutput = document.getElementById('output-content');

    // تقييم تعبير رياضي بسيط باستخدام المتغيرات
    function evalExpr(expr, vars) {
        let e = expr.trim();
        // استبدال أسماء المتغيرات بقيمها (الأطول أولاً لتجنب الاستبدال الجزئي)
        const sorted = Object.keys(vars).sort((a, b) => b.length - a.length);
        sorted.forEach(v => { e = e.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v]); });
        // تحويل العمليات العربية
        e = e.replace(/×/g, '*').replace(/÷/g, '/');
        try { return Function('"use strict"; return (' + e + ')')(); }
        catch { return e; }
    }

    function executePseudo(code) {
        const vars = {};
        const output = [];
        const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

        for (const line of lines) {
            if (line.startsWith('اقرأ')) {
                const varNames = line.replace('اقرأ', '').split(',').map(v => v.trim());
                for (const vn of varNames) {
                    const val = prompt(`⌨️ أدخل قيمة ${vn}:`);
                    if (val === null) return ['⚠️ تم إلغاء التنفيذ'];
                    vars[vn] = isNaN(val) ? val : Number(val);
                }
            } else if (line.includes('←')) {
                const [left, right] = line.split('←').map(s => s.trim());
                // دعم التعيين المتعدد: F ← 1, I ← 1
                if (right.includes(',') && right.includes('←')) {
                    const parts = line.split(',').map(s => s.trim());
                    parts.forEach(p => {
                        const [l, r] = p.split('←').map(s => s.trim());
                        vars[l] = evalExpr(r, vars);
                    });
                } else {
                    vars[left] = evalExpr(right, vars);
                }
            } else if (line.startsWith('اطبع') || line.startsWith('أظهر')) {
                const varName = line.replace(/^(اطبع|أظهر)\s*/, '').trim();
                const val = vars[varName] !== undefined ? vars[varName] : evalExpr(varName, vars);
                output.push(`> ${val}`);
            }
        }
        return output.length ? output : ['> تم التنفيذ بنجاح (بدون مخرجات)'];
    }

    if (codeRunBtn && codeEditorArea) {
        codeRunBtn.addEventListener('click', () => {
            if (!codeOutput) return;
            codeOutput.textContent = 'جاري التنفيذ...';
            codeOutput.style.color = 'var(--text-secondary)';
            setTimeout(() => {
                try {
                    const results = executePseudo(codeEditorArea.value);
                    codeOutput.textContent = results.join('\n');
                    codeOutput.style.color = results[0].includes('⚠️') ? '#f59e0b' : '#10b981';
                } catch (err) {
                    codeOutput.textContent = `❌ خطأ: ${err.message}`;
                    codeOutput.style.color = '#ef4444';
                }
            }, 300);
        });
    }

    // ============================================================
    // HTML editor — مع debounce لتحسين الأداء
    const htmlEditor = document.getElementById('html-editor-textarea');
    const htmlRunBtn = document.getElementById('html-run-btn');
    const htmlPreview = document.getElementById('html-preview-iframe');
    let htmlDebounceTimer;

    function updateHtmlPreview() {
        if (!htmlPreview || !htmlEditor) return;
        const html = htmlEditor.value;
        const doc = htmlPreview.contentDocument || htmlPreview.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    }

    if (htmlRunBtn && htmlEditor) {
        htmlRunBtn.addEventListener('click', updateHtmlPreview);
        htmlEditor.addEventListener('input', () => {
            clearTimeout(htmlDebounceTimer);
            htmlDebounceTimer = setTimeout(updateHtmlPreview, 300);
        });
    }

    if (htmlPreview && htmlEditor) {
        setTimeout(updateHtmlPreview, 500);
    }

    // Typing effect for lab subtitle
    const typingEl = document.getElementById('lab-typing');
    if (typingEl) {
        const texts = [
            'بيئة تفاعلية لتجربة المفاهيم البرمجية',
            'حيث تلتقي النظرية بالتطبيق',
            'مختبر رقمي لاستكشاف عالم المعلوماتية'
        ];
        let textIdx = 0;
        let charIdx = 0;
        let isDeleting = false;

        function typeLoop() {
            const current = texts[textIdx];
            if (!isDeleting) {
                typingEl.textContent = current.substring(0, charIdx + 1);
                charIdx++;
                if (charIdx === current.length) {
                    isDeleting = true;
                    setTimeout(typeLoop, 2000);
                } else {
                    setTimeout(typeLoop, 50);
                }
            } else {
                typingEl.textContent = current.substring(0, charIdx);
                charIdx--;
                if (charIdx < 0) {
                    isDeleting = false;
                    textIdx = (textIdx + 1) % texts.length;
                    setTimeout(typeLoop, 500);
                } else {
                    setTimeout(typeLoop, 30);
                }
            }
        }
        typeLoop();
    }
});
