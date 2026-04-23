/**
 * @file script.js
 * @description State-driven application logic implementing Reactive PubSub,
 * Web Components, and performant DocumentFragment manipulations.
 */

import * as amplitude from '@amplitude/unified';

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
 */

const AppState = {
    /** @type {PropFirm[]} */
    propFirms: [
        { name: "hyperpnl", split: "80%", maxAccount: "Unlimited", website: "https://app.hyperpnl.com/trade", chain: "Hyperliquid" },
        { name: "Carrot Funding", split: "80%", maxAccount: "$500,000", website: "https://app.carrotfunding.io/join/2VSSOTXBQZ", chain: "gTrade, Hyperliquid (soon)" },
        { name: "ProprXYZ", split: "80%", maxAccount: "$1,000,000", website: "https://www.propr.xyz/", chain: "Hyperliquid" },
        { name: "GT Funded", split: "92%", maxAccount: "$300,000", website: "https://gtfunded.xyz/", chain: "Hyperliquid/Arbitrum" },
        { name: "Foxify", split: "80%", maxAccount: "$10,000", website: "https://www.foxify.trade/", chain: "Multi-chain (Hyperliquid, dYdX)" },
{ name: "Vanta Trading", split: "100%", maxAccount: "$100,000", website: "https://vantatrading.io/?ref=kamil", chain: "Hyperliquid" }
    ],
    /** @type {string|null} */
    activeFaqId: null
};

// -----------------------------------------
// 3. Web Components (Native Encapsulation)
// -----------------------------------------
const faqTemplate = document.createElement('template');
faqTemplate.innerHTML = `
    <style>
        :host {
            display: block;
            border: 1px solid var(--border-color, rgba(255,255,255,0.08));
            border-radius: var(--radius-md, 16px);
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
        }
        button:hover {
            color: var(--accent, #6ee7b7);
        }
        .icon {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: var(--text-secondary, #94a3b8);
        }
        button[aria-expanded="true"] .icon {
            transform: rotate(180deg);
            color: var(--accent, #6ee7b7);
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

        // Event Listeners
        this.btn.addEventListener('click', this.toggle);

        // Subscribe to global FAQ state changes
        Store.subscribe('FAQ_TOGGLED', this._onFaqToggled);
    }

    disconnectedCallback() {
        this.btn.removeEventListener('click', this.toggle);
        Store.unsubscribe('FAQ_TOGGLED', this._onFaqToggled);
    }

    toggle() {
        if (this.isOpen) {
            Store.publish('FAQ_TOGGLED', null); // Setting global state to null closes all
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
            background: var(--accent, #6ee7b7);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 20px rgba(110, 231, 183, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 50;
            color: #020617;
        }

        .feedback-button:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 30px rgba(110, 231, 183, 0.5);
        }

        .feedback-modal {
            position: fixed;
            bottom: 70px;
            right: var(--feedback-right);
            width: 360px;
            background: var(--bg-card, rgba(255, 255, 255, 0.03));
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-lg, 24px);
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
            font-family: 'Outfit', sans-serif;
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
            border-radius: var(--radius-sm, 8px);
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
            border-color: rgba(110, 231, 183, 0.3);
            box-shadow: 0 0 12px rgba(110, 231, 183, 0.1);
        }

        .feedback-submit {
            padding: 0.75rem 1rem;
            background: var(--accent, #6ee7b7);
            color: #020617;
            border: none;
            border-radius: var(--radius-pill, 9999px);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .feedback-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(110, 231, 183, 0.3);
        }

        .feedback-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .feedback-status {
            text-align: center;
            padding: 1rem;
            border-radius: var(--radius-sm, 8px);
            font-size: 0.9rem;
            display: none;
        }

        .feedback-status.success {
            display: block;
            background: rgba(110, 231, 183, 0.1);
            border: 1px solid rgba(110, 231, 183, 0.3);
            color: var(--accent, #6ee7b7);
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
                width: 45px;
                height: 45px;
            }

            .feedback-modal {
                bottom: 60px;
                right: var(--feedback-mobile-right);
                width: 300px;
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
        const minInterval = 30000; // 30 seconds

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

        // Store submission time
        localStorage.setItem('feedback_last_submit', now.toString());

        // Open Telegram with pre-filled message
        const telegramMessage = encodeURIComponent(`Feedback: ${message}${email ? `\n\nEmail: ${email}` : ''}`);
        const telegramUrl = `https://t.me/genki132?start=${telegramMessage}`;
        window.open(telegramUrl, '_blank');

        // Show success message
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
 * Renders the table using a DocumentFragment to minimize repaints
 */
const renderPropFirmsTable = () => {
    const tableBody = document.getElementById('firm-table-body');
    if (!tableBody) return;

    // Use DocumentFragment for batch insertions
    const fragment = document.createDocumentFragment();

    AppState.propFirms.forEach(firm => {
        const row = document.createElement('tr');

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
        splitCell.textContent = firm.split;

        const accountCell = document.createElement('td');
        accountCell.className = 'val-highlight';
        accountCell.textContent = firm.maxAccount;

        const visitCell = document.createElement('td');
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

        row.append(nameCell, splitCell, accountCell, visitCell);
        fragment.appendChild(row);
    });

    // Single DOM insertion
    tableBody.appendChild(fragment);
};

// -----------------------------------------
// 5. Mobile Navigation
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
// 6. Event Delegation for smooth scroll
// -----------------------------------------
const setupEventDelegation = () => {
    const body = document.body;
    
    body.addEventListener('click', (/** @type {MouseEvent} */ event) => {
        if (!(event.target instanceof HTMLElement)) return;

        /** @type {HTMLAnchorElement|null} */
        const target = event.target.closest('a');
        
        if (target && target.getAttribute('href')?.startsWith('#')) {
            const anchor = target.getAttribute('href');
            if (anchor === '#') return;

            let targetElement = null;
            try {
                targetElement = document.querySelector(anchor);
            } catch (_) {
                return; // invalid CSS selector — do nothing
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
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }

        if (target && target.getAttribute('aria-label')?.includes('Visit') && target.href) {
            const firmName = AppState.propFirms.find(f => target.href.includes(f.website))?.name;
            if (firmName) {
                amplitude.track('Website Clicked', { firm: firmName });
            }
        }
    });
};

// -----------------------------------------
// Initialization
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    try {
        amplitude.initAll('488e252410ff9dc7ba7cfd5efac999f1', {
            "analytics": { "autocapture": true },
            "sessionReplay": { "sampleRate": 1 }
        });

        renderPropFirmsTable();
        setupMobileNav();
        setupEventDelegation();
    } catch (e) {
        console.error("Initialization failure", e);
    }
});
