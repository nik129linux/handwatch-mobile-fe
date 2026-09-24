const { chromium } = require('/home/nico/.nvm/versions/node/v22.23.2/lib/node_modules/playwright');
const { pathToFileURL } = require('url');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.waitForTimeout(1500);
  const phone = await page.locator('.phone').evaluate(node => ({ width: getComputedStyle(node).width, height: getComputedStyle(node).height, radius: getComputedStyle(node).borderRadius, shadow: getComputedStyle(node).boxShadow }));
  const videoState = await page.locator('.loop').evaluateAll(nodes => nodes.map(node => ({ paused: node.paused, autoplay: node.autoplay })));
  const transition = await page.locator('.view').first().evaluate(node => getComputedStyle(node).transitionDuration).catch(() => 'not-mounted');
  const reducedRule = await page.locator('style').count();
  console.log(JSON.stringify({ phone, videoState, transition, errors }, null, 2));
  await browser.close();
})();
