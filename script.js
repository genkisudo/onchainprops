/**
 * @file script.js
 * @description State-driven application logic implementing Reactive PubSub,
 * Web Components, and performant DocumentFragment manipulations.
 *
 * Amplitude Analytics is loaded as a UMD global via amplitude.min.js,
 * which sets window.amplitude before this script runs.
 */

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

// -----------------------------------------
// 2. Application State (Single Source of Truth)
// -----------------------------------------
/**
 * @typedef {Object} PropFirm
 * @property {string} name
 * @property {string} split
 * @property {string} maxAccount
 * @property {string} website
 * @property {string} chain
 * @property {boolean} isAffiliate
 * @property {string} token
 */

const AppState = {
    /** @type {PropFirm[]} */
    propFirms: [
        { name: "Hypernova", split: "90%", maxAccount: "$200,000", website: "https://hypernova.xyz/", chain: "Hyperliquid", isAffiliate: false, token: "No", payoutSpeed: "Soon", price: "" },
        { name: "hyperpnl", split: "80%", maxAccount: "TBC", website: "https://app.hyperpnl.com/trade", chain: "Hyperliquid", isAffiliate: false, token: "No", payoutSpeed: "Soon", price: "" },
        { name: "Carrot Funding", split: "80%", maxAccount: "$50,000", website: "https://app.carrotfunding.io/join/2VSSOTXBQZ", chain: "gTrade, Hyperliquid (soon)", isAffiliate: true, token: "Yes", payoutSpeed: "Soon", price: "" },
        { name: "ProprXYZ", split: "80%", maxAccount: "$200,000", website: "https://app.propr.xyz/r/nCnJ5uZ9", chain: "Hyperliquid", isAffiliate: true, token: "Yes", payoutSpeed: "Soon", price: "" },
        { name: "Vanta Trading", split: "TBC", maxAccount: "$100,000", website: "https://vantatrading.io/?ref=kamil", chain: "Hyperliquid", isAffiliate: true, token: "No", payoutSpeed: "Soon", price: "" },
        { name: "FoxyFi", split: "80%", maxAccount: "$10,000", website: "https://www.foxify.trade/", chain: "Hyperliquid (soon)", isAffiliate: false, token: "Yes", payoutSpeed: "Soon", price: "" }
    ],
    /** @type {string|null} */
    activeFaqId: null
};

/** Converts a firm name to a stable, URL-safe ID slug */
const toFirmId = (name) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

/** Metadata for each page section — used for consistent event properties */
const SECTION_META = {
    'firms':       { name: 'Onchain Prop Firms',             position: 1 },
    'data-tools':  { name: 'Onchain Data Tools',             position: 2 },
    'hyperliquid': { name: 'Hyperliquid',                    position: 3 },
    'ai-agents':   { name: 'AI Agents & Prediction Markets', position: 4 },
    'learning':    { name: 'Learning Resources',             position: 5 },
    'faq':         { name: 'FAQ',                            position: 6 }
};

