Issues Found: 20

Summary: This is a well-structured vanilla JS static website with good foundational patterns (PubSub state management, Web Components, DocumentFragment rendering, ARIA accessibility). However, the review identified 20 issues across 4 categories: 1 high-severity bug (missing rel/target on external links enabling tab-napping), 4 medium-severity security gaps (no CSP, no URL validation, unvalidated querySelector input, mutable global state), 2 medium-severity bugs (FAQ resize breakage, 13 placeholder links in production), 1 medium-severity performance issue (excessive backdrop-filter usage), and 12 low-severity issues covering dead CSS code, inline styles in JS, render-blocking fonts, non-unique ARIA IDs, and silent error swallowing. The most critical fix needed is adding target='_blank' and rel='noopener noreferrer' to the detailsLink in script.js. For a financial/crypto site, adding a CSP, Privacy Policy, and clickjacking protection should be prioritized.


🟠 HIGH (1)
------------------------------

[bug] script.js:270
  The 'More Details' link (detailsLink) is missing target='_blank' and rel='noopener noreferrer', unlike the 'Visit Site' link. This causes same-tab navigation and exposes window.opener to external sites (tab-napping).
  💡 Add detailsLink.target = '_blank' and detailsLink.rel = 'noopener noreferrer' after line 271, mirroring the visitLink pattern at lines 263-264.

🟡 MEDIUM (7)
------------------------------

[security] index.html:1
  No Content Security Policy (CSP) meta tag or headers. Any injected script from any origin would execute freely with no second line of defense.
  💡 Add a CSP meta tag to <head>: <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self';">

[security] script.js:261
  No URL protocol validation on firm.website before assigning to href. If data source ever becomes dynamic, javascript: URIs would execute arbitrary code.
  💡 Add a URL validation function that only allows https: protocol before setting href values.

[security] script.js:317
  Unvalidated anchor string from getAttribute('href') passed directly to document.querySelector(). Could throw or be exploited if DOM attributes are dynamically injected.
  💡 Validate with a regex before passing to querySelector: if (!/^#[a-zA-Z][\w-]*$/.test(anchor)) return;

[security] script.js:66
  AppState is a globally mutable plain object. Any script on the page (extensions, injected scripts) can overwrite propFirms data including website URLs.
  💡 Use Object.freeze() on AppState and its propFirms array, or wrap in a module pattern with private scope.

[bug] script.js:209
  FAQ accordion max-height is set to scrollHeight at open time but never recalculated on window resize. Content may overflow or be clipped if viewport changes while FAQ is open.
  💡 Add a resize observer or window resize listener that recalculates max-height for the currently open FAQ item.

[performance] style.css:141
  backdrop-filter: blur() is applied to 6+ elements (navbar, mobile nav, pill badge, table container, article cards, FAQ items). Each creates a separate compositing layer causing jank on low-end mobile devices.
  💡 Reduce backdrop-filter usage to only the navbar (most impactful). Use solid semi-transparent backgrounds for other elements.

[bug] index.html:118
  13 article cards and the Privacy Policy footer link use placeholder href='#' — non-functional links shipped to production. Missing Privacy Policy is a regulatory concern for a financial site.
  💡 Replace placeholder links with real URLs or use <button> elements for non-navigational cards. Implement a Privacy Policy page.

🟢 LOW (12)
------------------------------

[security] index.html:1
  No X-Frame-Options or frame-ancestors CSP directive — the site can be embedded in iframes for clickjacking attacks.
  💡 Add frame-ancestors 'none' to CSP directive or configure X-Frame-Options: DENY server header.

[security] index.html:10
  Google Fonts loaded from external CDN leaks user IP address and referrer to Google on every page load — privacy concern for crypto/financial users.
  💡 Self-host the Inter and Outfit font files from the same origin to eliminate third-party tracking.

[bug] index.html:248
  Copyright year is hardcoded as 2024 and is already outdated.
  💡 Use JavaScript to dynamically set the year, or update to the current year.

[bug] robots.txt:3
  robots.txt references sitemap.xml which does not exist in the repository, causing 404 errors for search engine crawlers.
  💡 Either create a sitemap.xml file or remove the Sitemap directive from robots.txt.

[performance] style.css:16
  CSS variable --transition uses 'all 0.3s' which forces the browser to check every animatable property on transitions. Used broadly across many elements.
  💡 Scope transitions to specific properties: e.g., 'transition: transform 0.3s, opacity 0.3s, border-color 0.3s'.

[performance] index.html:12
  Google Fonts CSS is loaded synchronously in <head>, blocking first paint on slow connections.
  💡 Use <link rel='preload' as='style'> with onload swap pattern, or self-host fonts to eliminate the external request.

[style] script.js:156
  Math.random() used for ARIA IDs is non-cryptographic and doesn't guarantee uniqueness. Collisions would break accessibility aria-controls/aria-labelledby linkages.
  💡 Use a static counter: static #counter = 0; this.faqId = `faq-${FaqAccordion.#counter++}`;

[style] style.css:456
  ~55 lines of dead CSS code (.faq-item, .faq-question, .faq-icon, .faq-answer classes) are never used — the FAQ uses a Web Component with Shadow DOM styling instead.
  💡 Remove the unused .faq-item, .faq-question, .faq-icon, and .faq-answer CSS rules (lines 456-511).

[style] script.js:248
  Inline styles via style.cssText in JavaScript (chainDiv and detailsLink) mix presentation with logic instead of using CSS classes.
  💡 Create CSS classes (e.g., .chain-label, .btn-details) and apply them via className instead of inline styles.

[style] script.js:82
  faqTemplate.innerHTML uses raw HTML string assignment, contradicting the project's own stated principle of 'Build cells via DOM API to prevent XSS injection'. Footgun risk if a developer later interpolates dynamic content.
  💡 Add a prominent code comment warning against interpolating dynamic data. Consider migrating to DOM API construction for the template.

[bug] script.js:345
  Initialization try/catch swallows all errors with only console.error. If renderPropFirmsTable() fails, users see an empty table with no visible indication.
  💡 Add a user-visible fallback message in the table body when rendering fails, e.g., 'Unable to load firm data'.

[style] script.js:20
  PubSub.subscribe() returns undefined instead of a dispose/unsubscribe function. Callers must manually track callback references for cleanup.
  💡 Return an unsubscribe function from subscribe(): return () => this.unsubscribe(eventName, callback);