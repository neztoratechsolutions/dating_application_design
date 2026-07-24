import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/legal/safety")({
  component: () => (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">Safety Policy</h1>
      <p className="text-xs text-muted-foreground mb-6">Last updated May 26, 2026</p>
      <p className="text-sm leading-relaxed">We use KYC, AI moderation, and 24/7 support to keep the platform safe. Report any issue from chat or profile.</p>
      <p className="text-sm leading-relaxed mt-4 text-muted-foreground">
        This is a demo page. Replace with your final legal copy before launch.
      </p>
    </div>
  ),
});
