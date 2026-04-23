import { NextRequest, NextResponse } from 'next/server';
import { volunteerRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

/**
 * POST /api/volunteers/reset-password
 *
 * Request reset: body { email }
 *   → stores a token; returns token in non-production (no email infra yet).
 *
 * Confirm reset: body { token, newPassword }
 *   → validates token, updates passwordHash.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.token && body.newPassword) {
    return handleConfirm(body.token, body.newPassword);
  }

  if (body.email) {
    return handleRequest(body.email);
  }

  return NextResponse.json(
    { error: 'Provide email (request) or token + newPassword (confirm)' },
    { status: 400 }
  );
}

async function handleRequest(email: string) {
  const volunteer = await volunteerRepo.findByEmail(email);
  if (!volunteer || !volunteer.active) {
    return NextResponse.json({ ok: true }); // don't reveal whether email exists
  }

  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await volunteerRepo.update(volunteer.id, {
    passwordResetToken: token,
    passwordResetExpiresAt: expiresAt,
  });

  // TODO: send email in production. Return token in dev for convenience.
  const isDev = process.env.NODE_ENV !== 'production';
  return NextResponse.json({ ok: true, ...(isDev && { token }) });
}

async function handleConfirm(token: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const volunteer = await volunteerRepo.findByResetToken(token);

  if (!volunteer || volunteer.passwordResetToken !== token) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  if (volunteer.passwordResetExpiresAt && volunteer.passwordResetExpiresAt < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await volunteerRepo.update(volunteer.id, {
    passwordHash,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
  });

  return NextResponse.json({ ok: true });
}
