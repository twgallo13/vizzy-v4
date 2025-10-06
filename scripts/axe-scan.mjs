import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function run() {
  const target = process.env.AXE_TARGET_URL || 'http://localhost:5000';
  const outPath = process.env.AXE_OUT || path.join(__dirname, '../axe-report.json');

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  try {
    await page.goto(target, { waitUntil: 'networkidle0' });

    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

    const violations = results.violations || [];
    console.log(`Axe scan complete. Violations: ${violations.length}`);
    if (violations.length > 0) {
      for (const v of violations) {
        console.log(`- [${v.impact || 'n/a'}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
      }
      // Exit non-zero so the job fails when issues are found
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Axe scan failed:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
}

run();
