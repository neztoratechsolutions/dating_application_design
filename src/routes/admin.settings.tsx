import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, CreditCard, Phone, Gamepad2, ShieldCheck, Bell, Save, RotateCcw, Upload, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "call", label: "Call", icon: Phone },
  { id: "game", label: "Game", icon: Gamepad2 },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "notif", label: "Notifications", icon: Bell },
];

const DEFAULTS = {
  appName: "Velora Live", 
  supportEmail: "support@velora.live", 
  supportPhone: "+91 80000 00000",
  logo: "", favicon: "",
  razorpayKey: "rzp_live_xxxxx", razorpaySecret: "••••••••", coinRate: 1, creatorCommission: 80, platformCommission: 20, gst: 18,
  minCall: 60, voicePrice: 15, videoPrice: 30, autoDisconnect: 30,
  ccEntry: 10, ccReward: 100, scratchEntry: 20, scratchReward: 500,
  otp: true, kycMandatory: true, deviceTrack: true, fraud: true,
  push: true, email: true, sms: false,
};

// Helper to fix Windows backslashes and relative paths
const buildImageUrl = (path?: string): string => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL.replace(/\/+$/, "")}/${normalized}`;
};

function Row({ label, children }: any) {
  return <div className="grid md:grid-cols-3 gap-2 items-center py-2.5 border-b border-white/5 last:border-0">
    <label className="text-sm text-muted-foreground">{label}</label>
    <div className="md:col-span-2">{children}</div>
  </div>;
}
const I = (p: any) => <input {...p} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />;
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-white/10"}`}>
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

