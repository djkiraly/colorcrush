---
name: Guide panel location and structure
description: Where the admin guide content lives and how it is structured
type: project
---

The admin guide panel content is hardcoded JSX in `src/app/admin/guide/page.tsx`.

Content is stored as a `guides` array with type `{ category: string; sections: { title: string; content: string[] }[] }[]`.

Each string in `content` renders as a separate `<p>` paragraph. There is no MDX, no database — it is a plain TypeScript data structure in the same file as the rendering component.

To add or update documentation, edit the `guides` array in that file directly.

**Why:** The project chose static JSX over MDX or DB-driven content for simplicity.

**How to apply:** When asked to update the guide, edit `src/app/admin/guide/page.tsx` — no CMS, no content pipeline.
