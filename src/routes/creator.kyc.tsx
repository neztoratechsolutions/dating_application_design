// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader, GlassCard } from "@/components/ui-kit";
// import { useAuth } from "@/lib/auth-store";
// import { Upload, Check, Camera, CreditCard, Mic, Square, Loader2 } from "lucide-react";
// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/creator/kyc")({ component: KYC });

// // Set directly to your local backend URL
// const API_BASE_URL = String(
//   import.meta.env.VITE_BASE_URL ??
//     import.meta.env.VITE_API_BASE_URL ??
//     ""
// ).replace(/\/+$/, "");

// function writeString(view: DataView, offset: number, str: string) {
//   for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
// }

// function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
//   const buffer = new ArrayBuffer(44 + samples.length * 2);
//   const view = new DataView(buffer);

//   writeString(view, 0, "RIFF");
//   view.setUint32(4, 36 + samples.length * 2, true);
//   writeString(view, 8, "WAVE");
//   writeString(view, 12, "fmt ");
//   view.setUint32(16, 16, true); // fmt chunk size
//   view.setUint16(20, 1, true); // PCM
//   view.setUint16(22, 1, true); // mono
//   view.setUint32(24, sampleRate, true);
//   view.setUint32(28, sampleRate * 2, true); // byte rate
//   view.setUint16(32, 2, true); // block align
//   view.setUint16(34, 16, true); // bits per sample
//   writeString(view, 36, "data");
//   view.setUint32(40, samples.length * 2, true);

//   let offset = 44;
//   for (let i = 0; i < samples.length; i++) {
//     const s = Math.max(-1, Math.min(1, samples[i]));
//     view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
//     offset += 2;
//   }

//   return new Blob([view], { type: "audio/wav" });
// }

// function KYC() {
//   const user = useAuth((s) => s.user);
//   const update = useAuth((s) => s.updateUser);
//   const [steps, setSteps] = useState({ selfie: false, voice: false, bank: false });
//   const [recording, setRecording] = useState(false);
//   const [seconds, setSeconds] = useState(0);
//   const [voiceUploading, setVoiceUploading] = useState(false);
//   const [selfieUploading, setSelfieUploading] = useState(false);
//   const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
//   const [bankUploading, setBankUploading] = useState(false);
//   const [bankPreview, setBankPreview] = useState<string | null>(null);
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const bankInputRef = useRef<HTMLInputElement>(null);
//   const selfieInputRef = useRef<HTMLInputElement>(null);

//   // Audio capture refs
//   const audioCtxRef = useRef<AudioContext | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
//   const processorRef = useRef<ScriptProcessorNode | null>(null);
//   const chunksRef = useRef<Float32Array[]>([]);
//   const collectedRef = useRef(0);
//   const sampleRateRef = useRef(48000);

//   // Restore existing verification status (voice + selfie) on mount.
//   useEffect(() => {
//     const creatorId = user?.id ?? 1;
//     let cancelled = false;
//     fetch(`${API_BASE_URL}/creator-verification/${creatorId}`)
//       .then((res) => (res.ok ? res.json() : null))
//       .then((data) => {
//         if (cancelled || !data) return;
//         const voiceDone = data.voice_status === "submitted" || data.voice_status === "approved";
//         const selfieDone = data.selfie_status === "submitted" || data.selfie_status === "approved";
//         setSteps((p) => ({ ...p, voice: voiceDone, selfie: selfieDone }));
//       })
//       .catch(() => {
//         /* leave defaults; backend may simply not have a record yet */
//       });
//     return () => {
//       cancelled = true;
//     };
//   }, [user?.id]);

//   // Clean up timer + preview URLs on unmount.
//   useEffect(() => () => {
//     if (timerRef.current) clearInterval(timerRef.current);
//     teardownAudio();
//   }, []);
//   useEffect(() => {
//     if (!bankPreview) return;
//     return () => URL.revokeObjectURL(bankPreview);
//   }, [bankPreview]);
//   useEffect(() => {
//     if (!selfiePreview) return;
//     return () => URL.revokeObjectURL(selfiePreview);
//   }, [selfiePreview]);

//   const completed = Object.values(steps).filter(Boolean).length;
//   const total = 3;

//   // -------------------------------------------------------------------------
//   // Voice capture
//   // -------------------------------------------------------------------------
//   function teardownAudio() {
//     try {
//       processorRef.current?.disconnect();
//       sourceRef.current?.disconnect();
//       streamRef.current?.getTracks().forEach((t) => t.stop());
//       if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
//         audioCtxRef.current.close().catch(() => {});
//       }
//     } catch {
//       /* ignore */
//     }
//     audioCtxRef.current = null;
//     sourceRef.current = null;
//     processorRef.current = null;
//     streamRef.current = null;
//     chunksRef.current = [];
//     collectedRef.current = 0;
//   }

//   async function startVoice() {
//     if (recording || voiceUploading) return;
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;

//       const AudioCtx: typeof AudioContext =
//         window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
//       const ctx = new AudioCtx();
//       if (ctx.state === "suspended") await ctx.resume();
//       audioCtxRef.current = ctx;
//       sampleRateRef.current = ctx.sampleRate;

//       const source = ctx.createMediaStreamSource(stream);
//       sourceRef.current = source;

//       const processor = ctx.createScriptProcessor(4096, 1, 1);
//       processorRef.current = processor;

//       // Muted gain so the mic never echoes through the speakers, while still
//       // keeping the script processor node alive so onaudioprocess fires.
//       const silentGain = ctx.createGain();
//       silentGain.gain.value = 0;
//       source.connect(processor);
//       processor.connect(silentGain);
//       silentGain.connect(ctx.destination);

//       chunksRef.current = [];
//       collectedRef.current = 0;
//       const targetSamples = 5.0 * ctx.sampleRate; // auto-stop at >= 5.0s

//       processor.onaudioprocess = (e: AudioProcessingEvent) => {
//         const input = e.inputBuffer.getChannelData(0);
//         chunksRef.current.push(new Float32Array(input));
//         collectedRef.current += input.length;
//         if (collectedRef.current >= targetSamples) {
//           void stopVoice(true);
//         }
//       };

//       setRecording(true);
//       setSeconds(0);
//       timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
//     } catch (err) {
//       console.error(err);
//       teardownAudio();
//       toast.error("Microphone access denied. Please allow mic permission and try again.");
//     }
//   }

//   async function stopVoice(auto = false) {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//     setRecording(false);

//     const sampleRate = sampleRateRef.current;
//     const chunks = chunksRef.current;
//     teardownAudio();

//     if (!chunks.length) {
//       toast.error("No audio captured. Please try again.");
//       return;
//     }

//     const merged = new Float32Array(chunks.reduce((acc, c) => acc + c.length, 0));
//     let off = 0;
//     for (const c of chunks) {
//       merged.set(c, off);
//       off += c.length;
//     }

//     const duration = merged.length / sampleRate;

//     if (duration < 5 || duration > 6) {
//       toast.error(`Recording was ${duration.toFixed(1)}s. It must be between 5 and 6 seconds.`);
//       return;
//     }

//     const wavBlob = encodeWAV(merged, sampleRate);
//     await uploadVoice(wavBlob, auto);
//   }

//   async function uploadVoice(wavBlob: Blob, auto: boolean) {
//     setVoiceUploading(true);
//     try {
//       const formData = new FormData();
//       formData.append("creator_id", String(user?.id ?? 1));
//       formData.append("voice_file", wavBlob, "voice.wav");

//       const res = await fetch(`${API_BASE_URL}/creator-verification/voice`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null);
//         throw new Error(errorData?.detail || `Upload failed (${res.status})`);
//       }

//       setSteps((p) => ({ ...p, voice: true }));
//       toast.success(auto ? "Voice sample captured ✓" : "Voice recording uploaded ✓");
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Failed to upload voice recording. Please try again.");
//     } finally {
//       setVoiceUploading(false);
//     }
//   }

//   // -------------------------------------------------------------------------
//   // Selfie upload
//   // -------------------------------------------------------------------------
//   function triggerSelfieUpload() {
//     if (selfieUploading) return;
//     selfieInputRef.current?.click();
//   }

//   async function handleSelfieUpload(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!["image/jpeg", "image/png"].includes(file.type)) {
//       toast.error("Please upload a JPG or PNG image");
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Selfie image must be under 5MB");
//       return;
//     }

//     setSelfieUploading(true);
//     const previewUrl = URL.createObjectURL(file);
//     setSelfiePreview(previewUrl);

//     try {
//       const formData = new FormData();
//       formData.append("creator_id", String(user?.id ?? 1));
//       formData.append("selfie_image", file);

//       const res = await fetch(`${API_BASE_URL}/creator-verification/selfie`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null);
//         throw new Error(errorData?.detail || `Upload failed (${res.status})`);
//       }

