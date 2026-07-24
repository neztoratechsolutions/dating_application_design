import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-otp")({ component: OtpPage });

function OtpPage() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const setDigit = (i: number, v: string) => {
    const c = v.replace(/\D/, "").slice(-1);
    const next = [...otp]; next[i] = c; setOtp(next);
    if (c && i < 3) refs.current[i + 1]?.focus();
  };

  const verify = () => {
    if (otp.some((o) => !o)) return toast.error("Enter full code");
    toast.success("Verified!");
    navigate({ to: user?.role === "creator" ? "/creator" : "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-8 w-full max-w-md text-center">
        <div className="h-14 w-14 rounded-2xl bg-gradient-primary mx-auto mb-4 shadow-glow flex items-center justify-center text-2xl">📱</div>
        <h1 className="text-2xl font-bold mb-1">Verify your number</h1>
        <p className="text-sm text-muted-foreground mb-6">We sent a 4-digit code to {user?.mobile || "your phone"}</p>
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((d, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el; }} value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus(); }}
              className="h-14 w-14 glass rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary"
              inputMode="numeric" maxLength={1}
            />
          ))}
        </div>
        <button onClick={verify} className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">Verify</button>
        <p className="mt-4 text-xs text-muted-foreground">
          {timer > 0 ? `Resend in 0:${timer.toString().padStart(2, "0")}` : <button className="text-primary" onClick={() => { setTimer(30); toast("Code resent"); }}>Resend code</button>}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Demo: any 4 digits work</p>
      </motion.div>
    </div>
  );
}
