<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Stumar Maspindzeli guest storefront

Guest-facing app (NFC room tags open `/r/<token>`). Guests never sign in, so
there is no Clerk here and no auth provider.

## Backend lives in the admin repo

- The Convex backend is in `../stumarmaspindzeli/convex`. **Never run
  `npx convex dev` or `npx convex deploy` in this repo**: it would create a
  second, empty deployment.
- `lib/convex/api.ts` is generated. Do not edit it. To change or add a
  function, edit the admin repo, keep its `npx convex dev` running, then run
  `npm run api:sync` there. That rewrites this file.
- Import `api` from `@/lib/convex/api`, never from `convex/_generated`.
- `NEXT_PUBLIC_CONVEX_URL` in `.env.local` points at the shared deployment.

## Conventions

- Dev server: `npm run dev` on port 3100 (3000/3001 are taken on this machine).
- UI follows the Tabela reference: white page, `bg-panel` stone sections,
  `bg-graphite` dark cards, lime (`bg-lime`, `text-lime-soft`) as the only
  accent, Red Hat Display + Caveat. Tokens live in `app/globals.css`.
- Animations use `motion` (`motion/react`); every looping preview must render
  a sensible still frame at tick 0 for reduced-motion users.
- Everything guests see comes from Convex: `api.guest.storefront.bySlug` (browse, `/` and `/h/[slug]`)
  and `byToken` (room tags, `/r/[token]`). Managers edit it in the admin's "Guest app" page. Never hard-code
  hotel content here; add a tile type or field in the admin repo instead.
- Guest actions call `api.guest.requests.*`; the tracker is a live query, so staff changes show instantly.
