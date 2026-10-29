import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface TermsData {
  id: number;
  details: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

function TermsPage() {
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/terms-and-conditions/");
        if (!response.ok) throw new Error("Failed to fetch terms and conditions");
        const data = await response.json();
        
        // The API returns an array, so we take the first item
        if (data && data.length > 0) {
          setTerms(data[0]);
        }
      } catch (error) {
        console.error("Error fetching terms and conditions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  // Format the updated_at date to look nice (e.g., "September 11, 2026")
  const formattedDate = terms 
    ? new Date(terms.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "";

  // Strip inline styles from the HTML string so it inherits the app's dark theme
  const cleanHtml = terms?.details
    ? terms.details.replace(/style="[^"]*"/g, '')
    : "";

  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
      
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading terms and conditions...</p>
      ) : terms ? (
        <>
          <p className="text-xs text-muted-foreground mb-6">
            Last updated {formattedDate}
          </p>
          {/* 
            dangerouslySetInnerHTML is used because the API returns an HTML string.
            The inline styles have been stripped via cleanHtml to prevent white backgrounds.
          */}
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          No terms and conditions available at the moment.
        </p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/legal/terms")({
  component: TermsPage,
});