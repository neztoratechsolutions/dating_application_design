import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/legal/")({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold mb-3">Legal & Info</h1>
      <p className="text-sm text-muted-foreground">Choose a topic below.</p>
    </div>
  ),
});
