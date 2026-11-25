/**
 * @file indexnow.test.js
 * URL selection and IndexNow response handling. No network calls.
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { execFileSync } = require('child_process');
const {
    SITE,
    INDEXNOW_ENDPOINT,
    planChanges,
    submitIndexNow,
    waitUntilLive,
    previousDeploySha
} = require('./indexnow');

const show = (rev, file) => {
    try {
        return execFileSync('git', ['show', `${rev}:${file}`], { encoding: 'utf8' });
    } catch {
        return '';
    }
};

const diffLines = (from, to) => execFileSync('git', ['diff', '--name-status', from, to], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

const planRange = (from, to) => planChanges(diffLines(from, to), show(from, 'sitemap.xml'), show(to, 'sitemap.xml'));

test('published key file is exactly the source key', () => {
    const key = fs.readFileSync('_indexnow/key.txt', 'utf8').trim();
    assert.match(key, /^[A-Za-z0-9-]{8,128}$/);
    assert.equal(fs.readFileSync(`${key}.txt`, 'utf8'), key);
});

test('balance.json-only deploy submits nothing', () => {
    const plan = planRange('09879b476ff05ba0172f89b22a5a1b7c2b243c2f^', '09879b476ff05ba0172f89b22a5a1b7c2b243c2f');
    assert.deepEqual(plan.urls, []);
});

test('payouts refresh submits the changed pages, not the sitemap', () => {
    const to = '4da3af4da30782fcda38e72cf14955ff5c4ada10';
    const plan = planRange(`${to}^`, to);
    const locs = [...show(to, 'sitemap.xml').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(plan.urls, [
        `${SITE}/`,
        `${SITE}/firms/propr`
    ]);
    assert.ok(plan.urls.length < locs.length);
    assert.equal(plan.urls.includes(`${SITE}/sitemap.xml`), false);
    assert.equal(plan.urls.includes(`${SITE}/firms/hypernova`), false);
    for (const url of plan.urls) assert.ok(locs.includes(url));
});

test('a content commit does not expand to every firm page', () => {
    const to = '9991ef3';
    const plan = planRange(`${to}^`, to);
    assert.ok(plan.urls.includes(`${SITE}/`));
    assert.ok(plan.urls.includes(`${SITE}/blog.html`));
    assert.ok(plan.urls.includes(`${SITE}/blog/what-is-hyperliquid`));
    assert.ok(plan.urls.includes(`${SITE}/llms.txt`));
    assert.ok(plan.urls.includes(`${SITE}/llms-full.txt`));
    assert.equal(plan.urls.includes(`${SITE}/firms/propr`), false);
    assert.equal(plan.urls.includes(`${SITE}/compare.html`), false);
    assert.equal(plan.urls.includes(`${SITE}/sitemap.xml`), false);
});

test('script.js maps to the homepage but is probed at /script.js', () => {
    const sitemap = `<loc>${SITE}/</loc><loc>${SITE}/firms/propr</loc>`;
    const plan = planChanges(['M\tscript.js'], sitemap, sitemap);
    assert.deepEqual(plan.urls, [`${SITE}/`]);
    assert.deepEqual(plan.probes, [{ url: `${SITE}/script.js`, file: 'script.js', deleted: false }]);
});

test('sitemap.xml and payouts.json are not submitted on their own', () => {
    const sitemap = `<loc>${SITE}/</loc>`;
    const plan = planChanges(['M\tsitemap.xml', 'M\tpayouts.json', 'M\tbalance.json'], sitemap, sitemap);
    assert.deepEqual(plan.urls, []);
});

test('a removed page is still submitted from the old sitemap', () => {
    const oldSitemap = `<loc>${SITE}/firms/gone</loc>`;
    const plan = planChanges(['D\tfirms/gone.html'], oldSitemap, '<urlset></urlset>');
    assert.deepEqual(plan.urls, [`${SITE}/firms/gone`]);
    assert.equal(plan.probes[0].deleted, true);
});

test('submitIndexNow logs 200 and 202 and sends the public key location', async () => {
    /** @type {string[]} */
    const logs = [];
    const original = console.log;
    console.log = (message) => logs.push(String(message));
    /** @type {object[]} */
    const bodies = [];
    const fetchImpl = async (url, opts) => {
        assert.equal(url, INDEXNOW_ENDPOINT);
        assert.equal(opts.method, 'POST');
        bodies.push(JSON.parse(opts.body));
        const status = bodies.length === 1 ? 200 : 202;
        return { status, text: async () => '' };
    };
    try {
        assert.equal(await submitIndexNow({ key: 'abc-123', urlList: [`${SITE}/firms/propr`], fetchImpl }), 200);
        assert.equal(await submitIndexNow({ key: 'abc-123', urlList: [`${SITE}/`], fetchImpl }), 202);
    } finally {
        console.log = original;
    }
    assert.deepEqual(logs, ['IndexNow HTTP 200', 'IndexNow HTTP 202']);
    assert.equal(bodies[0].host, 'onchainprops.xyz');
    assert.equal(bodies[0].key, 'abc-123');
    assert.equal(bodies[0].keyLocation, `${SITE}/abc-123.txt`);
    assert.deepEqual(bodies[0].urlList, [`${SITE}/firms/propr`]);
    assert.equal(Object.hasOwn(bodies[0], 'secret'), false);
});

