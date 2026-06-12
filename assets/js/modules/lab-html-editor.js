// HTML Editor Advanced
(function() {
    "use strict";
    document.addEventListener('DOMContentLoaded', () => {

        // ==================== CONSTANTS ====================
        const HTML_TAGS = [
            'html','head','body','title','meta','link','script','style',
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

        const SNIPPETS = {
            'html5': '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
            'style': '<style>\n  /* CSS Code */\n  body { font-family: Arial; }\n</style>',
            'script': '<script>\n  // JS Code\n</script>',
            'form': '<form action="" method="post">\n  <label>الاسم: <input type="text" name="name"></label>\n  <button type="submit">إرسال</button>\n</form>',
            'table': '<table border="1">\n  <tr>\n    <th>العنوان</th>\n  </tr>\n  <tr>\n    <td>البيانات</td>\n  </tr>\n</table>'
        };

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

        function htmlSyncScroll() {
            if (htmlHL) { htmlHL.scrollTop = htmlTA.scrollTop; htmlHL.scrollLeft = htmlTA.scrollLeft; }
            if (htmlLN) htmlLN.scrollTop = htmlTA.scrollTop;
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
            const m = inside.match(/^<\s*([\w-!]*)$/);
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
                if (tagPrefix.startsWith('!')) {
                    type = 'snippet';
                    items = Object.keys(SNIPPETS).filter(k => ('!'+k).startsWith(tagPrefix));
                } else {
                    type = 'tag';
                    items = HTML_TAGS.filter(t => t.startsWith(tagPrefix.toLowerCase())).slice(0, 25);
                }
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
                if (type === 'tag') {
                    div.innerHTML = `<span class="sug-tag">&lt;${item}&gt;</span><span class="sug-desc">وسم HTML</span>`;
                } else if (type === 'snippet') {
                    div.innerHTML = `<span class="sug-tag">!${item}</span><span class="sug-desc">قالب جاهز</span>`;
                } else {
                    div.innerHTML = `<span class="sug-tag">${item}</span><span class="sug-desc">خاصية</span>`;
                }
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
            } else if (type === 'snippet') {
                const m = before.match(/(<[\w-!]*)$/);
                if (m) {
                    const newBefore = before.substring(0, before.length - m[0].length) + SNIPPETS[value];
                    htmlTA.value = newBefore + after;
                    const newPos = newBefore.length;
                    htmlTA.setSelectionRange(newPos, newPos);
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

            // Semantic Linter checks
            const imgRegex = /<img\s([^>]+)>/gi;
            let m2;
            while ((m2 = imgRegex.exec(code)) !== null) {
                if (!/alt\s*=\s*(["']).*?\1/i.test(m2[1])) {
                    const lineNum = code.substring(0, m2.index).split('\n').length;
                    errors.push({ line: lineNum, msg: `تحذير: ينصح بإضافة خاصية <code>alt</code> لوسم الصورة <code>&lt;img&gt;</code> لتحسين الوصول`, type: 'warning' });
                }
            }

            const depRegex = /<(center|font|marquee|blink)[\s>]/gi;
            while ((m2 = depRegex.exec(code)) !== null) {
                const lineNum = code.substring(0, m2.index).split('\n').length;
                errors.push({ line: lineNum, msg: `تحذير: الوسم <code>&lt;${m2[1]}&gt;</code> قديم (Deprecated) ولا ينصح باستخدامه`, type: 'warning' });
            }

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
                htmlSyncScroll();
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

        /** تشغيل كود HTML في iframe المعاينة */
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
                requestAnimationFrame(htmlSyncScroll);
            }, { passive: true });

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
    });
})();