/** Section IDs whose outbound article-card links fire Resource Link Opened */
const RESOURCE_SECTION_IDS = new Set(['data-tools', 'hyperliquid', 'ai-agents', 'learning']);

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
            amplitude.track('FAQ Collapsed', { question: this.getAttribute('question') });
        } else {
            Store.publish('FAQ_TOGGLED', this.faqId);
            this.open();
            amplitude.track('FAQ Expanded', { question: this.getAttribute('question') });
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
// 3b. Feedback Box Web Component
// -----------------------------------------
const feedbackTemplate = document.createElement('template');
feedbackTemplate.innerHTML = `
    <style>
        :host {
            --feedback-bottom: 2rem;
            --feedback-right: 2rem;
            --feedback-mobile-bottom: 1rem;
            --feedback-mobile-right: 1rem;
        }

        .feedback-button {
            position: fixed;
            bottom: var(--feedback-bottom);
            right: var(--feedback-right);
            width: 50px;
            height: 50px;
            background: var(--accent, #67d2b4);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 20px rgba(103, 210, 180, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 50;
            color: #020617;
        }

        .feedback-button:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 30px rgba(103, 210, 180, 0.5);
        }

        .feedback-modal {
            position: fixed;
            bottom: 70px;
            right: var(--feedback-right);
            width: 360px;
            background: var(--bg-card, rgba(255, 255, 255, 0.03));
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-lg, 18px);
            padding: 1.5rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 50;
        }

        .feedback-modal.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        .feedback-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .feedback-header h3 {
            margin: 0;
            color: var(--text-primary, #f8f8f8);
            font-size: 1.1rem;
            font-family: 'Space Grotesk', sans-serif;
        }

        .close-btn {
            background: none;
            border: none;
            color: var(--text-secondary, #94a3b8);
            cursor: pointer;
            font-size: 1.5rem;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.3s;
        }

        .close-btn:hover {
            color: var(--text-primary, #f8f8f8);
        }

        .feedback-form {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        input[type="email"],
        textarea {
            width: 100%;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 10px);
            color: var(--text-primary, #f8f8f8);
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            transition: all 0.3s;
        }

        input[type="email"]::placeholder,
        textarea::placeholder {
            color: var(--text-secondary, #94a3b8);
        }

        textarea {
            min-height: 100px;
            resize: none;
        }

        input[type="email"]:focus,
        textarea:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(103, 210, 180, 0.3);
            box-shadow: 0 0 12px rgba(103, 210, 180, 0.1);
        }

        .feedback-submit {
            padding: 0.75rem 1rem;
            background: var(--accent, #67d2b4);
            color: #020617;
            border: none;
            border-radius: var(--radius-pill, 9999px);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .feedback-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(103, 210, 180, 0.3);
        }

        .feedback-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .feedback-status {
            text-align: center;
            padding: 1rem;
            border-radius: var(--radius-sm, 10px);
            font-size: 0.9rem;
            display: none;
        }

        .feedback-status.success {
            display: block;
            background: rgba(103, 210, 180, 0.1);
            border: 1px solid rgba(103, 210, 180, 0.3);
            color: var(--accent, #67d2b4);
            animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 640px) {
            .feedback-button {
                bottom: var(--feedback-mobile-bottom);
                right: var(--feedback-mobile-right);
                width: 48px;
                height: 48px;
                font-size: 1.3rem;
            }

            .feedback-modal {
                bottom: 65px;
                right: var(--feedback-mobile-right);
                left: 1rem;
                width: auto;
                max-width: 100%;
                padding: 1.25rem;
            }
        }
    </style>

    <button class="feedback-button" aria-label="Send feedback" aria-expanded="false" title="Send feedback">💬</button>

    <div class="feedback-modal">
        <div class="feedback-header">
            <h3>Share Feedback</h3>
            <button class="close-btn" aria-label="Close feedback">✕</button>
        </div>
        <form class="feedback-form">
            <input
                type="email"
                name="email"
                placeholder="Your email (optional)"
            />
            <textarea
                name="message"
                placeholder="Tell us what you think... (max 500 characters)"
                maxlength="500"
                required
            ></textarea>
            <button type="submit" class="feedback-submit">Send Feedback</button>
        </form>
        <div class="feedback-status"></div>
    </div>
`;

class FeedbackBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(feedbackTemplate.content.cloneNode(true));

        this.btn = this.shadowRoot.querySelector('.feedback-button');
        this.modal = this.shadowRoot.querySelector('.feedback-modal');
        this.closeBtn = this.shadowRoot.querySelector('.close-btn');
        this.form = this.shadowRoot.querySelector('.feedback-form');
        this.textarea = this.shadowRoot.querySelector('textarea[name="message"]');
        this.emailInput = this.shadowRoot.querySelector('input[name="email"]');
        this.statusEl = this.shadowRoot.querySelector('.feedback-status');

        this.isOpen = false;
        this.handleToggle = this.handleToggle.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    connectedCallback() {
        this.btn.addEventListener('click', this.handleToggle);
        this.closeBtn.addEventListener('click', this.handleClose);
        this.form.addEventListener('submit', this.handleSubmit);

        // Close modal when clicking outside
        this._handleOutsideClick = (e) => {
            if (this.isOpen && !this.contains(e.target) && e.target !== this.btn) {
                this.close();
            }
        };
        document.addEventListener('click', this._handleOutsideClick);
    }

    disconnectedCallback() {
        this.btn.removeEventListener('click', this.handleToggle);
        this.closeBtn.removeEventListener('click', this.handleClose);
        this.form.removeEventListener('submit', this.handleSubmit);
        document.removeEventListener('click', this._handleOutsideClick);
    }

    handleToggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
            amplitude.track('Feedback Opened');
        }
    }

    handleClose(e) {
        e.preventDefault();
        this.close();
    }

    handleSubmit(e) {
        e.preventDefault();
        const message = this.textarea.value.trim();
        const email = this.form.querySelector('input[name="email"]').value.trim();

        if (!message) return;

        // Rate limit: prevent spam (30 seconds between submissions)
        const lastSubmitTime = localStorage.getItem('feedback_last_submit');
        const now = Date.now();
        const minInterval = 30000;

        if (lastSubmitTime) {
            const timeSinceLastSubmit = now - parseInt(lastSubmitTime);
            if (timeSinceLastSubmit < minInterval) {
                const secondsLeft = Math.ceil((minInterval - timeSinceLastSubmit) / 1000);
                this.statusEl.textContent = `⏳ Please wait ${secondsLeft}s before submitting again`;
                this.statusEl.style.background = 'rgba(94, 109, 126, 0.1)';
                this.statusEl.style.borderColor = 'rgba(94, 109, 126, 0.3)';
                this.statusEl.style.color = '#5e6d7e';
                this.statusEl.style.display = 'block';
                return;
            }
        }

        localStorage.setItem('feedback_last_submit', now.toString());

        // Open Telegram with pre-filled message
        const telegramMessage = encodeURIComponent(`Feedback: ${message}${email ? `\n\nEmail: ${email}` : ''}`);
        const telegramUrl = `https://t.me/genki132?start=${telegramMessage}`;
        window.open(telegramUrl, '_blank');

        amplitude.track('Feedback Submitted', {
            hasEmail: !!email,
            messageLength: message.length
        });

        this.statusEl.textContent = '✓ Opening Telegram. Send your feedback there!';
        this.statusEl.classList.add('success');
        this.statusEl.style.display = 'block';
        this.textarea.value = '';
        this.form.querySelector('input[name="email"]').value = '';

        // Auto-close modal after 2 seconds
        setTimeout(() => {
            this.close();
            this.statusEl.classList.remove('success');
        }, 2000);
    }

    open() {
        this.isOpen = true;
        this.modal.classList.add('open');
        this.textarea.focus();
        this.btn.setAttribute('aria-expanded', 'true');
    }

    close() {
        this.isOpen = false;
        this.modal.classList.remove('open');
        this.btn.setAttribute('aria-expanded', 'false');
        this.statusEl.classList.remove('success');
        // Reset any inline error styles set during failed submissions
        this.statusEl.removeAttribute('style');
    }
}

