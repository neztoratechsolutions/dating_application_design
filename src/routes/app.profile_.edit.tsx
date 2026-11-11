// import { createFileRoute, useNavigate } from "@tanstack/react-router";
// import { useAuth } from "@/lib/auth-store";
// import { PageHeader } from "@/components/ui-kit";
// import { STATES } from "@/lib/mock-data";
// import { useState } from "react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/app/profile_/edit")({ component: EditProfile });

// function EditProfile() {
//   const user = useAuth((s) => s.user);
//   const update = useAuth((s) => s.updateUser);
//   const navigate = useNavigate();
//   const [form, setForm] = useState({
//     name: user?.name || "", email: user?.email || "", mobile: user?.mobile || "", state: user?.state || STATES[0],
//   });

//   return (
//     <div>
//       <PageHeader title="Edit Profile" />
//       <div className="glass-strong rounded-3xl p-6 space-y-3">
//         {(["name", "email", "mobile"] as const).map((k) => (
//           <div key={k}>
//             <label className="text-xs text-muted-foreground capitalize">{k}</label>
//             <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
//               className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none" />
//           </div>
//         ))}
//         <div>
//           <label className="text-xs text-muted-foreground">State</label>
//           <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
//             className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none">
//             {STATES.map((s) => <option key={s} className="bg-background">{s}</option>)}
//           </select>
//         </div>
//         <button onClick={() => { update(form); toast.success("Profile updated"); navigate({ to: "/app/profile" }); }}
//           className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow mt-3">Save changes</button>
//       </div>
//     </div>
//   );
// }

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/ui-kit";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile_/edit")({
  component: EditProfile,
});

interface StateItem {
  id: number;
  state_name: string;
  is_active: boolean;
}

function EditProfile() {
  const user = useAuth((s) => s.user);
  const update = useAuth((s) => s.updateUser);
  const navigate = useNavigate();

  // Backend URL from .env
  const API_BASE = (
    import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

  const [states, setStates] = useState<StateItem[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    state_id: user?.state_id
      ? String(user.state_id)
      : "",
  });

  // =====================================
  // GET STATES API
  // =====================================

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch(`${API_BASE}/states/`);

        if (!response.ok) {
          throw new Error(`Failed to fetch states (${response.status})`);
        }

        const data: StateItem[] = await response.json();

        const activeStates = data.filter(
          (state) => state.is_active
        );

        setStates(activeStates);

        // Set user's existing state or first available state
        setForm((prev) => ({
          ...prev,
          state_id: prev.state_id ||
            (activeStates.length > 0
              ? String(activeStates[0].id)
              : ""),
        }));

      } catch (error) {
        console.error("Fetch states error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load states"
        );
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [API_BASE]);

  // =====================================
  // HANDLE INPUT CHANGE
  // =====================================

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================
  // UPDATE PROFILE API
  // =====================================

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User ID not found. Please login again.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!form.mobile.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }

    if (!form.state_id) {
      toast.error("Please select your state");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("display_name", form.name.trim());
      formData.append("email", form.email.trim());
      formData.append("phone", form.mobile.trim());
      formData.append("state_id", form.state_id);

      const API_URL = `${API_BASE}/users/${user.id}`;

      console.log("Update Profile API:", API_URL);

      const response = await fetch(API_URL, {
        method: "PUT",
        body: formData,
      });

      // Read response safely
      const responseText = await response.text();

      let result: any;

      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("Invalid API response:", responseText);

        throw new Error(
          `Server returned an invalid response. Status: ${response.status}. Check backend URL and route.`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.detail ||
          result.message ||
          "Profile update failed"
        );
      }

      if (result.status === false) {
        throw new Error(
          result.message || "Profile update failed"
        );
      }

      // Find selected state name
      const selectedState = states.find(
        (state) => state.id === Number(form.state_id)
      );

      // Update Zustand store
      update({
        name: result.data.display_name,
        email: result.data.email,
        mobile: result.data.phone,
        state: selectedState?.state_name || "",
        state_id: result.data.state_id,
      });

      toast.success("Profile updated successfully");

      navigate({ to: "/app/profile" });

    } catch (error) {
      console.error("Update profile error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div>
      <PageHeader title="Edit Profile" />

      <div className="glass-strong rounded-3xl p-6 space-y-3">

        {/* NAME */}
        <div>
          <label className="text-xs text-muted-foreground">
            Name
          </label>

          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              handleChange("name", e.target.value)
            }
            placeholder="Enter your name"
            className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-xs text-muted-foreground">
            Email
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              handleChange("email", e.target.value)
            }
            placeholder="Enter your email"
            className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
          />
        </div>

        {/* MOBILE */}
        <div>
          <label className="text-xs text-muted-foreground">
            Mobile
          </label>

          <input
            type="tel"
            value={form.mobile}
            onChange={(e) =>
              handleChange("mobile", e.target.value)
            }
            placeholder="Enter mobile number"
            className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
          />
        </div>

        {/* STATE */}
        <div>
          <label className="text-xs text-muted-foreground">
            State
          </label>

          <select
            value={form.state_id}
            onChange={(e) =>
              handleChange("state_id", e.target.value)
            }
            disabled={loadingStates || states.length === 0}
            className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none"
          >
            <option value="" className="bg-background">
              {loadingStates
                ? "Loading states..."
                : "Select State"}
            </option>

            {states.map((state) => (
              <option
                key={state.id}
                value={String(state.id)}
                className="bg-background"
              >
                {state.state_name}
              </option>
            ))}
          </select>
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={saving || loadingStates}
          className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow mt-3 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

      </div>
    </div>
  );
}
