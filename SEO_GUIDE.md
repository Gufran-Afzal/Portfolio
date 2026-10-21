# SEO Implementation Guide — gufran-afzal.github.io/Portfolio

Written for this exact repository (`Gufran-Afzal/Portfolio`), a multi-page static site on GitHub Pages.
Base URL used everywhere: **`https://gufran-afzal.github.io/Portfolio/`**

> **Honesty note.** SEO changes make your site easier for Google to crawl, understand and present. They do **not** guarantee indexing, traffic or rankings. Requesting indexing in Search Console is a *request*, not an order.

---

## 0. Audit results: what is confirmed and what is not

### Confirmed by inspecting the repository files
| # | Finding | Status |
|---|---------|--------|
| 1 | The site has 17 HTML files: 16 indexable pages + `404.html`. Full list in section 3. | Confirmed |
| 2 | **Before this update**, the original pages (`index`, `about-us`, `contact`) shared one identical `<title>`, and had no meta description, canonical, or Open Graph tags. | Confirmed, **fixed** |
| 3 | No `sitemap.xml` existed. | Confirmed, **fixed** (generated) |
| 4 | Home was linked as `index.html` while its canonical URL is `/Portfolio/`, creating two URLs for one page. | Confirmed, **fixed** (nav now links `./`) |
| 5 | `404.html` used root-absolute links (`/index.html`) which break on a project site (they resolve to `gufran-afzal.github.io/index.html`, outside `/Portfolio/`). | Confirmed, **fixed** (uses full `/Portfolio/` URLs) |
| 6 | Asset filenames contained spaces; logo `<img>` alt text was generic ("Logo"). | Confirmed, **fixed** |
| 7 | Every page has exactly one `<h1>`; metadata is unique per page; all internal links and assets resolve (automated check, 0 broken). | Confirmed |
| 8 | Images with `alt=""` remaining are decorative (logo icons, arrows, marquee duplicates). Meaningful images have alt text. | Confirmed |
| 9 | No `og:image` is set, because the repo has no suitable 1200×630 share image. | Confirmed, **your action** (section 6.5) |
| 10 | No social profile URLs exist in the repo, so no `sameAs` structured data is emitted. | Confirmed |

### Could NOT be verified from here: check these yourself
| What | How to check |
|------|--------------|
| Whether the live site currently serves these updated files | Open `https://gufran-afzal.github.io/Portfolio/sitemap.xml` after deploying. |
| Which **branch** GitHub Pages deploys from. Your local repo is on branch `portfolio-revamp`; Pages may publish `main`. | GitHub repo → **Settings → Pages → Build and deployment → Branch**. Merge your work into that branch. |
| Whether Google already indexed any page, or under which URLs | Search `site:gufran-afzal.github.io/Portfolio` in Google, then Search Console (section 5). |
| Whether HTTPS is enforced | Settings → Pages → tick **Enforce HTTPS**. |
| Real Core Web Vitals / PageSpeed scores | PageSpeed Insights on the live URL (section 7). Lab results from my sandbox aren't representative. |
| Whether a user-site repo `gufran-afzal.github.io` exists | Visit `https://github.com/Gufran-Afzal/gufran-afzal.github.io`. It matters for `robots.txt` (section 2.3). |

---

## 1. SEO fundamentals (for this site)

- **Crawling**: Googlebot fetches your URLs by following links and your sitemap. Your internal navigation and `sitemap.xml` are its map.
- **Indexing**: Google stores a page it understands and finds worth keeping. A page can be crawled but *not* indexed ("Crawled – currently not indexed"), which is common for brand-new, low-authority sites.
- **Ranking**: the order of results for a query. It depends on relevance, content quality, links from other sites, and page experience. You influence it; you don't control it.
- **Google Search Console (GSC)**: Google's free dashboard showing which of your pages are indexed, what searches show them, and what errors exist.
- **Sitemap (`sitemap.xml`)**: a list of the URLs you want crawled. A *hint*, not a command.
- **Canonical URL**: the one "official" address of a page. Your pages are reachable under several addresses (`/Portfolio/about-us.html`, `/Portfolio/about-us`, with query strings…). The `<link rel="canonical">` tells Google which to keep.
- **`robots.txt`**: a crawl-permission file. **Its scope on your site is very limited**; see 2.3.

