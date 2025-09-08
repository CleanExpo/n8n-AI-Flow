import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
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
    // Only protect authenticated routes, allow public access to homepage and auth
    '/dashboard/:path*',
    '/workflows/:path*',
    // API routes that require authentication - but NOT /api/auth/*
    '/api/workflows/:path*',
    '/api/executions/:path*',
    '/api/nodes/:path*'
  ]
};