customElements.define('feedback-box', FeedbackBox);

// -----------------------------------------
// 4. Performant DOM Rendering
// -----------------------------------------
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
        const rank = index + 1;
        const row = document.createElement('tr');
        row.dataset.firmName = firm.name;
        row.dataset.firmRank = String(rank);

        // Build cells via DOM API to prevent XSS injection
        const nameCell = document.createElement('td');
        const nameDiv = document.createElement('div');
        nameDiv.className = 'firm-name';
        nameDiv.textContent = firm.name;
        const chainDiv = document.createElement('div');
        chainDiv.style.cssText = 'font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;';
        chainDiv.textContent = firm.chain;
        nameCell.append(nameDiv, chainDiv);

        const splitCell = document.createElement('td');
        splitCell.className = 'val-highlight';
        splitCell.dataset.label = 'Profit Split';
        splitCell.textContent = firm.split;

        const accountCell = document.createElement('td');
        accountCell.className = 'val-highlight';
        accountCell.dataset.label = 'Max Account';
        accountCell.textContent = firm.maxAccount;

        const tokenCell = document.createElement('td');
        tokenCell.className = 'val-highlight';
        tokenCell.dataset.label = 'Token';
        tokenCell.textContent = firm.token;

        const payoutCell = document.createElement('td');
        payoutCell.className = 'val-highlight';
        payoutCell.dataset.label = 'Payout Speed';
        payoutCell.textContent = firm.payoutSpeed;

        const priceCell = document.createElement('td');
        priceCell.className = 'val-highlight';
        priceCell.dataset.label = 'Price';
        priceCell.textContent = firm.price;

        const visitCell = document.createElement('td');
        visitCell.dataset.label = 'Website';
        const linksDiv = document.createElement('div');
        linksDiv.style.cssText = 'display: flex; gap: 0.75rem; align-items: center;';

        const visitLink = document.createElement('a');
        // Validate protocol to prevent javascript: URI injection if data source ever changes
        try {
            const parsed = new URL(firm.website);
            visitLink.href = (parsed.protocol === 'https:' || parsed.protocol === 'http:')
                ? firm.website
                : '#';
        } catch (_) {
            visitLink.href = '#';
        }
        visitLink.target = '_blank';
        visitLink.rel = 'noopener noreferrer';
        visitLink.setAttribute('aria-label', `Visit ${firm.name} website`);
        visitLink.textContent = 'Website ↗';
        visitLink.style.cssText = 'color: var(--accent); text-decoration: none; font-size: 0.9rem;';

        linksDiv.append(visitLink);
        visitCell.appendChild(linksDiv);

        row.append(nameCell, splitCell, accountCell, tokenCell, payoutCell, priceCell, visitCell);
        fragment.appendChild(row);
    });

    // Single DOM insertion
    tableBody.appendChild(fragment);

    // Observe each row for Firm Card Viewed once rows are in the DOM
    setupFirmCardObservers();
};

