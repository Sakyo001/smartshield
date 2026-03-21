import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Calculate risk score from prediction data using the same logic as the backend scan endpoint.
 * This ensures consistent risk scores when retrieving from history.
 */
function calculateRiskScoreFromPrediction(
  predictionData: any,
  url: string,
): number {
  if (!predictionData) {
    return 0;
  }

  const decision = predictionData.decision?.toUpperCase() ?? "";
  const confidence = predictionData.confidence ?? 0;
  const score = predictionData.score ?? 0;

  let riskScore = 0;

  // Replicate backend calculation exactly
  if (decision === "PHISHING") {
    riskScore = Math.round(confidence || 100);
  } else if (decision === "LEGITIMATE") {
    riskScore = Math.round(100 - (confidence || 0));
  } else {
    riskScore = Math.round(score * 100 || 0);
  }

  // HTTP heuristic (matches backend and frontend)
  if (url && url.toLowerCase().startsWith("http://") && riskScore < 40) {
    riskScore = 40;
  }

  // Apply risk adjustment from prediction if available
  if (predictionData.risk_adjustment) {
    const deterministicIncrease =
      predictionData.risk_adjustment.deterministic_increase || 0;
    const contextualReduction =
      predictionData.risk_adjustment.reduction_percentage || 0;
    const indicators = predictionData.risk_adjustment.indicators || [];

    const criticalIndicators = indicators.filter(
      (i: string) =>
        typeof i === "string" && (i.includes("CRITICAL") || i.includes("🚨")),
    );

    if (criticalIndicators.length > 0) {
      riskScore = 100;
    } else {
      riskScore = riskScore + deterministicIncrease - contextualReduction;
      riskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

      const hasWhoisWarning = indicators.some(
        (i: string) =>
          typeof i === "string" &&
          i.includes("WHOIS Information Unavailable") &&
          !i.includes("CRITICAL"),
      );
      if (hasWhoisWarning && riskScore < 45) {
        riskScore = 45;
      }
    }
  }

  return riskScore;
}

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
    const history = (data || []).map((record: any) => {
      // Use the stored prediction data to calculate the actual risk score
      // This matches the calculation logic in the backend scan endpoint
      const predictionData = record.prediction || {};
      const calculatedRiskScore = calculateRiskScoreFromPrediction(
        predictionData,
        record.url,
      );

      // Determine status based on calculated risk score
      let status: "Safe" | "Warning" | "Dangerous" = "Safe";
      if (calculatedRiskScore >= 70) {
        status = "Dangerous";
      } else if (calculatedRiskScore >= 40) {
        status = "Warning";
      }

      return {
        url: record.url,
        expandedUrl: record.domain || undefined,
        riskScore: calculatedRiskScore,
        status,
        date: new Date(record.created_at).toLocaleString(),
        details: {
          registrar: "N/A",
          creationDate: "N/A",
          lastAnalysisDate: new Date(record.created_at).toLocaleDateString(),
          detections: predictionData.detections || [],
          whoisInfo: predictionData.whois_info || null,
          dnsRecords: predictionData.dns_records || null,
          sslCertificates: predictionData.ssl_certificates || null,
          communityComments: 0,
          riskAdjustment: predictionData.risk_adjustment || null,
          screenshot: predictionData.screenshot || null,
        },
      };
    });

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
