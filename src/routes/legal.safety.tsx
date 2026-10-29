import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface SafetyPolicy {
  id: number;
  details: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

function SafetyPage() {
  const [policies, setPolicies] = useState<SafetyPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/safety-policies/");
        if (!response.ok) throw new Error("Failed to fetch safety policies");
        const data = await response.json();
        
        // Filter only active policies, just in case
        const activePolicies = data.filter((p: SafetyPolicy) => p.status);
        setPolicies(activePolicies);
      } catch (error) {
        console.error("Error fetching safety policies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  // Find the most recent updated date to display in the header
  const latestDate = policies.length > 0 
    ? new Date(
        Math.max(...policies.map(p => new Date(p.updated_at).getTime()))
      ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "";

  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">Safety Policy</h1>
      
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading safety policy...</p>
      ) : policies.length > 0 ? (
        <>
          {latestDate && (
            <p className="text-xs text-muted-foreground mb-6">
              Last updated {latestDate}
            </p>
          )}
          
          <div className="space-y-6 mt-4">
            {policies.map((policy) => (
              <div 
                key={policy.id} 
                className="text-sm leading-relaxed"
                style={{ whiteSpace: "pre-line" }} // Renders \n as line breaks
              >
                {policy.details}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          No safety policy available at the moment.
        </p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/legal/safety")({
  component: SafetyPage,
});