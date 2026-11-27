/**
 * @file build.test.js
 * Runs build.js on a temporary copy of the site and checks the result:
 * committed output is current, the build is idempotent, GEN markers pair up,
 * JSON-LD parses, internal links resolve, affiliate links carry
 * rel="sponsored", and every firm in firms.json reaches the generated files.
 * No network calls, no dependencies. Run with `node --test`.
 */
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const SITE = 'https://onchainprops.xyz';
const SKIP_DIRS = new Set(['.git', 'node_modules']);
// Files build.js reads or writes, compared before and after a build.
const OUTPUT_EXT = /\.(html|js|txt|xml|json)$/;

let tmp;

/** Every file under `dir` (relative paths, sorted), skipping SKIP_DIRS. */
const walk = (dir, rel = '') => fs.readdirSync(path.join(dir, rel), { withFileTypes: true })
    .flatMap((e) => {
        const p = path.join(rel, e.name);
        if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(dir, p);
        return [p];
    })
    .sort();

/** { relativePath: contents } for every output-type file under `dir`. */
const snapshot = (dir) => Object.fromEntries(
    walk(dir).filter((f) => OUTPUT_EXT.test(f)).map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')])
);

const runBuild = (dir) => execFileSync(process.execPath, ['build.js'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });

/** Files that differ between two snapshots, including added and removed ones. */
const changedFiles = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((f) => a[f] !== b[f])
    .sort();

const htmlFiles = () => walk(tmp).filter((f) => f.endsWith('.html'));
const readTmp = (f) => fs.readFileSync(path.join(tmp, f), 'utf8');

const decodeEntities = (s) => s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** All <a> tags in an HTML string, with decoded href/rel/target. */
const anchors = (html) => [...html.matchAll(/<a\s[^>]*>/gi)].map(([tag]) => {
    const attr = (name) => {
        const m = new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
        return m ? decodeEntities(m[1]) : null;
    };
    return { tag, href: attr('href'), rel: (attr('rel') ?? '').split(/\s+/).filter(Boolean), target: attr('target') };
});

const firmsData = () => JSON.parse(readTmp('firms.json'));
const allFirms = () => {
    const d = firmsData();
    return [...d.propFirms, ...d.predictionMarketFirms, ...d.cryptoPropFirms];
};
// Same rule as firmSlug() in build.js.
const firmSlug = (f) => f.name.toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '');

before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'onchainprops-build-'));
    fs.cpSync(ROOT, tmp, { recursive: true, filter: (src) => !SKIP_DIRS.has(path.basename(src)) });
});

