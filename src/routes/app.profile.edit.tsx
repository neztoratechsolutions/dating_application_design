import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/ui-kit";
import { STATES } from "@/lib/mock-data";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile/edit")({ component: EditProfile });

function EditProfile() {
  const user = useAuth((s) => s.user);
  const update = useAuth((s) => s.updateUser);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "", email: user?.email || "", mobile: user?.mobile || "", state: user?.state || STATES[0],
  });

  return (
    <div>
      <PageHeader title="Edit Profile" />
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        {(["name", "email", "mobile"] as const).map((k) => (
          <div key={k}>
            <label className="text-xs text-muted-foreground capitalize">{k}</label>
            <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none" />
          </div>
        ))}
        <div>
          <label className="text-xs text-muted-foreground">State</label>
          <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none">
            {STATES.map((s) => <option key={s} className="bg-background">{s}</option>)}
          </select>
        </div>
        <button onClick={() => { update(form); toast.success("Profile updated"); navigate({ to: "/app/profile" }); }}
          className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow mt-3">Save changes</button>
      </div>
    </div>
  );
}
