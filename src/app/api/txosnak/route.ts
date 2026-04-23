import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { txosnaRepo } from '@/lib/store';

/**
 * POST /api/txosnak
 * Create a new txosna for the authenticated ADMIN's association.
 */
export async function POST(req: NextRequest) {
  let associationId: string;

  if (process.env.PROTO_MODE === 'true') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    associationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    if (user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });
    associationId = user.associationId;
  }

  try {
    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'slug must contain only lowercase letters, digits, and hyphens' },
        { status: 400 }
      );
    }

    const existing = await txosnaRepo.findBySlug(slug);
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }

    const txosna = await txosnaRepo.create({ associationId, name, slug });
    return NextResponse.json(txosna, { status: 201 });
  } catch (error) {
    console.error('Error creating txosna:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
