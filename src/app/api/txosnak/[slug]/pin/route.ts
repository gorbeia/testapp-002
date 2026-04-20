import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { txosnaRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

interface SessionUser {
  id: string;
  role: string;
  associationId: string;
  email: string;
}

/**
 * PATCH /api/txosnak/[slug]/pin
 * Update the PIN for a txosna. Requires ADMIN role.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { role, associationId: sessionAssociationId } = session.user as SessionUser;
  if (role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { slug }: { slug: string } = await params;
  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) {
    return new Response('Not Found', { status: 404 });
  }

  if (txosna.associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const { pin } = body;
  if (!pin || typeof pin !== 'string' || pin.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'PIN is required' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const pinHash = await bcrypt.hash(pin, 10);
    await txosnaRepo.update(txosna.id, { pinHash });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error updating PIN:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
