/**
 * @file script.js
 * @description State-driven application logic implementing Reactive PubSub,
 * Web Components, and performant DocumentFragment manipulations.
 *
 * Amplitude Analytics is loaded as a UMD global via amplitude.min.js,
 * which sets window.amplitude before this script runs.
 */

// Collapse /index.html to / before Amplitude initializes below, so
// onchainprops.xyz/ and onchainprops.xyz/index.html aren't tracked as
// separate pages. Runs here (not an inline <script> in <head>) because
// the page's CSP script-src is locked to 'self' with no 'unsafe-inline'.
if (location.pathname.endsWith('/index.html')) {
    history.replaceState(null, '', location.pathname.slice(0, -10) + location.search + location.hash);
}

// -----------------------------------------
// 1. Reactive Architecture (PubSub)
// -----------------------------------------
class PubSub {
    constructor() {
        /** @type {Object.<string, Function[]>} */
        this.events = {};
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     */
    subscribe(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    /**
     * @param {string} eventName
     * @param {any} [data]
     */
    publish(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(cb => {
            try {
                cb(data);
            } catch (error) {
                console.error(`PubSub Error [${eventName}]:`, error);
            }
        });
    }

    /**
     * @param {string} eventName
     * @param {Function} callback
     */
    unsubscribe(eventName, callback) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
}

const Store = new PubSub();

/** Safe analytics wrapper — no-ops when amplitude.min.js is blocked or fails to load */
const analytics = {
    track: (...args) => { try { amplitude.track(...args); } catch (_) {} },
    initAll: (...args) => { try { amplitude.initAll(...args); } catch (_) {} }
};

// -----------------------------------------
// 2. Application State (Single Source of Truth)
// -----------------------------------------
/**
 * @typedef {Object} PropFirm
 * @property {string} name
 * @property {string} country
 * @property {string} split
 * @property {string} maxAccount
 * @property {string} website
 * @property {string} chain
 * @property {boolean} isAffiliate
 * @property {string} token
 */

const AppState = {
    // GEN:BEGIN firm-data
    /** @type {PropFirm[]} */
    propFirms: [
        { name: "Hypernova", country: "Cayman Islands", split: "80%", maxAccount: "$200,000", profitTarget: "10%", website: "https://hypernova.xyz/", chain: "Hyperliquid", isAffiliate: false, token: "No", payoutSpeed: "Soon", rulesOnchain: "Yes", aiAgents: undefined, scaledCapital: undefined },
        { name: "ProprXYZ", country: "UAE", split: "80%", maxAccount: "$200,000", profitTarget: "10%", website: "https://app.propr.xyz/r/nCnJ5uZ9", chain: "Hyperliquid", isAffiliate: true, token: "Yes", payoutSpeed: "Soon", rulesOnchain: "No", aiAgents: "Yes", scaledCapital: undefined },
        { name: "hyperpnl", country: "Cayman Islands", split: "80%", maxAccount: "$25k ($200k soon)", profitTarget: "10%", website: "https://app.hyperpnl.com/trade", chain: "Hyperliquid", isAffiliate: false, token: "No", payoutSpeed: "Soon", rulesOnchain: "No", aiAgents: undefined, scaledCapital: undefined },
        { name: "DojiFunded", country: "Hong Kong", split: "Up to 90%", maxAccount: "$100,000", profitTarget: "10%", website: "https://app.dojifunded.com/?ref=05E1DA3A", chain: "Arbitrum", isAffiliate: false, token: "No", payoutSpeed: "TBC", rulesOnchain: "No", aiAgents: undefined, scaledCapital: undefined },
        { name: "Vanta Trading", country: "Cayman Islands", split: "Up to 100%", maxAccount: "$100,000", profitTarget: "10%", website: "https://vantatrading.io/?ref=kamil", chain: "Bittensor / Hyperliquid", isAffiliate: true, token: "No", payoutSpeed: "Soon", rulesOnchain: "No", aiAgents: undefined, scaledCapital: undefined },
        { name: "Carrot Funding", country: "TBC", split: "80%", maxAccount: "$100,000", profitTarget: "8%", website: "https://app.carrotfunding.io/join/2VSSOTXBQZ", chain: "gTrade, Hyperliquid (soon)", isAffiliate: true, token: "Yes", payoutSpeed: "Soon", rulesOnchain: "No", aiAgents: undefined, scaledCapital: undefined },
        { name: "FoxyFi", country: "BVI", split: "80%", maxAccount: "$10,000", profitTarget: "TBC", website: "https://www.foxify.trade/", chain: "Hyperliquid (soon)", isAffiliate: false, token: "Yes", payoutSpeed: "Soon", rulesOnchain: "No", aiAgents: undefined, scaledCapital: undefined }
    ],
    /** @type {PropFirm[]} */
    predictionMarketFirms: [
        { name: "Funding Predicts", country: "USA", split: "Up to 90%", maxAccount: "$150,000", profitTarget: undefined, website: "https://fundingpredicts.com/", chain: "Polymarket", isAffiliate: false, token: "No", payoutSpeed: "Bi-weekly", rulesOnchain: "TBC", aiAgents: undefined, scaledCapital: undefined }
    ],
    // GEN:END firm-data
    /** @type {string|null} */
    activeFaqId: null
};

/** Converts a firm name to a stable, URL-safe ID slug */
const toFirmId = (name) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

/** Metadata for each page section — used for consistent event properties */
const SECTION_META = {
    'firms':     { name: 'Onchain Prop Firms', position: 1 },
    'resources': { name: 'Resources',          position: 2 },
    'faq':       { name: 'FAQ',                position: 3 }
};

/** Section IDs whose outbound resource-item links fire Resource Link Opened */
const RESOURCE_SECTION_IDS = new Set(['resources']);

// -----------------------------------------
// 3. Web Components (Native Encapsulation)
// -----------------------------------------
const faqTemplate = document.createElement('template');
faqTemplate.innerHTML = `
    <style>
        :host {
            display: block;
            border: 1px solid var(--border-color, rgba(255,255,255,0.08));
            border-radius: var(--radius-md, 14px);
            background: var(--bg-card, rgba(255,255,255,0.03));
            margin-bottom: 1rem;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        :host(:hover) {
            border-color: rgba(255,255,255,0.15);
        }
        button {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 1.75rem;
            background: none;
            border: none;
            color: var(--text-primary, #ffffff);
            font-size: 1.15rem;
            font-weight: 500;
            font-family: inherit;
            text-align: left;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 44px;
        }
        @media (max-width: 640px) {
            button {
                padding: 1.25rem;
                font-size: 1rem;
            }
            .content-inner {
                padding: 0 1.25rem 1.25rem;
            }
        }
        button:hover {
            color: var(--accent, #67d2b4);
        }
        .icon {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: var(--text-secondary, #94a3b8);
        }
        button[aria-expanded="true"] .icon {
            transform: rotate(180deg);
            color: var(--accent, #67d2b4);
        }
        .content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .content-inner {
            padding: 0 1.75rem 1.75rem;
            color: var(--text-secondary, #94a3b8);
            line-height: 1.7;
        }
    </style>
    <button aria-expanded="false" id="accordion-btn">
        <span id="question-text"></span>
        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="content" id="accordion-content" role="region" aria-labelledby="accordion-btn">
        <div class="content-inner">
            <slot></slot>
        </div>
    </div>
`;

class FaqAccordion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(faqTemplate.content.cloneNode(true));

        this.btn = this.shadowRoot.getElementById('accordion-btn');
        this.content = this.shadowRoot.getElementById('accordion-content');
        this.questionText = this.shadowRoot.getElementById('question-text');

        this.faqId = `faq-${Math.random().toString(36).substring(2, 11)}`;
        this.isOpen = false;

        this.toggle = this.toggle.bind(this);
    }

