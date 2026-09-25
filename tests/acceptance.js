const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('/home/nico/.nvm/versions/node/v22.23.2/lib/node_modules/playwright');

function contrastRatio(foreground, background) {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255);
    const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const values = [luminance(foreground), luminance(background)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

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
  async function assertVideoSlot(page, slot) {
    const container = page.locator(`[data-video-slot="${slot}"]`);
    assert.strictEqual(await container.count(), 1, `${slot} video slot missing`);
    const video = container.locator('video');
    assert.strictEqual(await video.getAttribute('autoplay'), '', `${slot} video is not autoplay`);
    assert.strictEqual(await video.getAttribute('loop'), '', `${slot} video does not loop`);
    assert.strictEqual(await video.getAttribute('muted'), '', `${slot} video is not muted`);
    assert.strictEqual(await video.getAttribute('playsinline'), '', `${slot} video is not inline`);
    assert.strictEqual(await video.getAttribute('poster'), `media/${slot}.jpg`, `${slot} poster mismatch`);
    assert.deepStrictEqual(await video.locator('source').evaluateAll(nodes => nodes.map(node => [node.getAttribute('src'), node.getAttribute('type')])), [
      [`media/${slot}.webm`, 'video/webm'],
      [`media/${slot}.mp4`, 'video/mp4']
    ], `${slot} video sources mismatch`);
    const fallback = container.locator('img[src="media/frames/doctora-white.png"]');
    assert.strictEqual(await fallback.count(), 1, `${slot} image fallback missing`);
    assert.strictEqual(await container.locator('.mascot-svg').count(), 0, `${slot} inline blob remains beside video`);
    assert.strictEqual(await video.evaluate(node => getComputedStyle(node).mixBlendMode), 'multiply', `${slot} video blend mode mismatch`);
    assert.strictEqual(await fallback.evaluate(node => getComputedStyle(node).mixBlendMode), 'multiply', `${slot} image fallback has an opaque background`);
    assert.strictEqual(await container.evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)', `${slot} has a background card`);
    const box = await container.boundingBox();
    assert(box && box.width > 0 && box.height > 0, `${slot} video has no rendered size`);
  }
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
  assert(await page.locator('#splashLayer').isVisible(), 'splash is not visible');
  await assertVideoSlot(page, 'splash');
  assert.strictEqual(await page.locator('.splash-mascot').evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)', 'splash has a grey shape behind the doctor');
  assert.strictEqual(await page.locator('.splash-content').evaluate(node => getComputedStyle(node).animationName), 'none', 'animated splash ancestor blocks video blending');
  assert.strictEqual(await page.locator('.splash-mascot').evaluate(node => getComputedStyle(node).animationName), 'none', 'animated mascot ancestor blocks video blending');
  const splashVideoBox = await page.locator('[data-video-slot="splash"]').boundingBox();
  assert(splashVideoBox && splashVideoBox.width >= 180 && splashVideoBox.height >= 180, 'splash video has no rendered size');
  await page.locator('[data-splash-skip]').click();
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="nurse-home"]').isVisible(), 'nurse home did not open');
  assert(await page.locator('[data-video-slot="splash"] video').evaluate(node => node.paused), 'hidden splash video is still playing');
  assert(await page.locator('.badge-critical').count() >= 1, 'critical badge missing');
  assert.strictEqual(await page.locator('[data-patient-card="cr"] .badge-critical').count(), 1, 'Carlos critical badge missing');
  assert.strictEqual((await page.locator('[data-patient-card="cr"] .badge-critical').textContent()).trim(), 'Revisar', 'Carlos card exposes a clinical value');
  assert(!(await page.locator('[data-view-key="nurse-home"]').textContent()).includes('PA 90/55'), 'clinical value leaked onto nurse home');

  await page.locator('[data-patient="cr"]').click();
  await page.waitForTimeout(450);
  assert(await page.locator('[data-view-key="nurse-detail"]').isVisible(), 'Carlos detail did not open');
  assert.strictEqual((await page.locator('.detail-status').textContent()).trim(), 'Revisar', 'Carlos detail header exposes a clinical value');
  assert((await page.locator('#screen').textContent()).includes('La familia recibe'), 'family copy typo remains');
  await page.locator('[data-role="paciente"]').click();
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Registro clínico/), 'clinical detail remained immediately after switching to patient');
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="patient-home"]').isVisible(), 'patient role did not reset to home');
  assert.strictEqual(await page.locator('#screen .view.is-active').count(), 1, 'role switch left multiple active views');
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Registro clínico/), 'clinical detail leaked to patient after role switch');

  await page.locator('[data-role="enfermero"]').click();
  await page.waitForTimeout(500);
  await page.locator('[data-patient="cr"]').click();
  await page.waitForTimeout(450);
  await page.locator('[data-role="familia"]').click();
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Registro clínico/), 'clinical detail remained immediately after switching to family');
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="family-home"]').isVisible(), 'family role did not reset to home');
  assert.strictEqual(await page.locator('#screen .view.is-active').count(), 1, 'role switch left multiple active views');
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Registro clínico/), 'clinical detail leaked to family after role switch');

  await page.locator('[data-role="enfermero"]').click();
  await page.waitForTimeout(500);
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

  await page.locator('[data-nav="registrar"]').click();
  await page.waitForTimeout(450);
  await page.locator('[data-role="paciente"]').click({ timeout: 1000 });
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="patient-home"]').isVisible(), 'role switch from open sheet did not open patient home');
  assert.strictEqual(await page.locator('.registration-layer.is-open').count(), 0, 'role switch left registration sheet open');
  await page.locator('[data-role="enfermero"]').click();
  await page.waitForTimeout(500);

  await page.locator('[data-nav="pendientes"]').click();
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('[data-task-card]').count(), 3, 'pending list is incomplete');
  for (let index = 0; index < 3; index += 1) {
    await page.locator('[data-task-card] [data-confirm]').first().click();
    await page.waitForTimeout(850);
  }
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('[data-empty-state]').count(), 1, 'empty state did not render');
  await assertVideoSlot(page, 'empty');
  assert((await page.locator('.celebration-layer.is-visible .confetti-piece').count()) >= 8, 'confetti did not render');
  await page.locator('[data-close-celebration]').click();
  await page.waitForTimeout(400);

  await page.locator('[data-role="paciente"]').click();
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="patient-home"]').isVisible(), 'patient role did not open');
  assert((await page.locator('#screen').textContent()).includes('Aquí ve'), 'patient copy is not formal');
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Enoxaparina|taquicardia/), 'clinical data leaked to patient');
  const patientAccentColor = await page.locator('.role-tab.is-active').evaluate(node => getComputedStyle(node).color);
  assert(contrastRatio(patientAccentColor, 'rgb(251, 250, 249)') >= 4.5, 'patient accent text contrast is below 4.5:1');
  assert.strictEqual(await page.locator('.timeline-item').first().evaluate(node => getComputedStyle(node, '::before').backgroundColor), 'rgb(0, 202, 72)', 'patient fill/dot color changed');
  assert.strictEqual(await page.locator('[data-video-slot="onboarding-1"], [data-video-slot="onboarding-2"]').count(), 2, 'onboarding video slots missing');
  assert.strictEqual(await page.locator('.onboarding-card').first().evaluate(node => getComputedStyle(node).animationName), 'none', 'animated onboarding ancestor blocks video blending');
  await assertVideoSlot(page, 'onboarding-1');
  await assertVideoSlot(page, 'onboarding-2');
  await page.locator('[data-nav="preguntas"]').click();
  await page.waitForTimeout(400);
  assert(await page.locator('[data-view-key="patient-questions"]').isVisible(), 'questions view did not open');
  await page.locator('[data-faq]').first().click();
  assert.strictEqual(await page.locator('.faq-item.is-open').count(), 1, 'FAQ interaction failed');

  await page.locator('[data-role="familia"]').click();
  await page.waitForTimeout(500);
  assert(await page.locator('[data-view-key="family-home"]').isVisible(), 'family role did not open');
  const familyCopy = await page.locator('[data-view-key="family-home"]').textContent();
  assert(!(await page.locator('#screen').textContent()).match(/PA 90\/55|Enoxaparina|taquicardia/), 'clinical data leaked to family');
  const familyAccentColor = await page.locator('.role-tab.is-active').evaluate(node => getComputedStyle(node).color);
  const familyIconColor = await page.locator('.visit-icon').evaluate(node => getComputedStyle(node).color);
  assert.strictEqual(familyAccentColor, 'rgb(212, 143, 0)', 'family accent text is not #d48f00');
  assert.strictEqual(familyIconColor, 'rgb(212, 143, 0)', 'family icon is not #d48f00');
  assert.strictEqual(await page.locator('.phone').evaluate(node => getComputedStyle(node).getPropertyValue('--family').trim()), '#ffbb26', 'family fill color changed');
  assert(familyCopy.includes('acompañarla') && familyCopy.includes('con ella'), 'family copy does not agree with María');
  assert(!familyCopy.match(/acompañarlo|con él/), 'family copy uses masculine pronouns for María');
  const familyTimelineTimes = await page.locator('[data-view-key="family-home"] .timeline-time').allTextContents();
  assert(familyTimelineTimes.includes('15:00') && !familyTimelineTimes.includes('3:00 p. m.'), 'family timeline time still wraps');
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
