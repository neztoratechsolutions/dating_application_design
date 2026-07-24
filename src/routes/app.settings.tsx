import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const items = [
    { label: "Push notifications", on: true },
    { label: "Online status", on: true },
    { label: "Show in search", on: true },
    { label: "Auto-recharge coins", on: false },
  ];
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="space-y-2">
        {items.map((it) => (
          <Toggle key={it.label} label={it.label} defaultOn={it.on} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-6">App version 1.0.0 (demo)</p>
    </div>
  );
}

import { useState } from "react";
function Toggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => { setOn(!on); toast(`${label}: ${!on ? "On" : "Off"}`); }}
      className="w-full glass rounded-2xl p-4 flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className={`h-6 w-11 rounded-full p-0.5 transition ${on ? "bg-gradient-primary" : "bg-muted"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
