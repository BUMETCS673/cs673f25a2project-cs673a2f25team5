# Frontend Guidelines

## Stack Snapshot

- **Framework**: Next.js 15 App Router with TypeScript (`src/app`)
- **Styling**: Tailwind CSS v4 (`globals.css` + utility layers) with custom font variables from `next/font`
- **Animations & UX**: Framer Motion page wrapper (`PageTransitions`) and Sonner toasts
- **Aliases**: `@/` resolves to `code/frontend/src` (see `tsconfig.json`)

## Styling Guidelines

### Core Principles

- Favor Tailwind utility classes for layout, spacing, color, and typography. Reach for component-scoped CSS only when utilities cannot express the design succinctly.
- Keep class lists readable: group by layout → spacing → typography → effects. Prettier with `prettier-plugin-tailwindcss` already enforces deterministic ordering.
- Use semantic HTML and compose Tailwind utilities on top; avoid div-only structures when buttons/links/headings apply.

### Theme & Tokens

- Global color tokens live in `globals.css` (`--background`, `--foreground`) and are exposed inside the Tailwind theme via `@theme inline`. Add new design tokens there and reference them with Tailwind color utilities (e.g. `bg-[color:var(--color-background)]`).
- Dark mode inherits root variables. When introducing new colors, provide both light and dark values to keep parity.
- Typography stacks are defined with font variables (`--font-geist-sans`, `--font-geist-mono`, `--font-sanchez`). Reuse the provided helper classes (`font-sanchez`, `font-atkinson-hyperlegible-next`) instead of re-declaring fonts.

### Component Styling Patterns

- For reusable building blocks (buttons, cards, form fields) add the component under `src/components/ui` and expose size/state variants with props rather than duplicating class strings.
- For section-level compositions (hero, features) co-locate style decisions beside the component in its feature folder (`src/components/<feature>`). Keep large background effects (gradients, blurs) inside the component so the page stays declarative.
- Use flex/grid utilities for layout. Prefer responsive Tailwind breakpoints (`sm:`, `md:`, `lg:`) over media queries; if bespoke breakpoints are needed add them to the Tailwind config.
- Animations should leverage Framer Motion or Tailwind transition utilities. Keep motion parameters consistent (e.g. transition easing `[0.2, 0.8, 0.2, 1]` matches `PageTransitions`).

### Accessibility & Interaction

- Always provide visible focus styles. Tailwind utilities like `focus-visible:outline` should be layered onto interactive elements.
- Toasts for async workflows should go through `sonner` (import `{ toast }` from "sonner"). Provide `aria-live` friendly fallbacks when toasts are not sufficient.

## App Router Page Scaffolding

1. **Create the route folder** under `src/app`. Example: `src/app/dashboard/page.tsx`.
2. **Decide on render mode**:
   - Server components by default (no `"use client"`) for data fetching, redirects, and cookie checks.
   - Add `"use client"` only when using stateful hooks, browser APIs, or client-only libraries.
3. **Guarded routes**: use `getLoginCookie()` from `@/actions/auth` and `redirect` from `next/navigation` to protect pages (see `create-events/page.tsx`). Surface unauthorized states via query parameters so the landing page can display a toast.
4. **Structure**: wrap page content with semantic elements (`<section>`, `<header>`, etc.) and descriptive Tailwind classes. Keep the top-level container responsive (`max-w-*`, `px-*`, `py-*`).
5. **Metadata**: export `metadata` or `generateMetadata` where needed to override defaults from `layout.tsx`.
6. **Page transitions**: `RootLayout` already wraps routes with `PageTransitions`. Ensure your page’s root element is motion-friendly (e.g. avoid fragments that render nothing) so transitions stay smooth.

```tsx
// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getLoginCookie } from "@/actions/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const cookie = await getLoginCookie();
  if (!cookie) redirect("/?error=unauthorized");

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <DashboardShell organizerEmail={cookie.value} />
    </section>
  );
}
```

Optional route files:

- `loading.tsx` for skeleton states.
- `error.tsx` (client component) for error boundaries; wrap content in `ClientBoundary` if reusing transitions.
- `route.ts` for API endpoints colocated with the route.

## Component Scaffolding

### Folder Conventions

- `src/components/ui`: Design system primitives (headers, buttons, inputs, modal shells).
- `src/components/<feature>`: Feature modules composed from primitives (`landing`, `events`, `auth`, etc.).
- `src/components/text`: Shared typography helpers.

Naming: `PascalCase` file names for React components (`CreateEventForm.tsx`). Export a named component when multiple exports live in the file, otherwise default export is acceptable.

### Component Template

```tsx
// src/components/events/EventCard.tsx
"use client";
import type { ComponentPropsWithoutRef } from "react";

type EventCardProps = {
  title: string;
  date: string;
} & ComponentPropsWithoutRef<"article">;

export function EventCard({
  title,
  date,
  className = "",
  ...rest
}: EventCardProps) {
  return (
    <article
      className={`rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm shadow-neutral-200/30 backdrop-blur ${className}`}
      {...rest}
    >
      <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500">{date}</p>
    </article>
  );
}
```

Guidelines:

- Add `'use client'` when a component relies on hooks or browser APIs (forms, animations). Leave it off for pure presentational or server-only helpers.
- Type props explicitly; extend intrinsic element props when forwarding attributes.
- Expose a `className` prop for styling overrides and merge it with `clsx` or template strings (install `clsx` if merging gets complex).
- Co-locate mock data (like `landingData.ts`) next to the component. Use `.mock.ts` naming for fixtures to keep imports clear.
- Provide simple unit or interaction tests once a component houses logic. Playwright e2e specs live under `tests` (configure routes before adding).

## Working With Fonts & Layout

- `layout.tsx` injects `Geist`, `Geist_Mono`, and `Sanchez`. Any new global font should be registered there to preserve SSR font loading.
- Layout already renders `Header` and `Toaster`. Pages should not remount these; instead pass the data they need via props or context.

## Linting & Formatting

- Run `npm run lint` before committing to catch accessibility, Next.js, and TypeScript issues.
- Use Prettier (with Tailwind plugin) to keep class orders consistent. Configure your editor to format on save.
- Keep imports sorted logically: external packages → alias imports (`@/…`) → relative paths.

## Suggested Workflow

1. Design component/page in isolation (Storybook is not set up yet; consider adding it under `src/components/ui` when needed).
2. Implement with Tailwind utilities and feature-specific data.
3. Test interactions locally (`npm run dev`), validate guard logic, and confirm page transitions remain smooth.
4. Add E2E coverage (`npm run test:e2e`) once flows are stable.

## Appendix

- **Environment**: The frontend lives under `code/frontend`. Use `npm` for dependency management.
- **Assets**: Add static assets under `public/`; import with `/` URLs inside components.
- **State**: Prefer React state/hooks. Introduce data libraries (TanStack Query, Zustand) only after alignment with the team.

## Environment variables

Set in `code/frontend/.env.local` for local dev and as repo secrets for CI:

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLERK_JWKS_URL
- CLERK_WEBHOOK_SIGNING_SECRET
- BACKEND_URL
- NEXT_PUBLIC_MAPBOX_TOKEN
- NEXT_PUBLIC_E2E (optional; set to "1" to bypass auth in tests)
