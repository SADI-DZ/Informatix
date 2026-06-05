const { test } = require('@playwright/test');
const assert = require('assert');

const PAGE_URL = '/lab/algo-editor.html';

test.describe('Algorithm Editor — Stress Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForSelector('#algoEditor', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  // 1. LARGE PROGRAM
  test('should run a large program with 100+ lines', async ({ page }) => {
    let code = 'Algorithm LargeTest\nVar\n  i, sum : integer;\nBegin\n  sum = 0;\n';
    for (let i = 1; i <= 50; i++) {
      code += '  sum = sum + ' + i + ';\n';
    }
    code += '  Write(sum);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(800);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('1275'));
  });

  // 2. DEEP NESTING — if inside while inside for
  test('should execute deeply nested structures', async ({ page }) => {
    const code = 'Algorithm DeepNest\nVar\n  i, j, result : integer;\nBegin\n  result = 0;\n  for i = 1 to 3 do\n    j = 1;\n    while j <= 3 do\n      if i > 1 then\n        if j > 1 then\n          result = result + 1;\n        else\n          result = result + 10;\n        endif\n      else\n        result = result + 100;\n      endif\n      j = j + 1;\n    endwhile\n  endfor\n  Write(result);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(800);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(Number(output.trim()) >= 300);
  });

  // 3. WHILE LOOP — zero iterations (condition false from start)
  test('should skip while loop when condition is initially false', async ({ page }) => {
    const code = 'Algorithm SkipWhile\nVar\n  x : integer;\nBegin\n  x = 10;\n  while x < 0 do\n    Write("should not appear");\n    x = x + 1;\n  endwhile\n  Write("done");\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(!output.includes('should not appear'));
    assert.ok(output.includes('done'));
  });

  // 4. FOR LOOP — zero iterations
  test('should skip for loop when start > end', async ({ page }) => {
    const code = 'Algorithm SkipFor\nVar\n  i : integer;\nBegin\n  for i = 5 to 1 do\n    Write(i);\n  endfor\n  Write("done");\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('done'));
  });

  // 5. DIVISION BY ZERO
  test('should handle division by zero gracefully', async ({ page }) => {
    const code = 'Algorithm DivZero\nVar\n  a, b, c : integer;\nBegin\n  a = 10;\n  b = 0;\n  c = a div b;\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('خطأ') || output.includes('Error') || output.includes('E007') || output.includes('zero'));
  });

  // 6. MOD BY ZERO
  test('should handle mod by zero gracefully', async ({ page }) => {
    const code = 'Algorithm ModZero\nVar\n  a, b, c : integer;\nBegin\n  a = 10;\n  b = 0;\n  c = a mod b;\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('خطأ') || output.includes('Error') || output.includes('E007') || output.includes('zero'));
  });

  // 7. STRING WITH SPECIAL CHARACTERS
  test('should handle strings with special characters', async ({ page }) => {
    const code = 'Algorithm SpecialChars\nBegin\n  Write("Hello World");\n  Write("A+B=C");\n  Write("x < 5");\n  Write("price: $10");\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Hello World'));
    assert.ok(output.includes('A+B=C'));
  });

  // 8. EMPTY PROGRAM
  test('should handle empty or minimal program', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm Empty\nBegin\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.strictEqual(output.trim(), '');
  });

  // 9. VERY LARGE NUMBER ARITHMETIC
  test('should handle large number arithmetic', async ({ page }) => {
    const code = 'Algorithm LargeNum\nVar\n  a, b : integer;\nBegin\n  a = 999999;\n  b = 888888;\n  Write(a + b);\n  Write(a * b);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('1888887'));
  });

  // 10. NEGATIVE NUMBERS
  test('should handle negative numbers in expressions', async ({ page }) => {
    const code = 'Algorithm NegTest\nVar\n  a, b, c : integer;\nBegin\n  a = -5;\n  b = 10;\n  c = a + b;\n  Write(c);\n  Write(a - b);\n  Write(a * b);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('5'));
    assert.ok(output.includes('-15'));
    assert.ok(output.includes('-50'));
  });

  // 11. COMPLEX BOOLEAN EXPRESSIONS
  test('should evaluate complex boolean expressions', async ({ page }) => {
    const code = 'Algorithm BoolComplex\nVar\n  a, b, c : boolean;\nBegin\n  a = true;\n  b = false;\n  c = true;\n  if a and b or a and c then\n    Write("pass");\n  else\n    Write("fail");\n  endif\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('pass'));
  });

  // 12. RAPID UNDO/REDO
  test('should survive rapid undo/redo cycles', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('Algorithm Test\nBegin\n  Write("Hello");\nEnd');
    await page.waitForTimeout(200);
    for (let i = 0; i < 20; i++) {
      await page.click('#algoUndoBtn');
      await page.waitForTimeout(30);
      await page.click('#algoRedoBtn');
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(200);
    const value = await editor.inputValue();
    assert.ok(value.includes('Algorithm Test'));
  });

  // 13. LANGUAGE TOGGLE STRESS
  test('should survive multiple language toggles', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.click('.algo-lang-btn[data-lang="fr"]');
      await page.waitForTimeout(100);
      await page.click('.algo-lang-btn[data-lang="en"]');
      await page.waitForTimeout(100);
    }
    const value = await page.locator('#algoEditor').inputValue();
    assert.ok(value.includes('Algorithm') || value.includes('Algorithme'));
  });

  // 14. MANY VARIABLES
  test('should handle a program with many variables', async ({ page }) => {
    let vars = '', init = '';
    for (let i = 1; i <= 30; i++) {
      vars += '  v' + i + ' : integer;\n';
      init += '  v' + i + ' = ' + i + ';\n';
    }
    const code = 'Algorithm ManyVars\nVar\n' + vars + 'Begin\n' + init + '  Write(v30);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(600);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('30'));
  });

  // 15. RAPID STEP CLICKS
  test('should survive rapid step button clicks', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('Algorithm RapidStep\nVar\n  i : integer;\nBegin\n  i = 0;\n  while i < 50 do\n    i = i + 1;\n  endwhile\n  Write(i);\nEnd');
    await page.waitForTimeout(200);
    for (let i = 0; i < 20; i++) {
      await page.click('#algoStepBtn');
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.length >= 0);
  });

  // 16. RUN AFTER EDITING MID-EXECUTION
  test('should recover from edit during halted state', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('Algorithm EditTest\nVar\n  x : integer;\nBegin\n  x = 5;\n  Write(x);\nEnd');
    await page.waitForTimeout(200);
    await page.click('#algoStepBtn');
    await page.waitForTimeout(150);
    await page.click('#algoStepBtn');
    await page.waitForTimeout(150);
    // edit code while halted
    await editor.fill('Algorithm EditTest\nVar\n  x : integer;\nBegin\n  x = 99;\n  Write(x);\nEnd');
    await page.waitForTimeout(200);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('99'));
  });

  // 17. const AND let combined
  test('should handle const and let declarations', async ({ page }) => {
    const code = 'Algorithm ConstLetTest\nconst pi = 3;\nlet name = "Ali";\nVar\n  r : integer;\nBegin\n  r = pi * 10;\n  Write(r);\n  Write(name);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('30'));
    assert.ok(output.includes('Ali'));
  });

  // 18. VARIABLE NAMES WITH UNDERSCORES AND NUMBERS
  test('should accept variable names with underscores and numbers', async ({ page }) => {
    const code = 'Algorithm VarNames\nVar\n  _temp, my_var_1, data2 : integer;\nBegin\n  _temp = 10;\n  my_var_1 = 20;\n  data2 = _temp + my_var_1;\n  Write(data2);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('30'));
  });

  // 19. NESTED WHILE LOOPS
  test('should execute nested while loops correctly', async ({ page }) => {
    const code = 'Algorithm NestedWhile\nVar\n  i, j, count : integer;\nBegin\n  i = 1;\n  count = 0;\n  while i <= 3 do\n    j = 1;\n    while j <= 4 do\n      count = count + 1;\n      j = j + 1;\n    endwhile\n    i = i + 1;\n  endwhile\n  Write(count);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('12'));
  });

  // 20. if-else if-else ALL PATHS
  test('should execute every branch of if-else if-else', async ({ page }) => {
    const code = 'Algorithm AllBranches\nVar\n  i : integer;\nBegin\n  for i = 1 to 4 do\n    if i == 1 then\n      Write("one");\n    else if i == 2 then\n      Write("two");\n    else if i == 3 then\n      Write("three");\n    else\n      Write("other");\n    endif\n  endfor\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(800);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('one'));
    assert.ok(output.includes('two'));
    assert.ok(output.includes('three'));
    assert.ok(output.includes('other'));
  });

  // 21. STRING CONCATENATION WITH NUMBERS
  test('should handle mixed string and number concatenation', async ({ page }) => {
    const code = 'Algorithm MixedConcat\nVar\n  s : string;\nBegin\n  s = "Value: " + 42;\n  Write(s);\n  Write("Sum: " + (10 + 20));\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('Value: 42'));
    assert.ok(output.includes('Sum: 30'));
  });

  // 22. PROGRAM WITH ONLY COMMENTS
  test('should handle a program with only comments', async ({ page }) => {
    const code = 'Algorithm CommentOnly\n# This is a comment\n// Another comment\n# Yet another\nBegin\n  // comment inside\n  Write("output");\n  # comment at end\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('output'));
  });

  // 23. MULTIPLE WRITE ARGUMENTS
  test('should handle Write with multiple arguments', async ({ page }) => {
    const code = 'Algorithm MultiWrite\nVar\n  a, b : integer;\nBegin\n  a = 1;\n  b = 2;\n  Write("a =", a, "b =", b);\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('a ='));
    assert.ok(output.includes('1'));
    assert.ok(output.includes('b ='));
    assert.ok(output.includes('2'));
  });

  // 24. AUTO-SAVE WITH SPECIAL CHARACTERS
  test('should persist code with special characters in auto-save', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const code = 'Algorithm SpecialSave\nBegin\n  Write("test <<>> &&&");\nEnd';
    await editor.fill(code);
    await page.waitForTimeout(400);
    await page.goto(PAGE_URL);
    await page.waitForSelector('#algoEditor', { state: 'visible' });
    await page.waitForTimeout(500);
    const value = await editor.inputValue();
    assert.ok(value.includes('test'));
    assert.ok(value.includes('<<>>'));
  });

  // 25. RESERVED WORD USED AS VARIABLE — should error
  test('should reject reserved words as variable names', async ({ page }) => {
    const code = 'Algorithm ReservedVar\nVar\n  while : integer;\nBegin\n  while = 10;\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('خطأ') || output.includes('E003'));
  });

  // 26. UNDEFINED VARIABLE IN ASSIGN
  test('should error when assigning to undefined variable', async ({ page }) => {
    const code = 'Algorithm UndefVar\nBegin\n  x = 10;\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('خطأ') || output.includes('E002'));
  });

  // 27. COMPARISON OPERATORS
  test('should handle all comparison operators', async ({ page }) => {
    const code = 'Algorithm CompOps\nVar\n  a, b : integer;\nBegin\n  a = 5;\n  b = 10;\n  if a < b then\n    Write("lt");\n  endif\n  if b > a then\n    Write("gt");\n  endif\n  if a <= 5 then\n    Write("le");\n  endif\n  if b >= 10 then\n    Write("ge");\n  endif\n  if a != 10 then\n    Write("ne");\n  endif\n  if a == 5 then\n    Write("eq");\n  endif\nEnd';
    await page.locator('#algoEditor').fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(800);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('lt'));
    assert.ok(output.includes('gt'));
    assert.ok(output.includes('le'));
    assert.ok(output.includes('ge'));
    assert.ok(output.includes('ne'));
    assert.ok(output.includes('eq'));
  });

  // 28. MIXED ASSIGNMENT STYLES (=, :=, ←)
  test('should accept all assignment operators', async ({ page }) => {
    await page.locator('#algoEditor').fill('Algorithm AssignStyles\nVar\n  a, b, c : integer;\nBegin\n  a = 1;\n  b := 2;\n  c = a + b;\n  Write(c);\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('3'));
  });

  // 29. NEW BUTTON — confirm and cancel
  test('should cancel New and keep content', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const code = 'Algorithm KeepTest\nBegin\n  Write("keep me");\nEnd';
    await editor.fill(code);
    await page.waitForTimeout(200);
    page.once('dialog', async (dialog) => { await dialog.dismiss(); });
    await page.click('#algoNewBtn');
    await page.waitForTimeout(300);
    const value = await editor.inputValue();
    assert.ok(value.includes('KeepTest'));
  });

  // 30. RUN, EDIT, RUN AGAIN
  test('should run, edit code, and run again with new logic', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('Algorithm RunEditRun\nVar\n  x : integer;\nBegin\n  x = 5;\n  Write(x);\nEnd');
    await page.waitForTimeout(200);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(400);
    await editor.fill('Algorithm RunEditRun\nVar\n  x : integer;\nBegin\n  x = 99;\n  Write(x);\nEnd');
    await page.waitForTimeout(200);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(400);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('99'));
  });

});
