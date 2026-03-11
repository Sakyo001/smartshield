import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazily initialised so a missing env var doesn't crash the module at build/boot
// time — it only fails at request time when we can return a proper error.
let ratelimit: Ratelimit | null = null;
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: false,
      prefix: "smartshield:scan",
    });
    return ratelimit;
  } catch {
    return null;
  }
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
            error: `Rate limit exceeded. You can perform up to ${limit} scans per minute. Please wait ${retryAfter} second${retryAfter !== 1 ? "s" : ""} before trying again.`,
            retryAfter,
          },
          {
            status: 429,
            headers: { ...rlHeaders, "X-RateLimit-Remaining": "0", "Retry-After": String(retryAfter) },
          }
        );
      }
    }
  } catch {
    // Redis unavailable or rate-limit call failed — skip limiting and let the scan proceed
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

  try {
    const upstream = await fetch(`${backendUrl}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50000),
    });

    const data = await upstream.json();
    return NextResponse.json(data, {
      status: upstream.status,
      headers: rlHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upstream request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