    connectedCallback() {
        // Build strictly unique ARIA mappings preventing screen-reader flattening errors
        const btnId = `btn-${this.faqId}`;
        const contentId = `content-${this.faqId}`;

        this.btn.setAttribute('id', btnId);
        this.btn.setAttribute('aria-controls', contentId);

        this.content.setAttribute('id', contentId);
        this.content.setAttribute('aria-labelledby', btnId);

        this.questionText.textContent = this.getAttribute('question');

        // Bound handler stored for unsubscription
        this._onFaqToggled = (/** @type {string|null} */ activeId) => {
            if (activeId !== this.faqId && this.isOpen) {
                this.close();
            }
        };

        this.btn.addEventListener('click', this.toggle);
        Store.subscribe('FAQ_TOGGLED', this._onFaqToggled);
    }

    disconnectedCallback() {
        this.btn.removeEventListener('click', this.toggle);
        Store.unsubscribe('FAQ_TOGGLED', this._onFaqToggled);
    }

    toggle() {
        if (this.isOpen) {
            Store.publish('FAQ_TOGGLED', null);
            this.close();
            analytics.track('FAQ Collapsed', { question: this.getAttribute('question') });
        } else {
            Store.publish('FAQ_TOGGLED', this.faqId);
            this.open();
            analytics.track('FAQ Expanded', { question: this.getAttribute('question') });
        }
    }

