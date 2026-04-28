import { NextRequest, NextResponse } from 'next/server';
import { txosnaRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txosnaSlug, pin } = body;

    if (!txosnaSlug || !pin) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const txosna = await txosnaRepo.findBySlug(txosnaSlug as string);
    if (!txosna) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    // Compare PIN: handle both plain strings and bcrypt hashes
    // Bcrypt hashes always start with $2a$, $2b$, or $2y$
    let valid: boolean;
    if (txosna.pinHash.startsWith('$2')) {
      // Bcrypt hash
      valid = await bcrypt.compare(pin as string, txosna.pinHash);
    } else {
      // Plain string (dev/test)
      valid = pin === txosna.pinHash;
    }

    if (!valid) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      txosnaId: txosna.id,
      counterSetup: txosna.counterSetup,
      kitchenPosts: txosna.kitchenPosts,
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
