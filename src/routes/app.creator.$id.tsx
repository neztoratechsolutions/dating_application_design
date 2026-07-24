import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { OnlineDot, GlassCard } from "@/components/ui-kit";
import { MessageCircle, Phone, Video, Heart, UserPlus, ArrowLeft, Star } from "lucide-react";
import { GiftButton } from "@/components/gift-picker";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

// 1. Updated TypeScript interface to match the Creator API response
interface CreatorApiResponse {
  status_code: number;
  message: string;
  data: {
    id: number;
    display_name: string;
    email: string;
    phone: string;
    bio: string | null;
    description: string | null;
    role: string;
    state: {
      id: number;
      name: string;
    } | null;
    profile_photo: string;
    is_online: boolean;
    followers_count: number;
    reviews: {
      average_rating: number;
      total_reviews: number;
    };
    pricing: {
      chat_amount: number;
      voice_call_amount: number;
      video_call_amount: number;
    };
    // FIXED: Gallery is an array of objects, not strings
    gallery: {
      id: number;
      photo: string;
    }[];
  };
}

// Interface for your Follow API response
interface FollowStatusResponse {
  following: boolean;
  follow_id: number | null;
}

// Helper function to construct image URLs using the Vite env variable
const getMediaUrl = (path: string | null | undefined) => {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  if (!path) return "/default-avatar.png";
  
  const cleanPath = path.replace(/\\/g, '/');
  if (cleanPath.startsWith("http")) return cleanPath;
  
  return `${baseUrl}/${cleanPath}`;
};

export const Route = createFileRoute("/app/creator/$id")({
  component: CreatorProfile,
  loader: async ({ params }) => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL || "";
      const response = await fetch(`${baseUrl}/users/${params.id}`);
      
      if (!response.ok) {
        throw notFound();
      }

      const json: CreatorApiResponse = await response.json();
      return { creator: json.data };
    } catch (error) {
      console.error("Failed to fetch creator:", error);
      throw notFound();
    }
  },
  notFoundComponent: () => <div className="p-10 text-center">Creator not found</div>,
});

