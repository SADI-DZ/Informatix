// Algorithm Editor Engine
(function() {
    "use strict";
    document.addEventListener('DOMContentLoaded', () => {
        const algoEditorEl = document.getElementById('algoEditor');
        const algoHighlightEl = document.getElementById('algoHighlight');
        const algoVarsBody = document.getElementById('algoVarsBody');
        const algoOutputEl = document.getElementById('algoOutput');
        const algoRunBtn = document.getElementById('algoRunBtn');
        const algoStepBtn = document.getElementById('algoStepBtn');
        const algoResetBtn = document.getElementById('algoResetBtn');
        const algoLangToggle = document.getElementById('algoLangToggle');

        if (!algoEditorEl || !algoHighlightEl || !algoVarsBody || !algoOutputEl || !algoRunBtn || !algoStepBtn || !algoResetBtn) return;

        let algoCurrentLang = 'en';
        let algoIsRunning = false;

        // ==================== CONSTANTS ====================
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

        // ==================== VM ====================
        let algoVM = { lines: [], blocks: [], pc: 0, vars: {}, out: [], halted: false, _ifMap: new Map(), _whileMap: new Map(), _forMap: new Map() };

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

        // ==================== EVENT HANDLERS ====================
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
    });
})();
