import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let cachedGuestUserId: string | null = null;
let guestUserLookupPromise: Promise<string | null> | null = null;

function getServiceRoleKey(): string | null {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : null;
}

async function getOrCreateGuestUserId(adminSupabase: any): Promise<string | null> {
  if (cachedGuestUserId) return cachedGuestUserId;
  if (guestUserLookupPromise) return guestUserLookupPromise;

  guestUserLookupPromise = (async () => {
    const configuredGuestUserId = process.env.SMARTSHIELD_GUEST_USER_ID;
    if (typeof configuredGuestUserId === "string" && configuredGuestUserId.trim().length > 0) {
      cachedGuestUserId = configuredGuestUserId.trim();
      return cachedGuestUserId;
    }

    const guestEmail = process.env.SMARTSHIELD_GUEST_EMAIL ?? "guest-scanner@smartshield.app";

    // Try to find an existing guest account first.
    const listResult = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (!listResult.error) {
      const existing = listResult.data.users.find((u: any) => u.email?.toLowerCase() === guestEmail.toLowerCase());
      if (existing?.id) {
        cachedGuestUserId = existing.id;
        return cachedGuestUserId;
      }
    }

    const password =
      process.env.SMARTSHIELD_GUEST_PASSWORD ?? `Guest#${Math.random().toString(36).slice(2)}Aa1!`;

    const created = await adminSupabase.auth.admin.createUser({
      email: guestEmail,
      password,
      email_confirm: true,
      user_metadata: {
        guest_account: true,
        system_generated: true,
      },
    });

    if (created.error) {
      // Account may have been created concurrently; retry lookup once.
      const retry = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (!retry.error) {
        const existing = retry.data.users.find((u: any) => u.email?.toLowerCase() === guestEmail.toLowerCase());
        if (existing?.id) {
          cachedGuestUserId = existing.id;
          return cachedGuestUserId;
        }
      }
      console.warn("[SmartShield] Failed to resolve guest auth user:", created.error);
      return null;
    }

    cachedGuestUserId = created.data.user?.id ?? null;
    return cachedGuestUserId;
  })();

  try {
    return await guestUserLookupPromise;
  } finally {
    guestUserLookupPromise = null;
  }
}

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

