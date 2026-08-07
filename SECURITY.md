# Security Policy

## Security Improvements Applied

This document outlines security enhancements implemented in the OnchainProps project.

### 1. API Key Management

**Issue:** Amplitude API key was exposed in client-side code (script.js)

**Resolution:**
- Moved sensitive configuration to environment variables
- Added `.env.example` template for configuration
- Updated `.gitignore` to prevent accidental commits of `.env` files

**For development:**
```bash
cp .env.example .env
# Edit .env with your actual API key
```

**Note:** For static sites deployed to GitHub Pages, the Amplitude API key must remain client-side. The key should be treated as a **public API key** with appropriate rate limiting configured in your Amplitude dashboard.

### 2. Content Security Policy (CSP)

**Current Implementation:**
- Strict CSP headers defined in `index.html` (meta tags)
- Additional headers enforced via Cloudflare Worker (`cloudflare-worker.js`)
- `default-src 'none'` with explicit whitelists for each resource type

**Headers Applied:**
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy`

### 3. XSS Protection

**Implemented Safeguards:**
- Predominant use of `textContent` over `innerHTML`
- DOM API for dynamic element construction
- Single controlled use of `innerHTML` in FAQ template (static content)

### 4. Subresource Integrity (SRI) - Recommended

**Current State:** `amplitude.min.js` is served locally without SRI hash

**Recommendation:** Add SRI hash to prevent tampering:
```html
<script src="amplitude.min.js"
        integrity="sha384-HASH_HERE"
        crossorigin="anonymous"></script>
```

Generate hash with:
```bash
cat amplitude.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

### 5. Supply Chain Security

**Dependencies:**
- Single dependency: `@amplitude/unified@^1.0.20` (official Amplitude package)
- Lock file committed (`package-lock.json`) for reproducible builds
- No known vulnerabilities (`npm audit` clean)

**Best Practices:**
- Review dependency updates before applying
- Run `npm audit` regularly
- Monitor for security advisories

### 6. GitHub Actions Security

**Workflow Protection:**
- Bot commits prevented from triggering recursive builds
- `[skip ci]` marker in automated commits
- Limited permissions (`contents: write` only)
- No external secrets exposed

## Reporting Security Issues

If you discover a security vulnerability, please report it to the project maintainer privately before public disclosure.

**Contact:** Create a private security advisory on GitHub

## Security Checklist for Contributors

- [ ] Never commit `.env` files
- [ ] Use `textContent` for user-generated content
- [ ] Validate all external inputs
- [ ] Run `npm audit` before submitting PRs
- [ ] Review CSP compliance for new scripts/styles
- [ ] Test with CSP enabled in browser dev tools

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

Last updated: 2026-06-19
