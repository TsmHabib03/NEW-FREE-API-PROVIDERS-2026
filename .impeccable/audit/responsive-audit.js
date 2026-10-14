/* Responsive audit — measures the real files in a real browser, per PLAN-NEWAPI-DATA-MOBILE.md.
   Run:  NODE_PATH="$(npm root -g)" node .impeccable/audit/responsive-audit.js
   Read-only: it only loads file:// pages, clicks density buttons and the compare picker,
   and reads geometry. It writes one findings JSON and prints a summary. */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const WIDTHS = [320, 360, 380, 414, 480, 580, 700, 768, 820, 1024, 1050, 1280, 1440, 1920];
const DENSITIES = ['list', 'compact', 'cards'];
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', 'responsive-audit-2026-10-14.json');

const fileUrl = f => 'file://' + path.join(ROOT, f).replace(/\\/g, '/');

const MEASURE = () => {
  const iw = window.innerWidth;
  const de = document.documentElement;
  const inScroller = el => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };
  const offenders = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return;
    if (r.right > iw + 1 && !inScroller(el)) {
      offenders.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : ''),
        right: Math.round(r.right), width: Math.round(r.width)
      });
    }
  });
  const SEL = '.prow-cta,.prow-pick,.prow-guide,.filter-chip,.density-control button,.topbar-cta,' +
    '.mobile-menu,.clear-search,.cmp-bar button,.cmp-chip button,.cmp-clear,.cmp-close,' +
    '.copy-button,.tab,.button,.provider-button,.provider-guide,.side-nav a';
  const small = [];
  document.querySelectorAll(SEL).forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return;
    if (r.height < 44 || r.width < 44) {
      small.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/)[0] : ''),
        w: Math.round(r.width), h: Math.round(r.height)
      });
    }
  });
  return {
    innerWidth: iw,
    docScrollWidth: de.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    pageOverflow: de.scrollWidth > iw + 1,
    offenders: offenders.slice(0, 12),
    smallTargets: small.slice(0, 12)
  };
};

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const report = { generatedAt: new Date().toISOString().slice(0, 10), widths: WIDTHS, pages: {} };

  for (const file of ['index.html', 'setup.html']) {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
    try { await page.goto(fileUrl(file), { waitUntil: 'load', timeout: 20000 }); }
    catch (e) { consoleErrors.push('goto: ' + e.message); }
    await new Promise(r => setTimeout(r, 400));

    const densities = file === 'index.html' ? DENSITIES : ['default'];
    const byDensity = {};
    for (const density of densities) {
      if (density !== 'default') {
        await page.evaluate(d => { const b = document.querySelector(`[data-density="${d}"]`); if (b) b.click(); }, density);
        await new Promise(r => setTimeout(r, 150));
      }
      for (const w of WIDTHS) {
        await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
        await new Promise(r => setTimeout(r, 160));
        byDensity[`${density}@${w}`] = await page.evaluate(MEASURE);
      }
      if (density !== 'default') { // reset to list after probing
        await page.evaluate(() => { const b = document.querySelector('[data-density="list"]'); if (b) b.click(); });
      }
    }
    // compare tray: pick the first two live rows, measure with the tray up
    if (file === 'index.html') {
      await page.setViewport({ width: 360, height: 900 });
      await page.evaluate(() => {
        const picks = document.querySelectorAll('[data-cmp-pick]');
        picks[0] && picks[0].click(); picks[1] && picks[1].click();
      });
      await new Promise(r => setTimeout(r, 200));
      byDensity['cmp-tray@360'] = await page.evaluate(MEASURE);
      await page.evaluate(() => document.querySelector('[data-cmp-open]')?.click());
      await new Promise(r => setTimeout(r, 200));
      byDensity['cmp-sheet@360'] = await page.evaluate(MEASURE);
    }
    report.pages[file] = { consoleErrors, measurements: byDensity };
    await page.close();
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));

  // ---- summary ----
  let fails = 0;
  for (const [file, data] of Object.entries(report.pages)) {
    const over = Object.entries(data.measurements).filter(([, m]) => m.pageOverflow);
    const small = Object.entries(data.measurements).filter(([, m]) => m.smallTargets.length);
    console.log(`\n=== ${file} — console errors: ${data.consoleErrors.length} ===`);
    data.consoleErrors.slice(0, 5).forEach(e => console.log('  ERR', e.slice(0, 120)));
    console.log(`  horizontal-overflow viewports: ${over.length}/${Object.keys(data.measurements).length}`);
    over.slice(0, 8).forEach(([k, m]) => {
      fails++;
      console.log(`   ${k}: doc=${m.docScrollWidth} > ${m.innerWidth}  offenders=${m.offenders.map(o => o.sel + '(r=' + o.right + ')').join(', ')}`);
    });
    console.log(`  viewports with a sub-44px target: ${small.length}`);
    small.slice(0, 8).forEach(([k, m]) => {
      console.log(`   ${k}: ${m.smallTargets.map(s => s.sel + '(' + s.w + 'x' + s.h + ')').join(', ')}`);
    });
  }
  console.log(`\nfindings JSON -> ${path.relative(ROOT, OUT)}`);
  console.log(fails ? `RESULT: ${fails} overflow viewport(s) need a fix` : 'RESULT: zero horizontal overflow everywhere');
})().catch(e => { console.error(e); process.exit(1); });
