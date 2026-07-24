import { useEffect, useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Search, MoreVertical, Check, X, Loader2, User } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

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
        const response = await fetch(`${API_BASE_URL}/users/?role=${role}`);
        if (!response.ok) throw new Error("Failed to fetch users");
        
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast.error(error.message || "Unable to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role]);

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
              placeholder="Search..." 
              className="glass rounded-full pl-9 pr-4 py-2 text-sm outline-none w-48" 
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
            // Safely build the URL by removing trailing/leading slashes
            const baseUrl = API_BASE_URL.replace(/\/$/, '');
            const photoPath = c.profile_photo ? c.profile_photo.replace(/\\/g, '/').replace(/^\//, '') : '';
            const photoUrl = photoPath ? `${API_BASE_URL.replace(/\/$/, '')}/${photoPath}` : "";

            return (
              <GlassCard key={c.id} className="flex items-center gap-3">
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    className="h-10 w-10 rounded-full object-cover bg-glass" 
                    alt={c.display_name} 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-glass flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email} · {c.joined}</p>
                </div>
                
                <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                  c.is_active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                }`}>
                  {c.is_active ? "Active" : "Banned"}
                </span>

                {showApprove && (
                  <div className="flex gap-1">
                    <button onClick={() => toast.success("Approved")} className="rounded-full bg-success/20 text-success p-1.5"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toast.error("Rejected")} className="rounded-full bg-destructive/20 text-destructive p-1.5"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                
                {showBan && (
                  <button onClick={() => toast.error(`${c.display_name} banned`)} className="rounded-full bg-destructive/20 text-destructive px-2 py-1 text-xs">Ban</button>
                )}
                
                <button className="text-muted-foreground"><MoreVertical className="h-4 w-4" /></button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminPlaceholder({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
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