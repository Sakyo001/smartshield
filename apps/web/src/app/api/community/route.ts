import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CreateCommentBody = {
  url?: string;
  description?: string;
  flag?: string;
};

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

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

  if (userError || !user?.id) {
    return NextResponse.json({ error: "Please log in before commenting." }, { status: 401 });
  }

  let body: CreateCommentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const flag = typeof body.flag === "string" ? body.flag.trim().toLowerCase() : "neutral";

  if (!url) {
    return NextResponse.json({ error: "Missing scanned URL." }, { status: 400 });
  }

  if (description.length < 3) {
    return NextResponse.json({ error: "Comment must be at least 3 characters." }, { status: 400 });
  }

  if (description.length > 1000) {
    return NextResponse.json({ error: "Comment is too long." }, { status: 400 });
  }

  if (!["phishing", "legitimate", "neutral"].includes(flag)) {
    return NextResponse.json({ error: "Invalid flag. Use phishing, legitimate, or neutral." }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("reports").insert({
    user_id: user.id,
    url,
    description,
    flag,
  });

  if (insertError) {
    console.error("Failed to insert community comment", insertError);
    return NextResponse.json({ error: "Unable to submit comment right now." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
