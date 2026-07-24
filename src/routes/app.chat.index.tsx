import { createFileRoute, Link } from "@tanstack/react-router";
import { CHATS } from "@/lib/mock-data";
import { OnlineDot, PageHeader, EmptyState } from "@/components/ui-kit";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/app/chat/")({ component: ChatInbox });

function ChatInbox() {
  if (!CHATS.length) return <EmptyState icon={MessageCircle} title="No chats yet" desc="Start a conversation with a creator" />;
  return (
    <div>
      <PageHeader title="Messages" subtitle={`${CHATS.length} conversations`} />
      <div className="space-y-2">
        {CHATS.map((c) => (
          <Link key={c.id} to="/app/chat/$id" params={{ id: c.creator.id }}
            className="glass rounded-2xl p-3 flex items-center gap-3 hover:bg-glass-border transition">
            <div className="relative">
              <img src={c.creator.avatar} alt={c.creator.name} className="h-12 w-12 rounded-full" />
              <span className="absolute bottom-0 right-0"><OnlineDot online={c.creator.online} /></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm truncate">{c.creator.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.time}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                {c.unread > 0 && <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 ml-2">{c.unread}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
