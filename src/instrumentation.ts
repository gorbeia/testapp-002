// Next.js instrumentation hook — runs once when the server process starts,
// before any request is handled. Importing the store module here ensures the
// in-memory database is populated (seed() + seedDemoAssociation()) before the
// first API call, regardless of which route is hit first.
//
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run on the Node.js runtime (not in the Edge runtime or during
  // static generation, where the in-memory store is not meaningful).
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/store/memory');
  }
}
