import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type ExtensionActivityRow = {
  id: string;
  url: string | null;
  created_at: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeCsvValue(value: string): string {
  // RFC4180-ish: wrap in quotes if it contains quote, comma, or newline.
  const mustQuote = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

function toCsv(rows: Array<Record<string, string>>): string {
  if (rows.length === 0) {
    return "id,created_at,url\n";
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const line = headers
      .map((h) => escapeCsvValue(row[h] ?? ""))
      .join(",");
    lines.push(line);
  }

  return `${lines.join("\n")}\n`;
}

export async function GET(request: NextRequest) {
  const response = new NextResponse();

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

  if (userError || !user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (adminError || !adminUser?.email) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const pageSize = 1000;
  let offset = 0;
  const allRows: ExtensionActivityRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("extension_activity")
      .select("id, url, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Error fetching extension_activity for CSV export:", error);
      return NextResponse.json({ error: "export_failed" }, { status: 500 });
    }

    const chunk = (data ?? []) as ExtensionActivityRow[];
    allRows.push(...chunk);

    if (chunk.length < pageSize) break;
    offset += pageSize;
  }

  const csvRows = allRows
    .filter((r) => isNonEmptyString(r.url))
    .map((r) => ({
      id: r.id,
      created_at: r.created_at,
      url: r.url!.trim(),
    }));

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const filename = `urls-${yyyy}-${mm}-${dd}.csv`;

  // Add UTF-8 BOM for Excel compatibility.
  const csv = `\ufeff${toCsv(csvRows)}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=\"${filename}\"`,
      "cache-control": "no-store",
    },
  });
}
