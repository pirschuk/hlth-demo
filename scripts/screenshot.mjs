#!/usr/bin/env node
// Скриншот экрана прототипа (телефон 393×852, @2x) → .screenshots/<имя>-<время>.png
// Использование:
//   node scripts/screenshot.mjs "<экран>" [имя] [--set "<переключатель>=<значение>"] [--click "<локатор>"] [--scroll N] [--url http://...]
// <экран> — пункт списка «Экран» в панели прототипа («Питание», «Добавить еду», «Мои блюда»…).
// --set повторяемый: выбор в панели по подписи select, например --set "Экран добавления (тест)=tiles".
// --click повторяемый: Playwright-локатор внутри телефона, например --click 'role=radio[name="Обед"]'.
// --scroll N — прокрутить первый скролл-контейнер экрана на N px.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}

const args = process.argv.slice(2);
const take = (name) => {
  const out = [];
  for (let i = args.indexOf(name); i !== -1; i = args.indexOf(name)) out.push(args.splice(i, 2)[1]);
  return out;
};
const sets = take('--set');
const clicks = take('--click');
const scroll = Number(take('--scroll')[0] ?? 0);
const base = take('--url')[0] ?? 'http://localhost:8765/';
const screen = args[0] ?? 'Питание';
const name = args[1] ?? (screen.replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || 'screen');
const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
const out = `.screenshots/${name}-${stamp}.png`;

mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
for (const s of sets) {
  const [label, value] = s.split('=');
  await page.getByLabel(label.trim()).selectOption(value.trim());
}
await page.locator('select').nth(1).selectOption({ label: screen });
const phone = page.locator('.phone-screen').first();
for (const c of clicks) await phone.locator(c).first().click();
if (scroll) await phone.locator('.scroll').first().evaluate((el, y) => (el.scrollTop = y), scroll);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const overflowX = await phone.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
await phone.screenshot({ path: out });
await browser.close();

console.log(out);
if (overflowX) console.log('ВНИМАНИЕ: горизонтальный скролл внутри экрана');
if (errors.length) console.log('Ошибки в консоли:\n' + errors.map((e) => '  ' + e).join('\n'));
