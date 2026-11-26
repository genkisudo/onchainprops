#!/usr/bin/env node
/**
 * @file propr.js
 * @description Fetches Propr's public stats (payouts, revenue, funded traders) and
 * writes a compact 30-day slice to propr.json. build.js renders it on firms/propr.html.
 * Zero dependencies (Node 18+ global fetch).
 *
 *   node propr.js
 *
 * Endpoints (all public, no key), under https://www.propr.xyz/gateway/v1/stats:
 *   /payouts?limit=100&offset=N     every payout request (paged, unordered)
 *   /revenue/history?days=N         daily challenge fees + subscriptions
 *   /funded-traders/history?days=N  funded trader count per day
 *
 * The browser cannot call them (the site's CSP only allows 'self'), so a daily GitHub
 * Action (.github/workflows/propr.yml) fetches them here and visitors only see HTML.
 *
 * The slice is the last 30 COMPLETE UTC days (today's partial day is dropped).
 * "Paid to traders" is the trader share of each processed payout: `userAmount`, which
 * is exactly 80% of `amount` (the rest is Propr's system share). Where `userAmount` is
 * missing it is taken as 80% of `amount`. `uniqueTraders` counts distinct payout-feed
 * usernames paid in the window, so total paid / uniqueTraders is the average paid per trader.
 *
 * If any endpoint is down or its shape changes, propr.json is left untouched (last good
 * data) and the script exits 0. build.js hides the section when the file is missing or invalid.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BASE = 'https://www.propr.xyz/gateway/v1/stats';
const OUT = path.join(__dirname, 'propr.json');
const WINDOW_DAYS = 30;
const PAGE = 100;
const PARALLEL = 5;
const TRADER_SHARE = 0.8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const DAY_KEYS = ['payoutUsd', 'payoutCount', 'revenueUsd', 'fundedTraders'];

/**
 * propr.json is valid when it holds a full 30-day window of well-formed days.
 * @param {object} d
 * @returns {boolean}
 */
const isValidPropr = (d) => Boolean(
    d && typeof d === 'object' && !Array.isArray(d) &&
    typeof d.updatedAt === 'string' && !Number.isNaN(Date.parse(d.updatedAt)) &&
    Array.isArray(d.days) && d.days.length === WINDOW_DAYS &&
    d.days.every((x) => x && isDate(x.date) && DAY_KEYS.every((k) => isNum(x[k]))) &&
    isNum(d.uniqueTraders) && d.uniqueTraders > 0 &&
    d.lifetime && ['payoutsUsd', 'payoutCount', 'revenueUsd', 'fundedTraders'].every((k) => isNum(d.lifetime[k]))
);

/** Number from a number or numeric string; throws when missing. */
const num = (v, what) => {
    const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
    if (!isNum(n)) throw new Error(`missing or invalid ${what}`);
    return n;
};

/**
 * Reduce the three responses to the 30-day slice the page shows.
 * @param {{payouts: object[], total: number, revenue: object, funded: object, now: Date}} raw
 * @returns {object} propr.json payload
 */
