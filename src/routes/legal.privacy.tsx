import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

// Interface matching your API response
interface PrivacyPolicy {
  id: number;
  details: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

function PrivacyPage() {
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/privacy-policy/");
        if (!response.ok) throw new Error("Failed to fetch privacy policy");
        const data = await response.json();
        
        // The API returns an array, so we take the first item
        if (data && data.length > 0) {
          setPolicy(data[0]);
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Format the updated_at date to look nice (e.g., "September 11, 2026")
  const formattedDate = policy 
    ? new Date(policy.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "";

  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading privacy policy...</p>
      ) : policy ? (
        <>
          <p className="text-xs text-muted-foreground mb-6">
            Last updated {formattedDate}
          </p>
          {/* 
            Using whiteSpace: "pre-line" so that the \n characters 
            from the API string are rendered as line breaks.
          */}
          <div 
            className="text-sm leading-relaxed"
            style={{ whiteSpace: "pre-line" }}
          >
            {policy.details}
          </div>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          No privacy policy available at the moment.
        </p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/legal/privacy")({
  component: PrivacyPage,
});