import { createFileRoute } from "@tanstack/react-router";
import { NOTIFICATIONS } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui-kit";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({ component: Notifs });

function Notifs() {
  return (
    <div>
      <PageHeader title="Notifications" />
      <div className="space-y-2">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className="glass rounded-2xl p-4 flex gap-3">
            <div className="rounded-full bg-gradient-primary p-2 h-fit shadow-glow"><Bell className="h-4 w-4" /></div>
            <div className="flex-1">
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{n.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
