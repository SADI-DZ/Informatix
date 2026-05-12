// Workshop Navigation Logic - Robust Version
(function() {
    "use strict";
    // Initial Fallback Data in case JSON fetch fails
    const fallbackData = {
        "env": [
            {"id": "installer", "title": "محاكي التثبيت", "desc": "تجربة تثبيت نظام التشغيل خطوة بخطوة", "icon": "💿", "iconFile": "installer.svg", "category": "بيئة الحاسوب"},
            {"id": "network", "title": "إنشاء الشبكات", "desc": "تصميم وربط الأجهزة في شبكة محلية", "icon": "🔗", "iconFile": "network.svg", "category": "بيئة الحاسوب"}
        ],
        "programming": [
            {"id": "flowchart", "title": "مخطط التدفق", "desc": "بناء منطق الخوارزميات مرئياً", "icon": "📊", "iconFile": "flowchart.svg", "category": "البرمجة"},
            {"id": "algo-editor", "title": "محرر الخوارزميات", "desc": "كتابة وتجربة كود الخوارزميات", "icon": "📜", "iconFile": "algo-editor.svg", "category": "البرمجة"}
        ],
        "web": [
            {"id": "web-editor", "title": "محرر الويب التفاعلي", "desc": "كتابة HTML/CSS ومعاينتها فوراً", "icon": "🌐", "iconFile": "web-editor.svg", "category": "تقنيات الويب"}
        ]
    };

    let workshopsData = fallbackData;
    let isDataLoaded = false;

    // Initialize logic
    function initWorkshopModule() {
        console.log('informatix: تهيئة وحدة الورشات...');

        // 1. Fetch data from JSON
        fetch('../assets/data/workshops.json')
            .then(res => res.json())
            .then(data => {
                workshopsData = data;
                isDataLoaded = true;
                console.log('informatix: تم تحميل البيانات من JSON بنجاح');
            })
            .catch(err => {
                console.warn('informatix: فشل تحميل JSON، سيتم استخدام البيانات الاحتياطية', err);
            });

        // DOM Elements
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

        let currentWorkshopParent = null;
        let currentWorkshopElement = null;

        // Core Functions
        async function showWorkshopSelection(categoryId) {
            console.log('informatix: تفعيل المجال ->', categoryId);
            
            const data = workshopsData[categoryId];
            if (!data) {
                console.warn('informatix: لم يتم العثور على بيانات للمجال:', categoryId);
                return;
            }

            const categories = {
                env: 'بيئة التعامل مع الحاسوب',
                programming: 'مقدمة في البرمجة',
                web: 'تقنيات الويب',
                office: 'المكتبية'
            };
            
            if (categoryTitle) categoryTitle.textContent = categories[categoryId] || 'المجال';

            if (workshopGrid) {
                workshopGrid.innerHTML = '';
                data.forEach(ws => {
                    const card = document.createElement('div');
                    card.className = 'workshop-card';
                    const iconHtml = ws.iconFile
                        ? `<img src="../assets/images/workshops/${ws.iconFile}" alt="${ws.title}" class="workshop-icon-img">`
                        : `${ws.icon}`;
                    card.innerHTML = `
                        <div class="workshop-icon">${iconHtml}</div>
                        <h3>${ws.title}</h3>
                        <p>${ws.desc}</p>
                    `;
                    card.onclick = (e) => {
                        e.stopPropagation();
                        openWorkshopFullscreen(ws, categoryId);
                    };
                    workshopGrid.appendChild(card);
                });
            }

            // Display Logic
            if (labHero) labHero.style.display = 'none';
            if (labStationsSection) labStationsSection.style.display = 'none';
            if (workshopSelection) workshopSelection.style.display = 'block';

            if (typeof window.stopTypingEffect === 'function') window.stopTypingEffect();
            
            // Highlight sidebar
            document.querySelectorAll('.sidebar-nav li').forEach(li => {
                li.classList.toggle('active', li.dataset.station === categoryId);
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function openWorkshopFullscreen(ws, categoryId) {
            if (fsCategory) fsCategory.textContent = ws.category || 'ورشة';
            if (fsTitle) fsTitle.textContent = ws.title;

            let targetId = '';
            if (ws.id === 'installer') targetId = 'subtab-installer';
            if (ws.id === 'network') targetId = 'subtab-network';
            if (ws.id === 'flowchart') targetId = 'subtab-flowchart';
            if (ws.id === 'web-editor') targetId = 'subtab-web-editor';
            if (ws.id === 'algo-editor') targetId = 'subtab-algo-editor';

            const originalContent = document.getElementById(targetId);
            if (originalContent && fsContentArea) {
                currentWorkshopParent = originalContent.parentElement;
                currentWorkshopElement = originalContent;
                fsContentArea.appendChild(originalContent);
                originalContent.style.display = 'block';
                originalContent.classList.add('active');
                if (wsFullscreen) wsFullscreen.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeWorkshop() {
            if (currentWorkshopElement && currentWorkshopParent) {
                currentWorkshopParent.appendChild(currentWorkshopElement);
            }
            if (wsFullscreen) wsFullscreen.classList.remove('active');
            document.body.style.overflow = '';
            currentWorkshopElement = null;
            currentWorkshopParent = null;
        }

        // Global exposing
        window.activateStation = showWorkshopSelection;
        window.showWorkshopSelection = showWorkshopSelection;

        // Events
        if (btnBackToHero) {
            btnBackToHero.onclick = () => {
                if (workshopSelection) workshopSelection.style.display = 'none';
                if (labHero) labHero.style.display = 'flex';
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                if (typeof window._typeLoop === 'function') window._typeLoop();
            };
        }

        if (btnCloseWorkshop) btnCloseWorkshop.onclick = closeWorkshop;

        // Global Click Interceptor (Catch-all for data-station)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-station]');
            if (target && !target.classList.contains('sub-tab') && !target.classList.contains('station-dot')) {
                const stationId = target.getAttribute('data-station');
                if (stationId) {
                    console.log('informatix: التقاط نقرة على محطة:', stationId);
                    e.preventDefault();
                    showWorkshopSelection(stationId);
                }
            }
        });

        // Station dots and other specific elements
        document.querySelectorAll('.station-dot').forEach(dot => {
            dot.onclick = () => showWorkshopSelection(dot.dataset.station);
        });

        // Sub-tab logic
        document.querySelectorAll('.sub-tab').forEach(tab => {
            tab.onclick = () => {
                const parent = tab.closest('.station-workspace');
                if (!parent) return;
                const sub = tab.dataset.subtab;
                parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                parent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
                const target = parent.querySelector('#subtab-' + sub);
                if (target) target.classList.add('active');
            };
        });
    }

    // Safety check for initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkshopModule);
    } else {
        initWorkshopModule();
    }
})();
