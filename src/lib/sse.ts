// SSE client registry — one Map per txosna
// All real-time updates (order status, stock, pause/close) flow through here.

type Controller = ReadableStreamDefaultController;

const clients = new Map<string, Set<Controller>>();

export function registerClient(txosnaId: string, controller: Controller) {
  if (!clients.has(txosnaId)) clients.set(txosnaId, new Set());
  clients.get(txosnaId)!.add(controller);
}

export function removeClient(txosnaId: string, controller: Controller) {
  clients.get(txosnaId)?.delete(controller);
  if (clients.get(txosnaId)?.size === 0) clients.delete(txosnaId);
}

export function broadcast(txosnaId: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);
  clients.get(txosnaId)?.forEach((ctrl) => {
    try {
      ctrl.enqueue(encoded);
    } catch {
      // client disconnected; will be cleaned up via abort signal
    }
  });
}
