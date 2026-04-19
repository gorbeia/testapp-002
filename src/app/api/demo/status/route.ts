import { DEMO_PIN, DEMO_PRIMARY_SLUG, DEMO_SECONDARY_SLUG } from '@/lib/fixtures/demo';

export async function GET() {
  const enabled = !!process.env.DEMO_RESET_SECRET;

  if (!enabled) {
    return Response.json({ enabled: false });
  }

  return Response.json({
    enabled: true,
    slugs: [DEMO_PRIMARY_SLUG, DEMO_SECONDARY_SLUG],
    pin: DEMO_PIN,
  });
}
