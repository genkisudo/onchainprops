# Prompt: On-Chain Prop Firm Directory

**Role:** Act as an expert frontend developer and SEO/AI-search optimization specialist.

**Objective:** Build a responsive, modern website listing "On-Chain Prop Trading Firms" using strictly **Vanilla HTML, CSS, and JavaScript** (no external frameworks like React, Vue, or Tailwind). 

## Design & Styling Guidelines
* **Theme:** Deep dark mode inspired by modern crypto/Web3 platforms. Use a very dark background (e.g., `#0a0a0a`), slightly lighter dark gray for cards/containers (e.g., `#111111`), and crisp white for primary text.
* **Accents:** Use a mint green/teal color (e.g., `#6EE7B7` or similar) for hover states, icons, and primary buttons.
* **Typography:** Use a modern, clean sans-serif font (like Inter or Roboto via Google Fonts). Use bold weights for headings and soft gray for secondary descriptive text.
* **Aesthetic:** Clean, minimalist, and spacious. Use rounded corners (border-radius) for containers, tables, and buttons to mimic a polished Web3 dashboard.

## Core Sections & Features

1. **Hero Section:** * A bold centered heading (e.g., "Compare Top On-Chain Prop Trading Firms").
   * A brief, SEO-friendly subtitle explaining what the page is about.

2. **The Comparison Directory (Table Structure):**
   * Create a clean, responsive table (or CSS Grid mimicking a table) listing the prop firms.
   * **Columns required:** Firm Name, Profit Split (%), Max Account Size ($), Website Link (styled as a text link), and an action column with a "More Details" button.
   * Populate the table with an array of 4-5 mock objects in JavaScript (so it can be easily updated later) and render it to the DOM dynamically. 
   * Style the "More Details" button as a modern, pill-shaped button with the mint green accent color on hover.

3. **FAQ Section:**
   * Create an interactive FAQ section below the table using Vanilla JavaScript to make them open/close (accordion style). 
   * Include 3-4 common questions related to on-chain prop trading (e.g., "What is an on-chain prop firm?", "How do crypto payouts work?").

## SEO & AI Visibility Optimization
* **Semantic HTML:** Use proper HTML5 tags (`<header>`, `<main>`, `<section>`, `<table>`, `<th>`, `<td>`, `<footer>`).
* **Meta Tags:** Include a descriptive `<title>`, `<meta name="description">`, and proper viewport tags.
* **Schema Markup (JSON-LD):** Inject an SEO-optimized JSON-LD script in the `<head>` containing an `FAQPage` schema for the FAQ section, to ensure high visibility in Google Search and AI-driven search engines (like Perplexity, Google SGE).
* **Accessibility:** Add standard `aria-labels` on buttons and links. Ensure high color contrast.

## Output Requirements
Please provide the complete code. You can output it as a single `index.html` file containing the `<style>` and `<script>` blocks for ease of testing, or split it into `index.html`, `style.css`, and `script.js`. Ensure the JavaScript is clean, modern (ES6+), and well-commented.