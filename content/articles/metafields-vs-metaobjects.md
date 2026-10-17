---
title: Metafields vs metaobjects: which one should you use?
date: 2026-08-14
category: Liquid & Themes
tags: Metafields, Metaobjects, Data modelling
excerpt: Both store custom data. They solve different problems, and choosing the wrong one makes a store harder to manage.
---
Shopify gives you two ways to store custom content, and they are easy to mix up. A simple rule of thumb gets you most of the way there.

## Metafields: extra data on something that already exists

A metafield adds a field to an existing resource: a product, variant, collection, customer or the shop itself. Think care instructions on a product, or a size chart note on a variant.

```liquid
{% if product.metafields.custom.care_instructions %}
  <p>{{ product.metafields.custom.care_instructions.value }}</p>
{% endif %}
```

## Metaobjects: your own structured content

A metaobject is a record type you define yourself, with its own fields. Examples are a designer profile, an ingredient, a store location or a size guide. Records are created once and can be reused in many places, typically by referencing them from a metafield.

## Choosing between them

- Is the data a single attribute of one product or collection? Use a **metafield**.
- Is it a thing in its own right that several products share? Use a **metaobject**.
- Will the merchant want to edit it in one place and have every page update? Use a **metaobject**.

## A practical example

An "ingredients" list shared across many products is a good fit for metaobjects: each ingredient is defined once with a name, description and image. Each product then references the ingredients it contains. Change the description in one place, and every product page reflects it.

## Tips

- Name definitions clearly. Merchants will see them in the admin.
- Pick the right field type up front, since it affects validation and how the value renders.
- Check Shopify's documentation for the exact Liquid syntax for each field type before building.

Modelling data well early saves a lot of rework later, and gives the merchant a cleaner admin to work in.