    open() {
        this.isOpen = true;
        this.btn.setAttribute('aria-expanded', 'true');
        // requestAnimationFrame for smooth DOM reflow measurement
        requestAnimationFrame(() => {
            this.content.style.maxHeight = `${this.content.scrollHeight}px`;
        });
    }

    close() {
        this.isOpen = false;
        this.btn.setAttribute('aria-expanded', 'false');
        requestAnimationFrame(() => {
            this.content.style.maxHeight = '0px';
        });
    }
}

customElements.define('faq-accordion', FaqAccordion);

// -----------------------------------------
// 3b. Performant DOM Rendering
// -----------------------------------------
/**
 * Builds a single firm table row via the DOM API (prevents XSS injection).
 * @param {PropFirm} firm
 * @param {number} rank 1-based position within its table
 * @param {{ showProfitTarget?: boolean }} [opts]
 * @returns {HTMLTableRowElement}
 */
const buildFirmRow = (firm, rank, { showProfitTarget = false } = {}) => {
    const row = document.createElement('tr');
    row.dataset.firmName = firm.name;
    row.dataset.firmRank = String(rank);

    const firmSlug = firm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const firmPageUrl = `firms/${firmSlug}`;
    // The whole row hover-highlights like a card (see .prop-table tbody tr:hover),
    // so make the rest of it navigate too — otherwise clicks on the split/account/
    // token cells or trust chips land on plain text and register as dead clicks.
    row.dataset.firmUrl = firmPageUrl;

    const nameCell = document.createElement('td');
    const nameLink = document.createElement('a');
    nameLink.href = firmPageUrl;
    nameLink.className = 'firm-name firm-name-link';
    nameLink.textContent = firm.name;
    const chainDiv = document.createElement('div');
    chainDiv.style.cssText = 'font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;';
    chainDiv.textContent = firm.chain;
    nameCell.append(nameLink, chainDiv);

    // Payout-trust signal: rules enforced by smart contracts, verifiable onchain
    if (firm.rulesOnchain === 'Yes') {
        const trustChip = document.createElement('span');
        trustChip.className = 'trust-chip';
        trustChip.textContent = 'Rules onchain';
        trustChip.title = 'Evaluation rules are enforced by smart contracts — verifiable on the blockchain';
        nameLink.after(trustChip);
    }

    // Capability signal: firm supports trading by autonomous AI agents
    if (firm.aiAgents === 'Yes') {
        const aiChip = document.createElement('span');
        aiChip.className = 'trust-chip trust-chip--ai';
        aiChip.textContent = 'AI agents trading';
        aiChip.title = 'Supports automated trading by AI agents';
        nameLink.after(aiChip);
    }

    // Capability signal: account capital scales up as the trader performs
    if (firm.scaledCapital === 'Yes') {
        const scaleChip = document.createElement('span');
        scaleChip.className = 'trust-chip trust-chip--capital';
        scaleChip.textContent = 'Scaled capital';
        scaleChip.title = 'Account size scales up as you hit profit targets';
        nameLink.after(scaleChip);
    }

    const countryCell = document.createElement('td');
    countryCell.dataset.label = 'Country';
    countryCell.textContent = firm.country ?? 'TBC';

    const splitCell = document.createElement('td');
    splitCell.className = 'val-highlight';
    splitCell.dataset.label = 'Profit Split';
    splitCell.textContent = firm.split;

    const accountCell = document.createElement('td');
    accountCell.className = 'val-highlight';
    accountCell.dataset.label = 'Max Account';
    accountCell.textContent = firm.maxAccount;

    const profitTargetCell = document.createElement('td');
    profitTargetCell.dataset.label = 'Profit Target';
    profitTargetCell.textContent = firm.profitTarget ?? 'TBC';

    const tokenCell = document.createElement('td');
    tokenCell.className = 'val-highlight';
    tokenCell.dataset.label = 'Token';
    tokenCell.textContent = firm.token;

    const visitCell = document.createElement('td');
    visitCell.dataset.label = 'Firm';
    const linksDiv = document.createElement('div');
    linksDiv.style.cssText = 'display: flex; gap: 0.75rem; align-items: center;';

    const firmLink = document.createElement('a');
    firmLink.href = firmPageUrl;
    firmLink.className = 'btn btn-secondary firm-view-btn';
    firmLink.setAttribute('aria-label', `View ${firm.name} details`);
    firmLink.textContent = 'View →';

    linksDiv.append(firmLink);
    visitCell.appendChild(linksDiv);

    if (showProfitTarget) {
        row.append(nameCell, countryCell, splitCell, accountCell, profitTargetCell, tokenCell, visitCell);
    } else {
        row.append(nameCell, countryCell, splitCell, accountCell, tokenCell, visitCell);
    }
    return row;
};

