# Contributing to OnchainProps

Thank you for your interest in contributing to OnchainProps! This guide will help you get started.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/onchainprops.git
   cd onchainprops
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/genkisudo/onchainprops.git
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building the Site

The site is generated from `firms.json` and `faq.json`:

```bash
# Install dependencies
npm install

# Regenerate site content
npm run build
```

This will update:
- `index.html` (meta tags, JSON-LD, noscript tables, FAQ)
- `script.js` (AppState firm data)
- `llms.txt` (AI crawler content)
- `sitemap.xml`

**Never manually edit generated content!** Always modify `firms.json` or `faq.json` and run `npm run build`.

### Adding a New Firm

1. Edit `firms.json`
2. Add firm object with all required fields
3. Run `npm run build`
4. Test locally (open `index.html` in browser)
5. Commit both `firms.json` and generated files

### Security Best Practices

Before submitting a PR, review the [SECURITY.md](SECURITY.md) document:

- ✅ Use `textContent` instead of `innerHTML` for user content
- ✅ Run `npm audit` to check for vulnerabilities
- ✅ Never commit `.env` files (use `.env.example` as template)
- ✅ Validate CSP compliance for any new scripts/styles
- ✅ Test XSS protection in browser dev tools

### Code Style

- **JavaScript**: ES2022, no heavy frameworks
- **HTML**: Semantic, accessible markup
- **CSS**: Custom properties, no preprocessors
- **Comments**: Explain "why", not "what"

### Testing Checklist

Before opening a PR:

- [ ] `npm run build` completes without errors
- [ ] Site loads correctly in browser
- [ ] Mobile navigation works
- [ ] FAQ accordions expand/collapse
- [ ] Analytics tracking fires (check browser console)
- [ ] CSP violations? (check browser console)
- [ ] Lighthouse score maintained (Performance, Accessibility, SEO)

## Pull Request Process

1. **Update your branch** with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Commit with clear messages**:
   ```bash
   git commit -m "feat: Add FirmXYZ to comparison table"
   ```

   Use conventional commit prefixes:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style (formatting, no logic change)
   - `refactor:` Code restructuring
   - `perf:` Performance improvement
   - `test:` Adding tests
   - `chore:` Maintenance tasks

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open Pull Request** on GitHub:
   - Clear title describing the change
   - Description explaining "why" and "what"
   - Reference any related issues
   - Include screenshots for UI changes

5. **Address review feedback** if requested

## Content Guidelines

### Firm Listings

- Verify all information before adding
- Use official sources (firm website, docs)
- Mark affiliate links with `"isAffiliate": true`
- Include both `website` (primary) and `publicUrl` (if different)

### Writing Style

- Clear, concise, factual
- No marketing fluff or superlatives
- Neutral tone (directory, not recommendation)
- SEO-friendly but human-first

## Project Architecture

```
onchainprops/
├── firms.json          # Single source of truth for firm data
├── faq.json            # FAQ content
├── build.js            # Content generator
├── index.html          # Main page (with generated blocks)
├── script.js           # Client-side logic (with generated data)
├── style.css           # Styles
├── amplitude.min.js    # Analytics (UMD bundle)
├── cloudflare-worker.js # Security headers
└── .github/
    └── workflows/
        └── build.yml   # Auto-regenerates on push
```

## Questions?

- Check existing [Issues](https://github.com/genkisudo/onchainprops/issues)
- Read the [README](README.md)
- Review [SECURITY.md](SECURITY.md)

## License

By contributing, you agree your contributions will be licensed under the same license as the project.

---

Happy contributing! 🚀
