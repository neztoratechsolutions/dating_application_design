import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/profile")({ component: P });

function P() {
  const user = useAuth((s) => s.user);
  const update = useAuth((s) => s.updateUser);
  const [bio, setBio] = useState("Let's vibe! Music, movies & midnight chats 🌙");
  const [name, setName] = useState(user?.name || "");
  return (
    <div>
      <PageHeader title="Profile Setup" subtitle="How customers see you" />
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold">{name.charAt(0)}</div>
          <button className="rounded-xl glass px-4 py-2 text-sm">Change photo</button>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none" />
        </div>
        <button onClick={() => { update({ name }); toast.success("Profile saved"); }} className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">Save</button>
      </div>
    </div>
  );
}
