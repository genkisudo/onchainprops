#!/usr/bin/env node
/**
 * @file balance.js
 * @description Fetches the Vanta Trading reserve wallet's Bittensor holdings from the
 * Taostats API and writes balance.json (shown on firms/vanta-trading.html). Zero
 * dependencies (Node 18+ global fetch).
 *
 *   TAOSTATS_API_KEY=... node balance.js
 *
 * A daily GitHub Action (.github/workflows/balance.yml) runs this. The key never
 * reaches the browser: visitors only read the generated balance.json.
 *
 * Calculation (all RAO math in BigInt, no floats):
 *   liquid TAO        = account.balance_free
 *   reserved TAO      = account.balance_reserved
 *   alpha position    = alpha_balance_rao * subnet_alpha_price_TAO        (priced in TAO,
 *                       balances from /accounts/{addr}, prices from /subnets/pools)
 *   total TAO         = liquid + reserved + sum(alpha positions in TAO)
 *   total USD         = total TAO * TAO_USD
 * Staked TAO is counted once, from the alpha positions. account.balance_staked is
 * used only to cross-check them, never added on top (no double counting).
 * If the cross-check fails the script exits non-zero and balance.json is left as is.
 * (/alpha/portfolio would be simpler but needs a paid Taostats plan.)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ADDRESS = '5EBzTWPQxHR1f4fYMTvz1ohtworfFJvYgd5YXZofiQrEmuYn';
const API = 'https://api.taostats.io/v1';
const OUT = path.join(__dirname, 'balance.json');
const RAO = 1_000_000_000n;
const PRICE_SCALE = 18; // decimal places kept when parsing price strings
const TOLERANCE_PCT = 1n; // allowed gap between alpha positions sum and account.balance_staked

/** Parse a non-negative decimal string ("1.2345") or integer string into BigInt scaled by 10^scale. */
const toScaled = (value, scale) => {
    const s = String(value ?? '').trim();
    if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`Not a decimal number: ${JSON.stringify(value)}`);
    const [int, frac = ''] = s.split('.');
    return BigInt(int + frac.padEnd(scale, '0').slice(0, scale));
};

/** Parse an integer RAO string. */
const toRao = (value) => {
    const s = String(value ?? '').trim();
    if (!/^\d+$/.test(s)) throw new Error(`Not an integer RAO amount: ${JSON.stringify(value)}`);
    return BigInt(s);
};

