import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal")({
  component: () => (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
      <div className="glass-strong rounded-3xl p-8">
        <Outlet />
      </div>
      <nav className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
        <Link to="/legal/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/legal/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/legal/refund" className="hover:text-foreground">Refund</Link>
        <Link to="/legal/community" className="hover:text-foreground">Community</Link>
        <Link to="/legal/safety" className="hover:text-foreground">Safety</Link>
        <Link to="/legal/about" className="hover:text-foreground">About</Link>
        <Link to="/legal/faq" className="hover:text-foreground">FAQ</Link>
        <Link to="/legal/contact" className="hover:text-foreground">Contact</Link>
      </nav>
    </div>
  ),
});
