import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { Upload, Check, Camera, CreditCard, Mic, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/kyc")({ component: KYC });

// Set directly to your local backend URL
const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    ""
).replace(/\/+$/, "");

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

function KYC() {
  const user = useAuth((s) => s.user);
  const update = useAuth((s) => s.updateUser);
  const [steps, setSteps] = useState({ selfie: false, voice: false, bank: false });
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [bankUploading, setBankUploading] = useState(false);
  const [bankPreview, setBankPreview] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Audio capture refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const collectedRef = useRef(0);
  const sampleRateRef = useRef(48000);

  // Restore existing verification status (voice + selfie) on mount.
  useEffect(() => {
    const creatorId = user?.id ?? 1;
    let cancelled = false;
    fetch(`${API_BASE_URL}/creator-verification/${creatorId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const voiceDone = data.voice_status === "submitted" || data.voice_status === "approved";
        const selfieDone = data.selfie_status === "submitted" || data.selfie_status === "approved";
        setSteps((p) => ({ ...p, voice: voiceDone, selfie: selfieDone }));
      })
      .catch(() => {
        /* leave defaults; backend may simply not have a record yet */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Clean up timer + preview URLs on unmount.
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    teardownAudio();
  }, []);
  useEffect(() => {
    if (!bankPreview) return;
    return () => URL.revokeObjectURL(bankPreview);
  }, [bankPreview]);
  useEffect(() => {
    if (!selfiePreview) return;
    return () => URL.revokeObjectURL(selfiePreview);
  }, [selfiePreview]);

  const completed = Object.values(steps).filter(Boolean).length;
  const total = 3;

  // -------------------------------------------------------------------------
  // Voice capture
  // -------------------------------------------------------------------------
  function teardownAudio() {
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    } catch {
      /* ignore */
    }
    audioCtxRef.current = null;
    sourceRef.current = null;
    processorRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    collectedRef.current = 0;
  }

  async function startVoice() {
    if (recording || voiceUploading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") await ctx.resume();
      audioCtxRef.current = ctx;
      sampleRateRef.current = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Muted gain so the mic never echoes through the speakers, while still
      // keeping the script processor node alive so onaudioprocess fires.
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);

      chunksRef.current = [];
      collectedRef.current = 0;
      const targetSamples = 5.0 * ctx.sampleRate; // auto-stop at >= 5.0s

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));
        collectedRef.current += input.length;
        if (collectedRef.current >= targetSamples) {
          void stopVoice(true);
        }
      };

      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error(err);
      teardownAudio();
      toast.error("Microphone access denied. Please allow mic permission and try again.");
    }
  }

  async function stopVoice(auto = false) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);

    const sampleRate = sampleRateRef.current;
    const chunks = chunksRef.current;
    teardownAudio();

    if (!chunks.length) {
      toast.error("No audio captured. Please try again.");
      return;
    }

    const merged = new Float32Array(chunks.reduce((acc, c) => acc + c.length, 0));
    let off = 0;
    for (const c of chunks) {
      merged.set(c, off);
      off += c.length;
    }

    const duration = merged.length / sampleRate;

    if (duration < 5 || duration > 6) {
      toast.error(`Recording was ${duration.toFixed(1)}s. It must be between 5 and 6 seconds.`);
      return;
    }

    const wavBlob = encodeWAV(merged, sampleRate);
    await uploadVoice(wavBlob, auto);
  }

  async function uploadVoice(wavBlob: Blob, auto: boolean) {
    setVoiceUploading(true);
    try {
      const formData = new FormData();
      formData.append("creator_id", String(user?.id ?? 1));
      formData.append("voice_file", wavBlob, "voice.wav");

      const res = await fetch(`${API_BASE_URL}/creator-verification/voice`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Upload failed (${res.status})`);
      }

      setSteps((p) => ({ ...p, voice: true }));
      toast.success(auto ? "Voice sample captured ✓" : "Voice recording uploaded ✓");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to upload voice recording. Please try again.");
    } finally {
      setVoiceUploading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Selfie upload
  // -------------------------------------------------------------------------
  function triggerSelfieUpload() {
    if (selfieUploading) return;
    selfieInputRef.current?.click();
  }

  async function handleSelfieUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Selfie image must be under 5MB");
      return;
    }

    setSelfieUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setSelfiePreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append("creator_id", String(user?.id ?? 1));
      formData.append("selfie_image", file);

      const res = await fetch(`${API_BASE_URL}/creator-verification/selfie`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Upload failed (${res.status})`);
      }

      setSteps((p) => ({ ...p, selfie: true }));
      toast.success("Selfie uploaded successfully ✓");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to upload selfie. Please try again.");
      setSelfiePreview(null);
    } finally {
      setSelfieUploading(false);
      if (selfieInputRef.current) selfieInputRef.current.value = "";
    }
  }

  // -------------------------------------------------------------------------
  // Bank upload (separate endpoint, kept intact)
  // -------------------------------------------------------------------------
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

      {/* Hidden file inputs */}
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="user"
        onChange={handleSelfieUpload}
        className="hidden"
      />
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
        <GlassCard className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${steps.voice ? "bg-success/20 text-success" : "bg-glass"}`}>
              {steps.voice ? <Check className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Voice Verification</p>
              <p className="text-xs text-muted-foreground">
                {recording
                  ? `Recording... ${seconds}s / 5s`
                  : voiceUploading
                    ? "Uploading voice sample..."
                    : "Record a 5s voice sample to verify your identity"}
              </p>
            </div>
            {!recording ? (
              <button
                onClick={startVoice}
                disabled={voiceUploading}
                className={`rounded-full px-3 py-1.5 text-xs ${steps.voice ? "glass" : "bg-gradient-primary shadow-glow"} ${voiceUploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {voiceUploading ? (
                  <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
                ) : steps.voice ? (
                  "✓ Re-record"
                ) : (
                  <><Mic className="inline h-3 w-3 mr-1" />Record</>
                )}
              </button>
            ) : (
              <button onClick={() => stopVoice(false)} className="rounded-full bg-destructive px-3 py-1.5 text-xs">
                <Square className="inline h-3 w-3 mr-1" />Stop
              </button>
            )}
          </div>
          {recording && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              Keep speaking — recording stops automatically at 5 seconds.
            </div>
          )}
        </GlassCard>

        {/* Selfie verification */}
        <GlassCard className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${steps.selfie ? "bg-success/20 text-success" : "bg-glass"}`}>
              {steps.selfie ? <Check className="h-4 w-4" /> : <selfieItem.icon className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{selfieItem.label}</p>
              <p className="text-xs text-muted-foreground">
                {selfieUploading
                  ? "Uploading selfie..."
                  : selfiePreview
                    ? "Selfie uploaded"
                    : selfieItem.desc}
              </p>
            </div>
            <button
              onClick={triggerSelfieUpload}
              disabled={selfieUploading}
              className={`rounded-full px-3 py-1.5 text-xs ${
                steps.selfie ? "glass" : "bg-gradient-primary shadow-glow"
              } ${selfieUploading ? "opacity-60 pointer-events-none" : ""}`}
            >
              {selfieUploading ? (
                <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
              ) : steps.selfie ? (
                "✓ Re-upload"
              ) : (
                <><Upload className="inline h-3 w-3 mr-1" />Upload</>
              )}
            </button>
          </div>

          {selfiePreview && (
            <div className="relative">
              <img
                src={selfiePreview}
                alt="Selfie preview"
                className="rounded-xl w-full h-40 object-cover border border-glass"
              />
              {selfieUploading && (
                <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Bank details — real upload (separate endpoint) */}
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