//       setSteps((p) => ({ ...p, selfie: true }));
//       toast.success("Selfie uploaded successfully ✓");
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Failed to upload selfie. Please try again.");
//       setSelfiePreview(null);
//     } finally {
//       setSelfieUploading(false);
//       if (selfieInputRef.current) selfieInputRef.current.value = "";
//     }
//   }

//   // -------------------------------------------------------------------------
//   // Bank upload (separate endpoint, kept intact)
//   // -------------------------------------------------------------------------
//   const handleBankUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       toast.error("Please upload an image file (JPG/PNG)");
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image must be under 5MB");
//       return;
//     }

//     setBankUploading(true);
//     const previewUrl = URL.createObjectURL(file);
//     setBankPreview(previewUrl);

//     try {
//       const formData = new FormData();
//       formData.append("user_id", String(user?.id ?? 1));
//       formData.append("bank_photo", file);

//       const res = await fetch(`${API_BASE_URL}/creator-kyc/bank-photo`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null);
//         throw new Error(errorData?.message || `Upload failed (${res.status})`);
//       }

//       setSteps((p) => ({ ...p, bank: true }));
//       toast.success("Bank photo uploaded successfully ✓");
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Failed to upload bank photo. Please try again.");
//       setBankPreview(null);
//     } finally {
//       setBankUploading(false);
//       if (bankInputRef.current) bankInputRef.current.value = "";
//     }
//   };

//   const triggerBankUpload = () => bankInputRef.current?.click();

//   const selfieItem = {
//     k: "selfie" as const,
//     icon: Camera,
//     label: "Selfie Verification",
//     desc: "Real-time face capture",
//   };

//   return (
//     <div>
//       <PageHeader title="KYC Verification" subtitle={`${completed}/${total} steps complete`} />
//       <div className="glass-strong rounded-3xl p-4 mb-5">
//         <div className="h-2 bg-muted rounded-full overflow-hidden">
//           <div
//             className="h-full bg-gradient-primary transition-all"
//             style={{ width: `${(completed / total) * 100}%` }}
//           />
//         </div>
//       </div>

//       {/* Hidden file inputs */}
//       <input
//         ref={selfieInputRef}
//         type="file"
//         accept="image/jpeg,image/png"
//         capture="user"
//         onChange={handleSelfieUpload}
//         className="hidden"
//       />
//       <input
//         ref={bankInputRef}
//         type="file"
//         accept="image/*"
//         capture="environment"
//         onChange={handleBankUpload}
//         className="hidden"
//       />

//       <div className="space-y-3">
//         {/* Voice verification */}
//         <GlassCard className="flex flex-col gap-3">
//           <div className="flex items-center gap-3">
//             <div className={`rounded-full p-2 ${steps.voice ? "bg-success/20 text-success" : "bg-glass"}`}>
//               {steps.voice ? <Check className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
//             </div>
//             <div className="flex-1">
//               <p className="font-semibold text-sm">Voice Verification</p>
//               <p className="text-xs text-muted-foreground">
//                 {recording
//                   ? `Recording... ${seconds}s / 5s`
//                   : voiceUploading
//                     ? "Uploading voice sample..."
//                     : "Record a 5s voice sample to verify your identity"}
//               </p>
//             </div>
//             {!recording ? (
//               <button
//                 onClick={startVoice}
//                 disabled={voiceUploading}
//                 className={`rounded-full px-3 py-1.5 text-xs ${steps.voice ? "glass" : "bg-gradient-primary shadow-glow"} ${voiceUploading ? "opacity-60 pointer-events-none" : ""}`}
//               >
//                 {voiceUploading ? (
//                   <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
//                 ) : steps.voice ? (
//                   "✓ Re-record"
//                 ) : (
//                   <><Mic className="inline h-3 w-3 mr-1" />Record</>
//                 )}
//               </button>
//             ) : (
//               <button onClick={() => stopVoice(false)} className="rounded-full bg-destructive px-3 py-1.5 text-xs">
//                 <Square className="inline h-3 w-3 mr-1" />Stop
//               </button>
//             )}
//           </div>
//           {recording && (
//             <div className="flex items-center gap-2 text-xs text-muted-foreground">
//               <span className="relative flex h-2 w-2">
//                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
//                 <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
//               </span>
//               Keep speaking — recording stops automatically at 5 seconds.
//             </div>
//           )}
//         </GlassCard>

//         {/* Selfie verification */}
//         <GlassCard className="flex flex-col gap-3">
//           <div className="flex items-center gap-3">
//             <div className={`rounded-full p-2 ${steps.selfie ? "bg-success/20 text-success" : "bg-glass"}`}>
//               {steps.selfie ? <Check className="h-4 w-4" /> : <selfieItem.icon className="h-4 w-4" />}
//             </div>
//             <div className="flex-1">
//               <p className="font-semibold text-sm">{selfieItem.label}</p>
//               <p className="text-xs text-muted-foreground">
//                 {selfieUploading
//                   ? "Uploading selfie..."
//                   : selfiePreview
//                     ? "Selfie uploaded"
//                     : selfieItem.desc}
//               </p>
//             </div>
//             <button
//               onClick={triggerSelfieUpload}
//               disabled={selfieUploading}
//               className={`rounded-full px-3 py-1.5 text-xs ${
//                 steps.selfie ? "glass" : "bg-gradient-primary shadow-glow"
//               } ${selfieUploading ? "opacity-60 pointer-events-none" : ""}`}
//             >
//               {selfieUploading ? (
//                 <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
//               ) : steps.selfie ? (
//                 "✓ Re-upload"
//               ) : (
//                 <><Upload className="inline h-3 w-3 mr-1" />Upload</>
//               )}
//             </button>
//           </div>

//           {selfiePreview && (
//             <div className="relative">
//               <img
//                 src={selfiePreview}
//                 alt="Selfie preview"
//                 className="rounded-xl w-full h-40 object-cover border border-glass"
//               />
//               {selfieUploading && (
//                 <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
//                   <Loader2 className="h-5 w-5 animate-spin text-white" />
//                 </div>
//               )}
//             </div>
//           )}
//         </GlassCard>

//         {/* Bank details — real upload (separate endpoint) */}
//         <GlassCard className="flex flex-col gap-3">
//           <div className="flex items-center gap-3">
//             <div className={`rounded-full p-2 ${steps.bank ? "bg-success/20 text-success" : "bg-glass"}`}>
//               {steps.bank ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
//             </div>
//             <div className="flex-1">
//               <p className="font-semibold text-sm">Bank Details</p>
//               <p className="text-xs text-muted-foreground">
//                 {bankPreview
//                   ? "Passbook / cheque photo uploaded"
//                   : "Upload passbook or cheque photo (max 5MB)"}
//               </p>
//             </div>
//             <button
//               onClick={triggerBankUpload}
//               disabled={bankUploading}
//               className={`rounded-full px-3 py-1.5 text-xs ${
//                 steps.bank ? "glass" : "bg-gradient-primary shadow-glow"
//               } ${bankUploading ? "opacity-60 pointer-events-none" : ""}`}
//             >
//               {bankUploading ? (
//                 <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
//               ) : steps.bank ? (
//                 "✓ Re-upload"
//               ) : (
//                 <><Upload className="inline h-3 w-3 mr-1" />Upload</>
//               )}
//             </button>
//           </div>

