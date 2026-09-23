import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('hajj_auth_token')?.value;
  const { pathname, search } = request.nextUrl;

  const protectedRoutes = ['/bookings', '/profile', '/payments/checkout'];
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // If visiting protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  // If visiting login/register with token, redirect to packages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/packages', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/bookings/:path*',
    '/profile/:path*',
    '/payments/checkout/:path*',
    '/login',
    '/register',
  ],
};