---

## 2. Technical SEO

### 2.1 Unique titles and descriptions
Each page needs its own `<title>` (aim ≤ 60 characters) and meta description (aim ≤ 155). Duplicates make pages look interchangeable to Google.
**How it's handled now:** `build.mjs` writes them into the `<!-- @seo -->` block of every page. Hand-authored pages (`index`, `about-us`, `contact`) are set in `syncMarkers(...)` calls; projects and articles take them from `content/projects.json` (`title`, `summary`) and `content/articles/*.md` (`title`, `excerpt`). **Never edit inside the `@seo` markers by hand**; the next build overwrites it.

### 2.2 Canonical URLs on a project site
Your pages live under `/Portfolio/`, so every canonical must include it:
- Home: `https://gufran-afzal.github.io/Portfolio/` (with trailing slash)
- Others: `https://gufran-afzal.github.io/Portfolio/about-us.html` (with `.html`)

Rules to keep: absolute URL, `https`, one canonical per page, pointing to itself, and the same URL you put in `sitemap.xml`.
GitHub Pages also serves extensionless versions (`/about-us`) and `index.html` variants. Canonicals consolidate those. **Internal links should always use the canonical form**, which is why Home now links to `./`.
Set once in `content/site.json`: `"siteUrl": "https://gufran-afzal.github.io/Portfolio"` (no trailing slash).

### 2.3 robots.txt: scope and limits (important)
Crawlers only read `robots.txt` at the **root of the host**: `https://gufran-afzal.github.io/robots.txt`.
A file at `https://gufran-afzal.github.io/Portfolio/robots.txt` is **never consulted**. Do not rely on it, and this repo intentionally does **not** contain one.
- Without any robots.txt, everything is crawlable by default. That is what you want.
- Root `robots.txt` belongs to the *user-site repo* `gufran-afzal.github.io` (if you create one). You'd only add it there if you wanted to point at the sitemap: `Sitemap: https://gufran-afzal.github.io/Portfolio/sitemap.xml`. Optional; submitting the sitemap in GSC does the same job.
- To control indexing *per page* use `<meta name="robots" content="noindex">` (already on `404.html`). **Never** add `noindex` or `Disallow: /` to pages you want found.

