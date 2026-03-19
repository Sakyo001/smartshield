import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_2FA_COOKIE_NAME = "admin_2fa_verified";

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const digestBytes = Array.from(new Uint8Array(digest));
  return digestBytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hasValidAdminTwoFactorSession(
  request: NextRequest,
  adminUser: {
    two_factor_verified_token_hash?: string | null;
    two_factor_verified_expires_at?: string | null;
  }
): Promise<boolean> {
  const cookieValue = request.cookies.get(ADMIN_2FA_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  if (!adminUser.two_factor_verified_token_hash || !adminUser.two_factor_verified_expires_at) {
    return false;
  }

  const expiresAt = new Date(adminUser.two_factor_verified_expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return false;
  }

  const cookieHash = await sha256Hex(cookieValue);
  return cookieHash === adminUser.two_factor_verified_token_hash;
}

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
        .select("email, two_factor_verified_token_hash, two_factor_verified_expires_at")
        .eq("email", user.email)
        .maybeSingle();

      if (adminUser && (await hasValidAdminTwoFactorSession(request, adminUser))) {
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
    .select("email, two_factor_verified_token_hash, two_factor_verified_expires_at")
    .eq("email", user.email)
    .maybeSingle();

  if (adminError || !adminUser) {
    return NextResponse.redirect(loginUrl);
  }

  const hasValid2faSession = await hasValidAdminTwoFactorSession(request, adminUser);
  if (!hasValid2faSession) {
    response.cookies.set({
      name: ADMIN_2FA_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
