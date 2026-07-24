import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { Upload, Check, Camera, CreditCard, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/kyc")({ component: KYC });

function KYC() {
  const user = useAuth((s) => s.user);
  const update = useAuth((s) => s.updateUser);
  const [steps, setSteps] = useState({ selfie: false, voice: false, bank: false });
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const completed = Object.values(steps).filter(Boolean).length;
  const total = 3;

  const startVoice = () => {
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= 5) {
          stopVoice(true);
          return 5;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopVoice = (auto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setSteps((p) => ({ ...p, voice: true }));
    toast.success(auto ? "Voice sample captured ✓" : "Voice recording saved");
  };

  const items = [
    { k: "selfie" as const, icon: Camera, label: "Selfie Verification", desc: "Real-time face capture" },
    { k: "bank" as const, icon: CreditCard, label: "Bank Details", desc: "Account no. & IFSC" },
  ];

  return (
    <div>
      <PageHeader title="KYC Verification" subtitle={`${completed}/${total} steps complete`} />
      <div className="glass-strong rounded-3xl p-4 mb-5">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {/* Voice verification — new */}
        <GlassCard className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${steps.voice ? "bg-success/20 text-success" : "bg-glass"}`}>
            {steps.voice ? <Check className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Voice Verification</p>
            <p className="text-xs text-muted-foreground">
              {recording ? `Recording... ${seconds}s / 5s` : "Record a 5s voice sample to verify your identity"}
            </p>
          </div>
          {!recording ? (
            <button
              onClick={startVoice}
              className={`rounded-full px-3 py-1.5 text-xs ${steps.voice ? "glass" : "bg-gradient-primary shadow-glow"}`}
            >
              {steps.voice ? "✓ Re-record" : <><Mic className="inline h-3 w-3 mr-1" />Record</>}
            </button>
          ) : (
            <button onClick={() => stopVoice()} className="rounded-full bg-destructive px-3 py-1.5 text-xs">
              <Square className="inline h-3 w-3 mr-1" />Stop
            </button>
          )}
        </GlassCard>

        {items.map((it) => (
          <GlassCard key={it.k} className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${steps[it.k] ? "bg-success/20 text-success" : "bg-glass"}`}>
              {steps[it.k] ? <Check className="h-4 w-4" /> : <it.icon className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
            <button
              onClick={() => { setSteps({ ...steps, [it.k]: true }); toast.success(`${it.label} submitted`); }}
              className={`rounded-full px-3 py-1.5 text-xs ${steps[it.k] ? "glass" : "bg-gradient-primary shadow-glow"}`}
            >
              {steps[it.k] ? "✓ Done" : <><Upload className="inline h-3 w-3 mr-1" />Upload</>}
            </button>
          </GlassCard>
        ))}
      </div>

      {completed === total && !user?.kycVerified && (
        <button onClick={() => { update({ kycVerified: true }); toast.success("KYC submitted for review!"); }}
          className="mt-5 w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">
          Submit for verification
        </button>
      )}
    </div>
  );
}
