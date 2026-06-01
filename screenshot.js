const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://stratos-dashboard-drab.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
  console.log('Screenshot saved to dashboard-screenshot.png');
  await browser.close();
})();