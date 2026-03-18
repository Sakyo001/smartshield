import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({});

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

    // Build callback redirect URL from env override or current forwarded host/proto.
    const requestUrl = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const envOrigin =
      envSiteUrl && /^https?:\/\//i.test(envSiteUrl)
        ? envSiteUrl.replace(/\/+$/, "")
        : null;

    const protocol = forwardedProto ?? requestUrl.protocol.replace(":", "");
    const host = forwardedHost ?? requestUrl.host;
    const requestOrigin = `${protocol}://${host}`;
    const origin = envOrigin ?? requestOrigin;

    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`;

    // Resend the confirmation email
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("Error resending confirmation email:", error);
      return NextResponse.json(
        { error: error.message || "Failed to resend confirmation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Error in resend-email endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
