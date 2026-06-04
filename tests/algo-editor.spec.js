const { test, expect } = require('@playwright/test');

const ALGO_EDITOR_PATH = '/lab/algo-editor.html';
const PAGE_BASE = 'file:///C:/Users/THINKPAD/Desktop/MyProjects/Informatix';
const ALGO_INDENT = '  ';

async function getEditorValue(page) {
  return page.$eval('#algoEditor', el => el.value);
}

async function setEditorValue(page, text) {
  await page.$eval('#algoEditor', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input'));
  }, text);
}

async function getCursorPos(page) {
  return page.$eval('#algoEditor', el => el.selectionStart);
}

async function setCursorPos(page, pos) {
  await page.$eval('#algoEditor', (el, p) => el.setSelectionRange(p, p), pos);
}

async function selectRange(page, start, end) {
  await page.evaluate(({ s, e }) => {
    const el = document.getElementById('algoEditor');
    el.focus();
    el.setSelectionRange(s, e);
  }, { s: start, e: end });
}

async function getHighlightHTML(page) {
  return page.$eval('#algoHighlight', el => el.innerHTML);
}

async function getVarsHTML(page) {
  return page.$eval('#algoVarsBody', el => el.innerHTML);
}

async function getOutputText(page) {
  return page.$eval('#algoOutput', el => el.textContent);
}

async function waitForEditorReady(page) {
  await page.goto(PAGE_BASE + ALGO_EDITOR_PATH, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#algoEditor', { state: 'visible', timeout: 5000 });
  await page.waitForSelector('#algoHighlight', { state: 'visible', timeout: 5000 });
  await page.waitForSelector('#algoRunBtn', { state: 'visible', timeout: 5000 });
  await page.waitForFunction(() => {
    const el = document.getElementById('algoEditor');
    return el && el.value.trim().length > 0;
  }, { timeout: 5000 });
}

// ===================== 1. PAGE LOAD =====================

test.describe('Page Load', () => {
  test('editor loads with default English program', async ({ page }) => {
    await waitForEditorReady(page);
    const val = await getEditorValue(page);
    expect(val).toContain('Algorithm');
    expect(val).toContain('Begin');
    expect(val).toContain('End');
  });

  test('all UI elements are present', async ({ page }) => {
    await waitForEditorReady(page);
    await expect(page.locator('#algoEditor')).toBeVisible();
    await expect(page.locator('#algoHighlight')).toBeVisible();
    await expect(page.locator('#algoRunBtn')).toBeVisible();
    await expect(page.locator('#algoStepBtn')).toBeVisible();
    await expect(page.locator('#algoResetBtn')).toBeVisible();
    await expect(page.locator('#algoNewBtn')).toBeVisible();
    await expect(page.locator('#algoLangToggle')).toBeVisible();
    await expect(page.locator('#algoVarsBody')).toBeVisible();
    await expect(page.locator('#algoOutput')).toBeVisible();
  });

  test('syntax highlight element is rendered', async ({ page }) => {
    await waitForEditorReady(page);
    const html = await getHighlightHTML(page);
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('algo-line');
    expect(html).toContain('algo-ln');
    expect(html).toContain('algo-code');
  });
});

// ===================== 2. TYPING & BASIC EDITING =====================

test.describe('Typing & Basic Editing', () => {
  test('can type characters into the editor', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();
    await editor.clear();
    await editor.type('Hello World');
    const val = await getEditorValue(page);
    expect(val).toBe('Hello World');
  });

  test('highlight updates after typing', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();
    // Get initial highlight
    const before = await getHighlightHTML(page);
    // Type something that should change highlighting
    await editor.clear();
    await editor.fill('Algorithm Test\nBegin\n  Write("Hi");\nEnd');
    await page.waitForTimeout(100);
    const after = await getHighlightHTML(page);
    expect(after).not.toBe(before);
  });
});

// ===================== 3. SELECT & REPLACE TEXT =====================

