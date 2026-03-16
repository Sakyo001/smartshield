import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(obj: unknown, key: string): string | null {
  if (!isRecord(obj)) return null;
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function getNumberField(obj: unknown, key: string): number | null {
  if (!isRecord(obj)) return null;
  const value = obj[key];
  return typeof value === "number" ? value : null;
}

// Lazily initialised so a missing env var doesn't crash the module at build/boot
// time — it only fails at request time when we can return a proper error.
let ratelimit: Ratelimit | null = null;
let rateLimitInitialised = false;
function getRatelimit(): Ratelimit | null {
  if (rateLimitInitialised) return ratelimit;
  rateLimitInitialised = true;
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "60 s"),
      analytics: false,
      prefix: "smartshield:scan",
    });
    return ratelimit;
  } catch (e) {
    console.warn(
      "[SmartShield] Rate limiting DISABLED — missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars.",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}

// Handle CORS pre-flight (needed if API is ever called cross-origin)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Device-ID",
    },
  });
}

export async function POST(req: NextRequest) {
  // Prefer the client-generated device ID (stored in localStorage) so every
  // browser/device gets its own independent bucket regardless of shared NAT IPs.
  // Fall back to IP if the header is missing (e.g. direct API calls).
  const deviceId = req.headers.get("x-device-id");
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  const rateLimitKey = deviceId ? `device:${deviceId}` : `ip:${ip}`;

  // Rate-limit headers to attach to every successful response
  let rlHeaders: Record<string, string> = {};

  const rl = getRatelimit();
  // X-RateLimit-Active lets you confirm in DevTools whether limiting is running
  rlHeaders["X-RateLimit-Active"] = rl ? "true" : "false";

  try {
    if (rl) {
      const { success, limit, remaining, reset } = await rl.limit(rateLimitKey);
      rlHeaders = {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      };
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: `Rate limit exceeded. You can perform up to 3 scans per minute. Please wait ${retryAfter} second${retryAfter !== 1 ? "s" : ""} before trying again.`,
            retryAfter,
          },
          {
            status: 429,
            headers: { ...rlHeaders, "X-RateLimit-Remaining": "0", "Retry-After": String(retryAfter) },
          }
        );
      }
    }
  } catch (err) {
    // Redis unavailable or rate-limit call failed — skip limiting and let the scan proceed
    console.error("[SmartShield] Rate limit check failed:", err instanceof Error ? err.message : err);
  }

  // Proxy to the Python backend
  const backendUrl = process.env.NEXT_PUBLIC_WHOIS_API_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scannedUrl = getStringField(body, "url") ?? "";
  const scannedDomain = (() => {
    if (!scannedUrl) return "";
    try {
      return new URL(scannedUrl).hostname;
    } catch {
      return "";
    }
  })();

  try {
    const upstream = await fetch(`${backendUrl}/api/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward device ID so the Flask backend can apply per-device rate limiting
        ...(deviceId ? { "X-Device-ID": deviceId } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50000),
    });

    const data: unknown = await upstream.json();

    const response = NextResponse.json(data, {
      status: upstream.status,
      headers: rlHeaders,
    });

    // Best-effort activity logging so admin "Recent Scan Activity" includes
    // web scans even when the user is anonymous.
    if (upstream.ok && scannedUrl) {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return req.cookies.get(name)?.value;
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
        } = await supabase.auth.getUser();

        const upstreamDecision = getStringField(data, "decision") ?? "";
        const confidence = getNumberField(data, "confidence");
        const domain =
          getStringField(data, "domain")
            ? (getStringField(data, "domain") as string)
            : scannedDomain;

        // Map upstream results to the dashboard's decision buckets.
        // Dashboard expects: safe | warning | dangerous
        let riskScore = 0;
        if (upstreamDecision === "PHISHING") {
          riskScore = Math.round((confidence ?? 100) as number);
        } else if (upstreamDecision === "LEGITIMATE") {
          riskScore = Math.round(100 - ((confidence ?? 0) as number));
        } else {
          const score = getNumberField(data, "score");
          if (typeof score === "number") riskScore = Math.round(score * 100);
        }

        // Basic URL heuristic (matches web UI)
        if (scannedUrl.toLowerCase().startsWith("http://") && riskScore < 40) {
          riskScore = 40;
        }

        // If the backend provides risk_adjustment indicators, respect CRITICAL.
        let indicators: unknown = null;
        if (isRecord(data) && isRecord(data["risk_adjustment"])) {
          indicators = (data["risk_adjustment"] as Record<string, unknown>)["indicators"];
        }
        if (Array.isArray(indicators)) {
          const critical = indicators.some(
            (i: unknown) => typeof i === "string" && (i.includes("CRITICAL") || i.includes("🚨"))
          );
          if (critical) riskScore = 100;
        }

        const normalizedDecision = riskScore >= 70 ? "dangerous" : riskScore >= 40 ? "warning" : "safe";

        const activityPayload = {
          user_id: user?.id ?? null,
          url: scannedUrl,
          domain,
          confidence,
          decision: normalizedDecision,
          // The dashboard expects `prediction.risk_adjustment.indicators`, so
          // store the full upstream payload when a nested `prediction` isn't present.
          prediction: isRecord(data) && data["prediction"] !== undefined ? data["prediction"] : data,
        };

        const { error: insertError } = await supabase.from("extension_activity").insert(activityPayload);

        if (insertError) {
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceRoleKey) {
            console.warn(
              "[SmartShield] Failed to log scan activity with anon/session client and no SUPABASE_SERVICE_ROLE_KEY is configured:",
              insertError
            );
          } else {
            const adminSupabase = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceRoleKey,
              {
                auth: { persistSession: false, autoRefreshToken: false },
              }
            );

            const { error: adminInsertError } = await adminSupabase
              .from("extension_activity")
              .insert(activityPayload);

            if (adminInsertError) {
              console.warn("[SmartShield] Failed to log scan activity with service role fallback:", adminInsertError);
            }
          }
        }
      } catch (err) {
        console.warn("[SmartShield] Failed to log scan activity:", err);
      }
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upstream request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
