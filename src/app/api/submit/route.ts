// src/app/api/submit/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.TO_EMAIL || "";

export async function POST(req: Request) {
  try {
    const { name, country, start, end, shareURL } = await req.json();

    if (!TO_EMAIL) {
      return NextResponse.json(
        { ok: false, error: "Missing TO_EMAIL env var" },
        { status: 500 }
      );
    }

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
      from: "Trip Bot <onboarding@resend.dev>", // ok for testing
      to: [TO_EMAIL],
      subject,
      html,
    });

    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
  }
}