test.describe('Select and Replace Text', () => {
  test('selecting and typing replaces text without cursor jump bug', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    const testVal = '    Ecriture("Bonjour")';
    await page.evaluate((val) => {
      const el = document.getElementById('algoEditor');
      el.value = val;
      el.dispatchEvent(new Event('input'));
    }, testVal);
    await page.waitForTimeout(50);

    // Position of "Ecriture": after 4 spaces
    const ecritureStart = testVal.indexOf('Ecriture');
    const ecritureEnd = ecritureStart + 'Ecriture'.length;

    // Select "Ecriture" and type "Fin" (which is a closer keyword)
    await selectRange(page, ecritureStart, ecritureEnd);

    // Type the replacement character by character
    await page.keyboard.type('Fin');
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    // The line should still have the original indentation
    // because there's text after the cursor ("(\"Bonjour\")")
    expect(val).toBe('    Fin("Bonjour")');

    // Cursor should be right after "Fin" (position 7 = 4 spaces + F + i + n)
    const cursor = await getCursorPos(page);
    expect(cursor).toBe(7);
  });

  test('selecting entire line content and typing closer keyword dedents correctly', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');

    await editor.focus();
    await editor.fill('');

    // Setup a block: line has extra indentation
    const val = '    Fin';
    await setEditorValue(page, val);
    await page.waitForTimeout(50);

    // Select "Fin" (the entire content after indentation)
    await selectRange(page, 4, 7);

    // Type "else" (also a closer keyword)
    await page.keyboard.type('else');
    await page.waitForTimeout(100);

    const result = await getEditorValue(page);
    // Should dedent because "else" is a closer and cursor is at end of line
    expect(result).toBe('  else');

    const cursor = await getCursorPos(page);
    // Cursor should be right after "else" (position 6 = 4 spaces? no, dedented to 2 spaces + 4 chars = 6)
    // Actually: original "    Fin", indentation 4 spaces.
    // After dedent: "  else" = 2 spaces + 4 chars = 6 chars
    expect(cursor).toBe(6);
  });

  test('selecting partial word and typing does not trigger false dedent', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('#algoEditor').focus();

    // Set up a line with a closer keyword in the middle
    await setEditorValue(page, '    Fin AutreChose');
    await page.waitForTimeout(50);

    // Select "Fin" (positions 4-7)
    await selectRange(page, 4, 7);

    // Type "De" (now the line becomes "    De AutreChose")
    await page.keyboard.type('De');
    await page.waitForTimeout(100);

    const result = await getEditorValue(page);
    // Should NOT dedent because there's text after cursor (" AutreChose") 
    expect(result).toBe('    De AutreChose');
  });
});

// ===================== 4. AUTO-INDENT ON ENTER =====================

test.describe('Auto-Indent on Enter', () => {
  test('Enter after "Alors" indents next line', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    // Use a line ending with a non-keyword suffix to avoid triggering autocomplete
    const text = 'if x > 0 then';
    await page.evaluate((t) => {
      const el = document.getElementById('algoEditor');
      el.value = t;
      el.setSelectionRange(t.length, t.length);
      el.dispatchEvent(new Event('input'));
    }, text);
    await page.waitForTimeout(50);

    // Dismiss any suggestions first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);

    // Press Enter
    await editor.press('Enter');
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toBe('if x > 0 then\n' + ALGO_INDENT);
    const cursor = await getCursorPos(page);
    expect(cursor).toBe(text.length + 1 + ALGO_INDENT.length);
  });

  test('Enter on non-opener line does not add extra indent', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    const text = 'x = 5';
    await page.evaluate((t) => {
      const el = document.getElementById('algoEditor');
      el.value = t;
      el.setSelectionRange(t.length, t.length);
      el.dispatchEvent(new Event('input'));
    }, text);
    await page.waitForTimeout(50);

    await editor.press('Escape');
    await page.waitForTimeout(50);
    await editor.press('Enter');
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toBe('x = 5\n');
  });

  test('Enter after "var a,b: integer" declaration does not add extra indent', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    const text = 'var a,b: integer';
    await page.evaluate((t) => {
      const el = document.getElementById('algoEditor');
      el.value = t;
      el.setSelectionRange(t.length, t.length);
      el.dispatchEvent(new Event('input'));
    }, text);
    await page.waitForTimeout(50);

    await editor.press('Escape');
    await page.waitForTimeout(50);
    await editor.press('Enter');
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toBe('var a,b: integer\n');
  });
});

