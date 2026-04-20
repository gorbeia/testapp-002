import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { volunteerRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

/**
 * GET /api/associations/[associationId]/volunteers
 * List all volunteers for an association. Requires ADMIN role.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { role, associationId: sessionAssociationId } = session.user as any;
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

/**
 * POST /api/associations/[associationId]/volunteers
 * Create a new volunteer. Requires ADMIN role.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { role, associationId: sessionAssociationId } = session.user as any;
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

    // Check if email already exists
    const existing = await volunteerRepo.findByEmail(email);
    if (existing) {
      return new Response('Email already in use', { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create volunteer
    const volunteer = await volunteerRepo.create({
      associationId,
      name,
      email,
      passwordHash,
      role: volunteerRole,
    });

    // Return without passwordHash
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
