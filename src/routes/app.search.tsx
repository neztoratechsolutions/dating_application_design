import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CREATORS } from "@/lib/mock-data";
import { Search as SearchIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { OnlineDot } from "@/components/ui-kit";

export const Route = createFileRoute("/app/search")({ component: Search });

function Search() {
  const [q, setQ] = useState("");
  const results = q ? CREATORS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())) : CREATORS.slice(0, 8);
  return (
    <div>
      <div className="relative mb-5">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creators..."
          className="w-full glass-strong rounded-full pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <p className="text-xs text-muted-foreground mb-3">{q ? `${results.length} results` : "Suggested"}</p>
      <div className="space-y-2">
        {results.map((c) => (
          <Link key={c.id} to="/app/creator/$id" params={{ id: c.id }}
            className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="relative">
              <img src={c.avatar} className="h-12 w-12 rounded-full" alt="" />
              <span className="absolute bottom-0 right-0"><OnlineDot online={c.online} /></span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground">⭐ {c.rating} · {c.state}</p>
            </div>
            <span className="text-xs text-primary">{c.chatPrice}/min</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
