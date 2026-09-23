---
trigger: always_on
---

# Antigravity Next.js Engineering & UI/UX Constitution

## 1. Graphify Knowledge Graph & API Grounding
- Authority: The Graphify knowledge graph (`graphify-out/` or `.graphify/`), `./docs/`, and `./docs/api/swagger.json` serve as the single source of truth.
- Phased Workflow:
  1. Planning & Contracts: Consult `graphify-out/GRAPH_REPORT.md` and `./docs/api/swagger.json` before writing components or API routes.
  2. Implementation: Traverse AST dependencies in `./src` via Graphify to ensure full component and client-fetcher reuse.
- Production Backend Target:
  - Base URL: `https://hajj-umrah-backend.vercel.app`
  - Always use `process.env.NEXT_PUBLIC_API_URL` (defaulting to the production URL). Never hardcode `localhost` endpoints into production calls.

## 2. Agent Execution Budgets
- Average Task Window: Target completion within ~25 minutes per execution cycle.
- Hard Execution Ceiling: Maximum 50 minutes. If a task risks exceeding this cap, decompose it into isolated PRs/deliverables and report status immediately.

## 3. UI/UX: Polished, Modern & Professional
- Modern Aesthetic & Micro-interactions:
  - Deliver clean, minimalist, high-end interfaces (think Stripe / Vercel design fidelity).
  - Avoid crude, unstyled HTML elements, unpadded cards, and default browser focus rings.
  - Implement smooth, subtle micro-interactions: hover transitions (`transition-all duration-200 ease-in-out`), active click scaling (`active:scale-[0.98]`), and refined focus indicators (`focus-visible:ring-2 focus-visible:ring-offset-2`).
- Visual Hierarchy & Typography:
  - Establish a crisp typographic scale with clear contrast between headers (`font-semibold tracking-tight`), subheadings, and muted body copy.
  - Enforce intentional negative space: use consistent vertical and horizontal rhythm with Tailwind scales (`gap-4`, `p-6`, `space-y-4`).
- Cohesive Design Tokens & Semantic Palettes:
  - Restrict colors strictly to semantic tokens: primary, secondary, surface/card backgrounds, borders (`border-border`), and subdued text (`text-muted-foreground`).
  - Seamless Light/Dark Theme: Ensure all components render cleanly in both modes with sufficient WCAG AA contrast.
- Polished Feedback States:
  - Never leave the user hanging: provide instant visual feedback on actions.
  - Skeleton screens (prefer shimmer over jarring blank spaces) during data loading.
  - Clear empty states with icons, human-readable explanations, and primary call-to-action buttons.
  - Dedicated toast notifications (`sonner` or clean Radix-based toasts) for async actions, mutation successes, and error handling.

## 4. Architecture, File Sizing & Modularity
- Line Count Limit: No file may exceed 500 lines of code under any circumstance.
- Anti-File Explosion: Avoid creating single-line utility files or premature micro-components. Co-locate route-specific sub-components in a local `_components/` directory before promoting them to shared `@/components/ui/`.
- Senior Engineer Pragmatism:
  - Write human-readable, self-documenting code.
  - Follow pragmatic SOLID, DRY, KISS, and YAGNI—avoid over-abstracted generic wrappers that obscure control flow.

## 5. Next.js Performance, Code Splitting & Suspense
- React Server Components (RSC): Components are Server Components by default. Restrict `'use client'` strictly to leaf nodes needing state or browser events.
- Suspense Boundaries: Wrap dynamic or latency-sensitive widgets in `<Suspense fallback={<ComponentSkeleton />}>`.
- Lazy Loading & Dynamic Imports: Use `next/dynamic` for heavy client modules (charts, modal sheets, rich text editors, third-party libraries) with `ssr: false` where appropriate.

## 6. SEO & Accessibility Standards
- App Router Metadata: Every `page.tsx` must export typed static `Metadata` or dynamic `generateMetadata()`.
- Semantic Structure: Exactly one `<h1>` per page, accompanied by proper sectioning tags (`<header>`, `<main>`, `<section>`, `<footer>`).
- Core Web Vitals:
  - Images: Enforce `next/image` with explicit dimensions, responsive `sizes`, and descriptive `alt` tags.
  - Fonts: Use `next/font` for local font optimization to eliminate layout shifts (CLS).