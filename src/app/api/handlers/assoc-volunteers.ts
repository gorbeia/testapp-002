/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { volunteerRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
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

  const { associationId } = await params;
  if (associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  const volunteers = await volunteerRepo.listByAssociation(associationId);
  const result = volunteers.map((v) => ({
    id: v.id,
    name: v.name,
    email: v.email,
    role: v.role,
    active: v.active,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));

  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
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

  const { associationId } = await params;
  if (associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role: volunteerRole } = body;

    if (!name || !email || !password || !volunteerRole) {
      return new Response('Bad Request', { status: 400 });
    }

    const existing = await volunteerRepo.findByEmail(email);
    if (existing) {
      return new Response('Email already in use', { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const volunteer = await volunteerRepo.create({
      associationId,
      name,
      email,
      passwordHash,
      role: volunteerRole,
    });

    const result = {
      id: volunteer.id,
      name: volunteer.name,
      email: volunteer.email,
      role: volunteer.role,
      active: volunteer.active,
      createdAt: volunteer.createdAt,
      updatedAt: volunteer.updatedAt,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating volunteer:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
