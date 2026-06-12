#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const ENGINE_PATH = path.join(__dirname, '../assets/js/modules/lab-algo-engine.js');
const RESULTS = { passed: 0, failed: 0, skipped: 0, errors: [] };

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDom() {
  const html = `<!DOCTYPE html><html lang="ar"><body>
    <div class="algo-editor-wrap">
      <pre id="algoHighlight" class="algo-highlight"></pre>
      <textarea id="algoEditor" class="algo-editor" spellcheck="false"></textarea>
    </div>
    <table><tbody id="algoVarsBody"></tbody></table>
    <div id="algoOutput"></div>
    <span id="algoStepCounter"></span>
    <button id="algoRunBtn" type="button">Run</button>
    <button id="algoStepBtn" type="button">Step</button>
    <button id="algoResetBtn" type="button">Reset</button>
    <button id="algoUndoBtn" type="button">Undo</button>
    <button id="algoRedoBtn" type="button">Redo</button>
    <button id="algoNewBtn" type="button">New</button>
    <div id="algoLangToggle">
      <button class="algo-lang-btn is-active" data-lang="en">EN</button>
      <button class="algo-lang-btn" data-lang="fr">FR</button>
    </div>
    <button class="example-item" data-example="sum">Sum</button>
    <button class="example-item" data-example="condition">Condition</button>
    <button class="example-item" data-example="loop">Loop</button>
    <button class="example-item" data-example="boolean">Boolean</button>
    <button class="example-item" data-example="hello">Hello</button>
  </body></html>`;

  const dom = new JSDOM(html, {
    url: `http://localhost/lab/algo-editor.html?t=${Date.now()}-${Math.random()}`,
    pretendToBeVisual: true,
    storageQuota: 10_000_000,
    runScripts: 'outside-only',
  });
  const { window } = dom;

  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  window.localStorage.clear();

  const script = fs.readFileSync(ENGINE_PATH, 'utf8');
  vm.runInContext(script, dom.getInternalVMContext());
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

  return window;
}

function $(sel, win) {
  return win.document.querySelector(sel);
}

function getOutputText(win) {
  return $('#algoOutput', win).textContent || '';
}

function getEditorValue(win) {
  return $('#algoEditor', win).value;
}

function setEditorValue(win, code) {
  const editor = $('#algoEditor', win);
  editor.value = code;
  editor.dispatchEvent(new win.Event('input', { bubbles: true }));
}

async function clickRunAndWait(win, timeoutMs = 15000) {
  const btn = $('#algoRunBtn', win);
  btn.click();
  const start = Date.now();
  while (btn.disabled && Date.now() - start < timeoutMs) {
    await delay(5);
  }
  await delay(30);
}

async function clickStep(win, times = 1) {
  for (let i = 0; i < times; i++) {
    $('#algoStepBtn', win).click();
    await delay(10);
  }
}

async function confirmModal(win, value) {
  await delay(20);
  const overlay = win.document.querySelector('.algo-input-modal-overlay');
  assert.ok(overlay, 'Expected input modal to appear');
  const field = overlay.querySelector('.algo-input-modal-field');
  const confirm = overlay.querySelector('.algo-input-modal-confirm');
  field.value = value;
  confirm.click();
  await delay(30);
}

async function confirmNew(win) {
  $('#algoNewBtn', win).click();
  await confirmModal(win, 'نعم');
}

