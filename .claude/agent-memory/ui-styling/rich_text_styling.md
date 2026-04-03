---
name: Rich Text Styling
description: How Quill editor HTML output is styled; the .rich-text component class and overflow fix pattern
type: project
---

Product descriptions are stored as Quill HTML and rendered with `dangerouslySetInnerHTML`.

**The .rich-text class** is defined in `src/app/globals.css` inside `@layer components`. It covers every element Quill can emit:
- Containment: `w-full min-w-0 overflow-hidden` + `word-break: break-word; overflow-wrap: break-word` on the root
- p, h1–h6, strong/b/em/i/u/s, a, ul/ol/li (including nested), blockquote, code/pre, img, hr
- Quill-specific: `.ql-indent-1` through `.ql-indent-8`, `.ql-align-*`
- All colours reference design tokens (no hardcoded hex)

**Usage in JSX:**
```tsx
<div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
```

**Overflow fix pattern for any Tabs+rich-text combo:**
- `<Tabs className="... w-full overflow-hidden">`
- `<TabsContent className="mt-6 min-w-0">` — `min-w-0` collapses grid/flex intrinsic minimum

**Why:** Without `word-break: break-word` and `min-w-0` on flex/grid children, long unbroken strings or Quill content with explicit widths blow past the container.
**How to apply:** Any new page rendering Quill HTML should use `className="rich-text"` and ensure its parent has `overflow-hidden` or `min-w-0`.