/**
 * Renders the table using a DocumentFragment to minimize repaints.
 * Attaches data attributes to each row for IntersectionObserver lookups.
 */
const renderPropFirmsTable = () => {
    const tableBody = document.getElementById('firm-table-body');
    if (!tableBody) return;

    // Use DocumentFragment for batch insertions
    const fragment = document.createDocumentFragment();
    AppState.propFirms.forEach((firm, index) => {
        fragment.appendChild(buildFirmRow(firm, index + 1, { showProfitTarget: true }));
    });

    // Single DOM insertion
    tableBody.appendChild(fragment);

    // Observe each row for Firm Card Viewed once rows are in the DOM
    setupFirmCardObservers();
};

/**
 * Renders the Prediction Markets prop firms table, mirroring the main table layout.
 */
const renderPredictionMarketsTable = () => {
    const tableBody = document.getElementById('prediction-markets-table-body');
    if (!tableBody) return;

    const fragment = document.createDocumentFragment();
    AppState.predictionMarketFirms.forEach((firm, index) => {
        fragment.appendChild(buildFirmRow(firm, index + 1));
    });

    tableBody.appendChild(fragment);
};

// -----------------------------------------
// 5. IntersectionObserver — section and card visibility
// -----------------------------------------
/**
 * Fires Firm List Viewed when the firms section enters the viewport,
 * and Resources Section Viewed when the resources section enters the viewport.
 * Each observer fires once then disconnects.
 */
const setupSectionObservers = () => {
    const opts = { threshold: 0.1, rootMargin: '0px 0px -10% 0px' };

    const firmsSection = document.getElementById('firms');
    if (firmsSection) {
        const firmsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                analytics.track('Firm List Viewed', {
                    'list name': SECTION_META['firms'].name,
                    'list position': SECTION_META['firms'].position
                });
                firmsObserver.unobserve(entry.target);
            });
        }, opts);
        firmsObserver.observe(firmsSection);
    }

    const resourcesSection = document.getElementById('resources');
    if (resourcesSection) {
        const resourcesObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                analytics.track('Resources Section Viewed', {
                    'section name': SECTION_META['resources'].name,
                    'section position': SECTION_META['resources'].position
                });
                resourcesObserver.unobserve(entry.target);
            });
        }, opts);
        resourcesObserver.observe(resourcesSection);
    }
};

