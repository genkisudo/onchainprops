#!/usr/bin/env node
/**
 * @file hypernova.js
 * @description Fetches Hypernova's public stats history and writes a compact
 * 30-day slice to hypernova.json. build.js renders it on firms/hypernova.html.
 * Zero dependencies (Node 18+ global fetch).
 *
 *   node hypernova.js
 *
 * The browser cannot call the endpoint (the site's CSP only allows 'self'), so a
 * daily GitHub Action (.github/workflows/hypernova.yml) fetches it here and
 * visitors only see the generated HTML.
 *
 * The slice is the last 30 COMPLETE UTC days: the in-progress day is dropped so
 * the final bar is never a partial one. Only the fields the page shows are kept.
 *
 * If the API is down or its shape changes, hypernova.json is left untouched
 * (last good data) and the script exits 0. build.js hides the section when the
 * file is missing or no longer valid.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const URL = 'https://app.hypernova.xyz/api/hypernova.services.analytics.v1.AnalyticsService/GetPublicStatsHistory'
    + '?connect=v1&encoding=json&message=' + encodeURIComponent(JSON.stringify({ range: 'PUBLIC_STATS_RANGE_ALL' }));
const OUT = path.join(__dirname, 'hypernova.json');
const WINDOW_DAYS = 30;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Per-day fields written to hypernova.json. */
const DAY_KEYS = ['date', 'payoutUsd', 'payoutCount', 'fundedAumUsd', 'fundedTraders', 'signups', 'paidUsers', 'fundedUsers', 'revenueUsd'];

/**
 * hypernova.json is valid when it holds a full 30-day window of well-formed days.
 * @param {object} d
 * @returns {boolean}
 */
const isValidHypernova = (d) => Boolean(
    d && typeof d === 'object' && !Array.isArray(d) &&
    typeof d.updatedAt === 'string' && !Number.isNaN(Date.parse(d.updatedAt)) &&
    Array.isArray(d.days) && d.days.length === WINDOW_DAYS &&
    d.days.every((x) => x && isDate(x.date) && DAY_KEYS.every((k) => k === 'date' || isNum(x[k]))) &&
    d.lifetime && ['payoutsUsd', 'revenueUsd', 'signups', 'paidUsers', 'fundedUsers', 'payoutRecipients'].every((k) => isNum(d.lifetime[k])) &&
    isNum(d.passRatePct) &&
    Array.isArray(d.topMarkets) && d.topMarkets.every((m) => typeof m.symbol === 'string' && isNum(m.sharePct))
);

/** Number from a number or numeric string; throws when missing. */
const num = (v, what) => {
    const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
    if (!isNum(n)) throw new Error(`missing or invalid ${what}`);
    return n;
};

/** Index a [{date, ...}] series by date. */
const byDate = (rows, what) => {
    if (!Array.isArray(rows) || !rows.length) throw new Error(`${what} is missing`);
    return new Map(rows.map((r) => [r.date, r]));
};

/**
 * Reduce the full-history response to the 30-day slice the page shows.
 * @param {object} raw - parsed GetPublicStatsHistory response
 * @returns {object} hypernova.json payload
 */
