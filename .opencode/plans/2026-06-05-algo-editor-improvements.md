# خطة تحسين محرر الخوارزميات

**التاريخ:** 2026-06-05  
**الحالة:** معتمدة - جاهزة للتنفيذ

---

## نظرة عامة

تحسينات على محرر الخوارزميات (`lab/algo-editor.html` + `lab-algo-engine.js`) بناءً على نتائج اختبارات Playwright (30/30 اختبار ناجح). 5 محاور: حفظ تلقائي، عداد خطوات، رسائل خطأ أفضل، إصلاحات، اختبارات إضافية.

---

## المحور 1: الحفظ التلقائي (localStorage)

### الملفات المتأثرة
- `assets/js/modules/lab-algo-engine.js`

### التغييرات

**إضافة ثوابت التخزين:**
```javascript
const ALGO_STORAGE_KEY_CODE = 'algo-editor-code';
const ALGO_STORAGE_KEY_LANG = 'algo-editor-lang';
```

**دالة `algoSaveState()`:**
```javascript
function algoSaveState() {
    try {
        localStorage.setItem(ALGO_STORAGE_KEY_CODE, algoEditorEl.value);
        localStorage.setItem(ALGO_STORAGE_KEY_LANG, algoCurrentLang);
    } catch (e) { /* ignore */ }
}
```

**دالة `algoLoadState()`:** ترجع الكود المحفوظ أو `null`. تسترجع اللغة أيضاً وتحدّث أزرار التبديل.

**في `DOMContentLoaded`:** استبدال:
```javascript
// قبل:
if (!algoEditorEl.value.trim()) algoEditorEl.value = algoDefaultPrograms[algoCurrentLang];
// بعد:
const savedCode = algoLoadState();
algoEditorEl.value = savedCode || algoDefaultPrograms[algoCurrentLang];
```

**في `algoPushHistory()`:** إضافة `algoSaveState()`.

**في أزرار اللغة:** إضافة `algoSaveState()` بعد تغيير `algoCurrentLang`.

**في زر New:** مسح `localStorage.removeItem(ALGO_STORAGE_KEY_CODE)`.

---

## المحور 2: عداد الخطوات

### الملفات المتأثرة
- `lab/algo-editor.html` - عنصر `<span>`
- `assets/js/modules/lab-algo-engine.js` - منطق
- `assets/css/lab-editors.css` - تنسيق

### التغييرات

**HTML** - إضافة في `div.lab-actions` بعد زر Reset وقبل Undo:
```html
<span id="algoStepCounter" class="algo-step-counter" aria-live="polite"></span>
```

**JS - متغير ودوال:**
```javascript
let algoStepCounter = 0;

function algoUpdateStepCounter() {
    const el = document.getElementById('algoStepCounter');
    if (!el) return;
    if (algoStepCounter > 0) {
        el.textContent = `خطوات: ${algoStepCounter.toLocaleString()}`;
        el.classList.add('is-visible');
    } else {
        el.textContent = '';
        el.classList.remove('is-visible');
    }
}
```
- `algoResetVM()`: `algoStepCounter = 0; algoUpdateStepCounter();`
- `algoStepOnce()`: `algoStepCounter++; algoUpdateStepCounter();` داخل `try`
- تحميل مثال / تبديل لغة: `algoStepCounter = 0; algoUpdateStepCounter();`

**CSS** (في `lab-editors.css`):
```css
.algo-step-counter {
    display: none; align-items: center; gap: 0.3rem;
    padding: 0.25rem 0.65rem; background: #f59e0b; color: #1e293b;
    border-radius: 0.5rem; font-weight: 800; font-size: 0.85rem;
    direction: ltr; white-space: nowrap;
}
.algo-step-counter.is-visible { display: inline-flex; }
```

---

## المحور 3: رسائل خطأ أفضل

### الملفات المتأثرة
- `assets/js/modules/lab-algo-engine.js`

