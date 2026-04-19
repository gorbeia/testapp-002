import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

const locales = ['eu', 'es', 'fr', 'en'] as const;
const defaultLocale = 'eu';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const volunteerPaths = ['/counter', '/drinks', '/kitchen', '/overview', '/pin'];
const adminPaths = ['/menu', '/txosna', '/volunteers', '/reports', '/onboarding', '/dashboard'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth pages — bypass entirely (no locale prefix, no auth check)
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname === '/reset-password';

  if (isAuthPage) {
    return NextResponse.next();
  }

  // Public paths — no auth needed, but locale prefix is added
  const isPublic =
    pathname.includes('/t/') ||
    pathname.includes('/order/') ||
    pathname.startsWith('/api/payments/webhook');

  if (isPublic) return intlMiddleware(request);

  // Protected paths — check session
  const isVolunteerPath = volunteerPaths.some((p) => pathname.includes(p));
  const isAdminPath = adminPaths.some((p) => pathname.includes(p));

  if (isVolunteerPath || isAdminPath) {
    // Skip auth in prototype mode
    if (process.env.PROTO_MODE !== 'true') {
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (isAdminPath && (session.user as any)?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/counter', request.url));
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude:
  // - _next, _vercel, static files
  // - /prototype (proto navigator)
  // - Auth pages (login, register, reset-password) — these are root-level, not locale-prefixed
  matcher: ['/((?!_next|_vercel|prototype|login|register|reset-password|.*\\..*).*)'],
};
