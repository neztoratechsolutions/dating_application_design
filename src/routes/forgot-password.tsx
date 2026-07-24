import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter email");

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reset link");
      }

      setSent(true);
      toast.success("Reset link sent");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send a reset link.</p>
        
        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📧</div>
            <p className="text-sm">Check your inbox for the reset link.</p>
            <Link to="/login" className="mt-4 inline-block text-primary text-sm">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={isSubmitting}
              className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary mb-4 disabled:opacity-50" 
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}
        
        {!sent && (
          <Link to="/login" className="block text-center mt-4 text-sm text-muted-foreground">Back to login</Link>
        )}
      </div>
    </div>
  );
}