test('submitIndexNow fails on any status other than 200 or 202', async () => {
    const original = console.log;
    /** @type {string[]} */
    const logs = [];
    console.log = (message) => logs.push(String(message));
    try {
        await assert.rejects(
            () => submitIndexNow({
                key: 'abc-123',
                urlList: [`${SITE}/`],
                fetchImpl: async () => ({ status: 403, text: async () => 'key not found' })
            }),
            /HTTP 403/
        );
    } finally {
        console.log = original;
    }
    assert.deepEqual(logs, ['IndexNow HTTP 403']);
});

test('waitUntilLive retries until the key and the changed URL match', async () => {
    let calls = 0;
    const fetchImpl = async (url) => {
        calls += 1;
        if (calls < 3) return { status: 404, text: async () => 'missing' };
        if (url.endsWith('/key.txt')) return { status: 200, text: async () => 'key' };
        return { status: 200, text: async () => 'new-html' };
    };
    let slept = 0;
    await waitUntilLive({
        key: 'key',
        probes: [{ url: `${SITE}/firms/propr`, file: 'firms/propr.html', deleted: false, expect: 'new-html' }],
        fetchImpl,
        sleep: async () => { slept += 1; },
        now: () => 0,
        timeoutMs: 5000,
        intervalMs: 1
    });
    assert.equal(slept, 1);
});

test('waitUntilLive does not treat a stale page as live and times out', async () => {
    await assert.rejects(
        () => waitUntilLive({
            key: 'key',
            probes: [{ url: `${SITE}/`, file: 'index.html', deleted: false, expect: 'new' }],
            fetchImpl: async () => ({ status: 200, text: async () => 'old' }),
            sleep: async () => {},
            now: () => 0,
            timeoutMs: 0,
            intervalMs: 1
        }),
        /Timed out/
    );
});

test('previousDeploySha uses the deployment before this SHA', async () => {
    const previousRepo = process.env.GITHUB_REPOSITORY;
    const previousToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_REPOSITORY = 'genkisudo/onchainprops';
    process.env.GITHUB_TOKEN = 'test-token';
    try {
        const sha = await previousDeploySha('bbb', async () => ({
            ok: true,
            json: async () => [{ sha: 'ccc' }, { sha: 'bbb' }, { sha: 'aaa' }, { sha: 'bbb' }]
        }));
        assert.equal(sha, 'aaa');
    } finally {
        if (previousRepo == null) delete process.env.GITHUB_REPOSITORY;
        else process.env.GITHUB_REPOSITORY = previousRepo;
        if (previousToken == null) delete process.env.GITHUB_TOKEN;
        else process.env.GITHUB_TOKEN = previousToken;
    }
});

test('previousDeploySha falls back to the parent when the SHA is absent', async () => {
    const previous = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    process.env.GITHUB_REPOSITORY = 'genkisudo/onchainprops';
    process.env.GITHUB_TOKEN = 'test-token';
    try {
        const sha = await previousDeploySha('missing', async () => ({
            ok: true,
            json: async () => [{ sha: 'newer' }]
        }));
        assert.equal(sha, 'missing^');
    } finally {
        if (previous == null) delete process.env.GITHUB_REPOSITORY;
        else process.env.GITHUB_REPOSITORY = previous;
        if (token == null) delete process.env.GITHUB_TOKEN;
        else process.env.GITHUB_TOKEN = token;
    }
});
