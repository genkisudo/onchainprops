/**
 * Cloudflare Worker — Security Header Injection
 *
 * Deployment (Cloudflare dashboard):
 *   1. Workers & Pages → Create Worker → paste this file → Deploy
 *   2. Add a Worker Route for your zone: onchainprop.wtf/* → this worker
 *
 * Or via Wrangler CLI:
 *   npx wrangler deploy cloudflare-worker.js --name onchainprop-security
 *   Then add a route in the Cloudflare dashboard for onchainprop.wtf/*
 *
 * What this adds (all require HTTP headers — cannot be set via <meta> tags):
 *   - X-Frame-Options: DENY                → clickjacking prevention
 *   - Content-Security-Policy: frame-ancestors 'none'  → modern clickjacking prevention
 *   - Strict-Transport-Security            → forces HTTPS (HSTS)
 *   - Permissions-Policy                   → disables unused browser APIs
 *   - X-Content-Type-Options: nosniff      → prevents MIME-type sniffing attacks
 */

export default {
    async fetch(request) {
        const response = await fetch(request);

        // Clone so headers are mutable
        const newHeaders = new Headers(response.headers);

        // ── Clickjacking ────────────────────────────────────────────────────────
        newHeaders.set('X-Frame-Options', 'DENY');

        // Append frame-ancestors to existing CSP (meta tag already sets other directives)
        const existingCSP = newHeaders.get('Content-Security-Policy') ?? '';
        const frameAncestors = "frame-ancestors 'none'";
        newHeaders.set(
            'Content-Security-Policy',
            existingCSP ? `${existingCSP}; ${frameAncestors}` : frameAncestors
        );

        // ── Transport Security (HSTS) ───────────────────────────────────────────
        // max-age=63072000 = 2 years; preload submits to the HSTS preload list
        newHeaders.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        );

        // ── Permissions Policy ──────────────────────────────────────────────────
        // Disable browser APIs this site never uses
        newHeaders.set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()'
        );

        // ── MIME Sniffing ───────────────────────────────────────────────────────
        newHeaders.set('X-Content-Type-Options', 'nosniff');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    },
};
