"use client";
import dynamic from "next/dynamic";
import * as React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Share2, Mail } from "lucide-react";
import type { RSMGeo } from "../components/WorldMap";

const WorldMap = dynamic(() => import("../components/WorldMap"), { ssr: false });

// ---------- helpers: encode/decode ----------
const encodeState = (obj: unknown) => {
  try { return encodeURIComponent(btoa(JSON.stringify(obj))); } catch { return ""; }
};
const decodeState = (s: string | null) => {
  if (!s) return null;
  try { return JSON.parse(atob(decodeURIComponent(s))); } catch { return null; }
};

// Narrow the shape of the decoded query payload
type QueryPayload = {
  country?: string;
  code?: string;
  start?: string;
  end?: string;
  name?: string;
};
function isQueryPayload(x: unknown): x is QueryPayload {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  const isStrOrUndef = (v: unknown) => v === undefined || typeof v === "string";
  return isStrOrUndef(o.country) && isStrOrUndef(o.code) && isStrOrUndef(o.start) && isStrOrUndef(o.end) && isStrOrUndef(o.name);
}

// ---------- UI bits ----------
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1 className="font-extrabold text-4xl leading-tight bg-clip-text text-transparent bg-[linear-gradient(135deg,#667eea,#764ba2)]">
    {children}
  </h1>
);
const Sub = ({ children }: { children: React.ReactNode }) => (
  <p className="text-slate-600 text-lg mt-2">{children}</p>
);

