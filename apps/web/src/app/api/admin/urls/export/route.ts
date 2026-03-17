import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type ExtensionActivityRow = {
  id: string;
  url: string | null;
  created_at: string;
  decision: string | null;
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
    return "url_length,num_subdomains,has_ip_in_url,has_at_symbol,has_dash,is_https,is_phishing\n";
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

function normalizeDecision(decision: unknown): "dangerous" | "warning" | "safe" {
  if (decision === "dangerous" || decision === "warning" || decision === "safe") return decision;
  if (decision === "PHISHING") return "dangerous";
  if (decision === "LEGITIMATE") return "safe";
  return "warning";
}

function isIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (!match) return false;
  return hostname.split(".").every((part) => {
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

function isIpv6(hostname: string): boolean {
  // URL.hostname for IPv6 includes ':' and hex groups.
  return hostname.includes(":") && /^[0-9a-f:]+$/i.test(hostname);
}

function getSubdomainCount(hostname: string): number {
  if (!hostname || hostname === "localhost") return 0;
  if (isIpv4(hostname) || isIpv6(hostname)) return 0;

  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) return 0;
  return parts.length - 2;
}

function toFeatureRow(rawUrl: string, decision: unknown): Record<string, string> {
  const trimmedUrl = rawUrl.trim();
  let parsed: URL | null = null;

  try {
    parsed = new URL(trimmedUrl);
  } catch {
    parsed = null;
  }

  const hostname = parsed?.hostname ?? "";
  const hasIp = isIpv4(hostname) || isIpv6(hostname);
  const hasDash = hostname.includes("-");
  const isHttps = parsed?.protocol === "https:";
  const isPhishing = normalizeDecision(decision) === "dangerous";

  return {
    url_length: String(trimmedUrl.length),
    num_subdomains: String(getSubdomainCount(hostname)),
    has_ip_in_url: hasIp ? "1" : "0",
    has_at_symbol: trimmedUrl.includes("@") ? "1" : "0",
    has_dash: hasDash ? "1" : "0",
    is_https: isHttps ? "1" : "0",
    is_phishing: isPhishing ? "1" : "0",
  };
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
      .select("id, url, created_at, decision")
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

  // Keep only one row per URL (latest first because query is ordered desc by created_at).
  const seenUrls = new Set<string>();
  const uniqueRows = allRows.filter((r) => {
    if (!isNonEmptyString(r.url)) return false;
    const normalized = r.url.trim();
    if (seenUrls.has(normalized)) return false;
    seenUrls.add(normalized);
    return true;
  });

  const csvRows = uniqueRows.map((r) => toFeatureRow(r.url!.trim(), r.decision));

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
