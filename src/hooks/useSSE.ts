'use client';
import { useEffect, useRef } from 'react';

type SSEHandlers = Record<string, (data: unknown) => void>;

/**
 * Subscribe to the txosna SSE event stream.
 * Opens EventSource('/api/txosnak/{slug}/events'), registers the provided
 * event handlers, and cleans up on unmount or slug change.
 *
 * Reconnects with exponential backoff (max 30s) on connection error.
 */
export function useSSE(slug: string | null, handlers: SSEHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!slug) return;

    let es: EventSource | null = null;
    let retryDelay = 1000;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      es = new EventSource(`/api/txosnak/${slug}/events`);

      es.onopen = () => {
        retryDelay = 1000;
      };

      es.onerror = () => {
        es?.close();
        if (!destroyed) {
          setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 30_000);
        }
      };

      // Attach all handlers from the ref (stays current without re-running the effect)
      const allEvents = [
        'order:created',
        'order:pending',
        'order:confirmed',
        'order:ready',
        'order:cancelled',
        'ticket:status_changed',
        'txosna:status_changed',
      ];

      for (const event of allEvents) {
        es.addEventListener(event, (e: MessageEvent) => {
          const handler = handlersRef.current[event];
          if (handler) {
            try {
              handler(JSON.parse(e.data));
            } catch {
              handler(e.data);
            }
          }
        });
      }
    }

    connect();

    return () => {
      destroyed = true;
      es?.close();
    };
  }, [slug]);
}
