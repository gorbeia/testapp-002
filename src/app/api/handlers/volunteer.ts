/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { volunteerRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ volunteerId: string }> }
) {
  let role: string;
  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    role = (global as any).__TEST_ROLE__ ?? 'ADMIN';
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    ({ role, associationId: sessionAssociationId } = session.user as any);
  }

  if (role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { volunteerId } = await params;

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

    if (password !== undefined) {
      patch.passwordHash = await bcrypt.hash(password, 10);
    }

    patch.updatedAt = new Date();

    const updated = await volunteerRepo.update(volunteerId, patch);

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ volunteerId: string }> }
) {
  let role: string;
  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    role = (global as any).__TEST_ROLE__ ?? 'ADMIN';
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    ({ role, associationId: sessionAssociationId } = session.user as any);
  }

  if (role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { volunteerId } = await params;

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
