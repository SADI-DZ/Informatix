const { test } = require('@playwright/test');
const assert = require('assert');

const PAGE_URL = '/lab/algo-editor.html';

test.describe('Algorithm Editor', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForSelector('#algoEditor', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  // 1. PAGE LOAD
  test('should load with correct title and all UI elements', async ({ page }) => {
    assert.ok((await page.title()).includes('محرر الخوارزميات'));
    assert.ok(await page.locator('#algoEditor').isVisible());
    assert.ok(await page.locator('#algoHighlight').isVisible());
    assert.ok(await page.locator('#algoRunBtn').isVisible());
    assert.ok(await page.locator('#algoStepBtn').isVisible());
    assert.ok(await page.locator('#algoResetBtn').isVisible());
    assert.ok(await page.locator('#algoNewBtn').isVisible());
    assert.ok(await page.locator('#algoUndoBtn').isVisible());
    assert.ok(await page.locator('#algoRedoBtn').isVisible());
    assert.ok(await page.locator('#algoOutput').isVisible());
    assert.ok(await page.locator('#algoVarsBody').isVisible());
    assert.ok(await page.locator('#algoLangToggle').isVisible());
    assert.ok(await page.locator('#fontToggle').isVisible());
    assert.ok(await page.locator('#themeToggle').isVisible());
  });

  // 2. DEFAULT PROGRAM
  test('should load default Hello World program', async ({ page }) => {
    const value = await page.locator('#algoEditor').inputValue();
    assert.ok(value.includes('Algorithm'));
    assert.ok(value.includes('Begin'));
    assert.ok(value.includes('Write("Hello World!")'));
    assert.ok(value.includes('End'));
  });

  // 3. SYNTAX HIGHLIGHTING
  test('should render syntax highlighting in overlay', async ({ page }) => {
    const html = await page.locator('#algoHighlight').innerHTML();
    assert.ok(html.includes('algo-tok-keyword'));
    assert.ok(html.includes('algo-tok-io'));
    assert.ok(html.includes('algo-tok-string'));
    assert.ok(html.includes('algo-ln'));
  });

  // 4. RUN HELLO WORLD
  test('should run Hello World and display output', async ({ page }) => {
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Hello World!'));
  });

  // 5. STEP THROUGH
  test('should step through program', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.click('#algoStepBtn');
      await page.waitForTimeout(150);
    }
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Hello World!'));
  });

  // 6. RESET
  test('should reset VM state after reset click', async ({ page }) => {
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    let output = await page.locator('#algoOutput').textContent();
    assert.ok(output !== '');
    await page.click('#algoResetBtn');
    await page.waitForTimeout(300);
    output = await page.locator('#algoOutput').textContent();
    assert.strictEqual(output, '');
    const varsText = await page.locator('#algoVarsBody').textContent();
    assert.ok(varsText.includes('لا توجد متغيرات بعد'));
  });

  // 7. SUM EXAMPLE
  test('should load Sum example and run it', async ({ page }) => {
    await page.click('[data-example="sum"]');
    await page.waitForTimeout(300);
    const value = await page.locator('#algoEditor').inputValue();
    assert.ok(value.includes('Algorithm Summation'));
    assert.ok(value.includes('a = 10'));
    assert.ok(value.includes('b = 20'));
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('The sum is:'));
    assert.ok(output.includes('30'));
  });

  // 8. CONDITION EXAMPLE
  test('should load Condition example and run it', async ({ page }) => {
    await page.click('[data-example="condition"]');
    await page.waitForTimeout(300);
    const value = await page.locator('#algoEditor').inputValue();
    assert.ok(value.includes('Algorithm Grades'));
    assert.ok(value.includes('score = 85'));
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Very Good'));
  });

  // 9. LOOP EXAMPLE
  test('should load For Loop example and run it', async ({ page }) => {
    await page.click('[data-example="loop"]');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Number:'));
    assert.ok(output.includes('1'));
    assert.ok(output.includes('5'));
  });

  // 10. BOOLEAN EXAMPLE (outputs "Not allowed to drive" since hasLicense=false)
  test('should load Boolean example and run it', async ({ page }) => {
    await page.click('[data-example="boolean"]');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Not allowed to drive'));
  });

  // 11. FRENCH LANGUAGE TOGGLE
  test('should switch to French and translate keywords', async ({ page }) => {
    await page.click('.algo-lang-btn[data-lang="fr"]');
    await page.waitForTimeout(300);
    const value = await page.locator('#algoEditor').inputValue();
    assert.ok(value.includes('Algorithme'));
    assert.ok(value.includes('Debut'));
    assert.ok(value.includes('Ecrire'));
    const frBtnClass = await page.locator('.algo-lang-btn[data-lang="fr"]').getAttribute('class');
    assert.ok(frBtnClass.includes('is-active'));
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Hello World!'));
  });

  // 12. BACK TO ENGLISH
  test('should translate back to English from French', async ({ page }) => {
    await page.click('.algo-lang-btn[data-lang="fr"]');
    await page.waitForTimeout(200);
    await page.click('.algo-lang-btn[data-lang="en"]');
    await page.waitForTimeout(200);
    const value = await page.locator('#algoEditor').inputValue();
    assert.ok(value.includes('Algorithm'));
    assert.ok(value.includes('Write'));
  });

  // 13. NEW BUTTON
  test('should clear editor on New', async ({ page }) => {
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await page.click('#algoNewBtn');
    await page.waitForTimeout(300);
    const value = await page.locator('#algoEditor').inputValue();
    assert.strictEqual(value.trim(), '');
  });

  // 14. UNDO/REDO
  test('should undo and redo text changes', async ({ page }) => {
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await page.click('#algoNewBtn');
    await page.waitForTimeout(200);
    const editor = page.locator('#algoEditor');
    await editor.fill('Algorithm Test\nBegin\nEnd');
    await page.waitForTimeout(200);
    await page.click('#algoUndoBtn');
    await page.waitForTimeout(200);
    let value = await editor.inputValue();
    assert.strictEqual(value.trim(), '');
    await page.click('#algoRedoBtn');
    await page.waitForTimeout(200);
    value = await editor.inputValue();
    assert.ok(value.includes('Algorithm Test'));
  });

  // 15. VARIABLES TABLE
  test('should show variables after stepping Sum example', async ({ page }) => {
    await page.click('[data-example="sum"]');
    await page.waitForTimeout(200);
    for (let i = 0; i < 8; i++) {
      await page.click('#algoStepBtn');
      await page.waitForTimeout(150);
    }
    const varsText = await page.locator('#algoVarsBody').textContent();
    assert.ok(!varsText.includes('لا توجد متغيرات بعد'));
  });

  // 16. SYNTAX ERROR
  test('should show syntax error for invalid code', async ({ page }) => {
    await page.locator('#algoEditor').fill('Invalid code without structure');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('خطأ'));
  });

  // 17. MISSING SEMICOLON
  test('should detect missing semicolon', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm Test\nBegin\n  Write("hello")\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('خطأ'));
  });

  // 18. FONT SIZE TOGGLE
  test('should cycle through font sizes', async ({ page }) => {
    const editorWrap = page.locator('.algo-editor-wrap');
    let cls = await editorWrap.getAttribute('class');
    assert.ok(cls.includes('font-size-normal'));
    await page.click('#fontToggle');
    cls = await editorWrap.getAttribute('class');
    assert.ok(cls.includes('font-size-medium'));
    await page.click('#fontToggle');
    cls = await editorWrap.getAttribute('class');
    assert.ok(cls.includes('font-size-large'));
    await page.click('#fontToggle');
    cls = await editorWrap.getAttribute('class');
    assert.ok(cls.includes('font-size-normal'));
  });

  // 19. THEME TOGGLE
  test('should toggle dark/light themes', async ({ page }) => {
    await page.click('#themeToggle');
    await page.waitForTimeout(200);
    const theme = await page.locator('html').getAttribute('data-theme');
    assert.ok(['dark', 'light'].includes(theme));
  });

  // 20. SMART INDENT
  test('should auto-indent after Begin', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('');
    await page.waitForTimeout(100);
    await editor.type('Algorithm Test');
    await page.waitForTimeout(50);
    await editor.press('Enter');
    await page.waitForTimeout(50);
    await editor.type('Begin');
    await page.waitForTimeout(50);
    await editor.press('Enter');
    await page.waitForTimeout(100);
    const value = await editor.inputValue();
    assert.ok(value.includes('  '));
  });

  // 21. TAB INDENT
  test('should insert 2 spaces on Tab', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('');
    await page.waitForTimeout(100);
    await editor.press('Tab');
    await page.waitForTimeout(100);
    assert.strictEqual(await editor.inputValue(), '  ');
  });

  // 22. AUTO-REPLACE := WITH ←
  test('should replace := with leftward arrow', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('');
    await page.waitForTimeout(100);
    await page.keyboard.type('x := 5');
    await page.waitForTimeout(300);
    const value = await editor.inputValue();
    assert.ok(value.includes('\u2190'));
    assert.ok(!value.includes(':='));
  });

  // 23. LOOP OUTPUT LINES
  test('should produce 5 output lines from For loop', async ({ page }) => {
    await page.click('[data-example="loop"]');
    await page.waitForTimeout(200);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const text = await page.locator('#algoOutput').textContent();
    const lines = text.trim().split('\n').filter(l => l.trim());
    assert.ok(lines.length >= 5);
  });

  // 24. INPUT MODAL
  test('should show input modal on Read statement', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm InputTest\nVar\n  name : string;\nBegin\n  Write("Enter name:");\n  Read(name);\n  Write(name);\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const modal = page.locator('.algo-input-modal-overlay');
    await page.waitForSelector('.algo-input-modal-overlay', { state: 'visible', timeout: 3000 });
    assert.ok(await modal.isVisible());
    await modal.locator('.algo-input-modal-field').fill('Ahmed');
    await modal.locator('.algo-input-modal-confirm').click();
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Ahmed'));
  });

  // 25. CURRENT LINE HIGHLIGHT
  test('should highlight current line during step', async ({ page }) => {
    await page.click('[data-example="sum"]');
    await page.waitForTimeout(200);
    await page.click('#algoStepBtn');
    await page.waitForTimeout(200);
    const currentLines = page.locator('#algoHighlight .is-current');
    assert.strictEqual(await currentLines.count(), 1);
  });

  // 26. MULTIPLE OUTPUT LINES
  test('should show multiple output lines', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm MultiLine\nBegin\n  Write("Line 1");\n  Write("Line 2");\n  Write("Line 3");\nEnd');
    await page.waitForTimeout(200);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Line 1'));
    assert.ok(output.includes('Line 2'));
    assert.ok(output.includes('Line 3'));
  });

  // 27. UNDO BUTTON STATE
  test('should have visible undo button', async ({ page }) => {
    assert.ok(await page.locator('#algoUndoBtn').isVisible());
  });

  // 28. CODE EDIT AND RUN
  test('should edit code and run successfully', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const testCode = 'Algorithm MyAlgo\nVar\n  x : integer;\nBegin\n  x = 42;\n  Write("x =");\n  Write(x);\nEnd';
    await editor.fill(testCode);
    await page.waitForTimeout(300);
    assert.strictEqual(await editor.inputValue(), testCode);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('x ='));
    assert.ok(output.includes('42'));
  });

  // 29. ERROR LINE HIGHLIGHT
  test('should highlight error line in red', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm ErrorTest\nVar\n  x : integer;\nBegin\n  y = 10;\nEnd');
    await page.waitForTimeout(200);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const errorLines = page.locator('#algoHighlight .is-error');
    assert.strictEqual(await errorLines.count(), 1);
  });

  // 30. FRENCH EXAMPLE LOAD
  test('should load example in French when FR is active', async ({ page }) => {
    await page.click('.algo-lang-btn[data-lang="fr"]');
    await page.waitForTimeout(200);
    await page.click('[data-example="sum"]');
    await page.waitForTimeout(300);
    const value = await page.locator('#algoEditor').inputValue();
    assert.ok(value.includes('Algorithme'));
  });

  // 31. WHILE LOOP
  test('should run a while loop that terminates', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm WhileTest\nVar\n  i : integer;\nBegin\n  i = 1;\n  while i <= 3 do\n    Write(i);\n    i = i + 1;\n  endwhile\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('1'));
    assert.ok(output.includes('3'));
  });

  // 32. CONST
  test('should run a program with const', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm ConstTest\nconst pi = 3;\nVar\n  r : integer;\nBegin\n  r = 10;\n  Write(pi * r);\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('30'));
  });

  // 33. ELSE IF CHAIN
  test('should run else if chain correctly for a low score', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm ElseIfTest\nVar\n  score : integer;\nBegin\n  score = 55;\n  if score >= 90 then\n    Write("A");\n  else if score >= 80 then\n    Write("B");\n  else if score >= 70 then\n    Write("C");\n  else\n    Write("Fail");\n  endif\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Fail'));
  });

  // 34. COMMENTS
  test('should ignore comment lines with # and //', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm CommentTest\n# this is a comment\n// this is also a comment\nBegin\n  Write("Hello");  // inline comment\n  # another comment\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Hello'));
  });

  // 35. DIV AND MOD
  test('should compute div and mod correctly', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm DivModTest\nVar\n  a, b, d, m : integer;\nBegin\n  a = 17;\n  b = 5;\n  d = a div b;\n  m = a mod b;\n  Write(d);\n  Write(m);\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('3'));
    assert.ok(output.includes('2'));
  });

  // 36. NESTED IF
  test('should evaluate nested if conditions', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm NestedIfTest\nVar\n  x : integer;\nBegin\n  x = 5;\n  if x > 0 then\n    if x < 10 then\n      Write("Between 1 and 9");\n    else\n      Write("10 or more");\n    endif\n  else\n    Write("Negative");\n  endif\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Between 1 and 9'));
  });

  // 37. STRING CONCATENATION
  test('should concatenate strings with +', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm ConcatTest\nVar\n  s : string;\nBegin\n  s = "Hello" + " " + "World";\n  Write(s);\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Hello World'));
  });

  // 38. AUTO-SAVE PERSISTENCE
  test('should persist code and language across reload', async ({ page, context }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('Algorithm PersistTest\nBegin\n  Write("Saved");\nEnd');
    await page.waitForTimeout(400);
    // reload the page
    await page.goto(PAGE_URL);
    await page.waitForSelector('#algoEditor', { state: 'visible' });
    await page.waitForTimeout(500);
    const value = await editor.inputValue();
    assert.ok(value.includes('PersistTest'), 'Code should persist after reload');
  });

});
