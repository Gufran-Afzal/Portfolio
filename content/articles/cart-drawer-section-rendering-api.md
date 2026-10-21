---
title: Case study: a no-reload Shopify cart drawer
date: 2026-10-08
category: Case studies
tags: Cart, JavaScript, Liquid
excerpt: How I build an add-to-cart flow that updates the cart drawer instantly, without reloading the page or re-implementing cart markup in JavaScript.
---
A cart drawer is one of the most common feature requests on Shopify stores, and one of the easiest to get subtly wrong. This breakdown walks through the approach I reach for first: let Shopify render the drawer, and let JavaScript only swap it in.

## The problem

The classic shortcut is to fetch the cart as JSON and rebuild the drawer in JavaScript. It works on day one. Then someone adds a discount line, a subscription, or a gift note, and now the cart markup lives in two places: Liquid and a JS template. They drift apart, and bugs appear in whichever copy nobody remembers.

## The approach

The Section Rendering API lets a cart request return freshly rendered section HTML in the same response. The drawer stays a normal Liquid section, so there is one source of truth for its markup.

1. Create `sections/cart-drawer.liquid` with a wrapper element that has a stable id.
2. Request that section when adding to the cart.
3. Parse the returned HTML and replace the existing drawer.

## The code

```js
async function addToCart(variantId, quantity = 1) {
  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      items: [{ id: variantId, quantity }],
      sections: 'cart-drawer',
      sections_url: window.location.pathname,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // e.g. 422 when the requested quantity is not available
    throw new Error(data.description || data.message || 'Could not add to cart');
  }

  const incoming = new DOMParser()
    .parseFromString(data.sections['cart-drawer'], 'text/html')
    .querySelector('#CartDrawer');

  document.querySelector('#CartDrawer').replaceWith(incoming);
}
```

## Details that matter

- **Handle failure visibly.** `add.js` returns an error response when stock runs out. Show that message in the drawer instead of failing silently.
- **Keep focus sane.** When the drawer opens, move focus into it, trap it while open, and return it to the trigger on close.
- **Update the cart count too.** Add the header's cart-count section to the `sections` parameter (comma separated) and swap it the same way.
- **Disable the button while the request runs.** It prevents accidental double adds on slow connections.

## Why I like this pattern

The drawer is just Liquid, so the merchant's team and any future developer can change it the normal way. The JavaScript stays small, and there is no second template to keep in sync.