// -----------------------------------------
// 5. IntersectionObserver — section and card visibility
// -----------------------------------------
/**
 * Fires Firm List Viewed when the firms section enters the viewport,
 * and Tool Section Viewed when the data-tools section enters the viewport.
 * Each observer fires once then disconnects.
 */
const setupSectionObservers = () => {
    const opts = { threshold: 0.1, rootMargin: '0px 0px -10% 0px' };

    const firmsSection = document.getElementById('firms');
    if (firmsSection) {
        const firmsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                amplitude.track('Firm List Viewed', {
                    'list name': SECTION_META['firms'].name,
                    'list position': SECTION_META['firms'].position
                });
                firmsObserver.unobserve(entry.target);
            });
        }, opts);
        firmsObserver.observe(firmsSection);
    }

    const toolsSection = document.getElementById('data-tools');
    if (toolsSection) {
        const toolsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                amplitude.track('Tool Section Viewed', {
                    'section name': SECTION_META['data-tools'].name,
                    'section position': SECTION_META['data-tools'].position
                });
                toolsObserver.unobserve(entry.target);
            });
        }, opts);
        toolsObserver.observe(toolsSection);
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
            amplitude.track('Firm Card Viewed', {
                'firm id': toFirmId(firmName),
                'firm name': firmName,
                'firm rank': firmRank,
                'list position': firmRank
            });
            cardObserver.unobserve(row);
        });
    }, { threshold: 0.5 });

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

// -----------------------------------------
// 7. Event Delegation — smooth scroll + analytics
// -----------------------------------------
const setupEventDelegation = () => {
    document.body.addEventListener('click', (/** @type {MouseEvent} */ event) => {
        if (!(event.target instanceof HTMLElement)) return;

        /** @type {HTMLAnchorElement|null} */
        const anchor = event.target.closest('a');

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

        // Firm Selected + Firm Website Opened — website links inside the firms table
        if (anchor && anchor.href && anchor.closest('#firm-table-body')) {
            const row = anchor.closest('tr');
            const firmName = row?.dataset.firmName ?? '';
            const firmRank = parseInt(row?.dataset.firmRank ?? '0', 10);
            const firm = AppState.propFirms.find(f => f.name === firmName);

            if (firm) {
                const firmId = toFirmId(firm.name);
                let hostname = '';
                try { hostname = new URL(firm.website).hostname; } catch (_) {}

                amplitude.track('Firm Selected', {
                    'firm id': firmId,
                    'firm name': firm.name,
                    'selection source': 'website_link',
                    'list position': firmRank
                });

                amplitude.track('Firm Website Opened', {
                    'firm id': firmId,
                    'firm name': firm.name,
                    'destination domain': hostname,
                    'is affiliate link': firm.isAffiliate,
                    'clickout placement': 'comparison_table'
                });

                // Set Activation Status user property on first firm clickout (once per browser)
                if (!localStorage.getItem('amp_activated')) {
                    localStorage.setItem('amp_activated', '1');
                    const identifyObj = new amplitude.Identify();
                    identifyObj.set('Activation Status', 'activated');
                    amplitude.identify(identifyObj);
                }
            }
            return;
        }

        // Resource Link Opened — outbound links inside article cards in content sections
        if (anchor && anchor.href) {
            const section = anchor.closest('section');
            const card = anchor.closest('.article-card');
            if (section && card && RESOURCE_SECTION_IDS.has(section.id)) {
                const title = card.querySelector('h3')?.textContent?.trim() ?? '';
                const type = card.querySelector('.card-tag')?.textContent?.trim()?.toLowerCase() ?? '';
                let hostname = '';
                try { hostname = new URL(anchor.href).hostname; } catch (_) {}

                amplitude.track('Resource Link Opened', {
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
    try {
        amplitude.initAll('488e252410ff9dc7ba7cfd5efac999f1', {
            "analytics": { "autocapture": true },
            "sessionReplay": { "sampleRate": 1 }
        });
    } catch (e) {
        console.error("Amplitude init failure:", e);
    }

    // Initialize UI — errors here are reported to Amplitude
    try {
        renderPropFirmsTable();
        setupSectionObservers();
        setupMobileNav();
        setupEventDelegation();
    } catch (e) {
        console.error("App initialization failure:", e);
        try {
            amplitude.track('Error Encountered', {
                'error category': 'initialization',
                'error message': e?.message ?? 'Unknown error',
                'error context': 'DOMContentLoaded setup',
                'error code': null,
                'http status code': null
            });
        } catch (_) {}
    }
});
