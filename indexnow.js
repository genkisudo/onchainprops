#!/usr/bin/env node
/**
 * @file indexnow.js
 * @description Tell IndexNow about URLs that just became live on GitHub Pages.
 *
 * Run only from .github/workflows/indexnow.yml, after a successful
 * github-pages deployment. Do not call this from build.js or from the
 * workflows that commit to main — those finish before Pages is serving
 * the new files.
 *
 * Submits sitemap URLs whose files changed between the previous Pages
 * deployment and this one. Daily payouts/balance refreshes therefore ping
 * the pages that actually changed, not every URL in the sitemap. The
 * sitemap URL itself is not submitted: a payouts run rewrites lastmod
 * dates, and submitting the sitemap would ask engines to recrawl the
 * whole site.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SITE = 'https://onchainprops.xyz';
const HOST = 'onchainprops.xyz';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

/** @param {string} xml @returns {Set<string>} */
const sitemapLocs = (xml) => new Set(
    [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
);

/**
 * @param {string} line one `git diff --name-status` line
 * @returns {{ file: string, deleted: boolean }[]}
 */
const filesFromNameStatus = (line) => {
    const parts = line.split('\t');
    const status = parts[0] ?? '';
    if (status.startsWith('R') || status.startsWith('C')) {
        return [
            { file: parts[1], deleted: true },
            { file: parts[2], deleted: false }
        ].filter((e) => e.file);
    }
    if (!parts[1]) return [];
    return [{ file: parts[1], deleted: status.startsWith('D') }];
};

/**
 * Canonical sitemap URL for a repo path, or null when the file is not an
 * indexable page (balance.json, payouts.json, sitemap.xml, the key file, …).
 * script.js is the homepage directory table, so a change there maps to `/`.
 * @param {string} file
 * @param {Set<string>} locs
 * @returns {string|null}
 */
const canonicalUrl = (file, locs) => {
    /** @type {string[]} */
    const candidates = [];
    if (file === 'index.html' || file === 'script.js') candidates.push(`${SITE}/`);
    if (file.endsWith('.html')) {
        candidates.push(`${SITE}/${file.slice(0, -'.html'.length)}`);
        candidates.push(`${SITE}/${file}`);
    } else {
        candidates.push(`${SITE}/${file}`);
    }
    return candidates.find((u) => locs.has(u)) ?? null;
};

/**
 * URL whose body should be compared to `file`. The homepage canonical is
 * index.html; a script.js-only change must be checked at /script.js or the
 * unchanged homepage HTML would look live immediately.
 * @param {string} file
 * @param {string} canonical
 */
const probeUrl = (file, canonical) => (file === 'script.js' ? `${SITE}/script.js` : canonical);

/**
 * @param {string[]} nameStatusLines
 * @param {string} oldSitemap
 * @param {string} newSitemap
 * @returns {{ urls: string[], probes: { url: string, file: string, deleted: boolean }[] }}
 */
const planChanges = (nameStatusLines, oldSitemap, newSitemap) => {
    const locs = sitemapLocs(`${oldSitemap}\n${newSitemap}`);
    /** @type {Set<string>} */
    const urls = new Set();
    /** @type {{ url: string, file: string, deleted: boolean }[]} */
    const probes = [];
    const seen = new Set();
    for (const line of nameStatusLines) {
        if (!line.trim()) continue;
        for (const entry of filesFromNameStatus(line)) {
            const canonical = canonicalUrl(entry.file, locs);
            if (!canonical) continue;
            const key = `${entry.deleted ? 'D' : 'M'}\t${entry.file}`;
            if (seen.has(key)) continue;
            seen.add(key);
            urls.add(canonical);
            probes.push({ url: probeUrl(entry.file, canonical), file: entry.file, deleted: entry.deleted });
        }
    }
    return { urls: [...urls].sort(), probes };
};

/**
 * @param {{ key: string, urlList: string[], fetchImpl?: typeof fetch }} opts
 * @returns {Promise<number>}
 */
const submitIndexNow = async ({ key, urlList, fetchImpl = fetch }) => {
    if (!urlList.length) throw new Error('Refusing to call IndexNow with an empty url list');
    const res = await fetchImpl(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
            host: HOST,
            key,
            keyLocation: `${SITE}/${key}.txt`,
            urlList
        })
    });
    console.log(`IndexNow HTTP ${res.status}`);
    if (res.status !== 200 && res.status !== 202) {
        const detail = typeof res.text === 'function' ? (await res.text()).slice(0, 500) : '';
        throw new Error(`IndexNow rejected the submission (HTTP ${res.status})${detail ? `: ${detail}` : ''}`);
    }
    return res.status;
};

/**
 * Poll the live host until the key file and each changed URL match this
 * deploy. GitHub Pages caches responses for up to 10 minutes, so this waits
 * longer than that before giving up. Nothing is posted if the wait times out.
 * @param {object} opts
 */
