import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { useState } from "react";

const FAQS = [
  { q: "How do I buy coins?", a: "Go to Wallet > Buy Coins and pick a pack." },
  { q: "Are calls private?", a: "Yes, all calls are end-to-end encrypted." },
  { q: "How do creators earn?", a: "Creators get paid per minute on calls and per message on chat." },
  { q: "Why was a call less than 1 minute not charged?", a: "Calls under 1 minute don't deduct coins or pay creators." },
];

export const Route = createFileRoute("/app/help")({ component: Help });

function Help() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <PageHeader title="Help & Support" subtitle="We're here to help" />
      <div className="space-y-2 mb-6">
        {FAQS.map((f, i) => (
          <div key={i} className="glass rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full p-4 text-left font-medium text-sm flex justify-between">
              {f.q}<span>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <div className="px-4 pb-4 text-xs text-muted-foreground">{f.a}</div>}
          </div>
        ))}
      </div>
      <div className="glass-strong rounded-2xl p-5 text-center">
        <p className="text-sm font-medium mb-1">Still need help?</p>
        <p className="text-xs text-muted-foreground mb-4">Reach us at support@velora.live</p>
        <button className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold shadow-glow">Contact Support</button>
      </div>
    </div>
  );
}