// ===================== 5. AUTO-DEDENT ON CLOSER KEYWORDS =====================

test.describe('Auto-Dedent on Closer Keywords', () => {
  test('typing "Fin" at end of line auto-dedents', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    // Line with 4 spaces indentation, ends with "F" (so we can type "in" to complete "Fin")
    // Actually, let's just set "    F" and type "in\n"
    // No wait - the dedent fires on input, character by character
    // Set a line with indentation and "F" at the end
    await setEditorValue(page, '  \n    F');
    // Put cursor at the end (position after "F" on line 2)
    const endPos = '  \n    F'.length;
    await setCursorPos(page, endPos);
    await page.waitForTimeout(50);

    // Type "in" to complete "Fin"
    await page.keyboard.type('in');
    await page.waitForTimeout(100);

    // After typing "in", line is "    Fin" → closer → dedent to "  Fin"
    const val = await getEditorValue(page);
    expect(val).toBe('  \n  Fin');
  });

  test('typing "end" at end of line auto-dedents', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    await setEditorValue(page, '  \n    end');
    await setCursorPos(page, '  \n    end'.length);
    await page.waitForTimeout(50);

    // Trigger input by typing a space (to trigger dedent check)
    await page.keyboard.type(' ');
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toBe('  \n  end ');
  });

  test('typing "endif" at end of line auto-dedents', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    await setEditorValue(page, '    endif');
    await setCursorPos(page, '    endif'.length);
    await page.waitForTimeout(50);

    // Trigger input by typing a space (to trigger dedent check)
    // Actually, the dedent already fired when "endif" was inserted via setEditorValue
    // Let's type another closer keyword from scratch

    // Set value with indentation
    await setEditorValue(page, '    end');
    await setCursorPos(page, 7); // after "    end"
    await page.waitForTimeout(50);

    // Type "if"
    await page.keyboard.type('if');
    await page.waitForTimeout(100);

    // After typing "if", line is "    endif" → closer → dedent to "  endif"
    const val = await getEditorValue(page);
    expect(val).toBe('  endif');
  });
});

// ===================== 6. TAB / SHIFT+TAB =====================

test.describe('Tab and Shift+Tab', () => {
  test('Tab inserts ' + ALGO_INDENT.length + ' spaces', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();
    await page.evaluate(() => {
      const el = document.getElementById('algoEditor');
      el.value = '';
      el.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(50);

    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);

    const val = await getEditorValue(page);
    expect(val).toBe(ALGO_INDENT);
  });

  test('Shift+Tab removes one indent level', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();
    await page.evaluate(() => {
      const el = document.getElementById('algoEditor');
      el.value = '';
      el.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(50);

    await setEditorValue(page, ALGO_INDENT + 'x');
    // Place cursor on the line (after indentation)
    await setCursorPos(page, ALGO_INDENT.length);
    await page.waitForTimeout(50);

    // Press Shift+Tab
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(50);

    const val = await getEditorValue(page);
    expect(val).toBe('x'); // indent removed
  });
});

// ===================== 7. LANGUAGE SWITCHING =====================

test.describe('Language Switching', () => {
  test('switching to FR loads French default program', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('#algoLangToggle .algo-lang-btn[data-lang="fr"]').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toContain('Algorithme');
    expect(val).toContain('Debut');
    expect(val).toContain('Fin');
  });

  test('switching to EN loads English default program', async ({ page }) => {
    await waitForEditorReady(page);
    // First switch to FR
    await page.locator('#algoLangToggle .algo-lang-btn[data-lang="fr"]').click();
    await page.waitForTimeout(50);
    // Then back to EN
    await page.locator('#algoLangToggle .algo-lang-btn[data-lang="en"]').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toContain('Algorithm');
    expect(val).toContain('Begin');
    expect(val).toContain('End');
  });

  test('language button has is-active class when selected', async ({ page }) => {
    await waitForEditorReady(page);
    await expect(page.locator('#algoLangToggle .algo-lang-btn[data-lang="en"]')).toHaveClass(/is-active/);
    await page.locator('#algoLangToggle .algo-lang-btn[data-lang="fr"]').click();
    await page.waitForTimeout(50);
    await expect(page.locator('#algoLangToggle .algo-lang-btn[data-lang="fr"]')).toHaveClass(/is-active/);
    await expect(page.locator('#algoLangToggle .algo-lang-btn[data-lang="en"]')).not.toHaveClass(/is-active/);
  });
});