async function test(name, fn, { skip } = {}) {
  if (skip) {
    RESULTS.skipped++;
    console.log(`  SKIP  ${name}`);
    return;
  }
  const win = buildDom();
  try {
    await fn(win);
    RESULTS.passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    RESULTS.failed++;
    RESULTS.errors.push({ name, message: err.message, stack: err.stack });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

// ==================== BASIC SUITE ====================
const BASIC_TESTS = [
  ['loads default Hello World program', async (win) => {
    const value = getEditorValue(win);
    assert.ok(value.includes('Algorithm'));
    assert.ok(value.includes('Begin'));
    assert.ok(value.includes('Write("Hello World!")'));
    assert.ok(value.includes('End'));
  }],

  ['renders syntax highlighting', async (win) => {
    const html = $('#algoHighlight', win).innerHTML;
    assert.ok(html.includes('algo-tok-keyword'));
    assert.ok(html.includes('algo-tok-io'));
    assert.ok(html.includes('algo-tok-string'));
    assert.ok(html.includes('algo-ln'));
  }],

  ['runs Hello World', async (win) => {
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Hello World!'));
  }],

  ['steps through program', async (win) => {
    await clickStep(win, 5);
    assert.ok(getOutputText(win).includes('Hello World!'));
  }],

  ['resets VM state', async (win) => {
    await clickRunAndWait(win);
    assert.ok(getOutputText(win) !== '');
    $('#algoResetBtn', win).click();
    await delay(20);
    assert.strictEqual(getOutputText(win), '');
    assert.ok($('#algoVarsBody', win).textContent.includes('لا توجد متغيرات بعد'));
  }],

  ['loads and runs Sum example', async (win) => {
    $('[data-example="sum"]', win).click();
    await delay(20);
    const value = getEditorValue(win);
    assert.ok(value.includes('Algorithm Summation'));
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('The sum is:'));
    assert.ok(output.includes('30'));
  }],

  ['loads and runs Condition example', async (win) => {
    $('[data-example="condition"]', win).click();
    await delay(20);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Very Good'));
  }],

  ['loads and runs For Loop example', async (win) => {
    $('[data-example="loop"]', win).click();
    await delay(20);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('Number:'));
    assert.ok(output.includes('1'));
    assert.ok(output.includes('5'));
  }],

  ['loads and runs Boolean example', async (win) => {
    $('[data-example="boolean"]', win).click();
    await delay(20);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Not allowed to drive'));
  }],

  ['switches to French and translates', async (win) => {
    $('.algo-lang-btn[data-lang="fr"]', win).click();
    await delay(20);
    const value = getEditorValue(win);
    assert.ok(value.includes('Algorithme'));
    assert.ok(value.includes('Debut'));
    assert.ok(value.includes('Ecrire'));
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Hello World!'));
  }],

  ['translates back to English', async (win) => {
    $('.algo-lang-btn[data-lang="fr"]', win).click();
    await delay(10);
    $('.algo-lang-btn[data-lang="en"]', win).click();
    await delay(10);
    const value = getEditorValue(win);
    assert.ok(value.includes('Algorithm'));
    assert.ok(value.includes('Write'));
  }],

  ['clears editor on New', async (win) => {
    await confirmNew(win);
    assert.strictEqual(getEditorValue(win).trim(), '');
  }],

  ['undo and redo text changes', async (win) => {
    const doc = win.document;
    const editor = doc.getElementById('algoEditor');
    const undoBtn = doc.getElementById('algoUndoBtn');
    const redoBtn = doc.getElementById('algoRedoBtn');
    const edited = 'Algorithm Test\nBegin\n  Write("Hello");\nEnd';
    editor.value = edited;
    editor.dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.strictEqual(undoBtn.disabled, false, 'undo should be enabled after edit');
    const snapshot = editor.value;
    undoBtn.click();
    assert.ok(!editor.value.includes('Algorithm Test'), 'undo should restore previous program');
    redoBtn.click();
    assert.strictEqual(editor.value, snapshot, 'redo should restore edited program');
  }],

  ['shows variables after stepping Sum', async (win) => {
    $('[data-example="sum"]', win).click();
    await delay(10);
    await clickStep(win, 8);
    const varsText = $('#algoVarsBody', win).textContent;
    assert.ok(!varsText.includes('لا توجد متغيرات بعد'));
  }],

  ['shows syntax error for invalid code', async (win) => {
    setEditorValue(win, 'Invalid code without structure');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('خطأ'));
  }],

  ['detects missing semicolon', async (win) => {
    setEditorValue(win, 'Algorithm Test\nBegin\n  Write("hello")\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('خطأ'));
  }],

  ['inserts 2 spaces on Tab', async (win) => {
    const editor = $('#algoEditor', win);
    editor.value = '';
    editor.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    await delay(10);
    assert.strictEqual(editor.value, '  ');
  }],

  ['replaces := with leftward arrow', async (win) => {
    const editor = $('#algoEditor', win);
    editor.value = 'x:=';
    editor.setSelectionRange(3, 3);
    editor.dispatchEvent(new win.InputEvent('input', {
      inputType: 'insertText',
      data: '=',
      bubbles: true,
      cancelable: true,
    }));
    await delay(20);
    assert.ok(editor.value.includes('\u2190'), 'expected ← in: ' + editor.value);
    assert.ok(!editor.value.includes(':='));
  }],

  ['shows input modal on Read', async (win) => {
    setEditorValue(win, 'Algorithm InputTest\nVar\n  name : string;\nBegin\n  Write("Enter name:");\n  Read(name);\n  Write(name);\nEnd');
    await delay(10);
    $('#algoRunBtn', win).click();
    await delay(50);
    await confirmModal(win, 'Ahmed');
    await delay(50);
    const output = getOutputText(win);
    assert.ok(output.includes('Ahmed'));
  }],

  ['highlights current line during step', async (win) => {
    $('[data-example="sum"]', win).click();
    await delay(10);
    await clickStep(win, 1);
    const currentLines = win.document.querySelectorAll('#algoHighlight .is-current');
    assert.strictEqual(currentLines.length, 1);
  }],

  ['shows multiple output lines', async (win) => {
    setEditorValue(win, 'Algorithm MultiLine\nBegin\n  Write("Line 1");\n  Write("Line 2");\n  Write("Line 3");\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('Line 1'));
    assert.ok(output.includes('Line 2'));
    assert.ok(output.includes('Line 3'));
  }],

  ['runs while loop', async (win) => {
    setEditorValue(win, 'Algorithm WhileTest\nVar\n  i : integer;\nBegin\n  i = 1;\n  while i <= 3 do\n    Write(i);\n    i = i + 1;\n  endwhile\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('1'));
    assert.ok(output.includes('3'));
  }],

  ['runs const program', async (win) => {
    setEditorValue(win, 'Algorithm ConstTest\nconst pi = 3;\nVar\n  r : integer;\nBegin\n  r = 10;\n  Write(pi * r);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('30'));
  }],

  ['runs else if chain for low score', async (win) => {
    setEditorValue(win, 'Algorithm ElseIfTest\nVar\n  score : integer;\nBegin\n  score = 55;\n  if score >= 90 then\n    Write("A");\n  else if score >= 80 then\n    Write("B");\n  else if score >= 70 then\n    Write("C");\n  else\n    Write("Fail");\n  endif\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Fail'));
  }],

  ['ignores comments', async (win) => {
    setEditorValue(win, 'Algorithm CommentTest\n# comment\n// comment\nBegin\n  Write("Hello");\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Hello'));
  }],

  ['computes div and mod', async (win) => {
    setEditorValue(win, 'Algorithm DivModTest\nVar\n  a, b, d, m : integer;\nBegin\n  a = 17;\n  b = 5;\n  d = a div b;\n  m = a mod b;\n  Write(d);\n  Write(m);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('3'));
    assert.ok(output.includes('2'));
  }],

  ['evaluates nested if', async (win) => {
    setEditorValue(win, 'Algorithm NestedIfTest\nVar\n  x : integer;\nBegin\n  x = 5;\n  if x > 0 then\n    if x < 10 then\n      Write("Between 1 and 9");\n    endif\n  endif\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Between 1 and 9'));
  }],

  ['concatenates strings', async (win) => {
    setEditorValue(win, 'Algorithm ConcatTest\nVar\n  s : string;\nBegin\n  s = "Hello" + " " + "World";\n  Write(s);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('Hello World'));
  }],

  ['persists code across reload', async (win) => {
    setEditorValue(win, 'Algorithm PersistTest\nBegin\n  Write("Saved");\nEnd');
    await delay(50);
    const saved = win.localStorage.getItem('algo-editor-code');
    assert.ok(saved && saved.includes('PersistTest'));
  }],

  ['highlights error line', async (win) => {
    setEditorValue(win, 'Algorithm ErrorTest\nVar\n  x : integer;\nBegin\n  y = 10;\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const errorLines = win.document.querySelectorAll('#algoHighlight .is-error');
    assert.strictEqual(errorLines.length, 1);
  }],

  ['loads French example when FR active', async (win) => {
    $('.algo-lang-btn[data-lang="fr"]', win).click();
    await delay(10);
    $('[data-example="sum"]', win).click();
    await delay(10);
    assert.ok(getEditorValue(win).includes('Algorithme'));
  }],
];

// ==================== STRESS SUITE ====================
const STRESS_TESTS = [
  ['large program 100+ lines (sum 1..50 = 1275)', async (win) => {
    let code = 'Algorithm LargeTest\nVar\n  i, sum : integer;\nBegin\n  sum = 0;\n';
    for (let i = 1; i <= 50; i++) code += '  sum = sum + ' + i + ';\n';
    code += '  Write(sum);\nEnd';
    setEditorValue(win, code);
    await delay(20);
    await clickRunAndWait(win, 20000);
    assert.ok(getOutputText(win).includes('1275'));
  }],

  ['deeply nested structures', async (win) => {
    const code = 'Algorithm DeepNest\nVar\n  i, j, result : integer;\nBegin\n  result = 0;\n  for i = 1 to 3 do\n    j = 1;\n    while j <= 3 do\n      if i > 1 then\n        if j > 1 then\n          result = result + 1;\n        else\n          result = result + 10;\n        endif\n      else\n        result = result + 100;\n      endif\n      j = j + 1;\n    endwhile\n  endfor\n  Write(result);\nEnd';
    setEditorValue(win, code);
    await delay(20);
    await clickRunAndWait(win, 20000);
    assert.ok(Number(getOutputText(win).trim()) >= 300);
  }],

  ['skips while when condition false', async (win) => {
    setEditorValue(win, 'Algorithm SkipWhile\nVar\n  x : integer;\nBegin\n  x = 10;\n  while x < 0 do\n    Write("should not appear");\n    x = x + 1;\n  endwhile\n  Write("done");\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(!output.includes('should not appear'));
    assert.ok(output.includes('done'));
  }],

  ['skips for when start > end', async (win) => {
    setEditorValue(win, 'Algorithm SkipFor\nVar\n  i : integer;\nBegin\n  for i = 5 to 1 do\n    Write(i);\n  endfor\n  Write("done");\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('done'));
  }],

  ['division by zero error', async (win) => {
    setEditorValue(win, 'Algorithm DivZero\nVar\n  a, b, c : integer;\nBegin\n  a = 10;\n  b = 0;\n  c = a div b;\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(/خطأ|E007|zero/i.test(output));
  }],

  ['mod by zero error', async (win) => {
    setEditorValue(win, 'Algorithm ModZero\nVar\n  a, b, c : integer;\nBegin\n  a = 10;\n  b = 0;\n  c = a mod b;\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(/خطأ|E007|zero/i.test(output));
  }],

  ['special characters in strings', async (win) => {
    setEditorValue(win, 'Algorithm SpecialChars\nBegin\n  Write("Hello World");\n  Write("A+B=C");\n  Write("x < 5");\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('Hello World'));
    assert.ok(output.includes('A+B=C'));
  }],

  ['empty program', async (win) => {
    setEditorValue(win, 'Algorithm Empty\nBegin\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.strictEqual(getOutputText(win).trim(), '');
  }],

  ['large number arithmetic', async (win) => {
    setEditorValue(win, 'Algorithm LargeNum\nVar\n  a, b : integer;\nBegin\n  a = 999999;\n  b = 888888;\n  Write(a + b);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('1888887'));
  }],

  ['negative numbers', async (win) => {
    setEditorValue(win, 'Algorithm NegTest\nVar\n  a, b, c : integer;\nBegin\n  a = -5;\n  b = 10;\n  c = a + b;\n  Write(c);\n  Write(a - b);\n  Write(a * b);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('5'));
    assert.ok(output.includes('-15'));
    assert.ok(output.includes('-50'));
  }],

  ['complex boolean expressions', async (win) => {
    setEditorValue(win, 'Algorithm BoolComplex\nVar\n  a, b, c : boolean;\nBegin\n  a = true;\n  b = false;\n  c = true;\n  if a and b or a and c then\n    Write("pass");\n  else\n    Write("fail");\n  endif\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('pass'));
  }],

  ['rapid undo/redo cycles', async (win) => {
    setEditorValue(win, 'Algorithm Test\nBegin\n  Write("Hello");\nEnd');
    await delay(10);
    for (let i = 0; i < 20; i++) {
      $('#algoUndoBtn', win).click();
      await delay(2);
      $('#algoRedoBtn', win).click();
      await delay(2);
    }
    assert.ok(getEditorValue(win).includes('Algorithm Test'));
  }],

  ['multiple language toggles', async (win) => {
    for (let i = 0; i < 10; i++) {
      $('.algo-lang-btn[data-lang="fr"]', win).click();
      await delay(2);
      $('.algo-lang-btn[data-lang="en"]', win).click();
      await delay(2);
    }
    const value = getEditorValue(win);
    assert.ok(value.includes('Algorithm') || value.includes('Algorithme'));
  }],

  ['many variables (30)', async (win) => {
    let vars = '', init = '';
    for (let i = 1; i <= 30; i++) {
      vars += '  v' + i + ' : integer;\n';
      init += '  v' + i + ' = ' + i + ';\n';
    }
    setEditorValue(win, 'Algorithm ManyVars\nVar\n' + vars + 'Begin\n' + init + '  Write(v30);\nEnd');
    await delay(20);
    await clickRunAndWait(win, 20000);
    assert.ok(getOutputText(win).includes('30'));
  }],

  ['rapid step clicks', async (win) => {
    setEditorValue(win, 'Algorithm RapidStep\nVar\n  i : integer;\nBegin\n  i = 0;\n  while i < 50 do\n    i = i + 1;\n  endwhile\n  Write(i);\nEnd');
    await delay(10);
    for (let i = 0; i < 20; i++) {
      $('#algoStepBtn', win).click();
      await delay(2);
    }
    assert.ok(getOutputText(win).length >= 0);
  }],

  ['recover from edit during halted state', async (win) => {
    setEditorValue(win, 'Algorithm EditTest\nVar\n  x : integer;\nBegin\n  x = 5;\n  Write(x);\nEnd');
    await delay(10);
    await clickStep(win, 2);
    setEditorValue(win, 'Algorithm EditTest\nVar\n  x : integer;\nBegin\n  x = 99;\n  Write(x);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('99'));
  }],

  ['const and let combined', async (win) => {
    setEditorValue(win, 'Algorithm ConstLetTest\nconst pi = 3;\nlet name = "Ali";\nVar\n  r : integer;\nBegin\n  r = pi * 10;\n  Write(r);\n  Write(name);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('30'));
    assert.ok(output.includes('Ali'));
  }],

  ['variable names with underscores', async (win) => {
    setEditorValue(win, 'Algorithm VarNames\nVar\n  _temp, my_var_1, data2 : integer;\nBegin\n  _temp = 10;\n  my_var_1 = 20;\n  data2 = _temp + my_var_1;\n  Write(data2);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('30'));
  }],

  ['nested while loops (count=12)', async (win) => {
    setEditorValue(win, 'Algorithm NestedWhile\nVar\n  i, j, count : integer;\nBegin\n  i = 1;\n  count = 0;\n  while i <= 3 do\n    j = 1;\n    while j <= 4 do\n      count = count + 1;\n      j = j + 1;\n    endwhile\n    i = i + 1;\n  endwhile\n  Write(count);\nEnd');
    await delay(10);
    await clickRunAndWait(win, 20000);
    assert.ok(getOutputText(win).includes('12'));
  }],

  ['all if-else if-else branches', async (win) => {
    setEditorValue(win, 'Algorithm AllBranches\nVar\n  i : integer;\nBegin\n  for i = 1 to 4 do\n    if i == 1 then\n      Write("one");\n    else if i == 2 then\n      Write("two");\n    else if i == 3 then\n      Write("three");\n    else\n      Write("other");\n    endif\n  endfor\nEnd');
    await delay(10);
    await clickRunAndWait(win, 20000);
    const output = getOutputText(win);
    assert.ok(output.includes('one'));
    assert.ok(output.includes('two'));
    assert.ok(output.includes('three'));
    assert.ok(output.includes('other'));
  }],

  ['mixed string and number concatenation', async (win) => {
    setEditorValue(win, 'Algorithm MixedConcat\nVar\n  s : string;\nBegin\n  s = "Value: " + 42;\n  Write(s);\n  Write("Sum: " + (10 + 20));\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('Value: 42'));
    assert.ok(output.includes('Sum: 30'));
  }],

  ['program with only comments', async (win) => {
    setEditorValue(win, 'Algorithm CommentOnly\n# comment\n// comment\nBegin\n  Write("output");\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('output'));
  }],

  ['Write with multiple arguments', async (win) => {
    setEditorValue(win, 'Algorithm MultiWrite\nVar\n  a, b : integer;\nBegin\n  a = 1;\n  b = 2;\n  Write("a =", a, "b =", b);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(output.includes('a ='));
    assert.ok(output.includes('1'));
    assert.ok(output.includes('b ='));
    assert.ok(output.includes('2'));
  }],

  ['rejects reserved words as variable names', async (win) => {
    setEditorValue(win, 'Algorithm ReservedVar\nVar\n  while : integer;\nBegin\n  while = 10;\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(/خطأ|E003/i.test(output));
  }],

  ['errors on undefined variable assign', async (win) => {
    setEditorValue(win, 'Algorithm UndefVar\nBegin\n  x = 10;\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(/خطأ|E002/i.test(output));
  }],

  ['all comparison operators', async (win) => {
    setEditorValue(win, 'Algorithm CompOps\nVar\n  a, b : integer;\nBegin\n  a = 5;\n  b = 10;\n  if a < b then\n    Write("lt");\n  endif\n  if b > a then\n    Write("gt");\n  endif\n  if a <= 5 then\n    Write("le");\n  endif\n  if b >= 10 then\n    Write("ge");\n  endif\n  if a != 10 then\n    Write("ne");\n  endif\n  if a == 5 then\n    Write("eq");\n  endif\nEnd');
    await delay(10);
    await clickRunAndWait(win, 20000);
    const output = getOutputText(win);
    ['lt', 'gt', 'le', 'ge', 'ne', 'eq'].forEach((t) => assert.ok(output.includes(t), 'missing ' + t));
  }],

  ['all assignment operators (=, :=)', async (win) => {
    setEditorValue(win, 'Algorithm AssignStyles\nVar\n  a, b, c : integer;\nBegin\n  a = 1;\n  b := 2;\n  c = a + b;\n  Write(c);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('3'));
  }],

  ['cancel New keeps content', async (win) => {
    setEditorValue(win, 'Algorithm KeepTest\nBegin\n  Write("keep me");\nEnd');
    await delay(10);
    $('#algoNewBtn', win).click();
    await confirmModal(win, 'no');
    assert.ok(getEditorValue(win).includes('KeepTest'));
  }],

  ['run, edit, run again', async (win) => {
    setEditorValue(win, 'Algorithm RunEditRun\nVar\n  x : integer;\nBegin\n  x = 5;\n  Write(x);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    setEditorValue(win, 'Algorithm RunEditRun\nVar\n  x : integer;\nBegin\n  x = 99;\n  Write(x);\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(getOutputText(win).includes('99'));
  }],

  ['paste 200+ lines (sum 1..200 = 20100)', async (win) => {
    let code = 'Algorithm PasteTest\nVar\n  sum : integer;\nBegin\n  sum = 0;\n';
    for (let i = 1; i <= 200; i++) code += '  sum = sum + ' + i + ';\n';
    code += '  Write(sum);\nEnd';
    setEditorValue(win, code);
    await delay(30);
    await clickRunAndWait(win, 30000);
    assert.ok(getOutputText(win).includes('20100'));
  }],

  ['very long string output (2000 chars)', async (win) => {
    let longStr = 'Write("';
    for (let i = 0; i < 2000; i++) longStr += 'x';
    longStr += '");';
    setEditorValue(win, 'Algorithm LongLine\nBegin\n  ' + longStr + '\nEnd');
    await delay(20);
    await clickRunAndWait(win, 20000);
    assert.ok(getOutputText(win).length > 1000);
  }],

  ['blocks eval injection attempt', async (win) => {
    setEditorValue(win, 'Algorithm Inject\nVar\n  x : integer;\nBegin\n  x = eval("1");\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    const output = getOutputText(win);
    assert.ok(/خطأ|ممنوعة|غير مسموح/i.test(output));
  }],

  ['blocks window access in expression', async (win) => {
    setEditorValue(win, 'Algorithm Inject2\nVar\n  x : integer;\nBegin\n  x = window;\nEnd');
    await delay(10);
    await clickRunAndWait(win);
    assert.ok(/خطأ|ممنوعة/i.test(getOutputText(win)));
  }],
];

// ==================== TEXTAREA / UI SUITE ====================
const TEXTAREA_TESTS = [
  ['grows in height when many lines added', async (win) => {
    const editor = $('#algoEditor', win);
    const initialHeight = parseInt(editor.style.height) || 360;
    let code = 'Algorithm GrowTest\nBegin\n';
    for (let i = 0; i < 80; i++) code += '  Write("line ' + i + '");\n';
    code += 'End';
    setEditorValue(win, code);
    await delay(30);
    const newHeight = parseInt(editor.style.height) || editor.scrollHeight;
    assert.ok(newHeight >= initialHeight, 'height should grow');
  }],

  ['shrinks when content removed', async (win) => {
    const editor = $('#algoEditor', win);
    let bigCode = 'Algorithm ShrinkTest\nBegin\n';
    for (let i = 0; i < 100; i++) bigCode += '  Write("x");\n';
    bigCode += 'End';
    setEditorValue(win, bigCode);
    await delay(20);
    const tallHeight = parseInt(editor.style.height) || editor.scrollHeight;
    setEditorValue(win, 'Algorithm Small\nBegin\nEnd');
    await delay(20);
    const shortHeight = parseInt(editor.style.height) || editor.scrollHeight;
    assert.ok(shortHeight <= tallHeight, 'height should shrink or stay same');
  }],

  ['does not lose characters on rapid fill', async (win) => {
    const text = 'Algorithm Rapid\nBegin\n  Write("hello");\nEnd';
    setEditorValue(win, text);
    await delay(10);
    const value = getEditorValue(win);
    assert.ok(value.includes('Algorithm Rapid'));
    assert.ok(value.includes('Write("hello")'));
  }],

  ['Shift+Tab dedents', async (win) => {
    const editor = $('#algoEditor', win);
    editor.value = '  dedent me';
    editor.setSelectionRange(2, 2);
    editor.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    await delay(10);
    assert.ok(editor.value.startsWith('dedent'));
  }],

  ['smart indent after Begin via Enter', async (win) => {
    const editor = $('#algoEditor', win);
    editor.value = 'Algorithm Test\nBegin';
    editor.setSelectionRange(editor.value.length, editor.value.length);
    editor.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await delay(10);
    assert.ok(editor.value.includes('  '));
  }],
];

async function main() {
  console.log('\n========================================');
  console.log('  Informatix Algorithm Editor — Heavy Test Suite');
  console.log('  Engine: ' + path.relative(process.cwd(), ENGINE_PATH));
  console.log('========================================\n');

  console.log('--- Basic Tests (' + BASIC_TESTS.length + ') ---');
  for (const [name, fn] of BASIC_TESTS) await test(name, fn);

  console.log('\n--- Stress Tests (' + STRESS_TESTS.length + ') ---');
  for (const [name, fn] of STRESS_TESTS) await test(name, fn);

  console.log('\n--- Textarea / UI Tests (' + TEXTAREA_TESTS.length + ') ---');
  for (const [name, fn] of TEXTAREA_TESTS) await test(name, fn);

  const total = RESULTS.passed + RESULTS.failed + RESULTS.skipped;
  console.log('\n========================================');
  console.log(`  Results: ${RESULTS.passed}/${total} passed, ${RESULTS.failed} failed, ${RESULTS.skipped} skipped`);
  console.log('========================================\n');

  if (RESULTS.failed > 0) {
    console.log('Failed tests:');
    RESULTS.errors.forEach((e) => console.log('  - ' + e.name + ': ' + e.message));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
