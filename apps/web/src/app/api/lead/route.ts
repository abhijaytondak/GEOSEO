import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Marketing lead-capture sink — always available on Vercel (independent of the NestJS
 * product API, which isn't hosted on the demo deploy). Validates, logs (Vercel function
 * logs are the floor), and fires a webhook if `LEAD_WEBHOOK_URL` is set (Slack / Zapier /
 * Make / Discord — zero-friction durable capture). The product-side flow (scoring,
 * journey) still runs separately via `pageEngineApi.captureLead` when the API is hosted,
 * so there's no double-capture: this endpoint only notifies the team.
 */
interface LeadBody {
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  sourceUrl?: string;
  hp?: string; // honeypot — real users never fill this
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DISPOSABLE = new Set(["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "trashmail.com"]);

export async function POST(req: Request) {
  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: pretend success, drop the bot.
  if (body.hp && body.hp.trim()) return NextResponse.json({ ok: true });

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  if (DISPOSABLE.has(email.split("@")[1] ?? "")) {
    return NextResponse.json({ ok: false, error: "Use a work email." }, { status: 400 });
  }

  const lead = {
    email,
    company: (body.company ?? "").trim().slice(0, 200),
    website: (body.website ?? "").trim().slice(0, 300),
    message: (body.message ?? "").trim().slice(0, 1000),
    sourceUrl: (body.sourceUrl ?? "").trim().slice(0, 500),
    receivedAt: new Date().toISOString(),
  };

  // Floor: always visible in Vercel function logs.
  console.log("[marketing-lead]", JSON.stringify(lead));

  // Notify a webhook if configured (the durable capture path for the demo deploy).
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    const summary = `🟣 New GEOSEO lead: ${lead.email}${lead.company ? ` · ${lead.company}` : ""}${lead.website ? ` · ${lead.website}` : ""}`;
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: summary, lead }),
      });
    } catch {
      // Non-fatal: the log floor still captured it.
    }
  }

  return NextResponse.json({ ok: true });
}