//           {bankPreview && (
//             <div className="relative">
//               <img
//                 src={bankPreview}
//                 alt="Bank document preview"
//                 className="rounded-xl w-full h-40 object-cover border border-glass"
//               />
//               {bankUploading && (
//                 <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
//                   <Loader2 className="h-5 w-5 animate-spin text-white" />
//                 </div>
//               )}
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {completed === total && !user?.kycVerified && (
//         <button
//           onClick={() => { update({ kycVerified: true }); toast.success("KYC submitted for review!"); }}
//           className="mt-5 w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow"
//         >
//           Submit for verification
//         </button>
//       )}
//     </div>
//   );
// }
// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader, GlassCard } from "@/components/ui-kit";
// import { useAuth } from "@/lib/auth-store";
// import {
//   Upload,
//   Check,
//   Camera,
//   CreditCard,
//   Mic,
//   Square,
//   Loader2,
//   User,
//   ShieldCheck,
//   FileText,
//   CheckCircle2,
//   FileSignature,
//   AlertTriangle,
//   Clock,
//   Download,
//   X,
//   Eye,
// } from "lucide-react";
// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/creator/kyc")({ component: KYC });

// // Set directly to your local backend URL
// const API_BASE_URL = String(
//   import.meta.env.VITE_BASE_URL ??
//     import.meta.env.VITE_API_BASE_URL ??
//     ""
// ).replace(/\/+$/, "");

// // Review endpoint with {user_id} path parameter (FastAPI style).
// // The {user_id} placeholder is replaced at call time with the creator's id.
// const REVIEW_ENDPOINT = "/kyc/review/{user_id}";

// // ---------------------------------------------------------------
// // Review modal helpers
// // ---------------------------------------------------------------

// function fmtDate(d: unknown): string {
//   if (!d) return "—";
//   try {
//     const dt = new Date(d as string);
//     if (Number.isNaN(dt.getTime())) return String(d);
//     return dt.toLocaleString();
//   } catch {
//     return String(d);
//   }
// }

// function StatusBadge({ status }: { status?: string | null }) {
//   if (!status) return <span className="text-xs text-muted-foreground">—</span>;
//   const s = String(status).toLowerCase();
//   const cls = ["approved", "active", "accepted", "verified", "submitted"].includes(s)
//     ? "bg-success/20 text-success"
//     : ["rejected", "blocked", "fraud", "suspended"].includes(s)
//       ? "bg-destructive/20 text-destructive"
//       : "bg-glass text-muted-foreground";
//   return (
//     <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}>
//       {status}
//     </span>
//   );
// }

// function Row({ label, value }: { label: string; value: React.ReactNode }) {
//   return (
//     <div className="flex justify-between items-start gap-3 text-xs py-1">
//       <span className="text-muted-foreground shrink-0">{label}</span>
//       <span className="font-medium text-right break-all">
//         {value === null || value === undefined || value === "" ? "—" : value}
//       </span>
//     </div>
//   );
// }

// function writeString(view: DataView, offset: number, str: string) {
//   for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
// }

// function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
//   const buffer = new ArrayBuffer(44 + samples.length * 2);
//   const view = new DataView(buffer);

//   writeString(view, 0, "RIFF");
//   view.setUint32(4, 36 + samples.length * 2, true);
//   writeString(view, 8, "WAVE");
//   writeString(view, 12, "fmt ");
//   view.setUint32(16, 16, true); // fmt chunk size
//   view.setUint16(20, 1, true); // PCM
//   view.setUint16(22, 1, true); // mono
//   view.setUint32(24, sampleRate, true);
//   view.setUint32(28, sampleRate * 2, true); // byte rate
//   view.setUint16(32, 2, true); // block align
//   view.setUint16(34, 16, true); // bits per sample
//   writeString(view, 36, "data");
//   view.setUint32(40, samples.length * 2, true);

//   let offset = 44;
//   for (let i = 0; i < samples.length; i++) {
//     const s = Math.max(-1, Math.min(1, samples[i]));
//     view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
//     offset += 2;
//   }

//   return new Blob([view], { type: "audio/wav" });
// }

// type BankDetails = {
//   id: number;
//   creator_id: number;
//   holder_name: string;
//   account_number: string;
//   ifsc_code: string;
//   bank_name: string;
//   created_at?: string;
// };

// function KYC() {
//   const user = useAuth((s) => s.user);
//   const update = useAuth((s) => s.updateUser);
//   const [steps, setSteps] = useState({ selfie: false, voice: false, bank: false });
//   const [recording, setRecording] = useState(false);
//   const [seconds, setSeconds] = useState(0);
//   const [voiceUploading, setVoiceUploading] = useState(false);
//   const [selfieUploading, setSelfieUploading] = useState(false);
//   const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
//   const [bankUploading, setBankUploading] = useState(false);
//   const [bankPreview, setBankPreview] = useState<string | null>(null);
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const bankInputRef = useRef<HTMLInputElement>(null);
//   const selfieInputRef = useRef<HTMLInputElement>(null);

//   // Bank details (text form) state
//   const [bankForm, setBankForm] = useState({
//     holder_name: "",
//     account_number: "",
//     ifsc_code: "",
//     bank_name: "",
//   });
//   const [bankPhotoDone, setBankPhotoDone] = useState(false);
//   const [bankDetailsDone, setBankDetailsDone] = useState(false);
//   const [bankFormSubmitting, setBankFormSubmitting] = useState(false);
//   const [bankDetailsExisting, setBankDetailsExisting] = useState<BankDetails | null>(null);

//   // KYC Review modal state
//   const [reviewOpen, setReviewOpen] = useState(false);
//   const [reviewLoading, setReviewLoading] = useState(false);
//   const [reviewData, setReviewData] = useState<any>(null);
//   const [reviewError, setReviewError] = useState<string | null>(null);

//   // Audio capture refs
//   const audioCtxRef = useRef<AudioContext | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
//   const processorRef = useRef<ScriptProcessorNode | null>(null);
//   const chunksRef = useRef<Float32Array[]>([]);
//   const collectedRef = useRef(0);
//   const sampleRateRef = useRef(48000);

//   // Restore existing verification status (voice + selfie) on mount.
//   useEffect(() => {
//     const creatorId = user?.id ?? 1;
//     let cancelled = false;
//     fetch(`${API_BASE_URL}/creator-verification/${creatorId}`)
//       .then((res) => (res.ok ? res.json() : null))
//       .then((data) => {
//         if (cancelled || !data) return;
//         const voiceDone = data.voice_status === "submitted" || data.voice_status === "approved";
//         const selfieDone = data.selfie_status === "submitted" || data.selfie_status === "approved";
//         setSteps((p) => ({ ...p, voice: voiceDone, selfie: selfieDone }));
//       })
//       .catch(() => {
//         /* leave defaults; backend may simply not have a record yet */
//       });
//     return () => {
//       cancelled = true;
//     };
//   }, [user?.id]);

//   // Fetch existing bank details on mount (so a returning creator doesn't re-submit)
//   useEffect(() => {
//     const creatorId = user?.id ?? 1;
//     fetch(`${API_BASE_URL}/creator-bank-details/${creatorId}`)
//       .then((res) => (res.ok ? res.json() : null))
//       .then((data) => {
//         if (!data?.data) return;
//         setBankDetailsExisting(data.data as BankDetails);
//         setBankDetailsDone(true);
//         setBankForm({
//           holder_name: data.data.holder_name ?? "",
//           account_number: data.data.account_number ?? "",
//           ifsc_code: data.data.ifsc_code ?? "",
//           bank_name: data.data.bank_name ?? "",
//         });
//       })
//       .catch(() => {
//         /* backend may not have a record yet */
//       });
//   }, [user?.id]);

//   // Sync the combined "bank" step (photo + text details)
//   useEffect(() => {
//     setSteps((p) => ({ ...p, bank: bankPhotoDone && bankDetailsDone }));
//   }, [bankPhotoDone, bankDetailsDone]);

//   // Close review modal on Escape
//   useEffect(() => {
//     if (!reviewOpen) return;
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setReviewOpen(false);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [reviewOpen]);

//   // Lock body scroll while modal is open
//   useEffect(() => {
//     if (reviewOpen) {
//       const prev = document.body.style.overflow;
//       document.body.style.overflow = "hidden";
//       return () => {
//         document.body.style.overflow = prev;
//       };
//     }
//   }, [reviewOpen]);

//   // Clean up timer + preview URLs on unmount.
//   useEffect(() => () => {
//     if (timerRef.current) clearInterval(timerRef.current);
//     teardownAudio();
//   }, []);
//   useEffect(() => {
//     if (!bankPreview) return;
//     return () => URL.revokeObjectURL(bankPreview);
//   }, [bankPreview]);
//   useEffect(() => {
//     if (!selfiePreview) return;
//     return () => URL.revokeObjectURL(selfiePreview);
//   }, [selfiePreview]);

//   const completed = Object.values(steps).filter(Boolean).length;
//   const total = 3;

//   // -------------------------------------------------------------------------
//   // Voice capture
//   // -------------------------------------------------------------------------
//   function teardownAudio() {
//     try {
//       processorRef.current?.disconnect();
//       sourceRef.current?.disconnect();
//       streamRef.current?.getTracks().forEach((t) => t.stop());
//       if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
//         audioCtxRef.current.close().catch(() => {});
//       }
//     } catch {
//       /* ignore */
//     }
//     audioCtxRef.current = null;
//     sourceRef.current = null;
//     processorRef.current = null;
//     streamRef.current = null;
//     chunksRef.current = [];
//     collectedRef.current = 0;
//   }

//   async function startVoice() {
//     if (recording || voiceUploading) return;
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;

//       const AudioCtx: typeof AudioContext =
//         window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
//       const ctx = new AudioCtx();
//       if (ctx.state === "suspended") await ctx.resume();
//       audioCtxRef.current = ctx;
//       sampleRateRef.current = ctx.sampleRate;

//       const source = ctx.createMediaStreamSource(stream);
//       sourceRef.current = source;

//       const processor = ctx.createScriptProcessor(4096, 1, 1);
//       processorRef.current = processor;

//       // Muted gain so the mic never echoes through the speakers, while still
//       // keeping the script processor node alive so onaudioprocess fires.
//       const silentGain = ctx.createGain();
//       silentGain.gain.value = 0;
//       source.connect(processor);
//       processor.connect(silentGain);
//       silentGain.connect(ctx.destination);

//       chunksRef.current = [];
//       collectedRef.current = 0;
//       const targetSamples = 5.0 * ctx.sampleRate; // auto-stop at >= 5.0s

//       processor.onaudioprocess = (e: AudioProcessingEvent) => {
//         const input = e.inputBuffer.getChannelData(0);
//         chunksRef.current.push(new Float32Array(input));
//         collectedRef.current += input.length;
//         if (collectedRef.current >= targetSamples) {
//           void stopVoice(true);
//         }
//       };

//       setRecording(true);
//       setSeconds(0);
//       timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
//     } catch (err) {
//       console.error(err);
//       teardownAudio();
//       toast.error("Microphone access denied. Please allow mic permission and try again.");
//     }
//   }

//   async function stopVoice(auto = false) {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//     setRecording(false);

//     const sampleRate = sampleRateRef.current;
//     const chunks = chunksRef.current;
//     teardownAudio();

//     if (!chunks.length) {
//       toast.error("No audio captured. Please try again.");
//       return;
//     }

//     const merged = new Float32Array(chunks.reduce((acc, c) => acc + c.length, 0));
//     let off = 0;
//     for (const c of chunks) {
//       merged.set(c, off);
//       off += c.length;
//     }

//     const duration = merged.length / sampleRate;

//     if (duration < 5 || duration > 6) {
//       toast.error(`Recording was ${duration.toFixed(1)}s. It must be between 5 and 6 seconds.`);
//       return;
//     }

//     const wavBlob = encodeWAV(merged, sampleRate);
//     await uploadVoice(wavBlob, auto);
//   }

//   async function uploadVoice(wavBlob: Blob, auto: boolean) {
//     setVoiceUploading(true);
//     try {
//       const formData = new FormData();
//       formData.append("creator_id", String(user?.id ?? 1));
//       formData.append("voice_file", wavBlob, "voice.wav");

//       const res = await fetch(`${API_BASE_URL}/creator-verification/voice`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null);
//         throw new Error(errorData?.detail || `Upload failed (${res.status})`);
//       }

//       setSteps((p) => ({ ...p, voice: true }));
//       toast.success(auto ? "Voice sample captured ✓" : "Voice recording uploaded ✓");
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Failed to upload voice recording. Please try again.");
//     } finally {
//       setVoiceUploading(false);
//     }
//   }

//   // -------------------------------------------------------------------------
//   // Selfie upload
//   // -------------------------------------------------------------------------
//   function triggerSelfieUpload() {
//     if (selfieUploading) return;
//     selfieInputRef.current?.click();
//   }

//   async function handleSelfieUpload(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!["image/jpeg", "image/png"].includes(file.type)) {
//       toast.error("Please upload a JPG or PNG image");
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Selfie image must be under 5MB");
//       return;
//     }

//     setSelfieUploading(true);
//     const previewUrl = URL.createObjectURL(file);
//     setSelfiePreview(previewUrl);

//     try {
//       const formData = new FormData();
//       formData.append("creator_id", String(user?.id ?? 1));
//       formData.append("selfie_image", file);

//       const res = await fetch(`${API_BASE_URL}/creator-verification/selfie`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null);
//         throw new Error(errorData?.detail || `Upload failed (${res.status})`);
//       }

//       setSteps((p) => ({ ...p, selfie: true }));
//       toast.success("Selfie uploaded successfully ✓");
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Failed to upload selfie. Please try again.");
//       setSelfiePreview(null);
//     } finally {
//       setSelfieUploading(false);
//       if (selfieInputRef.current) selfieInputRef.current.value = "";
//     }
//   }

//   // -------------------------------------------------------------------------
//   // Bank photo upload (separate endpoint)
//   // -------------------------------------------------------------------------
//   const handleBankUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       toast.error("Please upload an image file (JPG/PNG)");
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image must be under 5MB");
//       return;
//     }

//     setBankUploading(true);
//     const previewUrl = URL.createObjectURL(file);
//     setBankPreview(previewUrl);

//     try {
//       const formData = new FormData();
//       formData.append("user_id", String(user?.id ?? 1));
//       formData.append("bank_photo", file);

//       const res = await fetch(`${API_BASE_URL}/creator-kyc/bank-photo`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null);
//         throw new Error(errorData?.message || `Upload failed (${res.status})`);
//       }

//       setBankPhotoDone(true);
//       toast.success("Bank photo uploaded successfully ✓");
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Failed to upload bank photo. Please try again.");
//       setBankPreview(null);
//     } finally {
//       setBankUploading(false);
//       if (bankInputRef.current) bankInputRef.current.value = "";
//     }
//   };

//   const triggerBankUpload = () => bankInputRef.current?.click();

//   // -------------------------------------------------------------------------
//   // Bank details (text form) -> POST /creator-bank-details/{creator_id}
//   // -------------------------------------------------------------------------
//   async function submitBankDetails() {
//     const holder = bankForm.holder_name.trim();
//     const acc = bankForm.account_number.trim();
//     const ifsc = bankForm.ifsc_code.trim().toUpperCase();
//     const bankName = bankForm.bank_name.trim();

//     if (holder.length < 2 || holder.length > 150) {
//       toast.error("Holder name must be 2–150 characters");
//       return;
//     }
//     if (acc.length < 4 || acc.length > 50) {
//       toast.error("Account number must be 4–50 characters");
//       return;
//     }
//     if (ifsc.length !== 11) {
//       toast.error("IFSC code must be exactly 11 characters");
//       return;
//     }
//     if (bankName.length < 2 || bankName.length > 150) {
//       toast.error("Bank name must be 2–150 characters");
//       return;
//     }

//     setBankFormSubmitting(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/creator-bank-details/${user?.id ?? 1}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           holder_name: holder,
//           account_number: acc,
//           ifsc_code: ifsc,
//           bank_name: bankName,
//         }),
//       });

//       if (!res.ok) {
//         const err = await res.json().catch(() => null);
//         throw new Error(err?.detail || `Submission failed (${res.status})`);
//       }

//       const data = await res.json();
//       setBankDetailsExisting(data.data as BankDetails);
//       setBankDetailsDone(true);
//       toast.success("Bank details saved successfully ✓");
//     } catch (err: any) {
//       // If details already exist (POST returns 400), treat as done
//       if (err?.message?.toLowerCase().includes("already exist")) {
//         setBankDetailsDone(true);
//         toast.info("Bank details already on file");
//       } else {
//         toast.error(err?.message || "Failed to save bank details");
//       }
//     } finally {
//       setBankFormSubmitting(false);
//     }
//   }

//   // -------------------------------------------------------------------------
//   // KYC Review -> GET /creator-kyc-review/{user_id}
//   // -------------------------------------------------------------------------
//   async function fetchReview() {
//     setReviewOpen(true);
//     setReviewLoading(true);
//     setReviewError(null);
//     try {
//       const creatorId = String(user?.id ?? 1);
//       const url = `${API_BASE_URL}${REVIEW_ENDPOINT.replace("{user_id}", creatorId)}`;
//       const res = await fetch(url);
//       if (!res.ok) {
//         const err = await res.json().catch(() => null);
//         throw new Error(err?.detail || `Failed to fetch review (${res.status})`);
//       }
//       const data = await res.json();
//       setReviewData(data);
//     } catch (err: any) {
//       setReviewError(err?.message || "Failed to load KYC review");
//     } finally {
//       setReviewLoading(false);
//     }
//   }

//   const selfieItem = {
//     k: "selfie" as const,
//     icon: Camera,
//     label: "Selfie Verification",
//     desc: "Real-time face capture",
//   };

//   return (
//     <div>
//       <PageHeader title="KYC Verification" subtitle={`${completed}/${total} steps complete`} />
//       <div className="glass-strong rounded-3xl p-4 mb-5">
//         <div className="h-2 bg-muted rounded-full overflow-hidden">
//           <div
//             className="h-full bg-gradient-primary transition-all"
//             style={{ width: `${(completed / total) * 100}%` }}
//           />
//         </div>

//         {/* View KYC Review button */}
//         <button
//           onClick={fetchReview}
//           className="mt-3 w-full rounded-xl bg-gradient-primary py-2.5 text-xs font-semibold shadow-glow flex items-center justify-center gap-2"
//         >
//           <Eye className="h-4 w-4" />
//           View KYC Review
//         </button>
//       </div>

//       {/* Hidden file inputs */}
//       <input
//         ref={selfieInputRef}
//         type="file"
//         accept="image/jpeg,image/png"
//         capture="user"
//         onChange={handleSelfieUpload}
//         className="hidden"
//       />
//       <input
//         ref={bankInputRef}
//         type="file"
//         accept="image/*"
//         capture="environment"
//         onChange={handleBankUpload}
//         className="hidden"
//       />

//       <div className="space-y-3">
//         {/* Voice verification */}
//         <GlassCard className="flex flex-col gap-3">
//           <div className="flex items-center gap-3">
//             <div className={`rounded-full p-2 ${steps.voice ? "bg-success/20 text-success" : "bg-glass"}`}>
//               {steps.voice ? <Check className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
//             </div>
//             <div className="flex-1">
//               <p className="font-semibold text-sm">Voice Verification</p>
//               <p className="text-xs text-muted-foreground">
//                 {recording
//                   ? `Recording... ${seconds}s / 5s`
//                   : voiceUploading
//                     ? "Uploading voice sample..."
//                     : "Record a 5s voice sample to verify your identity"}
//               </p>
//             </div>
//             {!recording ? (
//               <button
//                 onClick={startVoice}
//                 disabled={voiceUploading}
//                 className={`rounded-full px-3 py-1.5 text-xs ${steps.voice ? "glass" : "bg-gradient-primary shadow-glow"} ${voiceUploading ? "opacity-60 pointer-events-none" : ""}`}
//               >
//                 {voiceUploading ? (
//                   <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
//                 ) : steps.voice ? (
//                   "✓ Re-record"
//                 ) : (
//                   <><Mic className="inline h-3 w-3 mr-1" />Record</>
//                 )}
//               </button>
//             ) : (
//               <button onClick={() => stopVoice(false)} className="rounded-full bg-destructive px-3 py-1.5 text-xs">
//                 <Square className="inline h-3 w-3 mr-1" />Stop
//               </button>
//             )}
//           </div>
//           {recording && (
//             <div className="flex items-center gap-2 text-xs text-muted-foreground">
//               <span className="relative flex h-2 w-2">
//                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
//                 <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
//               </span>
//               Keep speaking — recording stops automatically at 5 seconds.
//             </div>
//           )}
//         </GlassCard>

//         {/* Selfie verification */}
//         <GlassCard className="flex flex-col gap-3">
//           <div className="flex items-center gap-3">
//             <div className={`rounded-full p-2 ${steps.selfie ? "bg-success/20 text-success" : "bg-glass"}`}>
//               {steps.selfie ? <Check className="h-4 w-4" /> : <selfieItem.icon className="h-4 w-4" />}
//             </div>
//             <div className="flex-1">
//               <p className="font-semibold text-sm">{selfieItem.label}</p>
//               <p className="text-xs text-muted-foreground">
//                 {selfieUploading
//                   ? "Uploading selfie..."
//                   : selfiePreview
//                     ? "Selfie uploaded"
//                     : selfieItem.desc}
//               </p>
//             </div>
//             <button
//               onClick={triggerSelfieUpload}
//               disabled={selfieUploading}
//               className={`rounded-full px-3 py-1.5 text-xs ${
//                 steps.selfie ? "glass" : "bg-gradient-primary shadow-glow"
//               } ${selfieUploading ? "opacity-60 pointer-events-none" : ""}`}
//             >
//               {selfieUploading ? (
//                 <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
//               ) : steps.selfie ? (
//                 "✓ Re-upload"
//               ) : (
//                 <><Upload className="inline h-3 w-3 mr-1" />Upload</>
//               )}
//             </button>
//           </div>

//           {selfiePreview && (
//             <div className="relative">
//               <img
//                 src={selfiePreview}
//                 alt="Selfie preview"
//                 className="rounded-xl w-full h-40 object-cover border border-glass"
//               />
//               {selfieUploading && (
//                 <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
//                   <Loader2 className="h-5 w-5 animate-spin text-white" />
//                 </div>
//               )}
//             </div>
//           )}
//         </GlassCard>

//         {/* Bank details — photo + text form */}
//         <GlassCard className="flex flex-col gap-3">
//           <div className="flex items-center gap-3">
//             <div className={`rounded-full p-2 ${steps.bank ? "bg-success/20 text-success" : "bg-glass"}`}>
//               {steps.bank ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
//             </div>
//             <div className="flex-1">
//               <p className="font-semibold text-sm">Bank Details</p>
//               <p className="text-xs text-muted-foreground">
//                 {bankPreview
//                   ? "Passbook / cheque photo uploaded"
//                   : "Upload passbook or cheque photo (max 5MB)"}
//               </p>
//             </div>
//             <button
//               onClick={triggerBankUpload}
//               disabled={bankUploading}
//               className={`rounded-full px-3 py-1.5 text-xs ${
//                 steps.bank ? "glass" : "bg-gradient-primary shadow-glow"
//               } ${bankUploading ? "opacity-60 pointer-events-none" : ""}`}
//             >
//               {bankUploading ? (
//                 <><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Uploading...</>
//               ) : steps.bank ? (
//                 "✓ Re-upload"
//               ) : (
//                 <><Upload className="inline h-3 w-3 mr-1" />Upload</>
//               )}
//             </button>
//           </div>

//           {bankPreview && (
//             <div className="relative">
//               <img
//                 src={bankPreview}
//                 alt="Bank document preview"
//                 className="rounded-xl w-full h-40 object-cover border border-glass"
//               />
//               {bankUploading && (
//                 <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
//                   <Loader2 className="h-5 w-5 animate-spin text-white" />
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Photo status chip */}
//           <div className="flex items-center gap-2 text-xs">
//             <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${bankPhotoDone ? "bg-success/20 text-success" : "bg-glass text-muted-foreground"}`}>
//               {bankPhotoDone ? <Check className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
//               {bankPhotoDone ? "Photo done" : "Photo pending"}
//             </span>
//             <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${bankDetailsDone ? "bg-success/20 text-success" : "bg-glass text-muted-foreground"}`}>
//               {bankDetailsDone ? <Check className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
//               {bankDetailsDone ? "Details saved" : "Details pending"}
//             </span>
//           </div>

