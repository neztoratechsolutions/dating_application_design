import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface AboutUsItem {
  id: number;
  name: string;
  details: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

function AboutPage() {
  const [aboutItems, setAboutItems] = useState<AboutUsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/about-us/");
        if (!response.ok) throw new Error("Failed to fetch about us data");
        const data = await response.json();
        
        // Filter only active items, just in case
        const activeItems = data.filter((item: AboutUsItem) => item.status);
        setAboutItems(activeItems);
      } catch (error) {
        console.error("Error fetching about us data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutUs();
  }, []);

  // Find the most recent updated date to display in the header
  const latestDate = aboutItems.length > 0 
    ? new Date(
        Math.max(...aboutItems.map(item => new Date(item.updated_at).getTime()))
      ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "";

  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-2">About Us</h1>
      
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : aboutItems.length > 0 ? (
        <>
          {latestDate && (
            <p className="text-xs text-muted-foreground mb-6">
              Last updated {latestDate}
            </p>
          )}
          
          <div className="space-y-8 mt-6">
            {aboutItems.map((item) => (
              <div key={item.id}>
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  {item.name}
                </h2>
                <p 
                  className="text-sm leading-relaxed text-muted-foreground"
                  style={{ whiteSpace: "pre-line" }} // Renders \n as line breaks
                >
                  {item.details}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          No content available at the moment.
        </p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/legal/about")({
  component: AboutPage,
});