/** Format BigInt `n` (scaled by 10^scale) as a fixed-decimals string, rounding half up. */
const fmt = (n, scale, decimals) => {
    const drop = BigInt(scale - decimals);
    const unit = 10n ** drop;
    const rounded = (n + unit / 2n) / unit;
    const s = rounded.toString().padStart(decimals + 1, '0');
    return decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}` : s;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET from Taostats with retries on 429/5xx. */
const get = async (route, params = {}) => {
    const key = process.env.TAOSTATS_API_KEY;
    const url = `${API}${route}${Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`;
    let lastErr;
    for (let attempt = 1; attempt <= 5; attempt++) {
        await sleep(1200); // Taostats plans have tight per-minute limits: space every call
        try {
            const res = await fetch(url, { headers: { Authorization: key, Accept: 'application/json' } });
            if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
            return await res.json();
        } catch (e) {
            lastErr = e;
            if (/HTTP 4(?!29)/.test(e.message)) break; // other 4xx will not heal on retry
            await sleep(10000 * attempt);
        }
    }
    throw new Error(`${route}: ${lastErr.message}`);
};

/**
 * Turn raw API responses into the balance.json payload. Pure, so it can be unit-tested.
 * @param {object} account  data[0] of /accounts/{address}
 * @param {object[]} positions  account.alpha_balances
 * @param {Map<number,string>} prices  netuid -> alpha price in TAO (decimal string)
 * @param {{price: string, timestamp: string}} tao  data[0] of /price/simple
 */
const compute = (account, positions, prices, tao) => {
    const taoUsd = toScaled(tao.price, PRICE_SCALE);
    if (taoUsd <= 0n) throw new Error('TAO price is zero');

    const liquid = toRao(account.balance_free);
    const reserved = toRao(account.balance_reserved);

    const rows = [];
    let alphaTao = 0n;
    for (const p of positions) {
        const alpha = toRao(p.balance);
        if (alpha === 0n) continue;
        const priceTao = toScaled(prices.get(p.netuid), PRICE_SCALE);
        const taoRao = (alpha * priceTao) / 10n ** BigInt(PRICE_SCALE); // alpha * TAO-per-alpha
        alphaTao += taoRao;
        rows.push({
            netuid: p.netuid,
            hotkey: p.hotkey,
            alpha: fmt(alpha, 9, 4),
            priceTao: fmt(priceTao, PRICE_SCALE, 6),
            tao: fmt(taoRao, 9, 4),
            usd: fmt((taoRao * taoUsd) / 10n ** BigInt(PRICE_SCALE), 9, 2),
            _taoRao: taoRao
        });
    }
    rows.sort((a, b) => (b._taoRao > a._taoRao ? 1 : b._taoRao < a._taoRao ? -1 : 0));
    rows.forEach((r) => delete r._taoRao);

    // Cross-check: staked TAO per the account must match the positions we priced.
    const staked = toRao(account.balance_staked);
    const gap = alphaTao > staked ? alphaTao - staked : staked - alphaTao;
    if (gap * 100n > staked * TOLERANCE_PCT && gap > RAO / 100n) {
        throw new Error(
            `Staked mismatch: positions ${fmt(alphaTao, 9, 4)} TAO vs account.balance_staked ${fmt(staked, 9, 4)} TAO`
        );
    }

    const totalTao = liquid + reserved + alphaTao;
    const usd = (rao) => fmt((rao * taoUsd) / 10n ** BigInt(PRICE_SCALE), 9, 2);
    return {
        address: ADDRESS,
        updatedAt: new Date().toISOString(),
        block: account.block_number,
        taoUsd: fmt(taoUsd, PRICE_SCALE, 2),
        taoUsdAt: tao.timestamp,
        liquidTao: fmt(liquid, 9, 4),
        liquidUsd: usd(liquid),
        reservedTao: fmt(reserved, 9, 4),
        stakedAlphaTao: fmt(alphaTao, 9, 4),
        stakedAlphaUsd: usd(alphaTao),
        totalTao: fmt(totalTao, 9, 4),
        totalUsd: usd(totalTao),
        positions: rows
    };
};

const main = async () => {
    if (!process.env.TAOSTATS_API_KEY) {
        console.error('TAOSTATS_API_KEY is not set.');
        process.exit(1);
    }
    const acct = await get(`/accounts/${ADDRESS}`);
    const price = await get('/price/simple');
    const account = acct?.data?.[0];
    const tao = price?.data?.[0];
    if (!account || !tao) throw new Error('Unexpected Taostats response shape');
    if (!Array.isArray(account.alpha_balances)) throw new Error('alpha_balances unavailable (live chain read failed)');
    // Alpha price in TAO per subnet; netuid 0 (root) is TAO itself.
    const prices = new Map([[0, '1']]);
    for (const netuid of new Set(account.alpha_balances.map((p) => p.netuid))) {
        if (prices.has(netuid)) continue;
        const pool = (await get('/subnets/pools', { netuid: String(netuid) }))?.data?.[0];
        if (!pool?.price) throw new Error(`No pool price for subnet ${netuid}`);
        prices.set(netuid, pool.price);
    }
    const out = compute(account, account.alpha_balances, prices, tao);
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    console.log(`balance.json: ${out.totalTao} TAO = $${out.totalUsd} (TAO $${out.taoUsd}, ${out.positions.length} alpha positions)`);
};

if (require.main === module) {
    main().catch((e) => { console.error(`balance.js failed: ${e.message}`); process.exit(1); });
}

module.exports = { compute, toScaled, fmt };
