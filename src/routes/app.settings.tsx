import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/app/settings")({ component: Settings });

// Backend base URL. Prefer the Vite env var when set; fall back to localhost
// so the URL is never `undefined` (which the browser treats as a relative path).
const API_BASE_URL = import.meta.env.VITE_BASE_URL ?? "http://127.0.0.1:8000";

type SettingsField =
  | "push_notifications"
  | "online_status"
  | "show_in_search"
  | "auto_recharge_coins";

type SettingsData = Record<SettingsField, boolean> & {
  customer_id?: number;
};

const FIELD_META: { key: SettingsField; label: string }[] = [
  { key: "push_notifications", label: "Push notifications" },
  { key: "online_status", label: "Online status" },
  { key: "show_in_search", label: "Show in search" },
  { key: "auto_recharge_coins", label: "Auto-recharge coins" },
];

const DEFAULT_SETTINGS: SettingsData = {
  push_notifications: true,
  online_status: true,
  show_in_search: true,
  auto_recharge_coins: false,
};

function Settings() {
  const user = useAuth((s) => s.user);
  const customerId = user?.id ?? 1;

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SettingsField | null>(null);

  // -----------------------------------------------------------------------
  // GET /Customer-settings/{customer_id} — auto-create via POST on 404
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load(): Promise<SettingsData | null> {
      try {
        const res = await fetch(`${API_BASE_URL}/Customer-settings/${customerId}`);

        if (res.status === 404) {
          // No settings row yet — create one with defaults, then use it.
          const created = await createSettings(customerId);
          return created;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || "Failed to load settings");
        }

        const data = await res.json();
        return normalize(data);
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message || "Failed to load settings");
        return null;
      }
    }

    async function createSettings(id: number): Promise<SettingsData | null> {
      try {
        const res = await fetch(`${API_BASE_URL}/Customer-settings/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: id,
            push_notifications: toBackendValue(DEFAULT_SETTINGS.push_notifications),
            online_status: toBackendValue(DEFAULT_SETTINGS.online_status),
            show_in_search: toBackendValue(DEFAULT_SETTINGS.show_in_search),
            auto_recharge_coins: toBackendValue(DEFAULT_SETTINGS.auto_recharge_coins),
          }),
        });

        // Race: another client already created the row — just re-fetch.
        if (res.status === 400) {
          const reGet = await fetch(`${API_BASE_URL}/Customer-settings/${id}`);
          if (!reGet.ok) {
            const err = await reGet.json().catch(() => null);
            throw new Error(err?.detail || "Failed to load settings");
          }
          return normalize(await reGet.json());
        }

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || "Failed to create settings");
        }

        return normalize(await res.json());
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message || "Failed to create settings");
        return null;
      }
    }

    load().then((data) => {
      if (cancelled) return;
      setSettings(data ?? { ...DEFAULT_SETTINGS });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  // -----------------------------------------------------------------------
  // PUT /Customer-settings/{customer_id} — partial update, optimistic
  // -----------------------------------------------------------------------
  async function toggle(key: SettingsField) {
    if (!settings || savingKey) return;

    const previous = settings[key];
    const newValue = !previous;

    // Optimistic update
    setSettings({ ...settings, [key]: newValue });
    setSavingKey(key);

    try {
      const res = await fetch(`${API_BASE_URL}/Customer-settings/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: toBackendValue(newValue) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Failed to update setting");
      }

      const data = await res.json().catch(() => null);
      if (data) {
        // Reconcile with the server's authoritative state.
        setSettings(normalize(data));
      }

      const label = FIELD_META.find((f) => f.key === key)?.label ?? key;
      toast(`${label}: ${newValue ? "On" : "Off"}`);
    } catch (err: any) {
      // Revert on failure
      setSettings((cur) => (cur ? { ...cur, [key]: previous } : cur));
      toast.error(err?.message || "Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />

      {loading || !settings ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {FIELD_META.map((f) => (
            <Toggle
              key={f.key}
              label={f.label}
              on={settings[f.key]}
              saving={savingKey === f.key}
              onToggle={() => toggle(f.key)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6">App version 1.0.0 (demo)</p>
    </div>
  );
}

// The backend serializes each toggle as the string "Active" / "Inactive"
// (not true / false), so a plain !! check would read "Inactive" as true.
// Accept booleans, numbers, and the status words the API actually returns.
function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return ["active", "true", "1", "yes", "on"].includes(s);
  }
  return false;
}

// The schema is Literal["Active", "Inactive"] on every field, so requests must
// send those exact strings — sending a boolean fails with a 422 literal_error.
function toBackendValue(v: boolean): "Active" | "Inactive" {
  return v ? "Active" : "Inactive";
}

function normalize(data: any): SettingsData {
  return {
    customer_id: data?.customer_id,
    push_notifications: toBool(data?.push_notifications),
    online_status: toBool(data?.online_status),
    show_in_search: toBool(data?.show_in_search),
    auto_recharge_coins: toBool(data?.auto_recharge_coins),
  };
}

function Toggle({
  label,
  on,
  saving,
  onToggle,
}: {
  label: string;
  on: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      className={`w-full glass rounded-2xl p-4 flex items-center justify-between ${
        saving ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <span className="text-sm font-medium flex items-center gap-2">
        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
        {label}
      </span>
      <span
        className={`h-6 w-11 rounded-full p-0.5 transition ${
          on ? "bg-gradient-primary" : "bg-muted"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition ${
            on ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}
