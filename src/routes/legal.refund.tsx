import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/legal/refund")({
  component: () => (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
      <p className="text-xs text-muted-foreground mb-6">Last updated May 26, 2026</p>
      <p className="text-sm leading-relaxed">Coin purchases are generally non-refundable. In case of failed transactions, refunds are processed within 7 working days.</p>
      <p className="text-sm leading-relaxed mt-4 text-muted-foreground">
        This is a demo page. Replace with your final legal copy before launch.
      </p>
    </div>
  ),
});