//           {/* Text-based bank details form */}
//           <div className="border-t border-glass pt-3 mt-1">
//             <p className="text-xs font-semibold mb-2">Bank Account Details</p>

//             {bankDetailsDone && bankDetailsExisting ? (
//               <div className="space-y-1.5 text-xs">
//                 <div className="flex justify-between gap-3">
//                   <span className="text-muted-foreground">Holder</span>
//                   <span className="font-medium text-right">{bankDetailsExisting.holder_name}</span>
//                 </div>
//                 <div className="flex justify-between gap-3">
//                   <span className="text-muted-foreground">Account</span>
//                   <span className="font-medium font-mono">
//                     ****{String(bankDetailsExisting.account_number).slice(-4)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between gap-3">
//                   <span className="text-muted-foreground">IFSC</span>
//                   <span className="font-medium font-mono">{bankDetailsExisting.ifsc_code}</span>
//                 </div>
//                 <div className="flex justify-between gap-3">
//                   <span className="text-muted-foreground">Bank</span>
//                   <span className="font-medium text-right">{bankDetailsExisting.bank_name}</span>
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 <input
//                   type="text"
//                   placeholder="Account Holder Name"
//                   value={bankForm.holder_name}
//                   onChange={(e) => setBankForm({ ...bankForm, holder_name: e.target.value })}
//                   disabled={bankFormSubmitting}
//                   className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Account Number"
//                   value={bankForm.account_number}
//                   onChange={(e) =>
//                     setBankForm({
//                       ...bankForm,
//                       account_number: e.target.value.replace(/[^0-9a-zA-Z]/g, ""),
//                     })
//                   }
//                   disabled={bankFormSubmitting}
//                   className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none font-mono"
//                 />
//                 <input
//                   type="text"
//                   placeholder="IFSC Code (11 chars)"
//                   value={bankForm.ifsc_code}
//                   onChange={(e) =>
//                     setBankForm({
//                       ...bankForm,
//                       ifsc_code: e.target.value.toUpperCase().slice(0, 11),
//                     })
//                   }
//                   disabled={bankFormSubmitting}
//                   className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none font-mono"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Bank Name"
//                   value={bankForm.bank_name}
//                   onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
//                   disabled={bankFormSubmitting}
//                   className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none"
//                 />
//                 <button
//                   onClick={submitBankDetails}
//                   disabled={bankFormSubmitting}
//                   className="w-full rounded-lg bg-gradient-primary py-2 text-xs font-medium shadow-glow disabled:opacity-60"
//                 >
//                   {bankFormSubmitting ? (
//                     <>
//                       <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     "Save Bank Details"
//                   )}
//                 </button>
//               </div>
//             )}
//           </div>
//         </GlassCard>
//       </div>

