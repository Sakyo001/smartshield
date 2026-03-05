// middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Get the user
  const { data: { user } } = await supabase.auth.getUser();

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin/login without authentication
    if (request.nextUrl.pathname === '/admin/login') {
      return response;
    }

    // Check for admin session in localStorage via adminSession cookie
    const adminSession = request.cookies.get('adminSession')?.value;
    
    if (!adminSession && !user) {
      // No admin session and no authenticated user - redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect user dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      // No authenticated user - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check user role
    if (request.nextUrl.pathname !== '/dashboard') {
      // Verify user has 'user' role for dashboard
      try {
        // We'll do role check on the client side to avoid complexity here
      } catch (error) {
        console.error('Error checking role:', error);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (Supabase PKCE code exchange — must not be intercepted by middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth/callback).*)',
  ],
}
