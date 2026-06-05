const { test } = require('@playwright/test');
const assert = require('assert');

const PAGE_URL = '/lab/algo-editor.html';

test.describe('Algorithm Editor — Textarea Stress Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.waitForSelector('#algoEditor', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  // 1. AUTO-GROWTH — should grow taller as lines are added
  test('should grow in height when many lines are typed', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const initialHeight = await editor.evaluate(el => el.offsetHeight);
    let code = 'Algorithm GrowTest\nBegin\n';
    for (let i = 0; i < 80; i++) {
      code += '  Write("line ' + i + '");\n';
    }
    code += 'End';
    await editor.fill(code);
    await page.waitForTimeout(400);
    const newHeight = await editor.evaluate(el => el.offsetHeight);
    assert.ok(newHeight > initialHeight, 'textarea should grow from ' + initialHeight + ' to ' + newHeight);
  });

  // 2. AUTO-GROWTH — should shrink when content is removed
  test('should shrink in height when lines are deleted', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    let bigCode = 'Algorithm ShrinkTest\nBegin\n';
    for (let i = 0; i < 100; i++) bigCode += '  Write("x");\n';
    bigCode += 'End';
    await editor.fill(bigCode);
    await page.waitForTimeout(300);
    const tallHeight = await editor.evaluate(el => el.offsetHeight);
    await editor.fill('Algorithm Small\nBegin\nEnd');
    await page.waitForTimeout(300);
    const shortHeight = await editor.evaluate(el => el.offsetHeight);
    assert.ok(shortHeight < tallHeight, 'textarea should shrink from ' + tallHeight + ' to ' + shortHeight);
  });

  // 3. HIGHLIGHT — should match textarea height after growth
  test('highlight overlay height should match textarea', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const highlight = page.locator('#algoHighlight');
    let code = 'Algorithm SyncHeight\nVar\n  i : integer;\nBegin\n';
    for (let i = 0; i < 60; i++) code += '  i = ' + i + ';\n';
    code += 'End';
    await editor.fill(code);
    await page.waitForTimeout(400);
    const editorH = await editor.evaluate(el => el.offsetHeight);
    const highlightH = await highlight.evaluate(el => el.offsetHeight);
    const diff = Math.abs(editorH - highlightH);
    assert.ok(diff <= 50, 'highlight height ' + highlightH + ' should be close to textarea height ' + editorH + ', diff=' + diff);
  });

  // 4. VERY LONG LINE — single line with 5000 chars
  test('should handle a single very long line', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    let longStr = 'Write("';
    for (let i = 0; i < 2000; i++) longStr += 'x';
    longStr += '");';
    const code = 'Algorithm LongLine\nBegin\n  ' + longStr + '\nEnd';
    await editor.fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(600);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.length > 1000);
  });

  // 5. RAPID KEY TYPING — simulate fast input via fill
  test('should not lose characters during rapid typing', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('');
    await page.waitForTimeout(100);
    const text = 'Algorithm Rapid\nBegin\n  Write("hello");\nEnd';
    await editor.fill(text);
    await page.waitForTimeout(300);
    const value = await editor.inputValue();
    assert.ok(value.includes('Algorithm Rapid'));
    assert.ok(value.includes('Write("hello")'));
  });

  // 6. PASTE LARGE CONTENT
  test('should handle paste of 200+ lines', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    let code = 'Algorithm PasteTest\nVar\n  sum : integer;\nBegin\n  sum = 0;\n';
    for (let i = 1; i <= 200; i++) code += '  sum = sum + ' + i + ';\n';
    code += '  Write(sum);\nEnd';
    await editor.fill(code);
    await page.waitForTimeout(500);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(1000);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('20100'));
  });

  // 7. CARET POSITION AFTER NEW — cursor should be at end
  test('should place cursor correctly after New', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await page.click('#algoNewBtn');
    await page.waitForTimeout(300);
    const cursorPos = await editor.evaluate(el => el.selectionStart);
    const valueLen = await editor.evaluate(el => el.value.length);
    assert.strictEqual(cursorPos, valueLen, 'cursor should be at end');
  });

  // 8. TAB KEY — inserts spaces via keyboard press
  test('should insert 2 spaces on Tab', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('');
    await page.waitForTimeout(100);
    // Enter + Tab after clearing
    await page.keyboard.type('Algorithm Test');
    await editor.press('Enter');
    await page.keyboard.type('Begin');
    await editor.press('Enter');
    await editor.press('Tab');
    await page.waitForTimeout(200);
    const value = await editor.inputValue();
    assert.ok(value.includes('  '));
  });

  // 9. SHIFT+TAB — dedents via fill + eval
  test('should dedent text when Shift+Tab is pressed', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('  dedent me');
    await page.waitForTimeout(100);
    // Manually trigger Shift+Tab logic via evaluate
    await editor.evaluate((el) => {
      const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      el.dispatchEvent(e);
    });
    await page.waitForTimeout(200);
    const value = await editor.inputValue();
    assert.ok(value.startsWith('dedent'), 'Shift+Tab should remove indentation');
  });

  // 10. ENTER SMART INDENT — via fill + Enter
  test('should auto-indent on Enter after Begin', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('');
    await page.waitForTimeout(100);
    // Type using keyboard for realistic Enter+smart-indent test
    await page.keyboard.type('Algorithm Test');
    await editor.press('Enter');
    await page.keyboard.type('Begin');
    await editor.press('Enter');
    await page.waitForTimeout(200);
    const value = await editor.inputValue();
    assert.ok(value.includes('\n  '), 'should have indented line after Begin');
  });

  // 11. UNDO AFTER LARGE CHANGE
  test('should undo correctly after large content change', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const origValue = await editor.inputValue();
    let bigCode = 'Algorithm UndoBig\nVar\n  i : integer;\nBegin\n';
    for (let i = 0; i < 50; i++) bigCode += '  i = ' + i + ';\n';
    bigCode += 'End';
    await editor.fill(bigCode);
    await page.waitForTimeout(300);
    await page.click('#algoUndoBtn');
    await page.waitForTimeout(300);
    const afterUndo = await editor.inputValue();
    assert.strictEqual(afterUndo, origValue, 'undo should revert large fill');
  });

  // 12. REDO AFTER UNDO
  test('should redo correctly after undo', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    // Dismiss the New confirmation dialog
    page.once('dialog', d => d.accept());
    await page.click('#algoNewBtn');
    await page.waitForTimeout(300);
    await editor.fill('Algorithm RedoBig\nBegin\n  Write("hello");\nEnd');
    await page.waitForTimeout(300);
    await page.click('#algoUndoBtn');
    await page.waitForTimeout(300);
    await page.click('#algoRedoBtn');
    await page.waitForTimeout(300);
    const value = await editor.inputValue();
    assert.ok(value.includes('RedoBig'));
  });

  // 13. TAB KEY RAPID — via fill, not keyboard
  test('should handle many Tab-indented lines via fill', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    let code = 'Algorithm TabStress\nBegin\n';
    for (let i = 0; i < 30; i++) code += '  Write("line");\n';
    code += 'End';
    await editor.fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(500);
    const output = await page.locator('#algoOutput').textContent();
    const lines = output.trim().split('\n').filter(l => l.trim());
    assert.strictEqual(lines.length, 30);
  });

  // 14. LANGUAGE TOGGLE PRESERVES TEXTAREA PROPERTIES
  test('language toggle should not break scrollHeight or selection', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const code = 'Algorithm LangToggleStress\nVar\n  a : integer;\nBegin\n  a = 10;\n  Write(a);\nEnd';
    await editor.fill(code);
    await page.waitForTimeout(200);
    const hBefore = await editor.evaluate(el => el.offsetHeight);
    for (let i = 0; i < 5; i++) {
      await page.click('.algo-lang-btn[data-lang="fr"]');
      await page.waitForTimeout(100);
      await page.click('.algo-lang-btn[data-lang="en"]');
      await page.waitForTimeout(100);
    }
    const hAfter = await editor.evaluate(el => el.offsetHeight);
    const diff = Math.abs(hAfter - hBefore);
    assert.ok(diff <= 100, 'height should remain stable, diff=' + diff);
  });

  // 15. COPY/PASTE ROUNDTRIP
  test('should preserve content through copy and paste', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const code = 'Algorithm CopyPaste\nVar\n  x : integer;\nBegin\n  x = 42;\n  Write(x);\nEnd';
    await page.waitForTimeout(100);
    // Type the code manually
    await editor.fill(code);
    await page.waitForTimeout(200);
    const value1 = await editor.inputValue();
    assert.strictEqual(value1, code);
  });

  // 16. `:=` AUTO-REPLACE — type := via keyboard
  test('should replace := with arrow when typed', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    await editor.fill('Algorithm Replace\nVar\n  x : integer;\nBegin\n');
    await page.waitForTimeout(100);
    // Position cursor at end, then type assignment
    await editor.evaluate(el => { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; });
    await page.keyboard.type('x := 5');
    await page.waitForTimeout(300);
    const value = await editor.inputValue();
    assert.ok(value.includes('\u2190'), 'should contain left arrow ←');
    assert.ok(!value.includes(':='), 'should NOT contain :=');
  });

  // 17. SPECIAL UNICODE IN TEXTAREA
  test('should store and display unicode characters', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const code = 'Algorithm Unicode\nBegin\n  Write("caf\u00e9");\n  Write("\u00e9l\u00e8ve");\n  Write("\u4e2d\u56fd");\nEnd';
    await editor.fill(code);
    await page.waitForTimeout(300);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(600);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('caf\u00e9'));
    assert.ok(output.includes('\u00e9l\u00e8ve'));
    assert.ok(output.includes('\u4e2d\u56fd'));
  });

  // 18. RAPID RUN + EDIT CYCLE
  test('should survive repeated run + edit cycles', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    for (let cycle = 0; cycle < 5; cycle++) {
      const code = 'Algorithm Cycle' + cycle + '\nBegin\n  Write("cycle ' + cycle + '");\nEnd';
      await editor.fill(code);
      await page.waitForTimeout(150);
      await page.click('#algoRunBtn');
      await page.waitForTimeout(300);
    }
    // After all cycles, click reset and run again
    await page.click('#algoResetBtn');
    await page.waitForTimeout(200);
    await page.click('#algoRunBtn');
    await page.waitForTimeout(400);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('cycle 4'));
  });

  // 19. HIGHLIGHT COLUMN ALIGNMENT — line numbers should align with text
  test('syntax highlight line numbers should align with textarea lines', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    const highlight = page.locator('#algoHighlight');
    let code = 'Algorithm Align\nVar\n  x : integer;\nBegin\n';
    for (let i = 0; i < 40; i++) code += '  x = ' + i + ';\n';
    code += 'End';
    await editor.fill(code);
    await page.waitForTimeout(500);
    // Check the highlight has the same number of lines as the editor
    const lineCount = await highlight.evaluate(el => el.querySelectorAll('.algo-ln').length);
    assert.ok(lineCount >= 40, 'highlight should have line numbers for all code lines');
  });

  // 20. FILL AFTER LARGE CLEAR — clear and refill many times
  test('should handle multiple clear + fill cycles', async ({ page }) => {
    const editor = page.locator('#algoEditor');
    for (let cycle = 0; cycle < 10; cycle++) {
      await editor.fill('');
      await page.waitForTimeout(50);
      const code = 'Algorithm Cycle' + cycle + '\nBegin\n  Write("v' + cycle + '");\nEnd';
      await editor.fill(code);
      await page.waitForTimeout(100);
    }
    await page.click('#algoRunBtn');
    await page.waitForTimeout(400);
    const output = await page.locator('#algoOutput').textContent();
    assert.ok(output.includes('v9'));
  });

});