//       {completed === total && !user?.kycVerified && (
//         <button
//           onClick={() => {
//             update({ kycVerified: true });
//             toast.success("KYC submitted for review!");
//           }}
//           className="mt-5 w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow"
//         >
//           Submit for verification
//         </button>
//       )}

//       {/* ============================================================ */}
//       {/* KYC REVIEW MODAL                                              */}
//       {/* ============================================================ */}
//       {reviewOpen && (
//         <div
//           className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
//           onClick={() => setReviewOpen(false)}
//         >
//           <div
//             className="w-full max-w-3xl my-8 glass-strong rounded-3xl shadow-glow"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Modal header */}
//             <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-glass glass-strong rounded-t-3xl">
//               <div>
//                 <h2 className="text-lg font-bold flex items-center gap-2">
//                   <Eye className="h-5 w-5" />
//                   KYC Review
//                 </h2>
//                 <p className="text-xs text-muted-foreground">All your verification details in one place</p>
//               </div>
//               <button
//                 onClick={() => setReviewOpen(false)}
//                 className="rounded-full p-2 hover:bg-glass transition-colors"
//                 aria-label="Close"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>

//             {/* Modal body */}
//             <div className="p-4 space-y-3">
//               {reviewLoading && (
//                 <div className="flex flex-col items-center justify-center py-16">
//                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                   <p className="mt-3 text-sm text-muted-foreground">Loading your KYC review...</p>
//                 </div>
//               )}