/**
 * Fires Firm Card Viewed when at least 50% of each table row enters the viewport.
 * Called after renderPropFirmsTable so the rows exist in the DOM.
 */
const setupFirmCardObservers = () => {
    const rows = document.querySelectorAll('#firm-table-body tr');
    if (!rows.length) return;

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const row = entry.target;
            const firmName = row.dataset.firmName ?? '';
            const firmRank = parseInt(row.dataset.firmRank ?? '0', 10);
            analytics.track('Firm Card Viewed', {
                'firm id': toFirmId(firmName),
                'firm name': firmName,
                'firm rank': firmRank,
                'list position': firmRank
            });
            cardObserver.unobserve(row);
        });
    }, { threshold: 0.25 });

    rows.forEach(row => cardObserver.observe(row));
};

/**
 * Same card-viewed tracking for the prediction-markets table.
 * Called after renderPredictionMarketsTable.
 */
const setupPredictionCardObservers = () => {
    const rows = document.querySelectorAll('#prediction-markets-table-body tr');
    if (!rows.length) return;

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const row = entry.target;
            const firmName = row.dataset.firmName ?? '';
            const firmRank = parseInt(row.dataset.firmRank ?? '0', 10);
            analytics.track('Firm Card Viewed', {
                'firm id': toFirmId(firmName),
                'firm name': firmName,
                'firm rank': firmRank,
                'list position': firmRank
            });
            cardObserver.unobserve(row);
        });
    }, { threshold: 0.25 });

    rows.forEach(row => cardObserver.observe(row));
};

// -----------------------------------------
// 6. Mobile Navigation
// -----------------------------------------
const setupMobileNav = () => {
    const btn = document.getElementById('hamburger-btn');
    const nav = document.getElementById('mobile-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(isOpen));
        nav.setAttribute('aria-hidden', String(!isOpen));
    });
};

/**
 * Resolves which AppState firms array a table row belongs to, based on its
 * containing tbody — so click tracking works for both the main prop firms
 * table and the prediction markets table.
 * @param {Element} row
 * @returns {PropFirm[] | null}
 */
const firmsArrayForRow = (row) => {
    if (row.closest('#firm-table-body')) return AppState.propFirms;
    if (row.closest('#prediction-markets-table-body')) return AppState.predictionMarketFirms;
    return null;
};

