import { useCallback, useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    ""
).replace(/\/+$/, "");

export const Route = createFileRoute("/creator/chat")({
  component: CChat,
});

type Chat = {
  chat_id: number;
  user_one_id: number;
  user_two_id: number;
  other_user_id?: number;
  other_user_email?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
  status?: boolean;
};

type Customer = {
  id?: number;
  user_id?: number;
  name?: string | null;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
  profile_image?: string | null;
  profile_picture?: string | null;
};

function CChat() {
  const user = useAuth((state) => state.user);
  const currentUserId = Number(user?.id ?? user?.user_id);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // The child route must be rendered when the URL is /creator/chat/:id.
  const isChatDetailPage = /^\/creator\/chat\/[^/]+\/?$/.test(pathname);

  const [chats, setChats] = useState<Chat[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadChats = useCallback(async () => {
    if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
      setError("Your user ID is missing. Please log in again.");
      setLoading(false);
      return;
    }

    if (!API_BASE_URL) {
      setError(
        "Backend URL is missing. Configure VITE_BASE_URL in your .env file."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token") ??
        localStorage.getItem("access_token");

      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const response = await fetch(
        `${API_BASE_URL}/chats/?user_id=${encodeURIComponent(
          String(currentUserId)
        )}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load conversations: HTTP ${response.status} - ${await response.text()}`
        );
      }

      const data = await response.json();

      const chatList: Chat[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.chats)
          ? data.chats
          : [];

      setChats(
        chatList.filter(
          (chat) =>
            chat.status === undefined ||
            chat.status === true
        )
      );

      // Customer profiles are optional; conversations still open if this
      // request fails.
      try {
        const usersResponse = await fetch(`${API_BASE_URL}/users/`, {
          headers,
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();

          setCustomers(
            Array.isArray(usersData)
              ? usersData
              : Array.isArray(usersData?.users)
                ? usersData.users
                : []
          );
        }
      } catch (profileError) {
        console.warn("Could not load customer profiles:", profileError);
      }
    } catch (err) {
      console.error("Failed to load inbox:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load conversations."
      );
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    // The inbox doesn't need to reload just to display its child route.
    if (!isChatDetailPage) {
      void loadChats();
    }
  }, [loadChats, isChatDetailPage]);

  function getCustomer(chat: Chat): Customer {
    const otherUserId =
      chat.other_user_id ??
      (Number(chat.user_one_id) === currentUserId
        ? chat.user_two_id
        : chat.user_one_id);

    const customer = customers.find(
      (item) =>
        Number(item.id ?? item.user_id) === Number(otherUserId)
    );

    return {
      ...customer,
      id: Number(otherUserId),
      email: customer?.email || chat.other_user_email || null,
    };
  }

  function getCustomerName(customer: Customer) {
    return (
      customer.full_name ||
      customer.name ||
      customer.username ||
      customer.email ||
      `Customer ${customer.id}`
    );
  }

  function getAvatar(customer: Customer) {
    return (
      customer.avatar ||
      customer.profile_image ||
      customer.profile_picture ||
      ""
    );
  }

  function formatTime(value?: string | null) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Critical: without Outlet, the URL changes but the child chat page
  // cannot be displayed.
  if (isChatDetailPage) {
    return <Outlet />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inbox"
        subtitle="Customer conversations"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {chats.length}{" "}
          {chats.length === 1 ? "conversation" : "conversations"}
        </p>

        <button
          type="button"
          onClick={() => void loadChats()}
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-sm transition hover:bg-glass-border disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Loading conversations...
        </div>
      )}

      {!loading && error && (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => void loadChats()}
            className="mt-3 rounded-xl border px-4 py-2 text-sm hover:bg-glass-border"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && chats.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="font-semibold">No conversations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer conversations will appear here.
          </p>
        </div>
      )}

      {!loading && !error && chats.length > 0 && (
        <div className="space-y-2">
          {chats.map((chat) => {
            const customer = getCustomer(chat);
            const name = getCustomerName(customer);
            const avatar = getAvatar(customer);

            const otherUserId = customer.id;
            const unreadCount = Math.max(
              0,
              Number(chat.unread_count) || 0
            );

            if (!otherUserId || otherUserId <= 0) {
              return null;
            }

            return (
              <Link
                key={chat.chat_id}
                to="/creator/chat/$id"
                params={{ id: String(otherUserId) }}
                className="glass flex items-center gap-3 rounded-2xl p-3 transition hover:bg-glass-border"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-glass-border text-sm font-semibold">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {name}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatTime(chat.last_message_at)}
                    </span>
                  </div>

                  <p className="truncate text-xs text-muted-foreground">
                    {chat.last_message || "No messages yet"}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    {customer.email || `Customer ID: ${otherUserId}`}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}