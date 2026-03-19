# Prompt: Onchain Prop Firm Directory

**Role:** Act as an expert frontend developer and SEO/AI-search optimization specialist.

**Objective:** Build a responsive, modern website listing "Onchain Prop Trading Firms" using strictly **Vanilla HTML, CSS, and JavaScript** (no external frameworks like React, Vue, or Tailwind). 

## Design & Styling Guidelines
* **Theme:** Deep dark mode inspired by modern crypto/Web3 platforms. Use a very dark background (e.g., `#0a0a0a`), slightly lighter dark gray for cards/containers (e.g., `#111111`), and crisp white for primary text.
* **Accents:** Use a mint green/teal color (e.g., `#6EE7B7` or similar) for hover states, icons, and primary buttons.
* **Typography:** Use a modern, clean sans-serif font (like Inter or Roboto via Google Fonts). Use bold weights for headings and soft gray for secondary descriptive text.
* **Aesthetic:** Clean, minimalist, and spacious. Use rounded corners (border-radius) for containers, tables, and buttons to mimic a polished Web3 dashboard.

## Core Sections & Features

1. **Hero Section:** * A bold centered heading (e.g., "Compare Top Onchain Prop Trading Firms").
   * A brief, SEO-friendly subtitle explaining what the page is about.

2. **The Comparison Directory (Table Structure):**
   * Create a clean, responsive table (or CSS Grid mimicking a table) listing the prop firms.
   * **Columns required:** Firm Name, Profit Split (%), Max Account Size ($), Website Link (styled as a text link), and an action column with a "More Details" button.
   * Populate the table with an array of 4-5 mock objects in JavaScript (so it can be easily updated later) and render it to the DOM dynamically. 
   * Style the "More Details" button as a modern, pill-shaped button with the mint green accent color on hover.

3. **FAQ Section:**
   * Create an interactive FAQ section below the table using Vanilla JavaScript to make them open/close (accordion style). 
   * Include 3-4 common questions related to onchain prop trading (e.g., "What is an onchain prop firm?", "How do crypto payouts work?").

## SEO & AI Visibility Optimization
* **Semantic HTML:** Use proper HTML5 tags (`<header>`, `<main>`, `<section>`, `<table>`, `<th>`, `<td>`, `<footer>`).
* **Meta Tags:** Include a descriptive `<title>`, `<meta name="description">`, and proper viewport tags.
* **Schema Markup (JSON-LD):** Inject an SEO-optimized JSON-LD script in the `<head>` containing an `FAQPage` schema for the FAQ section, to ensure high visibility in Google Search and AI-driven search engines (like Perplexity, Google SGE).
* **Accessibility:** Add standard `aria-labels` on buttons and links. Ensure high color contrast.

## Output Requirements
Please provide the complete code. You can output it as a single `index.html` file containing the `<style>` and `<script>` blocks for ease of testing, or split it into `index.html`, `style.css`, and `script.js`. Ensure the JavaScript is clean, modern (ES6+), and well-commented.

These rules dictate the architectural and coding standards for this project. When generating, explaining, or refactoring code, adhere strictly to the following principles:

## 1. Strict Modern Vanilla (Zero Dependencies)
**Rule:** Assume a modern browser environment (ES2022+). Rely exclusively on native Web APIs (Fetch, Web Storage, modern DOM APIs). Never introduce external libraries or frameworks unless explicitly requested.

## 2. Reactive Architecture (PubSub/Observer)
**Rule:** Since there is no framework, manage state reactivity using a PubSub (Publish/Subscribe) or Observer pattern. State changes must emit events, and UI components must listen to those events to update themselves. Never tightly couple a state update directly to a DOM mutation in the same function.

## 3. Native Encapsulation (Web Components)
**Rule:** For complex, reusable UI elements, default to using standard Web Components (Custom Elements, Shadow DOM, `<template>`). Keep component-specific CSS and logic strictly encapsulated within its class.

## 4. Performant DOM Interactions
**Rule:** Minimize layout thrashing and repaints. 
* Use `DocumentFragment` for bulk DOM insertions.
* Strictly enforce **Event Delegation** on parent containers instead of attaching listeners to individual child nodes.
* Use `requestAnimationFrame` for any JS-driven animations or scroll-bound DOM updates.

## 5. Single Source of Truth (No DOM Scraping)
**Rule:** Maintain application state within JavaScript. The DOM is a reflection of the state, not the state itself. Never read the DOM (e.g., checking `innerHTML` or checking if a class exists) to determine what the current data is. Use `data-*` attributes only to bridge JS state to specific elements.

## 6. Defensive & Typed Execution
**Rule:** Write resilient code. Use modern operators (`?.`, `??`) to prevent null reference errors. Validate function parameters and wrap `async/await` network calls in `try/catch` blocks. Add JSDoc comments to complex functions to simulate type-safety and provide clear editor Intellisense.

## 7. Accessibility (a11y) as a Default
**Rule:** Dynamically generated HTML must be strictly semantic. Automatically include and manage necessary ARIA attributes (`aria-expanded`, `aria-hidden`, `aria-live`). Ensure all interactive elements are fully navigable via keyboard.

## 8. Version Control & PR Hygiene
**Rule:** Treat version control with rigor. For every major change, refactor, or new feature, ensure corresponding tests are written or updated. When outlining changes, structure them so they easily translate into a well-documented Pull Request, including: the context/reason for the change, a summary of the technical approach, and clear testing/verification steps.