after(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

test('committed generated files match a fresh build', () => {
    const before = snapshot(tmp);
    runBuild(tmp);
    const stale = changedFiles(before, snapshot(tmp));
    assert.deepEqual(stale, [],
        `These files are out of date with firms.json / faq.json / posts. Run \`node build.js\` and commit:\n  ${stale.join('\n  ')}`);
});

test('build is idempotent', () => {
    const first = snapshot(tmp);
    runBuild(tmp);
    const changed = changedFiles(first, snapshot(tmp));
    assert.deepEqual(changed, [], `A second build changed:\n  ${changed.join('\n  ')}`);
});

test('GEN markers are paired, unique and not nested', () => {
    const files = [...htmlFiles(), 'script.js'];
    const problems = [];
    for (const f of files) {
        const text = readTmp(f);
        const markers = [...text.matchAll(/(?:<!--|\/\/)\s*GEN:(BEGIN|END)\s+([a-z0-9-]+)/g)];
        const seen = new Set();
        let open = null;
        for (const [, kind, key] of markers) {
            if (kind === 'BEGIN') {
                if (open) problems.push(`${f}: ${key} begins inside ${open}`);
                if (seen.has(key)) problems.push(`${f}: ${key} appears twice`);
                seen.add(key);
                open = key;
            } else {
                if (open !== key) problems.push(`${f}: END ${key} without matching BEGIN (open: ${open ?? 'none'})`);
                open = null;
            }
        }
        if (open) problems.push(`${f}: ${open} is never closed`);
    }
    assert.deepEqual(problems, []);
});

test('every JSON-LD block parses', () => {
    const problems = [];
    for (const f of htmlFiles()) {
        const blocks = readTmp(f).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
        for (const [, json] of blocks) {
            try {
                JSON.parse(json);
            } catch (err) {
                problems.push(`${f}: ${err.message}`);
            }
        }
    }
    assert.deepEqual(problems, []);
});

/**
 * Resolves a site URL to a file the way GitHub Pages serves it:
 * exact file, then "<path>.html", then "<path>/index.html".
 */
const resolvesToFile = (urlPath) => {
    const p = decodeURIComponent(urlPath).replace(/^\/+/, '');
    const candidates = p === '' || p.endsWith('/')
        ? [path.join(p, 'index.html')]
        : [p, `${p}.html`, path.join(p, 'index.html')];
    return candidates.some((c) => fs.existsSync(path.join(tmp, c)) && fs.statSync(path.join(tmp, c)).isFile());
};

test('internal links and site URLs point to files that exist', () => {
    const broken = [];
    for (const f of htmlFiles()) {
        const html = readTmp(f);
        const pageUrl = new URL(f.split(path.sep).join('/'), `${SITE}/`);
        const refs = [...html.matchAll(/\s(?:href|src)\s*=\s*"([^"]*)"/gi)].map((m) => decodeEntities(m[1]));
        for (const ref of refs) {
            if (!ref || ref.startsWith('#') || /^(mailto|tel|data|javascript):/i.test(ref) || ref.includes('${')) continue;
            let url;
            try { url = new URL(ref, pageUrl); } catch { continue; }
            if (url.origin !== SITE) continue;
            if (!resolvesToFile(url.pathname)) broken.push(`${f}: ${ref}`);
        }
    }
    assert.deepEqual(broken, []);
});

test('sitemap URLs point to files that exist', () => {
    const locs = [...readTmp('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.ok(locs.length > 0, 'sitemap.xml has no <loc> entries');
    const missing = locs.filter((loc) => !loc.startsWith(SITE) || !resolvesToFile(new URL(loc).pathname));
    assert.deepEqual(missing, []);
});

test('affiliate links carry rel="sponsored"; new-tab links carry noopener', () => {
    const affiliateUrls = new Set(allFirms().filter((f) => f.isAffiliate).map((f) => f.website));
    const problems = [];
    for (const f of htmlFiles()) {
        for (const a of anchors(readTmp(f))) {
            if (a.href && affiliateUrls.has(a.href) && !a.rel.includes('sponsored')) {
                problems.push(`${f}: affiliate link without rel="sponsored": ${a.href}`);
            }
            if (a.target === '_blank' && !a.rel.includes('noopener') && !a.rel.includes('noreferrer')) {
                problems.push(`${f}: target="_blank" without rel="noopener": ${a.href}`);
            }
        }
    }
    assert.deepEqual(problems, []);
});

test('every firm in firms.json reaches the generated files', () => {
    const script = readTmp('script.js');
    const llms = readTmp('llms.txt');
    const index = readTmp('index.html');
    const sitemap = readTmp('sitemap.xml');
    const problems = [];
    for (const f of allFirms()) {
        const nameJson = JSON.stringify(f.name);
        const page = `firms/${firmSlug(f)}.html`;
        if (!fs.existsSync(path.join(tmp, page))) {
            if (!f.hidden) problems.push(`${f.name}: no detail page at ${page}`);
            continue;
        }
        if (!readTmp(page).includes('<!-- GEN:BEGIN firm-stats -->')) problems.push(`${f.name}: ${page} has no firm-stats block`);
        if (f.hidden) continue;
        if (!script.includes(`name: ${nameJson}`)) problems.push(`${f.name}: missing from script.js AppState`);
        if (!llms.includes(f.name)) problems.push(`${f.name}: missing from llms.txt`);
        if (!index.includes(f.name)) problems.push(`${f.name}: missing from index.html`);
        if (!sitemap.includes(`${SITE}/firms/${firmSlug(f)}`)) problems.push(`${f.name}: firm page missing from sitemap.xml`);
    }
    for (const page of fs.readdirSync(path.join(tmp, 'firms')).filter((p) => p.endsWith('.html'))) {
        if (!allFirms().some((f) => `${firmSlug(f)}.html` === page)) problems.push(`firms/${page}: no matching firm in firms.json`);
    }
    assert.deepEqual(problems, []);
});
