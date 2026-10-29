import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface CommunityGuideline {
  id: number;
  details: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

function CommunityPage() {
  const [guidelines, setGuidelines] = useState<CommunityGuideline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/community-guidelines/");
        if (!response.ok) throw new Error("Failed to fetch community guidelines");
        const data = await response.json();
        
        // Filter only active guidelines, just in case
        const activeGuidelines = data.filter((g: CommunityGuideline) => g.status);
        setGuidelines(activeGuidelines);
      } catch (error) {
        console.error("Error fetching community guidelines:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidelines();
  }, []);

  // Find the most recent updated date to display in the header
  const latestDate = guidelines.length > 0 
    ? new Date(
        Math.max(...guidelines.map(g => new Date(g.updated_at).getTime()))
      ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "";

  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">Community Guidelines</h1>
      
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading community guidelines...</p>
      ) : guidelines.length > 0 ? (
        <>
          {latestDate && (
            <p className="text-xs text-muted-foreground mb-6">
              Last updated {latestDate}
            </p>
          )}
          
          <div className="space-y-6 mt-4">
            {guidelines.map((guideline) => (
              <div 
                key={guideline.id} 
                className="text-sm leading-relaxed"
                style={{ whiteSpace: "pre-line" }} // Renders \n as line breaks
              >
                {guideline.details}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          No community guidelines available at the moment.
        </p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/legal/community")({
  component: CommunityPage,
});