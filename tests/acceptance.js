const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('/home/nico/.nvm/versions/node/v22.23.2/lib/node_modules/playwright');

(async () => {
  const root = process.cwd();
  const sourceFiles = ['index.html', 'css/tokens.css', 'css/app.css', 'js/app.js'];
  const forbidden = /linear|gradient|tocá|mirá|podés|tenés|querés/i;
  for (const file of sourceFiles) assert(!forbidden.test(fs.readFileSync(path.join(root, file), 'utf8')), `${file} contains forbidden text`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
  assert(await page.locator('#splashLayer').isVisible(), 'splash is not visible');
  await page.locator('[data-splash-skip]').click();
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="nurse-home"]').isVisible(), 'nurse home did not open');
  assert(await page.locator('.badge-critical').count() >= 1, 'critical badge missing');
  assert.strictEqual(await page.locator('[data-patient-card="cr"] .badge-critical').count(), 1, 'Carlos critical badge missing');

  await page.locator('[data-patient="mg"]').click();
  await page.waitForTimeout(450);
  assert(await page.locator('[data-view-key="nurse-detail"]').isVisible(), 'patient detail did not push in');
  assert((await page.locator('.clinical-value').textContent()).includes('Enoxaparina'), 'wrong patient clinical record');
  assert(!(await page.locator('.clinical-value').textContent()).includes('PA 90/55'), 'Carlos data leaked into María detail');
  const filterBefore = await page.locator('.clinical-value').evaluate(node => getComputedStyle(node).filter);
  assert(filterBefore.includes('blur'), 'clinical value is not blurred');
  await page.locator('.clinical-value').click();
  assert(await page.locator('.clinical-value.is-revealed').count() === 1, 'clinical reveal failed');
  await page.locator('[data-back]').click();
  await page.waitForTimeout(400);
  assert(await page.locator('[data-view-key="nurse-home"]').isVisible(), 'back navigation failed');

  await page.locator('[data-nav="registrar"]').click();
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('.registration-layer.is-open').count(), 1, 'registration sheet did not open');
  assert.strictEqual(await page.locator('.event-chip').count(), 4, 'quick event count is not four');
  assert((await page.locator('.dictate-button').boundingBox()).height >= 56, 'dictate target is under 56px');
  await page.locator('.registration-sheet [data-sheet-close]').click();
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('.registration-layer.is-open').count(), 0, 'registration sheet did not close');

  await page.locator('[data-nav="pendientes"]').click();
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('[data-task-card]').count(), 3, 'pending list is incomplete');
  for (let index = 0; index < 3; index += 1) {
    await page.locator('[data-task-card] [data-confirm]').first().click();
    await page.waitForTimeout(850);
  }
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('[data-empty-state]').count(), 1, 'empty state did not render');
  assert((await page.locator('.celebration-layer.is-visible .confetti-piece').count()) >= 8, 'confetti did not render');
  await page.locator('[data-close-celebration]').click();
  await page.waitForTimeout(400);

  await page.locator('[data-role="paciente"]').click();
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="patient-home"]').isVisible(), 'patient role did not open');
  assert((await page.locator('#screen').textContent()).includes('Aquí ve'), 'patient copy is not formal');
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Enoxaparina|taquicardia/), 'clinical data leaked to patient');
  assert.strictEqual(await page.locator('[data-video-slot="onboarding-1"], [data-video-slot="onboarding-2"]').count(), 2, 'onboarding video slots missing');
  await page.locator('[data-nav="preguntas"]').click();
  await page.waitForTimeout(400);
  assert(await page.locator('[data-view-key="patient-questions"]').isVisible(), 'questions view did not open');
  await page.locator('[data-faq]').first().click();
  assert.strictEqual(await page.locator('.faq-item.is-open').count(), 1, 'FAQ interaction failed');

  await page.locator('[data-role="familia"]').click();
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="family-home"]').isVisible(), 'family role did not open');
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Enoxaparina|taquicardia/), 'clinical data leaked to family');
  await page.locator('[data-nav="contacto"]').click();
  await page.waitForTimeout(400);
  assert(await page.locator('[data-view-key="family-contact"]').isVisible(), 'contact view did not open');

  const desktopPhone = await page.locator('.phone').evaluate(node => ({ width: getComputedStyle(node).width, height: getComputedStyle(node).height, radius: getComputedStyle(node).borderRadius }));
  assert.deepStrictEqual(desktopPhone, { width: '390px', height: '844px', radius: '48px' });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobilePhone = await page.locator('.phone').evaluate(node => ({ width: getComputedStyle(node).width, height: getComputedStyle(node).height, radius: getComputedStyle(node).borderRadius, shadow: getComputedStyle(node).boxShadow }));
  assert.deepStrictEqual(mobilePhone, { width: '390px', height: '844px', radius: '0px', shadow: 'none' });
  assert.strictEqual(consoleErrors.length, 0, `console errors: ${consoleErrors.join('; ')}`);
  assert.strictEqual(pageErrors.length, 0, `page errors: ${pageErrors.join('; ')}`);
  assert.strictEqual(failedRequests.length, 0, `failed requests: ${failedRequests.join('; ')}`);
  console.log('acceptance: PASS');
  console.log(JSON.stringify({ desktopPhone, mobilePhone, consoleErrors: consoleErrors.length, pageErrors: pageErrors.length, failedRequests: failedRequests.length }));
  await browser.close();
})().catch(error => { console.error(error.stack || error); process.exit(1); });