// ===================== 8. EXAMPLES =====================

test.describe('Examples', () => {
  test('clicking Hello World example loads it', async ({ page }) => {
    await waitForEditorReady(page);
    // Switch to FR first (has different examples)
    await page.locator('#algoLangToggle .algo-lang-btn[data-lang="en"]').click();
    await page.waitForTimeout(50);

    await page.locator('[data-example="hello"]').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toContain('HelloWorld');
    expect(val).toContain('Write("Hello World!")');
  });

  test('clicking Sum example loads it', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('#algoLangToggle .algo-lang-btn[data-lang="en"]').click();
    await page.waitForTimeout(50);

    await page.locator('[data-example="sum"]').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toContain('Summation');
    expect(val).toContain('s = a + b');
  });

  test('clicking Condition example loads it', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('[data-example="condition"]').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toContain('Grades');
    expect(val).toContain('if score >= 90 then');
  });

  test('clicking Loop example loads it', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('[data-example="loop"]').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toContain('Counting');
    expect(val).toContain('for i = 1 to 5 do');
  });

  test('clicking Boolean example loads it', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('[data-example="boolean"]').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toContain('BooleanExample');
    expect(val).toContain('isAdult and hasLicense');
  });
});

// ===================== 9. RUN / STEP / RESET =====================

test.describe('Run / Step / Reset', () => {
  test('Run executes algorithm and shows output', async ({ page }) => {
    await waitForEditorReady(page);
    // Load a simple program
    await setEditorValue(page, 'Algorithm Test\nBegin\n  Write("Hello");\nEnd');
    await page.waitForTimeout(50);

    await page.locator('#algoRunBtn').click();
    await page.waitForTimeout(300);

    const output = await getOutputText(page);
    expect(output).toContain('Hello');
  });

  test('Step advances through the program', async ({ page }) => {
    await waitForEditorReady(page);
    await setEditorValue(page, 'Algorithm Test\nVar\n  x : integer\nBegin\n  x = 42\n  Write(x);\nEnd');
    await page.waitForTimeout(50);

    // Step past Algorithm header
    await page.locator('#algoStepBtn').click();
    await page.waitForTimeout(100);
    // Step past Var header
    await page.locator('#algoStepBtn').click();
    await page.waitForTimeout(100);
    // Step past x declaration (x should now be in vars)
    await page.locator('#algoStepBtn').click();
    await page.waitForTimeout(100);

    // After stepping past Var declaration, x should be declared
    const hasVarX = await page.evaluate(() => document.getElementById('algoVarsBody').innerHTML.includes('x'));
    expect(hasVarX).toBe(true);
  });

  test('Reset clears VM state', async ({ page }) => {
    await waitForEditorReady(page);
    await setEditorValue(page, 'Algorithm Test\nBegin\n  Write("Hello");\nEnd');
    await page.waitForTimeout(50);

    // Run first
    await page.locator('#algoRunBtn').click();
    await page.waitForTimeout(300);

    // Output should have something
    const hasOutput = await page.evaluate(() => document.getElementById('algoOutput').textContent.length > 0);
    expect(hasOutput).toBe(true);

    // Reset
    await page.locator('#algoResetBtn').click();
    await page.waitForTimeout(100);

    // Output should be cleared
    const outputEmpty = await page.evaluate(() => document.getElementById('algoOutput').textContent === '');
    expect(outputEmpty).toBe(true);
  });

  test('"جديد" button clears editor and shows new template', async ({ page }) => {
    await waitForEditorReady(page);
    // First load an example
    await page.locator('[data-example="sum"]').click();
    await page.waitForTimeout(50);

    // Set up dialog handler to accept (confirm)
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // Click "جديد" button
    await page.locator('#algoNewBtn').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toBe('');
  });
});

