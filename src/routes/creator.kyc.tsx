import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { Upload, Check, Camera, CreditCard, Mic, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/kyc")({ component: KYC });

// Set directly to your local backend URL
const API_BASE_URL = "http://127.0.0.1:8000";

function KYC() {
  const user = useAuth((s) => s.user);
  const update = useAuth((s) => s.updateUser);
  const [steps, setSteps] = useState({ selfie: false, voice: false, bank: false });
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [bankUploading, setBankUploading] = useState(false);
  const [bankPreview, setBankPreview] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
  useEffect(() => {
    if (!bankPreview) return;
    return () => URL.revokeObjectURL(bankPreview);
  }, [bankPreview]);

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

  const handleBankUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG/PNG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setBankUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setBankPreview(previewUrl);

    try {
      const formData = new FormData();
      // Using "1" as fallback for testing if user isn't loaded yet
      formData.append("user_id", String(user?.id ?? 1));
      formData.append("bank_photo", file);

      const res = await fetch(`${API_BASE_URL}/creator-kyc/bank-photo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Upload failed (${res.status})`);
      }

      setSteps((p) => ({ ...p, bank: true }));
      toast.success("Bank photo uploaded successfully ✓");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload bank photo. Please try again.");
      setBankPreview(null);
    } finally {
      setBankUploading(false);
      if (bankInputRef.current) bankInputRef.current.value = "";
    }
  };

  const triggerBankUpload = () => bankInputRef.current?.click();

  const selfieItem = {
    k: "selfie" as const,
    icon: Camera,
    label: "Selfie Verification",
    desc: "Real-time face capture",
  };

  return (
    <div>
      <PageHeader title="KYC Verification" subtitle={`${completed}/${total} steps complete`} />
      <div className="glass-strong rounded-3xl p-4 mb-5">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Hidden file input for bank photo */}
      <input
        ref={bankInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleBankUpload}
        className="hidden"
      />

      <div className="space-y-3">
        {/* Voice verification */}
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

        {/* Selfie verification */}
        <GlassCard className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${steps.selfie ? "bg-success/20 text-success" : "bg-glass"}`}>
            {steps.selfie ? <Check className="h-4 w-4" /> : <selfieItem.icon className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{selfieItem.label}</p>
            <p className="text-xs text-muted-foreground">{selfieItem.desc}</p>
          </div>
          <button
            onClick={() => { setSteps({ ...steps, selfie: true }); toast.success(`${selfieItem.label} submitted`); }}
            className={`rounded-full px-3 py-1.5 text-xs ${steps.selfie ? "glass" : "bg-gradient-primary shadow-glow"}`}
          >
            {steps.selfie ? "✓ Done" : <><Upload className="inline h-3 w-3 mr-1" />Upload</>}
          </button>
        </GlassCard>

        {/* Bank details — real upload */}
        <GlassCard className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${steps.bank ? "bg-success/20 text-success" : "bg-glass"}`}>
              {steps.bank ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Bank Details</p>
              <p className="text-xs text-muted-foreground">
                {bankPreview
                  ? "Passbook / cheque photo uploaded"
                  : "Upload passbook or cheque photo (max 5MB)"}
              </p>
            </div>
            <button
              onClick={triggerBankUpload}
              disabled={bankUploading}
              className={`rounded-full px-3 py-1.5 text-xs ${
                steps.bank ? "glass" : "bg-gradient-primary shadow-glow"
              } ${bankUploading ? "opacity-60 pointer-events-none" : ""}`}
            >
              {bankUploading ? (
                <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
              ) : steps.bank ? (
                "✓ Re-upload"
              ) : (
                <><Upload className="inline h-3 w-3 mr-1" />Upload</>
              )}
            </button>
          </div>

          {bankPreview && (
            <div className="relative">
              <img
                src={bankPreview}
                alt="Bank document preview"
                className="rounded-xl w-full h-40 object-cover border border-glass"
              />
              {bankUploading && (
                <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {completed === total && !user?.kycVerified && (
        <button
          onClick={() => { update({ kycVerified: true }); toast.success("KYC submitted for review!"); }}
          className="mt-5 w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow"
        >
          Submit for verification
        </button>
      )}
    </div>
  );
}