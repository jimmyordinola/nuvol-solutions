// tools/check.mjs — verificación de index.html (estático + navegador).
// Uso: node tools/check.mjs <ruta index.html> <carpeta capturas> [--allow-placeholders]
// Playwright se toma de knet/e2e (PW_ROOT lo sobreescribe).
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [file, outDir, ...flags] = process.argv.slice(2);
if (!file || !outDir) {
  console.error('uso: node tools/check.mjs <index.html> <outDir> [--allow-placeholders]');
  process.exit(2);
}
const allowPlaceholders = flags.includes('--allow-placeholders');
const pwRoot = process.env.PW_ROOT || path.resolve(path.dirname(path.resolve(file)), '..', 'knet', 'e2e');
const require = createRequire(path.join(pwRoot, 'package.json'));
const { chromium } = require('playwright');

const html = readFileSync(file, 'utf8');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

// ---------- estático ----------
ok(/<html[^>]*\blang="es"/.test(html), 'html lang="es"');
ok(/<title>[^<]*Nuvol Solutions[^<]*<\/title>/.test(html), '<title> incluye "Nuvol Solutions"');
ok(/<meta name="description" content="[^"]{40,}"/.test(html), 'meta description (>= 40 chars)');
ok(/<meta name="viewport" content="width=device-width, initial-scale=1"/.test(html), 'meta viewport');
ok(/<meta name="theme-color" content="#1e3a5f"/.test(html), 'theme-color #1e3a5f');
ok(/<link rel="icon" href="data:image\/svg\+xml/.test(html), 'favicon SVG inline');
ok(!/estrella/i.test(html), 'no menciona al cliente');
ok(!/<script\b[^>]*\bsrc=/i.test(html), 'sin <script src>');
const externalLinks = [...html.matchAll(/<link[^>]+href="(https?:[^"]+)"/gi)].map(m => m[1]);
ok(externalLinks.every(u => /^https:\/\/fonts\.g(oogleapis|static)\.com(\/|$)/.test(u)),
  `solo Google Fonts como <link> externo: ${externalLinks.join(', ')}`);
for (const [re, label] of [
  [/contabilidad|contable/i, 'contabilidad'],
  [/planilla|rrhh/i, 'RRHH/planilla'],
  [/conciliaci/i, 'conciliación bancaria'],
  [/(integraci|conexi|emisi)[oó]n\s+(electr[oó]nica|con\s+sunat)/i, 'emisión/conexión SUNAT'],
  [/auditor[ií]a/i, 'auditoría'],
  [/\bReact\b/, 'React'],
  [/certificado digital|firma electr[oó]nica/i, 'firma electrónica con certificado'],
  [/app nativa|aplicaci[oó]n nativa/i, 'app nativa'],
  [/\d+\s*(usuarios|facturas|clientes)\b/i, 'cifras de negocio'],
]) ok(!re.test(html), `no afirma: ${label}`);
for (const id of ['inicio', 'servicios', 'producto', 'proceso', 'tecnologia', 'contacto']) {
  ok(new RegExp(`\\bid="${id}"`).test(html), `sección #${id}`);
}
if (!allowPlaceholders) ok(!/pendiente|\[correo\]|\[whatsapp\]/i.test(html), 'sin marcadores de contacto');

// ---------- navegador ----------
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const [w, h] of [[360, 740], [390, 844], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'load' });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= w, `sin scroll horizontal a ${w}px (scrollWidth=${sw})`);
  ok(errors.length === 0, `sin errores de consola a ${w}px: ${errors.join(' | ')}`);
  const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
  ok(hrefs.length > 0, `hay enlaces a ${w}px`);
  for (const href of hrefs) {
    ok(/^(#[a-z-]+|https?:\/\/|mailto:)/.test(href), `href válido: ${href}`);
    if (href.startsWith('#')) ok((await page.$(href)) !== null, `ancla existe: ${href}`);
  }
  if (!allowPlaceholders) {
    const was = hrefs.filter(x => x.startsWith('https://wa.me/'));
    ok(was.length >= 2, `al menos 2 enlaces wa.me a ${w}px (hay ${was.length}): ${was.join(', ')}`);
    ok(was.every(x => x === was[0]), `todos los wa.me son iguales a ${w}px: ${was.join(', ')}`);
    ok(was.every(wa => /^https:\/\/wa\.me\/[1-9]\d{8,14}(\?text=[^ ]*)?$/.test(wa)), `wa.me con número real a ${w}px: ${was.join(', ')}`);
    const mails = hrefs.filter(x => x.startsWith('mailto:'));
    ok(mails.length >= 2, `al menos 2 enlaces mailto a ${w}px (hay ${mails.length}): ${mails.join(', ')}`);
    ok(mails.every(x => x === mails[0]), `todos los mailto son iguales a ${w}px: ${mails.join(', ')}`);
    ok(mails.every(mail => /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}(\?subject=[^ ]*)?$/i.test(mail)), `mailto válido a ${w}px: ${mails.join(', ')}`);
  }
  const ext = await page.$$eval('a[href^="http"]', as => as.map(a => [a.getAttribute('target'), a.getAttribute('rel')]));
  ok(ext.every(([t, r]) => t === '_blank' && /noopener/.test(r || '')), `externos con target=_blank rel=noopener a ${w}px`);
  await page.screenshot({ path: path.join(outDir, `landing-${w}.png`), fullPage: true });
  await page.close();
}
await browser.close();

if (failures.length) {
  console.error('FALLA:\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log(`OK: ${failures.length} fallas; capturas en ${outDir}`);