### التغييرات

**إضافة دالة `algoFormatError(msg)`:**
```javascript
function algoFormatError(msg) {
    const map = {
        'Algorithm': 'E001', 'يبدأ البرنامج': 'E001',
        'غير معرّف': 'E002', 'أضف': 'E002',
        'فاصلة منقوطة': 'E003', ';': 'E003',
        'تتوقف': 'E004', 'تكرار': 'E004',
        'التعبير الحسابي': 'E005', 'القسمة على صفر': 'E005', 'غير مكتمل': 'E005',
        'غير مغلقة': 'E006', 'إضافية': 'E006', 'غير متطابق': 'E006',
        'غير مسموح': 'E007', 'ممنوعة': 'E007',
        'محجوزة': 'E008',
    };
    const code = Object.entries(map).find(([kw]) => msg.includes(kw))?.[1] || 'E000';
    return `[${code}] ${msg}`;
}
```

**تطبيق التنسيق في:**
- `algoSyntaxErrorEl.textContent` ← `algoFormatError(e.message)`
- `algoVM.out.push('❌ خطأ: ' + msg)` ← `algoVM.out.push('❌ ' + algoFormatError(msg))`

---

## المحور 4: إصلاحات أخطاء

### الملفات المتأثرة
- `assets/js/modules/lab-algo-engine.js`

### الإصلاحات

**4.1 منع scroll loop:**
```javascript
let algoScrollSyncing = false;
function algoSyncScroll() {
    if (algoScrollSyncing) return;
    algoScrollSyncing = true;
    algoHighlightEl.scrollTop = algoEditorEl.scrollTop;
    algoHighlightEl.scrollLeft = algoEditorEl.scrollLeft;
    requestAnimationFrame(() => { algoScrollSyncing = false; });
}
```

**4.2 فحص الكلمات المحجوزة في الإسناد:**
في `algoStepOnce` قسم `kind === 'assign'`، بعد استخراج `name` وقبل `if (!(name in algoVM.vars))`:
```javascript
if (algoReservedKeywords.has(name.toLowerCase())) {
    throw new Error(`"${name}" كلمة محجوزة (سطر ${lineIdx + 1})`);
}
```

**4.3 تحسين `algoSanitizeExpr`:**
إضافة `null`, `undefined` إلى قائمة الكلمات الممنوعة.

---

## المحور 5: اختبارات إضافية

### الملفات المتأثرة
- `tests/algo-editor.spec.js`

### الاختبارات الجديدة (8 اختبارات)

| # | الاختبار | الوصف |
|---|---------|-------|
| 31 | **While loop** | `while i <= 3 do` مع عداد ومخرجات 1,2,3 |
| 32 | **Const** | `const pi = 3` ثم استخدامه: `r * pi` = 15 |
| 33 | **Else if chain** | مسارين مختلفين مع score=95 و score=85 |
| 34 | **Comments** | خطوط تحتوي `//` و `#` لا تؤثر |
| 35 | **Div/Mod** | `17 div 5` و `17 mod 5` = 5 |
| 36 | **Nested if in for** | `for i=1..5` مع `if i mod 2 = 0` → Even:2,4 |
| 37 | **String concat** | دمج نصوص ومتغيرات في `Write` |
| 38 | **Auto-save** | حفظ واستعادة من localStorage بعد reload |

---

## ترتيب التنفيذ

```
1. المحور 1 (الحفظ التلقائي) ← يليه فوراً اختبار 38
2. المحور 2 (عداد الخطوات)
3. المحور 4 (إصلاحات) + المحور 3 (رسائل خطأ) ← بالتوازي
4. المحور 5 (باقي الاختبارات: 31-37)
5. تشغيل جميع الاختبارات (ak 38) والتحقق
```

## التحقق من النجاح

```powershell
npx playwright test tests/algo-editor.spec.js --reporter=list --timeout=15000
```
توقع: 38/38 اختبار ناجح.
