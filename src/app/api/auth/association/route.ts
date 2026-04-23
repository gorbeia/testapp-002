import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ error: 'Parametroa falta da' }, { status: 400 });
  }

  // Proto mode or no database: accept any input and return a mock association
  const isProto = process.env.PROTO_MODE === 'true' || !process.env.DATABASE_URL;
  if (isProto) {
    return NextResponse.json({ id: 'proto-assoc', name: q });
  }

  // Production: look up association by name
  const { default: prisma } = await import('@/lib/prisma');
  if (!prisma) {
    return NextResponse.json({ error: 'Datu-basea ez dago erabilgarri' }, { status: 503 });
  }

  const association = await (prisma as any).association.findFirst({
    where: { name: { contains: q, mode: 'insensitive' } },
    select: { id: true, name: true },
  });

  if (!association) {
    return NextResponse.json({ error: 'Elkartea ez da aurkitu' }, { status: 404 });
  }

  return NextResponse.json(association);
}
