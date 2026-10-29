import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/ui-kit";
import { STATES } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export const Route = createFileRoute("/app/profile/edit")({
  component: EditProfile,
});

function EditProfile() {
  const user = useAuth((state) => state.user);
  const updateUser = useAuth((state) => state.updateUser);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    mobile: user?.mobile ?? "",
    state: user?.state ?? STATES[0] ?? "",
  });

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      mobile: user?.mobile ?? "",
      state: user?.state ?? STATES[0] ?? "",
    });
  }, [user]);

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!form.mobile.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }

    updateUser({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
    });

    toast.success("Profile updated successfully");

    navigate({ to: "/app/profile" });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Edit Profile" />

      <button
        type="button"
        onClick={() => navigate({ to: "/app/profile" })}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </button>

      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold">Personal Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Update your profile details below.
          </p>
        </div>

        <div>
          <label
            htmlFor="profile-name"
            className="text-xs text-muted-foreground"
          >
            Full Name
          </label>
          <input
            id="profile-name"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(event) =>
              handleChange("name", event.target.value)
            }
            className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="text-xs text-muted-foreground"
          >
            Email Address
          </label>
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            value={form.email}
            onChange={(event) =>
              handleChange("email", event.target.value)
            }
            className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="profile-mobile"
            className="text-xs text-muted-foreground"
          >
            Mobile Number
          </label>
          <input
            id="profile-mobile"
            type="tel"
            autoComplete="tel"
            placeholder="Enter your mobile number"
            value={form.mobile}
            onChange={(event) =>
              handleChange("mobile", event.target.value)
            }
            className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="profile-state"
            className="text-xs text-muted-foreground"
          >
            State
          </label>
          <select
            id="profile-state"
            value={form.state}
            onChange={(event) =>
              handleChange("state", event.target.value)
            }
            className="w-full glass rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:ring-2 focus:ring-primary"
          >
            {STATES.map((state) => (
              <option
                key={state}
                value={state}
                className="bg-background"
              >
                {state}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow flex items-center justify-center gap-2 mt-3 hover:opacity-90 transition"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/app/profile" })}
          className="w-full rounded-xl glass py-3 font-medium hover:bg-glass-border transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
