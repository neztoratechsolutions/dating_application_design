import { useEffect, useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Search, MoreVertical, Check, X, Loader2, User, Star } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// Helper to normalize photo path coming from backend (Windows backslashes etc.)
function buildPhotoUrl(photo?: string): string {
  if (!photo) return "";
  const normalized = photo.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL.replace(/\/+$/, "")}/${normalized}`;
}

export function AdminUserTable({
  title,
  subtitle,
  showApprove = false,
  showBan = false,
  role = "creator",
}: {
  title: string;
  subtitle?: string;
  showApprove?: boolean;
  showBan?: boolean;
  role?: string;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/users/filter?role=${role}`);
        if (!response.ok) throw new Error("Failed to fetch users");

        const json = await response.json();
        // Backend shape: { status_code, message, count, data: [...] }
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setUsers(list);
      } catch (error: any) {
        toast.error(error.message || "Unable to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role]);

  const filteredUsers = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase())
  );
const handleBan = async (user: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${user.id}/ban`, { method: "POST" });
    if (!res.ok) throw new Error("Ban failed");
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success(`${user.display_name} banned`);
  } catch (e: any) {
    toast.error(e.message || "Failed to ban user");
  }
};

  const handleApprove = (user: any) => toast.success(`${user.display_name} approved`);
  const handleReject = (user: any) => toast.error(`${user.display_name} rejected`);

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className="glass rounded-full pl-9 pr-4 py-2 text-sm outline-none w-56"
            />
          </div>
        }
      />

      {loading ? (
        <GlassCard className="flex justify-center items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : filteredUsers.length === 0 ? (
        <GlassCard className="text-center py-16">
          <p className="text-muted-foreground text-sm">No {role}s found</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((c) => {
            const photoUrl = buildPhotoUrl(c.profile_photo);
            const isOnline = c.is_online ?? c.is_active ?? false;
            const rating = c.reviews?.average_rating;
            const totalReviews = c.reviews?.total_reviews ?? 0;
            const chatAmount = c.pricing?.chat_amount;
            const subtitleParts = [c.email, c.phone, c.joined].filter(Boolean);

            return (
              <GlassCard key={c.id} className="flex items-center gap-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    className="h-10 w-10 rounded-full object-cover bg-glass"
                    alt={c.display_name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-glass flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{c.display_name}</p>
                    {typeof rating === "number" && rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500">
                        <Star className="h-3 w-3 fill-amber-500" />
                        {rating.toFixed(1)} ({totalReviews})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {subtitleParts.join(" · ")}
                  </p>
                </div>

                {typeof chatAmount === "number" && (
                  <span className="hidden sm:inline-block text-[10px] text-muted-foreground">
                    ₹{chatAmount}/chat
                  </span>
                )}

                <span
                  className={`text-[10px] rounded-full px-2 py-0.5 ${
                    isOnline ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>

                {showApprove && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleApprove(c)}
                      className="rounded-full bg-success/20 text-success p-1.5"
                      title="Approve"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleReject(c)}
                      className="rounded-full bg-destructive/20 text-destructive p-1.5"
                      title="Reject"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {showBan && (
                  <button
                    onClick={() => handleBan(c)}
                    className="rounded-full bg-destructive/20 text-destructive px-2 py-1 text-xs"
                  >
                    Ban
                  </button>
                )}

                <button className="text-muted-foreground" title="More">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminPlaceholder({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      {children || (
        <GlassCard className="text-center py-16">
          <p className="text-muted-foreground text-sm">Module ready · connect backend to populate</p>
        </GlassCard>
      )}
    </div>
  );
}