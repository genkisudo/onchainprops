# Architectural Refactor: Modern Vanilla Principles

## Context & Reason for Change
The codebase was initially built as a static MVP without adhering to the newly mandated architectural workflows. In response to the latest standard operating procedures specified in `GEMINI.md`, this PR retrofits the frontend stack to strictly align with the mandated 8 principles, ensuring scalability, type-safety via JSDoc, implicit accessibility, and explicit performance safeguards out of the box.

## Technical Approach
* **Rule 1 (Strict Vanilla)**: No external dependencies introduced. Adopted modern ES2022+ features like optional chaining.
* **Rule 2 (PubSub Reactive)**: Created a core `PubSub` datastore to cleanly manage overarching UI state changes. The DOM is no longer queried to discover if an FAQ is active; instead, it subscribes to `Store.publish('FAQ_TOGGLED')`.
* **Rule 3 (Web Components)**: Re-architected the cascading interactive FAQ list into a natively registered Web Component (`<faq-accordion>`) encapsulating its own Shadow DOM context. Encapsulated styling securely wraps to ensure CSS mappings cannot bleed or clash.
* **Rule 4 (Performant DOM)**: Migrated the firm comparison list iterator table rendering process to bulk append via `DocumentFragment` before injecting into the live DOM tree to strictly avoid layout thrashing anomalies. Addressed broad click listeners through a comprehensive `body` mapping using Event Delegation.
* **Rule 5 (Single Source of Truth)**: The application behaves reliably via reading state from `AppState`, entirely removing any `<element>.getAttribute()` queries serving as makeshift state placeholders.
* **Rule 6 (Defensive/Typed)**: Interlaced code blocks with detailed JSDoc `@typedef` annotations and robust typecasting references enabling safe IDE evaluation. System logic is wrapped safely inside defensive `try/catch` contexts mapping failure conditions.
* **Rule 7 (A11y)**: Configured implicit `<faq-accordion>` lifecycle handlers mapping `aria-controls`, `aria-labelledby`, and dynamic `aria-expanded` toggle behavior ensuring complete screen-reader compatibility and automated Keyboard navigability standards.

## Testing / Verification Steps
1. Checkout the branch locally.
2. Spin up a static web server: `python3 -m http.server 8000`.
3. Verify visual symmetry and functionality rendering equivalently against staging/mock configurations.
4. Execute exclusively utilizing keyboard `Tab` + `Space/Enter` mechanics to ascertain the `<faq-accordion>` components dynamically bind and capture standard focus mechanics seamlessly reflecting A11y metrics.
5. While operating Chrome DevTools: utilize the *Paint Flashing / Rendering* profile tab to concretely evaluate layout modifications verify synchronously eliminating repaints.