// -----------------------------------------
// 7. Event Delegation — smooth scroll + analytics
// -----------------------------------------
const setupEventDelegation = () => {
    document.body.addEventListener('click', (/** @type {MouseEvent} */ event) => {
        if (!(event.target instanceof HTMLElement)) return;

        /** @type {HTMLAnchorElement|null} */
        const anchor = event.target.closest('a');

        // Row-click fallback for the firm tables: the row already hover-highlights
        // like a card, so clicking anywhere in it (not just the name/View link)
        // should navigate too, instead of registering as a dead click.
        if (!anchor) {
            const row = event.target.closest('tr[data-firm-url]');
            const hasSelection = (window.getSelection?.()?.toString() ?? '') !== '';
            if (row && !hasSelection) {
                const firmUrl = row.dataset.firmUrl;
                const firmName = row.dataset.firmName ?? '';
                const firmRank = parseInt(row.dataset.firmRank ?? '0', 10);

                const firm = firmsArrayForRow(row)?.find(f => f.name === firmName);
                if (firm) {
                    analytics.track('Firm Selected', {
                        'firm id': toFirmId(firm.name),
                        'firm name': firm.name,
                        'selection source': 'row_click',
                        'list position': firmRank
                    });
                }

                if (event.ctrlKey || event.metaKey) {
                    window.open(firmUrl, '_blank', 'noopener');
                } else {
                    window.location.href = firmUrl;
                }
            }
            return;
        }

        // Smooth scroll for in-page hash links
        if (anchor && anchor.getAttribute('href')?.startsWith('#')) {
            const hash = anchor.getAttribute('href');
            if (hash === '#') return;

            let targetElement = null;
            try {
                targetElement = document.querySelector(hash);
            } catch (_) {
                return;
            }

            if (targetElement) {
                event.preventDefault();
                // Close mobile nav on link click
                const mobileNav = document.getElementById('mobile-nav');
                const hamburgerBtn = document.getElementById('hamburger-btn');
                if (mobileNav?.classList.contains('is-open')) {
                    mobileNav.classList.remove('is-open');
                    mobileNav.setAttribute('aria-hidden', 'true');
                    hamburgerBtn?.setAttribute('aria-expanded', 'false');
                }
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        // Firm Selected — links inside either firm table (firm page or name click)
        const anchorRow = anchor?.closest('tr[data-firm-url]');
        const anchorFirms = anchorRow ? firmsArrayForRow(anchorRow) : null;
        if (anchor && anchor.href && anchorFirms) {
            const firmName = anchorRow.dataset.firmName ?? '';
            const firmRank = parseInt(anchorRow.dataset.firmRank ?? '0', 10);
            const firm = anchorFirms.find(f => f.name === firmName);

            if (firm) {
                const firmId = toFirmId(firm.name);

                analytics.track('Firm Selected', {
                    'firm id': firmId,
                    'firm name': firm.name,
                    'selection source': anchor.classList.contains('firm-name-link') ? 'name_click' : 'firm_link',
                    'list position': firmRank
                });
            }
            return;
        }

        // Resource Link Opened — outbound links inside the resources section
        if (anchor && anchor.href) {
            const section = anchor.closest('section');
            const card = anchor.closest('.resource-item');
            if (section && card && RESOURCE_SECTION_IDS.has(section.id)) {
                const title = card.querySelector('.resource-title')?.textContent?.trim() ?? '';
                const type = card.querySelector('.resource-tag')?.textContent?.trim()?.toLowerCase() ?? '';
                let hostname = '';
                try { hostname = new URL(anchor.href).hostname; } catch (_) {}

                analytics.track('Resource Link Opened', {
                    'resource title': title,
                    'resource type': type,
                    'destination domain': hostname,
                    'section name': SECTION_META[section.id]?.name ?? section.id
                });
            }
        }
    });
};

// -----------------------------------------
// Initialization
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Amplitude — must run before any tracking calls
    // SECURITY NOTE: This is a public client-side API key for Amplitude.
    // For static sites, this must remain client-side. Configure rate limiting
    // in your Amplitude dashboard to prevent abuse.
    // For dynamic environments, consider using environment variables.
    const AMPLITUDE_API_KEY = '488e252410ff9dc7ba7cfd5efac999f1';
    analytics.initAll(AMPLITUDE_API_KEY, {
        "analytics": {
            // Hash-only navigation (#firms, #resources, #faq) scrolls within
            // this single page — it isn't a real route change, so don't let
            // it fire a duplicate Page View. Other autocapture categories
            // (attribution, sessions, clicks, etc.) stay on by default.
            "autocapture": { "pageViews": { "trackHistoryChanges": "pathOnly" } }
        },
        "sessionReplay": { "sampleRate": 1 }
    });

    // Initialize UI — errors here are reported to Amplitude
    try {
        renderPropFirmsTable();
        renderPredictionMarketsTable();
        setupPredictionCardObservers();
        setupSectionObservers();
        setupMobileNav();
        setupEventDelegation();
    } catch (e) {
        console.error("App initialization failure:", e);
        analytics.track('Error Encountered', {
            'error category': 'initialization',
            'error message': e?.message ?? 'Unknown error',
            'error context': 'DOMContentLoaded setup',
            'error code': null,
            'http status code': null
        });
    }
});