//               {!reviewLoading && reviewError && (
//                 <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-2">
//                   <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
//                   <div>
//                     <p className="font-medium mb-1">Failed to load review</p>
//                     <p className="text-xs">{reviewError}</p>
//                     <button onClick={fetchReview} className="mt-2 text-xs underline">
//                       Try again
//                     </button>
//                   </div>
//                 </div>
//               )}

//               {!reviewLoading && !reviewError && reviewData && (
//                 <>
//                   {/* Personal Details */}
//                   <GlassCard>
//                     <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                       <User className="h-4 w-4" /> Personal Details
//                     </p>
//                     <div className="flex items-start gap-4 mb-3">
//                       {reviewData.personal_details?.profile_photo ? (
//                         <img
//                           src={reviewData.personal_details.profile_photo}
//                           alt="Profile"
//                           className="h-16 w-16 rounded-full object-cover border border-glass shrink-0"
//                         />
//                       ) : (
//                         <div className="h-16 w-16 rounded-full bg-glass flex items-center justify-center shrink-0">
//                           <User className="h-6 w-6 text-muted-foreground" />
//                         </div>
//                       )}
//                       <div className="flex-1">
//                         <Row label="Name" value={reviewData.personal_details?.display_name} />
//                         <Row label="Creator Code" value={reviewData.personal_details?.creator_code} />
//                         <Row label="Creator ID" value={reviewData.personal_details?.creator_id} />
//                       </div>
//                     </div>
//                     <Row label="Email" value={reviewData.personal_details?.email} />
//                     <Row label="Phone" value={reviewData.personal_details?.phone} />
//                     <Row label="State" value={reviewData.personal_details?.state_name} />
//                     <Row label="Joined" value={fmtDate(reviewData.personal_details?.joined_date)} />
//                   </GlassCard>

//                   {/* KYC Status */}
//                   <GlassCard>
//                     <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                       <ShieldCheck className="h-4 w-4" /> KYC Status
//                     </p>
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-xs text-muted-foreground">Overall:</span>
//                       <StatusBadge status={reviewData.kyc_details?.status} />
//                     </div>
//                     <Row label="Rejection Reason" value={reviewData.kyc_details?.rejection_reason} />
//                     <Row label="Created" value={fmtDate(reviewData.kyc_details?.created_at)} />
//                     <Row label="Updated" value={fmtDate(reviewData.kyc_details?.updated_at)} />
//                   </GlassCard>

//                   {/* Bank Details */}
//                   <GlassCard>
//                     <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                       <CreditCard className="h-4 w-4" /> Bank Details
//                     </p>
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-xs text-muted-foreground">Bank Status:</span>
//                       <StatusBadge status={reviewData.bank_details?.bank_status} />
//                     </div>
//                     <Row label="Holder Name" value={reviewData.bank_details?.holder_name} />
//                     <Row label="Account Number" value={reviewData.bank_details?.masked_account_number} />
//                     <Row label="IFSC Code" value={reviewData.bank_details?.ifsc_code} />
//                     <Row label="Bank Name" value={reviewData.bank_details?.bank_name} />
//                     <Row label="Created" value={fmtDate(reviewData.bank_details?.created_at)} />
//                     <Row label="Updated" value={fmtDate(reviewData.bank_details?.updated_at)} />
//                     {reviewData.bank_details?.bank_photo && (
//                       <div className="mt-3">
//                         <p className="text-xs text-muted-foreground mb-1">Bank Document</p>
//                         <img
//                           src={reviewData.bank_details.bank_photo}
//                           alt="Bank document"
//                           className="rounded-xl max-h-40 object-cover border border-glass"
//                         />
//                       </div>
//                     )}
//                   </GlassCard>

//                   {/* Documents */}
//                   <GlassCard>
//                     <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                       <FileText className="h-4 w-4" /> Documents
//                     </p>
//                     <div className="grid grid-cols-2 gap-3">
//                       {reviewData.documents &&
//                         Object.entries(reviewData.documents).map(([key, doc]: [string, any]) => (
//                           <div key={key} className="space-y-1">
//                             <div className="flex items-center justify-between">
//                               <span className="text-xs font-medium capitalize">
//                                 {key.replace(/_/g, " ")}
//                               </span>
//                               <StatusBadge status={doc?.status} />
//                             </div>
//                             {doc?.photo ? (
//                               <a href={doc.photo} target="_blank" rel="noreferrer">
//                                 <img
//                                   src={doc.photo}
//                                   alt={key}
//                                   className="w-full h-24 object-cover rounded-lg border border-glass"
//                                 />
//                               </a>
//                             ) : (
//                               <div className="w-full h-24 rounded-lg bg-glass flex items-center justify-center">
//                                 <FileText className="h-6 w-6 text-muted-foreground" />
//                               </div>
//                             )}
//                           </div>
//                         ))}
//                     </div>
//                   </GlassCard>

//                   {/* Account Status */}
//                   <GlassCard>
//                     <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                       <CheckCircle2 className="h-4 w-4" /> Account Status
//                     </p>
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="text-xs text-muted-foreground">Status:</span>
//                       <StatusBadge status={reviewData.account_status?.status} />
//                     </div>
//                     <Row label="Reason" value={reviewData.account_status?.reason} />
//                     <Row label="Action By" value={reviewData.account_status?.action_by} />
//                     <Row label="Created" value={fmtDate(reviewData.account_status?.created_at)} />
//                     <Row label="Updated" value={fmtDate(reviewData.account_status?.updated_at)} />
//                   </GlassCard>

//                   {/* Creator Agreement */}
//                   {reviewData.creator_agreement && (
//                     <GlassCard>
//                       <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                         <FileSignature className="h-4 w-4" /> Creator Agreement
//                       </p>
//                       <div className="flex items-center gap-2 mb-2">
//                         <span className="text-xs text-muted-foreground">Status:</span>
//                         <StatusBadge status={reviewData.creator_agreement?.status} />
//                       </div>
//                       <Row label="Date" value={fmtDate(reviewData.creator_agreement?.date)} />
//                       <Row label="IP Address" value={reviewData.creator_agreement?.ip_address} />
//                       <Row label="Agreement ID" value={reviewData.creator_agreement?.agreement_id} />
//                       {reviewData.creator_agreement?.agreement_details && (
//                         <div className="mt-2">
//                           <p className="text-xs text-muted-foreground mb-1">Details</p>
//                           <p className="text-xs">
//                             {String(reviewData.creator_agreement.agreement_details).slice(0, 300)}
//                             {String(reviewData.creator_agreement.agreement_details).length > 300 ? "..." : ""}
//                           </p>
//                         </div>
//                       )}
//                       {reviewData.creator_agreement?.agreement_pdf_url && (
//                         <a
//                           href={reviewData.creator_agreement.agreement_pdf_url}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="mt-3 inline-flex items-center gap-1 text-xs text-primary underline"
//                         >
//                           <Download className="h-3 w-3" /> Download Agreement PDF
//                         </a>
//                       )}
//                     </GlassCard>
//                   )}

//                   {/* Fraud Signals */}
//                   {reviewData.fraud_signals?.length > 0 && (
//                     <GlassCard>
//                       <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                         <AlertTriangle className="h-4 w-4" /> Fraud Signals ({reviewData.fraud_signals.length})
//                       </p>
//                       <div className="space-y-2">
//                         {reviewData.fraud_signals.map((alert: any) => (
//                           <div key={alert.fraud_alert_id} className="border border-glass rounded-lg p-2">
//                             <div className="flex items-center justify-between mb-1">
//                               <span className="text-xs font-medium">{alert.risk_type}</span>
//                               <StatusBadge status={alert.risk_level} />
//                             </div>
//                             <Row label="Code" value={alert.alert_code} />
//                             <Row label="Score" value={alert.risk_score} />
//                             <Row label="Description" value={alert.description} />
//                             <Row label="Date" value={fmtDate(alert.created_at)} />
//                           </div>
//                         ))}
//                       </div>
//                     </GlassCard>
//                   )}

