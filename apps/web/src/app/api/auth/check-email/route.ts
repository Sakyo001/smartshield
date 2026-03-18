import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function getServiceRoleKey(): string | null {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  return typeof key === "string" && key.trim().length > 0 ? key.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const serviceRoleKey = getServiceRoleKey();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Preferred path: query Supabase Auth users with service role for accurate duplicate checks.
    if (supabaseUrl && serviceRoleKey) {
      const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const perPage = 200;
      const maxPages = 50;

      for (let page = 1; page <= maxPages; page += 1) {
        const { data, error } = await adminSupabase.auth.admin.listUsers({ page, perPage });

        if (error) {
          console.error("Error checking auth users:", error);
          return NextResponse.json(
            { error: "Unable to verify email" },
            { status: 500 }
          );
        }

        const users = data?.users ?? [];
        const exists = users.some((user) => (user.email ?? "").toLowerCase() === normalizedEmail);

        if (exists) {
          return NextResponse.json({ exists: true });
        }

        if (users.length < perPage) {
          break;
        }
      }

      return NextResponse.json({ exists: false });
    }

    // Fallback path: query public users table when service role is not configured.
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

    // Query the users table to check if email exists
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);

    if (error) {
      console.error("Error checking email:", error);
      return NextResponse.json(
        { error: "Unable to verify email" },
        { status: 500 }
      );
    }

    const exists = data && data.length > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Error in check-email endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