const waitUntilLive = async ({
    key,
    probes,
    fetchImpl = fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = Date.now,
    timeoutMs = 12 * 60 * 1000,
    intervalMs = 15000,
    log = console.log
}) => {
    const keyUrl = `${SITE}/${key}.txt`;
    const deadline = now() + timeoutMs;
    const headers = { 'Cache-Control': 'no-cache', Pragma: 'no-cache' };
    let attempt = 0;
    while (true) {
        attempt += 1;
        /** @type {string[]} */
        const problems = [];
        const check = async (url) => {
            const res = await fetchImpl(url, { headers, signal: AbortSignal.timeout(20000) });
            const body = typeof res.text === 'function' ? await res.text() : '';
            return { status: res.status, body };
        };
        try {
            const keyRes = await check(keyUrl);
            if (keyRes.status !== 200 || (keyRes.body !== key && keyRes.body !== `${key}\n`)) {
                problems.push(`key HTTP ${keyRes.status}`);
            }
        } catch (err) {
            problems.push(`key fetch failed: ${err.message}`);
        }
        for (const probe of probes) {
            try {
                const res = await check(probe.url);
                if (probe.deleted) {
                    if (res.status === 200 && probe.oldBody != null && res.body === probe.oldBody) {
                        problems.push(`${probe.url} still serving the removed document`);
                    } else if (res.status === 200 && probe.oldBody == null) {
                        problems.push(`${probe.url} still HTTP 200`);
                    }
                } else if (res.status !== 200 || res.body !== probe.expect) {
                    problems.push(`${probe.url} not live yet (HTTP ${res.status})`);
                }
            } catch (err) {
                problems.push(`${probe.url} fetch failed: ${err.message}`);
            }
        }
        if (!problems.length) {
            log(`Live check passed on attempt ${attempt} (${keyUrl}).`);
            return;
        }
        log(`Waiting until the Pages deploy is live (attempt ${attempt}): ${problems.join('; ')}`);
        if (now() >= deadline) {
            throw new Error(`Timed out waiting for the GitHub Pages deploy to be live: ${problems.join('; ')}`);
        }
        await sleep(intervalMs);
    }
};

/** @param {string[]} args @returns {string} */
const git = (args) => execFileSync('git', args, { encoding: 'utf8' });

/** @param {string} rev @param {string} file @returns {string|null} */
const gitShow = (rev, file) => {
    try {
        return git(['show', `${rev}:${file}`]);
    } catch {
        return null;
    }
};

/**
 * Previous successful github-pages deployment, so a push of several commits
 * that Pages built only at the tip still includes every commit in the range.
 * Falls back to the first parent when the deployment list doesn't contain
 * this SHA.
 * @param {string} current
 * @param {typeof fetch} fetchImpl
 */
const previousDeploySha = async (current, fetchImpl = fetch) => {
    const repo = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    if (repo && token) {
        try {
            const res = await fetchImpl(`https://api.github.com/repos/${repo}/deployments?environment=github-pages&per_page=100`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'User-Agent': 'onchainprops-indexnow'
                }
            });
            if (!res.ok) {
                console.log(`Deployments API HTTP ${res.status}; using the parent commit.`);
            } else {
                const deployments = await res.json();
                /** @type {string[]} */
                const shas = [];
                for (const deployment of deployments) {
                    if (deployment?.sha && !shas.includes(deployment.sha)) shas.push(deployment.sha);
                }
                const idx = shas.indexOf(current);
                if (idx >= 0 && shas[idx + 1]) return shas[idx + 1];
                console.log('No older github-pages deployment found; using the parent commit.');
            }
        } catch (err) {
            console.log(`Deployments API failed (${err.message}); using the parent commit.`);
        }
    }
    return `${current}^`;
};

/** @param {string} from @param {string} to */
const loadProbes = (from, to, probes) => probes.map((probe) => {
    const current = gitShow(to, probe.file);
    if (!probe.deleted && current != null) return { ...probe, expect: current };
    return { ...probe, deleted: true, oldBody: gitShow(from, probe.file), expect: null };
});

const readKey = () => {
    const key = fs.readFileSync(path.join(__dirname, '_indexnow', 'key.txt'), 'utf8').trim();
    if (!KEY_RE.test(key)) throw new Error('IndexNow key in _indexnow/key.txt is invalid');
    return key;
};

const main = async () => {
    const to = process.env.DEPLOY_SHA;
    if (!to) throw new Error('DEPLOY_SHA is not set');
    const from = await previousDeploySha(to);
    console.log(`IndexNow diff ${from}..${to}`);
    const nameStatus = git(['diff', '--name-status', from, to]).split('\n').filter(Boolean);
    const plan = planChanges(nameStatus, gitShow(from, 'sitemap.xml') ?? '', gitShow(to, 'sitemap.xml') ?? '');
    if (!plan.urls.length) {
        console.log('No indexable URLs changed; not calling IndexNow.');
        return;
    }
    const key = readKey();
    console.log(`Submitting ${plan.urls.length} URL(s) to IndexNow after they are live:`);
    for (const url of plan.urls) console.log(`  ${url}`);
    await waitUntilLive({ key, probes: loadProbes(from, to, plan.probes) });
    for (let i = 0; i < plan.urls.length; i += 10000) {
        await submitIndexNow({ key, urlList: plan.urls.slice(i, i + 10000) });
    }
};

module.exports = {
    SITE,
    HOST,
    INDEXNOW_ENDPOINT,
    sitemapLocs,
    canonicalUrl,
    planChanges,
    submitIndexNow,
    waitUntilLive,
    previousDeploySha
};

if (require.main === module) {
    main().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}
