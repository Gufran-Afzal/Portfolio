---
title: Building flexible theme sections: schema, blocks and presets
date: 2026-08-29
category: Liquid & Themes
tags: Sections, Theme editor, Liquid
excerpt: The three parts of a section schema that decide whether a merchant can actually use your work without calling you.
---
A section is only as good as what the merchant can do with it. Good section schema is the difference between "I need a developer for this" and "I'll just change it in the editor."

## Settings: the section's own options

Settings control the section as a whole: which collection to show, how many products, a background style.

## Blocks: repeatable content

Blocks let merchants add, remove and reorder pieces inside a section, such as feature items, slides or FAQs. Each block type has its own settings.

## Presets: make it addable

Without a preset, a section cannot be added from the editor's "Add section" menu. It is a small detail that is easy to forget.

## A compact example

```liquid
A compact example
<section class="featured" {{ "{{" }} section.shopify_attributes {{ "}}" }}>
  {% raw %}{% for block in section.blocks %}
    <h2 {{ block.shopify_attributes }}>{{ block.settings.text }}</h2>
  {% endfor %}

  {% schema %}
  {
    "name": "Featured collection",
    "settings": [
      {
        "type": "collection",
        "id": "collection",
        "label": "Collection"
      },
      {
        "type": "range",
        "id": "products_to_show",
        "min": 2,
        "max": 12,
        "step": 1,
        "default": 4,
        "label": "Products to show"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "name": "Heading",
        "limit": 1,
        "settings": [
          {
            "type": "text",
            "id": "text",
            "label": "Text",
            "default": "Featured"
          }
        ]
      }
    ],
    "presets": [
      {
        "name": "Featured collection"
      }
    ]
  }
  {% endschema %}{% endraw %}

Habits worth keeping
Output shopify_attributes on the section and its blocks, so the editor can highlight them when selected.
Give every setting a sensible default. An empty section looks broken.
Use ranges and selects over free text when the options are limited.
Keep settings few and meaningful. Every extra option is something the merchant has to understand.

Designing the schema is designing the merchant's experience. It deserves the same care as the visual design.
```

## Habits worth keeping

- **Output `shopify_attributes`** on the section and its blocks, so the editor can highlight them when selected.
- **Give every setting a sensible default.** An empty section looks broken.
- **Use ranges and selects over free text** when the options are limited.
- **Keep settings few and meaningful.** Every extra option is something the merchant has to understand.

Designing the schema is designing the merchant's experience. It deserves the same care as the visual design.