// ===================== 10. SUGGESTIONS (AUTOCOMPLETE) =====================

test.describe('Autocomplete Suggestions', () => {
  test('typing keyword prefix shows suggestion box', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();
    await editor.clear();

    // Type "Al" which should suggest "Algorithm", "Alors", etc.
    await page.keyboard.type('Al');
    await page.waitForTimeout(200);

    // Check suggestion panel is visible
    const sugPanel = page.locator('.sug-panel');
    await expect(sugPanel).toBeVisible();
  });

  test('suggestion box disappears on non-matching text', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();
    await editor.clear();

    // Type something that doesn't match any keyword
    await page.keyboard.type('Xyz');
    await page.waitForTimeout(200);

    const sugPanel = page.locator('.sug-panel');
    await expect(sugPanel).not.toBeVisible();
  });
});

// ===================== 11. THEME TOGGLE =====================

test.describe('Theme Toggle', () => {
  test('theme toggle switches between light and dark', async ({ page }) => {
    await waitForEditorReady(page);
    const themeBtn = page.locator('#themeToggle');
    await expect(themeBtn).toBeVisible();

    // Get current theme
    const getTheme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const initialTheme = await getTheme();

    // Click toggle
    await themeBtn.click();
    await page.waitForTimeout(100);
    const newTheme = await getTheme();
    expect(newTheme).not.toBe(initialTheme);
  });
});

// ===================== 12. FONT SIZE TOGGLE =====================

test.describe('Font Size Toggle', () => {
  test('font toggle cycles through sizes', async ({ page }) => {
    await waitForEditorReady(page);
    const fontBtn = page.locator('#fontToggle');
    const wrap = page.locator('.algo-editor-wrap');

    // Get initial size class
    const getSizeClass = async () => {
      const classes = await wrap.getAttribute('class');
      const match = classes.match(/font-size-(\w+)/);
      return match ? match[1] : null;
    };

    const initial = await getSizeClass();

    // Click to cycle
    await fontBtn.click();
    await page.waitForTimeout(50);
    const second = await getSizeClass();
    expect(second).not.toBe(initial);

    // Click again
    await fontBtn.click();
    await page.waitForTimeout(50);
    const third = await getSizeClass();
    expect(third).not.toBe(second);
  });
});

// ===================== 13. SYNTAX ERROR DISPLAY =====================

test.describe('Syntax Error Display', () => {
  test('invalid syntax shows error message', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    await page.evaluate(() => {
      const el = document.getElementById('algoEditor');
      el.value = 'Algorithm Test\nBegin\n  x = 5\nEnd\nendif';
      el.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(100);

    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.algo-syntax-error');
      return el && el.style.display !== 'none' ? el.textContent || '' : '';
    });
    expect(errorText.length).toBeGreaterThan(0);
  });
});

// ===================== 14. NEW BUTTON CONFIRMATION =====================

test.describe('New Button', () => {
  test('new button shows confirmation when editor has content', async ({ page }) => {
    await waitForEditorReady(page);
    // Editor already has default content

    // Set up dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await page.locator('#algoNewBtn').click();
    await page.waitForTimeout(100);

    const val = await getEditorValue(page);
    expect(val).toBe('');
  });
});

// ===================== 15. SCROLL SYNC =====================

test.describe('Scroll Sync', () => {
  test('highlight scrolls with editor', async ({ page }) => {
    await waitForEditorReady(page);
    const editor = page.locator('#algoEditor');
    await editor.focus();

    // Fill with many lines to enable scrolling
    let manyLines = 'Algorithm Test\nBegin\n';
    for (let i = 0; i < 50; i++) {
      manyLines += '  x = ' + i + '\n';
    }
    manyLines += 'End';
    await setEditorValue(page, manyLines);
    await page.waitForTimeout(100);

    // Scroll the editor
    await page.$eval('#algoEditor', el => { el.scrollTop = 100; el.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(50);

    // Check highlight scroll matches
    const highlightScroll = await page.$eval('#algoHighlight', el => el.scrollTop);
    expect(highlightScroll).toBe(100);
  });
});


