import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Star, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/creator/reviews")({ component: Rv });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// Helper to format ISO date string to relative time (e.g., "2d", "5h", "1w")
const formatRelativeTime = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months}mo`;
  if (weeks > 0) return `${weeks}w`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "Just now";
};

function Rv() {
  const user = useAuth((s) => s.user);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.user_id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/reviews/reviewee/${user.user_id}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setReviews(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reviews" subtitle="What customers say" />
      
      {reviews.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No reviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <GlassCard key={r.id}>
              <div className="flex justify-between items-start">
                {/* Using reviewer_name from API response */}
                <p className="font-semibold text-sm">{r.reviewer_name}</p>
                {/* Formatting the submitted_at timestamp */}
                <p className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(r.submitted_at)}
                </p>
              </div>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3.5 w-3.5 ${i < r.star_details ? "fill-warning text-warning" : "text-muted"}`} 
                  />
                ))}
              </div>
              {/* Using description from API response */}
              <p className="text-sm mt-2">{r.description}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}