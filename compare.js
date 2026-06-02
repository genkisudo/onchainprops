/**
 * compare.html — page interactions
 * Kept external (no inline <script>) so the page can run under a strict
 * Content-Security-Policy with script-src 'self' (matches index.html).
 */
(function () {
    'use strict';

    // ── Scroll progress bar ─────────────────────────────────────────────────
    const bar = document.getElementById('scroll-progress');
    if (bar) {
        const updateProgress = () => {
            const scrolled = window.scrollY;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
        };
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    // ── Hamburger / mobile nav ──────────────────────────────────────────────
    const hamburger = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            const isOpen = mobileNav.classList.toggle('is-open');
            hamburger.setAttribute('aria-expanded', String(isOpen));
            mobileNav.setAttribute('aria-hidden', String(!isOpen));
        });
        // Close mobile nav when a link is clicked
        mobileNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('is-open');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileNav.setAttribute('aria-hidden', 'true');
            });
        });
    }

    // ── ToC active-link highlighting (IntersectionObserver) ─────────────────
    const tocLinks = document.querySelectorAll('.ca-toc a[href^="#"]');
    const sections = document.querySelectorAll('.ca-body section[id]');
    if (tocLinks.length && sections.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    tocLinks.forEach((a) => a.classList.remove('active'));
                    const active = document.querySelector(`.ca-toc a[href="#${entry.target.id}"]`);
                    if (active) active.classList.add('active');
                }
            });
        }, { rootMargin: '-20% 0px -70% 0px' });
        sections.forEach((s) => observer.observe(s));
    }
})();
