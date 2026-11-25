#!/usr/bin/env node
/**
 * @file buyback.js
 * @description Fetches Vanta Network's public buyback-wallet endpoint and writes
 * buyback.json. build.js renders those figures on firms/vanta-trading.html.
 * Zero dependencies (Node 18+ global fetch).
 *
 *   node buyback.js
 *
 * The endpoint sends no Access-Control-Allow-Origin header, so a browser on
 * onchainprops.xyz cannot read it. A daily GitHub Action
 * (.github/workflows/buyback.yml) fetches it here instead. Visitors only see
 * the generated HTML.
 *
 * Only the fields the page shows are stored. The events and buckets arrays
 * are dropped.
 *
 * If the API is down or the response shape changes, buyback.json is left
 * untouched (last good data) and the script exits 0. build.js hides the
 * section when the file is missing or no longer valid.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const URL = 'https://www.vantanetwork.io/api/tokenomics/buyback-wallet';
const OUT = path.join(__dirname, 'buyback.json');
/** Bittensor SS58 account id, as published by the buyback endpoint. */
const SS58 = /^5[1-9A-HJ-NP-Za-km-z]{46,49}$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Non-negative finite number. */
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/**
 * buyback.json is valid when it holds exactly the fields the page renders.
 * @param {object} d
 * @returns {boolean}
 */
const isValidBuyback = (d) => Boolean(
    d && typeof d === 'object' &&
    typeof d.wallet === 'string' && SS58.test(d.wallet) &&
    typeof d.updatedAt === 'string' && !Number.isNaN(Date.parse(d.updatedAt)) &&
    isNum(d.taoSpent) &&
    isNum(d.alphaBought) &&
    isNum(d.buybackValueUsd) &&
    isNum(d.balanceTao) &&
    isNum(d.balanceUsd)
);

/** Round a non-negative finite number to `digits` decimal places. */
const round = (n, digits) => {
    if (!isNum(n)) throw new Error(`expected a non-negative number, got ${JSON.stringify(n)}`);
    return Number(n.toFixed(digits));
};

/** Read one numeric field, accepting a number or a numeric string. */
const pickNum = (obj, key) => {
    const v = obj?.[key];
    const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
    if (!isNum(n)) throw new Error(`missing or invalid ${key}`);
    return n;
};

/**
 * Keep only the figures the firm page shows.
 * @param {object} raw - parsed buyback-wallet response
 * @returns {object} buyback.json payload
 */
const select = (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('response is not an object');
    if (typeof raw.wallet !== 'string' || !SS58.test(raw.wallet)) throw new Error('wallet is missing or not an SS58 address');
    if (typeof raw.last_updated !== 'string' || Number.isNaN(Date.parse(raw.last_updated))) {
        throw new Error('last_updated is missing');
    }
    if (!raw.current || typeof raw.current !== 'object' || Array.isArray(raw.current)) throw new Error('current is missing');
    if (!raw.lifetime || typeof raw.lifetime !== 'object' || Array.isArray(raw.lifetime)) throw new Error('lifetime is missing');
    const out = {
        wallet: raw.wallet,
        updatedAt: new Date(raw.last_updated).toISOString(),
        taoSpent: round(pickNum(raw.lifetime, 'tao_spent_on_buybacks'), 4),
        alphaBought: round(pickNum(raw.lifetime, 'alpha_bought'), 4),
        buybackValueUsd: round(pickNum(raw.lifetime, 'buyback_value_usd'), 2),
        balanceTao: round(pickNum(raw.current, 'total_value_tao'), 4),
        balanceUsd: round(pickNum(raw.current, 'total_value_usd'), 2)
    };
    if (!isValidBuyback(out)) throw new Error('selected payload failed validation');
    return out;
};

/** GET the buyback endpoint, retrying timeouts and 429/5xx. */
const fetchJson = async () => {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        try {
            const res = await fetch(URL, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
            if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            lastErr = e.name === 'AbortError' ? new Error('timed out') : e;
            if (/HTTP 4(?!29)/.test(lastErr.message)) break;
            await sleep(1000 * attempt);
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastErr;
};

const main = async () => {
    let raw;
    try {
        raw = await fetchJson();
    } catch (e) {
        console.error(`buyback.js: fetch failed (${e.message}). Keeping the existing buyback.json.`);
        return;
    }
    let out;
    try {
        out = select(raw);
    } catch (e) {
        console.error(`buyback.js: unexpected response (${e.message}). Keeping the existing buyback.json.`);
        return;
    }
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    console.log(`buyback.json: ${out.taoSpent} TAO spent, ${out.alphaBought} alpha bought, $${out.buybackValueUsd} (wallet ${out.balanceTao} TAO)`);
};

if (require.main === module) {
    main().catch((e) => { console.error(`buyback.js failed: ${e.message}`); process.exit(1); });
}

module.exports = { select, isValidBuyback };
