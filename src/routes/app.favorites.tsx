import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { CREATORS } from "@/lib/mock-data";
import { Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/app/favorites")({ component: Favorites });

function Favorites() {
  const favs = CREATORS.slice(0, 6);
  return (
    <div>
      <PageHeader title="Favorite Creators" subtitle={`${favs.length} creators saved`} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {favs.map((c) => (
          <GlassCard key={c.id} className="text-center">
            <img src={c.avatar} className="h-20 w-20 rounded-full mx-auto mb-2 object-cover" alt="" />
            <p className="font-semibold text-sm">{c.name}</p>
            <p className="text-[10px] text-muted-foreground">{c.state}</p>
            <div className="flex gap-1 mt-3">
              <Link to="/app/creator/$id" params={{ id: c.id }} className="flex-1 rounded-full glass py-1.5 text-xs">View</Link>
              <Link to="/app/chat/$id" params={{ id: c.id }} className="flex-1 rounded-full bg-gradient-primary py-1.5 text-xs shadow-glow flex items-center justify-center gap-1">
                <MessageCircle className="h-3 w-3" />Chat
              </Link>
            </div>
            <Heart className="h-4 w-4 text-primary fill-primary absolute top-3 right-3" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
