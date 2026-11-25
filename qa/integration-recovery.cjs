const { chromium } = require('./browser/node_modules/playwright-core');
const fs = require('fs');
const assert = require('assert');
const BASE = process.env.TRIPIN_QA_BASE_URL || 'http://127.0.0.1:8015';
const OUT = process.env.TRIPIN_QA_OUTPUT || 'qa/release/integration-local';
const KEY = 'tripin_guest_itineraries_v1';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.TRIPIN_QA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const report = { base: BASE, steps: [], pageErrors: [] };
  async function scenario(name, run) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    page.on('pageerror', e => report.pageErrors.push(String(e)));
    try { await run(page, context); report.steps.push({ name, status: 'passed' }); }
    catch (e) { report.steps.push({ name, status: 'failed', error: e.message }); }
    finally { await context.close(); }
  }
  async function form(page) {
    await page.goto(BASE + '/create');
    await page.getByLabel('Budget IDR sesuai basis', { exact: true }).fill('500000');
    await page.getByLabel('Tanggal mulai', { exact: true }).fill('2026-12-01');
    await page.getByLabel('Kendaraan per hari IDR (all-in)', { exact: true }).fill('50000');
    await page.getByLabel(/Saya sudah memeriksa/).check();
    await page.getByRole('button', { name: 'Susun itinerary', exact: true }).waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Susun itinerary' && !b.disabled));
  }
  async function generate(page) {
    const response = page.waitForResponse(r => r.url().endsWith('/itineraries/plan') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Susun itinerary', exact: true }).click();
    return (await (await response).json()).itinerary;
  }
  await scenario('503 preserves reviewed form, no fake trip; retry uses actual backend', async page => {
    await form(page);
    await page.route('**/api/v1/itineraries/plan', r => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Catalog unavailable (deliberate QA)' } }) }));
    await page.getByRole('button', { name: 'Susun itinerary', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Catalog unavailable' }).waitFor();
    assert(page.url().endsWith('/create'));
    assert.strictEqual(await page.getByLabel('Budget IDR sesuai basis', { exact: true }).inputValue(), '500000');
    assert.strictEqual(await page.evaluate(k => localStorage.getItem(k), KEY), null);
    await page.unroute('**/api/v1/itineraries/plan');
    const trip = await generate(page); assert(trip);
    await page.getByRole('heading', { name: 'Yogyakarta, 1 hari' }).waitFor();
    assert.strictEqual(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).trips.length, KEY), 1);
  });
  await scenario('quota failure keeps canonical result and editor draft visible without false saved message', async (page, context) => {
    await context.addInitScript(k => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === k) throw new DOMException('Deliberate QA quota', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    }, KEY);
    await form(page); assert(await generate(page));
    await page.getByRole('heading', { name: 'Yogyakarta, 1 hari' }).waitFor();
    await page.getByRole('alert').filter({ hasText: 'belum tersimpan' }).waitFor();
    await page.getByRole('button', { name: 'Simpan ulang' }).click();
    assert.strictEqual(await page.getByText('Tersimpan pada browser ini.', { exact: true }).count(), 0);
    await page.getByRole('link', { name: 'Edit & reschedule' }).click();
    await page.getByRole('button', { name: 'Simpan revisi saat ini' }).click();
    await page.getByRole('alert').filter({ hasText: 'belum tersimpan' }).waitFor();
    assert.strictEqual(await page.getByText('Revisi tersimpan pada browser ini.', { exact: true }).count(), 0);
    assert.strictEqual(await page.evaluate(k => localStorage.getItem(k), KEY), null);
  });
  await scenario('corrupt storage stays intact while new result remains viewable', async (page, context) => {
    await context.addInitScript(k => localStorage.setItem(k, 'corrupt-QA-sentinel'), KEY);
    await form(page); assert(await generate(page));
    await page.getByRole('heading', { name: 'Yogyakarta, 1 hari' }).waitFor();
    await page.getByRole('alert').filter({ hasText: 'tidak dapat dibaca' }).waitFor();
    assert.strictEqual(await page.evaluate(k => localStorage.getItem(k), KEY), 'corrupt-QA-sentinel');
  });
  await scenario('catalog outage and retry preserve input and review stays required', async page => {
    await page.route('**/api/v1/places', r => r.abort());
    await page.goto(BASE + '/create');
    await page.getByRole('alert').waitFor();
    await page.locator('textarea').fill('Yogyakarta 1 hari budget Rp500000 per orang');
    assert(await page.getByRole('button', { name: 'Susun itinerary', exact: true }).isDisabled());
    await page.unroute('**/api/v1/places');
    await page.getByRole('button', { name: 'Muat ulang katalog' }).click();
    await page.getByRole('button', { name: 'Muat ulang katalog' }).waitFor({ state: 'detached' });
    assert((await page.locator('textarea').inputValue()).includes('Rp500000'));
    assert(await page.getByRole('button', { name: 'Susun itinerary', exact: true }).isDisabled());
  });
  fs.writeFileSync(`${OUT}/browser-recovery.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  if (report.steps.some(s => s.status !== 'passed') || report.pageErrors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
