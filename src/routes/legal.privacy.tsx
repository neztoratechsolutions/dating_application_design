import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/legal/privacy")({ component: PrivacyPolicy });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

function PrivacyPolicy() {
  const [policyText, setPolicyText] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/privacy-policy/`);
        if (response.ok) {
          const data = await response.json();
          
          // API returns an array, so we take the first item
          if (Array.isArray(data) && data.length > 0) {
            const policyData = data[0];
            setPolicyText(policyData.details || "");
            
            // Format the date if it exists
            if (policyData.updated_at) {
              const date = new Date(policyData.updated_at);
              setLastUpdated(date.toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              }));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch privacy policy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {lastUpdated ? `Last updated ${lastUpdated}` : ""}
      </p>
      
      {policyText ? (
        // Splitting by new lines in case the backend text has multiple paragraphs
        policyText.split("\n").map((paragraph, index) => (
          paragraph.trim() && (
            <p key={index} className="text-sm leading-relaxed mb-4">
              {paragraph}
            </p>
          )
        ))
      ) : (
        <p className="text-sm leading-relaxed mt-4 text-muted-foreground">
          No policy details available right now.
        </p>
      )}
    </div>
  );
}