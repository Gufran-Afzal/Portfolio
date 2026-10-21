#!/usr/bin/env node
/* ==================================================================
   build.mjs — zero-dependency static site generator

   Usage:   node build.mjs

   What it does
   1. Syncs the shared header / footer / <head> partials into EVERY page
      (index, about-us, contact + all generated pages) so nav changes
      are made once in /partials.
   2. Generates from /content:
        projects.html + projects/<slug>.html     (content/projects.json)
        articles.html + articles/<slug>.html     (content/articles/*.md)
        the "Selected work" section on index.html
        404.html, and sitemap.xml when siteUrl is set (no robots.txt: see SEO_GUIDE.md)
   3. Prints a release checklist of anything still empty.

   Generated pages are plain static HTML: they work without JavaScript
   and are fully crawlable. JS only adds filtering / copy buttons.
   ================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const p = (...a) => path.join(ROOT, ...a);
const read = (f) => fs.readFileSync(p(f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(p(f)), { recursive: true }); fs.writeFileSync(p(f), s); };

const site = JSON.parse(read('content/site.json'));
const SITE_URL = (site.siteUrl || '').replace(/\/$/, '');
const YEAR = new Date().getFullYear();

/* ---------- display order for filter chips (only non-empty ones render) ---------- */
const PROJECT_CATEGORIES = ['Custom Theme', 'Store Redesign', 'Performance & CRO', 'Integrations'];
const ARTICLE_CATEGORIES = ['Case studies', 'Liquid & Themes', 'Performance', 'Apps & Integrations'];

/* ---------- helpers ---------- */
// "{" is emitted as &#123; so Liquid examples in articles can never be parsed as Liquid
// by Jekyll (GitHub Pages' default builder). Browsers render it as a normal "{".
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\{/g, '&#123;');
const slugify = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fmtDate = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const rootFor = (depth) => (depth === 0 ? './' : '../'.repeat(depth));
const arrowSvg = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const todo = [];

/* ---------- partials ---------- */
function socialsHtml() {
  const items = (site.socials || []).filter((s) => s.url);
  if (!items.length) return '';
  return `<div class="footer__social-menu">
            <strong>Social</strong>
            <ul class="footer__menu">
              ${items.map((s) => `<li class="footer__menu-item"><a href="${esc(s.url)}" class="footer__menu-link" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('\n              ')}
            </ul>
          </div>`;
}
function partial(name, depth, nav, rootOverride) {
  let html = read(`partials/${name}.html`).trimEnd();
  html = html.replace(/\{\{root\}\}/g, rootOverride || rootFor(depth)).replace(/\{\{year\}\}/g, YEAR).replace(/\{\{socials\}\}/g, socialsHtml());
  // mark the current page in the nav, then drop the helper attribute
  html = html.replace(/<a ([^>]*?)data-nav="([a-z]+)"/g, (m, pre, key) =>
    key === nav ? `<a ${pre}aria-current="page"` : `<a ${pre.trimEnd()}`);
  return html;
}
function seo({ title, description, depth, file, type = 'website', extra = '', noindex = false }) {
  const withBrand = `${title} | Ghufran Afzal`;
  // keep titles near Google's ~60-char display limit: drop the brand suffix when it would overflow
  const full = title.includes('Ghufran') || withBrand.length > 62 ? title : withBrand;
  const url = SITE_URL && !noindex ? `${SITE_URL}/${file === 'index.html' ? '' : file}` : '';
  return [
    `<title>${esc(full)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    url ? `<link rel="canonical" href="${esc(url)}">` : '',
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(full)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    url ? `<meta property="og:url" content="${esc(url)}">` : '',
    SITE_URL && site.ogImage ? `<meta property="og:image" content="${esc(SITE_URL + '/' + site.ogImage)}">` : '',
    `<meta name="twitter:card" content="${SITE_URL && site.ogImage ? 'summary_large_image' : 'summary'}">`,
    extra,
  ].filter(Boolean).join('\n');
}

