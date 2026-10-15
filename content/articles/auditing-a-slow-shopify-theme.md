---
title: Case study: auditing a slow Shopify theme, step by step
date: 2026-09-24
category: Case studies
tags: Performance, Audit, Theme
excerpt: The repeatable order I follow when a store feels slow, so the biggest wins come first and every change is measured.
---
"The store feels slow" is not a task. It becomes one once you can point at what is slow and why. This is the order I follow on most audits, designed so the cheapest, highest-impact fixes come first.

## 1. Measure before touching anything

Run PageSpeed Insights on the home page, a collection page and a product page, on mobile. Save the results. Without a baseline you cannot prove anything improved, and you cannot tell which change helped.

## 2. Look at what the page loads

Open the browser's network panel and sort by size, then by start time. The usual suspects:

- Large, unoptimised images, especially the hero.
- Scripts from apps that are no longer used but still inject code.
- Web fonts loaded in more weights than the design uses.
- Render-blocking JavaScript in the `<head>`.

## 3. Check Liquid render time

Slow server-side rendering is invisible in front-end tools. The Shopify Theme Inspector for Chrome shows a flame graph of Liquid render time, which points straight at expensive loops and repeated lookups.

## 4. Lint the theme

Shopify CLI includes Theme Check, which flags common problems such as deprecated tags, missing image dimensions and unused snippets.

```bash
shopify theme check
```

## 5. Fix in order of impact

1. Resize and serve images responsively (see my article on `image_tag`).
2. Remove app code that is not in use, and uninstall the app properly.
3. Defer non-critical JavaScript.
4. Trim fonts to the weights actually used, with a sensible fallback.
5. Simplify the most expensive Liquid loops.

## 6. Re-measure and write it down

Run the same three pages again and compare to the baseline. Keep a short changelog so the next person knows what was changed and why.

## The takeaway

Most slow themes are not slow for one dramatic reason. They are slow because of a dozen small, accumulated ones. A fixed order and a baseline turn a vague complaint into a short, defensible to-do list.
