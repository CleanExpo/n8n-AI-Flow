import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';

export default withAuth(
  function middleware(_req) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Protect all routes under /dashboard and /workflows
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/workflows')) {
          return !!token;
        }
        return true;
      }
    }
  }
);

export const config = {
  matcher: [
    // Apply security headers to all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Only protect authenticated routes, allow public access to homepage and auth
    '/dashboard/:path*',
    '/workflows/:path*',
    // API routes that require authentication - but NOT /api/auth/*
    '/api/workflows/:path*',
    '/api/executions/:path*',
    '/api/nodes/:path*'
  ]
};