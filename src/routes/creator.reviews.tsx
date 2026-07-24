import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Star } from "lucide-react";

const reviews = [
  { id: 1, name: "Aarav", rating: 5, text: "Such a fun chat! 💯", time: "2d" },
  { id: 2, name: "Rohan", rating: 4, text: "Loved the energy, will call again.", time: "5d" },
  { id: 3, name: "Karan", rating: 5, text: "Amazing host, very kind.", time: "1w" },
];

export const Route = createFileRoute("/creator/reviews")({ component: Rv });
function Rv() {
  return (
    <div>
      <PageHeader title="Reviews" subtitle="What customers say" />
      <div className="space-y-3">
        {reviews.map((r) => (
          <GlassCard key={r.id}>
            <div className="flex justify-between items-start">
              <p className="font-semibold text-sm">{r.name}</p>
              <p className="text-[10px] text-muted-foreground">{r.time}</p>
            </div>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-muted"}`} />
              ))}
            </div>
            <p className="text-sm mt-2">{r.text}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
