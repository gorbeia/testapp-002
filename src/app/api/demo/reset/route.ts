import { DEMO_PIN, DEMO_PRIMARY_SLUG, DEMO_SECONDARY_SLUG } from '@/lib/fixtures/demo';
import { resetDemoAssociation } from '@/lib/store';

export async function POST(request: Request) {
  const secret = process.env.DEMO_RESET_SECRET;

  if (!secret) {
    return Response.json({ error: 'Demo mode not enabled' }, { status: 404 });
  }

  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  resetDemoAssociation();

  return Response.json({
    ok: true,
    slugs: [DEMO_PRIMARY_SLUG, DEMO_SECONDARY_SLUG],
    pin: DEMO_PIN,
  });
}