function Page() {
  const [tab, setTab] = useState("general");
  const [s, setS] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  
  // State for files & previews
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  // Fetch existing settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/app-settings/`);
        if (!res.ok) return;
        
        const data = await res.json();
        setS(prev => ({
          ...prev,
          appName: data.app_name || prev.appName,
          supportEmail: data.support_email || prev.supportEmail,
          supportPhone: data.support_number || prev.supportPhone,
        }));
        
        setLogoPreview(buildImageUrl(data.logo));
        setFaviconPreview(buildImageUrl(data.favicon));
      } catch (err) {
        console.error("Failed to fetch app settings");
      }
    };
    fetchSettings();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file)); // Show local preview instantly
    } else {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    const formData = new FormData();
    formData.append("app_name", s.appName);
    
    if (s.supportEmail) formData.append("support_email", s.supportEmail);
    if (s.supportPhone) formData.append("support_number", s.supportPhone);
    
    if (logoFile) formData.append("logo", logoFile);
    if (faviconFile) formData.append("favicon", faviconFile);

    try {
      const res = await fetch(`${API_BASE_URL}/app-settings/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save settings");
      
      const data = await res.json();
      
      // Update previews with the newly returned URLs from backend
      if (data.logo) setLogoPreview(buildImageUrl(data.logo));
      if (data.favicon) setFaviconPreview(buildImageUrl(data.favicon));
      
      // Clear file objects
      setLogoFile(null);
      setFaviconFile(null);
      
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="App Settings" subtitle="Platform configuration center"
        action={<div className="flex gap-2">
          <button onClick={() => { setS(DEFAULTS); toast.success("Reset to defaults"); }} className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><RotateCcw className="h-4 w-4" />Reset</button>
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>} />

      <div className="grid lg:grid-cols-[220px_1fr] gap-4">
        <GlassCard className="h-fit">
          <div className="space-y-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${tab === t.id ? "bg-gradient-primary shadow-glow" : "hover:bg-white/5"}`}>
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          {tab === "general" && <div>
            <h3 className="font-bold mb-2">General Settings</h3>
            <Row label="App Name"><I value={s.appName} onChange={(e: any) => setS({ ...s, appName: e.target.value })} /></Row>
            
            {/* Logo Upload & Preview */}
            <Row label="Logo">
              <div className="flex items-center gap-3">
                <label className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-white/5">
                  <Upload className="h-4 w-4" /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "logo")} />
                </label>
                {logoPreview && <img src={logoPreview} alt="Logo Preview" className="h-8 w-8 rounded-lg object-cover bg-glass" />}
              </div>
            </Row>

            {/* Favicon Upload & Preview */}
            <Row label="Favicon">
              <div className="flex items-center gap-3">
                <label className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-white/5">
                  <Upload className="h-4 w-4" /> Upload Favicon
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "favicon")} />
                </label>
                {faviconPreview && <img src={faviconPreview} alt="Favicon Preview" className="h-8 w-8 rounded-lg object-cover bg-glass" />}
              </div>
            </Row>

            <Row label="Support Email"><I value={s.supportEmail} onChange={(e: any) => setS({ ...s, supportEmail: e.target.value })} /></Row>
            <Row label="Support Number"><I value={s.supportPhone} onChange={(e: any) => setS({ ...s, supportPhone: e.target.value })} /></Row>
          </div>}

          {tab === "payment" && <div>
            <h3 className="font-bold mb-2">Payment Settings</h3>
            <Row label="Razorpay Key ID"><I value={s.razorpayKey} onChange={(e: any) => setS({ ...s, razorpayKey: e.target.value })} /></Row>
            <Row label="Razorpay Secret"><I type="password" value={s.razorpaySecret} onChange={(e: any) => setS({ ...s, razorpaySecret: e.target.value })} /></Row>
            <Row label="Coin Conversion Rate (₹1 = coins)"><I type="number" value={s.coinRate} onChange={(e: any) => setS({ ...s, coinRate: +e.target.value })} /></Row>
            <Row label={`Creator Commission (${s.creatorCommission}%)`}><input type="range" min={50} max={95} value={s.creatorCommission} onChange={(e) => setS({ ...s, creatorCommission: +e.target.value, platformCommission: 100 - +e.target.value })} className="w-full accent-primary" /></Row>
            <Row label={`Platform Commission (${s.platformCommission}%)`}><div className="text-sm">{s.platformCommission}%</div></Row>
            <Row label={`GST (${s.gst}%)`}><input type="range" min={0} max={28} value={s.gst} onChange={(e) => setS({ ...s, gst: +e.target.value })} className="w-full accent-primary" /></Row>
          </div>}

          {tab === "call" && <div>
            <h3 className="font-bold mb-2">Call Settings</h3>
            <Row label={`Minimum Call Duration (${s.minCall}s)`}><input type="range" min={30} max={180} value={s.minCall} onChange={(e) => setS({ ...s, minCall: +e.target.value })} className="w-full accent-primary" /></Row>
            <Row label="Voice Call Pricing (coins/min)"><I type="number" value={s.voicePrice} onChange={(e: any) => setS({ ...s, voicePrice: +e.target.value })} /></Row>
            <Row label="Video Call Pricing (coins/min)"><I type="number" value={s.videoPrice} onChange={(e: any) => setS({ ...s, videoPrice: +e.target.value })} /></Row>
            <Row label="Auto Disconnect (low balance, s)"><I type="number" value={s.autoDisconnect} onChange={(e: any) => setS({ ...s, autoDisconnect: +e.target.value })} /></Row>
          </div>}

          {tab === "game" && <div>
            <h3 className="font-bold mb-2">Game Settings</h3>
            <Row label="Colour Connect — Entry Fee"><I type="number" value={s.ccEntry} onChange={(e: any) => setS({ ...s, ccEntry: +e.target.value })} /></Row>
            <Row label="Colour Connect — Reward"><I type="number" value={s.ccReward} onChange={(e: any) => setS({ ...s, ccReward: +e.target.value })} /></Row>
            <Row label="Scratch — Entry Fee"><I type="number" value={s.scratchEntry} onChange={(e: any) => setS({ ...s, scratchEntry: +e.target.value })} /></Row>
            <Row label="Scratch — Reward"><I type="number" value={s.scratchReward} onChange={(e: any) => setS({ ...s, scratchReward: +e.target.value })} /></Row>
          </div>}

          {tab === "security" && <div>
            <h3 className="font-bold mb-2">Security Settings</h3>
            <Row label="OTP Login Required"><Toggle value={s.otp} onChange={(v) => setS({ ...s, otp: v })} /></Row>
            <Row label="KYC Mandatory for Creators"><Toggle value={s.kycMandatory} onChange={(v) => setS({ ...s, kycMandatory: v })} /></Row>
            <Row label="Device Tracking"><Toggle value={s.deviceTrack} onChange={(v) => setS({ ...s, deviceTrack: v })} /></Row>
            <Row label="Fraud Detection Engine"><Toggle value={s.fraud} onChange={(v) => setS({ ...s, fraud: v })} /></Row>
          </div>}

          {tab === "notif" && <div>
            <h3 className="font-bold mb-2">Notification Settings</h3>
            <Row label="Push Notifications"><Toggle value={s.push} onChange={(v) => setS({ ...s, push: v })} /></Row>
            <Row label="Email Notifications"><Toggle value={s.email} onChange={(v) => setS({ ...s, email: v })} /></Row>
            <Row label="SMS Notifications"><Toggle value={s.sms} onChange={(v) => setS({ ...s, sms: v })} /></Row>
          </div>}
        </GlassCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/settings")({ component: Page });