function Button({
  children, onClick, variant = "primary", disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold shadow transition-all ${
        variant === "primary"
          ? "text-white bg-[linear-gradient(135deg,#667eea,#764ba2)] hover:translate-y-[-1px] hover:shadow-lg"
          : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
const Dot = ({ active }: { active: boolean }) => (
  <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-indigo-500 scale-110" : "bg-indigo-300/50"}`} />
);

// ---------- Boarding pass ----------
function BoardingPass({
  name, destination, startDate, endDate,
}: {
  name: string; destination: string; startDate: string; endDate: string;
}) {
  const randomPNR = (len = 6) => {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let o = "";
    for (let i = 0; i < len; i++) o += c[Math.floor(Math.random() * c.length)];
    return o;
  };
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
      <div className="flex flex-col md:flex-row">
        <div className="md:flex-1 bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-6">
          <div className="text-sm opacity-90">BOARDING PASS</div>
          <div className="mt-2 text-slate-100/90">Passenger</div>
          <div className="text-2xl font-extrabold">{name}</div>
          <div className="mt-3 text-slate-100/90">Destination</div>
          <div className="text-lg font-bold">{destination || "—"}</div>
          <div className="mt-4 flex gap-8 text-sm">
            <div><div className="opacity-80">Start</div><div className="font-semibold">{startDate || "—"}</div></div>
            <div><div className="opacity-80">End</div><div className="font-semibold">{endDate || "—"}</div></div>
          </div>
        </div>
        <div className="md:w-80 bg-white p-6 border-t md:border-t-0 md:border-l border-dashed">
          <div className="text-indigo-900 font-extrabold">ADMIT ONE</div>
          <div className="mt-3 text-slate-500 text-sm">Record Locator</div>
          <div className="text-2xl font-extrabold tracking-wide">{randomPNR()}</div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-slate-500">Seat</div><div className="font-semibold">—</div></div>
            <div><div className="text-slate-500">Gate</div><div className="font-semibold">—</div></div>
            <div><div className="text-slate-500">Board</div><div className="font-semibold">—</div></div>
          </div>
          <div className="mt-4 text-xs text-slate-500">Keepsake boarding pass for your surprise trip ❤️</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [hoverName, setHoverName] = useState<string>("");
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState("");
  const [code, setCode] = useState("");
  const [start, setStart] = useState("");
  const [end,   setEnd]   = useState("");
  const [copied, setCopied] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const name = "Sonal";

  useEffect(() => {
    const url = new URL(window.location.href);
    const raw = decodeState(url.searchParams.get("data"));
    if (isQueryPayload(raw) && raw.country && raw.start && raw.end) {
      setCountry(raw.country);
      setCode(raw.code || "");
      setStart(raw.start);
      setEnd(raw.end);
      setStep(5);
    }
  }, []);

  useEffect(() => {
    if (country && start && end) {
      const enc = encodeState({ country, code, start, end, name });
      setShareURL(`${window.location.origin}${window.location.pathname}?data=${enc}`);
    }
  }, [country, code, start, end, name]);

  const onCountryClick = (geo: RSMGeo) => {
    setCountry(geo.properties.name ?? "");
    setCode(geo.id ?? "");
    setStep(4);
  };

  const notifyServer = async () => {
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, country, start, end, shareURL }),
      });
    } catch { /* ignore */ }
  };

  const onFinalize = async () => { await notifyServer(); setStep(5); };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const header = (
    <div className="flex items-center justify-between w-full max-w-5xl mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/30 grid place-items-center text-white font-bold shadow">🎂</div>
        <div className="text-white font-semibold text-lg drop-shadow">Mom’s Birthday</div>
      </div>
      <div className="flex items-center gap-2">{[1, 2, 3, 4, 5].map(i => <Dot key={i} active={i <= step} />)}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_50%,#f093fb_100%)] pb-16">
      {header}
      <div className="w-full max-w-5xl mx-auto px-5">
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_30px_80px_rgba(0,0,0,0.18)] p-8 md:p-10 mt-2">
          <div className="absolute left-0 right-0 top-0 h-1.5 bg-[linear-gradient(90deg,#667eea,#764ba2,#f093fb)] animate-[shimmer_6s_linear_infinite] rounded-t-3xl" />
          <style>{`@keyframes shimmer{0%{background-position:0 0}100%{background-position:200% 0}}`}</style>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .35 }}>
                <Title>Happy Birthday Mom!!</Title>
                <Sub>Let’s make this one unforgettable.</Sub>
                <div className="mt-8"><Button onClick={() => setStep(2)}>Next →</Button></div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .35 }}>
                <Title>I cannot wait to celebrate with you</Title>
                <Sub>Here is your gift 🎁</Sub>
                <div className="mt-8"><Button onClick={() => setStep(3)}>Next →</Button></div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .35 }}>
                <Title>You have a ticket to anywhere in the world ✈️</Title>
                <Sub>Click a country on the map to choose your destination.</Sub>
                <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 shadow">
                  <WorldMap
                    onCountryClick={onCountryClick}
                    onHover={(name, x, y) => { if (name) setHoverName(name); setTooltipPos({ x, y }); }}
                    onLeave={() => setHoverName("")}
                  />
                </div>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .35 }}>
                <Title>Choose your dates</Title>
                <Sub>Destination selected: <span className="font-semibold text-indigo-600">{country}</span></Sub>
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Start date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={start}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">End date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={end}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Button variant="ghost" onClick={() => setStep(3)}>← Back</Button>
                  <Button onClick={onFinalize} disabled={!start || !end || !country}>Next →</Button>
                </div>
              </motion.div>
            )}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .35 }}>
                <Title>Your Boarding Pass</Title>
                <Sub>Have the best birthday trip, Mom!</Sub>
                <div className="mt-6"><BoardingPass name="Sonal" destination={country} startDate={start} endDate={end} /></div>
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <div className="text-sm text-slate-700">Share link with Mom</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input readOnly value={shareURL} className="flex-1 text-xs md:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white" />
                      <Button variant="ghost" onClick={() => window.open(shareURL, "_blank")}><Share2 size={18} /> Open</Button>
                      <Button variant="ghost" onClick={copyLink}>{copied ? (<><Check size={18} /> Copied</>) : (<><Copy size={18} /> Copy</>)}</Button>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-sm text-slate-700">Send results to me</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button onClick={() =>
                        window.open(
                          `mailto:?subject=${encodeURIComponent("Birthday Trip Chosen: " + country)}&body=${encodeURIComponent(
                            `Passenger: Sonal\nDestination: ${country}\nDates: ${start} → ${end}\nShare Link: ${shareURL}`
                          )}`
                        )
                      }>
                        <Mail size={18} /> Mailto
                      </Button>
                      <span className="text-xs text-slate-500">Automatic email was already sent via API.</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6"><Button variant="ghost" onClick={() => setStep(1)}>Start Over</Button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {hoverName && (
        <div
          className="pointer-events-none fixed z-50 bg-white/95 text-slate-800 border border-slate-200 shadow px-2 py-1 rounded text-sm"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
        >
          {hoverName}
        </div>
      )}
    </div>
  );
}
