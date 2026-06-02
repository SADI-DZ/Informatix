const { test, expect } = require('@playwright/test');

const PAGE_BASE = 'file:///C:/Users/THINKPAD/Desktop/MyProjects/Informatix';

test('debug enter', async ({ page }) => {
  page.on('pageerror', err => console.log('ERROR:', err.message));
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));

  await page.goto(PAGE_BASE + '/lab/algo-editor.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForSelector('#algoEditor', { state: 'visible', timeout: 5000 });
  await page.waitForFunction(() => {
    const el = document.getElementById('algoEditor');
    return el && el.value.trim().length > 0;
  }, { timeout: 5000 });

  const editor = page.locator('#algoEditor');
  await editor.focus();

  // Clear and set value step by step
  await page.evaluate(() => {
    const el = document.getElementById('algoEditor');
    el.value = '';
    el.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);

  const text = 'if x > 0 then';
  await page.evaluate((t) => {
    const el = document.getElementById('algoEditor');
    el.value = t;
    el.setSelectionRange(t.length, t.length);
    el.dispatchEvent(new Event('input'));
  }, text);
  await page.waitForTimeout(200);

  console.log('Before Enter, value:', JSON.stringify(await page.evaluate(() => document.getElementById('algoEditor').value)));
  console.log('Before Enter, cursor:', await page.evaluate(() => document.getElementById('algoEditor').selectionStart));

  // Use the locator to press Enter (Playwright docs say this is preferred over page.keyboard.press)
  await editor.press('Enter');
  
  // Check immediately after keyDown
  console.log('After Enter, value:', JSON.stringify(await page.evaluate(() => document.getElementById('algoEditor').value)));
  console.log('After Enter, cursor:', await page.evaluate(() => document.getElementById('algoEditor').selectionStart));
  console.log('After Enter, focus:', await page.evaluate(() => document.activeElement === document.getElementById('algoEditor')));
});