const select = ({ payouts, total, revenue, funded, now }) => {
    const today = now.toISOString().slice(0, 10);
    if (!Array.isArray(payouts) || !payouts.length) throw new Error('payouts is empty');
    // Paging an unordered list can drift while new payouts arrive; tolerate a tiny gap only.
    if (payouts.length < total * 0.995) throw new Error(`payouts incomplete (${payouts.length}/${total})`);
    if (!Array.isArray(revenue?.history) || !Array.isArray(funded?.history)) throw new Error('history is missing');

    const rev = new Map(revenue.history.map((r) => [r.date, r]));
    const fund = new Map(funded.history.map((r) => [r.date, r]));

    const perDay = new Map();
    const tradersByDay = new Map(); // date -> Set of trader usernames paid that day
    let lifeUsd = 0, lifeN = 0;
    for (const p of payouts) {
        if (p.status !== 'processed' || typeof p.processedAt !== 'string') continue;
        const trader = p.userAmount != null ? num(p.userAmount, 'userAmount') : num(p.amount, 'amount') * TRADER_SHARE;
        lifeUsd += trader;
        lifeN++;
        const date = p.processedAt.slice(0, 10);
        const row = perDay.get(date) ?? { usd: 0, n: 0 };
        row.usd += trader;
        row.n++;
        perDay.set(date, row);
        // The payout feed's only trader identifier is the (anonymised) profile username.
        const who = p.user?.profile?.username;
        if (typeof who === 'string' && who) {
            if (!tradersByDay.has(date)) tradersByDay.set(date, new Set());
            tradersByDay.get(date).add(who);
        }
    }

    const dates = [...rev.keys()].filter((d) => isDate(d) && d < today).sort().slice(-WINDOW_DAYS);
    if (dates.length !== WINDOW_DAYS) throw new Error(`expected ${WINDOW_DAYS} complete revenue days, got ${dates.length}`);

    const days = dates.map((date) => {
        const f = fund.get(date);
        if (!f) throw new Error(`day ${date} missing from funded-traders`);
        const p = perDay.get(date) ?? { usd: 0, n: 0 };
        return {
            date,
            payoutUsd: Number(p.usd.toFixed(2)),
            payoutCount: p.n,
            revenueUsd: num(rev.get(date).dailyRevenue, 'dailyRevenue'),
            fundedTraders: num(f.totalFundedTraders, 'totalFundedTraders')
        };
    });

    const uniqueTraders = new Set(dates.flatMap((d) => [...(tradersByDay.get(d) ?? [])])).size;

    const out = {
        updatedAt: now.toISOString(),
        days,
        uniqueTraders, // distinct traders paid in the 30-day window
        lifetime: {
            payoutsUsd: Number(lifeUsd.toFixed(2)),
            payoutCount: lifeN,
            revenueUsd: num(revenue.totalRevenue, 'totalRevenue'),
            fundedTraders: num(funded.totalFundedTraders, 'totalFundedTraders')
        }
    };
    if (!isValidPropr(out)) throw new Error('selected payload failed validation');
    return out;
};

/** GET JSON, retrying timeouts and 429/5xx. */
const getJson = async (url) => {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30000);
        try {
            const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
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

/** Every payout, paged PARALLEL requests at a time and de-duplicated by payoutId. */
const fetchPayouts = async () => {
    const first = await getJson(`${BASE}/payouts?limit=${PAGE}&offset=0`);
    const total = num(first.total, 'payouts.total');
    const byId = new Map(first.data.map((p) => [p.payoutId, p]));
    const offsets = [];
    for (let o = PAGE; o < total; o += PAGE) offsets.push(o);
    for (let i = 0; i < offsets.length; i += PARALLEL) {
        const pages = await Promise.all(offsets.slice(i, i + PARALLEL).map((o) => getJson(`${BASE}/payouts?limit=${PAGE}&offset=${o}`)));
        for (const pg of pages) for (const p of pg.data) byId.set(p.payoutId, p);
    }
    return { payouts: [...byId.values()], total };
};

const main = async () => {
    let raw;
    try {
        const [p, revenue, funded] = await Promise.all([
            fetchPayouts(),
            getJson(`${BASE}/revenue/history?days=${WINDOW_DAYS + 5}`),
            getJson(`${BASE}/funded-traders/history?days=${WINDOW_DAYS + 5}`)
        ]);
        raw = { ...p, revenue, funded, now: new Date() };
    } catch (e) {
        console.error(`propr.js: fetch failed (${e.message}). Keeping the existing propr.json.`);
        return;
    }
    let out;
    try {
        out = select(raw);
    } catch (e) {
        console.error(`propr.js: unexpected response (${e.message}). Keeping the existing propr.json.`);
        return;
    }
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    const d = out.days;
    console.log(`propr.json: ${d[0].date} → ${d[d.length - 1].date}, as of ${out.updatedAt}`);
};

if (require.main === module) {
    main().catch((e) => { console.error(`propr.js failed: ${e.message}`); process.exit(1); });
}

module.exports = { select, isValidPropr, WINDOW_DAYS };
