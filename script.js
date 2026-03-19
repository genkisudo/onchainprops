document.addEventListener('DOMContentLoaded', () => {

    // 1. Mock Data for OnChain Prop Firms
    const propFirms = [
        {
            name: "HyperProp",
            split: "90%",
            maxAccount: "$500,000",
            website: "https://example.com/hyperprop",
            chain: "Arbitrum/Hyperliquid"
        },
        {
            name: "DeFi Fund",
            split: "85%",
            maxAccount: "$250,000",
            website: "https://example.com/defifund",
            chain: "Solana"
        },
        {
            name: "ChainTraders",
            split: "80%",
            maxAccount: "$1,000,000",
            website: "https://example.com/chaintraders",
            chain: "Ethereum L2s"
        },
        {
            name: "Apex OnChain",
            split: "95%",
            maxAccount: "$300,000",
            website: "https://example.com/apex",
            chain: "Base"
        },
        {
            name: "Quantum Capital",
            split: "85%",
            maxAccount: "$100,000",
            website: "https://example.com/quantum",
            chain: "Optimism"
        }
    ];

    // 2. Render the Comparison Table Dynamically
    const tableBody = document.getElementById('firm-table-body');

    if (tableBody) {
        propFirms.forEach(firm => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>
                    <div class="firm-name">${firm.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${firm.chain}</div>
                </td>
                <td class="val-highlight">${firm.split}</td>
                <td class="val-highlight">${firm.maxAccount}</td>
                <td><a href="${firm.website}" target="_blank" rel="noopener noreferrer">Visit Site ↗</a></td>
                <td><a href="${firm.website}" class="btn btn-primary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">More Details</a></td>
            `;

            tableBody.appendChild(row);
        });
    }

    // 3. FAQ Accordion Interactivity
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            const answer = question.nextElementSibling;

            // Close all other accordions (Optional, but good UX)
            faqQuestions.forEach(q => {
                if (q !== question) {
                    q.setAttribute('aria-expanded', 'false');
                    q.nextElementSibling.style.maxHeight = null;
                }
            });

            // Toggle current accordion
            question.setAttribute('aria-expanded', !isExpanded);

            if (!isExpanded) {
                // Determine the height needed
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    // 4. Smooth Scrolling for Internal Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
