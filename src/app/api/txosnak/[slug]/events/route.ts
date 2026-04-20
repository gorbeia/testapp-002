import { registerClient, removeClient } from '@/lib/sse';
import { txosnaRepo } from '@/lib/store';

// ── GET /api/txosnak/[slug]/events ────────────────────────────────────────────
// SSE stream per txosna. No auth required.
// Emits events: order:created, order:ready, order:completed, ticket:status_changed, etc.
// Clients connect after placing an order to receive real-time status updates.

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Resolve txosna by slug
  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) {
    return new Response('Not found', { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      registerClient(txosna.id, controller);

      // Send initial heartbeat
      const heartbeat = new TextEncoder().encode(': heartbeat\n\n');
      controller.enqueue(heartbeat);

      request.signal.addEventListener('abort', () => {
        removeClient(txosna.id, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx: disable proxy buffering
    },
  });
}