### 2.4 Sitemap
`sitemap.xml` is generated by `node build.mjs` and lists only the 16 real pages (no 404, no files that don't exist). It lives at `https://gufran-afzal.github.io/Portfolio/sitemap.xml`, inside your Search Console property, so you can submit it there.
It deliberately has no `<lastmod>`: a single build date on every URL would be inaccurate, and Google ignores unreliable lastmod values.
Re-run `node build.mjs` whenever you add a project or article.

### 2.5 Open Graph / social sharing
Each page now has `og:type`, `og:title`, `og:description`, `og:url` and `twitter:card`. This controls link previews on LinkedIn, Slack, WhatsApp, X. It does **not** affect Google ranking.
`og:image` requires an **absolute URL** to a **JPG/PNG** (~1200×630). See 6.5.

### 2.6 Structured data (only where truthful)
- **Homepage: `Person`** (name, URL, job title "Shopify Developer", topics). Only facts already on your site. `sameAs` (social profiles) is added automatically once you put real URLs in `content/site.json`.
- **Articles: `Article`** (headline, description, datePublished, author).
- **Not added, on purpose:** `Review`/`AggregateRating` (you have no verifiable reviews on-site), `LocalBusiness`, `Organization` claims, `FAQPage`. Inaccurate markup can lead to manual actions.
These don't produce visual "rich results" for a personal site; they help Google understand who the site is about.

### 2.7 Mobile, speed, HTTPS, crawlable resources
- Mobile: layouts are responsive and include the viewport meta tag. Check on a real phone.
- Speed: images were compressed (assets ~5 MB → ~0.6 MB), below-the-fold images are lazy-loaded, the hero image has dimensions and high fetch priority.
- HTTPS: enforce it in repo settings (section 0).
- Crawlable resources: CSS/JS/images are plain files under `/Portfolio/`, nothing blocked. Don't hide content behind JS-only rendering. Your listing and detail pages are real static HTML.

### 2.8 404s, redirects, duplicates, trailing slashes
- **404:** GitHub Pages serves `404.html` for missing URLs under a project site. Because a 404 can occur at any depth, `404.html` uses full `https://gufran-afzal.github.io/Portfolio/...` asset and link URLs. It has `noindex` and no canonical.
- **Redirects:** GitHub Pages can't do server redirects. If you rename a page, keep the old file as a tiny page with `<meta http-equiv="refresh" content="0; url=NEW">` and `<link rel="canonical" href="NEW">`.
- **Trailing slashes:** `/Portfolio` → 301 → `/Portfolio/` automatically. Use `/Portfolio/` for home everywhere. Other pages use `.html`, consistently.
- **Duplicates:** canonical tags + consistent internal links (done) are your protection.

---

## 3. Page-by-page SEO plan
All metadata below is **already applied** in this repository (values read directly from the built files). "Problems fixed" shows what was wrong before.

| Published URL | Problems fixed / notes | Title | Meta description | Canonical | H1 | Search intent | Key internal links |
|---|---|---|---|---|---|---|---|
| `https://gufran-afzal.github.io/Portfolio/` | Hero H1 does not say "Shopify developer" in plain text; the H1 is split for animation. Optional: make sure a visible sentence near it does. | Ghufran Afzal \| Shopify Developer & Designer | Shopify developer building custom, fast, conversion-focused storefronts for ambitious brands. View projects and get in touch. | `https://gufran-afzal.github.io/Portfolio/` | Shopify stores built to stand out | Shopify developer for brands (home) | About, Projects, Contact, Articles |
| `https://gufran-afzal.github.io/Portfolio/about-us.html` | Original: shared title, no description/canonical. | About Ghufran Afzal — Shopify Developer | I build Shopify stores that are designed to perform. Learn about my approach, values and background in Shopify development. | `https://gufran-afzal.github.io/Portfolio/about-us.html` | I build Shopify stores that are designed to perform. | "Shopify developer" + who is behind the work | Contact, Projects |
| `https://gufran-afzal.github.io/Portfolio/contact.html` | Original: shared title; form gave false "sent" on server errors (fixed). | Contact — Hire a Shopify Developer \| Ghufran Afzal | Have a Shopify project in mind? Share a few details and I'll get back to you within 24 hours. | `https://gufran-afzal.github.io/Portfolio/contact.html` | Let's talk about your next project | "Hire a Shopify developer" (transactional) | Home, Projects |
| `https://gufran-afzal.github.io/Portfolio/projects.html` | New page. | Shopify Projects & Case Studies \| Ghufran Afzal | Selected Shopify projects by Ghufran Afzal: custom themes, store redesigns, performance and conversion work, and integrations. | `https://gufran-afzal.github.io/Portfolio/projects.html` | Shopify work I'm proud of | Shopify portfolio / examples | Each project, Contact |
| `https://gufran-afzal.github.io/Portfolio/articles.html` | New page. | Shopify Development Articles & Case Studies \| Ghufran Afzal | Case studies and practical Shopify articles on theme development, Liquid, performance, and integrations. | `https://gufran-afzal.github.io/Portfolio/articles.html` | Case studies & Shopify notes | Shopify tutorials + case studies | Each article, Projects |
| `https://gufran-afzal.github.io/Portfolio/projects/patrice.html` | New page. Add live URL, screenshot, real results to strengthen it. | Patrice Fransez — Shopify Custom Theme project \| Ghufran Afzal | A custom Shopify theme built around the brand's identity, with flexible sections the team can rearrange without a developer. | `https://gufran-afzal.github.io/Portfolio/projects/patrice.html` | Patrice Fransez | Brand-specific project page | Projects, Contact, related articles, prev/next project |
| `https://gufran-afzal.github.io/Portfolio/projects/risen.html` | New page. Add live URL, screenshot, real results to strengthen it. | Risen — Shopify Integrations project \| Ghufran Afzal | Connecting a fragrance storefront with the tools the business relies on, while keeping the shopping experience fast. | `https://gufran-afzal.github.io/Portfolio/projects/risen.html` | Risen | Brand-specific project page | Projects, Contact, related articles, prev/next project |
| `https://gufran-afzal.github.io/Portfolio/projects/romaan.html` | New page. Add live URL, screenshot, real results to strengthen it. | ROMAAN — Shopify Custom Theme project \| Ghufran Afzal | A bespoke fragrance storefront with custom sections and a layout system designed to scale as the catalogue grows. | `https://gufran-afzal.github.io/Portfolio/projects/romaan.html` | ROMAAN | Brand-specific project page | Projects, Contact, related articles, prev/next project |
| `https://gufran-afzal.github.io/Portfolio/projects/sr-beauty.html` | New page. Add live URL, screenshot, real results to strengthen it. | SR Beauty — Shopify Performance & CRO project \| Ghufran Afzal | Speed and conversion improvements across the storefront, from image delivery to a smoother path from product to checkout. | `https://gufran-afzal.github.io/Portfolio/projects/sr-beauty.html` | SR Beauty | Brand-specific project page | Projects, Contact, related articles, prev/next project |
| `https://gufran-afzal.github.io/Portfolio/projects/susanna-falken.html` | New page. Add live URL, screenshot, real results to strengthen it. | Susanna Falken — Shopify Store Redesign project | A refined redesign of an existing jewellery store, focused on clearer navigation and a calmer, more premium shopping experience. | `https://gufran-afzal.github.io/Portfolio/projects/susanna-falken.html` | Susanna Falken | Brand-specific project page | Projects, Contact, related articles, prev/next project |
| `https://gufran-afzal.github.io/Portfolio/articles/apps-vs-custom-code.html` | New page. | Shopify apps vs custom code: how I decide \| Ghufran Afzal | A simple set of questions I ask before recommending an app or writing the feature myself. | `https://gufran-afzal.github.io/Portfolio/articles/apps-vs-custom-code.html` | Shopify apps vs custom code: how I decide | Informational Shopify how-to / case study | Projects, Contact, related articles |
| `https://gufran-afzal.github.io/Portfolio/articles/auditing-a-slow-shopify-theme.html` | New page. | Case study: auditing a slow Shopify theme, step by step | The repeatable order I follow when a store feels slow, so the biggest wins come first and every change is measured. | `https://gufran-afzal.github.io/Portfolio/articles/auditing-a-slow-shopify-theme.html` | Case study: auditing a slow Shopify theme, step by step | Informational Shopify how-to / case study | Projects, Contact, related articles |
| `https://gufran-afzal.github.io/Portfolio/articles/cart-drawer-section-rendering-api.html` | New page. | Case study: a no-reload Shopify cart drawer \| Ghufran Afzal | How I build an add-to-cart flow that updates the cart drawer instantly, without reloading the page or re-implementing cart markup in JavaScript. | `https://gufran-afzal.github.io/Portfolio/articles/cart-drawer-section-rendering-api.html` | Case study: a no-reload Shopify cart drawer | Informational Shopify how-to / case study | Projects, Contact, related articles |
| `https://gufran-afzal.github.io/Portfolio/articles/flexible-sections-schema-blocks-presets.html` | New page. | Building flexible theme sections: schema, blocks and presets | The three parts of a section schema that decide whether a merchant can actually use your work without calling you. | `https://gufran-afzal.github.io/Portfolio/articles/flexible-sections-schema-blocks-presets.html` | Building flexible theme sections: schema, blocks and presets | Informational Shopify how-to / case study | Projects, Contact, related articles |
| `https://gufran-afzal.github.io/Portfolio/articles/metafields-vs-metaobjects.html` | New page. | Metafields vs metaobjects: which one should you use? | Both store custom data. They solve different problems, and choosing the wrong one makes a store harder to manage. | `https://gufran-afzal.github.io/Portfolio/articles/metafields-vs-metaobjects.html` | Metafields vs metaobjects: which one should you use? | Informational Shopify how-to / case study | Projects, Contact, related articles |
| `https://gufran-afzal.github.io/Portfolio/articles/responsive-images-with-image-tag.html` | New page. | Responsive Shopify images with image_tag, done properly | Stop shipping one giant image to every device. A practical pattern for widths, sizes and loading priority in Liquid. | `https://gufran-afzal.github.io/Portfolio/articles/responsive-images-with-image-tag.html` | Responsive Shopify images with image_tag, done properly | Informational Shopify how-to / case study | Projects, Contact, related articles |

`404.html` (`https://gufran-afzal.github.io/Portfolio/404.html`): `noindex`, no canonical, excluded from the sitemap. Intentional.

---

## 4. Content SEO for a Shopify development portfolio

Google ranks pages that clearly answer what someone searches. A generic "portfolio" page rarely ranks; a specific page does. Only claim what is true.

**Homepage.** Make it obvious in plain visible text who you are and what you do: *Shopify developer*, *custom Shopify themes*, *Liquid*, *performance*. Your H1 is a stylised hero line; add one visible sentence nearby (for example in the hero paragraph) using those words naturally. Keep the "Selected work" section: it links to your projects with descriptive anchor text.

**About.** Recruiters read this. State your real skills, years, and tools. Do not list technologies you don't use. Avoid keyword lists.

**Projects (each detail page).** This is your strongest content. For each real project, fill in `content/projects.json`:
1. `liveUrl`: link to the live store (credibility + a legitimate outbound link).
2. `cover`: a real screenshot with meaningful alt text (the build writes `"<Client> storefront screenshot"`).
3. `overview / challenge / solution`: rewrite the draft text in your own words with true specifics: which sections you built, which Liquid features, what you optimised.
4. `results`: only add numbers you can substantiate (e.g. a before/after Lighthouse score from your own test). If you have no measurable result, **leave it empty**; the section hides itself.
5. Don't publish a client's name or logo without permission.

**Services.** Currently a homepage section (`#services`) and a footer link. If you want to rank for "Shopify theme development" style searches, a dedicated `services.html` page, with one clear section per genuine service, is worth adding later (Priority 2). Do not invent services.

**Articles.** The six included articles are technical and honest, which is what builds authority over time. Review each for accuracy against your own experience. Add one new article every 4–6 weeks about problems you actually solved. One in-depth, correct article beats five thin ones.

**Contact.** Keep it simple; the title "Contact — Hire a Shopify Developer" matches how clients search. Make sure the form works (test after each deploy).

**Internal linking.** Every page links to the others through the shared header/footer; project pages link to related articles and prev/next; articles link to related articles and your contact page. When you write new content, link to the relevant project or article with descriptive words, not "click here".

---

## 5. Google Search Console setup

### 5.1 Add and verify the property
Your site is a *path* on `github.io`, so use a **URL-prefix** property (the "Domain" option needs DNS control, which you don't have on github.io).
1. Go to <https://search.google.com/search-console> and sign in.
2. **Add property → URL prefix** → enter exactly `https://gufran-afzal.github.io/Portfolio/` → Continue.
3. Choose **HTML tag** verification. You'll see a tag like `<meta name="google-site-verification" content="XXXXXXXX" />`.
4. Open `partials/head.html` in the repo and add that one line at the end. (It's a shared partial, so one edit covers all pages.)
5. Run `node build.mjs`, commit, push, and wait for GitHub Pages to deploy (usually 1–3 minutes).
6. Confirm the tag is live: open the homepage → right-click → View Page Source → search for `google-site-verification`.
7. Back in Search Console click **Verify**. Do not remove the tag afterwards, or verification can lapse.

*Alternative:* **HTML file** method. Download `googleXXXXXXXX.html`, place it in the repo root, push, and confirm `https://gufran-afzal.github.io/Portfolio/googleXXXXXXXX.html` opens. This also works; the meta tag is simpler to maintain here.

### 5.2 Submit the sitemap
Search Console → **Sitemaps** → enter `sitemap.xml` → **Submit**. Status should become **Success** and show "Discovered URLs: 16". (Google may take hours or days to process; "Couldn't fetch" immediately after deploy usually resolves on retry.)

### 5.3 Inspect URLs and request indexing
1. Paste a URL (start with the homepage) into the top **Inspect any URL** bar.
2. Read the verdict: *URL is on Google* or *URL is not on Google*.
3. Click **Test live URL** to confirm Google can fetch it and see the canonical.
4. Click **Request indexing**. Do this for the homepage, `projects.html`, `articles.html`, and your best project pages; there's a daily quota, so don't spam it.
> Requesting indexing **queues a crawl**. It does not guarantee the page will be indexed, or ranked. New sites with little authority can take days to weeks.

### 5.4 What to monitor
- **Pages** (Indexing → Pages): how many are indexed, plus reasons for non-indexed ones.
- **Performance**: *Impressions* (shown in results), *Clicks*, *CTR*, *Average position*, and the **Queries** tab (the real searches that show you).
- **Sitemaps**: processing status.
- **Experience → Core Web Vitals / Mobile usability**: appear once Google has enough data.

### 5.5 Common errors
| Message | Meaning | What to do |
|---|---|---|
| Discovered – currently not indexed | Google knows the URL but hasn't crawled it yet | Wait; add internal links to it; request indexing once |
| Crawled – currently not indexed | Crawled but judged not worth indexing (yet) | Improve content depth/uniqueness (real project details, more text), earn a few links, be patient |
| Duplicate, Google chose different canonical | Google disagrees with your canonical | Check the page is substantially unique; confirm canonical URL is exact and internal links use it |
| Alternate page with proper canonical tag | Normal: a variant URL pointing to the canonical | No action |
| Not found (404) | URL doesn't exist | Fix the link, or remove the URL from the sitemap |
| Sitemap "Couldn't fetch" / "has errors" | Wrong URL or invalid XML | Open the sitemap URL in a browser; it must show XML with `https://gufran-afzal.github.io/Portfolio/...` URLs |

---

## 6. File-by-file implementation

All of these are **already done** in this repository unless marked **Your action**. They're listed so you understand them and can verify.

### 6.1 `content/site.json`
**Why:** single source of truth for the base URL, used for canonicals, `og:url`, and the sitemap.
```json
{
  "name": "Ghufran Afzal",
  "siteUrl": "https://gufran-afzal.github.io/Portfolio",
  "ogImage": "",
  "email": "gufranafzal54@gmail.com",
  "socials": [ { "label": "LinkedIn", "url": "" } ]
}
```
**Verify:** `node build.mjs`, then view-source on any page and find `rel="canonical"`.

### 6.2 `build.mjs` (generator)
**Why:** writes unique `<title>`, description, canonical, Open Graph, JSON-LD, `sitemap.xml`; keeps header/footer identical on every page; makes `404.html` work at any depth. It intentionally does **not** write `robots.txt` (see 2.3).
**Verify:** `node build.mjs` prints `Built 18 files …` and a release checklist.

### 6.3 `partials/head.html`, `partials/header.html`, `partials/footer.html`
**Why:** shared pieces. Header/footer link Home as `{{root}}` (→ `./`, `../`) so internal links match the canonical.
**Your action (Search Console only):** add the `google-site-verification` meta line to `partials/head.html` (5.1).

### 6.4 `sitemap.xml` (generated; do not hand-edit)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://gufran-afzal.github.io/Portfolio/</loc></url>
  <url><loc>https://gufran-afzal.github.io/Portfolio/about-us.html</loc></url>
  <!-- … 16 URLs total, every one a real file … -->
</urlset>
```
**Verify:** open `https://gufran-afzal.github.io/Portfolio/sitemap.xml`; confirm every `<loc>` opens (not 404).

### 6.5 Open Graph share image: **Your action**
1. Create a 1200×630 **PNG or JPG** (your name, "Shopify Developer", simple background). Free tools: Canva, Figma.
2. Save as `assets/img/og-image.png`.
3. In `content/site.json` set `"ogImage": "assets/img/og-image.png"`.
4. `node build.mjs`; this adds `og:image` and switches the Twitter card to `summary_large_image`.
**Verify:** paste a page URL into <https://www.linkedin.com/post-inspector/> (LinkedIn Post Inspector) and check the preview. Platforms cache, so use their "re-scrape" option after changes.

### 6.6 `index.html` / `about-us.html` / `contact.html`
**Why:** hand-authored, with `<!-- @seo -->`, `<!-- @head -->`, `<!-- @header -->`, `<!-- @footer -->` markers synced by the build. Edit page content freely **outside** the markers.
**Verify:** view-source → exactly one `<title>`, one `description`, one `canonical`.

### 6.7 `404.html`
**Why:** `noindex`; absolute `/Portfolio/` URLs so styling and links work at any missing path.
**Verify:** visit `https://gufran-afzal.github.io/Portfolio/does-not-exist`. The styled 404 should appear with working buttons. *(Only testable on the deployed site, not on a local `http.server`.)*

### 6.8 Generated pages (`projects.html`, `articles.html`, `projects/*.html`, `articles/*.html`)
Edit content via `content/projects.json` and `content/articles/*.md`, then rebuild. Never edit the generated HTML directly.

---

## 7. Validation and testing checklist

| Tool | What to do | Success looks like | If it fails |
|---|---|---|---|
| **Direct URL checks** | Open `/sitemap.xml`; open 3 random pages' view-source | Sitemap is valid XML with only working URLs; each page has one title/description/canonical matching its own URL | Re-run `node build.mjs`, push, hard-refresh (Ctrl+Shift+R); confirm Pages deployed the right branch |
| **GSC URL Inspection** | Inspect + **Test live URL** on home | "URL is available to Google"; *User-declared canonical* = *Google-selected canonical* | See 5.5 and section 9 |
| **GSC Pages report** | Check weekly | Count of indexed pages rises toward 16; excluded reasons are expected ones | Open each reason; fix per table |
| **Rich Results Test** (<https://search.google.com/test/rich-results>) | Test an article URL | Detects `Article` with no errors. **The homepage `Person` markup is not eligible for a rich result, so "no rich results" there is normal.** Use <https://validator.schema.org> to check it. | Fix JSON syntax; ensure only true values |
| **PageSpeed Insights** (<https://pagespeed.web.dev>) | Test home + one project, mobile | Green/orange scores, no layout shift warnings | Check "Opportunities"; usually image size or render-blocking fonts |
| **Browser DevTools** | F12 → Network tab (reload, filter by red/404); Console | No 404s, no red errors (a blocked Google Fonts request is only an issue if it fails for you) | Fix path; remember project-site paths include `/Portfolio/` |
| **Lighthouse (DevTools)** | Lighthouse tab → SEO + Accessibility | SEO category near 100 | Follow the listed audits |
| **Mobile check** | Open the site on a phone | No horizontal scroll, text readable, menu works | Report layout bugs |

---

## 8. Implementation roadmap

**Priority 1: Essential technical SEO (do first, ~1 hour)**
1. Merge/push to the branch that Pages deploys; enable **Enforce HTTPS**.
2. Confirm `sitemap.xml` and a page's canonical are live.
3. Verify the property in Search Console; submit the sitemap.
4. Request indexing for home, projects, articles.
5. Test the contact form end to end.

**Priority 2: Content and on-page (weeks 1–4)**
1. Fill real data for every project: `liveUrl`, `cover`, honest `results`, rewritten descriptions.
2. Add the visible "Shopify developer" sentence near the homepage hero.
3. Create the `og-image.png` (6.5).
4. Review the six articles for accuracy. Add real social URLs to `site.json`.
5. Replace placeholder testimonials with real, permitted quotes (or remove them).
6. Optional: dedicated `services.html`.

**Priority 3: Visibility and authority (ongoing)**
1. Link to the portfolio from every profile you control: LinkedIn, GitHub profile README, Upwork/Fiverr, Shopify Partner profile if you have one.
2. Share articles where developers genuinely discuss the topic (Shopify Community forums, dev.to). Don't spam.
3. Earn links by being useful: answer questions, publish good tutorials.

**Monthly maintenance (~20 minutes)**
- GSC: new indexing issues; top queries; pages with impressions but low CTR.
- Re-run PageSpeed on home.
- Publish/refresh one article or project.
- Run `node build.mjs`, check the release checklist, test all links.

---

## 9. Troubleshooting

**Pages not appearing on Google.** First `site:gufran-afzal.github.io/Portfolio` in Google. If nothing: verify GSC, submit sitemap, inspect + request indexing. New sites often wait days to weeks. Make sure no page has `noindex` (only `404.html` should). Thin or placeholder content is the usual reason for "Crawled – not indexed".

**Sitemap errors.** Open the sitemap URL in a browser. Must be at `/Portfolio/sitemap.xml`, `https`, URLs starting `https://gufran-afzal.github.io/Portfolio/`. Re-run `node build.mjs` if anything looks wrong. A sitemap submitted for a property that doesn't contain its URLs is rejected: make sure the GSC property is the `/Portfolio/` prefix.

**Incorrect canonical.** View-source; the canonical must equal the page's own published URL. If it's wrong or missing, check `siteUrl` in `content/site.json` and rebuild. If Google picks a different canonical, make sure internal links and the sitemap use the same exact URL form.

**GitHub Pages 404 errors.**
- Case matters: `Patrice.html` ≠ `patrice.html`.
- File must exist in the branch Pages deploys.
- Repo name is part of the URL: `/Portfolio/` (capital P).
- Allow 1–3 minutes after pushing; check the repo's **Actions** tab for the deployment.

**Missing or duplicate titles.** Run in the repo root: `grep -o "<title>[^<]*" *.html */*.html`. Each must be unique and non-empty. Fix in `build.mjs` or the content file, never inside the `@seo` block.

**Resources failing due to relative paths.** Pages at depth 1 (`projects/…`, `articles/…`) must load `../css/main.css`. The build handles this; if you hand-write a page, mirror an existing one. In DevTools → Network, any red 404 on `/Portfolio/...` shows exactly which path is wrong. Never use root-absolute paths (`/css/main.css`) on a project site.

**Pages indexed under unexpected URLs.** Typical: `/Portfolio/index.html`, extensionless, or `?query` variants. Canonicals consolidate these over time. Verify canonicals; confirm internal links use `./` for home; don't try to "remove" them. Give it a few weeks.

**Impressions without clicks.** You're appearing but not enticing. Look in GSC → Performance → Queries. Rewrite the title/description of that page to match the query's intent; check that the query is actually relevant to you; a position beyond ~10 gets few clicks regardless. Improve content depth and get links; change one thing at a time and wait 2–4 weeks.

---

*Generated for the current repository state. Re-check against GSC after deploying; Google's tools and wording change over time.*
