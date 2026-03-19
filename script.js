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
        { name: "HyperProp", split: "90%", maxAccount: "$500,000", website: "https://example.com/hyperprop", chain: "Arbitrum/Hyperliquid" },
        { name: "DeFi Fund", split: "85%", maxAccount: "$250,000", website: "https://example.com/defifund", chain: "Solana" },
        { name: "ChainTraders", split: "80%", maxAccount: "$1,000,000", website: "https://example.com/chaintraders", chain: "Ethereum L2s" },
        { name: "Apex Onchain", split: "95%", maxAccount: "$300,000", website: "https://example.com/apex", chain: "Base" },
        { name: "Quantum Capital", split: "85%", maxAccount: "$100,000", website: "https://example.com/quantum", chain: "Optimism" }
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
        
        this.faqId = `faq-${Math.random().toString(36).substr(2, 9)}`;
        this.isOpen = false;
        
        this.toggle = this.toggle.bind(this);
    }

    connectedCallback() {
        // Set up accessibility and DOM
        this.btn.setAttribute('aria-controls', `content-${this.faqId}`);
        this.content.setAttribute('id', `content-${this.faqId}`);
        this.questionText.textContent = this.getAttribute('question');
        
        // Event Listeners
        this.btn.addEventListener('click', this.toggle);
        
        // Subscribe to global FAQ state changes
        Store.subscribe('FAQ_TOGGLED', (/** @type {string|null} */ activeId) => {
            if (activeId !== this.faqId && this.isOpen) {
                this.close();
            }
        });
    }

    disconnectedCallback() {
        this.btn.removeEventListener('click', this.toggle);
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
        
        row.innerHTML = `
            <td>
                <div class="firm-name">${firm.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${firm.chain}</div>
            </td>
            <td class="val-highlight">${firm.split}</td>
            <td class="val-highlight">${firm.maxAccount}</td>
            <td><a href="${firm.website}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${firm.name}">Visit Site ↗</a></td>
            <td><a href="${firm.website}" aria-label="More details about ${firm.name}" class="btn btn-primary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">More Details</a></td>
        `;
        
        fragment.appendChild(row);
    });

    // Single DOM insertion
    tableBody.appendChild(fragment);
};

// -----------------------------------------
// 5. Event Delegation for smooth scroll
// -----------------------------------------
const setupEventDelegation = () => {
    const body = document.body;
    
    body.addEventListener('click', (/** @type {MouseEvent} */ event) => {
        /** @type {HTMLElement|null} */
        const target = event.target;
        
        if (target?.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
            const anchor = target.getAttribute('href');
            if (anchor === '#') return;

            const targetElement = document.querySelector(anchor);
            if (targetElement) {
                event.preventDefault();
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
        setupEventDelegation();
    } catch (e) {
        console.error("Initialization failure", e);
    }
});
