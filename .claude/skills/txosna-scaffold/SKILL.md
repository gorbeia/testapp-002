---
name: txosna-scaffold
description: >
  Scaffold a new feature in the txosnabai festival-stall ordering app following
  its exact conventions: repository pattern (import from @/lib/store, never
  memory.ts directly), NextAuth 5 auth, PROTO_MODE test bypass, next-intl locale
  routing, NextResponse.json, and Vitest unit tests. Use this skill whenever
  someone working on txosnabai wants to add a new route, API endpoint, page, or
  screen — even if they say "add X feature", "create a new page for Y", "scaffold
  Z", or "I need an endpoint for W". Covers (public), (customer), (volunteer), and
  (admin) route groups, optional SSE (ReadableStream only, never WebSockets), and
  optional Prisma schema additions.
---

# txosna-scaffold

You are scaffolding a new feature for **txosnabai**, a multi-tenant festival stall
ordering system. The project has strict conventions; your job is to generate code
that is correct-by-default so the developer starts from something that already
compiles and passes lint.

## Step 1 — Gather requirements

Ask (or infer from context) the following. State your assumptions and proceed unless
the user corrects you.

1. **Resource name** — e.g. `notifications`, `shifts`, `reports`
2. **Route group** — `(public)`, `(customer)`, `(volunteer)`, or `(admin)`
3. **HTTP methods** needed — `GET`, `POST`, `PUT`, `DELETE`
4. **Auth required?** — yes / no / volunteer only / admin only
5. **Real-time updates?** — yes (SSE) / no
6. **New Prisma entity needed?** — yes / no / unsure

---

## Step 2 — Schema and store layer (if new entity needed)

If a new entity is needed, remind the user to:

1. Add the model to `prisma/schema.prisma`
2. Run: `pnpm prisma migrate dev --name <migration-name> && pnpm prisma generate`
3. Add a `StoredXxx` type, a `XxxRepository` interface, and a `CreateXxxInput` type
   to `src/lib/store/types.ts`
4. Implement the in-memory repo in `src/lib/store/memory.ts` (array + CRUD methods)
5. Export the new repo from `src/lib/store/index.ts`

Only after those steps will `import { xxxRepo } from '@/lib/store'` resolve.

**If no Prisma entity is needed** (data lives in memory only), still follow the
same repo shape and export it from `@/lib/store`. Do NOT create a separate
standalone module like `src/lib/xxx-store.ts` — that makes the feature harder to
migrate to Prisma later. Instead, add the in-memory repo directly to
`src/lib/store/memory.ts` and export it through `src/lib/store/index.ts`.

---

## Step 3 — Generate the files

Write all three files with real, working code. No TODO placeholders for the
boilerplate — only `// TODO` where the developer's actual business logic goes.

### File 1: `src/app/api/<resource>/route.ts`

```ts
import { NextResponse } from 'next/server';
import { auth } from 'next-auth';
import { <resource>Repo } from '@/lib/store';

export async function GET() {
  if (process.env.PROTO_MODE !== 'true') {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await <resource>Repo.list();
  return NextResponse.json(items);
}
```

**Rules — never deviate:**

- Import repos from `@/lib/store` **only** — never from `memory.ts` directly
- Use `NextResponse.json(data, { status })` for every response — never `Response.json`
- Wrap the `auth()` call: `if (process.env.PROTO_MODE !== 'true') { const session = await auth(); if (!session) return ... }`
- Derive `associationId` from `session.user.associationId` — never hard-code it
- Only export the HTTP methods the user asked for

**SSE endpoint** — use this pattern instead of a regular GET:

```ts
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      // TODO: subscribe to updates, call send(), close on cleanup
      request.signal.addEventListener('abort', () => controller.close());
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

Check `src/lib/sse.ts` first — if there is an existing `registerClient` /
`removeClient` / `broadcast` utility, prefer using it over a raw `ReadableStream`.

---

### File 2: `src/app/(<group>)/[locale]/<resource>/page.tsx`

**Default: Server Component** — only add `'use client'` when the page genuinely
needs hooks or browser APIs (e.g. `EventSource` for SSE, user-input forms).

```tsx
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function <Resource>Page({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: '<Resource>' });

  return (
    <main>
      <h1>{t('title')}</h1>
    </main>
  );
}
```

**Rules:**

- `params` is always `Promise<{…}>` in Next.js 16 — always `await` it
- Use `getTranslations` (async, server) in Server Components
- Use `useTranslations` (hook) in Client Components — **never hardcode UI strings**
- Add a matching namespace to `messages/en.json` (and other locale files):
  `{ "<Resource>": { "title": "<Human readable title>" } }`

---

### File 3: `src/app/api/<resource>/__tests__/route.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/store', () => ({
  <resource>Repo: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock('next-auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { associationId: 'assoc-1' } }),
}));

describe('GET /api/<resource>', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with an array', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
```

---

## Step 4 — Post-scaffold checklist

Print this after generating the files:

```
Post-scaffold checklist
───────────────────────
[ ] prisma/schema.prisma updated (if new entity)
[ ] pnpm prisma migrate dev && pnpm prisma generate (if schema changed)
[ ] StoredXxx + XxxRepository added to src/lib/store/types.ts (if new entity)
[ ] In-memory repo added to src/lib/store/memory.ts + exported from index.ts
[ ] messages/en.json (and other locales) updated with namespace keys
[ ] pnpm lint && pnpm typecheck — fix any errors before committing
[ ] pnpm test — unit tests should pass
[ ] Wire up navigation link in the relevant layout/nav component
```

---

## Convention reference

| Rule                                                         | Reason                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Import only from `@/lib/store`                               | Storage-agnostic; Phase 10 Prisma swap requires no handler changes |
| In-memory repos live in `memory.ts`, exported via `index.ts` | Consistent store layer; easier Prisma migration                    |
| `NextResponse.json` not `Response.json`                      | Next.js 16 typing requirement                                      |
| `PROTO_MODE !== 'true'` wraps the auth check                 | Integration tests bypass auth without touching handler logic       |
| `params` is a `Promise<{…}>` — always await                  | Next.js 16 breaking change; skipping causes silent runtime errors  |
| `StoredXxx` types mirror Prisma models as plain JS           | Domain layer stays decoupled from the ORM                          |
| SSE via `ReadableStream`, never WebSockets                   | Matches existing real-time architecture; see `src/lib/sse.ts`      |
| `getTranslations` / `useTranslations` for all UI strings     | next-intl is required; hardcoded strings break locale switching    |
| `[locale]` dynamic segment on all pages                      | next-intl routing requirement                                      |
