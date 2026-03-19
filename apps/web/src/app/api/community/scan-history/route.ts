import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return NextResponse.json(
      { error: "Please log in to view your scan history." },
      { status: 401 },
    );
  }

  try {
    // Fetch scan history from extension_activity (last 50 scans, most recent first)
    const { data, error: fetchError } = await supabase
      .from("extension_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching scan history:", fetchError);
      return NextResponse.json({ history: [] });
    }

    // Transform extension_activity records to ScanResult format
    const history = (data || []).map((record: any) => ({
      url: record.url,
      expandedUrl: record.domain || undefined,
      riskScore:
        record.decision === "dangerous"
          ? 70
          : record.decision === "warning"
            ? 40
            : 0,
      status:
        record.decision === "dangerous"
          ? "Dangerous"
          : record.decision === "warning"
            ? "Warning"
            : "Safe",
      date: new Date(record.created_at).toLocaleString(),
      details: {
        registrar: "N/A",
        creationDate: "N/A",
        lastAnalysisDate: new Date(record.created_at).toLocaleDateString(),
        detections: record.prediction?.detections || [],
        whoisInfo: record.prediction?.whois_info || null,
        dnsRecords: record.prediction?.dns_records || null,
        sslCertificates: record.prediction?.ssl_certificates || null,
        communityComments: 0,
        riskAdjustment: record.prediction?.risk_adjustment || null,
        screenshot: record.prediction?.screenshot || null,
      },
    }));

    return NextResponse.json({ history });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in scan history GET:", errorMessage);
    return NextResponse.json(
      { history: [], error: errorMessage },
      { status: 500 },
    );
  }
}
