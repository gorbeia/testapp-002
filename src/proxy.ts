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

  // Public paths — no auth needed
  const isPublic =
    pathname.includes('/t/') ||
    pathname.includes('/order/') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
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
  // Exclude _next, _vercel, static files, and /prototype from middleware
  matcher: ['/((?!_next|_vercel|prototype|.*\\..*).*)'],
};