/* ---------- full page shell (generated pages) ---------- */
function page({ file, depth, nav, title, description, css = [], js = [], main, type, seoExtra, noindex, rootOverride }) {
  const root = rootOverride || rootFor(depth);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- @seo -->${seo({ title, description, depth, file, type, extra: seoExtra, noindex })}${noindex ? '\n<meta name="robots" content="noindex">' : ''}<!-- @/seo -->
<!-- @head -->${partial('head', depth, nav, rootOverride)}<!-- @/head -->
<link rel="stylesheet" href="${root}css/main.css">
${css.map((c) => `<link rel="stylesheet" href="${root}css/${c}.css">`).join('\n')}
</head>
<body>
  <!-- @header -->${partial('header', depth, nav, rootOverride)}<!-- @/header -->
${main}

  <!-- @footer -->${partial('footer', depth, nav, rootOverride)}<!-- @/footer -->

<script src="${root}js/main.js"></script>
${js.map((j) => `<script src="${root}js/${j}.js"></script>`).join('\n')}
</body>
</html>
`;
}

/* ---------- markdown (small, safe, dependency-free) ---------- */
function inline(raw) {
  const codes = [];
  let s = raw.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const ext = /^https?:/.test(u);
    return `<a href="${u}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${t}</a>`;
  });
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${esc(codes[i])}</code>`);
}
function markdown(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = []; const toc = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      const lang = fence[1] || 'text';
      out.push(`<div class="code-block" data-code-block><div class="code-block__bar"><span class="code-block__lang">${esc(lang)}</span><button type="button" class="code-block__copy" data-copy>Copy</button></div><pre><code>${esc(buf.join('\n'))}</code></pre></div>`);
      continue;
    }
    const h = line.match(/^(#{2,3})\s+(.*)/);
    if (h) {
      const level = h[1].length; const text = h[2].trim(); const id = slugify(text);
      if (level === 2) toc.push({ id, text });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`); i++; continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`); continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\s*[-*]\s+/, ''))}</li>`);
      out.push(`<ul>${buf.join('')}</ul>`); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\s*\d+\.\s+/, ''))}</li>`);
      out.push(`<ol>${buf.join('')}</ol>`); continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{2,3}\s|>\s?|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}
function frontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('Missing front matter');
  const meta = {};
  m[1].split('\n').forEach((l) => { const k = l.indexOf(':'); if (k > 0) meta[l.slice(0, k).trim()] = l.slice(k + 1).trim(); });
  return { meta, body: m[2] };
}

/* ---------- load content ---------- */
const projects = JSON.parse(read('content/projects.json'));
const articles = fs.readdirSync(p('content/articles')).filter((f) => f.endsWith('.md')).map((f) => {
  const { meta, body } = frontMatter(read(`content/articles/${f}`));
  const { html, toc } = markdown(body);
  const words = body.split(/\s+/).length;
  return {
    slug: f.replace(/\.md$/, ''), ...meta,
    tags: (meta.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    html, toc, minutes: Math.max(1, Math.round(words / 200)), draft: meta.draft === 'true',
  };
}).filter((a) => !a.draft).sort((a, b) => b.date.localeCompare(a.date));

/* ---------- shared UI builders ---------- */
function filterBar({ items, order, label, withSearch, noun }) {
  const cats = order.filter((c) => items.some((i) => i.category === c));
  items.forEach((i) => { if (!order.includes(i.category)) todo.push(`"${i.title}" uses category "${i.category}" which is not in the filter order list in build.mjs`); });
  const chips = [`<button type="button" class="filter-chip is-active" data-filter="all" aria-pressed="true">All <span class="filter-chip__count">${items.length}</span></button>`]
    .concat(cats.map((c) => `<button type="button" class="filter-chip" data-filter="${slugify(c)}" aria-pressed="false">${esc(c)} <span class="filter-chip__count">${items.filter((i) => i.category === c).length}</span></button>`));
  return `<div class="filters-bar">
          <div class="filters" role="group" aria-label="${esc(label)}">${chips.join('')}</div>
          ${withSearch ? `<label class="filter-search"><span class="visually-hidden">Search ${noun}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            <input type="search" placeholder="Search ${noun}…" data-filter-search autocomplete="off"></label>` : ''}
        </div>
        <p class="filter-status" data-filter-status data-noun="${noun}" role="status" aria-live="polite"></p>`;
}
const emptyState = (noun) => `<div class="filter-empty" data-filter-empty hidden>
          <p>No ${noun} match your filters.</p>
          <button type="button" class="btn btn--secondary" data-filter-reset>Reset filters</button>
        </div>`;

function media(pr, root, size = 'card') {
  const accent = pr.accent || '#ececee';
  const inner = pr.cover
    ? `<img class="work-media__cover" src="${root}${pr.cover}" alt="${esc(pr.title)} storefront screenshot" loading="${size === 'hero' ? 'eager' : 'lazy'}" decoding="async">`
    : `<img class="work-media__logo" src="${root}${pr.logo}" alt="" loading="${size === 'hero' ? 'eager' : 'lazy'}" decoding="async">`;
  return `<div class="work-media work-media--${size}" style="--accent:${esc(accent)}">${inner}</div>`;
}
function projectCard(pr, root) {
  return `<article class="work-card" data-item data-category="${slugify(pr.category)}">
          ${media(pr, root)}
          <div class="work-card__body">
            <div class="work-card__meta"><span class="pill">${esc(pr.category)}</span>${pr.year ? `<span class="work-card__year">${esc(pr.year)}</span>` : ''}</div>
            <h3 class="work-card__title"><a class="work-card__link" href="${root}projects/${pr.slug}.html">${esc(pr.title)}<span class="visually-hidden"> — view project</span></a></h3>
            <p class="work-card__text">${esc(pr.summary)}</p>
            <ul class="work-card__tags">${pr.services.slice(0, 3).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
          <span class="work-card__arrow" aria-hidden="true">${arrowSvg}</span>
        </article>`;
}
function articleCard(a, root) {
  const isCase = a.category === 'Case studies';
  return `<article class="post-card${isCase ? ' post-card--case' : ''}" data-item data-category="${slugify(a.category)}" data-search="${esc((a.title + ' ' + a.excerpt + ' ' + a.tags.join(' ') + ' ' + a.category).toLowerCase())}">
          <div class="post-card__top"><span class="pill${isCase ? ' pill--light' : ''}">${esc(a.category)}</span><span class="post-card__read">${a.minutes} min read</span></div>
          <h3 class="post-card__title"><a class="post-card__link" href="${root}articles/${a.slug}.html">${esc(a.title)}</a></h3>
          <p class="post-card__text">${esc(a.excerpt)}</p>
          <div class="post-card__foot"><time datetime="${a.date}">${fmtDate(a.date)}</time><span class="post-card__go">Read ${arrowSvg}</span></div>
        </article>`;
}
const ctaBand = (root, heading = "Have a Shopify project in mind?") => `<section class="cta-band-section">
      <div class="container">
        <div class="cta-band">
          <div>
            <h2 class="cta-band__heading">${esc(heading)}</h2>
            <p class="cta-band__text">Share a few details and I'll get back to you with a clear direction.</p>
          </div>
          <a href="${root}contact.html" class="btn btn--light">Let's talk ${arrowSvg}</a>
        </div>
      </div>
    </section>`;

/* ---------- sync markers inside hand-authored pages ---------- */
function syncMarkers(file, depth, nav, meta) {
  let s = read(file).replace(/\r\n/g, '\n');
  const replaceBlock = (name, html) => {
    const re = new RegExp(`<!-- @${name} -->[\\s\\S]*?<!-- @/${name} -->`);
    if (!re.test(s)) { if (name !== 'featured-projects') console.warn(`  ! ${file}: missing @${name} marker`); return; }
    s = s.replace(re, () => `<!-- @${name} -->${html}<!-- @/${name} -->`);
  };
  replaceBlock('seo', seo({ ...meta, depth, file }));
  replaceBlock('head', partial('head', depth, nav));
  replaceBlock('header', partial('header', depth, nav));
  replaceBlock('footer', partial('footer', depth, nav));
  return s;
}

/* ================================================================== */
/*  BUILD                                                              */
/* ================================================================== */
const written = [];
const out = (f, s) => { write(f, s); written.push(f); };

/* ---- homepage: sync partials + featured work section ---- */
let home = syncMarkers('index.html', 0, 'home', {
  title: 'Ghufran Afzal | Shopify Developer & Designer',
  description: 'Shopify developer building custom, fast, conversion-focused storefronts for ambitious brands. View projects and get in touch.',
  // Person structured data: only facts that are on the site (no invented credentials).
  // Add "sameAs" automatically once real social URLs exist in content/site.json.
  extra: `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Person', name: site.name, url: SITE_URL ? SITE_URL + '/' : undefined,
    jobTitle: 'Shopify Developer', knowsAbout: ['Shopify', 'Liquid', 'Shopify theme development', 'Frontend development'],
    ...((site.socials || []).filter((x) => x.url).length ? { sameAs: site.socials.filter((x) => x.url).map((x) => x.url) } : {}),
  }).replace(/</g, '\\u003c')}</script>`,
});
const featured = projects.filter((x) => x.featured);
const featuredHtml = `
    <section class="work-section" id="work" aria-labelledby="work-heading">
      <div class="container">
        <div class="section-head" data-animate-group data-animate-threshold="0.1">
          <span class="pill pill--badge" data-animate="fade-up">Portfolio</span>
          <h2 class="section-head__heading" id="work-heading" data-animate="fade-up">Selected work</h2>
          <p class="section-head__text" data-animate="fade-up">A look at recent Shopify projects, from custom themes to performance and conversion work.</p>
        </div>
        <div class="work-grid work-grid--featured">
          ${featured.map((x) => projectCard(x, './')).join('\n          ')}
        </div>
        <div class="work-section__more">
          <a href="./projects.html" class="btn btn--primary">View all projects ${arrowSvg}</a>
        </div>
      </div>
    </section>
    `;
home = home.replace(/<!-- @featured-projects -->[\s\S]*?<!-- @\/featured-projects -->/, () => `<!-- @featured-projects -->${featuredHtml}<!-- @/featured-projects -->`);
out('index.html', home);

/* ---- about + contact ---- */
out('about-us.html', syncMarkers('about-us.html', 0, 'about', {
  title: 'About Ghufran Afzal — Shopify Developer',
  description: 'I build Shopify stores that are designed to perform. Learn about my approach, values and background in Shopify development.',
}));
out('contact.html', syncMarkers('contact.html', 0, 'contact', {
  title: 'Contact — Hire a Shopify Developer',
  description: "Have a Shopify project in mind? Share a few details and I'll get back to you within 24 hours.",
}));

/* ---- projects listing ---- */
out('projects.html', page({
  file: 'projects.html', depth: 0, nav: 'projects',
  title: 'Shopify Projects & Case Studies',
  description: 'Selected Shopify projects by Ghufran Afzal: custom themes, store redesigns, performance and conversion work, and integrations.',
  css: ['content'], js: ['filters'],
  main: `  <main id="main">
    <section class="page-hero">
      <div class="container">
        <div class="page-hero__inner" data-animate-group data-animate-threshold="0.3">
          <span class="pill pill--badge" data-animate="fade-up">Projects</span>
          <h1 class="page-hero__heading h2" data-animate="fade-up">Shopify work I'm proud of</h1>
          <p class="page-hero__text" data-animate="fade-up">Custom themes, store redesigns, performance work and integrations. Filter by type, then open a project for the full story.</p>
        </div>
      </div>
    </section>
    <section class="listing">
      <div class="container">
        ${filterBar({ items: projects, order: PROJECT_CATEGORIES, label: 'Filter projects by type', noun: 'projects' })}
        <div class="work-grid" data-filter-grid>
          ${projects.map((x) => projectCard(x, './')).join('\n          ')}
        </div>
        ${emptyState('projects')}
      </div>
    </section>
    ${ctaBand('./')}
  </main>`,
}));

/* ---- project detail pages ---- */
projects.forEach((pr, idx) => {
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];
  const related = articles.filter((a) => a.tags.some((t) => pr.stack.includes(t)) || a.project === pr.slug).slice(0, 2);
  if (!pr.liveUrl) todo.push(`projects/${pr.slug}: add liveUrl (button is hidden until set)`);
  if (!pr.cover) todo.push(`projects/${pr.slug}: add a real cover screenshot (currently showing the logo placeholder)`);
  if (!pr.results.length) todo.push(`projects/${pr.slug}: add measurable results (section is hidden until set)`);
  const sec = (title, body) => body ? `<section class="prose-block"><h2>${title}</h2>${body}</section>` : '';
  const list = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  out(`projects/${pr.slug}.html`, page({
    file: `projects/${pr.slug}.html`, depth: 1, nav: 'projects',
    title: `${pr.title} — Shopify ${pr.category} project`, description: pr.summary,
    css: ['content'], js: [],
    main: `  <main id="main">
    <article class="detail">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="../projects.html">Projects</a><span aria-hidden="true">/</span><span aria-current="page">${esc(pr.title)}</span></nav>
        <header class="detail-head" data-animate-group data-animate-threshold="0.2">
          <span class="pill pill--badge" data-animate="fade-up">${esc(pr.category)}</span>
          <h1 class="detail-head__heading" data-animate="fade-up">${esc(pr.title)}</h1>
          <p class="detail-head__text" data-animate="fade-up">${esc(pr.summary)}</p>
          <div class="detail-head__actions" data-animate="fade-up">
            ${pr.liveUrl ? `<a class="btn btn--primary" href="${esc(pr.liveUrl)}" target="_blank" rel="noopener noreferrer">Visit live store ${arrowSvg}</a>` : ''}
            <a class="btn btn--secondary" href="../contact.html">Start a similar project</a>
          </div>
        </header>
        ${media(pr, '../', 'hero')}
        <dl class="detail-meta">
          <div><dt>Client</dt><dd>${esc(pr.title)}</dd></div>
          <div><dt>Type</dt><dd>${esc(pr.category)}</dd></div>
          <div><dt>Platform</dt><dd>Shopify</dd></div>
          ${pr.year ? `<div><dt>Year</dt><dd>${esc(pr.year)}</dd></div>` : ''}
        </dl>
        <div class="detail-layout">
          <aside class="detail-aside">
            <div class="aside-card"><h2>Services</h2>${list(pr.services)}</div>
            <div class="aside-card"><h2>Stack</h2><ul class="chips">${pr.stack.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
          </aside>
          <div class="prose">
            ${sec('Overview', `<p>${esc(pr.overview)}</p>`)}
            ${sec('The challenge', `<p>${esc(pr.challenge)}</p>`)}
            ${sec('The solution', `<p>${esc(pr.solution)}</p>`)}
            ${sec('What I delivered', pr.deliverables.length ? list(pr.deliverables) : '')}
            ${sec('Results', pr.results.length ? list(pr.results) : '')}
          </div>
        </div>
        ${related.length ? `<section class="related"><h2 class="related__heading">Related reading</h2><div class="post-grid">${related.map((a) => articleCard(a, '../')).join('')}</div></section>` : ''}
        <nav class="detail-nav" aria-label="More projects">
          <a href="${prev.slug}.html" class="detail-nav__item"><span>Previous project</span><strong>${esc(prev.title)}</strong></a>
          <a href="${next.slug}.html" class="detail-nav__item detail-nav__item--next"><span>Next project</span><strong>${esc(next.title)}</strong></a>
        </nav>
      </div>
    </article>
    ${ctaBand('../')}
  </main>`,
  }));
});

/* ---- articles listing ---- */
out('articles.html', page({
  file: 'articles.html', depth: 0, nav: 'articles',
  title: 'Shopify Development Articles & Case Studies',
  description: 'Case studies and practical Shopify articles on theme development, Liquid, performance, and integrations.',
  css: ['content'], js: ['filters'],
  main: `  <main id="main">
    <section class="page-hero">
      <div class="container">
        <div class="page-hero__inner" data-animate-group data-animate-threshold="0.3">
          <span class="pill pill--badge" data-animate="fade-up">Articles</span>
          <h1 class="page-hero__heading h2" data-animate="fade-up">Case studies &amp; Shopify notes</h1>
          <p class="page-hero__text" data-animate="fade-up">Build breakdowns and practical guides on Liquid, themes, performance, and everything around Shopify development.</p>
        </div>
      </div>
    </section>
    <section class="listing">
      <div class="container">
        ${filterBar({ items: articles, order: ARTICLE_CATEGORIES, label: 'Filter articles by topic', withSearch: true, noun: 'articles' })}
        <div class="post-grid" data-filter-grid>
          ${articles.map((a) => articleCard(a, './')).join('\n          ')}
        </div>
        ${emptyState('articles')}
      </div>
    </section>
    ${ctaBand('./')}
  </main>`,
}));

/* ---- article detail pages ---- */
articles.forEach((a) => {
  const related = articles.filter((x) => x.slug !== a.slug)
    .sort((x, y) => (y.category === a.category) - (x.category === a.category)).slice(0, 2);
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.excerpt, datePublished: a.date,
    author: { '@type': 'Person', name: site.name }, ...(SITE_URL ? { mainEntityOfPage: `${SITE_URL}/articles/${a.slug}.html` } : {}) };
  out(`articles/${a.slug}.html`, page({
    file: `articles/${a.slug}.html`, depth: 1, nav: 'articles', type: 'article',
    title: a.title, description: a.excerpt,
    seoExtra: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    css: ['content'], js: ['article'],
    main: `  <div class="read-progress" data-read-progress aria-hidden="true"></div>
  <main id="main">
    <article class="article">
      <div class="container container--narrow">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="../articles.html">Articles</a><span aria-hidden="true">/</span><span aria-current="page">${esc(a.category)}</span></nav>
        <header class="article-head" data-animate-group data-animate-threshold="0.2">
          <span class="pill pill--badge" data-animate="fade-up">${esc(a.category)}</span>
          <h1 class="article-head__heading" data-animate="fade-up">${esc(a.title)}</h1>
          <p class="article-head__text" data-animate="fade-up">${esc(a.excerpt)}</p>
          <p class="article-head__meta" data-animate="fade-up"><span>By ${esc(site.name)}</span><span aria-hidden="true">·</span><time datetime="${a.date}">${fmtDate(a.date)}</time><span aria-hidden="true">·</span><span>${a.minutes} min read</span></p>
        </header>
        ${a.toc.length > 2 ? `<nav class="toc" aria-label="On this page"><strong>On this page</strong><ol>${a.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : ''}
        <div class="prose prose--article">
${a.html}
        </div>
        ${a.tags.length ? `<ul class="chips chips--tags" aria-label="Tags">${a.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <aside class="author-box">
          <img src="../assets/img/hero-portrait.webp" alt="" width="64" height="64" loading="lazy">
          <div><strong>${esc(site.name)}</strong><p>Shopify developer building fast, conversion-focused storefronts. <a href="../contact.html">Work with me</a>.</p></div>
        </aside>
      </div>
      <div class="container">
        <section class="related"><h2 class="related__heading">Keep reading</h2><div class="post-grid">${related.map((x) => articleCard(x, '../')).join('')}</div></section>
      </div>
    </article>
    ${ctaBand('../')}
  </main>`,
  }));
});

/* ---- .nojekyll: GitHub Pages must serve these files as-is, not run them through Jekyll ---- */
out('.nojekyll', '');

/* ---- 404 ---- */
out('404.html', page({
  file: '404.html', depth: 0, nav: '', rootOverride: (SITE_URL ? SITE_URL : '') + '/', title: 'Page not found', description: 'This page could not be found.', noindex: true, css: ['content'],
  main: `  <main id="main">
    <section class="page-hero page-hero--tall">
      <div class="container">
        <div class="page-hero__inner">
          <span class="pill pill--badge">404</span>
          <h1 class="page-hero__heading h2">This page doesn't exist</h1>
          <p class="page-hero__text">The link may be broken, or the page may have moved.</p>
          <div class="detail-head__actions detail-head__actions--center"><a class="btn btn--primary" href="${(SITE_URL || '') + '/'}">Back to home</a><a class="btn btn--secondary" href="${(SITE_URL || '') + '/'}projects.html">View projects</a></div>
        </div>
      </div>
    </section>
  </main>`,
}));

/* ---- sitemap (only when siteUrl is configured) ---- */
if (SITE_URL) {
  const urls = written.filter((f) => f.endsWith('.html') && f !== '404.html');
  out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((f) => `  <url><loc>${SITE_URL}/${f === 'index.html' ? '' : f}</loc></url>`).join('\n')}\n</urlset>\n`);
} else {
  todo.push('content/site.json: set "siteUrl" to generate canonical tags and sitemap.xml');
}
if (!(site.socials || []).some((s) => s.url)) todo.push('content/site.json: add social URLs (the footer Social column is hidden until at least one is set)');

console.log(`Built ${written.length} files (${projects.length} projects, ${articles.length} articles).`);
if (todo.length) { console.log('\nRelease checklist:'); todo.forEach((t) => console.log('  - ' + t)); }
