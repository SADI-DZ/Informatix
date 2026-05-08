// ننتظر حتى يكتمل تحميل هيكل الصفحة بالكامل قبل تنفيذ أي كود
document.addEventListener('DOMContentLoaded', () => {
    
    // الجزء الخاص بتوليد الجسيمات المتحركة في الخلفية
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 25; // عدد الجسيمات التي نريد عرضها

        // نقوم بتوليد الجسيمات واحدا تلو الآخر
        for (let i = 0; i < particleCount; i++) {
            createParticle();
        }

        // دالة مسؤولة عن إنشاء جسيم واحد بخصائص وحركة عشوائية
        function createParticle() {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // تحديد خصائص عشوائية للحجم والموضع والسرعة لجعل الحركة تبدو طبيعية
            const size = Math.random() * 5 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;

            // تطبيق الخصائص على العنصر
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}vw`;
            particle.style.top = `${posY}vh`;
            particle.style.willChange = 'transform, opacity';
            
            // إعداد حركة الجسيم باستخدام واجهة برمجة الحركات في جافاسكريبت
            particle.animate([
                { transform: `translate(0, 0)`, opacity: Math.random() * 0.5 },
                { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                delay: delay * 1000,
                iterations: Infinity,
                direction: 'alternate', // لجعل الجسيم يعود لنقطة البداية بشكل سلس
                easing: 'ease-in-out'
            });

            // إضافة الجسيم إلى الحاوية الخاصة به في الصفحة
            particlesContainer.appendChild(particle);
        }
    }

    // الجزء الخاص بتبديل مظهر الموقع بين الليلي والنهاري
    const themeCheckbox = document.getElementById('theme-checkbox');
    const rootElement = document.documentElement;
    
    // نتحقق مما إذا كان المستخدم قد اختار مظهرا معينا في زياراته السابقة
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        rootElement.setAttribute('data-theme', currentTheme);
        // تحديث حالة زر التبديل ليتوافق مع المظهر المحفوظ
        if (currentTheme === 'light') {
            themeCheckbox.checked = true;
        }
    }

    // الاستماع لتغيير حالة زر التبديل لتحديث المظهر فوريا
    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            // تفعيل المظهر النهاري وحفظ الخيار
            rootElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            // العودة للمظهر الليلي الافتراضي
            rootElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        }
    });

    // الجزء الخاص بالقائمة الجانبية للشاشات الصغيرة (الهواتف)
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    // التأكد من وجود العناصر لتجنب الأخطاء البرمجية
    if (mobileMenuBtn && navLinks) {
        // فتح أو إغلاق القائمة عند الضغط على زر القائمة
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // إغلاق القائمة تلقائيا بمجرد اختيار أحد الروابط
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // تأثير shrink على الـ navbar عند التمرير
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.style.padding = window.scrollY > 50 ? '0.8rem 5%' : '1.5rem 5%';
        navbar.style.transition = 'padding 0.3s ease';
    });

    // تتبع القسم النشط تلقائياً
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

    // إغلاق قائمة الموبايل عند Escape وعند الضغط خارجها
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks) navLinks.classList.remove('active');
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar') && navLinks) navLinks.classList.remove('active');
    });
});
