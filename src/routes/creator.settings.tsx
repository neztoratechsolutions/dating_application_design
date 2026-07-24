import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/settings")({ component: S });
function S() {
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="space-y-3">
        <GlassCard>
          <p className="font-semibold text-sm mb-2">Availability hours</p>
          <div className="flex gap-2">
            <input type="time" defaultValue="09:00" className="glass rounded-xl px-3 py-2 text-sm outline-none flex-1" />
            <input type="time" defaultValue="22:00" className="glass rounded-xl px-3 py-2 text-sm outline-none flex-1" />
          </div>
        </GlassCard>
        <GlassCard>
          <p className="font-semibold text-sm mb-1">Auto-accept calls</p>
          <p className="text-xs text-muted-foreground">When online, automatically accept incoming</p>
        </GlassCard>
        <button onClick={() => toast.success("Settings saved")} className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">Save</button>
      </div>
    </div>
  );
}
