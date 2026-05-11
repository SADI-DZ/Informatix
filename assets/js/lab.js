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
        const categories = { 
            env: 'بيئة التعامل مع الحاسوب', 
            programming: 'مقدمة في البرمجة', 
            web: 'تقنيات الويب',
            office: 'المكتبية'
        };
        categoryTitle.textContent = categories[categoryId] || 'المجال';

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
                setTimeout(() => {
                    const htmlEditorTA = document.getElementById('html-codeTextarea');
                    if (htmlEditorTA) {
                        htmlEditorTA.dispatchEvent(new Event('input'));
                    }
                }, 100);
            }
        }
    }

    function closeWorkshop() {
        if (currentWorkshopElement && currentWorkshopParent) {
            // إعادة المحتوى لمكانه الأصلي
            currentWorkshopParent.appendChild(currentWorkshopElement);
            
            // إعادة العناصر الإضافية لمحرر HTML لمكانها في station-workspace
            if (currentWorkshopElement.id === 'station-web') {
                const stationWs = currentWorkshopElement.querySelector('.station-workspace');
                if (stationWs) {
                    ['htmlEditorToast','html-errorPanel','htmlEditorFileInput'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el && el.parentNode !== stationWs) stationWs.appendChild(el);
                    });
                }
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
    // نتركه في الـ HTML كمخزن للمحتوى فقط

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
    // HTML Editor Advanced — دمـج من html-editor.html
    // ==================== CONSTANTS ====================
    const HTML_TAGS = [
        'html','head','body','title','meta','link','script',
        'div','span','p','h1','h2','h3','h4','h5','h6',
        'a','img','ul','ol','li','table','caption','colgroup','col','thead','tbody','tfoot','tr','td','th',
        'form','input','button','select','option','optgroup','textarea','label','fieldset','legend',
        'header','footer','nav','section','article','aside','main','figure','figcaption',
        'mark','time','progress','meter','details','summary','dialog','data',
        'video','audio','source','track','canvas','svg','iframe','embed','object','param',
        'br','hr','strong','em','b','i','u','s','small','sub','sup','code','pre',
        'blockquote','q','cite','dfn','abbr','kbd','samp','var','del','ins',
        'dl','dt','dd','ruby','rt','rp','wbr',
        'noscript','template','slot','address','hgroup','bdi','bdo',
        'output','progress','meter','details','summary','menu'
    ].sort();

    const VOID_ELEMENTS = new Set([
        'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'
    ]);

    const ATTRS_BY_TAG = {
        a:['href','target','rel','download','hreflang','type'],
        img:['src','alt','width','height'],
        input:['type','name','value','placeholder','required','disabled','readonly','min','max','step','pattern','autocomplete'],
        form:['action','method','enctype','target','novalidate'],
        link:['rel','href','type'],
        script:['src','type','defer','async'],
        meta:['name','content','charset','http-equiv'],
        video:['src','controls','autoplay','loop','muted','poster','width','height'],
        audio:['src','controls','autoplay','loop','muted'],
        td:['colspan','rowspan','headers'], th:['colspan','rowspan','headers','scope','abbr'],
        iframe:['src','width','height','sandbox','allow','allowfullscreen','loading'],
        canvas:['width','height'],   source:['src','type'],
        track:['src','kind','srclang','label','default'],
        label:['for','form'], textarea:['name','rows','cols','placeholder','required','disabled'],
        select:['name','multiple','required','size'], option:['value','selected','disabled'],
        button:['type','name','value','disabled','form'], optgroup:['label','disabled'],
        ol:['type','start','reversed'], ul:['type'],
        col:['span'], colgroup:['span'], table:['summary'],
        details:['open'], dialog:['open'], progress:['value','max'], meter:['value','min','max','low','high','optimum']
    };
    const GLOBAL_ATTRS = ['id','title','lang','dir','hidden','tabindex','style'];

    // ==================== DOM REFS ====================
    const htmlTA = document.getElementById('html-codeTextarea');
    const htmlHL = document.getElementById('html-highlightLayer');
    const htmlLN = document.getElementById('html-lineNumbers');
    const htmlPF = document.getElementById('html-previewFrame');
    const htmlPP = document.getElementById('html-previewPlaceholder');
    const htmlSB = document.getElementById('html-suggestionsBox');
    const htmlEP = document.getElementById('html-errorPanel');
    const htmlEL = document.getElementById('html-errorList');
    const htmlEC = document.getElementById('html-errorCount');
    const htmlET = document.getElementById('html-errorTitle');
    const htmlLI = document.getElementById('html-lineInfo');
    const htmlST = document.getElementById('html-statusText');
    const htmlSD = document.getElementById('html-statusDot');
    const htmlES = document.getElementById('html-errorStatus');

    // ==================== STATE ====================
    let htmlSugIndex = -1;
    let htmlSugType = '';
    let htmlSugActive = false;
    let htmlIsComposing = false;
    let htmlErrorLines = new Set();

    // ==================== SYNTAX HIGHLIGHTING ====================
    function htmlEscape(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function htmlHighlight(code) {
        if (!code) return '';
        const escaped = htmlEscape(code);
        return escaped.replace(
            /(&lt;!--[\s\S]*?--&gt;)|(&lt;!DOCTYPE\s+html&gt;)|(&lt;\/?)([\w-]+)|(\s+)([\w-]+)(=)(?=&quot;|')|(&quot;(?:[^&]|&(?!quot;))*?&quot;|'[^']*?')|(&amp;\w+;)/gi,
            (m, comment, doctype, tagStart, tagName, before, attr, eq, str, entity) => {
                if (comment) return `<span class="hl-comment">${comment}</span>`;
                if (doctype) return `<span class="hl-doctype">${doctype}</span>`;
                if (tagStart && tagName) return `${tagStart}<span class="hl-tag-name">${tagName}</span>`;
                if (attr && eq) return `${before}<span class="hl-attr">${attr}</span>${eq}`;
                if (str) return `<span class="hl-string">${str}</span>`;
                if (entity) return `<span class="hl-entity">${entity}</span>`;
                return m;
            }
        );
    }

    function htmlUpdateHighlight() {
        if (htmlHL && htmlTA) htmlHL.innerHTML = htmlHighlight(htmlTA.value) + '\n';
    }

    function htmlUpdateLineNumbers() {
        if (!htmlLN || !htmlTA) return;
        const lines = htmlTA.value.split('\n');
        const nums = lines.map((_, i) => {
            const n = i + 1;
            return htmlErrorLines.has(n) ? `<span class="error-line">${n}</span>` : n;
        }).join('\n');
        htmlLN.innerHTML = nums;
    }

    // ==================== CURSOR / CONTEXT ====================
    function htmlUpdateCursorInfo() {
        if (!htmlTA || !htmlLI) return;
        const pos = htmlTA.selectionStart;
        const before = htmlTA.value.substring(0, pos);
        const lines = before.split('\n');
        htmlLI.textContent = `السطر ${lines.length}، العمود ${lines[lines.length-1].length + 1}`;
    }

    function htmlGetTagContext() {
        if (!htmlTA) return null;
        const pos = htmlTA.selectionStart;
        const before = htmlTA.value.substring(0, pos);
        const lastOpen = before.lastIndexOf('<');
        const lastClose = before.lastIndexOf('>');
        if (lastOpen === -1 || lastOpen < lastClose) return null;
        const inside = before.substring(lastOpen);
        const m = inside.match(/^<\s*([\w-]*)$/);
        return m ? m[1] : null;
    }

    function htmlIsInsideString(tagContent) {
        let inStr = false, strChar = '';
        for (const ch of tagContent) {
            if (inStr) { if (ch === strChar) { inStr = false; strChar = ''; } }
            else if (ch === '"' || ch === "'") { inStr = true; strChar = ch; }
        }
        return inStr;
    }

    function htmlGetAttrContext() {
        if (!htmlTA) return null;
        const pos = htmlTA.selectionStart;
        const before = htmlTA.value.substring(0, pos);
        const lastOpen = before.lastIndexOf('<');
        const lastClose = before.lastIndexOf('>');
        if (lastOpen === -1 || lastOpen < lastClose) return null;
        const inside = before.substring(lastOpen);
        const tagMatch = inside.match(/^<\s*(\w[\w-]*)/);
        if (!tagMatch) return null;
        const tagName = tagMatch[1].toLowerCase();
        const afterTag = inside.substring(tagMatch[0].length);
        if (!/\S/.test(afterTag.trimLeft())) return null;
        if (htmlIsInsideString(afterTag)) return null;
        const attrPrefix = (afterTag.match(/\s+([\w-]*)$/) || [,''])[1];
        if (attrPrefix === '' && afterTag.trim().length > 0 && !afterTag.endsWith(' ')) return null;
        return { tagName, attrPrefix };
    }

    function htmlGetCursorCoords() {
        if (!htmlTA) return { top: 0, left: 0 };
        const s = getComputedStyle(htmlTA);
        const lh = parseFloat(s.lineHeight);
        const fs = parseFloat(s.fontSize);
        const cw = fs * 0.61;
        const pos = htmlTA.selectionStart;
        const before = htmlTA.value.substring(0, pos);
        const lines = before.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length;
        return {
            top: (line - 1) * lh + 16 - htmlTA.scrollTop,
            left: col * cw + 16 - htmlTA.scrollLeft,
            line, col
        };
    }

    // ==================== SUGGESTIONS ====================
    function htmlShowSuggestions() {
        if (!htmlTA || !htmlSB) return;
        const tagPrefix = htmlGetTagContext();
        const attrCtx = tagPrefix === null ? htmlGetAttrContext() : null;

        let items = [], type = '';

        if (tagPrefix !== null) {
            type = 'tag';
            items = HTML_TAGS.filter(t => t.startsWith(tagPrefix.toLowerCase())).slice(0, 25);
        } else if (attrCtx) {
            type = 'attr';
            const specific = ATTRS_BY_TAG[attrCtx.tagName] || [];
            const all = [...new Set([...specific, ...GLOBAL_ATTRS])];
            items = all.filter(a => a.startsWith(attrCtx.attrPrefix)).slice(0, 20);
        }

        if (!items.length) { htmlHideSuggestions(); return; }

        htmlSB.innerHTML = `<div class="sug-header">${type === 'tag' ? 'الوسوم المقترحة' : 'الخصائص المقترحة'}</div>`;
        const frag = document.createDocumentFragment();
        items.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'sug-item' + (i === 0 ? ' active' : '');
            div.dataset.value = item; div.dataset.type = type;
            div.innerHTML = type === 'tag'
                ? `<span class="sug-tag">&lt;${item}&gt;</span><span class="sug-desc">وسم HTML</span>`
                : `<span class="sug-tag">${item}</span><span class="sug-desc">خاصية</span>`;
            div.onclick = () => htmlInsertSuggestion(item, type);
            div.onmouseenter = () => {
                htmlSB.querySelectorAll('.sug-item').forEach(e => e.classList.remove('active'));
                div.classList.add('active'); htmlSugIndex = i;
            };
            frag.appendChild(div);
        });
        htmlSB.appendChild(frag);

        htmlSugIndex = 0; htmlSugType = type; htmlSugActive = true;
        htmlSB.classList.add('show');

        const coords = htmlGetCursorCoords();
        const wrapper = htmlTA.closest('.code-wrapper');
        htmlSB.style.left = Math.min(coords.left, wrapper.clientWidth - 230) + 'px';
        htmlSB.style.top = Math.max(0, coords.top + parseFloat(getComputedStyle(htmlTA).lineHeight)) + 'px';
    }

    function htmlHideSuggestions() {
        if (!htmlSB) return;
        htmlSB.classList.remove('show');
        htmlSugActive = false; htmlSugIndex = -1; htmlSugType = '';
    }

    function htmlInsertSuggestion(value, type) {
        if (!htmlTA) return;
        const pos = htmlTA.selectionStart;
        const val = htmlTA.value;
        const before = val.substring(0, pos);
        const after = val.substring(pos);

        if (type === 'tag') {
            const m = before.match(/(<[\w-]*)$/);
            if (m) {
                const newBefore = before.substring(0, before.length - m[0].length) + '<' + value;
                htmlTA.value = newBefore + after;
                const newPos = newBefore.length;
                htmlTA.setSelectionRange(newPos, newPos);
                if (!VOID_ELEMENTS.has(value)) {
                    const ins = '></' + value + '>';
                    htmlTA.value = htmlTA.value.substring(0, newPos) + ins + htmlTA.value.substring(newPos);
                    htmlTA.setSelectionRange(newPos, newPos);
                }
                htmlTriggerUpdate();
            }
        } else if (type === 'attr') {
            const m = before.match(/([\w-]*)$/);
            if (m) {
                const newBefore = before.substring(0, before.length - m[1].length) + value + '=""';
                htmlTA.value = newBefore + after;
                htmlTA.setSelectionRange(newBefore.length - 1, newBefore.length - 1);
                htmlTA.focus();
                htmlTriggerUpdate();
            }
        }
        htmlHideSuggestions();
    }

    // ==================== AUTO-CLOSE & INDENT ====================
    function htmlHandleAutoClose() {
        if (!htmlTA) return false;
        const pos = htmlTA.selectionStart;
        const before = htmlTA.value.substring(0, pos);
        const m = before.match(/<(\w[\w-]*)([\s>])$/);
        if (m && m[2] === '>' && !VOID_ELEMENTS.has(m[1].toLowerCase())) {
            const tagName = m[1].toLowerCase();
            const after = htmlTA.value.substring(pos);
            htmlTA.value = before + '</' + tagName + '>' + after;
            htmlTA.setSelectionRange(pos, pos);
            htmlTriggerUpdate();
            return true;
        }
        return false;
    }

    function htmlHandleAutoIndent(e) {
        if (!htmlTA) return;
        const pos = htmlTA.selectionStart;
        const val = htmlTA.value;
        const lines = val.substring(0, pos).split('\n');
        const currentLine = lines[lines.length - 1];
        const indent = currentLine.match(/^(\s*)/)[1];
        const above = lines.length >= 2 ? lines[lines.length - 2].trim() : '';

        let extra = '';
        if (above.endsWith('>') && !above.startsWith('</') && !above.endsWith('/>') && !above.endsWith('-->')) {
            extra = '  ';
        }

        e.preventDefault();
        const end = htmlTA.selectionEnd;
        htmlTA.value = val.substring(0, pos) + '\n' + indent + extra + val.substring(end);
        htmlTA.setSelectionRange(pos + 1 + indent.length + extra.length, pos + 1 + indent.length + extra.length);
        htmlTriggerUpdate();
    }

    // ==================== COMMENT TOGGLE ====================
    function htmlHandleSlash() {
        if (!htmlTA) return;
        const pos = htmlTA.selectionStart;
        if (pos < 1) return;
        const before = htmlTA.value.substring(0, pos);
        if (before.endsWith('<')) {
            htmlTA.value = htmlTA.value.substring(0, pos - 1) + '<!--  -->' + htmlTA.value.substring(pos);
            htmlTA.setSelectionRange(pos + 4, pos + 4);
            htmlTriggerUpdate();
        }
    }

    // ==================== ERROR CHECKING ====================
    function htmlCheckErrors(code) {
        const errors = [];
        const tagRegex = /<\/?(\w[\w-]*)([\s\S]*?)>/g;
        const stack = [];

        code.split('\n').forEach((line, i) => {
            const s = line.trim();
            if ((s.match(/"/g) || []).length % 2 !== 0 && /</.test(s) && />/.test(s)) {
                errors.push({ line: i + 1, msg: 'عدد علامات الاقتباس غير زوجي', type: 'warning' });
            }
        });

        let match;
        while ((match = tagRegex.exec(code)) !== null) {
            const full = match[0];
            const tagName = match[1].toLowerCase();
            const isClosing = full.startsWith('</');
            const isSelfClose = full.endsWith('/>') || VOID_ELEMENTS.has(tagName);
            const lineNum = code.substring(0, match.index).split('\n').length;

            if (isClosing) {
                if (stack.length === 0) {
                    errors.push({ line: lineNum, msg: `وسم إغلاق غير متوقع: <code>&lt;/${tagName}&gt;</code>`, type: 'error' });
                } else {
                    const expected = stack.pop();
                    if (expected !== tagName) {
                        errors.push({ line: lineNum, msg: `وسم غير متطابق: الإغلاق <code>&lt;/${tagName}&gt;</code> لكن التوقع <code>&lt;/${expected}&gt;</code>`, type: 'error' });
                    }
                }
            } else if (!isSelfClose) {
                stack.push(tagName);
            }
        }

        stack.forEach(t => {
            errors.push({ line: 0, msg: `وسم غير مغلق: <code>&lt;${t}&gt;</code>`, type: 'error' });
        });

        return errors;
    }

    function htmlDisplayErrors(errors) {
        if (!htmlEL || !htmlEC || !htmlET || !htmlEP || !htmlES || !htmlSD || !htmlST) return;
        htmlEL.innerHTML = '';
        htmlErrorLines.clear();

        if (errors.length === 0) {
            htmlEC.textContent = '0'; htmlEC.className = 'error-count success';
            htmlET.textContent = 'لا توجد أخطاء ✓';
            htmlEP.classList.remove('open');
            htmlES.textContent = '0 أخطاء';
            htmlSD.className = 'status-dot green';
            htmlST.textContent = 'لا توجد أخطاء';
            return;
        }

        htmlEC.textContent = errors.length;
        htmlEC.className = 'error-count';
        htmlET.textContent = 'الأخطاء والتحذيرات';
        htmlEP.classList.add('open');
        htmlES.textContent = errors.length + ' أخطاء';
        htmlSD.className = 'status-dot ' + (errors.some(e => e.type === 'error') ? 'red' : 'yellow');
        htmlST.textContent = errors.length + ' مشكلة';

        errors.forEach((err) => {
            const div = document.createElement('div');
            div.className = 'error-item ' + err.type;
            div.innerHTML = `
                <span class="err-icon">${err.type === 'warning' ? '⚠️' : '❌'}</span>
                <span class="err-msg">${err.msg}</span>
                <span class="err-line">${err.line > 0 ? 'السطر ' + err.line : ''}</span>`;
            if (err.line > 0 && htmlTA) {
                htmlErrorLines.add(err.line);
                div.onclick = () => {
                    const lines = htmlTA.value.split('\n');
                    let pos = 0;
                    for (let j = 0; j < Math.min(err.line - 1, lines.length); j++) pos += lines[j].length + 1;
                    htmlTA.focus(); htmlTA.setSelectionRange(pos, pos);
                    htmlTA.scrollTop = Math.max(0, (err.line - 3)) * parseFloat(getComputedStyle(htmlTA).lineHeight);
                };
            }
            htmlEL.appendChild(div);
        });
    }

    function htmlRunErrorCheck() {
        if (!htmlTA) return;
        const errors = htmlCheckErrors(htmlTA.value);
        htmlDisplayErrors(errors);
        htmlUpdateLineNumbers();
    }

    function htmlTriggerUpdate() {
        clearTimeout(window._htmlHlDebounce);
        window._htmlHlDebounce = setTimeout(() => {
            htmlUpdateHighlight();
            htmlRunErrorCheck();
            htmlUpdateLineNumbers();
            htmlUpdateCursorInfo();
            htmlUpdatePreview();
        }, 80);
    }

    // ==================== PREVIEW ====================
    function htmlGetPageTitle(code) {
        const m = code.match(/<title[^>]*>([^<]*)<\/title>/i);
        return m ? m[1].trim() : 'untitled';
    }

    function htmlUpdatePreview() {
        if (!htmlTA || !htmlPF || !htmlPP) return;
        const code = htmlTA.value.trim();
        const addr = document.getElementById('html-addressBar');
        const tab = document.getElementById('html-browserTabTitle');
        if (!code) {
            htmlPF.style.display = 'none';
            htmlPP.style.display = 'block';
            if (addr) addr.value = 'about:blank';
            if (tab) tab.textContent = 'index.html';
            return;
        }
        htmlPF.srcdoc = code;
        htmlPF.style.display = 'block';
        htmlPP.style.display = 'none';
        const title = htmlGetPageTitle(code);
        if (addr) addr.value = 'http://localhost/index.html';
        if (tab) tab.textContent = title || 'untitled';
    }

    // ==================== SAVE / IMPORT / EXPORT / CLEAR ====================
    function htmlSaveCode() {
        if (!htmlTA) return;
        const blob = new Blob([htmlTA.value], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'index.html';
        a.click();
        URL.revokeObjectURL(a.href);
        htmlShowToast('✅ تم حفظ الملف بنجاح!', 'success');
    }

    function htmlExportCode() {
        if (!htmlTA) return;
        const blob = new Blob([htmlTA.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'code.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        htmlShowToast('✅ تم تصدير الكود بنجاح!', 'success');
    }

    function htmlImportCode(e) {
        const file = e.target.files[0];
        if (!file || !htmlTA) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            htmlTA.value = ev.target.result;
            htmlTriggerUpdate();
            htmlRunCode();
            htmlShowToast('✅ تم استيراد الملف بنجاح!', 'success');
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function htmlClearCode() {
        if (!htmlTA) return;
        if (htmlTA.value.trim() && !confirm('هل أنت متأكد من مسح كل الكود؟')) return;
        htmlTA.value = '';
        htmlTriggerUpdate();
        if (htmlPF) htmlPF.style.display = 'none';
        if (htmlPP) htmlPP.style.display = 'block';
        htmlShowToast('تم مسح الكود', 'info');
    }

    function htmlRunCode() {
        htmlUpdatePreview();
        htmlRunErrorCheck();
        htmlShowToast('🔄 تم تحديث المعاينة!', 'info');
    }

    // ==================== TOAST ====================
    function htmlShowToast(msg, type) {
        const t = document.getElementById('htmlEditorToast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'html-editor-toast ' + type;
        t.classList.add('show');
        clearTimeout(t._timeout);
        t._timeout = setTimeout(() => t.classList.remove('show'), 2800);
    }

    // ==================== TOGGLE ERRORS ====================
    function htmlToggleErrors() {
        if (htmlEP) htmlEP.classList.toggle('open');
    }

    // ==================== EVENT HANDLERS ====================
    if (htmlTA) {
        htmlTA.addEventListener('input', () => {
            if (htmlIsComposing) return;
            htmlTriggerUpdate();
            const tagPrefix = htmlGetTagContext();
            if (tagPrefix !== null) { htmlShowSuggestions(); }
            else { const ac = htmlGetAttrContext(); if (ac) htmlShowSuggestions(); else htmlHideSuggestions(); }
            htmlUpdateCursorInfo();
        });

        htmlTA.addEventListener('scroll', () => {
            if (htmlHL) { htmlHL.scrollTop = htmlTA.scrollTop; htmlHL.scrollLeft = htmlTA.scrollLeft; }
            if (htmlLN) htmlLN.scrollTop = htmlTA.scrollTop;
        });

        htmlTA.addEventListener('keydown', (e) => {
            if (htmlSugActive && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape')) {
                const items = htmlSB ? htmlSB.querySelectorAll('.sug-item:not(.sug-header)') : [];
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    htmlSugIndex = Math.min(htmlSugIndex + 1, items.length - 1);
                    items.forEach((el, i) => el.classList.toggle('active', i === htmlSugIndex));
                    items[htmlSugIndex]?.scrollIntoView({ block: 'nearest' });
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    htmlSugIndex = Math.max(htmlSugIndex - 1, 0);
                    items.forEach((el, i) => el.classList.toggle('active', i === htmlSugIndex));
                    items[htmlSugIndex]?.scrollIntoView({ block: 'nearest' });
                    return;
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const active = htmlSB ? htmlSB.querySelector('.sug-item.active') : null;
                    if (active) htmlInsertSuggestion(active.dataset.value, active.dataset.type);
                    return;
                }
                if (e.key === 'Escape') { htmlHideSuggestions(); return; }
            }

            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                htmlHandleAutoIndent(e);
                htmlHideSuggestions();
                return;
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                const start = htmlTA.selectionStart, end = htmlTA.selectionEnd;
                htmlTA.value = htmlTA.value.substring(0, start) + '  ' + htmlTA.value.substring(end);
                htmlTA.setSelectionRange(start + 2, start + 2);
                htmlTriggerUpdate();
                return;
            }

            if (e.key === '>' && !e.ctrlKey && !e.metaKey) {
                setTimeout(() => { htmlHandleAutoClose(); htmlTriggerUpdate(); }, 0);
            }

            if (e.key === '/') {
                setTimeout(htmlHandleSlash, 0);
            }
        });

        htmlTA.addEventListener('compositionstart', () => { htmlIsComposing = true; });
        htmlTA.addEventListener('compositionend', () => { htmlIsComposing = false; htmlTriggerUpdate(); });

        htmlTA.addEventListener('blur', () => setTimeout(htmlHideSuggestions, 200));
        htmlTA.addEventListener('click', () => {
            htmlUpdateCursorInfo();
            const tagPrefix = htmlGetTagContext();
            if (tagPrefix !== null) htmlShowSuggestions();
            else { const ac = htmlGetAttrContext(); if (ac) htmlShowSuggestions(); else htmlHideSuggestions(); }
        });
    }

    // Refresh button
    const htmlRefreshBtn = document.getElementById('html-refreshBtn');
    if (htmlRefreshBtn) {
        htmlRefreshBtn.addEventListener('click', htmlRunCode);
    }

    // Nav refresh button
    const htmlNavRefresh = document.getElementById('html-navRefresh');
    if (htmlNavRefresh) {
        htmlNavRefresh.addEventListener('click', htmlRunCode);
    }

    // Error toggle
    const htmlErrorToggle = document.getElementById('html-errorToggle');
    if (htmlErrorToggle) {
        htmlErrorToggle.addEventListener('click', htmlToggleErrors);
    }

    // Toolbar buttons
    const htmlSaveBtn = document.getElementById('html-saveBtn');
    if (htmlSaveBtn) htmlSaveBtn.addEventListener('click', htmlSaveCode);

    const htmlImportBtn = document.getElementById('html-importBtn');
    if (htmlImportBtn) htmlImportBtn.addEventListener('click', () => document.getElementById('htmlEditorFileInput')?.click());

    const htmlExportBtn = document.getElementById('html-exportBtn');
    if (htmlExportBtn) htmlExportBtn.addEventListener('click', htmlExportCode);

    const htmlClearBtn = document.getElementById('html-clearBtn');
    if (htmlClearBtn) htmlClearBtn.addEventListener('click', htmlClearCode);

    // File input
    const htmlFileInput = document.getElementById('htmlEditorFileInput');
    if (htmlFileInput) {
        htmlFileInput.addEventListener('change', htmlImportCode);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); htmlSaveCode(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); htmlRunCode(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); document.getElementById('htmlEditorFileInput')?.click(); }
    });

    // ==================== INIT ====================
    const htmlDefaultCode = `<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>رحلتي مع HTML</title>
</head>
<body>
    <h1 align="center"><font color="green">مرحباً بالعالم!</font></h1>
    <p>هذه بداية رحلتي في تعلم HTML. كل يوم أتعلم شيئاً جديداً وأتقدم خطوة نحو الاحتراف.</p>
    <p>التعلم المستمر هو مفتاح النجاح في عالم البرمجة.</p>
</body>
</html>`;

    if (htmlTA) {
        htmlTA.value = htmlDefaultCode;
        htmlTriggerUpdate();
        setTimeout(htmlUpdatePreview, 400);
    }

    window.addEventListener('resize', () => {
        if (htmlSugActive) { const tp = htmlGetTagContext(); if (tp !== null) htmlShowSuggestions(); }
    });

    // Expose functions globally for fullscreen
    window.htmlEditorRunCode = htmlRunCode;

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
