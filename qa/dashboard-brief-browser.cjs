const { chromium } = require('./browser/node_modules/playwright-core');
const fs = require('fs');
const assert = require('assert');

const base = process.env.TRIPIN_QA_BASE_URL || 'http://127.0.0.1:8020';
const output = 'qa/release/dashboard-brief-browser.json';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TRIPIN_QA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const report = { base, viewport: '390x844', steps: [], pageErrors: [] };
  page.on('pageerror', (error) => report.pageErrors.push(String(error)));
  async function step(name, fn) {
    try { await fn(); report.steps.push({ name, status: 'passed' }); }
    catch (error) { report.steps.push({ name, status: 'failed', error: error.message }); throw error; }
  }
  try {
    let firstIds;
    await step('complete dashboard brief generates directly', async () => {
      await page.goto(base);
      await page.getByLabel('Mau liburan ke mana?').fill(
        'Saya mau ke Semarang 1 hari bersama pasangan, kuliner dan budaya, budget Rp800.000 total'
      );
      const plan = page.waitForResponse((res) => res.url().endsWith('/itineraries/plan') && res.request().method() === 'POST');
      await page.getByRole('button', { name: 'Susun Perjalanan' }).first().click();
      const answer = await (await plan).json();
      assert(answer.itinerary);
      assert.strictEqual(answer.itinerary.request.destinationName, 'Semarang');
      assert.deepStrictEqual(answer.itinerary.request.interests, ['food', 'culture']);
      assert.strictEqual(answer.itinerary.request.travelers.adults, 2);
      assert.strictEqual(answer.itinerary.request.budget.totalIdr, 800000);
      firstIds = answer.itinerary.days.flatMap((day) => day.stops.map((stop) => stop.placeId));
      await page.getByRole('button', { name: 'Susun alternatif' }).waitFor();
    });
    await step('alternative changes places while preserving preferences', async () => {
      const plan = page.waitForResponse((res) => res.url().endsWith('/itineraries/plan') && res.request().method() === 'POST');
      await page.getByRole('button', { name: 'Susun alternatif' }).click();
      const response = await plan;
      const request = JSON.parse(response.request().postData()).request;
      const answer = await response.json();
      assert(firstIds.every((id) => request.excludedPlaceIds.includes(id)));
      assert(answer.itinerary);
      const nextIds = answer.itinerary.days.flatMap((day) => day.stops.map((stop) => stop.placeId));
      assert(nextIds.length > 0);
      assert(nextIds.some((id) => !firstIds.includes(id)));
      assert.deepStrictEqual(answer.itinerary.request.interests, ['food', 'culture']);
    });
    await step('incomplete brief opens only missing questions', async () => {
      await page.goto(base);
      await page.getByLabel('Mau liburan ke mana?').fill('Saya mau ke Semarang 3 hari');
      await page.getByRole('button', { name: 'Susun Perjalanan' }).first().click();
      await page.getByRole('heading', { name: /Tempat seperti apa yang mau kamu kunjungi di Semarang/ }).waitFor();
      await page.getByRole('button', { name: /Budaya & Sejarah/ }).click();
      await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
      await page.getByRole('heading', { name: 'Liburan ini bersama siapa?' }).waitFor();
      await page.getByRole('button', { name: /Pasangan/ }).click();
      await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
      await page.getByLabel('Biaya yang ingin dikeluarkan (Rp)').fill('1500000');
      await page.getByRole('button', { name: 'Lanjut', exact: true }).click();
      await page.getByText('Menginap di hotel mana?').waitFor();
    });
  } catch (error) {
    report.error = error.message;
    await page.screenshot({ path: 'qa/release/dashboard-brief-browser-failure.png', fullPage: true }).catch(() => {});
  }
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report));
  if (report.error || report.pageErrors.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
