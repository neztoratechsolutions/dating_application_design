import { createFileRoute, Link } from "@tanstack/react-router";
import { CHATS } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/creator/chat")({ component: CChat });

function CChat() {
  return (
    <div>
      <PageHeader title="Inbox" subtitle="Customer conversations" />
      <div className="space-y-2">
        {CHATS.map((c) => (
          <Link key={c.id} to="/creator/chat/$id" params={{ id: c.creator.id }} className="glass rounded-2xl p-3 flex items-center gap-3 hover:bg-glass-border transition">
            <img src={c.creator.avatar} className="h-12 w-12 rounded-full object-cover" alt="" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{c.creator.name}</p>
              <p className="text-xs text-muted-foreground">{c.lastMessage}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{c.time}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
