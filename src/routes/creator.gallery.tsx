import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/gallery")({ component: Gallery });

function Gallery() {
  const [imgs, setImgs] = useState<number[]>([1, 2, 3, 4]);
  return (
    <div>
      <PageHeader title="Gallery" subtitle="Upload up to 8 photos" />
      <div className="grid grid-cols-3 gap-3">
        {imgs.map((i) => (
          <div key={i} className="relative aspect-square rounded-2xl bg-gradient-accent group">
            <button onClick={() => { setImgs(imgs.filter((x) => x !== i)); toast("Removed"); }}
              className="absolute top-2 right-2 rounded-full bg-destructive/80 p-1 opacity-0 group-hover:opacity-100 transition">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {imgs.length < 8 && (
          <button onClick={() => { setImgs([...imgs, Date.now()]); toast.success("Photo added"); }}
            className="aspect-square rounded-2xl glass border-2 border-dashed border-glass-border flex items-center justify-center text-muted-foreground">
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
