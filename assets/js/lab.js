document.addEventListener('DOMContentLoaded', () => {

    // Particles animation
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const container = document.getElementById('lab-particles');
        if (container) {
            const colors = ['#00f2fe', '#4facfe', '#a78bfa', '#10b981', '#f59e0b'];
            for (let i = 0; i < 40; i++) {
                const p = document.createElement('div');
                p.className = 'lab-particle';
                const size = Math.random() * 4 + 1;
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                p.style.cssText = `position:fixed;width:${size}px;height:${size}px;left:${x}vw;top:${y}vh;background:${colors[i%5]};pointer-events:none;z-index:0;border-radius:50%;opacity:0;`;
                p.animate([
                    { transform: 'translate(0,0) scale(0)', opacity: 0 },
                    { transform: `translate(${Math.random()*80-40}px,${Math.random()*80-40}px) scale(1)`, opacity: Math.random() * 0.6 + 0.2 },
                    { transform: `translate(${Math.random()*120-60}px,${Math.random()*120-60}px) scale(0)`, opacity: 0 }
                ], {
                    duration: Math.random() * 8000 + 6000,
                    delay: Math.random() * 5000,
                    iterations: Infinity,
                    easing: 'ease-in-out'
                });
                container.appendChild(p);
            }
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

    // Station activation system
    const stationCards = document.querySelectorAll('.station-card');
    const stationToggles = document.querySelectorAll('.station-toggle');
    const stationDots = document.querySelectorAll('.station-dot');
    const sidebarItems = document.querySelectorAll('.sidebar-nav li');

    function activateStation(id) {
        stationCards.forEach(c => c.classList.remove('active'));
        stationDots.forEach(d => d.classList.remove('active'));
        const card = document.getElementById(`station-${id}`);
        if (card) card.classList.add('active');
        const dot = document.querySelector(`.station-dot[data-station="${id}"]`);
        if (dot) dot.classList.add('active');
        
        sidebarItems.forEach(item => {
            if (item.dataset.station === id) item.classList.add('active');
            else if (!item.dataset.station && id === 'env') item.classList.add('active');
            else item.classList.remove('active');
        });
    }

    stationToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.station;
            activateStation(id);
        });
    });

    stationCards.forEach(card => {
        const header = card.querySelector('.station-header');
        if (header) {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.station-toggle')) return;
                const id = card.id.replace('station-', '');
                activateStation(id);
            });
        }
    });

    stationDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const id = dot.dataset.station;
            activateStation(id);
        });
    });

    // Sidebar navigation to stations
    sidebarItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const stations = ['env', 'programming', 'web'];
            if (index < stations.length) {
                activateStation(stations[index]);
            }
        });
    });

    // Sub-tabs system
    document.querySelectorAll('.sub-tabs').forEach(tabs => {
        tabs.querySelectorAll('.sub-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const parent = tabs.closest('.station-workspace') || tabs.parentElement;
                tabs.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const subtabId = tab.dataset.subtab;
                parent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
                const target = parent.querySelector(`#subtab-${subtabId}`);
                if (target) target.classList.add('active');
            });
        });
    });

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

    let netDevices = [];
    let netLinks = [];
    let dragDevice = null;
    let dragOffset = { x: 0, y: 0 };
    let isLinking = false;
    let linkStart = null;
    let selectedDevice = null;

    const deviceIcons = { pc: '💻', server: '🖥️', switch: '🔀', router: '📡' };
    const deviceColors = { pc: '#4facfe', server: '#10b981', switch: '#f59e0b', router: '#a78bfa' };

    function renderNet() {
        if (!netCanvas) return;
        netCanvas.innerHTML = '';

        // Draw links
        netLinks.forEach((link, idx) => {
            const from = netDevices[link.from];
            const to = netDevices[link.to];
            if (!from || !to) return;
            const line = document.createElement('div');
            line.className = 'net-link';
            const x1 = from.x + 30, y1 = from.y + 20;
            const x2 = to.x + 30, y2 = to.y + 20;
            const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            line.style.cssText = `
                position:absolute;left:${x1}px;top:${y1}px;width:${length}px;height:2px;
                transform-origin:0 0;transform:rotate(${angle}deg);
                background:linear-gradient(90deg,var(--blue-primary),#10b981);
                z-index:1;pointer-events:none;
            `;
            netCanvas.appendChild(line);
        });

        // Draw devices
        netDevices.forEach((dev, idx) => {
            const el = document.createElement('div');
            el.className = `net-device${selectedDevice === idx ? ' selected' : ''}`;
            el.dataset.index = idx;
            el.style.cssText = `position:absolute;left:${dev.x}px;top:${dev.y}px;border:2px solid ${deviceColors[dev.type]};background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;display:flex;flex-direction:column;align-items:center;cursor:grab;z-index:2;`;
            el.innerHTML = `
                <span style="font-size:1.5rem">${deviceIcons[dev.type]}</span>
                <span style="font-size:0.7rem;margin-top:5px;color:white;">${dev.name}</span>
            `;
            // Drag
            el.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                dragDevice = idx;
                dragOffset.x = e.clientX - dev.x;
                dragOffset.y = e.clientY - dev.y;
                el.style.cursor = 'grabbing';
            });
            // Click to select
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isLinking) {
                    if (linkStart !== null && linkStart !== idx) {
                        addLink(linkStart, idx);
                    }
                    isLinking = false;
                    linkStart = null;
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
        if (!exists) {
            netLinks.push({ from, to });
        }
    }

    if (netCanvas) {
        document.addEventListener('mousemove', (e) => {
            if (dragDevice === null) return;
            const rect = netCanvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, netCanvas.clientWidth - 70));
            const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, netCanvas.clientHeight - 50));
            netDevices[dragDevice].x = x;
            netDevices[dragDevice].y = y;
            renderNet();
        });
        document.addEventListener('mouseup', () => {
            dragDevice = null;
        });

        netCanvas.addEventListener('click', (e) => {
            if (e.target === netCanvas) {
                selectedDevice = null;
                isLinking = false;
                linkStart = null;
                renderNet();
            }
        });
    }

    document.querySelectorAll('.net-device-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!netCanvas) return;
            const type = btn.dataset.device;
            const count = netDevices.filter(d => d.type === type).length;
            const names = {pc: 'حاسوب', server: 'خادم', switch: 'مبدل', router: 'موجه'};
            const name = `${names[type]} ${count + 1}`;
            const x = 20 + Math.random() * (netCanvas.clientWidth - 100);
            const y = 20 + Math.random() * (netCanvas.clientHeight - 80);
            netDevices.push({ type, name, x, y });
            renderNet();
        });
    });

    if (netClear) {
        netClear.addEventListener('click', () => {
            netDevices = [];
            netLinks = [];
            selectedDevice = null;
            isLinking = false;
            linkStart = null;
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
        if (flowCode) flowCode.textContent = data.code;
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

    // --- محرر الأكواد ---
    const codeEditorArea = document.getElementById('code-editor-textarea');
    const codeRunBtn = document.getElementById('code-run-btn');
    const codeOutput = document.getElementById('output-content');

    if (codeRunBtn && codeEditorArea) {
        codeRunBtn.addEventListener('click', () => {
            const code = codeEditorArea.value;
            if (codeOutput) {
                codeOutput.textContent = 'جاري التنفيذ...';
                codeOutput.style.color = 'var(--text-secondary)';
                setTimeout(() => {
                    if (code.includes('اطبع') || code.includes('أظهر')) {
                        const match = code.match(/(?:اطبع|أظهر)\s+([^\n]+)/);
                        codeOutput.textContent = match ? `> ${match[1]}` : '> تم التنفيذ بنجاح';
                    } else {
                        codeOutput.textContent = '> تم التنفيذ بنجاح (بدون مخرجات)';
                    }
                    codeOutput.style.color = '#10b981';
                }, 600);
            }
        });
    }

    // ============================================================
    // HTML editor
    const htmlEditor = document.getElementById('html-editor-textarea');
    const htmlRunBtn = document.getElementById('html-run-btn');
    const htmlPreview = document.getElementById('html-preview-iframe');

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
        htmlEditor.addEventListener('input', updateHtmlPreview);
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