//                   {/* Timeline */}
//                   {reviewData.timeline?.length > 0 && (
//                     <GlassCard>
//                       <p className="text-sm font-semibold mb-3 flex items-center gap-2">
//                         <Clock className="h-4 w-4" /> Timeline
//                       </p>
//                       <div className="space-y-3">
//                         {reviewData.timeline.map((item: any, i: number) => (
//                           <div key={i} className="flex items-start gap-3 text-xs">
//                             <div className="flex flex-col items-center shrink-0">
//                               <div className="h-2 w-2 rounded-full bg-primary" />
//                               {i < reviewData.timeline.length - 1 && (
//                                 <div className="w-px h-4 bg-glass mt-1" />
//                               )}
//                             </div>
//                             <div className="flex-1 -mt-0.5">
//                               <p className="font-medium">{item.event}</p>
//                               <p className="text-muted-foreground">{fmtDate(item.date)}</p>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </GlassCard>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import {
  Upload,
  Check,
  Camera,
  CreditCard,
  Mic,
  Square,
  Loader2,
  User,
  ShieldCheck,
  FileText,
  CheckCircle2,
  FileSignature,
  AlertTriangle,
  Clock,
  Download,
  X,
  Eye,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/kyc")({ component: KYC });

// Set directly to your local backend URL
const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    ""
).replace(/\/+$/, "");

// Review endpoint with {user_id} path parameter (FastAPI style).
// The {user_id} placeholder is replaced at call time with the creator's id.
const REVIEW_ENDPOINT = "/kyc/review/{user_id}";

