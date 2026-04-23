import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ error: 'Parametroa falta da' }, { status: 400 });
  }

  // No database: look up in the in-memory store
  if (!process.env.DATABASE_URL) {
    const { associationRepo } = await import('@/lib/store');
    const association = await associationRepo.findByName(q);
    if (!association) {
      return NextResponse.json({ error: 'Elkartea ez da aurkitu' }, { status: 404 });
    }
    return NextResponse.json({ id: association.id, name: association.name });
  }

  // Production: look up association by name in the database, fall back to memory store on error
  const { prisma } = await import('@/lib/prisma');
  if (prisma) {
    try {
      const association = await (prisma as any).association.findFirst({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true },
      });
      if (!association) {
        return NextResponse.json({ error: 'Elkartea ez da aurkitu' }, { status: 404 });
      }
      return NextResponse.json(association);
    } catch {
      // DB unreachable — fall through to memory store
    }
  }

  const { associationRepo } = await import('@/lib/store');
  const association = await associationRepo.findByName(q);
  if (!association) {
    return NextResponse.json({ error: 'Elkartea ez da aurkitu' }, { status: 404 });
  }
  return NextResponse.json({ id: association.id, name: association.name });
}
