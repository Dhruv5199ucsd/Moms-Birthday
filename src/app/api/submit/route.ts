// src/app/api/submit/route.ts
import { NextRequest, NextResponse } from "next/server";

type SubmitBody = {
  name?: string;
  country?: string;
  start?: string;
  end?: string;
  shareURL?: string;
};

function isSubmitBody(x: unknown): x is SubmitBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  const s = (v: unknown) => v === undefined || typeof v === "string";
  return s(o.name) && s(o.country) && s(o.start) && s(o.end) && s(o.shareURL);
}

export async function POST(req: NextRequest) {
  try {
    const raw: unknown = await req.json();
    if (!isSubmitBody(raw)) {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const { name = "Unknown", country = "Unknown", start = "?", end = "?", shareURL = "" } = raw;

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.TO_EMAIL;

    if (!apiKey || !toEmail) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_API_KEY or TO_EMAIL env var" },
        { status: 500 }
      );
    }

    // Lazy import + construct only inside handler (prevents build-time crash)
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const subject = `Birthday Trip Selected: ${country}`;
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto">
        <h2>New Trip Selection</h2>
        <p><b>Passenger:</b> ${name}</p>
        <p><b>Destination:</b> ${country}</p>
        <p><b>Dates:</b> ${start} → ${end}</p>
        <p><b>Share Link:</b> <a href="${shareURL}">${shareURL}</a></p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "Trip Bot <onboarding@resend.dev>",
      to: [toEmail],
      subject,
      html,
    });

    if (error) return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
