import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Heart, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";

// Updated interface to match your exact API response
interface FavoriteItem {
  id: number;
  customer_id: number;
  creator_id: number;
  creator_name: string;
  profile_image: string | null;
}

export const Route = createFileRoute("/app/favorites")({ component: Favorites });

function Favorites() {
  const [favs, setFavs] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const user = useAuth((state) => state.user);
  const customerId = Number(user?.user_id || user?.id);

  // Helper to construct full image URLs from backend paths
  const getMediaUrl = (path: string | null | undefined) => {
    const baseUrl = import.meta.env.VITE_BASE_URL || "";
    if (!path) return "/default-avatar.png";
    const cleanPath = path.replace(/\\/g, '/');
    if (cleanPath.startsWith("http")) return cleanPath;
    return `${baseUrl}/${cleanPath}`;
  };

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL || "";
        const response = await fetch(`${baseUrl}/favorites/${customerId}`);
        
        if (!response.ok) throw new Error("Failed to fetch favorites");
        
        const data = await response.json();
        setFavs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [customerId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Favorite Creators" subtitle="Loading..." />
        <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
          Loading favorites...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Favorite Creators" subtitle={`${favs.length} creators saved`} />
      
      {favs.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
          <Heart className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No favorite creators yet. Tap the heart on a creator's profile to save them here.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {favs.map((fav) => (
            <GlassCard key={fav.id} className="text-center relative">
              {/* Dynamically render the profile image returned by the API */}
              <img 
                src={getMediaUrl(fav.profile_image)} 
                className="h-20 w-20 rounded-full mx-auto mb-2 object-cover bg-muted/30" 
                alt={fav.creator_name} 
              />
              <p className="font-semibold text-sm truncate">{fav.creator_name}</p>
              <p className="text-[10px] text-muted-foreground">Creator</p>
              
              <div className="flex gap-1 mt-3">
                <Link 
                  to="/app/creator/$id" 
                  params={{ id: String(fav.creator_id) }} 
                  className="flex-1 rounded-full glass py-1.5 text-xs"
                >
                  View
                </Link>
                <Link 
                  to="/app/chat/$id" 
                  params={{ id: String(fav.creator_id) }} 
                  className="flex-1 rounded-full bg-gradient-primary py-1.5 text-xs shadow-glow flex items-center justify-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />Chat
                </Link>
              </div>
              
              {/* Heart is red and filled since they are already favorites */}
              <Heart className="h-4 w-4 text-destructive fill-destructive absolute top-3 right-3" />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}