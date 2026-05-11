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
            // إعادة رسم محاكي الشبكات عند تغيير السمة
            if (nsInitialized) nsRender();
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
            { id: 'algo-editor', title: 'محرر الخوارزميات', desc: 'محرر خوارزميات متقدم مع تنفيذ خطوة بخطوة وتتبع المتغيرات.', icon: '⚙️', category: 'مقدمة في البرمجة' }
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
        stopTypingEffect();

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
        if (ws.id === 'web-editor') targetId = 'station-web'; // محطة الويب كاملة
        if (ws.id === 'algo-editor') targetId = 'subtab-algo-editor';



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
            // تحديث محاكي الشبكات عند فتحه في وضع ملء الشاشة
            if (ws.id === 'network') {
                setTimeout(() => { nsRender(); }, 150);
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
            // إعادة رسم محاكي الشبكات عند الإغلاق
            if (currentWorkshopElement.id === 'subtab-network') {
                setTimeout(() => { nsRender(); }, 150);
            }
            // تنظيف المراقبين لتجنب تسرب الذاكرة
            if (currentWorkshopElement.id === 'subtab-network' && typeof nsDisconnectObservers === 'function') {
                nsDisconnectObservers();
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
                if (typingEl) typeLoop();
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

    // Sub-tab switching داخل المحطات
    const subTabs = document.querySelectorAll('.sub-tab');
    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const parent = tab.closest('.station-workspace');
            if (!parent) return;
            const sub = tab.dataset.subtab;
            parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            parent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
            const target = parent.querySelector('#subtab-' + sub);
            if (target) target.classList.add('active');
            // تفعيل محاكي الشبكات عند التبديل إليه
            if (sub === 'network' && !nsInitialized) nsInit();
        });
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

    // Polyfill for roundRect if not available
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (r == null) r = [];
            else if (typeof r === 'number') r = [r];
            const radii = (r || []).map(v => Math.min(v, Math.min(Math.abs(w), Math.abs(h)) / 2));
            const tl = radii[0] || 0;
            this.moveTo(x + tl, y);
            this.lineTo(x + w - tl, y);
            this.quadraticCurveTo(x + w, y, x + w, y + tl);
            this.lineTo(x + w, y + h - tl);
            this.quadraticCurveTo(x + w, y + h, x + w - tl, y + h);
            this.lineTo(x + tl, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - tl);
            this.lineTo(x, y + tl);
            this.quadraticCurveTo(x, y, x + tl, y);
            this.closePath();
        };
    }

    // ============================================================
    // Network Simulator Advanced (دمج من network-simulator.html)
    // ============================================================
    const nsCanvas = document.getElementById('ns-canvas');
    const nsCtx = nsCanvas ? nsCanvas.getContext('2d') : null;

    const NS_DEVICE_NAMES = {
        pc: 'حاسوب', phone: 'هاتف', printer: 'طابعة',
        server: 'خادم', router: 'موجه', switch: 'محول', hub: 'مكرر', cloud: 'سحابة'
    };
    const NS_DEVICE_ICONS = {
        pc: '💻', phone: '📱', printer: '🖨️',
        server: '🖥️', router: '📡', switch: '🔀', hub: '🔲', cloud: '☁️'
    };
    const NS_DEVICE_COLORS = {
        pc: '#4fc3f7', phone: '#81c784', printer: '#ffb74d',
        server: '#ce93d8', router: '#e94560', switch: '#4dd0e1', hub: '#ffd54f', cloud: '#81d4fa'
    };

    const nsState = {
        devices: [],
        connections: [],
        selectedId: null,
        tool: 'select',
        pan: { x: 0, y: 0 },
        zoom: 1,
        isPanning: false,
        panStart: null,
        connectFirst: null,
        connectPendingSecond: null,
        deviceIdCounter: 0,
        dragDevice: null,
        dragOffset: null,
    };

    function nsRandIP() {
        return `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    }

    function nsCreateDevice(type, x, y) {
        const id = ++nsState.deviceIdCounter;
        const d = { id, type, x, y, name: NS_DEVICE_NAMES[type] + ' ' + id, ip: nsRandIP(), ports: [] };
        if (type === 'router') d.ports = [0,1,2,3];
        if (type === 'switch') d.ports = [0,1,2,3,4,5,6,7];
        if (type === 'hub') d.ports = [0,1,2,3,4];
        nsState.devices.push(d);
        return d;
    }

    function nsGetDeviceSize(type) {
        switch(type) {
            case 'router': return 60;
            case 'switch': return 70;
            case 'hub': return 55;
            case 'server': return 50;
            case 'cloud': return 90;
            default: return 45;
        }
    }

    function nsDrawDevice(d) {
        if (!nsCtx) return;
        const s = nsGetDeviceSize(d.type) * nsState.zoom;
        const x = d.x * nsState.zoom + nsState.pan.x;
        const y = d.y * nsState.zoom + nsState.pan.y;
        const isSelected = d.id === nsState.selectedId;
        const color = NS_DEVICE_COLORS[d.type];
        const ctx = nsCtx;

        ctx.shadowColor = isSelected ? '#e9456080' : '#00000040';
        ctx.shadowBlur = isSelected ? 15 : 5;

        ctx.beginPath();
        if (d.type === 'router' || d.type === 'switch' || d.type === 'cloud') {
            const r = d.type === 'cloud' ? 20 : 8;
            ctx.roundRect(x - s/2, y - s/2, s, s, r);
        } else {
            ctx.arc(x, y, s/2, 0, Math.PI * 2);
        }
        const isLightNs = document.body.classList.contains('light-mode');
        ctx.fillStyle = isLightNs ? '#f1f5f9' : '#16213e';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#e94560' : color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        if (d.type === 'cloud') {
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = isSelected ? '#e94560' : '#81d4fa';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.shadowBlur = 0;

        ctx.font = `${Math.round(s * 0.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NS_DEVICE_ICONS[d.type], x, y - s * 0.05);

        ctx.font = `${Math.max(10, Math.round(11 * nsState.zoom))}px sans-serif`;
        ctx.fillStyle = isLightNs ? '#475569' : '#ccc';
        ctx.textBaseline = 'top';
        ctx.fillText(d.name, x, y + s/2 + 4);

        ctx.font = `${Math.max(8, Math.round(9 * nsState.zoom))}px sans-serif`;
        ctx.fillStyle = isLightNs ? '#94a3b8' : '#888';
        ctx.textBaseline = 'top';
        ctx.fillText(d.ip, x, y + s/2 + 18);
    }

    function nsDrawConnection(c) {
        if (!nsCtx) return;
        const a = nsState.devices.find(d => d.id === c.from);
        const b = nsState.devices.find(d => d.id === c.to);
        if (!a || !b) return;
        const ctx = nsCtx;

        const ax = a.x * nsState.zoom + nsState.pan.x;
        const ay = a.y * nsState.zoom + nsState.pan.y;
        const bx = b.x * nsState.zoom + nsState.pan.x;
        const by = b.y * nsState.zoom + nsState.pan.y;
        const as = nsGetDeviceSize(a.type) * nsState.zoom / 2;
        const bs = nsGetDeviceSize(b.type) * nsState.zoom / 2;

        const dx = bx - ax, dy = by - ay;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) return;
        const nx = dx/len, ny = dy/len;

        const x1 = ax + nx * as, y1 = ay + ny * as;
        const x2 = bx - nx * bs, y2 = by - ny * bs;
        const isWireless = c.type === 'wireless';
        const isActive = c.active;

        if (isWireless) {
            const midX = (x1+x2)/2, midY = (y1+y2)/2;
            const perpX = -ny, perpY = nx;
            const amp = 8 * nsState.zoom;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            const steps = Math.max(4, Math.floor(len / (20 * nsState.zoom)));
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = x1 + dx * t;
                const py = y1 + dy * t;
                if (i % 2 === 0) ctx.lineTo(px, py);
                else ctx.moveTo(px, py);
            }
            ctx.strokeStyle = isActive ? '#81c784' : '#2e7d32';
            ctx.lineWidth = isActive ? 2 : 1.5;
            ctx.stroke();

            ctx.font = `${Math.round(16 * nsState.zoom)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📶', midX + perpX * amp * 1.2, midY + perpY * amp * 1.2);
        } else {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isActive ? '#4fc3f7' : '#0f3460';
            ctx.lineWidth = isActive ? 2.5 : 1.5;
            ctx.setLineDash(isActive ? [] : [5, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            if (isActive) {
                const mx = (x1+x2)/2, my = (y1+y2)/2;
                ctx.beginPath();
                ctx.arc(mx, my, 3, 0, Math.PI*2);
                ctx.fillStyle = '#4fc3f7';
                ctx.fill();
            }
        }
    }

    function nsRender() {
        if (!nsCanvas || !nsCtx) return;
        const rect = nsCanvas.parentElement.getBoundingClientRect();
        nsCanvas.width = nsCanvas.clientWidth || rect.width;
        nsCanvas.height = nsCanvas.clientHeight || rect.height;
        const ctx = nsCtx;
        ctx.clearRect(0, 0, nsCanvas.width, nsCanvas.height);

        // شبكة الخلفية
        const isLight = document.body.classList.contains('light-mode');
        ctx.strokeStyle = isLight ? '#e2e8f0' : '#1a1a3e';
        ctx.lineWidth = 1;
        const gridSize = 40 * nsState.zoom;
        const ox = nsState.pan.x % gridSize, oy = nsState.pan.y % gridSize;
        for (let x = ox; x < nsCanvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, nsCanvas.height); ctx.stroke();
        }
        for (let y = oy; y < nsCanvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(nsCanvas.width, y); ctx.stroke();
        }

        nsState.connections.forEach(nsDrawConnection);
        nsState.devices.forEach(nsDrawDevice);
    }

    // إضافة جهاز بالنقر على زر
    document.querySelectorAll('[data-ns-device]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!nsCanvas) return;
            const type = btn.dataset.nsDevice;
            const cw = nsCanvas.width || nsCanvas.clientWidth;
            const ch = nsCanvas.height || nsCanvas.clientHeight;
            const x = (50 + Math.random() * (cw - 150) - nsState.pan.x) / nsState.zoom;
            const y = (50 + Math.random() * (ch - 100) - nsState.pan.y) / nsState.zoom;
            nsCreateDevice(type, x, y);
            nsRender();
        });
    });

    // أدوات التحديد/التوصيل/الحذف
    document.querySelectorAll('[data-ns-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-ns-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            nsState.tool = btn.dataset.nsTool;
            if (nsState.tool !== 'connect') {
                nsState.connectFirst = null;
                nsState.connectPendingSecond = null;
                document.getElementById('ns-connectionMode').classList.remove('show');
                document.getElementById('ns-connTypePicker').classList.remove('show');
            }
            nsRender();
        });
    });

    // تفعيل أداة التحديد افتراضياً
    const nsSelectBtn = document.querySelector('[data-ns-tool="select"]');
    if (nsSelectBtn) nsSelectBtn.classList.add('active');

    // التفاعل مع الكانفاس
    function nsDeviceAt(x, y) {
        for (let i = nsState.devices.length - 1; i >= 0; i--) {
            const d = nsState.devices[i];
            const s = nsGetDeviceSize(d.type) / 2;
            const dx = d.x - x, dy = d.y - y;
            if (d.type === 'router' || d.type === 'switch' || d.type === 'cloud') {
                if (Math.abs(dx) <= s && Math.abs(dy) <= s) return d;
            } else {
                if (dx*dx + dy*dy <= s*s) return d;
            }
        }
        return null;
    }

    if (nsCanvas) {
        nsCanvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            const rect = nsCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - nsState.pan.x) / nsState.zoom;
            const y = (e.clientY - rect.top - nsState.pan.y) / nsState.zoom;
            const d = nsDeviceAt(x, y);
            if (d) {
                nsState.selectedId = d.id;
                nsRender();
                const menu = document.getElementById('ns-contextMenu');
                menu.classList.add('show');
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';
                menu.dataset.deviceId = d.id;
            }
        });

        nsCanvas.addEventListener('mousedown', e => {
            if (e.button === 2) return;
            if (e.button === 1 || e.shiftKey) {
                nsState.isPanning = true;
                nsState.panStart = { x: e.clientX - nsState.pan.x, y: e.clientY - nsState.pan.y };
                return;
            }

            const rect = nsCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - nsState.pan.x) / nsState.zoom;
            const y = (e.clientY - rect.top - nsState.pan.y) / nsState.zoom;
            const d = nsDeviceAt(x, y);

            if (nsState.tool === 'delete') {
                if (d) nsRemoveDevice(d.id);
                return;
            }

            if (nsState.tool === 'connect') {
                if (d) {
                    if (!nsState.connectFirst) {
                        nsState.connectFirst = d.id;
                        document.getElementById('ns-connectionMode').classList.add('show');
                        document.getElementById('ns-connectionMode').textContent = `🔗 اختر الجهاز الثاني (${d.name})`;
                    } else if (d.id !== nsState.connectFirst) {
                        nsState.connectPendingSecond = d.id;
                        document.getElementById('ns-connTypePicker').classList.add('show');
                    }
                } else {
                    nsState.connectFirst = null;
                    nsState.connectPendingSecond = null;
                    document.getElementById('ns-connectionMode').classList.remove('show');
                    document.getElementById('ns-connTypePicker').classList.remove('show');
                }
                return;
            }

            nsState.selectedId = d ? d.id : null;
            if (d) {
                nsState.dragDevice = d;
                nsState.dragOffset = { x: x - d.x, y: y - d.y };
            }
            nsRender();
        });

        nsCanvas.addEventListener('mousemove', e => {
            if (nsState.isPanning) {
                nsState.pan.x = e.clientX - nsState.panStart.x;
                nsState.pan.y = e.clientY - nsState.panStart.y;
                nsRender();
                return;
            }
            if (nsState.dragDevice) {
                const rect = nsCanvas.getBoundingClientRect();
                nsState.dragDevice.x = (e.clientX - rect.left - nsState.pan.x) / nsState.zoom - nsState.dragOffset.x;
                nsState.dragDevice.y = (e.clientY - rect.top - nsState.pan.y) / nsState.zoom - nsState.dragOffset.y;
                nsRender();
            }
        });

        nsCanvas.addEventListener('mouseup', () => {
            nsState.dragDevice = null;
            nsState.isPanning = false;
        });

        nsCanvas.addEventListener('mouseleave', () => {
            nsState.dragDevice = null;
            nsState.isPanning = false;
        });

        // عجلة الفأرة للتكبير
        nsCanvas.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            nsState.zoom = Math.max(0.2, Math.min(3, nsState.zoom + delta));
            nsUpdateZoom();
        }, { passive: false });
    }

    // قائمة السياق
    document.addEventListener('click', () => {
        const nsCtxMenu = document.getElementById('ns-contextMenu');
        if (nsCtxMenu) nsCtxMenu.classList.remove('show');
        const nsInfoPanel = document.getElementById('ns-infoPanel');
        if (nsInfoPanel) nsInfoPanel.classList.remove('show');
    });

    const nsCtxMenuEl = document.getElementById('ns-contextMenu');
    if (nsCtxMenuEl) {
        nsCtxMenuEl.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const ctxMenu = document.getElementById('ns-contextMenu');
        if (!ctxMenu) return;
        const id = parseInt(ctxMenu.dataset.deviceId);
        const d = nsState.devices.find(dd => dd.id === id);
        if (!d) return;

        switch(btn.dataset.nsAction) {
            case 'edit': nsOpenModal(d); break;
            case 'info': nsShowInfo(d); break;
            case 'delete': nsRemoveDevice(d.id); break;
        }
            const nsCtxMenuEl2 = document.getElementById('ns-contextMenu');
            if (nsCtxMenuEl2) nsCtxMenuEl2.classList.remove('show');
        });
    }
    const nsModalSave2 = document.getElementById('ns-modalSave');
    if (nsModalSave2) {
        nsModalSave2.addEventListener('click', () => {
            if (!nsEditingDevice) return;
            nsEditingDevice.name = (document.getElementById('ns-editName')?.value) || nsEditingDevice.name;
            nsEditingDevice.ip = (document.getElementById('ns-editIP')?.value) || nsEditingDevice.ip;
            const overlay = document.getElementById('ns-modalOverlay');
            if (overlay) overlay.classList.remove('show');
            nsEditingDevice = null;
            nsRender();
        });
    }

    // الاتصالات
    function nsAddConnection(fromId, toId, type = 'wired') {
        if (nsState.connections.some(c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId))) {
            const connMode = document.getElementById('ns-connectionMode');
            if (connMode) {
                connMode.textContent = '⚠️ يوجد اتصال مسبق';
                setTimeout(() => { connMode.classList.remove('show'); }, 1500);
            }
            return;
        }
        const c = { from: fromId, to: toId, active: true, type };
        nsState.connections.push(c);
        nsRender();
    }

    document.querySelectorAll('.ns-conn-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.nsConn;
            const secondId = nsState.connectPendingSecond;
            if (nsState.connectFirst && secondId) {
                nsAddConnection(nsState.connectFirst, secondId, type);
                nsState.connectFirst = null;
                nsState.connectPendingSecond = null;
                const connMode = document.getElementById('ns-connectionMode');
                    if (connMode) { connMode.classList.remove('show'); connMode.textContent = ''; }
                    const picker = document.getElementById('ns-connTypePicker');
                    if (picker) picker.classList.remove('show');
                }
            });
        });

        function nsRemoveDevice(id) {
        nsState.devices = nsState.devices.filter(d => d.id !== id);
        nsState.connections = nsState.connections.filter(c => c.from !== id && c.to !== id);
        if (nsState.selectedId === id) nsState.selectedId = null;
        if (nsState.connectFirst === id) { nsState.connectFirst = null; nsState.connectPendingSecond = null; const picker = document.getElementById('ns-connTypePicker'); if (picker) picker.classList.remove('show'); }
        nsRender();
    }

    function nsUpdateZoom() {
        const zl = document.getElementById('ns-zoomLevel');
        if (zl) zl.textContent = Math.round(nsState.zoom * 100) + '%';
        nsRender();
    }

    // تكبير/تصغير
    const nsZoomInBtn = document.getElementById('ns-zoomIn');
    if (nsZoomInBtn) nsZoomInBtn.addEventListener('click', () => { nsState.zoom = Math.min(3, nsState.zoom + 0.1); nsUpdateZoom(); });
    const nsZoomOutBtn = document.getElementById('ns-zoomOut');
    if (nsZoomOutBtn) nsZoomOutBtn.addEventListener('click', () => { nsState.zoom = Math.max(0.2, nsState.zoom - 0.1); nsUpdateZoom(); });
    const nsZoomResetBtn = document.getElementById('ns-zoomReset');
    if (nsZoomResetBtn) nsZoomResetBtn.addEventListener('click', () => { nsState.zoom = 1; nsState.pan = { x: 0, y: 0 }; nsUpdateZoom(); });

    // مسح الكل
    const nsClearAllBtn = document.getElementById('ns-clearAll');
    if (nsClearAllBtn) {
        nsClearAllBtn.addEventListener('click', () => {
            if (nsState.devices.length === 0) return;
            if (confirm('هل أنت متأكد من مسح جميع العناصر؟')) {
                nsState.devices = [];
                nsState.connections = [];
                nsState.selectedId = null;
                nsState.connectFirst = null;
                nsState.connectPendingSecond = null;
                const picker = document.getElementById('ns-connTypePicker');
                if (picker) picker.classList.remove('show');
                nsRender();
            }
        });
    }

    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', e => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (nsState.selectedId) {
                nsRemoveDevice(nsState.selectedId);
                e.preventDefault();
            }
        }
        if (e.key === 'Escape') {
            nsState.connectFirst = null;
            nsState.connectPendingSecond = null;
            const connMode = document.getElementById('ns-connectionMode');
            if (connMode) { connMode.classList.remove('show'); connMode.textContent = ''; }
            const picker = document.getElementById('ns-connTypePicker');
            if (picker) picker.classList.remove('show');
            const overlay = document.getElementById('ns-modalOverlay');
            if (overlay && overlay.classList.contains('show')) {
                overlay.classList.remove('show');
                nsEditingDevice = null;
            }
        }
    });

    // مثال تلقائي
    function nsLoadExample() {
        const p1 = nsCreateDevice('pc', 120, 200);
        const p2 = nsCreateDevice('pc', 250, 350);
        const phone = nsCreateDevice('phone', 100, 400);
        const printer = nsCreateDevice('printer', 350, 200);
        const server = nsCreateDevice('server', 700, 150);
        const router = nsCreateDevice('router', 500, 300);
        const sw = nsCreateDevice('switch', 400, 450);
        const hub = nsCreateDevice('hub', 600, 400);
        const cloud = nsCreateDevice('cloud', 900, 300);

        nsAddConnection(p1.id, sw.id, 'wired');
        nsAddConnection(p2.id, sw.id, 'wired');
        nsAddConnection(phone.id, hub.id, 'wireless');
        nsAddConnection(hub.id, sw.id, 'wired');
        nsAddConnection(sw.id, router.id, 'wired');
        nsAddConnection(printer.id, sw.id, 'wired');
        nsAddConnection(server.id, router.id, 'wired');
        nsAddConnection(router.id, cloud.id, 'wired');
        nsAddConnection(p2.id, router.id, 'wireless');
        nsRender();
    }

    let nsInitialized = false;

    function nsInit() {
        if (nsInitialized || !nsCanvas) return;
        nsInitialized = true;
        nsLoadExample();
    }

    // تشغيل المثال عند أول ظهور للتبويب
    let nsSubtabObserver = null;
    const nsSubtab = document.getElementById('subtab-network');
    if (nsSubtab) {
        nsSubtabObserver = new MutationObserver(() => {
            const st = document.getElementById('subtab-network');
            if (st && st.classList.contains('active') && !nsInitialized) nsInit();
        });
        nsSubtabObserver.observe(nsSubtab, { attributes: true, attributeFilter: ['class'] });
        if (nsSubtab.classList.contains('active')) nsInit();
    }

    // إعادة الرسم عند تغيير حجم الحاوية
    let nsResizeObserver = null;
    if (nsCanvas) {
        nsResizeObserver = new ResizeObserver(() => {
            if (nsInitialized) nsRender();
        });
        nsResizeObserver.observe(nsCanvas.parentElement);
    }

    function nsDisconnectObservers() {
        if (nsSubtabObserver) { nsSubtabObserver.disconnect(); nsSubtabObserver = null; }
        if (nsResizeObserver) { nsResizeObserver.disconnect(); nsResizeObserver = null; }
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

    // ============================================================
    // Algorithm Editor Engine (دمج من algo-editor.html)
    // ============================================================
    function algoShowInputModal(label) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'algo-input-modal-overlay';
            overlay.innerHTML =
                `<div class="algo-input-modal" role="dialog" aria-modal="true">
              <label class="algo-input-modal-label">${label}</label>
              <input class="algo-input-modal-field" type="text" autocomplete="off" dir="auto" />
              <div class="algo-input-modal-actions">
                <button class="algo-btn-run algo-input-modal-confirm">تأكيد</button>
                <button class="algo-btn-reset algo-input-modal-cancel">إلغاء</button>
              </div>
            </div>`;
            document.body.appendChild(overlay);
            const field = overlay.querySelector('.algo-input-modal-field');
            const confirm = overlay.querySelector('.algo-input-modal-confirm');
            const cancel = overlay.querySelector('.algo-input-modal-cancel');
            requestAnimationFrame(() => field?.focus());
            const done = (val) => { overlay.remove(); resolve(val); };
            if (confirm) confirm.onclick = () => done(field ? field.value : '');
            if (cancel) cancel.onclick = () => done('');
            field?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') done(field.value);
                if (e.key === 'Escape') done('');
            });
        });
    }

    const algoEditorEl = document.getElementById('algoEditor');
    const algoHighlightEl = document.getElementById('algoHighlight');
    const algoVarsBody = document.getElementById('algoVarsBody');
    const algoOutputEl = document.getElementById('algoOutput');
    const algoRunBtn = document.getElementById('algoRunBtn');
    const algoStepBtn = document.getElementById('algoStepBtn');
    const algoResetBtn = document.getElementById('algoResetBtn');
    const algoLangToggle = document.getElementById('algoLangToggle');

    if (algoEditorEl && algoHighlightEl && algoVarsBody && algoOutputEl && algoRunBtn && algoStepBtn && algoResetBtn) {
        let algoCurrentLang = 'en';
        let algoIsRunning = false;

        const algoDefaultPrograms = {
            en: 'Algorithm example\nstart\n  Write("Hello World!");\nend',
            fr: 'Algorithme exemple\nDebut\n  Ecrire("Hello World!");\nFin'
        };

        const algoExamples = {
            en: {
                hello: 'Algorithm HelloWorld\nstart\n  Write("Hello World!");\nend',
                sum: 'Algorithm Summation\nvar a, b, s : integer\nstart\n  a \u2190 10\n  b \u2190 20\n  s \u2190 a + b\n  Write("The sum is:");\n  Write(s);\nend',
                condition: 'Algorithm Grades\nvar score : integer\nstart\n  score \u2190 85\n  if score >= 90 then\n    Write("Excellent");\n  else if score >= 80 then\n    Write("Very Good");\n  else if score >= 70 then\n    Write("Good");\n  else\n    Write("Needs improvement");\n  end\nend',
                loop: 'Algorithm Counting\nvar i : integer\nstart\n  for i = 1 to 5 do\n    Write("Number:");\n    Write(i);\n  end\nend'
            },
            fr: {
                hello: 'Algorithme HelloWorld\nDebut\n  Ecrire("Bonjour tout le monde!");\nFin',
                sum: 'Algorithme Somme\nvar a, b, s : entier\nDebut\n  a \u2190 10\n  b \u2190 20\n  s \u2190 a + b\n  Ecrire("La somme est:");\n  Ecrire(s);\nFin',
                condition: 'Algorithme Notes\nvar score : entier\nDebut\n  score \u2190 85\n  Si score >= 90 Alors\n    Ecrire("Excellent");\n  Sinon si score >= 80 Alors\n    Ecrire("Tr\u00e8s bien");\n  Sinon si score >= 70 Alors\n    Ecrire("Bien");\n  Sinon\n    Ecrire("Am\u00e9lioration n\u00e9cessaire");\n  FinSi\nFin',
                loop: 'Algorithme Comptage\nvar i : entier\nDebut\n  Pour i = 1 a 5 Faire\n    Ecrire("Nombre:");\n    Ecrire(i);\n  FinPour\nFin'
            }
        };

        const algoKW_ALGORITHM = ['algorithm', 'algorithme'];
        const algoKW_VAR = ['var', 'variable', 'variables'];
        const algoKW_START = ['start', 'debut', 'd\u00e9but'];
        const algoKW_END = ['end', 'fin', 'finsi', 'fintantque'];
        const algoKW_IF_START = ['if', 'si'];
        const algoKW_ELSE_IF = ['else if', 'sinon si'];
        const algoKW_THEN = ['then', 'alors'];
        const algoKW_ELSE = ['else', 'sinon'];
        const algoKW_WHILE_START = ['while', 'tantque'];
        const algoKW_FOR_START = ['for', 'pour'];
        const algoKW_TO = ['to', 'a', '\u00e0'];
        const algoKW_DO = ['do', 'faire'];
        const algoKW_READ = ['read', 'lire'];
        const algoKW_WRITE = ['write', 'ecrire', '\u00e9crire'];

        const algoHL_KEYWORDS = [...algoKW_ALGORITHM, ...algoKW_VAR, ...algoKW_START, ...algoKW_END];
        const algoHL_CONTROL = [...algoKW_IF_START, ...algoKW_THEN, ...algoKW_ELSE, ...algoKW_WHILE_START, ...algoKW_FOR_START, ...algoKW_TO, ...algoKW_DO, 'finsi', 'fintantque', 'finpour', 'else if', 'sinon si'];
        const algoHL_IO = [...algoKW_READ, ...algoKW_WRITE, 'print', 'let'];
        const algoHL_TYPES = ['integer', 'real', 'string', 'boolean', 'char', 'entier', 'reel', 'r\u00e9el', 'chaine', 'cha\u00eene', 'booleen', 'bool\u00e9en', 'caractere', 'caract\u00e8re'];
        const algoHL_LOGIC = ['and', 'or', 'not', 'true', 'false', 'et', 'ou', 'non', 'vrai', 'faux'];

        let algoVM = { lines: [], blocks: [], pc: 0, vars: {}, out: [], halted: false, _ifMap: new Map(), _whileMap: new Map(), _forMap: new Map() };

        function algoSanitizeExpr(expr) {
            const s = String(expr ?? '').trim();
            if (!/^[\w\s"'+\-*/%<>=!&|().,:]+$/.test(s)) throw new Error('تعبير غير مسموح.');
            const forbidden = ['window', 'document', 'fetch', 'XMLHttpRequest', 'eval', 'setTimeout', 'setInterval', 'Function', 'alert', 'console', 'cookie', 'localStorage', 'sessionStorage', 'process', 'require', 'import', 'export', 'class', 'function', 'new', 'delete', 'typeof', 'instanceof', 'in', 'this'];
            const lower = s.toLowerCase();
            if (forbidden.some(word => new RegExp('\\b' + word + '\\b').test(lower))) throw new Error('محاولة وصول غير مصرح بها.');
            if (/\w+\s*\(/.test(s)) throw new Error('استدعاء دوال غير مسموح.');
            return s;
        }

        function algoSafeEval(expr, vars) {
            let pos = 0;
            const s = expr.trim();
            function peek() { return pos < s.length ? s[pos] : null; }
            function consume() { return pos < s.length ? s[pos++] : null; }
            function skipWS() { while (pos < s.length && s[pos] === ' ') pos++; }
            function parseExpr() { skipWS(); return parseOr(); }
            function parseOr() {
                let left = parseAnd();
                skipWS();
                while (peek() === '|' && s[pos + 1] === '|') { pos += 2; const right = parseAnd(); left = Boolean(left) || Boolean(right); skipWS(); }
                return left;
            }
            function parseAnd() {
                let left = parseComparison();
                skipWS();
                while (peek() === '&' && s[pos + 1] === '&') { pos += 2; const right = parseComparison(); left = Boolean(left) && Boolean(right); skipWS(); }
                return left;
            }
            function parseComparison() {
                let left = parseAddSub();
                skipWS();
                const op = peek();
                if (op === '<' || op === '>' || op === '=' || op === '!') {
                    let fullOp = consume();
                    if ((fullOp === '<' || fullOp === '>') && peek() === '=') { fullOp += consume(); }
                    if (fullOp === '<>' && peek() === '=') { fullOp += consume(); }
                    const right = parseAddSub();
                    if (fullOp === '==') return left == right;
                    if (fullOp === '!=' || fullOp === '<>') return left != right;
                    if (fullOp === '<') return left < right;
                    if (fullOp === '>') return left > right;
                    if (fullOp === '<=') return left <= right;
                    if (fullOp === '>=') return left >= right;
                }
                return left;
            }
            function parseAddSub() {
                let left = parseMulDiv();
                skipWS();
                while (peek() === '+' || peek() === '-') {
                    const op = consume();
                    const right = parseMulDiv();
                    skipWS();
                    if (op === '+') left = (typeof left === 'number' && typeof right === 'number') ? left + right : (left != null ? String(left) : '') + (right != null ? String(right) : '');
                    else left = left - right;
                }
                return left;
            }
            function parseMulDiv() {
                let left = parseUnary();
                skipWS();
                while (peek() === '*' || peek() === '/' || peek() === '%') {
                    const op = consume();
                    const right = parseUnary();
                    skipWS();
                    if (op === '*') left = left * right;
                    else if (op === '/') left = left / right;
                    else left = left % right;
                }
                return left;
            }
            function parseUnary() {
                skipWS();
                if (peek() === '!') { consume(); const val = parseUnary(); return !Boolean(val); }
                if (peek() === '-') { consume(); const val = parseUnary(); return -val; }
                return parsePrimary();
            }
            function parsePrimary() {
                skipWS();
                if (peek() === '(') { consume(); const val = parseExpr(); skipWS(); if (peek() === ')') consume(); return val; }
                if (peek() === '"' || peek() === "'") {
                    const quote = consume(); let str = '';
                    while (pos < s.length && peek() !== quote) str += consume();
                    if (peek() === quote) consume();
                    return str;
                }
                let word = '';
                while (pos < s.length && /[a-zA-Z0-9_.]/.test(peek())) word += consume();
                if (!word) throw new Error('تعبير غير متوقع في الموقع ' + pos);
                if (word === 'true') return true;
                if (word === 'false') return false;
                if (word in vars) return vars[word];
                const num = Number(word);
                if (!isNaN(num) && word !== '') return num;
                return word;
            }
            const result = parseExpr();
            if (pos < s.length) throw new Error('يوجد محتوى إضافي بعد التعبير في الموقع ' + pos);
            return result;
        }

        function algoEvalExpr(expr, vars) {
            const safe = algoSanitizeExpr(expr)
                .replace(/\b(?:and|et)\b/gi, '&&')
                .replace(/\b(?:or|ou)\b/gi, '||')
                .replace(/\b(?:not|non)\b/gi, '!')
                .replace(/\b(?:vrai|true)\b/gi, 'true')
                .replace(/\b(?:faux|false)\b/gi, 'false');
            try {
                return algoSafeEval(safe, vars);
            } catch (e) { throw new Error('خطأ في تقييم التعبير: ' + e.message); }
        }

        function algoStripComments(line) {
            let s = line;
            const hash = s.indexOf('#'), slashes = s.indexOf('//');
            const cut = [hash, slashes].filter(i => i >= 0).sort((a, b) => a - b)[0];
            if (cut !== undefined) s = s.slice(0, cut);
            return s.trimEnd();
        }

        function algoNormalizeLine(line) {
            return algoStripComments(line).replace(/\s*;\s*$/, '');
        }

        function algoStartsWithAny(low, prefixes) {
            for (const p of prefixes) { if (low.startsWith(p + ' ') || low.startsWith(p + '(')) return p; }
            return null;
        }

        function algoEndsWithAny(low, suffixes) {
            for (const s of suffixes) { if (low.endsWith(' ' + s)) return s; }
            return null;
        }

        function algoRebuildBlocks(lines) {
            const blocks = [], stack = [];
            const pushBlock = (b) => { blocks.push(b); stack.push(b); };
            lines.forEach((raw, i) => {
                const line = algoNormalizeLine(raw).trim();
                if (!line) return;
                const low = line.toLowerCase();
                const ifPrefix = algoStartsWithAny(low, algoKW_IF_START);
                const thenSuffix = algoEndsWithAny(low, algoKW_THEN);
                if (ifPrefix && thenSuffix) {
                    const cond = line.slice(ifPrefix.length + 1, -(thenSuffix.length + 1)).trim();
                    pushBlock({ type: 'if', line: i, cond, elseLine: null, endLine: null });
                    return;
                }
                const elseifPrefix = algoStartsWithAny(low, algoKW_ELSE_IF);
                if (elseifPrefix && thenSuffix) {
                    const top = stack[stack.length - 1];
                    if (!top || top.type !== 'if') throw new Error('else if/sinon si بدون if/si (سطر ' + (i + 1) + ')');
                    const cond = line.slice(elseifPrefix.length + 1, -(thenSuffix.length + 1)).trim();
                    if (!top.elseIfs) top.elseIfs = [];
                    top.elseIfs.push({ line: i, cond });
                    return;
                }
                if (algoKW_ELSE.includes(low)) {
                    const top = stack[stack.length - 1];
                    if (!top || top.type !== 'if') throw new Error('else/sinon بدون if/si (سطر ' + (i + 1) + ')');
                    top.elseLine = i;
                    return;
                }
                const whilePrefix = algoStartsWithAny(low, algoKW_WHILE_START);
                const doSuffix = algoEndsWithAny(low, algoKW_DO);
                if (whilePrefix && doSuffix) {
                    const cond = line.slice(whilePrefix.length + 1, -(doSuffix.length + 1)).trim();
                    pushBlock({ type: 'while', line: i, cond, endLine: null });
                    return;
                }
                const forPrefix = algoStartsWithAny(low, algoKW_FOR_START);
                if (forPrefix && doSuffix) {
                    const middle = line.slice(forPrefix.length + 1, -(doSuffix.length + 1)).trim();
                    let toIdx = -1, toLen = 0;
                    for (const kwTo of algoKW_TO) {
                        const idx = middle.toLowerCase().indexOf(' ' + kwTo + ' ');
                        if (idx >= 0) { toIdx = idx; toLen = kwTo.length; break; }
                    }
                    if (toIdx < 0) throw new Error('صيغة for غير صحيحة: مفقود to/a (سطر ' + (i + 1) + ')');
                    const left = middle.slice(0, toIdx).trim();
                    const endExpr = middle.slice(toIdx + toLen + 2).trim();
                    const m = left.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
                    if (!m) throw new Error('صيغة for غير صحيحة: المتغير والبداية (سطر ' + (i + 1) + ')');
                    const [, name, startExpr] = m;
                    pushBlock({ type: 'for', line: i, varName: name, startExpr, endExpr, endLine: null });
                    return;
                }
                if (algoKW_END.includes(low) || low === 'finpour') {
                    if (!stack.length) {
                        if (low === 'end' || low === 'fin') return;
                        throw new Error('fin/finsi/fintantque/finpour إضافي بدون كتلة مفتوحة (سطر ' + (i + 1) + ')');
                    }
                    const top = stack[stack.length - 1];
                    const isFinSi = low === 'finsi';
                    const isFinTantQue = low === 'fintantque';
                    const isFinPour = low === 'finpour';
                    if (isFinSi && top.type !== 'if') throw new Error('finsi يغلق ' + top.type + ' بدلاً من if (سطر ' + (i + 1) + ')');
                    if (isFinTantQue && top.type !== 'while') throw new Error('fintantque يغلق ' + top.type + ' بدلاً من while (سطر ' + (i + 1) + ')');
                    if (isFinPour && top.type !== 'for') throw new Error('finpour يغلق ' + top.type + ' بدلاً من for (سطر ' + (i + 1) + ')');
                    stack.pop();
                    top.endLine = i;
                    return;
                }
            });
            if (stack.length) {
                const top = stack[stack.length - 1];
                throw new Error('كتلة غير مغلقة بدأت في سطر ' + (top.line + 1));
            }
            const mapIfByLine = new Map(), mapWhileByLine = new Map(), mapForByLine = new Map();
            blocks.forEach(b => { if (b.type === 'if') mapIfByLine.set(b.line, b); if (b.type === 'while') mapWhileByLine.set(b.line, b); if (b.type === 'for') mapForByLine.set(b.line, b); });
            return { blocks, mapIfByLine, mapWhileByLine, mapForByLine };
        }

        function algoGetLineKind(line) {
            const s = algoNormalizeLine(line).trim();
            const low = s.toLowerCase();
            if (!s) return { kind: 'empty' };
            if (algoStartsWithAny(low, algoKW_ALGORITHM)) return { kind: 'algorithm', text: s };
            if (algoStartsWithAny(low, algoKW_VAR)) return { kind: 'var', text: s };
            if (algoKW_START.includes(low)) return { kind: 'start', text: s };
            if (low.startsWith('let ')) return { kind: 'let', text: s };
            if (low.startsWith('print ')) return { kind: 'print', text: s };
            const readP = algoStartsWithAny(low, algoKW_READ);
            if (readP) return { kind: 'read', text: s };
            const writeP = algoStartsWithAny(low, algoKW_WRITE);
            if (writeP) return { kind: 'write', text: s };
            const ifP = algoStartsWithAny(low, algoKW_IF_START);
            const thenS = algoEndsWithAny(low, algoKW_THEN);
            if (ifP && thenS) return { kind: 'if', text: s };
            const elseifP = algoStartsWithAny(low, algoKW_ELSE_IF);
            if (elseifP && thenS) return { kind: 'elseif', text: s };
            if (algoKW_ELSE.includes(low)) return { kind: 'else', text: s };
            const whP = algoStartsWithAny(low, algoKW_WHILE_START);
            const doS = algoEndsWithAny(low, algoKW_DO);
            if (whP && doS) return { kind: 'while', text: s };
            const forP = algoStartsWithAny(low, algoKW_FOR_START);
            if (forP && doS) return { kind: 'for', text: s };
            if (algoKW_END.includes(low) || low === 'finpour' || low === 'finsi' || low === 'fintantque') return { kind: 'end', text: s };
            if (s.includes('\u2190')) return { kind: 'assign', text: s };
            return { kind: 'unknown', text: s };
        }

        function algoEscapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = String(text ?? '');
            return div.innerHTML;
        }

        function algoRenderVars() {
            const entries = Object.entries(algoVM.vars).filter(([k]) => !k.startsWith('__'));
            if (!entries.length) {
                algoVarsBody.innerHTML = '<tr><td colspan="2" class="algo-empty">لا توجد متغيرات بعد</td></tr>';
                return;
            }
            algoVarsBody.innerHTML = entries.sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => {
                    const value = typeof v === 'string' ? JSON.stringify(v) : String(v);
                    return '<tr><td>' + algoEscapeHtml(k) + '</td><td dir="ltr" style="text-align:left;">' + algoEscapeHtml(value) + '</td></tr>';
                }).join('');
        }

        function algoRenderOutput() { algoOutputEl.textContent = algoVM.out.join('\n'); }

        function algoHighlightLine(raw) {
            if (!raw.trim()) return '&nbsp;';
            let mainPart = raw, commentPart = '';
            const hashIdx = raw.indexOf('#'), slashIdx = raw.indexOf('//');
            let commentStart = -1;
            if (hashIdx >= 0 && (slashIdx < 0 || hashIdx <= slashIdx)) commentStart = hashIdx;
            else if (slashIdx >= 0) commentStart = slashIdx;
            if (commentStart >= 0) { mainPart = raw.slice(0, commentStart); commentPart = raw.slice(commentStart); }
            const tokens = [];
            const tokenRe = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?)|([A-Za-z\u00C0-\u00FF_]\w*)|(\u2190|:=|<=|>=|<>|!=|&&|\|\||[+\-*/%<>=!(),;:])|(\s+)|(.)/g;
            let m;
            while ((m = tokenRe.exec(mainPart)) !== null) {
                if (m[1] !== undefined) tokens.push('<span class="algo-tok-string">' + algoEscapeHtml(m[1]) + '</span>');
                else if (m[2] !== undefined) tokens.push('<span class="algo-tok-number">' + algoEscapeHtml(m[2]) + '</span>');
                else if (m[3] !== undefined) {
                    const word = m[3], low = word.toLowerCase();
                    if (algoHL_KEYWORDS.includes(low)) tokens.push('<span class="algo-tok-keyword">' + algoEscapeHtml(word) + '</span>');
                    else if (algoHL_CONTROL.includes(low)) tokens.push('<span class="algo-tok-control">' + algoEscapeHtml(word) + '</span>');
                    else if (algoHL_IO.includes(low)) tokens.push('<span class="algo-tok-io">' + algoEscapeHtml(word) + '</span>');
                    else if (algoHL_TYPES.includes(low)) tokens.push('<span class="algo-tok-type">' + algoEscapeHtml(word) + '</span>');
                    else if (algoHL_LOGIC.includes(low)) tokens.push('<span class="algo-tok-logic">' + algoEscapeHtml(word) + '</span>');
                    else tokens.push('<span class="algo-tok-var">' + algoEscapeHtml(word) + '</span>');
                } else if (m[4] !== undefined) tokens.push('<span class="algo-tok-op">' + algoEscapeHtml(m[4]) + '</span>');
                else if (m[5] !== undefined) tokens.push(m[5]);
                else tokens.push(algoEscapeHtml(m[6]));
            }
            if (commentPart) tokens.push('<span class="algo-tok-comment">' + algoEscapeHtml(commentPart) + '</span>');
            return tokens.join('');
        }

        function algoRenderHighlight() {
            const lines = algoVM.lines, cur = algoVM.pc;
            const html = lines.map((ln, idx) => {
                const colored = algoHighlightLine(ln);
                const num = String(idx + 1).padStart(2, '0');
                const isCur = idx === cur && !algoVM.halted;
                return '<div class="algo-line ' + (isCur ? 'is-current' : '') + '">' +
                    '<span class="algo-ln" aria-hidden="true">' + num + '</span>' +
                    '<span class="algo-code">' + colored + '</span></div>';
            }).join('');
            algoHighlightEl.innerHTML = html + '\n';
            const curEl = algoHighlightEl.querySelector('.algo-line.is-current');
            if (curEl) {
                const top = curEl.offsetTop, h = algoHighlightEl.clientHeight;
                if (top < algoHighlightEl.scrollTop || top > algoHighlightEl.scrollTop + h - 48) {
                    algoHighlightEl.scrollTop = Math.max(0, top - Math.floor(h / 3));
                }
            }
        }

        function algoResetVM() {
            algoVM.lines = algoEditorEl.value.replace(/\r\n/g, '\n').split('\n');
            const result = algoRebuildBlocks(algoVM.lines);
            algoVM.blocks = result.blocks;
            algoVM._ifMap = result.mapIfByLine;
            algoVM._whileMap = result.mapWhileByLine;
            algoVM._forMap = result.mapForByLine;
            algoVM.pc = 0; algoVM.vars = {}; algoVM.out = []; algoVM.halted = false;
            algoRenderVars(); algoRenderOutput(); algoRenderHighlight();
        }

        function algoJumpToNextExecutable() {
            while (algoVM.pc < algoVM.lines.length) {
                const { kind } = algoGetLineKind(algoVM.lines[algoVM.pc]);
                if (kind === 'empty') { algoVM.pc += 1; continue; }
                return;
            }
        }

        async function algoStepOnce() {
            if (algoVM.halted) return;
            algoJumpToNextExecutable();
            if (algoVM.pc >= algoVM.lines.length) { algoVM.halted = true; algoRenderHighlight(); return; }
            const lineIdx = algoVM.pc, raw = algoVM.lines[lineIdx];
            const s = algoNormalizeLine(raw).trim(), { kind } = algoGetLineKind(raw);
            try {
                algoVM._lastPC = algoVM.pc;
                if (kind === 'algorithm' || kind === 'start') { algoVM.pc += 1; }
                else if (kind === 'var') {
                    const low = s.toLowerCase(); let rest;
                    for (const kw of algoKW_VAR) { if (low.startsWith(kw + ' ')) { rest = s.slice(kw.length + 1).trim(); break; } }
                    if (!rest) rest = s.slice(3).trim();
                    const beforeType = rest.split(':')[0].trim();
                    const names = beforeType.split(',').map(x => x.trim()).filter(Boolean);
                    names.forEach(n => { if (/^[A-Za-z_]\w*$/.test(n) && !(n in algoVM.vars)) algoVM.vars[n] = null; });
                    algoVM.pc += 1;
                } else if (kind === 'let') {
                    const rest = s.slice(4).trim();
                    const m = rest.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
                    if (!m) throw new Error('صيغة let غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'assign') {
                    const m = s.match(/^([A-Za-z_]\w*)\s*\u2190\s*(.+)$/);
                    if (!m) throw new Error('صيغة الإسناد غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'read') {
                    const m = s.match(/^(?:read|lire)\s*\(\s*([A-Za-z_]\w*)\s*\)\s*$/i);
                    if (!m) throw new Error('صيغة Read/Lire غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const name = m[1];
                    const rawVal = await algoShowInputModal('أدخل قيمة المتغير: ' + name);
                    const v = rawVal == null ? '' : String(rawVal);
                    const num = Number(v);
                    algoVM.vars[name] = Number.isFinite(num) && v.trim() !== '' ? num : v;
                    algoVM.pc += 1;
                } else if (kind === 'write') {
                    const m = s.match(/^(?:write|ecrire|\u00e9crire)\s*\(\s*(.+)\s*\)\s*$/i);
                    if (!m) throw new Error('صيغة Write/Ecrire غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const val = algoEvalExpr(m[1], algoVM.vars);
                    algoVM.out.push(String(val));
                    algoVM.pc += 1;
                } else if (kind === 'print') {
                    const expr = s.slice(6).trim();
                    const val = algoEvalExpr(expr, algoVM.vars);
                    algoVM.out.push(String(val));
                    algoVM.pc += 1;
                } else if (kind === 'if') {
                    const b = algoVM._ifMap.get(lineIdx);
                    if (!b) throw new Error('if/si غير معروف (سطر ' + (lineIdx + 1) + ')');
                    const ok = Boolean(algoEvalExpr(b.cond, algoVM.vars));
                    if (ok) { algoVM.pc += 1; }
                    else {
                        let handled = false;
                        if (b.elseIfs) { for (const ei of b.elseIfs) { if (Boolean(algoEvalExpr(ei.cond, algoVM.vars))) { algoVM.pc = ei.line + 1; handled = true; break; } } }
                        if (!handled) algoVM.pc = (b.elseLine != null ? b.elseLine + 1 : b.endLine + 1);
                    }
                } else if (kind === 'elseif') {
                    const match = algoVM.blocks.find(b => b.type === 'if' && b.elseIfs && b.elseIfs.some(ei => ei.line === lineIdx));
                    if (!match) throw new Error('else if/sinon si بدون if/si (سطر ' + (lineIdx + 1) + ')');
                    algoVM.pc = match.endLine + 1;
                } else if (kind === 'else') {
                    const match = algoVM.blocks.find(b => b.type === 'if' && b.elseLine === lineIdx);
                    if (!match) throw new Error('else/sinon بدون if/si (سطر ' + (lineIdx + 1) + ')');
                    algoVM.pc = match.endLine + 1;
                } else if (kind === 'while') {
                    const b = algoVM._whileMap.get(lineIdx);
                    if (!b) throw new Error('while/tantque غير معروف (سطر ' + (lineIdx + 1) + ')');
                    const ok = Boolean(algoEvalExpr(b.cond, algoVM.vars));
                    if (ok) { algoVM.pc += 1; } else { algoVM.pc = b.endLine + 1; }
                } else if (kind === 'for') {
                    const b = algoVM._forMap.get(lineIdx);
                    if (!b) throw new Error('for/pour غير معروف (سطر ' + (lineIdx + 1) + ')');
                    const loopKey = '__for_' + lineIdx;
                    if (!algoVM.vars[loopKey]) { algoVM.vars[b.varName] = algoEvalExpr(b.startExpr, algoVM.vars); algoVM.vars[loopKey] = true; }
                    else { algoVM.vars[b.varName] = (Number(algoVM.vars[b.varName]) || 0) + 1; }
                    const currentVal = Number(algoVM.vars[b.varName]), endVal = Number(algoEvalExpr(b.endExpr, algoVM.vars));
                    if (currentVal <= endVal) { algoVM.pc += 1; }
                    else { delete algoVM.vars[loopKey]; algoVM.pc = b.endLine + 1; }
                } else if (kind === 'end') {
                    const whileBlock = algoVM.blocks.find(b => b.type === 'while' && b.endLine === lineIdx);
                    const forBlock = algoVM.blocks.find(b => b.type === 'for' && b.endLine === lineIdx);
                    if (whileBlock) algoVM.pc = whileBlock.line;
                    else if (forBlock) algoVM.pc = forBlock.line;
                    else algoVM.pc += 1;
                } else { throw new Error('سطر غير مدعوم (سطر ' + (lineIdx + 1) + ')'); }
            } catch (e) { algoVM.out.push('خطأ: ' + (e && e.message ? e.message : String(e))); algoVM.halted = true; }
            algoRenderVars(); algoRenderOutput(); algoRenderHighlight();
        }

        async function algoRunAll() {
            const CHUNK = 500; let steps = 0;
            const runChunk = async () => {
                let i = 0;
                while (!algoVM.halted && i < CHUNK) { await algoStepOnce(); i++; steps++; }
                if (!algoVM.halted && steps < 10000) { setTimeout(() => runChunk(), 0); }
                else if (steps >= 10000) { algoVM.out.push('تم إيقاف التشغيل: تجاوز الحد الأقصى للخطوات.'); algoVM.halted = true; algoRenderOutput(); algoRenderHighlight(); }
            };
            await runChunk();
        }

        function algoSyncScroll() { algoHighlightEl.scrollTop = algoEditorEl.scrollTop; algoHighlightEl.scrollLeft = algoEditorEl.scrollLeft; }

        algoEditorEl.addEventListener('input', () => {
            algoVM.lines = algoEditorEl.value.replace(/\r\n/g, '\n').split('\n');
            try { const result = algoRebuildBlocks(algoVM.lines); algoVM.blocks = result.blocks; algoVM._ifMap = result.mapIfByLine; algoVM._whileMap = result.mapWhileByLine; algoVM._forMap = result.mapForByLine; } catch (e) { console.warn('خوارزمية: خطأ في تحليل الكود', e); }
            algoRenderHighlight();
        });
        algoEditorEl.addEventListener('scroll', algoSyncScroll);

        algoRunBtn.addEventListener('click', async () => {
            if (algoIsRunning) return; algoIsRunning = true; algoRunBtn.disabled = true; algoStepBtn.disabled = true;
            try { algoResetVM(); await algoRunAll(); } finally { algoIsRunning = false; algoRunBtn.disabled = false; algoStepBtn.disabled = false; }
        });
        algoStepBtn.addEventListener('click', async () => {
            if (algoIsRunning) return;
            if (!algoVM.blocks?.length && algoEditorEl.value.trim()) {
                try { algoResetVM(); } catch (e) { algoVM.out.push('خطأ: ' + e.message); algoVM.halted = true; algoRenderOutput(); }
            }
            await algoStepOnce();
        });
        algoResetBtn.addEventListener('click', () => {
            if (confirm('هل تريد تحميل المثال الافتراضي؟ ستفقد الكود الحالي.')) {
                algoEditorEl.value = algoDefaultPrograms[algoCurrentLang];
            }
            algoResetVM();
        });

        if (algoLangToggle) {
            const langBtns = algoLangToggle.querySelectorAll('.algo-lang-btn');
            langBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const lang = btn.dataset.lang;
                    if (lang === algoCurrentLang) return;
                    algoCurrentLang = lang;
                    langBtns.forEach(b => b.classList.remove('is-active'));
                    btn.classList.add('is-active');
                    algoEditorEl.value = algoDefaultPrograms[algoCurrentLang];
                    algoResetVM();
                });
            });
        }

        // Examples
        const algoExampleBtns = document.querySelectorAll('.example-item');
        algoExampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.example;
                if (algoExamples[algoCurrentLang] && algoExamples[algoCurrentLang][type]) {
                    algoEditorEl.value = algoExamples[algoCurrentLang][type];
                    algoResetVM();
                }
            });
        });

        if (!algoEditorEl.value.trim()) algoEditorEl.value = algoDefaultPrograms[algoCurrentLang];
        algoResetVM();
    }

    // Typing effect for lab subtitle
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

    if (typingEl) typeLoop();
});
