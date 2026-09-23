import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, type Role } from "@/lib/auth-store";
import { toast } from "sonner";
import { ArrowRight, Upload, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({ role: (s.role as Role) || "customer" }),
  component: SignupPage,
});

interface StateItem {
  id: number;
  state_name: string;
}

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

function SignupPage() {
  const { role: initialRole } = Route.useSearch();
  const [role, setRole] = useState<Role>(initialRole === "admin" ? "customer" : initialRole);
  const signup = useAuth((s) => s.signup);
  const navigate = useNavigate();
  
  const [states, setStates] = useState<StateItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    state_id: "", // Empty initially so "Select State" shows first
    gender: "",   // Empty initially so "Select Gender" shows first
  });
  
  const [agree, setAgree] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const proceed = () => {
    if (!form.name || !form.mobile || !form.email || !form.password || !form.state_id || !form.gender) {
      return toast.error("Fill all required fields");
    }
    setShowAgreement(true);
  };

    const finish = async () => {
    if (!agree) return toast.error("Please accept the agreement");
    
    setIsSubmitting(true);

    try {
      // Send standard JSON instead of FormData
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: form.name,
          phone: form.mobile,
          email: form.email,
          password: form.password,
          state_id: Number(form.state_id), // Ensure this is an integer
          gender: form.gender,
          bio: "", 
          description: "",
          // Sending the filename as a string since the schema expects a string.
          profile_photo: profilePhoto ? profilePhoto.name : "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create account");
      }

      // Pass the returned user data and selected role to your auth store
      signup({ ...data, role });
      toast.success("Account created! 🎉");
      navigate({ to: "/verify-otp" });

    } catch (error: any) {
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/states/`);
        if (!response.ok) {
          throw new Error("Failed to load states");
        }
        const data = await response.json();
        
        const statesArray = Array.isArray(data) ? data : (data.states || []);
        setStates(statesArray);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load states");
      }
    };

    fetchStates();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-8 w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary shadow-glow" />
          <span className="font-bold">Velora<span className="gradient-text">Live</span></span>
        </Link>
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-5">It only takes a minute</p>

        <div className="grid grid-cols-2 gap-1 glass rounded-full p-1 mb-5 text-sm">
          {(["customer", "creator"] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`rounded-full py-2 font-medium capitalize transition ${role === r ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}
            >{r}</button>
          ))}
        </div>

        <div className="space-y-3">
          {[
            { k: "name", p: "Full name" },
            { k: "mobile", p: "Mobile (+91)" },
            { k: "email", p: "Email", type: "email" },
            { k: "password", p: "Password", type: "password" },
          ].map((f) => (
            <input key={f.k} type={f.type || "text"} placeholder={f.p}
              value={(form as any)[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
              className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          ))}
          
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full bg-background text-foreground border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Select Gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={form.state_id}
              onChange={(e) => setForm({ ...form, state_id: e.target.value })}
              className="w-full bg-background text-foreground border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Select State</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.state_name}
                </option>
              ))}
            </select>
          </div>

          <label className="w-full glass rounded-xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-2 cursor-pointer hover:bg-glass/50 transition">
            <Upload className="h-4 w-4" /> 
            {profilePhoto ? profilePhoto.name : "Upload profile photo"}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} 
            />
          </label>
        </div>

        <button onClick={proceed} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">
          Continue <ArrowRight className="h-4 w-4" />
        </button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link>
        </p>
      </motion.div>

      <AnimatePresence>
        {showAgreement && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setShowAgreement(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">{role === "creator" ? "Creator Agreement" : "User Agreement"}</h2>
                <button onClick={() => setShowAgreement(false)} className="rounded-full p-1 hover:bg-glass">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 mb-5 max-h-60 overflow-y-auto pr-2">
                {(role === "creator" ? [
                  "No nudity or explicit content",
                  "No escort or prostitution services",
                  "No sharing of private contact numbers",
                  "No off-platform deals or payments",
                  "Selfie & KYC verification is mandatory",
                  "Comply with all platform & legal rules",
                  "Violation leads to permanent ban + payout forfeiture",
                ] : [
                  "Do not ask creators for personal phone numbers",
                  "No WhatsApp / Telegram contact sharing",
                  "Respect creators — zero tolerance for harassment",
                  "Follow platform community guidelines at all times",
                  "Company is not responsible for off-platform activity",
                  "Coins are non-refundable once used",
                ]).map((t) => <li key={t}>• {t}</li>)}
              </ul>
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-primary" />
                <span className="text-xs">I have read and agree to the terms above and Velora Live's <Link to="/legal/terms" className="text-primary underline">Terms & Conditions</Link>.</span>
              </label>
              <button 
                onClick={finish} 
                disabled={!agree || isSubmitting}
                className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  "Accept & Create account"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}