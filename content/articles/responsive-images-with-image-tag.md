---
title: Responsive Shopify images with image_tag, done properly
date: 2026-09-12
category: Performance
tags: Images, Liquid, Core Web Vitals
excerpt: Stop shipping one giant image to every device. A practical pattern for widths, sizes and loading priority in Liquid.
---
Images are usually the heaviest part of a storefront, and the easiest place to win back speed. Shopify's `image_url` and `image_tag` filters give you almost everything you need, if you actually use their options.

## Generate a set of widths

Instead of one fixed size, ask Shopify to output a `srcset` with several widths and tell the browser how wide the image will be displayed through `sizes`.

```liquid
{{ product.featured_image
  | image_url: width: 1600
  | image_tag:
      widths: '400, 600, 800, 1200, 1600',
      sizes: '(min-width: 990px) 50vw, 100vw',
      alt: product.featured_image.alt }}
```

The browser now picks the smallest file that still looks sharp on that screen. A phone no longer downloads a desktop-sized image.

## Write `sizes` honestly

`sizes` is a description of layout, not a guess. If the image fills half the viewport on desktop and the full width on mobile, say exactly that. A wrong `sizes` value quietly makes the browser choose a file that is too large or too small.

## Treat the first image differently

Images below the fold should load lazily. The main image at the top of the page should not, and it should be prioritised, because it is usually the Largest Contentful Paint element.

```liquid
{{ section.settings.hero_image
  | image_url: width: 1800
  | image_tag:
      widths: '800, 1200, 1800',
      sizes: '100vw',
      loading: 'eager',
      fetchpriority: 'high' }}
```

## Always keep dimensions

`image_tag` outputs width and height attributes from the image itself. Leave them in. They let the browser reserve space before the image arrives, which prevents layout shift.

## Quick checklist

- Use a `widths` list, not a single size.
- Write an accurate `sizes` value.
- Eager and high priority for the first visible image only.
- Lazy for everything else.
- Never remove width and height.

Small changes, applied consistently across a theme, add up to a noticeably lighter page.
