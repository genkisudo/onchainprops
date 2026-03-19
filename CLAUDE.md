# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Onchain Prop Firm Directory** is a static site comparing top onchain prop trading firms. It's built with vanilla JavaScript (ES2022+), HTML5, and CSS without external dependencies or frameworks. The architecture emphasizes reactive state management, encapsulation via Web Components, and performant DOM operations.

## Quick Start

**Local development server:**
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000`.

The site is entirely static and renders immediately—no build step required.

## Key Architectural Patterns

### 1. **PubSub Store (Reactive State)**
- Single `Store` instance (PubSub class) manages all state changes
- State updates are published as events, not directly mutated in DOM
- Components subscribe to events and react accordingly
- Example: `Store.publish('FAQ_TOGGLED', faqId)` triggers accordion collapse/expand logic
- **Key rule**: Never read the DOM to determine state. Use `AppState` as the single source of truth.

### 2. **Web Components (Native Encapsulation)**
- Custom element `<faq-accordion>` is defined as a class extending `HTMLElement`
- Uses Shadow DOM for style and markup encapsulation (prevents CSS conflicts)
- Template is defined as a `<template>` element with scoped `<style>`
- Each FAQ accordion maintains its own `isOpen` state and subscribes to global `FAQ_TOGGLED` events
- ARIA attributes are dynamically generated to ensure accessibility (unique IDs for each accordion)

### 3. **Performant DOM Rendering**
- Table rows are built via `DocumentFragment` before insertion to minimize repaints
- Bulk insertions use `appendChild(fragment)` to batch DOM operations
- `requestAnimationFrame` is used for smooth accordion animations (calculating `scrollHeight`)
- Event delegation is used for global behaviors (e.g., smooth scrolling) instead of per-element listeners

### 4. **CSS Custom Properties (Theming)**
- Theme colors, sizes, and spacing are defined as CSS variables at `:root` level in `style.css`
- Examples: `--accent`, `--bg-card`, `--text-primary`, `--border-color`, `--radius-md`
- Components (including Web Components) reference these variables, enabling consistent dark-mode styling
- Shadow DOM components inherit CSS custom properties from the host document

### 5. **SEO & Accessibility**
- JSON-LD schema markup embedded in `<head>` for FAQ structured data (for Google and AI search engines)
- Semantic HTML5 tags (`<header>`, `<main>`, `<section>`, `<table>`, etc.)
- ARIA attributes dynamically applied: `aria-expanded`, `aria-controls`, `aria-labelledby`, `aria-live` (where appropriate)
- All interactive elements are keyboard navigable
- Color contrast meets WCAG standards

## File Structure

- **`index.html`** – Semantic shell with navigation, hero, sections, FAQ scaffolding, and JSON-LD schema markup
- **`style.css`** – Global styles, CSS custom properties, dark-mode theming (glassmorphism, gradients), responsive grid
- **`script.js`** – PubSub Store, AppState, FaqAccordion Web Component, table rendering, event delegation, smooth scroll
- **`GEMINI.md`** – Detailed architectural rules and coding standards for the project (reference for major design decisions)
- **`README.md`** – User-facing overview of the project and its design principles

## Development Guidelines

### Making Changes

1. **Adding or updating firm data**: Modify `AppState.propFirms` array in `script.js`. The table will re-render on page load.
2. **Styling changes**: Update `style.css` or CSS custom properties at `:root`. Web Components will inherit theme changes automatically.
3. **New interactive features**: Default to Web Components (custom elements) for reusable UI. Follow the `FaqAccordion` pattern: encapsulate template, styles, and logic in a single class.
4. **State management**: Always publish events via `Store.publish()` rather than directly mutating AppState. Let subscribers react.

### Testing Checklist

- **Keyboard navigation**: Tab through the page; ensure all buttons and links are accessible
- **Screen reader**: Test with VoiceOver (macOS) or NVDA to verify ARIA attributes and semantic structure
- **Responsive design**: Check mobile (320px), tablet (768px), and desktop (1440px) breakpoints
- **Dark mode**: Verify CSS custom properties render correctly and no hardcoded colors override theming
- **FAQ accordion**: Ensure only one accordion is open at a time (PubSub state sync)
- **SEO/Schema**: Inspect JSON-LD in browser dev tools; validate at schema.org/validator

### Code Style & Conventions

- **JSDoc comments** are used to simulate type safety. Document complex functions with parameter and return types.
- **Optional chaining (`?.`) and nullish coalescing (`??`)** prevent null reference errors.
- **Error handling**: Wrap async calls in `try/catch`; PubSub subscribers catch errors internally.
- **No external dependencies**: Stick to native Web APIs (Fetch, DOM, Web Storage, Web Components).
- **Readable, minimal code**: Avoid over-abstraction. One-off utilities are fine; don't prematurely refactor into reusable helpers.

## Key Classes & Objects

| Name | Purpose |
|------|---------|
| `PubSub` | Event emitter managing subscriptions and publishing state changes |
| `Store` | Singleton PubSub instance (global event bus) |
| `AppState` | Object holding firm data and active FAQ state |
| `FaqAccordion` | Custom element for FAQ accordions (Shadow DOM encapsulated) |
| `renderPropFirmsTable()` | Function that builds and inserts table rows via DocumentFragment |

## Important Events

- **`FAQ_TOGGLED`** – Published when an FAQ accordion is clicked, carries the active FAQ ID (or `null` to close all)

## Common Tasks

**Modify firm data:**
```javascript
AppState.propFirms.push({ name: "NewFirm", split: "90%", maxAccount: "$500,000", website: "https://...", chain: "Base" });
// Refresh page or call renderPropFirmsTable() if dynamic
```

**Change theme colors:**
Update CSS custom properties in `:root` in `style.css`:
```css
--accent: #6ee7b7;  /* mint green */
--bg-card: rgba(255,255,255,0.03);
```

**Add a new Web Component:**
1. Define a template with scoped styles
2. Create a class extending `HTMLElement`
3. Implement `connectedCallback()`, `disconnectedCallback()` lifecycle methods
4. Subscribe to relevant `Store` events
5. Register with `customElements.define('tag-name', ClassName)`

## Deployment

The site is static and ready for direct deployment to any static host (GitHub Pages, Vercel, Netlify, etc.). No build or CI/CD required—just serve the files as-is.

---

**See also:** `GEMINI.md` for detailed architectural rules and design philosophy.