// Resolve a backend-relative asset path (e.g. "uploads/creator_kyc/bank\foo.png")
// to an absolute URL. Normalises Windows-style backslashes and leaves absolute
// URLs / data URIs untouched.
function resolveUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  const normalized = path.replace(/\\/g, "/");
  return `${API_BASE_URL}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}

// ---------------------------------------------------------------
// Review modal helpers
// ---------------------------------------------------------------

function fmtDate(d: unknown): string {
  if (!d) return "—";
  try {
    const dt = new Date(d as string);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  } catch {
    return String(d);
  }
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const s = String(status).toLowerCase();
  const cls = ["approved", "active", "accepted", "verified", "submitted"].includes(s)
    ? "bg-success/20 text-success"
    : ["rejected", "blocked", "fraud", "suspended"].includes(s)
      ? "bg-destructive/20 text-destructive"
      : "bg-glass text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 text-xs py-1">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-all">
        {value === null || value === undefined || value === "" ? "—" : value}
      </span>
    </div>
  );
}

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

type BankDetails = {
  id: number;
  creator_id: number;
  holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  created_at?: string;
};

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

  // Bank details (text form) state
  const [bankForm, setBankForm] = useState({
    holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
  });
  const [bankPhotoDone, setBankPhotoDone] = useState(false);
  const [bankDetailsDone, setBankDetailsDone] = useState(false);
  const [bankFormSubmitting, setBankFormSubmitting] = useState(false);
  const [bankDetailsExisting, setBankDetailsExisting] = useState<BankDetails | null>(null);

  // KYC Review modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Audio capture refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const collectedRef = useRef(0);
  const sampleRateRef = useRef(48000);

  // Restore existing bank details, bank photo and verification status on mount.
  // GET /creator-bank-details/{creator_id} returns bank_details, bank_kyc
  // (photo + status) and verification (selfie + voice) in a single response.
  useEffect(() => {
    const creatorId = user?.id ?? 1;
    let cancelled = false;
    fetch(`${API_BASE_URL}/creator-bank-details/${creatorId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.data) return;
        const d = json.data;

        // Bank account details -> pre-fill the form boxes so a returning
        // creator sees what is already on file instead of blank inputs.
        if (d.bank_details) {
          setBankDetailsExisting(d.bank_details as BankDetails);
          setBankDetailsDone(true);
          setBankForm({
            holder_name: d.bank_details.holder_name ?? "",
            account_number: d.bank_details.account_number ?? "",
            ifsc_code: d.bank_details.ifsc_code ?? "",
            bank_name: d.bank_details.bank_name ?? "",
          });
        }

        // Bank passbook / cheque photo already on file.
        if (d.bank_kyc?.bank_photo) {
          setBankPreview(resolveUrl(d.bank_kyc.bank_photo) ?? null);
          setBankPhotoDone(true);
        }

        // Selfie + voice verification status.
        const v = d.verification;
        if (v) {
          const voiceDone =
            v.voice_status === "submitted" || v.voice_status === "approved";
          const selfieDone =
            v.selfie_status === "submitted" || v.selfie_status === "approved";
          setSteps((p) => ({ ...p, voice: voiceDone, selfie: selfieDone }));
          if (v.selfie_image) {
            setSelfiePreview(resolveUrl(v.selfie_image) ?? null);
          }
        }
      })
      .catch(() => {
        /* backend may not have a record yet */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Sync the combined "bank" step (photo + text details)
  useEffect(() => {
    setSteps((p) => ({ ...p, bank: bankPhotoDone && bankDetailsDone }));
  }, [bankPhotoDone, bankDetailsDone]);

  // Close review modal on Escape
  useEffect(() => {
    if (!reviewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewOpen]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (reviewOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [reviewOpen]);

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
  // Bank photo upload (separate endpoint)
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

      setBankPhotoDone(true);
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

  // -------------------------------------------------------------------------
  // Bank details (text form) -> POST /creator-bank-details/{creator_id}
  // -------------------------------------------------------------------------
  async function submitBankDetails() {
    const holder = bankForm.holder_name.trim();
    const acc = bankForm.account_number.trim();
    const ifsc = bankForm.ifsc_code.trim().toUpperCase();
    const bankName = bankForm.bank_name.trim();

    if (holder.length < 2 || holder.length > 150) {
      toast.error("Holder name must be 2–150 characters");
      return;
    }
    if (acc.length < 4 || acc.length > 50) {
      toast.error("Account number must be 4–50 characters");
      return;
    }
    if (ifsc.length !== 11) {
      toast.error("IFSC code must be exactly 11 characters");
      return;
    }
    if (bankName.length < 2 || bankName.length > 150) {
      toast.error("Bank name must be 2–150 characters");
      return;
    }

    setBankFormSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/creator-bank-details/${user?.id ?? 1}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holder_name: holder,
          account_number: acc,
          ifsc_code: ifsc,
          bank_name: bankName,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Submission failed (${res.status})`);
      }

      const data = await res.json();
      const saved = (data.data?.bank_details ?? data.data) as BankDetails | undefined;
      if (saved) {
        setBankDetailsExisting(saved);
        setBankForm({
          holder_name: saved.holder_name ?? "",
          account_number: saved.account_number ?? "",
          ifsc_code: saved.ifsc_code ?? "",
          bank_name: saved.bank_name ?? "",
        });
      }
      setBankDetailsDone(true);
      toast.success("Bank details saved successfully ✓");
    } catch (err: any) {
      // If details already exist (POST returns 400), treat as done
      if (err?.message?.toLowerCase().includes("already exist")) {
        setBankDetailsDone(true);
        toast.info("Bank details already on file");
      } else {
        toast.error(err?.message || "Failed to save bank details");
      }
    } finally {
      setBankFormSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // KYC Review -> GET /creator-kyc-review/{user_id}
  // -------------------------------------------------------------------------
  async function fetchReview() {
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    try {
      const creatorId = String(user?.id ?? 1);
      const url = `${API_BASE_URL}${REVIEW_ENDPOINT.replace("{user_id}", creatorId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Failed to fetch review (${res.status})`);
      }
      const data = await res.json();
      setReviewData(data);
    } catch (err: any) {
      setReviewError(err?.message || "Failed to load KYC review");
    } finally {
      setReviewLoading(false);
    }
  }

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

        {/* View KYC Review button */}
        <button
          onClick={fetchReview}
          className="mt-3 w-full rounded-xl bg-gradient-primary py-2.5 text-xs font-semibold shadow-glow flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View KYC Review
        </button>
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

        {/* Bank details — photo + text form */}
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

          {/* Photo status chip */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${bankPhotoDone ? "bg-success/20 text-success" : "bg-glass text-muted-foreground"}`}>
              {bankPhotoDone ? <Check className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
              {bankPhotoDone ? "Photo done" : "Photo pending"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${bankDetailsDone ? "bg-success/20 text-success" : "bg-glass text-muted-foreground"}`}>
              {bankDetailsDone ? <Check className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
              {bankDetailsDone ? "Details saved" : "Details pending"}
            </span>
          </div>

          {/* Text-based bank details form — always shown, pre-filled when on file */}
          <div className="border-t border-glass pt-3 mt-1">
            <p className="text-xs font-semibold mb-2">Bank Account Details</p>

            {bankDetailsExisting && (
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-success bg-success/10 rounded-lg px-2 py-1">
                <Check className="h-3 w-3" />
                Details on file — edit any field and save to update
              </div>
            )}

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Account Holder Name"
                value={bankForm.holder_name}
                onChange={(e) => setBankForm({ ...bankForm, holder_name: e.target.value })}
                disabled={bankFormSubmitting}
                className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={bankForm.account_number}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    account_number: e.target.value.replace(/[^0-9a-zA-Z]/g, ""),
                  })
                }
                disabled={bankFormSubmitting}
                className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none font-mono"
              />
              <input
                type="text"
                placeholder="IFSC Code (11 chars)"
                value={bankForm.ifsc_code}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    ifsc_code: e.target.value.toUpperCase().slice(0, 11),
                  })
                }
                disabled={bankFormSubmitting}
                className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none font-mono"
              />
              <input
                type="text"
                placeholder="Bank Name"
                value={bankForm.bank_name}
                onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                disabled={bankFormSubmitting}
                className="w-full rounded-lg bg-glass px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={submitBankDetails}
                disabled={bankFormSubmitting}
                className="w-full rounded-lg bg-gradient-primary py-2 text-xs font-medium shadow-glow disabled:opacity-60"
              >
                {bankFormSubmitting ? (
                  <>
                    <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : bankDetailsExisting ? (
                  "Update Bank Details"
                ) : (
                  "Save Bank Details"
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {completed === total && !user?.kycVerified && (
        <button
          onClick={() => {
            update({ kycVerified: true });
            toast.success("KYC submitted for review!");
          }}
          className="mt-5 w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow"
        >
          Submit for verification
        </button>
      )}

      {/* ============================================================ */}
      {/* KYC REVIEW MODAL                                              */}
      {/* ============================================================ */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setReviewOpen(false)}
        >
          <div
            className="w-full max-w-3xl my-8 glass-strong rounded-3xl shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-glass glass-strong rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  KYC Review
                </h2>
                <p className="text-xs text-muted-foreground">All your verification details in one place</p>
              </div>
              <button
                onClick={() => setReviewOpen(false)}
                className="rounded-full p-2 hover:bg-glass transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4 space-y-3">
              {reviewLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Loading your KYC review...</p>
                </div>
              )}

              {!reviewLoading && reviewError && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Failed to load review</p>
                    <p className="text-xs">{reviewError}</p>
                    <button onClick={fetchReview} className="mt-2 text-xs underline">
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {!reviewLoading && !reviewError && reviewData && (
                <>
                  {/* Personal Details */}
                  <GlassCard>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Personal Details
                    </p>
                    <div className="flex items-start gap-4 mb-3">
                      {reviewData.personal_details?.profile_photo ? (
                        <img
                          src={reviewData.personal_details.profile_photo}
                          alt="Profile"
                          className="h-16 w-16 rounded-full object-cover border border-glass shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-glass flex items-center justify-center shrink-0">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Row label="Name" value={reviewData.personal_details?.display_name} />
                        <Row label="Creator Code" value={reviewData.personal_details?.creator_code} />
                        <Row label="Creator ID" value={reviewData.personal_details?.creator_id} />
                      </div>
                    </div>
                    <Row label="Email" value={reviewData.personal_details?.email} />
                    <Row label="Phone" value={reviewData.personal_details?.phone} />
                    <Row label="State" value={reviewData.personal_details?.state_name} />
                    <Row label="Joined" value={fmtDate(reviewData.personal_details?.joined_date)} />
                  </GlassCard>

                  {/* KYC Status */}
                  <GlassCard>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> KYC Status
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Overall:</span>
                      <StatusBadge status={reviewData.kyc_details?.status} />
                    </div>
                    <Row label="Rejection Reason" value={reviewData.kyc_details?.rejection_reason} />
                    <Row label="Created" value={fmtDate(reviewData.kyc_details?.created_at)} />
                    <Row label="Updated" value={fmtDate(reviewData.kyc_details?.updated_at)} />
                  </GlassCard>

                  {/* Bank Details */}
                  <GlassCard>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Bank Details
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Bank Status:</span>
                      <StatusBadge status={reviewData.bank_details?.bank_status} />
                    </div>
                    <Row label="Holder Name" value={reviewData.bank_details?.holder_name} />
                    <Row label="Account Number" value={reviewData.bank_details?.masked_account_number} />
                    <Row label="IFSC Code" value={reviewData.bank_details?.ifsc_code} />
                    <Row label="Bank Name" value={reviewData.bank_details?.bank_name} />
                    <Row label="Created" value={fmtDate(reviewData.bank_details?.created_at)} />
                    <Row label="Updated" value={fmtDate(reviewData.bank_details?.updated_at)} />
                    {reviewData.bank_details?.bank_photo && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Bank Document</p>
                        <img
                          src={reviewData.bank_details.bank_photo}
                          alt="Bank document"
                          className="rounded-xl max-h-40 object-cover border border-glass"
                        />
                      </div>
                    )}
                  </GlassCard>

                  {/* Documents */}
                  {/* <GlassCard>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Documents
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {reviewData.documents &&
                        Object.entries(reviewData.documents).map(([key, doc]: [string, any]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium capitalize">
                                {key.replace(/_/g, " ")}
                              </span>
                              <StatusBadge status={doc?.status} />
                            </div>
                            {doc?.photo ? (
                              <a href={doc.photo} target="_blank" rel="noreferrer">
                                <img
                                  src={doc.photo}
                                  alt={key}
                                  className="w-full h-24 object-cover rounded-lg border border-glass"
                                />
                              </a>
                            ) : (
                              <div className="w-full h-24 rounded-lg bg-glass flex items-center justify-center">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </GlassCard> */}

                  {/* Account Status */}
                  <GlassCard>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Account Status
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <StatusBadge status={reviewData.account_status?.status} />
                    </div>
                    <Row label="Reason" value={reviewData.account_status?.reason} />
                    <Row label="Action By" value={reviewData.account_status?.action_by} />
                    <Row label="Created" value={fmtDate(reviewData.account_status?.created_at)} />
                    <Row label="Updated" value={fmtDate(reviewData.account_status?.updated_at)} />
                  </GlassCard>

                  {/* Creator Agreement */}
                  {reviewData.creator_agreement && (
                    <GlassCard>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileSignature className="h-4 w-4" /> Creator Agreement
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Status:</span>
                        <StatusBadge status={reviewData.creator_agreement?.status} />
                      </div>
                      <Row label="Date" value={fmtDate(reviewData.creator_agreement?.date)} />
                      <Row label="IP Address" value={reviewData.creator_agreement?.ip_address} />
                      <Row label="Agreement ID" value={reviewData.creator_agreement?.agreement_id} />
                      {reviewData.creator_agreement?.agreement_details && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Details</p>
                          <p className="text-xs">
                            {String(reviewData.creator_agreement.agreement_details).slice(0, 300)}
                            {String(reviewData.creator_agreement.agreement_details).length > 300 ? "..." : ""}
                          </p>
                        </div>
                      )}
                      {reviewData.creator_agreement?.agreement_pdf_url && (
                        <a
                          href={reviewData.creator_agreement.agreement_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs text-primary underline"
                        >
                          <Download className="h-3 w-3" /> Download Agreement PDF
                        </a>
                      )}
                    </GlassCard>
                  )}

                  {/* Fraud Signals */}
                  {reviewData.fraud_signals?.length > 0 && (
                    <GlassCard>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Fraud Signals ({reviewData.fraud_signals.length})
                      </p>
                      <div className="space-y-2">
                        {reviewData.fraud_signals.map((alert: any) => (
                          <div key={alert.fraud_alert_id} className="border border-glass rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{alert.risk_type}</span>
                              <StatusBadge status={alert.risk_level} />
                            </div>
                            <Row label="Code" value={alert.alert_code} />
                            <Row label="Score" value={alert.risk_score} />
                            <Row label="Description" value={alert.description} />
                            <Row label="Date" value={fmtDate(alert.created_at)} />
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {/* Timeline */}
                  {reviewData.timeline?.length > 0 && (
                    <GlassCard>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Timeline
                      </p>
                      <div className="space-y-3">
                        {reviewData.timeline.map((item: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-xs">
                            <div className="flex flex-col items-center shrink-0">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              {i < reviewData.timeline.length - 1 && (
                                <div className="w-px h-4 bg-glass mt-1" />
                              )}
                            </div>
                            <div className="flex-1 -mt-0.5">
                              <p className="font-medium">{item.event}</p>
                              <p className="text-muted-foreground">{fmtDate(item.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