function getDateKeyLocal(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getNextLocalMidnightEpochMs(now = new Date()): number {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime();
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
      limiter: Ratelimit.fixedWindow(3, "1 d"),
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
  const dateKey = getDateKeyLocal();
  const quotaBucketKey = `${rateLimitKey}:day:${dateKey}`;

  // Rate-limit headers to attach to every successful response
  let rlHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {
          // No-op: auth lookup only.
        },
        remove() {
          // No-op: auth lookup only.
        },
      },
    }
  );

  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const isGuestRequest = !userId;

  const rl = getRatelimit();
  // X-RateLimit-Active lets you confirm in DevTools whether limiting is running
  rlHeaders["X-RateLimit-Active"] = rl ? "true" : "false";
  rlHeaders["X-Guest-Quota-Active"] = isGuestRequest ? "true" : "false";

  try {
    if (rl && isGuestRequest) {
      const { success, limit, remaining } = await rl.limit(quotaBucketKey);
      const resetAt = getNextLocalMidnightEpochMs();
      rlHeaders = {
        ...rlHeaders,
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetAt),
      };
      if (!success) {
        const retryAfter = Math.max(
          0,
          Math.ceil((resetAt - Date.now()) / 1000)
        );
        return NextResponse.json(
          {
            error:
              "Daily guest quota reached. You can run up to 3 scans per day in guest mode. Please sign in to continue scanning.",
            retryAfter,
            quotaType: "guest_daily_quota",
            signInRequired: true,
            dailyLimit: 3,
            resetAt,
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
  const defaultBackendUrl = "https://web-production-1eec0.up.railway.app:8080";
  const fallbackBackendUrl = "https://smartshield-whois-api.onrender.com";
  const primaryBackendUrl = process.env.NEXT_PUBLIC_WHOIS_API_URL ?? defaultBackendUrl;
  if (!primaryBackendUrl) {
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
    const callUpstream = async (baseUrl: string) =>
      fetch(`${baseUrl}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward device ID so the Flask backend can apply per-device rate limiting
          ...(deviceId ? { "X-Device-ID": deviceId } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(50000),
      });

    const shouldFallback = (res: Response | null) => !res || res.status >= 500;

    let upstream: Response | null = null;
    try {
      upstream = await callUpstream(primaryBackendUrl);
    } catch {
      upstream = null;
    }

    if (shouldFallback(upstream) && fallbackBackendUrl !== primaryBackendUrl) {
      try {
        upstream = await callUpstream(fallbackBackendUrl);
      } catch {
        // keep upstream as-is; error handled below
      }
    }

    if (!upstream) {
      return NextResponse.json(
        { error: "Upstream scan service unavailable" },
        { status: 502, headers: rlHeaders },
      );
    }

    const data: unknown = await upstream.json();

    const response = NextResponse.json(data, {
      status: upstream.status,
      headers: rlHeaders,
    });

    let activityLogged = false;
    let activityLogReason = "skipped";

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

        const serviceRoleKey = getServiceRoleKey();

        const baseActivityPayload = {
          user_id: user?.id ?? null,
          url: scannedUrl,
          domain,
          confidence,
          decision: normalizedDecision,
          // The dashboard expects `prediction.risk_adjustment.indicators`, so
          // store the full upstream payload when a nested `prediction` isn't present.
          prediction: isRecord(data) && data["prediction"] !== undefined ? data["prediction"] : data,
        };

        // Prefer service-role writes when available so guest scans are not blocked
        // by client/session RLS constraints. Fall back to the session client.
        if (serviceRoleKey) {
          const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
              auth: { persistSession: false, autoRefreshToken: false },
            }
          );

          const { error: adminInsertError } = await adminSupabase
            .from("extension_activity")
            .insert(baseActivityPayload);

          if (!adminInsertError) {
            activityLogged = true;
            activityLogReason = "ok";
          } else if (adminInsertError.code === "23502" && !user?.id) {
            const resolvedUserId = await getOrCreateGuestUserId(adminSupabase);
            if (!resolvedUserId) {
              activityLogReason = "guest_user_resolution_failed";
              console.warn("[SmartShield] Skipping activity log: could not resolve a user_id for guest scan.");
            } else {
              const payloadWithGuestUser = {
                ...baseActivityPayload,
                user_id: resolvedUserId,
              };

              const { error: retryInsertError } = await adminSupabase
                .from("extension_activity")
                .insert(payloadWithGuestUser);

              if (!retryInsertError) {
                activityLogged = true;
                activityLogReason = "ok_guest_fallback";
              } else {
                activityLogReason = `admin_retry_failed:${retryInsertError.code ?? "unknown"}`;
                console.warn("[SmartShield] Guest fallback insert failed:", retryInsertError);
              }
            }
          } else {
            activityLogReason = `admin_insert_failed:${adminInsertError.code ?? "unknown"}`;
            console.warn("[SmartShield] Service-role activity logging failed:", adminInsertError);
          }
        } else {
          if (!user?.id) {
            console.warn(
              "[SmartShield] Cannot log guest scan: service-role key env is missing and extension_activity.user_id is required."
            );
            activityLogReason = "missing_service_role_key";
            response.headers.set("x-activity-logged", "false");
            response.headers.set("x-activity-log-reason", activityLogReason);
            return response;
          }

          const { error: sessionInsertError } = await supabase
            .from("extension_activity")
            .insert(baseActivityPayload);

          if (sessionInsertError) {
            activityLogReason = `session_insert_failed:${sessionInsertError.code ?? "unknown"}`;
            console.warn(
              "[SmartShield] Failed to log scan activity with session client and no SUPABASE_SERVICE_ROLE_KEY is configured:",
              sessionInsertError
            );
          } else {
            activityLogged = true;
            activityLogReason = "ok";
          }
        }
      } catch (err) {
        activityLogReason = "logging_exception";
        console.warn("[SmartShield] Failed to log scan activity:", err);
      }
    }

    response.headers.set("x-activity-logged", activityLogged ? "true" : "false");
    response.headers.set("x-activity-log-reason", activityLogReason);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upstream request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