const select = (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('response is not an object');
    if (typeof raw.asOf !== 'string' || Number.isNaN(Date.parse(raw.asOf))) throw new Error('asOf is missing');
    if (raw.partial === true) throw new Error('response is flagged partial');

    const asOfDay = new Date(raw.asOf).toISOString().slice(0, 10);
    const payouts = byDate(raw.payouts, 'payouts');
    const funded = byDate(raw.funded, 'funded');
    const growth = byDate(raw.growthFunnel, 'growthFunnel');
    const revenue = byDate(raw.assessmentRevenue, 'assessmentRevenue');

    // Complete days only: everything strictly before the day the snapshot was taken.
    const dates = [...payouts.keys()].filter((d) => isDate(d) && d < asOfDay).sort().slice(-WINDOW_DAYS);
    if (dates.length !== WINDOW_DAYS) throw new Error(`expected ${WINDOW_DAYS} complete days, got ${dates.length}`);

    const days = dates.map((date) => {
        const p = payouts.get(date), f = funded.get(date), g = growth.get(date), r = revenue.get(date);
        if (!f || !g || !r) throw new Error(`day ${date} missing from a series`);
        return {
            date,
            payoutUsd: num(p.payoutAmountUsd, 'payoutAmountUsd'),
            payoutCount: num(p.payoutCount, 'payoutCount'),
            fundedAumUsd: num(f.fundedTraderAumUsd, 'fundedTraderAumUsd'),
            fundedTraders: num(f.fundedTraderCount, 'fundedTraderCount'),
            signups: num(g.signupCountCumulative, 'signupCountCumulative'),
            paidUsers: num(g.paidUserCountCumulative, 'paidUserCountCumulative'),
            fundedUsers: num(g.fundedUserCountCumulative, 'fundedUserCountCumulative'),
            revenueUsd: num(r.revenueUsd, 'revenueUsd')
        };
    });

    const last = dates[dates.length - 1];
    const lg = growth.get(last);

    // Pass rate over every tracked risk tier (paid evaluations, all time).
    const tiers = raw.passRate?.byRisk;
    if (!Array.isArray(tiers)) throw new Error('passRate.byRisk is missing');
    let passed = 0, failed = 0;
    for (const t of tiers) {
        if (t.cohort !== 'paid_evaluation') continue;
        passed += num(t.passedCount, 'passedCount');
        failed += num(t.failedCount, 'failedCount');
    }
    if (passed + failed === 0) throw new Error('no pass-rate data');

    // Top paid-evaluation markets by notional share.
    const topMarkets = (raw.topInstruments ?? [])
        .filter((m) => m.cohort === 'paid_evaluation')
        .map((m) => ({ symbol: String(m.symbol ?? m.id), sharePct: num(m.notionalSharePct, 'notionalSharePct') }))
        .sort((a, b) => b.sharePct - a.sharePct)
        .slice(0, 5);
    if (!topMarkets.length) throw new Error('topInstruments is missing');

    const out = {
        updatedAt: new Date(raw.asOf).toISOString(),
        days,
        lifetime: {
            payoutsUsd: num(payouts.get(last).cumulativePayoutAmountUsd, 'cumulativePayoutAmountUsd'),
            revenueUsd: num(revenue.get(last).cumulativeRevenueUsd, 'cumulativeRevenueUsd'),
            signups: num(lg.signupCountCumulative, 'signups'),
            paidUsers: num(lg.paidUserCountCumulative, 'paidUsers'),
            fundedUsers: num(lg.fundedUserCountCumulative, 'fundedUsers'),
            payoutRecipients: num(lg.payoutRecipientCountCumulative, 'payoutRecipients')
        },
        passRatePct: Number(((passed / (passed + failed)) * 100).toFixed(1)),
        topMarkets
    };
    if (!isValidHypernova(out)) throw new Error('selected payload failed validation');
    return out;
};

/** GET the stats endpoint, retrying timeouts and 429/5xx. */
const fetchJson = async () => {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30000);
        try {
            const res = await fetch(URL, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
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
        console.error(`hypernova.js: fetch failed (${e.message}). Keeping the existing hypernova.json.`);
        return;
    }
    let out;
    try {
        out = select(raw);
    } catch (e) {
        console.error(`hypernova.js: unexpected response (${e.message}). Keeping the existing hypernova.json.`);
        return;
    }
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    const d = out.days;
    console.log(`hypernova.json: ${d[0].date} → ${d[d.length - 1].date}, as of ${out.updatedAt}`);
};

if (require.main === module) {
    main().catch((e) => { console.error(`hypernova.js failed: ${e.message}`); process.exit(1); });
}

module.exports = { select, isValidHypernova, WINDOW_DAYS };
