import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // This middleware only runs on /admin/:path* (see config matcher below)
  const loginUrl = new URL("/admin/login", request.url);
  const dashboardUrl = new URL("/admin/dashboard", request.url);

  // Response is needed so Supabase can refresh auth cookies when required.
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Allow the login page itself, but if already authenticated as admin, redirect to dashboard.
  if (pathname === "/admin/login") {
    if (!userError && user?.email) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("email")
        .eq("email", user.email)
        .maybeSingle();

      if (adminUser) {
        return NextResponse.redirect(dashboardUrl);
      }
    }
    return response;
  }

  // All other /admin routes require a valid signed-in Supabase user.
  if (userError || !user?.email) {
    return NextResponse.redirect(loginUrl);
  }

  // And that user must exist in admin_users.
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (adminError || !adminUser) {
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
