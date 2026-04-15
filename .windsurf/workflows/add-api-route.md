---
description: Create a new API route handler with proper auth and multitenancy
---

1. Determine the route location under `src/app/api/`:
   - Public endpoints (no auth): e.g. `api/payments/webhook/`
   - Protected endpoints: require auth check

2. Create the Route Handler file:

   ```
   src/app/api/resource/route.ts        ← collection endpoint
   src/app/api/resource/[id]/route.ts   ← item endpoint
   ```

3. For protected endpoints, add auth check at the top:

   ```typescript
   import { auth } from '@/lib/auth';

   export async function GET(request: Request) {
     const session = await auth();
     if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
     // ...
   }
   ```

4. **Always include `associationId` filter** in database queries for multitenancy:

   ```typescript
   const associationId = (session.user as any).associationId;
   const data = await prisma.model.findMany({ where: { associationId } });
   ```

5. For admin-only endpoints, check role:

   ```typescript
   if ((session.user as any).role !== 'ADMIN') {
     return Response.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

6. For SSE endpoints, use the broadcast pattern from `src/lib/sse.ts`:

   ```typescript
   import { registerClient, removeClient } from '@/lib/sse';

   export async function GET(request: Request, { params }: { params: { id: string } }) {
     const stream = new ReadableStream({
       start(controller) {
         registerClient(params.id, controller);
         request.signal.addEventListener('abort', () => removeClient(params.id, controller));
       },
     });
     return new Response(stream, {
       headers: {
         'Content-Type': 'text/event-stream',
         'Cache-Control': 'no-cache',
         Connection: 'keep-alive',
       },
     });
   }
   ```

7. Use `safePrisma` from `@/lib/prisma` if the endpoint needs to work in UI prototyping mode (no database).

8. After mutations that change order/ticket status, broadcast via SSE:
   ```typescript
   import { broadcast } from '@/lib/sse';
   broadcast(txosnaId, 'ticket-status-changed', { ticketId, status });
   ```
