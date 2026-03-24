/**
 * @file script.js
 * @description State-driven application logic implementing Reactive PubSub, 
 * Web Components, and performant DocumentFragment manipulations.
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
 * @property {string} twitter
 * @property {string} chain
 */

const AppState = {
    /** @type {PropFirm[]} */
    propFirms: [
        { name: "Carrot Funding", split: "85%", maxAccount: "$500,000", website: "https://carrotfunding.io/", twitter: "https://x.com/carrotfunding", chain: "Solana/Hyperliquid" },
        { name: "ProprXYZ", split: "90%", maxAccount: "$1,000,000", website: "https://www.propr.xyz/", twitter: "https://x.com/ProprXYZ", chain: "Hyperliquid" },
        { name: "GT Funded", split: "92%", maxAccount: "$300,000", website: "https://gtfunded.xyz/", twitter: "https://x.com/gtfundedxyz", chain: "Hyperliquid/Arbitrum" },
        { name: "Foxify", split: "80%", maxAccount: "$10,000", website: "https://www.foxify.trade/", twitter: "https://x.com/foxifytrade", chain: "Multi-chain (Hyperliquid, dYdX)" },
        { name: "Xybit", split: "80%", maxAccount: "$100,000", website: "https://www.xybitfunds.com/", twitter: "https://x.com/xybitfunds", chain: "Hyperliquid" },
        { name: "Vanta Trading", split: "100%", maxAccount: "$100,000", website: "https://vantatrading.io/?ref=kamil", twitter: "https://x.com/VantaTrading", chain: "Hyperliquid" }
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
        } else {
            Store.publish('FAQ_TOGGLED', this.faqId);
            this.open();
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
        visitLink.href = firm.website;
        visitLink.target = '_blank';
        visitLink.rel = 'noopener noreferrer';
        visitLink.setAttribute('aria-label', `Visit ${firm.name} website`);
        visitLink.textContent = 'Website ↗';
        visitLink.style.cssText = 'color: var(--accent); text-decoration: none; font-size: 0.9rem;';

        const twitterLink = document.createElement('a');
        twitterLink.href = firm.twitter;
        twitterLink.target = '_blank';
        twitterLink.rel = 'noopener noreferrer';
        twitterLink.setAttribute('aria-label', `Follow ${firm.name} on X/Twitter`);
        twitterLink.textContent = 'X ↗';
        twitterLink.style.cssText = 'color: var(--accent); text-decoration: none; font-size: 0.9rem;';

        linksDiv.append(visitLink, twitterLink);
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

            const targetElement = document.querySelector(anchor);
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
    });
};

// -----------------------------------------
// Initialization
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    try {
        renderPropFirmsTable();
        setupMobileNav();
        setupEventDelegation();
    } catch (e) {
        console.error("Initialization failure", e);
    }
});
