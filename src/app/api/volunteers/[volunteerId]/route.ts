import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { volunteerRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

/**
 * PATCH /api/volunteers/[volunteerId]
 * Update a volunteer. Requires ADMIN role and same association.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ volunteerId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { role, associationId: sessionAssociationId } = session.user as any;
  if (role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { volunteerId } = await params;

  // Fetch existing volunteer to check association
  const existing = await volunteerRepo.findById(volunteerId);
  if (!existing) {
    return new Response('Not Found', { status: 404 });
  }

  if (existing.associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role: volunteerRole, active } = body;

    const patch: Record<string, any> = {};
    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = email;
    if (volunteerRole !== undefined) patch.role = volunteerRole;
    if (active !== undefined) patch.active = active;

    // Hash password if provided
    if (password !== undefined) {
      patch.passwordHash = await bcrypt.hash(password, 10);
    }

    patch.updatedAt = new Date();

    const updated = await volunteerRepo.update(volunteerId, patch);

    // Return without passwordHash
    const result = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating volunteer:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * DELETE /api/volunteers/[volunteerId]
 * Soft-delete a volunteer (sets active: false). Requires ADMIN role.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ volunteerId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { role, associationId: sessionAssociationId } = session.user as any;
  if (role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { volunteerId } = await params;

  // Fetch existing volunteer to check association
  const existing = await volunteerRepo.findById(volunteerId);
  if (!existing) {
    return new Response('Not Found', { status: 404 });
  }

  if (existing.associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    await volunteerRepo.update(volunteerId, { active: false });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
