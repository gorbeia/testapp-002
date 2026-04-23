import { NextRequest, NextResponse } from 'next/server';
import { associationRepo, volunteerRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

/**
 * POST /api/associations
 * Register a new association with its first ADMIN volunteer.
 * Public — no auth required.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminName, adminEmail, adminPassword, associationName } = body;

    if (!adminName || !adminEmail || !adminPassword || !associationName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await volunteerRepo.findByEmail(adminEmail);
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const association = await associationRepo.create(associationName);
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const volunteer = await volunteerRepo.create({
      associationId: association.id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    });

    return NextResponse.json(
      { associationId: association.id, volunteerId: volunteer.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating association:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
