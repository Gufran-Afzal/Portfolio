# Ghufran Afzal — Shopify portfolio

Static HTML/CSS/JS. No framework, no dependencies. Deploy the folder as-is to
Netlify, Vercel, GitHub Pages or Cloudflare Pages.

## Day-to-day workflow

```bash
node build.mjs          # regenerates every generated page + syncs header/footer/SEO
npx serve .             # or: python3 -m http.server  → preview locally
```

**Always run `node build.mjs` before committing.** It is safe to run repeatedly.

## Where things live

| You want to change…            | Edit this                          |
| ------------------------------ | ---------------------------------- |
| Nav links, header, footer      | `partials/header.html`, `partials/footer.html` (then build) |
| Add / edit a project           | `content/projects.json`            |
| Add / edit an article          | `content/articles/<slug>.md`       |
| Social links, site URL         | `content/site.json`                |
| Page titles / meta descriptions| `build.mjs` (hand pages) or the content file (generated pages) |
| Home / About / Contact markup  | `index.html`, `about-us.html`, `contact.html` (edit between the markers, never inside `<!-- @header -->` etc.) |

### Add a project
Add an object to `content/projects.json`. Sections with no data (live URL,
results, cover) hide themselves, so a half-filled project still looks finished.
To replace the logo placeholder with a real screenshot, drop a `.webp`
(about 1600×800) in `assets/img/projects/` and set `"cover": "assets/img/projects/<file>.webp"`.

### Add an article
Create `content/articles/my-post.md`:

```
---
title: My post title
date: 2026-11-02
category: Liquid & Themes
tags: Liquid, Sections
excerpt: One or two sentences shown on cards and in search results.
---
Markdown body. Use ## for sections, ``` for code blocks, - for lists.
```

Categories shown as filters: `Case studies`, `Liquid & Themes`, `Performance`,
`Apps & Integrations`. To add a new one, append it to `ARTICLE_CATEGORIES` in `build.mjs`.
Set `draft: true` in the front matter to hide a post.

## Before you go live
`node build.mjs` prints a release checklist (missing live URLs, covers, socials, siteUrl).
Also: submit the contact form once on the deployed site and confirm the email
arrives (the Formspree form must be activated), and run PageSpeed Insights.
