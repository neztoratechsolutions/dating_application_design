
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

type ProfileForm = {
  name: string;
  email: string;
  mobile: string;
  state: string;
};

function EditProfile() {
  const user = useAuth((state) => state.user);
  const updateUser = useAuth((state) => state.updateUser);
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfileForm>({
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
    field: keyof ProfileForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const mobile = form.mobile.trim();

    if (!name) {
      toast.error("Please enter your name");
      return;
    }

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    // Correct email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!mobile) {
      toast.error("Please enter your mobile number");
      return;
    }

    updateUser({
      ...form,
      name,
      email,
      mobile,
      state: form.state,
    });

    toast.success("Profile updated successfully");

    navigate({
      to: "/app/profile",
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Edit Profile" />

      <button
        type="button"
        onClick={() =>
          navigate({
            to: "/app/profile",
          })
        }
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </button>

      <div className="glass-strong space-y-5 rounded-3xl p-6">
        <div>
          <h2 className="text-lg font-bold">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Update your profile details below.
          </p>
        </div>

        {/* Full Name */}
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
            className="glass mt-1 w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Email */}
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
            className="glass mt-1 w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Mobile */}
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
            className="glass mt-1 w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* State */}
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
            className="glass mt-1 w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
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

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow transition hover:opacity-90"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={() =>
            navigate({
              to: "/app/profile",
            })
          }
          className="glass w-full rounded-xl py-3 font-medium transition hover:bg-glass-border"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
