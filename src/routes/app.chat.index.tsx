import { createFileRoute, Link } from "@tanstack/react-router";
import { OnlineDot, PageHeader, EmptyState } from "@/components/ui-kit";
import { MessageCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app/chat/")({
  component: ChatInbox,
});

interface User {
  id: number;
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
  bio?: string | null;
  description?: string | null;
  profile_photo?: string | null;
  role?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
}

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ?? ""
).replace(/\/+$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token")
  );
}

function getPhotoUrl(photo?: string | null): string | undefined {
  if (!photo?.trim()) return undefined;

  const normalizedPhoto = photo.trim().replace(/\\/g, "/");

  // Keep absolute image URLs unchanged.
  if (/^https?:\/\//i.test(normalizedPhoto)) {
    return normalizedPhoto;
  }

  // Support paths such as /uploads/photo.png.
  const path = normalizedPhoto.startsWith("/")
    ? normalizedPhoto
    : `/${normalizedPhoto}`;

  if (!API_BASE_URL) return undefined;

  return `${API_BASE_URL}${path}`;
}

function getInitials(name?: string | null): string {
  const safeName = name?.trim();

  if (!safeName) return "C";

  return safeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ChatInbox() {
  const [creators, setCreators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCreators = async (signal?: AbortSignal) => {
    if (!API_BASE_URL) {
      setError(
        "API URL is missing. Please configure VITE_BASE_URL in your frontend .env file."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load users. Server returned ${response.status}.`
        );
      }

      const result: unknown = await response.json();

      // Supports a plain array or common paginated response formats.
      let users: User[] = [];

      if (Array.isArray(result)) {
        users = result as User[];
      } else if (
        result &&
        typeof result === "object" &&
        "users" in result &&
        Array.isArray(result.users)
      ) {
        users = result.users as User[];
      } else if (
        result &&
        typeof result === "object" &&
        "items" in result &&
        Array.isArray(result.items)
      ) {
        users = result.items as User[];
      } else if (
        result &&
        typeof result === "object" &&
        "data" in result &&
        Array.isArray(result.data)
      ) {
        users = result.data as User[];
      } else {
        throw new Error(
          "Unexpected API response. Expected a list of users."
        );
      }

      const activeCreators = users.filter(
        (user) =>
          String(user.role ?? "").toLowerCase() === "creator" &&
          user.is_active !== false
      );

      setCreators(activeCreators);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Failed to fetch creators:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading creators."
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    void fetchCreators(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Messages"
          subtitle="Loading creators..."
        />

        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Fetching creators...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Messages"
          subtitle="Unable to load conversations"
        />

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-sm text-red-500">{error}</p>

          <button
            type="button"
            onClick={() => void fetchCreators()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition hover:bg-glass-border"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Messages"
          subtitle="0 creators available"
        />

        <EmptyState
          icon={MessageCircle}
          title="No creators found"
          desc="Active creators will appear here when they are available."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages"
        subtitle={`${creators.length} creators`}
      />

      <div className="space-y-2">
        {creators.map((creator) => {
          const name =
            creator.display_name?.trim() || "Creator";

          const photoUrl = getPhotoUrl(creator.profile_photo);

          return (
            <Link
              key={creator.id}
              to="/app/chat/$id"
              params={{ id: String(creator.id) }}
              className="glass flex items-center gap-3 rounded-2xl p-3 transition hover:bg-glass-border"
            >
              <div className="relative h-12 w-12 shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-glass-border text-sm font-semibold">
                    {getInitials(name)}
                  </div>
                )}

                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineDot online={false} />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {name}
                  </h3>

                  {creator.is_verified && (
                    <span
                      className="text-xs text-blue-500"
                      title="Verified creator"
                    >
                      ✓
                    </span>
                  )}
                </div>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {creator.bio?.trim() ||
                    creator.description?.trim() ||
                    "Start a conversation"}
                </p>
              </div>

              <MessageCircle
                size={18}
                className="shrink-0 text-muted-foreground"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