function CreatorProfile() {
  const { creator } = Route.useLoaderData();
  const navigate = useNavigate();
  
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followId, setFollowId] = useState<number | null>(null);
  
  // NEW: State for Instagram-style popup
  const [showUnfollowPopup, setShowUnfollowPopup] = useState(false);
  
  const user = useAuth((state) => state.user);

  const name = creator.display_name;
  const avatar = getMediaUrl(creator.profile_photo);
  const online = creator.is_online;
  const rating = creator.reviews?.average_rating || 0;
  const followers = creator.followers_count || 0;
  const bio = creator.bio || "No bio available.";
  const chatPrice = creator.pricing?.chat_amount || 0;
  const voicePrice = creator.pricing?.voice_call_amount || 0;
  const videoPrice = creator.pricing?.video_call_amount || 0;
  const stateName = creator.state?.name || "Unknown";
  const tags = ["Creator", creator.role]; 

  const followerId = Number(user?.user_id || user?.id);

  useEffect(() => {
    if (!followerId || followerId === creator.id) return;

    const checkFollowStatus = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL;
        const response = await fetch(
          `${baseUrl}/follow-details/status?follower_id=${followerId}&following_id=${creator.id}`
        );

        if (!response.ok) return;

        const data: FollowStatusResponse = await response.json();

        setFollowed(data.following);
        setFollowId(data.follow_id);
      } catch (err) {
        console.error(err);
      }
    };

    checkFollowStatus();
  }, [creator.id, followerId]);

  // --- Handle Follow API Request ---
  const handleFollowClick = async () => {
    if (followed) return;

    if (!followerId) {
      toast.error("Please login first");
      return;
    }

    setIsFollowLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;

      const response = await fetch(`${baseUrl}/follow-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          following_id: creator.id,
          follower_id: followerId,
          follow_status: "following",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail && data.detail.toLowerCase().includes("already")) {
          setFollowed(true);
          return;
        }
        throw new Error(data.detail || "Failed");
      }

      setFollowed(true);
      setFollowId(data.id); 
      toast.success("Followed successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // --- Handle Unfollow API Request ---
  const handleUnfollow = async () => {
    if (!followId) return;

    setIsFollowLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;

      const response = await fetch(`${baseUrl}/follow-details/${followId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to unfollow");
      }

      setFollowed(false);
      setFollowId(null);
      setShowUnfollowPopup(false); // Close popup on success
      toast.success("Unfollowed successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate({ to: "/app/creators" })} className="rounded-full glass p-2 mb-4">
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-20" />
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-5">
          <div className="relative">
            <img src={avatar} alt={name} className="h-28 w-28 rounded-2xl ring-2 ring-primary object-cover" />
            <span className="absolute bottom-2 right-2"><OnlineDot online={online} /></span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-sm text-muted-foreground">{stateName} · {creator.email}</p>
            <div className="flex justify-center md:justify-start gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" /> {rating}</span>
              <span className="text-muted-foreground">{followers.toLocaleString()} followers</span>
            </div>
            <p className="text-sm mt-3">{bio}</p>
            <div className="flex gap-2 mt-3 justify-center md:justify-start">
              {tags.map((t: string) => <span key={t} className="rounded-full glass px-2.5 py-0.5 text-xs">{t}</span>)}
            </div>
          </div>
        </div>

        {/* --- UPDATED FOLLOW/UNFOLLOW AREA --- */}
        <div className="relative flex gap-2 mt-5">
          <button
            onClick={() => {
              if (followed) {
                // If already following, open the Instagram popup instead of unfollowing immediately
                setShowUnfollowPopup(true);
              } else {
                handleFollowClick();
              }
            }}
            disabled={isFollowLoading}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
              followed
                ? "glass"
                : "bg-gradient-primary shadow-glow"
            }`}
          >
            <UserPlus className="inline h-4 w-4 mr-1" />
            {isFollowLoading ? "Loading..." : followed ? "Following" : "Follow"}
          </button>

          <button onClick={() => { setLiked(!liked); }} className="rounded-xl glass px-4">
            <Heart className={`h-5 w-5 ${liked ? "fill-destructive text-destructive" : ""}`} />
          </button>
          <GiftButton creatorId={creator.id} creatorName={name} className="rounded-xl px-4 py-2.5" />

          {/* --- INSTAGRAM STYLE UNFOLLOW POPUP --- */}
          {showUnfollowPopup && (
            <div 
              className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl z-10"
              onClick={() => setShowUnfollowPopup(false)} // Clicking outside closes popup
            >
              <div 
                className="bg-dark-2 border border-white/10 rounded-2xl w-44 overflow-hidden text-center shadow-xl"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing it
              >
                <div className="p-4 border-b border-white/10">
                  <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover mx-auto mb-2" />
                  <p className="text-sm text-white/90">Unfollow @{name}?</p>
                </div>
                <button 
                  onClick={handleUnfollow}
                  disabled={isFollowLoading}
                  className="w-full py-3 text-red-500 font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  Unfollow
                </button>
                <button 
                  onClick={() => setShowUnfollowPopup(false)}
                  className="w-full py-3 text-white/80 text-sm hover:bg-white/5 transition-colors border-t border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <Link to="/app/chat/$id" params={{ id: String(creator.id) }}>
          <GlassCard hover className="text-center">
            <MessageCircle className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium">Chat</p>
            <p className="text-[10px] text-muted-foreground">{chatPrice} coins/min</p>
          </GlassCard>
        </Link>
        <Link to="/app/call/voice/$id" params={{ id: String(creator.id) }}>
          <GlassCard hover className="text-center">
            <Phone className="h-6 w-6 mx-auto text-success mb-1" />
            <p className="text-xs font-medium">Voice</p>
            <p className="text-[10px] text-muted-foreground">{voicePrice} coins/min</p>
          </GlassCard>
        </Link>
        <Link to="/app/call/video/$id" params={{ id: String(creator.id) }}>
          <GlassCard hover className="text-center">
            <Video className="h-6 w-6 mx-auto text-accent mb-1" />
            <p className="text-xs font-medium">Video</p>
            <p className="text-[10px] text-muted-foreground">{videoPrice} coins/min</p>
          </GlassCard>
        </Link>
      </div>

      <h3 className="font-semibold mt-6 mb-3">Gallery</h3>
      <div className="grid grid-cols-3 gap-2">
        {/* FIXED: Using img.photo instead of img, and img.id for the key */}
        {creator.gallery && creator.gallery.length > 0 ? (
          creator.gallery.map((img, i) => (
            <img key={img.id || i} src={getMediaUrl(img.photo)} alt={`Gallery ${i}`} className="aspect-square rounded-xl object-cover" />
          ))
        ) : (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gradient-accent opacity-60" />
          ))
        )}
      </div>
    </div>
  );
}