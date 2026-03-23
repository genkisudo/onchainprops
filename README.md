# Onchain Prop Firm Directory

A modern, high-performance static directory comparing the top Onchain Prop Trading firms. 
Built strictly with Vanilla JavaScript in adherence to the latest ES2022 standards. Designed specifically without heavy frameworks (React, Vue, etc.) to minimize overhead while retaining dynamic state reactivity, modern encapsulation, and maximum SEO visibility.

## Architectural Principles

This application adopts the structured paradigms laid out in `GEMINI.md`:

1. **Zero External Dependencies**: Pure native API implementation. No external layout libraries or Javascript frameworks were introduced. State updates strictly map to raw JS primitives.
2. **Reactive Architecture**: A lightweight `PubSub` mechanism serves as the single-source-of-truth. Dispatches update elements via `Store.publish(event)`, eliminating brittle DOM-scraping state retrieval.
3. **Native Encapsulation (Web Components)**: Reusable structures like the Interactive FAQs have been abstracted out into `<faq-accordion>` custom elements inheriting `HTMLElement`, encapsulated inside a Shadow DOM and dynamically generating its accessibility requirements. 
4. **Performant DOM Loading**: All large scale list rendering operations are pushed through a `DocumentFragment` before painting to avoid layout thrashing and reflow bottlenecks. Global listeners rely on Event Delegation mapped entirely from the top layer `<body>`.
5. **A11y (Accessibility) Defaults**: All buttons, links, and state toggles correctly reflect implicit `aria-*` tags verified to work flawlessly via keyboard mapping.
6. **Defensive/Typed Contexts**: Strict JSDoc definition mapping `try/catch` wrapping and Optional Chaining to prevent execution failure in unstructured edge-case environments.

## Getting Started

Because the stack relies completely on pure web deliverables (`index.html`, `style.css`, `script.js`), getting started is effectively instantaneous. 

You can view the project in a live environment utilizing Python's built-in web server:

```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` to review the site layout.

## Project Structure

* **`index.html`**: The semantic shell, defining SEO meta configuration. It consumes standard semantic containers and `<faq-accordion>` custom DOM abstractions. Embedded with explicitly defined JSON-LD Schema implementations for programmatic indexing.
* **`style.css`**: Defines dynamic CSS Custom Property tokens (`:root`) encompassing the modern dark-mode implementation (glassmorphism via `backdrop-filter`, radial gradients, precise grid architectures).
* **`script.js`**: Houses the `PubSub` data store, rendering engine for dynamic nodes (`DocumentFragment`), the `FaqAccordion` Web Component extension, and unified event delegates handling smooth-scrolling routines gracefully.

## Open Source & Contributing

This is an **open source project**. We welcome contributions from the community!

You can help by:
- **Adding a new prop trading firm**: Submit a PR to add a new firm to the directory
- **Adding an onchain tool**: Contribute additional tools and resources to the ecosystem
- **Improving documentation**: Help clarify or expand our guides
- **Bug fixes & features**: Submit PRs for any improvements or fixes you discover

Simply fork the repository, make your changes, and create a pull request. All contributions are appreciated!

---

<div align="center">

### 🚀 From the trenches with ❤️

</div>

