// Installer simulator
(function() {
    document.addEventListener('DOMContentLoaded', () => {
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

        // Initial render
        updateInstaller();
    });
})();
