import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Phone, Video, MessageCircle, Shield, Star, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate({ to: user.role === "creator" ? "/creator" : user.role === "admin" ? "/admin" : "/app" });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary shadow-glow" />
          <span className="font-bold text-lg">Velora<span className="gradient-text">Live</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-full glass px-4 py-2 text-sm font-medium">Login</Link>
          <Link to="/signup" className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow">Sign up</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> India's premium creator platform
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-4xl md:text-6xl font-bold tracking-tight"
        >
          Chat, call & connect <br />with <span className="gradient-text">verified creators</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="mt-5 text-muted-foreground max-w-xl mx-auto"
        >
          Realtime voice, video & messaging with India's most loved creators. Safe, premium & beautifully designed.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/signup" search={{ role: "customer" }} className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-semibold shadow-glow">
            Join as Customer <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </Link>
          <Link to="/signup" search={{ role: "creator" }} className="inline-flex items-center gap-2 rounded-full glass-strong px-6 py-3 font-semibold">
            Become a Creator
          </Link>
        </motion.div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { icon: MessageCircle, label: "Realtime Chat" },
            { icon: Phone, label: "Voice Calls" },
            { icon: Video, label: "Video Calls" },
            { icon: Shield, label: "Verified Only" },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <f.icon className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">{f.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-warning fill-warning" /> 4.8 rating</div>
          <div>1.8M+ users</div>
          <div>4.8K+ creators</div>
        </div>

        <div className="mt-12 text-xs text-muted-foreground space-x-4">
          <Link to="/legal/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/legal/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/legal/about" className="hover:text-foreground">About</Link>
          <Link to="/legal/contact" className="hover:text-foreground">Contact</Link>
          <Link to="/legal/faq" className="hover:text-foreground">FAQ</Link>
        </div>
      </section>
    </div>
  );
}
