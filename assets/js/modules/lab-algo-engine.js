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
        const algoNewBtn = document.getElementById('algoNewBtn');
        const algoLangToggle = document.getElementById('algoLangToggle');

        if (!algoEditorEl || !algoHighlightEl || !algoVarsBody || !algoOutputEl || !algoRunBtn || !algoStepBtn || !algoResetBtn) return;

        let algoCurrentLang = 'en';
        let algoIsRunning = false;

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
        const algoKW_TO = ['to', 'a', '\u00e0'];
        const algoKW_DO = ['do', 'faire'];
        const algoKW_READ = ['read', 'lire'];
        const algoKW_WRITE = ['write', 'ecrire', '\u00e9crire'];

        const algoHL_KEYWORDS = [...algoKW_ALGORITHM, ...algoKW_VAR, ...algoKW_START, ...algoKW_END, 'const'];
        const algoHL_CONTROL = [...algoKW_IF_START, ...algoKW_THEN, ...algoKW_ELSE, ...algoKW_WHILE_START, ...algoKW_FOR_START, ...algoKW_TO, ...algoKW_DO, 'finsi', 'fintantque', 'finpour', 'endif', 'endwhile', 'endfor', 'end while', 'end for', 'fin si', 'fin tant que', 'fin pour', 'else if', 'sinon si'];
        const algoHL_IO = [...algoKW_READ, ...algoKW_WRITE, 'print', 'let'];
        const algoHL_TYPES = ['integer', 'real', 'string', 'boolean', 'char', 'entier', 'reel', 'r\u00e9el', 'chaine', 'cha\u00eene', 'booleen', 'bool\u00e9en', 'caractere', 'caract\u00e8re'];
        const algoHL_LOGIC = ['and', 'or', 'not', 'true', 'false', 'et', 'ou', 'non', 'vrai', 'faux'];

        const algoDefaultPrograms = {
            en: 'Algorithm example\nBegin\n  Write("Hello World!");\nEnd',
            fr: 'Algorithme exemple\nDebut\n  Ecrire("Hello World!");\nFin'
        };

        const algoExamples = {
            en: {
                hello: 'Algorithm HelloWorld\nBegin\n  Write("Hello World!");\nEnd',
                sum: 'Algorithm Summation\nVar\n  a, b, s : integer\nBegin\n  a = 10\n  b = 20\n  s = a + b\n  Write("The sum is:");\n  Write(s);\nEnd',
                condition: 'Algorithm Grades\nVar\n  score : integer\nBegin\n  score = 85\n  if score >= 90 then\n    Write("Excellent");\n  else if score >= 80 then\n    Write("Very Good");\n  else if score >= 70 then\n    Write("Good");\n  else\n    Write("Needs improvement");\n  endif\nEnd',
                loop: 'Algorithm Counting\nVar\n  i : integer\nBegin\n  for i = 1 to 5 do\n    Write("Number:");\n    Write(i);\n  endfor\nEnd'
            },
            fr: {
                hello: 'Algorithme HelloWorld\nDebut\n  Ecrire("Bonjour tout le monde!");\nFin',
                sum: 'Algorithme Somme\nVar\n  a, b, s : entier\nDebut\n  a := 10\n  b := 20\n  s := a + b\n  Ecrire("La somme est:");\n  Ecrire(s);\nFin',
                condition: 'Algorithme Notes\nVar\n  score : entier\nDebut\n  score := 85\n  Si score >= 90 Alors\n    Ecrire("Excellent");\n  Sinon si score >= 80 Alors\n    Ecrire("Tr\u00e8s bien");\n  Sinon si score >= 70 Alors\n    Ecrire("Bien");\n  Sinon\n    Ecrire("Am\u00e9lioration n\u00e9cessaire");\n  FinSi\nFin',
                loop: 'Algorithme Comptage\nVar\n  i : entier\nDebut\n  Pour i = 1 a 5 Faire\n    Ecrire("Nombre:");\n    Ecrire(i);\n  FinPour\nFin'
            }
        };

        // ==================== VM ====================
        const ALGO_MAX_LOOP_ITER = 10000;
        let algoVM = { lines: [], blocks: [], pc: 0, vars: {}, out: [], halted: false, _ifMap: new Map(), _whileMap: new Map(), _forMap: new Map(), _loopCounters: {} };

        // ==================== AUTOCOMPLETE UI ====================
        const algoSB = document.createElement('div');
        algoSB.className = 'sug-panel';
        algoSB.style.display = 'none';
        document.body.appendChild(algoSB);

        let algoSugActive = false;
        let algoSugPrefix = '';

        function algoShowSuggestions() {
            const pos = algoEditorEl.selectionStart;
            const text = algoEditorEl.value;
            const before = text.substring(0, pos);
            const m = before.match(/([a-zA-Z0-9_\u00C0-\u00FF]+)$/);
            if (!m) {
                algoHideSuggestions();
                return;
            }
            algoSugPrefix = m[1].toLowerCase();
            const allKws = [...algoHL_KEYWORDS, ...algoHL_CONTROL, ...algoHL_IO, ...algoHL_TYPES, ...algoHL_LOGIC];
            const items = allKws.filter(kw => kw.startsWith(algoSugPrefix)).slice(0, 10);

            if (items.length === 0) {
                algoHideSuggestions();
                return;
            }

            algoSB.innerHTML = '';
            items.forEach((item, i) => {
                const div = document.createElement('div');
                div.className = 'sug-item' + (i === 0 ? ' active' : '');
                div.innerHTML = `<span class="sug-tag">${item}</span>`;
                div.onmousedown = (e) => { e.preventDefault(); algoInsertSuggestion(item); };
                div.onmouseenter = () => {
                    algoSB.querySelectorAll('.sug-item').forEach(e => e.classList.remove('active'));
                    div.classList.add('active');
                };
                algoSB.appendChild(div);
            });

            // position
            const rect = algoEditorEl.getBoundingClientRect();
            algoSB.style.left = (rect.left + 40) + 'px'; // indent slightly
            algoSB.style.top = (rect.top + 40) + 'px'; // approximate position near editor top
            algoSB.style.display = 'block';
            algoSugActive = true;
        }

        function algoHideSuggestions() {
            algoSB.style.display = 'none';
            algoSugActive = false;
        }

        function algoInsertSuggestion(val) {
            const pos = algoEditorEl.selectionStart;
            const text = algoEditorEl.value;
            const before = text.substring(0, pos);
            const after = text.substring(pos);
            const m = before.match(/([a-zA-Z0-9_\u00C0-\u00FF]+)$/);
            if (m) {
                const newBefore = before.substring(0, before.length - m[1].length) + val + ' ';
                algoEditorEl.value = newBefore + after;
                algoEditorEl.setSelectionRange(newBefore.length, newBefore.length);
                algoHideSuggestions();
                algoEditorEl.dispatchEvent(new Event('input'));
                algoEditorEl.focus();
            }
        }

        // ==================== SYNTAX ERROR UI ====================
        const algoSyntaxErrorEl = document.createElement('div');
        algoSyntaxErrorEl.className = 'algo-syntax-error';
        algoSyntaxErrorEl.style.color = '#ef4444';
        algoSyntaxErrorEl.style.padding = '0.5rem';
        algoSyntaxErrorEl.style.fontSize = '0.9rem';
        algoSyntaxErrorEl.style.fontWeight = 'bold';
        algoSyntaxErrorEl.style.display = 'none';
        algoEditorEl.parentElement.appendChild(algoSyntaxErrorEl);

        // ==================== HELPERS ====================
        /** تنظيف وحظر التعبيرات الخطرة (حقن) */
        function algoSanitizeExpr(expr) {
            const s = String(expr ?? '').trim();
            if (!/^[\w\s"'+\-*/%<>=!&|().,:]+$/.test(s)) throw new Error('تعبير غير مسموح.');
            const forbidden = ['window', 'document', 'fetch', 'XMLHttpRequest', 'eval', 'setTimeout', 'setInterval', 'Function', 'alert', 'console', 'cookie', 'localStorage', 'sessionStorage', 'process', 'require', 'import', 'export', 'class', 'function', 'new', 'delete', 'typeof', 'instanceof', 'in', 'this'];
            const lower = s.toLowerCase();
            if (forbidden.some(word => new RegExp('\\b' + word + '\\b').test(lower))) throw new Error('محاولة وصول غير مصرح بها.');
            if (/\w+\s*\(/.test(s)) throw new Error('استدعاء دوال غير مسموح.');
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
                while (peek() === '*' || peek() === '/' || peek() === '%') {
                    const op = consume(); const right = parseUnary(); skipWS();
                    if (op === '*') left = left * right;
                    else if (op === '/') {
                        if (right === 0) throw new Error('القسمة على صفر غير مسموح بها.');
                        left = left / right;
                    }
                    else {
                        if (right === 0) throw new Error('باقي القسمة على صفر غير مسموح به.');
                        left = left % right;
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
                if (!word) throw new Error('تعبير غير متوقع في الموقع ' + pos);
                if (word === 'true') return true;
                if (word === 'false') return false;
                if (word in vars) return vars[word];
                const num = Number(word);
                if (!isNaN(num) && word !== '') return num;
                if (/^[A-Za-z_]/.test(word)) {
                    throw new Error(`المتغير "${word}" غير معرّف. تأكد من التصريح عنه في قسم Var.`);
                }
                return word;
            }
            const result = parseExpr();
            if (pos < s.length) throw new Error('يوجد محتوى إضافي بعد التعبير في الموقع ' + pos);
            return result;
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
                    pushBlock({ type: 'if', line: i, cond, elseLine: null, endLine: null, elseIfs: [] });
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
                    const match = middle.match(/^([A-Za-z_]\w*)\s*(?:\u2190|:=|=)\s*(.+?)\s+\b(to|a|\u00e0)\b\s+(.+)$/i);
                    if (!match) throw new Error('صيغة for غير صحيحة (سطر ' + (i + 1) + ')');
                    const [, name, startExpr, , endExpr] = match;
                    pushBlock({ type: 'for', line: i, varName: name, startExpr, endExpr, endLine: null });
                    return;
                }
                if (algoKW_END.includes(low)) {
                    if (!stack.length) {
                        if (low === 'end' || low === 'fin') return;
                        throw new Error(low + ' إضافي بدون كتلة مفتوحة (سطر ' + (i + 1) + ')');
                    }
                    const top = stack[stack.length - 1];
                    const isFinSi = low === 'finsi' || low === 'endif' || low === 'fin si';
                    const isFinTantQue = low === 'fintantque' || low === 'endwhile' || low === 'end while' || low === 'fin tant que';
                    const isFinPour = low === 'finpour' || low === 'endfor' || low === 'end for' || low === 'fin pour';
                    if (isFinSi && top.type !== 'if') throw new Error(low + ' يغلق ' + top.type + ' بدلاً من if (سطر ' + (i + 1) + ')');
                    if (isFinTantQue && top.type !== 'while') throw new Error(low + ' يغلق ' + top.type + ' بدلاً من while (سطر ' + (i + 1) + ')');
                    if (isFinPour && top.type !== 'for') throw new Error(low + ' يغلق ' + top.type + ' بدلاً من for (سطر ' + (i + 1) + ')');
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
            algoVM.pc = 0; algoVM.vars = {}; algoVM.out = []; algoVM.halted = false; algoVM._loopCounters = {};
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
                    const low = s.toLowerCase(); let rest = s;
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
                    names.forEach(n => { if (/^[A-Za-z_]\w*$/.test(n) && !(n in algoVM.vars)) algoVM.vars[n] = null; });
                    algoVM.pc += 1;
                } else if (kind === 'const') {
                    const rest = s.slice(5).trim();
                    const m = rest.match(/^([A-Za-z_]\w*)\s*(?:\u2190|:=|=)\s*(.+)$/);
                    if (!m) throw new Error('صيغة التصريح عن الثابت غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'let') {
                    const rest = s.slice(4).trim();
                    const m = rest.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
                    if (!m) throw new Error('صيغة let غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'assign') {
                    const m = s.match(/^([A-Za-z_]\w*)\s*(?:\u2190|:=|=)\s*(.+)$/);
                    if (!m) throw new Error('صيغة الإسناد غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const [, name, expr] = m;
                    if (!(name in algoVM.vars)) {
                        throw new Error(`المتغير "${name}" غير معرّف. تأكد من التصريح عنه في قسم Var.`);
                    }
                    algoVM.vars[name] = algoEvalExpr(expr, algoVM.vars);
                    algoVM.pc += 1;
                } else if (kind === 'read') {
                    const m = s.match(/^(?:read|lire)\s*\(\s*([A-Za-z_]\w*)\s*\)\s*$/i);
                    if (!m) throw new Error('صيغة Read/Lire غير صحيحة (سطر ' + (lineIdx + 1) + ')');
                    const name = m[1];
                    if (!(name in algoVM.vars)) {
                        throw new Error(`المتغير "${name}" غير معرّف. تأكد من التصريح عنه في قسم Var.`);
                    }
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
                    const wKey = '__wloop_' + lineIdx;
                    const ok = Boolean(algoEvalExpr(b.cond, algoVM.vars));
                    if (ok) {
                        algoVM._loopCounters[wKey] = (algoVM._loopCounters[wKey] || 0) + 1;
                        if (algoVM._loopCounters[wKey] > ALGO_MAX_LOOP_ITER) {
                            throw new Error(`⚠️ تحذير: حلقة لا نهائية محتملة! الحلقة في السطر ${lineIdx + 1} تجاوزت ${ALGO_MAX_LOOP_ITER.toLocaleString()} تكراراً. تحقق من شرط الإيقاف.`);
                        }
                        algoVM.pc += 1;
                    } else {
                        algoVM._loopCounters[wKey] = 0;
                        algoVM.pc = b.endLine + 1;
                    }
                } else if (kind === 'for') {
                    const b = algoVM._forMap.get(lineIdx);
                    if (!b) throw new Error('for/pour غير معروف (سطر ' + (lineIdx + 1) + ')');
                    if (!(b.varName in algoVM.vars)) {
                        throw new Error(`المتغير "${b.varName}" غير معرّف. تأكد من التصريح عنه في قسم Var.`);
                    }
                    const loopKey = '__for_' + lineIdx;
                    const fKey = '__floop_' + lineIdx;
                    if (!algoVM.vars[loopKey]) {
                        algoVM.vars[b.varName] = algoEvalExpr(b.startExpr, algoVM.vars);
                        algoVM.vars[loopKey] = true;
                        algoVM._loopCounters[fKey] = 0;
                    } else {
                        algoVM.vars[b.varName] = (Number(algoVM.vars[b.varName]) || 0) + 1;
                    }
                    algoVM._loopCounters[fKey] = (algoVM._loopCounters[fKey] || 0) + 1;
                    if (algoVM._loopCounters[fKey] > ALGO_MAX_LOOP_ITER) {
                        throw new Error(`⚠️ تحذير: حلقة لا نهائية محتملة! الحلقة في السطر ${lineIdx + 1} تجاوزت ${ALGO_MAX_LOOP_ITER.toLocaleString()} تكراراً. تحقق من حدود الحلقة.`);
                    }
                    const currentVal = Number(algoVM.vars[b.varName]), endVal = Number(algoEvalExpr(b.endExpr, algoVM.vars));
                    if (currentVal <= endVal) { algoVM.pc += 1; }
                    else { delete algoVM.vars[loopKey]; algoVM._loopCounters[fKey] = 0; algoVM.pc = b.endLine + 1; }
                } else if (kind === 'end') {
                    const whileBlock = algoVM.blocks.find(b => b.type === 'while' && b.endLine === lineIdx);
                    const forBlock = algoVM.blocks.find(b => b.type === 'for' && b.endLine === lineIdx);
                    if (whileBlock) algoVM.pc = whileBlock.line;
                    else if (forBlock) algoVM.pc = forBlock.line;
                    else algoVM.pc += 1;
                } else { throw new Error('سطر غير مدعوم (سطر ' + (lineIdx + 1) + ')'); }
            } catch (e) {
                let msg = e && e.message ? e.message : String(e);
                if (!msg.includes('(سطر')) msg += ' (في السطر ' + (lineIdx + 1) + ')';
                algoVM.out.push('❌ خطأ: ' + msg);
                algoVM.halted = true;
            }
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

        function algoSyncScroll() { algoHighlightEl.scrollTop = algoEditorEl.scrollTop; algoHighlightEl.scrollLeft = algoEditorEl.scrollLeft; }

        // ==================== SMART INDENT HELPERS ====================
        const ALGO_INDENT = '  '; // 2 spaces per level

        /** Keywords whose presence at end of a line means next line is indented */
        const algoINDENT_AFTER_ENDS = ['then', 'alors', 'do', 'faire'];
        /** Full-line keywords that also open an indented block */
        const algoINDENT_AFTER_EXACT = ['else', 'sinon', 'begin', 'debut', 'début', 'start', 'var', 'variable', 'variables'];
        /** Keywords that are block closers — the line itself should be dedented on type */
        const algoDEDENT_EXACT = ['endif', 'endwhile', 'endfor', 'end while', 'end for',
            'finsi', 'fintantque', 'finpour', 'fin si', 'fin tant que', 'fin pour', 'fin'];

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
            const isExactOpener = algoINDENT_AFTER_EXACT.some(kw => trimLow === kw || trimLow.startsWith(kw + ' ') || trimLow.startsWith(kw + ':'));

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

        function algoSmartDedentOnClose() {
            // Called after input; checks if the current line is a closer and should be dedented
            const pos = algoEditorEl.selectionStart;
            const val = algoEditorEl.value;
            const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
            const currentLine = val.slice(lineStart, pos);
            const trimLow = currentLine.trimStart().replace(/\s*;?\s*$/, '').toLowerCase();
            const isCloser = algoDEDENT_EXACT.some(kw => trimLow === kw);
            if (!isCloser) return;
            const currentIndent = algoGetLineIndent(currentLine);
            if (currentIndent.length < ALGO_INDENT.length) return; // already at root
            // Remove one indent level from the line start
            const newIndent = currentIndent.slice(ALGO_INDENT.length);
            const newVal = val.slice(0, lineStart) + newIndent + val.slice(lineStart + currentIndent.length);
            const delta = currentIndent.length - newIndent.length;
            algoEditorEl.value = newVal;
            const newPos = Math.max(lineStart + newIndent.length, pos - delta);
            algoEditorEl.setSelectionRange(newPos, newPos);
            algoEditorEl.dispatchEvent(new Event('input'));
        }

        // ==================== EVENT HANDLERS ====================
        algoEditorEl.addEventListener('keydown', (e) => {
            // --- Autocomplete navigation (highest priority) ---
            if (algoSugActive && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab')) {
                e.preventDefault();
                if (e.key === 'Escape') { algoHideSuggestions(); return; }
                const items = Array.from(algoSB.querySelectorAll('.sug-item'));
                let idx = items.findIndex(el => el.classList.contains('active'));
                if (e.key === 'ArrowDown') {
                    idx = (idx + 1) % items.length;
                    items.forEach(el => el.classList.remove('active'));
                    items[idx].classList.add('active');
                } else if (e.key === 'ArrowUp') {
                    idx = (idx - 1 + items.length) % items.length;
                    items.forEach(el => el.classList.remove('active'));
                    items[idx].classList.add('active');
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                    if (idx >= 0) algoInsertSuggestion(items[idx].textContent);
                }
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

        // Auto-dedent closing keywords as they are typed
        algoEditorEl.addEventListener('input', (ev) => {
            // Only run dedent heuristic on regular character input (not paste, delete, etc.)
            if (ev.inputType === 'insertText') {
                algoSmartDedentOnClose();
            }
        }, true); // capture phase so it runs before the main input handler


        algoEditorEl.addEventListener('input', () => {
            algoVM.lines = algoEditorEl.value.replace(/\r\n/g, '\n').split('\n');
            algoSyntaxErrorEl.style.display = 'none';
            try {
                const result = algoRebuildBlocks(algoVM.lines);
                algoVM.blocks = result.blocks;
                algoVM._ifMap = result.mapIfByLine;
                algoVM._whileMap = result.mapWhileByLine;
                algoVM._forMap = result.mapForByLine;
            } catch (e) {
                algoSyntaxErrorEl.textContent = '❌ خطأ: ' + e.message;
                algoSyntaxErrorEl.style.display = 'block';
            }
            algoRenderHighlight();
            algoShowSuggestions();
        });

        algoEditorEl.addEventListener('blur', () => {
            setTimeout(algoHideSuggestions, 150);
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

        if (algoNewBtn) {
            algoNewBtn.addEventListener('click', () => {
                const hasContent = algoEditorEl.value.trim() !== '';
                if (hasContent && !confirm('سيتم مسح المحرر وبدء صفحة جديدة. هل تريد المتابعة؟')) return;
                const blank = algoCurrentLang === 'fr'
                    ? 'Algorithme NomAlgorithme\nVar\n  // صرح عن متغيراتك هنا\nDebut\n  // اكتب التعليمات هنا\nFin'
                    : 'Algorithm AlgorithmName\nVar\n  // Declare your variables here\nBegin\n  // Write your instructions here\nEnd';
                algoEditorEl.value = blank;
                algoEditorEl.dispatchEvent(new Event('input'));
                algoEditorEl.focus();
                // Place cursor after the Algorithm name for quick editing
                const firstNewline = blank.indexOf('\n');
                algoEditorEl.setSelectionRange(firstNewline, firstNewline);
                algoResetVM();
            });
        }

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
    });
})();
