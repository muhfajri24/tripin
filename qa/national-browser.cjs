const { chromium } = require('./browser/node_modules/playwright-core');
const fs = require('fs');
const assert = require('assert');

const base = process.env.TRIPIN_QA_BASE_URL || 'http://127.0.0.1:8020';
const output = 'qa/release/national-browser.json';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TRIPIN_QA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const report = { base, viewport: '390x844', steps: [], pageErrors: [] };
  page.on('pageerror', (error) => report.pageErrors.push(String(error)));
  async function step(name, action) {
    try {
      await action();
      report.steps.push({ name, status: 'passed' });
    } catch (error) {
      report.steps.push({ name, status: 'failed', error: error.message });
      throw error;
    }
  }
  try {
    await step('open planner', async () => {
      await page.goto(`${base}/create`);
      for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: 'Lanjut' }).click();
      await page.getByRole('heading', { name: 'Halo, mau liburan ke mana?' }).waitFor();
    });
    await step('resolve Bandung and choose hotel', async () => {
      await page.getByRole('textbox', { name: 'Ceritakan rencana perjalananmu' }).fill('2 hari di Bandung, 2 orang, wisata budaya dan kuliner, budget Rp500.000 per orang');
      await page.getByRole('button', { name: 'Kirim permintaan' }).click();
      await page.getByLabel('Mau ke daerah mana?').waitFor();
      await page.getByRole('button', { name: 'Cari daerah' }).click();
      await page.getByText(/Bandung · \d+ tempat ditemukan/).waitFor();
      const hotel = page.locator('input[aria-label="Cari nama hotel"]').locator('xpath=following-sibling::div').locator('button').first();
      await hotel.click();
      await page.getByText('Lengkapi perkiraan harga lainnya').click();
      await page.getByLabel('Kamar per malam (Rp)').fill('200000');
      assert.strictEqual(await page.getByRole('button', { name: 'Susun sekarang' }).isEnabled(), true);
    });
    let trip;
    await step('plan with national ID and hotel anchor', async () => {
      const response = page.waitForResponse((res) => res.url().endsWith('/itineraries/plan') && res.request().method() === 'POST');
      await page.getByRole('button', { name: 'Susun sekarang' }).click();
      trip = (await (await response).json()).itinerary;
      assert(trip);
      assert(trip.request.destinationId.startsWith('osm-'));
      assert.strictEqual(trip.request.destinationName, 'Bandung');
      assert.strictEqual(trip.request.lodging.placeId.startsWith('osm-'), true);
      assert.strictEqual(trip.days[0].startAnchor.lat, trip.days[0].endAnchor.lat);
      await page.getByText(/Perjalanan 2 hari di Bandung/).waitFor();
    });
    await step('save and reload', async () => {
      await page.getByRole('button', { name: 'Simpan itinerary' }).click();
      await page.reload();
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tripin_guest_itineraries_v1')));
      assert(stored.trips.some((item) => item.id === trip.id));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    });
  } catch (error) {
    report.error = error.message;
    await page.screenshot({ path: 'qa/release/national-browser-failure.png', fullPage: true }).catch(() => {});
  }
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report));
  if (report.error || report.pageErrors.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
