// Algorithm Editor Engine
(function () {
    "use strict";
    document.addEventListener('DOMContentLoaded', () => {
        const algoEditorEl = document.getElementById('algoEditor');
        const algoHighlightEl = document.getElementById('algoHighlight');
        const algoVarsBody = document.getElementById('algoVarsBody');
        const algoOutputEl = document.getElementById('algoOutput');
        const algoRunBtn = document.getElementById('algoRunBtn');
        const algoStepBtn = document.getElementById('algoStepBtn');
        const algoResetBtn = document.getElementById('algoResetBtn');
        const algoUndoBtn = document.getElementById('algoUndoBtn');
        const algoRedoBtn = document.getElementById('algoRedoBtn');
        const algoNewBtn = document.getElementById('algoNewBtn');
        const algoLangToggle = document.getElementById('algoLangToggle');
        const algoStepCounterEl = document.getElementById('algoStepCounter');

        if (!algoEditorEl || !algoHighlightEl || !algoVarsBody || !algoOutputEl || !algoRunBtn || !algoStepBtn || !algoResetBtn) return;
        algoOutputEl.setAttribute('dir', 'rtl');

        let algoCurrentLang = 'en';
        let algoIsRunning = false;
        let algoReplacingAssign = false;
        let algoErrorLine = -1;
        let algoStepCounter = 0;
        let algoHistory = [];
        let algoHistoryIdx = -1;
        const ALGO_MAX_HISTORY = 100;
        const ALGO_STORAGE_KEY_CODE = 'algo-editor-code';
        const ALGO_STORAGE_KEY_LANG = 'algo-editor-lang';
        let algoIsUndoRedoing = false;

        function algoSaveState() {
            try {
                localStorage.setItem(ALGO_STORAGE_KEY_CODE, algoEditorEl.value);
                localStorage.setItem(ALGO_STORAGE_KEY_LANG, algoCurrentLang);
            } catch (e) { /* localStorage غير متاح أو ممتلئ */ }
        }

        function algoLoadState() {
            try {
                const savedCode = localStorage.getItem(ALGO_STORAGE_KEY_CODE);
                const savedLang = localStorage.getItem(ALGO_STORAGE_KEY_LANG);
                if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
                    algoCurrentLang = savedLang;
                    const langBtns = document.querySelectorAll('.algo-lang-btn');
                    langBtns.forEach(b => b.classList.toggle('is-active', b.dataset.lang === savedLang));
                }
                return savedCode || null;
            } catch (e) { return null; }
        }

        function algoPushHistory() {
            if (algoIsUndoRedoing) return;
            const val = algoEditorEl.value;
            if (algoHistoryIdx >= 0 && algoHistory[algoHistoryIdx] === val) return;
            if (algoHistoryIdx < algoHistory.length - 1) {
                algoHistory = algoHistory.slice(0, algoHistoryIdx + 1);
            }
            algoHistory.push(val);
            if (algoHistory.length > ALGO_MAX_HISTORY) algoHistory.shift();
            algoHistoryIdx = algoHistory.length - 1;
            algoUpdateUndoButtons();
            algoSaveState();
        }

        function algoUndo() {
            if (algoHistoryIdx <= 0) return;
            algoHistoryIdx--;
            algoIsUndoRedoing = true;
            algoEditorEl.value = algoHistory[algoHistoryIdx];
            algoEditorEl.dispatchEvent(new Event('input', { bubbles: true }));
            algoIsUndoRedoing = false;
            algoUpdateUndoButtons();
            algoEditorEl.focus();
        }

        function algoRedo() {
            if (algoHistoryIdx >= algoHistory.length - 1) return;
            algoHistoryIdx++;
            algoIsUndoRedoing = true;
            algoEditorEl.value = algoHistory[algoHistoryIdx];
            algoEditorEl.dispatchEvent(new Event('input', { bubbles: true }));
            algoIsUndoRedoing = false;
            algoUpdateUndoButtons();
            algoEditorEl.focus();
        }

        function algoUpdateUndoButtons() {
            if (algoUndoBtn) algoUndoBtn.disabled = algoHistoryIdx <= 0;
            if (algoRedoBtn) algoRedoBtn.disabled = algoHistoryIdx >= algoHistory.length - 1;
        }

        function algoFormatError(msg) {
            if (/غير معروف|أمر غير معروف/i.test(msg)) return '[E001] ' + msg;
            if (/غير معرّف|not defined|not declared|لم يعرّف/i.test(msg)) return '[E002] ' + msg;
            if (/محجوزة|محجوز|reserved/i.test(msg)) return '[E003] ' + msg;
            if (/صيغة.*غير صحيحة|غير صحيحة.*صيغة/i.test(msg)) return '[E004] ' + msg;
            if (/بنية|structure|هيكل/i.test(msg)) return '[E005] ' + msg;
            if (/لا تتوقف|infinite|حلقة لا نهائية/i.test(msg)) return '[E006] ' + msg;
            if (/قسمة|division|zero|صفر/i.test(msg)) return '[E007] ' + msg;
            return '[E008] ' + msg;
        }

        function algoLineIsRtl(line) {
            return /[\u0600-\u06FF]/.test(line) || /^❌|^خطأ/.test(line);
        }

        function algoResizeEditor() {
            const selStart = algoEditorEl.selectionStart;
            const selEnd = algoEditorEl.selectionEnd;
            const prev = algoEditorEl.style.height;
            if (prev) {
                algoEditorEl.style.height = '1px';
            } else {
                algoEditorEl.style.height = 'auto';
            }
            const newHeight = Math.max(360, algoEditorEl.scrollHeight);
            if (newHeight !== parseInt(prev) || !prev) {
                algoEditorEl.style.height = newHeight + 'px';
            } else {
                algoEditorEl.style.height = prev;
            }
            if (algoEditorEl.selectionStart !== selStart || algoEditorEl.selectionEnd !== selEnd) {
                algoEditorEl.setSelectionRange(selStart, selEnd);
            }
        }

        function algoUpdateStepCounter() {
            if (!algoStepCounterEl) return;
            if (algoStepCounter > 0) {
                algoStepCounterEl.textContent = 'الخطوات: ' + algoStepCounter;
                algoStepCounterEl.classList.add('is-visible');
            } else {
                algoStepCounterEl.textContent = '';
                algoStepCounterEl.classList.remove('is-visible');
            }
        }

        // ==================== CONSTANTS ====================
        const algoKW_ALGORITHM = ['algorithm', 'algorithme'];
        const algoKW_VAR = ['var', 'variable', 'variables'];
        const algoKW_START = ['start', 'debut', 'd\u00e9but', 'begin'];
        const algoKW_END = ['end', 'fin', 'finsi', 'fintantque', 'finpour', 'endif', 'endwhile', 'endfor'];
        const algoKW_IF_START = ['if', 'si'];
        const algoKW_ELSE_IF = ['else if', 'sinon si'];
        const algoKW_THEN = ['then', 'alors'];
        const algoKW_ELSE = ['else', 'sinon'];
        const algoKW_WHILE_START = ['while', 'tantque'];
        const algoKW_FOR_START = ['for', 'pour'];
        const algoKW_TO = ['to', '\u00e0'];
        const algoKW_DO = ['do', 'faire'];
        const algoKW_READ = ['read', 'lire'];
        const algoKW_WRITE = ['write', 'ecrire', '\u00e9crire'];

        const algoHL_KEYWORDS = [...algoKW_ALGORITHM, ...algoKW_VAR, ...algoKW_START, ...algoKW_END.filter(k => !['endif', 'endwhile', 'endfor', 'finsi', 'fintantque', 'finpour'].includes(k)), 'const', 'mod', 'div'];
        const algoHL_CONTROL = [...algoKW_IF_START, ...algoKW_THEN, ...algoKW_ELSE, ...algoKW_WHILE_START, ...algoKW_FOR_START, ...algoKW_TO, ...algoKW_DO, 'finsi', 'fintantque', 'finpour', 'endif', 'endwhile', 'endfor', 'end while', 'end for', 'fin si', 'fin tant que', 'fin pour', 'else if', 'sinon si'];
        const algoHL_IO = [...algoKW_READ, ...algoKW_WRITE, 'print', 'let'];
        const algoHL_TYPES = ['integer', 'real', 'string', 'boolean', 'char', 'entier', 'reel', 'r\u00e9el', 'chaine', 'cha\u00eene', 'booleen', 'bool\u00e9en', 'caractere', 'caract\u00e8re'];
        const algoHL_LOGIC = ['and', 'or', 'not', 'true', 'false', 'et', 'ou', 'non', 'vrai', 'faux'];

        const algoEnToFr = {
            'algorithm': 'algorithme', 'begin': 'debut', 'start': 'debut', 'end': 'fin',
            'var': 'var', 'variable': 'variable', 'variables': 'variables',
            'if': 'si', 'then': 'alors', 'else': 'sinon', 'else if': 'sinon si', 'endif': 'finsi',
            'while': 'tantque', 'endwhile': 'fintantque',
            'for': 'pour', 'endfor': 'finpour', 'to': '\u00e0', 'do': 'faire',
            'write': 'ecrire', 'read': 'lire', 'print': 'print', 'let': 'let', 'const': 'const',
            'and': 'et', 'or': 'ou', 'not': 'non', 'true': 'vrai', 'false': 'faux',
            'mod': 'mod', 'div': 'div',
            'integer': 'entier', 'real': 'reel', 'string': 'chaine', 'boolean': 'booleen', 'char': 'caractere',
        };

        const algoFrToEn = {
            'algorithme': 'algorithm', 'debut': 'begin', 'd\u00e9but': 'begin', 'fin': 'end',
            'var': 'var', 'variable': 'variable', 'variables': 'variables',
            'si': 'if', 'alors': 'then', 'sinon': 'else', 'sinon si': 'else if', 'finsi': 'endif',
            'tantque': 'while', 'fintantque': 'endwhile',
            'pour': 'for', 'finpour': 'endfor', '\u00e0': 'to', 'faire': 'do',
            'ecrire': 'write', '\u00e9crire': 'write', 'lire': 'read',
            'print': 'print', 'let': 'let', 'const': 'const',
            'et': 'and', 'ou': 'or', 'non': 'not', 'vrai': 'true', 'faux': 'false',
            'mod': 'mod', 'div': 'div',
            'entier': 'integer', 'reel': 'real', 'r\u00e9el': 'real',
            'chaine': 'string', 'cha\u00eene': 'string',
            'booleen': 'boolean', 'bool\u00e9en': 'boolean',
            'caractere': 'char', 'caract\u00e8re': 'char',
        };

        function algoTranslateKeywords(text, fromLang, toLang) {
            const map = fromLang === 'en' ? algoEnToFr : algoFrToEn;
            const parts = [];
            const tokenRe = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?)|([A-Za-z\u00C0-\u00FF_]\w*)|(\u2190|:=|<=|>=|<>|!=|&&|\|\||[+\-*/%<>=!(),;:])|(\s+)|(.)/g;
            let m;
            while ((m = tokenRe.exec(text)) !== null) {
                if (m[3] !== undefined) {
                    const word = m[3], low = word.toLowerCase();
                    const trans = map[low];
                    if (trans) {
                        const allUp = word.length > 1 && word === word.toUpperCase();
                        const firstUp = word[0] === word[0].toUpperCase();
                        if (allUp) parts.push(trans.toUpperCase());
                        else if (firstUp) parts.push(trans.charAt(0).toUpperCase() + trans.slice(1));
                        else parts.push(trans);
                    } else {
                        parts.push(word);
                    }
                } else {
                    parts.push(m[0]);
                }
            }
            return parts.join('');
        }

        const algoReservedKeywords = new Set([
            ...algoHL_KEYWORDS,
            ...algoHL_CONTROL.filter(k => !algoKW_TO.includes(k)),
            ...algoHL_IO,
            ...algoHL_TYPES,
            ...algoHL_LOGIC
        ].map(k => k.toLowerCase()));

        const algoDefaultPrograms = {
            en: 'Algorithm example\nBegin\n  Write("Hello World!");\nEnd',
            fr: 'Algorithme exemple\nDebut\n  Ecrire("Hello World!");\nFin'
        };

        const algoExamples = {
            hello: 'Algorithm HelloWorld\nBegin\n  Write("Hello World!");\nEnd',
            sum: 'Algorithm Summation\nVar\n  a, b, s : integer;\nBegin\n  a = 10;\n  b = 20;\n  s = a + b;\n  Write("The sum is:");\n  Write(s);\nEnd',
            condition: 'Algorithm Grades\nVar\n  score : integer;\nBegin\n  score = 85;\n  if score >= 90 then\n    Write("Excellent");\n  else if score >= 80 then\n    Write("Very Good");\n  else if score >= 70 then\n    Write("Good");\n  else\n    Write("Needs improvement");\n  endif\nEnd',
            loop: 'Algorithm Counting\nVar\n  i : integer;\nBegin\n  for i = 1 to 5 do\n    Write("Number:");\n    Write(i);\n  endfor\nEnd',
            boolean: 'Algorithm BooleanExample\nVar\n  isAdult, hasLicense : boolean;\nBegin\n  isAdult = true;\n  hasLicense = false;\n  if isAdult and hasLicense then\n    Write("Allowed to drive");\n  else\n    Write("Not allowed to drive");\n  endif\nEnd'
        };

        // ==================== VM ====================
        const ALGO_MAX_LOOP_ITER = 10000;
        let algoVM = { lines: [], blocks: [], pc: 0, vars: {}, out: [], halted: false, isStale: false, _ifMap: new Map(), _whileMap: new Map(), _forMap: new Map(), _loopCounters: {} };

        // ==================== SYNTAX ERROR UI ====================
        const algoSyntaxErrorEl = document.createElement('div');
        algoSyntaxErrorEl.className = 'algo-syntax-error';
        algoSyntaxErrorEl.style.color = '#ef4444';
        algoSyntaxErrorEl.style.padding = '0.5rem';
        algoSyntaxErrorEl.style.fontSize = '0.9rem';
        algoSyntaxErrorEl.style.fontWeight = 'bold';
        algoSyntaxErrorEl.style.display = 'none';
        algoSyntaxErrorEl.setAttribute('role', 'alert');
        algoSyntaxErrorEl.setAttribute('dir', 'rtl');
        algoEditorEl.parentElement.appendChild(algoSyntaxErrorEl);

        function algoParseErrorLine(msg) {
            const m = msg.match(/سطر (\d+)/);
            return m ? parseInt(m[1], 10) - 1 : -1;
        }

        // ==================== HELPERS ====================
        /** تنظيف وحظر التعبيرات الخطرة (حقن) */
        function algoSanitizeExpr(expr) {
            const s = String(expr ?? '').trim();
            if (!/^[\w\s"'\p{L}\p{N}\p{M}،؟;?+\-*/%<>=!&|().,:]+$/u.test(s)) throw new Error('التعبير يحتوي على رموز غير مسموح بها.');
            const forbidden = ['window', 'document', 'fetch', 'XMLHttpRequest', 'eval', 'setTimeout', 'setInterval', 'Function', 'alert', 'console', 'cookie', 'localStorage', 'sessionStorage', 'process', 'require', 'import', 'export', 'class', 'function', 'new', 'delete', 'typeof', 'instanceof', 'in', 'this'];
            const lower = s.toLowerCase();
            if (forbidden.some(word => new RegExp('\\b' + word + '\\b').test(lower))) throw new Error('التعبير يحتوي على كلمات ممنوعة.');
            if (/\w+\s*\(/.test(s)) throw new Error('استدعاء دوال (مثل الدوال الجاهزة) غير مسموح في التعبيرات.');
            return s;
        }

        /** تقييم تعبير آمن باستخدام parser مخصص (يمنع eval) */
        function algoSafeEval(expr, vars) {
            let pos = 0;
            const s = expr.trim();
            function peek() { return pos < s.length ? s[pos] : null; }
            function consume() { return pos < s.length ? s[pos++] : null; }
            function skipWS() { while (pos < s.length && s[pos] === ' ') pos++; }
            function parseExpr() { skipWS(); return parseOr(); }
            function parseOr() {
                let left = parseAnd(); skipWS();
                while (peek() === '|' && s[pos + 1] === '|') { pos += 2; const right = parseAnd(); left = Boolean(left) || Boolean(right); skipWS(); }
                return left;
            }
            function parseAnd() {
                let left = parseComparison(); skipWS();
                while (peek() === '&' && s[pos + 1] === '&') { pos += 2; const right = parseComparison(); left = Boolean(left) && Boolean(right); skipWS(); }
                return left;
            }
            function parseComparison() {
                let left = parseAddSub(); skipWS(); const op = peek();
                if (op === '<' || op === '>' || op === '=' || op === '!') {
                    let fullOp = consume();
                    if ((fullOp === '<' || fullOp === '>') && peek() === '=') { fullOp += consume(); }
                    if (fullOp === '<' && peek() === '>') { fullOp += consume(); }
                    if (fullOp === '=' && peek() === '=') { fullOp += consume(); }
                    if (fullOp === '!' && peek() === '=') { fullOp += consume(); }
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
                let left = parseMulDiv(); skipWS();
                while (peek() === '+' || peek() === '-') {
                    const op = consume(); const right = parseMulDiv(); skipWS();
                    if (op === '+') left = (typeof left === 'number' && typeof right === 'number') ? left + right : (left != null ? String(left) : '') + (right != null ? String(right) : '');
                    else left = left - right;
                }
                return left;
            }
            function parseMulDiv() {
                let left = parseUnary(); skipWS();
                while (true) {
                    skipWS();
                    let op = null;
                    if (peek() === '*' || peek() === '/' || peek() === '%') {
                        op = consume();
                    } else {
                        const savePos = pos;
                        let word = '';
                        while (pos < s.length && /[a-zA-Z]/.test(s[pos])) word += s[pos++];
                        if (word === 'div' || word === 'mod') {
                            op = word;
                        } else {
                            pos = savePos;
                            break;
                        }
                    }
                    const right = parseUnary(); skipWS();
                    if (op === '*') left = left * right;
                    else if (op === '/') {
                        if (right === 0) throw new Error('لا يمكن القسمة على صفر.');
                        left = left / right;
                    }
                    else if (op === '%' || op === 'mod') {
                        if (right === 0) throw new Error('لا يمكن حساب باقي القسمة على صفر.');
                        left = left % right;
                    }
                    else if (op === 'div') {
                        if (right === 0) throw new Error('لا يمكن القسمة على صفر.');
                        left = Math.floor(left / right);
                    }
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
                if (!word) throw new Error('تعبير غير مكتمل - هل نسيت كتابة قيمة أو متغير؟ (الموقع ' + pos + ')');
                if (word === 'true') return true;
                if (word === 'false') return false;
                if (word in vars) return vars[word];
                const num = Number(word);
                if (!isNaN(num) && word !== '') return num;
                if (/^[A-Za-z_]/.test(word)) {
                    throw new Error(`"${word}" غير معرّف - أضف "${word}" في قسم Var.`);
                }
                return word;
            }
            const result = parseExpr();
            if (pos < s.length) throw new Error('يوجد محتوى زائد بعد نهاية التعبير - هل هناك خطأ في الكتابة؟ (الموقع ' + pos + ')');
            return result;
        }

        function algoSplitArgs(text) {
            const parts = [];
            let current = '';
            let depth = 0;
            let inString = false;
            let quote = null;
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (inString) {
                    current += ch;
                    if (ch === '\\') { i++; if (i < text.length) current += text[i]; }
                    else if (ch === quote) inString = false;
                } else if (ch === '"' || ch === "'") {
                    inString = true; quote = ch; current += ch;
                } else if (ch === '(') { depth++; current += ch; }
                else if (ch === ')') { depth--; current += ch; }
                else if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; }
                else current += ch;
            }
            parts.push(current.trim());
            return parts.filter(p => p.length > 0);
        }

        function algoEvalExpr(expr, vars) {
            const sanitized = algoSanitizeExpr(expr);
            const safe = sanitized.replace(/("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|\b(and|et|or|ou|not|non|vrai|true|faux|false)\b/gi, (match, stringLiteral, word) => {
                if (stringLiteral) return stringLiteral;
                const low = word.toLowerCase();
                if (low === 'and' || low === 'et') return '&&';
                if (low === 'or' || low === 'ou') return '||';
                if (low === 'not' || low === 'non') return '!';
                if (low === 'vrai' || low === 'true') return 'true';
                if (low === 'faux' || low === 'false') return 'false';
                return match;
            });
            try {
                return algoSafeEval(safe, vars);
            } catch (e) { throw new Error('خطأ في التعبير الحسابي: ' + e.message); }
        }

        function algoStripComments(line) {
            let s = line;
            const hash = s.indexOf('#'), slashes = s.indexOf('//');
            const cut = [hash, slashes].filter(i => i >= 0).sort((a, b) => a - b)[0];
            if (cut !== undefined) s = s.slice(0, cut);
            return s.trimEnd();
        }

        function algoNormalizeLine(line) {
            return algoStripComments(line).replace(/^\uFEFF/, '').replace(/\s*;+\s*$/, '');
        }

        function algoStartsWithAny(low, prefixes) {
            for (const p of prefixes) { if (low === p || low.startsWith(p + ' ') || low.startsWith(p + '(')) return p; }
            return null;
        }

        function algoEndsWithAny(low, suffixes) {
            for (const s of suffixes) { if (low.endsWith(' ' + s)) return s; }
            return null;
        }

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
                overlay.addEventListener('click', (e) => { if (e.target === overlay) done(''); });
                if (confirm) confirm.onclick = () => done(field ? field.value : '');
                if (cancel) cancel.onclick = () => done('');
                const onKey = (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); done(field.value); }
                    if (e.key === 'Escape') { e.preventDefault(); done(''); }
                };
                field?.addEventListener('keydown', onKey);
                overlay.addEventListener('keydown', onKey);
            });
        }

        function algoRebuildBlocks(lines) {
            const blocks = [], stack = [];
            const pushBlock = (b) => { blocks.push(b); stack.push(b); };
            let hasAlgorithm = false, hasStart = false, hasEnd = false;
            lines.forEach((raw, i) => {
                const line = algoNormalizeLine(raw).trim();
                if (!line) return;
                const low = line.toLowerCase();
                const lineKind = algoGetLineKind(raw);
                if (lineKind.kind === 'algorithm') hasAlgorithm = true;
                else if (lineKind.kind === 'start') hasStart = true;
                else if (lineKind.kind === 'end' && (low === 'end' || low === 'fin')) hasEnd = true;

                if (algoRequiresSemicolon(lineKind, raw)) {
                    throw new Error('ينقصه الفاصلة المنقوطة (;) - كل أمر تنفيذي يجب أن ينتهي بـ ";". (سطر ' + (i + 1) + ')');
                }
                if (algoForbidsSemicolon(lineKind, raw)) {
                    throw new Error('لا يوضع (;) هنا - السطور الهيكلية (if، while، for، Begin، End، Algorithm، Var) لا تنتهي بفاصلة منقوطة. (سطر ' + (i + 1) + ')');
                }
                if (lineKind.kind === 'var') {
                    const lowKind = lineKind.text.toLowerCase();
                    if (algoKW_VAR.includes(lowKind)) return; // Skip block header line (e.g. 'Var')
                    let rest = lineKind.text;
                    for (const kw of algoKW_VAR) {
                        if (lowKind.startsWith(kw + ' ')) {
                            rest = lineKind.text.slice(kw.length + 1).trim();
                            break;
                        }
                    }
                    if (rest === lineKind.text) {
                        rest = lineKind.text.trim();
                    }
                    const beforeType = rest.split(':')[0].trim();
                    const names = beforeType.split(',').map(x => x.trim()).filter(Boolean);
                    for (const name of names) {
                        if (algoReservedKeywords.has(name.toLowerCase())) {
                            throw new Error(`"${name}" كلمة محجوزة - لا يمكن استخدامها كاسم متغير. اختر اسماً آخر. (سطر ${i + 1})`);
                        }
                    }
                } else if (lineKind.kind === 'const') {
                    const rest = lineKind.text.slice(5).trim();
                    const m = rest.match(/^([A-Za-z_]\w*)\s*(?:\u2190|:=|=)\s*(.+)$/);
                    if (m) {
                        const name = m[1];
                        if (algoReservedKeywords.has(name.toLowerCase())) {
                            throw new Error(`"${name}" كلمة محجوزة - لا يمكن استخدامها كاسم ثابت. (سطر ${i + 1})`);
                        }
                    }
                } else if (lineKind.kind === 'let') {
                    const rest = lineKind.text.slice(4).trim();
                    const m = rest.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
                    if (m) {
                        const name = m[1];
                        if (algoReservedKeywords.has(name.toLowerCase())) {
                            throw new Error(`"${name}" كلمة محجوزة - لا يمكن استخدامها كاسم متغير. (سطر ${i + 1})`);
                        }
                    }
                }
                const ifPrefix = algoStartsWithAny(low, algoKW_IF_START);
                const thenSuffix = algoEndsWithAny(low, algoKW_THEN);
                if (ifPrefix && thenSuffix) {
                    const cond = line.slice(ifPrefix.length + 1, -(thenSuffix.length + 1)).trim();
                    pushBlock({ type: 'if', line: i, cond, elseLine: null, endLine: null, elseIfs: [] });
                    return;
                }
                const elseifPrefix = algoStartsWithAny(low, algoKW_ELSE_IF);
                if (elseifPrefix && thenSuffix) {
                    const top = stack[stack.length - 1];
                    if (!top || top.type !== 'if') throw new Error('"else if" بدون "if" - كل شرط else if يجب أن يسبقه if. (سطر ' + (i + 1) + ')');
                    const cond = line.slice(elseifPrefix.length + 1, -(thenSuffix.length + 1)).trim();
                    if (!top.elseIfs) top.elseIfs = [];
                    top.elseIfs.push({ line: i, cond });
                    return;
                }
                if (algoKW_ELSE.includes(low)) {
                    const top = stack[stack.length - 1];
                    if (!top || top.type !== 'if') throw new Error('"else" بدون "if" - كل else يجب أن يسبقه if. (سطر ' + (i + 1) + ')');
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
                    const match = middle.match(/^([A-Za-z_]\w*)\s*(?:\u2190|:=|=)\s*(.+?)\s+(to|\u00e0)\s+(.+)$/i);
                    if (!match) throw new Error('صيغة for غير صحيحة - الصيغة الصحيحة: for متغير = بداية to نهاية do (سطر ' + (i + 1) + ')');
                    const [, name, startExpr, , endExpr] = match;
                    if (algoReservedKeywords.has(name.toLowerCase())) {
                        throw new Error(`"${name}" كلمة محجوزة - لا يمكن استخدامها كمتغير للحلقة. (سطر ${i + 1})`);
                    }
                    pushBlock({ type: 'for', line: i, varName: name, startExpr, endExpr, endLine: null });
                    return;
                }
                if (algoKW_END.includes(low)) {
                    if (!stack.length) {
                        if (low === 'end' || low === 'fin') return;
                        throw new Error('"' + raw.trim() + '" إضافية - لا يوجد if/while/for مفتوح لإغلاقه. (سطر ' + (i + 1) + ')');
                    }
                    const top = stack[stack.length - 1];
                    const isFinSi = low === 'finsi' || low === 'endif' || low === 'fin si';
                    const isFinTantQue = low === 'fintantque' || low === 'endwhile' || low === 'end while' || low === 'fin tant que';
                    const isFinPour = low === 'finpour' || low === 'endfor' || low === 'end for' || low === 'fin pour';
                    if (low === 'end' || low === 'fin') {
                        const closerMap = { 'if': 'Endif/FinSi', 'while': 'Endwhile/FinTantQue', 'for': 'Endfor/FinPour' };
                        throw new Error('يجب إغلاق كتلة ' + top.type + ' باستخدام ' + closerMap[top.type] + ' بدلاً من End/Fin. (سطر ' + (i + 1) + ')');
                    }
                    if (isFinSi && top.type !== 'if') throw new Error('إغلاق غير متطابق - "' + raw.trim() + '" تغلق ' + top.type + ' ويجب أن تغلق if. (سطر ' + (i + 1) + ')');
                    if (isFinTantQue && top.type !== 'while') throw new Error('إغلاق غير متطابق - "' + raw.trim() + '" تغلق ' + top.type + ' ويجب أن تغلق while. (سطر ' + (i + 1) + ')');
                    if (isFinPour && top.type !== 'for') throw new Error('إغلاق غير متطابق - "' + raw.trim() + '" تغلق ' + top.type + ' ويجب أن تغلق for. (سطر ' + (i + 1) + ')');
                    stack.pop();
                    top.endLine = i;
                    return;
                }
            });
            if (stack.length) {
                const top = stack[stack.length - 1];
                const closerMap = { 'if': 'Endif/FinSi', 'while': 'Endwhile/FinTantQue', 'for': 'Endfor/FinPour' };
                throw new Error('كتلة ' + top.type + ' غير مغلقة - هل نسيت كتابة ' + closerMap[top.type] + '? (تبدأ من سطر ' + (top.line + 1) + ')');
            }
            if (!hasAlgorithm) throw new Error('يجب أن يبدأ البرنامج بـ "Algorithm". (سطر 1)');
            if (!hasStart) throw new Error('يجب كتابة "Begin" بعد Algorithm. (سطر 1)');
            if (!hasEnd) throw new Error('يجب إنهاء البرنامج بـ "End". (سطر 1)');
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
            if (low.startsWith('const ')) return { kind: 'const', text: s };
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
            if (/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:\s*([A-Za-z_]\w*)\s*;?$/.test(s)) return { kind: 'var', text: s };
            if (s.includes('\u2190') || s.includes(':=') || s.includes('=')) return { kind: 'assign', text: s };
            return { kind: 'unknown', text: s };
        }

        function algoRequiresSemicolon(lineKind, raw) {
            const stripped = algoStripComments(raw).trimEnd();
            if (!stripped) return false;
            if (stripped.endsWith(';')) return false;
            const noSemiKinds = ['empty', 'algorithm', 'start', 'if', 'elseif', 'else', 'while', 'for', 'end'];
            if (noSemiKinds.includes(lineKind.kind)) return false;
            if (lineKind.kind === 'var') {
                const s = lineKind.text.toLowerCase();
                if (algoKW_VAR.includes(s)) return false;
            }
            return true;
        }

        function algoForbidsSemicolon(lineKind, raw) {
            const stripped = algoStripComments(raw).trimEnd();
            if (!stripped) return false;
            if (!stripped.endsWith(';')) return false;
            const forbidKinds = ['algorithm', 'start', 'if', 'elseif', 'else', 'while', 'for', 'end'];
            if (forbidKinds.includes(lineKind.kind)) return true;
            if (lineKind.kind === 'var') {
                const s = lineKind.text.toLowerCase();
                if (algoKW_VAR.includes(s)) return true;
            }
            return false;
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
                    const value = v === null ? '-' : (typeof v === 'string' ? JSON.stringify(v) : String(v));
                    return '<tr><td>' + algoEscapeHtml(k) + '</td><td dir="ltr" style="text-align:left;">' + algoEscapeHtml(value) + '</td></tr>';
                }).join('');
        }

        function algoRenderOutput() {
            algoOutputEl.innerHTML = algoVM.out.map(function (line) {
                var d = algoLineIsRtl(line) ? 'rtl' : 'ltr';
                return '<span dir="' + d + '" style="display:block">' + algoEscapeHtml(line) + '</span>';
            }).join('\n');
        }

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
            const lines = algoVM.lines, cur = algoVM.pc, errLine = algoErrorLine;
            const html = lines.map((ln, idx) => {
                const colored = algoHighlightLine(ln);
                const num = String(idx + 1).padStart(2, '0');
                const isCur = idx === cur && !algoVM.halted;
                const isErr = idx === errLine;
                const classParts = [];
                if (isCur) classParts.push('is-current');
                const style = isErr ? ' style="border-left:4px solid #ef4444;background:rgba(239,68,68,0.15);border-radius:4px;"' : '';
                if (isErr) classParts.push('is-error');
                const cls = classParts.join(' ');
                return '<div class="algo-line' + (cls ? ' ' + cls : '') + '"' + style + '>' +
                    '<span class="algo-ln" aria-hidden="true"' + (isErr ? ' style="color:#ef4444!important"' : '') + '>' + num + '</span>' +
                    '<span class="algo-code">' + colored + '</span></div>';
            }).join('');
            algoHighlightEl.innerHTML = html + '\n';
            algoSyncScroll();
            const curEl = algoHighlightEl.querySelector('.algo-line.is-current');
            if (curEl) {
                const top = curEl.offsetTop, h = algoHighlightEl.clientHeight;
                if (top < algoHighlightEl.scrollTop || top > algoHighlightEl.scrollTop + h - 48) {
                    algoHighlightEl.scrollTop = Math.max(0, top - Math.floor(h / 3));
                }
            }
        }

        function algoResetVM() {
            algoStepCounter = 0;
            algoUpdateStepCounter();
            algoVM.lines = algoEditorEl.value.replace(/\r\n/g, '\n').split('\n');
            let err = null;
            try {
                const result = algoRebuildBlocks(algoVM.lines);
                algoVM.blocks = result.blocks;
                algoVM._ifMap = result.mapIfByLine;
                algoVM._whileMap = result.mapWhileByLine;
                algoVM._forMap = result.mapForByLine;
                algoVM.pc = 0; algoVM.vars = {}; algoVM.out = []; algoVM.halted = false; algoVM._loopCounters = {};
                algoVM.isStale = false;
                algoErrorLine = -1;
                algoSyntaxErrorEl.style.display = 'none';
            } catch (e) {
                err = e;
                algoVM.blocks = []; algoVM._ifMap = new Map(); algoVM._whileMap = new Map(); algoVM._forMap = new Map();
                algoVM.pc = 0; algoVM.vars = {}; algoVM.out = []; algoVM.halted = true; algoVM._loopCounters = {};
                algoVM.isStale = true;
            }
            algoRenderVars(); algoRenderOutput(); algoRenderHighlight();
            if (err) throw err;
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
                    const low = s.toLowerCase();
                    if (algoKW_VAR.includes(low)) { algoVM.pc += 1; return; }
                    let rest = s;
                    for (const kw of algoKW_VAR) {
                        if (low.startsWith(kw + ' ')) {
                            rest = s.slice(kw.length + 1).trim();
                            break;
                        }
                    }
                    if (rest === s) {
                        rest = s.trim();
                    }
                    const beforeType = rest.split(':')[0].trim();
                    const names = beforeType.split(',').map(x => x.trim()).filter(Boolean);
                    names.forEach(n => {
                        if (/^[A-Za-z_]\w*$/.test(n)) {
                            if (algoReservedKeywords.has(n.toLowerCase())) {
                                throw new Error(`"${n}" كلمة محجوزة - لا يمكن استخدامها كاسم متغير.`);
                            }
                            if (!(n in algoVM.vars)) algoVM.vars[n] = null;
                        }
                    });
                    algoVM.pc += 1;
                } else if (kind === 'const') {
                    const rest = s.slice(5).trim();
                    const m = rest.match(/^([A-Za-z_]\w*)\s*(?:\u2190|:=|=)\s*(.+)$/);
                    if (!m) throw new Error('صيغة const غير صحيحة - الصيغة: const اسم = قيمة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    if (algoReservedKeywords.has(name.toLowerCase())) {
                        throw new Error(`"${name}" كلمة محجوزة - لا يمكن استخدامها كاسم ثابت. (سطر ${lineIdx + 1})`);
                    }
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'let') {
                    const rest = s.slice(4).trim();
                    const m = rest.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
                    if (!m) throw new Error('صيغة let غير صحيحة - الصيغة: let اسم = قيمة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    if (algoReservedKeywords.has(name.toLowerCase())) {
                        throw new Error(`"${name}" كلمة محجوزة - لا يمكن استخدامها كاسم متغير. (سطر ${lineIdx + 1})`);
                    }
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'assign') {
                    const m = s.match(/^([A-Za-z_]\w*)\s*(?:\u2190|:=|=)\s*(.+)$/);
                    if (!m) throw new Error('صيغة الإسناد غير صحيحة - الصيغة: اسم_متغير = قيمة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    if (algoReservedKeywords.has(name.toLowerCase())) {
                        throw new Error(`"${name}" كلمة محجوزة - لا يمكن استخدامها في الإسناد. (سطر ${lineIdx + 1})`);
                    }
                    if (!(name in algoVM.vars)) {
                        throw new Error(`"${name}" غير معرّف - أضف "${name}" في قسم Var. (سطر ${lineIdx + 1})`);
                    }
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'read') {
                    const m = s.match(/^(?:read|lire)\s*\(\s*([A-Za-z_]\w*)\s*\)\s*$/i);
                    if (!m) throw new Error('صيغة Read/Lire غير صحيحة - الصيغة: Read(اسم_متغير) (سطر ' + (lineIdx + 1) + ')');
                    const name = m[1];
                    if (!(name in algoVM.vars)) {
                        throw new Error(`"${name}" غير معرّف - أضف "${name}" في قسم Var. (سطر ${lineIdx + 1})`);
                    }
                    const rawVal = await algoShowInputModal('أدخل قيمة المتغير: ' + name);
                    const v = rawVal == null ? '' : String(rawVal);
                    const num = Number(v);
                    algoVM.vars[name] = Number.isFinite(num) && v.trim() !== '' ? num : v;
                    algoVM.pc += 1;
                } else if (kind === 'write') {
                    const m = s.match(/^(?:write|ecrire|\u00e9crire)\s*\(\s*(.+)\s*\)\s*$/i);
                    if (!m) throw new Error('صيغة Write/Ecrire غير صحيحة - الصيغة: Write("نص" أو قيمة) (سطر ' + (lineIdx + 1) + ')');
                    const parts = algoSplitArgs(m[1]);
                    const vals = parts.map(p => String(algoEvalExpr(p, algoVM.vars)));
                    algoVM.out.push(vals.join(' '));
                    algoVM.pc += 1;
                } else if (kind === 'print') {
                    const expr = s.slice(6).trim();
                    const val = algoEvalExpr(expr, algoVM.vars);
                    algoVM.out.push(String(val));
                    algoVM.pc += 1;
                } else if (kind === 'if') {
                    const b = algoVM._ifMap.get(lineIdx);
                    if (!b) throw new Error('خطأ في بنية if - تأكد من كتابة if ... then بشكل صحيح. (سطر ' + (lineIdx + 1) + ')');
                    const ok = Boolean(algoEvalExpr(b.cond, algoVM.vars));
                    if (ok) { algoVM.pc += 1; }
                    else {
                        let handled = false;
                        if (b.elseIfs) {
                            for (const ei of b.elseIfs) {
                                if (Boolean(algoEvalExpr(ei.cond, algoVM.vars))) {
                                    algoVM.pc = ei.line + 1; handled = true; break;
                                }
                            }
                        }
                        if (!handled) algoVM.pc = (b.elseLine != null ? b.elseLine + 1 : b.endLine + 1);
                    }
                } else if (kind === 'elseif') {
                    const match = algoVM.blocks.find(b => b.type === 'if' && b.elseIfs && b.elseIfs.some(ei => ei.line === lineIdx));
                    if (!match) throw new Error('"else if" بدون "if" - كل شرط else if يجب أن يسبقه if. (سطر ' + (lineIdx + 1) + ')');
                    algoVM.pc = match.endLine + 1;
                } else if (kind === 'else') {
                    const match = algoVM.blocks.find(b => b.type === 'if' && b.elseLine === lineIdx);
                    if (!match) throw new Error('"else" بدون "if" - كل else يجب أن يسبقه if. (سطر ' + (lineIdx + 1) + ')');
                    algoVM.pc = match.endLine + 1;
                } else if (kind === 'while') {
                    const b = algoVM._whileMap.get(lineIdx);
                    if (!b) throw new Error('خطأ في بنية while - تأكد من كتابة while ... do بشكل صحيح. (سطر ' + (lineIdx + 1) + ')');
                    const wKey = '__wloop_' + lineIdx;
                    const ok = Boolean(algoEvalExpr(b.cond, algoVM.vars));
                    if (ok) {
                        algoVM._loopCounters[wKey] = (algoVM._loopCounters[wKey] || 0) + 1;
                        if (algoVM._loopCounters[wKey] > ALGO_MAX_LOOP_ITER) {
                            throw new Error(`⚠️ الحلقة لا تتوقف! تجاوزت ${ALGO_MAX_LOOP_ITER.toLocaleString()} تكراراً في السطر ${lineIdx + 1}. تأكد من أن شرط while يصبح false في النهاية.`);
                        }
                        algoVM.pc += 1;
                    } else {
                        algoVM._loopCounters[wKey] = 0;
                        algoVM.pc = b.endLine + 1;
                    }
                } else if (kind === 'for') {
                    const b = algoVM._forMap.get(lineIdx);
                    if (!b) throw new Error('خطأ في بنية for - تأكد من كتابة for ... to ... do بشكل صحيح. (سطر ' + (lineIdx + 1) + ')');
                    if (algoReservedKeywords.has(b.varName.toLowerCase())) {
                        throw new Error(`"${b.varName}" كلمة محجوزة - لا يمكن استخدامها كمتغير للحلقة. (سطر ${lineIdx + 1})`);
                    }
                    if (!(b.varName in algoVM.vars)) {
                        throw new Error(`"${b.varName}" غير معرّف - أضف "${b.varName}" في قسم Var. (سطر ${lineIdx + 1})`);
                    }
                    const loopKey = '__for_' + lineIdx;
                    const endKey = '__forEnd_' + lineIdx;
                    const fKey = '__floop_' + lineIdx;
                    if (!algoVM.vars[loopKey]) {
                        algoVM.vars[b.varName] = algoEvalExpr(b.startExpr, algoVM.vars);
                        algoVM.vars[loopKey] = true;
                        algoVM.vars[endKey] = Number(algoEvalExpr(b.endExpr, algoVM.vars));
                        algoVM._loopCounters[fKey] = 0;
                    } else {
                        algoVM.vars[b.varName] = (Number(algoVM.vars[b.varName]) || 0) + 1;
                    }
                    algoVM._loopCounters[fKey] = (algoVM._loopCounters[fKey] || 0) + 1;
                    if (algoVM._loopCounters[fKey] > ALGO_MAX_LOOP_ITER) {
                        throw new Error(`⚠️ الحلقة لا تتوقف! تجاوزت ${ALGO_MAX_LOOP_ITER.toLocaleString()} تكراراً في السطر ${lineIdx + 1}. تأكد من أن قيمة متغير الحلقة تصل إلى النهاية.`);
                    }
                    const currentVal = Number(algoVM.vars[b.varName]), endVal = Number(algoVM.vars[endKey]);
                    if (currentVal <= endVal) { algoVM.pc += 1; }
                    else { delete algoVM.vars[loopKey]; delete algoVM.vars[endKey]; algoVM._loopCounters[fKey] = 0; algoVM.pc = b.endLine + 1; }
                } else if (kind === 'end') {
                    const whileBlock = algoVM.blocks.find(b => b.type === 'while' && b.endLine === lineIdx);
                    const forBlock = algoVM.blocks.find(b => b.type === 'for' && b.endLine === lineIdx);
                    if (whileBlock) algoVM.pc = whileBlock.line;
                    else if (forBlock) algoVM.pc = forBlock.line;
                    else algoVM.pc += 1;
                } else {
                    const snippet = raw.trim().substring(0, 30);
                    throw new Error('أمر غير معروف: "' + snippet + '..." - تأكد من كتابة الأمر بشكل صحيح أو راجع الأمثلة. (سطر ' + (lineIdx + 1) + ')');
                }
            } catch (e) {
                let msg = e && e.message ? e.message : String(e);
                if (!msg.includes('(سطر')) msg += ' (في السطر ' + (lineIdx + 1) + ')';
                msg = algoFormatError(msg);
                algoVM.out.push('❌ خطأ: ' + msg);
                algoErrorLine = lineIdx;
                algoVM.halted = true;
            }
            algoStepCounter++;
            algoUpdateStepCounter();
            algoRenderVars(); algoRenderOutput(); algoRenderHighlight();
        }

        async function algoRunAll() {
            const CHUNK = 500; let steps = 0;
            const runChunk = async () => {
                let i = 0;
                while (!algoVM.halted && i < CHUNK) { await algoStepOnce(); i++; steps++; }
                if (!algoVM.halted && steps < 50000) { setTimeout(() => runChunk(), 0); }
                else if (steps >= 50000) { algoVM.out.push('⚠️ تحذير: تم إيقاف التشغيل تلقائياً بعد ' + steps.toLocaleString() + ' خطوة. يُرجى مراجعة الحلقات للتأكد من عدم وجود حلقة لا نهائية.'); algoVM.halted = true; algoRenderOutput(); algoRenderHighlight(); }
            };
            await runChunk();
        }

        function algoSyncScroll() {
            if (!algoHighlightEl || !algoEditorEl) return;
            algoHighlightEl.scrollTop = algoEditorEl.scrollTop;
            algoHighlightEl.scrollLeft = algoEditorEl.scrollLeft;
        }

        // ==================== SMART INDENT HELPERS ====================
        const ALGO_INDENT = '  '; // 2 spaces per level

        /** Keywords whose presence at end of a line means next line is indented */
        const algoINDENT_AFTER_ENDS = ['then', 'alors', 'do', 'faire'];
        /** Full-line keywords that also open an indented block */
        const algoINDENT_AFTER_EXACT = ['else', 'sinon', 'begin', 'debut', 'début', 'start', 'var', 'variable', 'variables'];
        /** Keywords that are block closers — the line itself should be dedented on type */
        const algoDEDENT_EXACT = ['endif', 'endwhile', 'endfor', 'end while', 'end for',
            'finsi', 'fintantque', 'finpour', 'fin si', 'fin tant que', 'fin pour',
            'else', 'sinon'];

        function algoGetLineIndent(line) {
            const m = line.match(/^(\s*)/);
            return m ? m[1] : '';
        }

        function algoSmartIndentOnEnter() {
            const pos = algoEditorEl.selectionStart;
            const val = algoEditorEl.value;
            // find start of current line
            const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
            const currentLine = val.slice(lineStart, pos);
            const trimmed = currentLine.trimStart();
            const indent = algoGetLineIndent(currentLine);
            const trimLow = trimmed.replace(/\s*;?\s*$/, '').toLowerCase();

            let newIndent = indent;

            // Check if line ends with a block-opening keyword
            const endsWithOpener = algoINDENT_AFTER_ENDS.some(kw => trimLow === kw || trimLow.endsWith(' ' + kw));
            // Check if the entire trimmed line is an opener keyword
            // For var/variable/variables, only exact line match (not "var a,b: integer" declarations)
            const isExactOpener = algoINDENT_AFTER_EXACT.some(kw => {
                if (kw === 'var' || kw === 'variable' || kw === 'variables') {
                    return trimLow === kw;
                }
                return trimLow === kw || trimLow.startsWith(kw + ' ') || trimLow.startsWith(kw + ':');
            });

            if (endsWithOpener || isExactOpener) {
                newIndent = indent + ALGO_INDENT;
            }

            // Insert \n + computed indent, replacing any selection
            const selEnd = algoEditorEl.selectionEnd;
            const newVal = val.slice(0, pos) + '\n' + newIndent + val.slice(selEnd);
            algoEditorEl.value = newVal;
            const newCursorPos = pos + 1 + newIndent.length;
            algoEditorEl.setSelectionRange(newCursorPos, newCursorPos);
            algoEditorEl.dispatchEvent(new Event('input'));
        }

        let _algoDedenting = false; // reentrancy guard for dedent
        function algoSmartDedentOnClose() {
            if (_algoDedenting) return;
            const pos = algoEditorEl.selectionStart;
            const val = algoEditorEl.value;
            const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
            const lineEnd = val.indexOf('\n', pos);
            const restOfLine = val.slice(pos, lineEnd >= 0 ? lineEnd : undefined);
            if (restOfLine.trim().length > 0) return;
            const currentLine = val.slice(lineStart, pos);
            const trimLow = currentLine.trimStart().replace(/\s*;?\s*$/, '').toLowerCase();
            const isCloser = algoDEDENT_EXACT.some(kw => trimLow === kw);
            if (!isCloser) return;
            const currentIndent = algoGetLineIndent(currentLine);
            if (currentIndent.length < ALGO_INDENT.length) return;
            const newIndent = currentIndent.slice(ALGO_INDENT.length);
            const newVal = val.slice(0, lineStart) + newIndent + val.slice(lineStart + currentIndent.length);
            const delta = currentIndent.length - newIndent.length;
            _algoDedenting = true;
            algoEditorEl.value = newVal;
            const newPos = Math.max(lineStart + newIndent.length, pos - delta);
            algoEditorEl.setSelectionRange(newPos, newPos);
            algoEditorEl.dispatchEvent(new Event('input'));
            _algoDedenting = false;
        }

        // ==================== EVENT HANDLERS ====================
        algoEditorEl.addEventListener('keydown', (e) => {
            // --- Undo / Redo ---
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                algoUndo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                algoRedo();
                return;
            }

            // --- Tab: insert 2 spaces (Shift+Tab: remove one indent level) ---
            if (e.key === 'Tab') {
                e.preventDefault();
                const pos = algoEditorEl.selectionStart;
                const selEnd = algoEditorEl.selectionEnd;
                const val = algoEditorEl.value;
                if (e.shiftKey) {
                    // Remove up to ALGO_INDENT spaces before cursor on this line
                    const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
                    const beforeCursor = val.slice(lineStart, pos);
                    if (beforeCursor.startsWith(ALGO_INDENT)) {
                        const newVal = val.slice(0, lineStart) + beforeCursor.slice(ALGO_INDENT.length) + val.slice(pos);
                        algoEditorEl.value = newVal;
                        const np = pos - ALGO_INDENT.length;
                        algoEditorEl.setSelectionRange(np, np);
                    }
                } else {
                    const newVal = val.slice(0, pos) + ALGO_INDENT + val.slice(selEnd);
                    algoEditorEl.value = newVal;
                    const np = pos + ALGO_INDENT.length;
                    algoEditorEl.setSelectionRange(np, np);
                }
                algoEditorEl.dispatchEvent(new Event('input'));
                return;
            }

            // --- Enter: smart indent ---
            if (e.key === 'Enter') {
                e.preventDefault();
                algoSmartIndentOnEnter();
                return;
            }
        });

        // Auto-replace := with ← and auto-dedent closing keywords as they are typed
        algoEditorEl.addEventListener('input', (ev) => {
            if (algoReplacingAssign) { algoReplacingAssign = false; return; }
            if (ev.inputType === 'insertText' || ev.inputType === 'insertFromPaste') {
                const val = algoEditorEl.value;
                const pos = algoEditorEl.selectionStart;
                if (pos >= 2 && val.substring(pos - 2, pos) === ':=') {
                    algoReplacingAssign = true;
                    algoEditorEl.value = val.slice(0, pos - 2) + '\u2190' + val.slice(pos);
                    algoEditorEl.setSelectionRange(pos - 1, pos - 1);
                    algoEditorEl.dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                }
                algoSmartDedentOnClose();
            }
        }, true); // capture phase so it runs before the main input handler


        algoEditorEl.addEventListener('input', () => {
            algoResizeEditor();
            algoVM.lines = algoEditorEl.value.replace(/\r\n/g, '\n').split('\n');
            algoSyntaxErrorEl.style.display = 'none';
            algoErrorLine = -1;
            algoVM.isStale = true;
            // Clear the running-line indicator while the user edits
            // (pc stays intact so stepping can resume, but highlight won't freeze on an old line)
            const savedPc = algoVM.pc;
            algoVM.pc = -1; // temporarily hide the current-line highlight
            try {
                const result = algoRebuildBlocks(algoVM.lines);
                algoVM.blocks = result.blocks;
                algoVM._ifMap = result.mapIfByLine;
                algoVM._whileMap = result.mapWhileByLine;
                algoVM._forMap = result.mapForByLine;
            } catch (e) {
                algoSyntaxErrorEl.textContent = '❌ خطأ: ' + algoFormatError(e.message);
                algoSyntaxErrorEl.style.display = 'block';
                algoErrorLine = algoParseErrorLine(e.message);
                console.error('Syntax error at line', algoErrorLine, e.message);
            }
            algoVM.pc = savedPc; // restore pc (step button will reset fully if isStale)
            algoRenderHighlight();
            algoPushHistory();
        });



        algoEditorEl.addEventListener('scroll', algoSyncScroll);

        algoRunBtn.addEventListener('click', async () => {
            if (algoIsRunning) return; algoIsRunning = true; algoRunBtn.disabled = true; algoStepBtn.disabled = true;
            try {
                algoResetVM();
                await algoRunAll();
            } catch (e) {
                const msg = e && e.message ? e.message : String(e);
                const formatted = algoFormatError(msg);
                if (!algoVM.out.length || algoVM.out[algoVM.out.length - 1] !== '❌ خطأ: ' + formatted) {
                    algoVM.out.push('❌ خطأ: ' + formatted);
                }
                algoErrorLine = algoParseErrorLine(msg);
                algoVM.halted = true;
                algoRenderOutput();
                algoRenderHighlight();
            } finally {
                algoIsRunning = false;
                algoRunBtn.disabled = false;
                algoStepBtn.disabled = false;
            }
        });
        algoStepBtn.addEventListener('click', async () => {
            if (algoIsRunning) return;
            if ((algoVM.isStale || algoVM.halted || !algoVM.lines || algoVM.lines.length === 0) && algoEditorEl.value.trim()) {
                try { algoResetVM(); } catch (e) {
                    const msg = e && e.message ? e.message : String(e);
                    const formatted = algoFormatError(msg);
                    if (!algoVM.out.length || algoVM.out[algoVM.out.length - 1] !== '❌ خطأ: ' + formatted) {
                        algoVM.out.push('❌ خطأ: ' + formatted);
                    }
                    algoErrorLine = algoParseErrorLine(msg);
                    algoVM.halted = true;
                    algoRenderOutput();
                    algoRenderHighlight();
                }
            }
            await algoStepOnce();
        });
        algoResetBtn.addEventListener('click', () => {
            algoResetVM();
        });

        if (algoNewBtn) {
            algoNewBtn.addEventListener('click', () => {
                const hasContent = algoEditorEl.value.trim() !== '';
                if (hasContent && !confirm('سيتم مسح المحرر وبدء صفحة جديدة. هل تريد المتابعة؟')) return;
                algoEditorEl.value = '';
                try { localStorage.removeItem(ALGO_STORAGE_KEY_CODE); } catch (e) { /* ignore */ }
                algoEditorEl.dispatchEvent(new Event('input'));
                algoEditorEl.focus();
                algoResetVM();
            });
        }

        if (algoUndoBtn) {
            algoUndoBtn.addEventListener('click', algoUndo);
        }
        if (algoRedoBtn) {
            algoRedoBtn.addEventListener('click', algoRedo);
        }

        if (algoLangToggle) {
            const langBtns = algoLangToggle.querySelectorAll('.algo-lang-btn');
            langBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const lang = btn.dataset.lang;
                    if (lang === algoCurrentLang) return;
                    const fromLang = algoCurrentLang;
                    algoCurrentLang = lang;
                    langBtns.forEach(b => b.classList.remove('is-active'));
                    btn.classList.add('is-active');
                    if (algoEditorEl.value.trim()) {
                        algoEditorEl.value = algoTranslateKeywords(algoEditorEl.value, fromLang, lang);
                        algoEditorEl.dispatchEvent(new Event('input'));
                    } else {
                        algoEditorEl.value = algoDefaultPrograms[lang];
                    }
                    algoResetVM();
                    algoSaveState();
                });
            });
        }

        // Examples
        const algoExampleBtns = document.querySelectorAll('.example-item');
        algoExampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.example;
                const ex = algoExamples[type];
                if (ex) {
                    let code = ex;
                    if (algoCurrentLang === 'fr') code = algoTranslateKeywords(code, 'en', 'fr');
                    algoEditorEl.value = code;
                    algoEditorEl.dispatchEvent(new Event('input'));
                    algoResetVM();
                    algoEditorEl.focus();
                }
            });
        });


        const savedCode = algoLoadState();
        if (savedCode) {
            algoEditorEl.value = savedCode;
        } else if (!algoEditorEl.value.trim()) {
            algoEditorEl.value = algoDefaultPrograms[algoCurrentLang];
        }
        algoPushHistory();
        algoResizeEditor();
        try { algoResetVM(); } catch (e) { console.error('Init error:', e); }
    });
})();
