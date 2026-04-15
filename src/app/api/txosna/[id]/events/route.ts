import { registerClient, removeClient } from '@/lib/sse';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: txosnaId } = await params;

  // Verify the txosna exists and is not demo
  const txosna = await prisma.txosna.findUnique({ where: { id: txosnaId } });
  if (!txosna || txosna.isDemo) {
    return new Response('Not found', { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      registerClient(txosnaId, controller);

      // Send initial heartbeat
      const heartbeat = new TextEncoder().encode(': heartbeat\n\n');
      controller.enqueue(heartbeat);

      request.signal.addEventListener('abort', () => {
        removeClient(txosnaId, controller);
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
